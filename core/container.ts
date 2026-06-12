/**
 * 依赖注入容器
 * 管理核心模块的实例创建和依赖关系
 */

import { ModelManager } from './model-manager';
import { BookmarkIndexer } from './bookmark-indexer';
import { SearchEngine } from './search-engine';
import { SyncManager } from './sync-manager';

export interface Container {
  modelManager: ModelManager;
  bookmarkIndexer: BookmarkIndexer;
  searchEngine: SearchEngine;
  syncManager: SyncManager;
}

let container: Container | null = null;

/**
 * 初始化容器（在 background.ts 中调用）
 */
export function createContainer(): Container {
  if (container) {
    return container;
  }

  const modelManager = new ModelManager();
  const bookmarkIndexer = new BookmarkIndexer(modelManager);
  const searchEngine = new SearchEngine(modelManager, bookmarkIndexer);
  const syncManager = new SyncManager(bookmarkIndexer);

  container = {
    modelManager,
    bookmarkIndexer,
    searchEngine,
    syncManager,
  };

  return container;
}

/**
 * 获取容器实例
 */
export function getContainer(): Container {
  if (!container) {
    throw new Error('Container not initialized. Call createContainer() first.');
  }
  return container;
}

/**
 * 重置容器（用于测试）
 */
export function resetContainer(): void {
  container = null;
}
