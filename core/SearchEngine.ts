/**
 * 搜索模块 - 混合搜索（向量 + 全文）+ 重排序
 */

import ModelManager from './ModelManager';
import BookmarkIndexer, { type BookmarkDoc } from './BookmarkIndexer';
import type { SearchResult } from '../types';
import { getBookmarkPath } from './utils';

type SearchHit = { id: string; score: number; document: BookmarkDoc };

/** 检测查询类型 */
function detectQueryType(query: string): 'keyword' | 'semantic' | 'mixed' {
  const trimmed = query.trim();
  const wordCount = trimmed.split(/\s+/).length;
  const hasPunctuation = /[，。！？,\.!\?]/.test(trimmed);

  if (hasPunctuation || wordCount >= 4) return 'semantic';
  if (wordCount <= 2) return 'keyword';
  return 'mixed';
}

/** 后处理重排序 */
function rerank(hits: SearchHit[], query: string): SearchHit[] {
  const queryLower = query.toLowerCase().trim();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 0);
  const now = Date.now();
  const ONE_DAY = 86400000;

  const reranked = hits.map((hit) => {
    const doc = hit.document;
    const titleLower = doc.title.toLowerCase().trim();
    let boost = 0;

    // 1. 标题完全相同: +0.30
    if (titleLower === queryLower) {
      boost += 0.30;
    }
    // 2. 标题以查询开头: +0.20
    else if (titleLower.startsWith(queryLower)) {
      boost += 0.20;
    }
    // 3. 标题包含完整查询: +0.15
    else if (titleLower.includes(queryLower)) {
      boost += 0.15;
    }

    // 4. 所有查询词都在标题中出现: +0.10
    if (queryTerms.every((t) => titleLower.includes(t))) {
      boost += 0.10;
    }

    // 5. 域名包含查询词: +0.08
    try {
      const domain = new URL(doc.url).hostname.replace(/^www\./, '').toLowerCase();
      if (queryTerms.some((t) => domain.includes(t))) {
        boost += 0.08;
      }
    } catch { /* ignore invalid URLs */ }

    // 6. 最近 7 天使用过: +0.05
    if (doc.dateLastUsed && (now - doc.dateLastUsed) < 7 * ONE_DAY) {
      boost += 0.05;
    }
    // 7. 最近 30 天使用过: +0.02
    else if (doc.dateLastUsed && (now - doc.dateLastUsed) < 30 * ONE_DAY) {
      boost += 0.02;
    }

    return { ...hit, score: hit.score + boost };
  });

  return reranked.sort((a, b) => b.score - a.score);
}

class SearchEngine {
  private static instance: SearchEngine;

  private constructor() { }

  static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  async search(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const { limit = 20, threshold = 0.3 } = options;

    if (!query || query.trim() === '') {
      return [];
    }

    try {
      const modelManager = ModelManager.getInstance();
      const queryEmbedding = await modelManager.generateEmbedding(query);

      const indexer = BookmarkIndexer.getInstance();

      // 检测查询类型，动态调整混合搜索权重
      const queryType = detectQueryType(query);
      const weights = {
        keyword: { textWeight: 0.75, vectorWeight: 0.25 },
        semantic: { textWeight: 0.35, vectorWeight: 0.65 },
        mixed:    { textWeight: 0.60, vectorWeight: 0.40 },
      }[queryType];

      // 取 50 条候选，给重排序留空间
      let hits: SearchHit[];
      try {
        hits = await indexer.searchHybrid(query, queryEmbedding, {
          limit: 50,
          threshold,
          ...weights,
        });
      } catch {
        // 混合搜索回退到纯向量搜索
        hits = await indexer.searchByVector(queryEmbedding, { limit: 50, threshold });
      }

      // 重排序并截取
      const reranked = rerank(hits, query);
      const topHits = reranked.slice(0, limit);

      return Promise.all(
        topHits.map(async (hit) => ({
          id: hit.id,
          title: hit.document.title,
          url: hit.document.url,
          similarity: hit.score,
          path: await getBookmarkPath(hit.id),
        }))
      );
    } catch (error) {
      console.error('[SearchEngine] 搜索失败:', error);
      throw error;
    }
  }
}

export default SearchEngine;