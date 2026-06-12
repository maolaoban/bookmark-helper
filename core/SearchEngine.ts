/**
 * 搜索模块 - 向量语义搜索
 */

import ModelManager from './ModelManager';
import BookmarkIndexer from './BookmarkIndexer';
import type { SearchResult } from '../types';
import { getBookmarkPath } from './utils';

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
      const hits = await indexer.searchByVector(queryEmbedding, { limit, threshold });

      return Promise.all(
        hits.map(async (hit) => ({
          id: hit.id,
          title: hit.document.title,
          url: hit.document.url,
          similarity: hit.score,
          path: await getBookmarkPath(hit.id) // 获取书签路径
        }))
      );
    } catch (error) {
      console.error('[SearchEngine] 搜索失败:', error);
      throw error;
    }
  }
}

export default SearchEngine;
