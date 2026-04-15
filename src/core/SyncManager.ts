/**
 * 同步模块
 * 监听书签变化并增量更新索引
 */

import BookmarkIndexer from './BookmarkIndexer';

class SyncManager {
  private static instance: SyncManager;
  private isListening = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingChanges: number = 0;
  private readonly DEBOUNCE_DELAY = 2000; // 2秒防抖
  private readonly BATCH_THRESHOLD = 10; // 批量更改阈值

  private constructor() {}

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * 开始监听书签变化
   */
  startListening(): void {
    if (this.isListening) {
      return;
    }

    // 使用 try-catch 来捕获测试环境中的不支持错误
    try {
      this.setupListeners();
      this.isListening = true;
      console.log('[SyncManager] 开始监听书签变化');
    } catch (error) {
      console.log('[SyncManager] 非浏览器环境，跳过监听:', error);
    }
  }

  /**
   * 设置监听器 - 单独封装以便 try-catch
   */
  private setupListeners(): void {
    const indexer = BookmarkIndexer.getInstance();

    // 监听书签创建
    chrome.bookmarks.onCreated.addListener((id, bookmark) => {
      console.log('[SyncManager] 书签创建:', bookmark.title);
      this.handleChange('create', bookmark);
    });

    // 监听书签删除
    chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
      console.log('[SyncManager] 书签删除:', id);
      this.handleChange('remove', null, removeInfo);
    });

    // 监听书签更新
    chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
      console.log('[SyncManager] 书签更新:', id);
      this.handleChange('update', changeInfo as unknown as chrome.bookmarks.BookmarkTreeNode);
    });

    // 监听书签移动
    chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
      console.log('[SyncManager] 书签移动:', id);
      this.handleChange('move', moveInfo as unknown as chrome.bookmarks.BookmarkTreeNode);
    });

    // 监听批量导入
    chrome.bookmarks.onImportBegan.addListener(() => {
      console.log('[SyncManager] 导入开始');
      this.pendingChanges = 0;
    });

    chrome.bookmarks.onImportEnded.addListener(() => {
      console.log('[SyncManager] 导入结束，触发全量重建');
      this.triggerRebuild();
    });
  }

  /**
   * 停止监听
   */
  stopListening(): void {
    this.isListening = false;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    console.log('[SyncManager] 停止监听');
  }

  /**
   * 处理书签变化
   */
  private async handleChange(
    action: 'create' | 'remove' | 'update' | 'move',
    bookmark: chrome.bookmarks.BookmarkTreeNode | null,
    removeInfo?: chrome.bookmarks.RemoveInfo
  ): Promise<void> {
    this.pendingChanges++;

    // 清除之前的定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 如果变化数量超过阈值，触发全量重建
    if (this.pendingChanges >= this.BATCH_THRESHOLD) {
      console.log('[SyncManager] 批量变化超过阈值，触发全量重建');
      this.pendingChanges = 0;
      this.triggerRebuild();
      return;
    }

    // 否则防抖处理
    this.debounceTimer = setTimeout(async () => {
      try {
        if (action === 'remove') {
          // 删除操作需要通过全量重建来处理（简化实现）
          this.triggerRebuild();
        } else if (bookmark) {
          const indexer = BookmarkIndexer.getInstance();
          await indexer.updateIndex(bookmark, action);
        }
      } catch (error) {
        console.error('[SyncManager] 处理变化失败:', error);
      } finally {
        this.pendingChanges = 0;
      }
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * 触发全量重建
   */
  private async triggerRebuild(): Promise<void> {
    try {
      const indexer = BookmarkIndexer.getInstance();
      await indexer.buildIndex();
      console.log('[SyncManager] 索引重建完成');
    } catch (error) {
      console.error('[SyncManager] 索引重建失败:', error);
    }
  }
}

export default SyncManager;