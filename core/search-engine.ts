/**
 * 搜索模块 - 混合搜索（向量 + 全文）+ 重排序
 */

import { ModelManager } from './model-manager';
import { BookmarkIndexer, type BookmarkDoc } from './bookmark-indexer';
import type { SearchResult } from '../types';
import { getBookmarkPath } from './utils';
import { withRetry } from './error-handler';

type SearchHit = { id: string; score: number; document: BookmarkDoc };

/** 检测查询类型 */
export function detectQueryType(query: string): 'keyword' | 'semantic' | 'mixed' {
  const trimmed = query.trim();
  const wordCount = trimmed.split(/\s+/).length;
  const hasPunctuation = /[，。！？,.!?]/.test(trimmed);

  if (hasPunctuation || wordCount >= 4) return 'semantic';
  if (wordCount <= 2) return 'keyword';
  return 'mixed';
}

/** 后处理重排序 */
export function rerank(hits: SearchHit[], query: string): SearchHit[] {
  const queryLower = query.toLowerCase().trim();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 0);
  const now = Date.now();
  const ONE_DAY = 86400000;

  const reranked = hits.map((hit) => {
    const doc = hit.document;
    const titleLower = (doc.title || '').toLowerCase().trim();
    let boost = 0;

    if (titleLower === queryLower) {
      boost += 0.30;
    } else if (titleLower.startsWith(queryLower)) {
      boost += 0.20;
    } else if (titleLower.includes(queryLower)) {
      boost += 0.15;
    }

    if (queryTerms.every((t) => titleLower.includes(t))) {
      boost += 0.10;
    }

    try {
      const domain = new URL(doc.url).hostname.replace(/^www\./, '').toLowerCase();
      if (queryTerms.some((t) => domain.includes(t))) {
        boost += 0.08;
      }
    } catch {
      /* ignore invalid URLs */
    }

    if (doc.dateLastUsed && now - doc.dateLastUsed < 7 * ONE_DAY) {
      boost += 0.05;
    } else if (doc.dateLastUsed && now - doc.dateLastUsed < 30 * ONE_DAY) {
      boost += 0.02;
    }

    return { ...hit, score: hit.score + boost };
  });

  return reranked.sort((a, b) => b.score - a.score);
}

export class SearchEngine {
  constructor(
    private modelManager: ModelManager,
    private bookmarkIndexer: BookmarkIndexer,
  ) {}

  async search(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
    } = {},
  ): Promise<SearchResult[]> {
    const { limit = 20, threshold = 0.3 } = options;

    if (!query || query.trim() === '') {
      return [];
    }

    try {
      const queryEmbedding = await withRetry(() => this.modelManager.generateEmbedding(query));

      const queryType = detectQueryType(query);
      const weights = {
        keyword: { textWeight: 0.75, vectorWeight: 0.25 },
        semantic: { textWeight: 0.35, vectorWeight: 0.65 },
        mixed: { textWeight: 0.60, vectorWeight: 0.40 },
      }[queryType];

      let hits: SearchHit[];
      try {
        hits = await this.bookmarkIndexer.searchHybrid(query, queryEmbedding, {
          limit: 50,
          threshold,
          ...weights,
        });
      } catch {
        hits = await this.bookmarkIndexer.searchByVector(queryEmbedding, {
          limit: 50,
          threshold,
        });
      }

      const reranked = rerank(hits, query);
      const topHits = reranked.slice(0, limit);

      return Promise.all(
        topHits.map(async (hit) => ({
          id: hit.id,
          title: hit.document.title,
          url: hit.document.url,
          similarity: hit.score,
          path: await getBookmarkPath(hit.id),
        })),
      );
    } catch (error) {
      console.error('[SearchEngine] 搜索失败:', error);
      throw error;
    }
  }
}

export default SearchEngine;
