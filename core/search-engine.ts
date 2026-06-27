/**
 * 搜索模块 - 混合搜索（向量 + 全文）
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
  const chineseChars = (trimmed.match(/[\u4e00-\u9fff]/g) || []).length;
  const totalChars = trimmed.replace(/\s/g, '').length;
  const hasChinese = chineseChars > 0;

  // 纯中文或中英文混合
  if (hasChinese) {
    const chineseRatio = chineseChars / totalChars;
    // 纯中文短词（2-4个汉字）
    if (chineseRatio > 0.8 && chineseChars <= 4) return 'keyword';
    // 纯中文长句（5+个汉字）
    if (chineseRatio > 0.8 && chineseChars >= 5) return 'semantic';
    // 中英文混合
    return 'mixed';
  }

  // 英文
  if (wordCount <= 1) return 'keyword';
  if (wordCount >= 5) return 'semantic';
  return 'mixed';
}

export class SearchEngine {
  constructor(
    private modelManager: ModelManager,
    private bookmarkIndexer: BookmarkIndexer,
  ) { }

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
        keyword: { textWeight: 0.65, vectorWeight: 0.35 },
        semantic: { textWeight: 0.30, vectorWeight: 0.70 },
        mixed: { textWeight: 0.50, vectorWeight: 0.50 },
      }[queryType];

      let hits: SearchHit[];
      try {
        hits = await this.bookmarkIndexer.searchHybrid(query, queryEmbedding, {
          limit,
          threshold,
          ...weights,
        });
      } catch {
        hits = await this.bookmarkIndexer.searchByVector(queryEmbedding, {
          limit,
          threshold,
        });
      }

      console.log('[SearchEngine] 搜索结果:', hits, query);

      return Promise.all(
        hits.map(async (hit) => ({
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
