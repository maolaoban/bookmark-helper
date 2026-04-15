/**
 * 搜索模块
 * 负责接收用户查询，生成向量，执行搜索
 */

import ModelManager from './ModelManager';
import BookmarkIndexer from './BookmarkIndexer';
import type { SearchResult } from '../types';

class SearchEngine {
  private static instance: SearchEngine;

  private constructor() {}

  static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  /**
   * 搜索书签
   * @param query - 用户查询文本
   * @param options - 搜索选项
   */
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

    const indexer = BookmarkIndexer.getInstance();
    const docs = indexer.getAllDocs();

    if (docs.length === 0) {
      console.warn('[SearchEngine] 索引为空');
      return [];
    }

    try {
      // 生成查询向量
      const modelManager = ModelManager.getInstance();
      const queryEmbedding = await modelManager.generateEmbedding(query);

      // 计算每个文档的相似度
      const results: SearchResult[] = [];

      for (const doc of docs) {
        // 计算余弦相似度
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);

        // 过滤低于阈值的結果
        if (similarity >= threshold) {
          results.push({
            id: doc.id,
            title: doc.title,
            url: doc.url,
            similarity,
          });
        }
      }

      // 按相似度排序并返回 top N
      results.sort((a, b) => b.similarity - a.similarity);
      return results.slice(0, limit);
    } catch (error) {
      console.error('[SearchEngine] 搜索失败:', error);
      throw error;
    }
  }

  /**
   * 余弦相似度计算
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export default SearchEngine;