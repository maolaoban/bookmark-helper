/**
 * 同步模块
 * 监听书签变化并增量更新索引
 */

import { BookmarkIndexer } from './bookmark-indexer';

export class SyncManager {
  private isListening = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingChanges = 0;
  private readonly DEBOUNCE_DELAY = 2000;
  private readonly BATCH_THRESHOLD = 10;

  constructor(private bookmarkIndexer: BookmarkIndexer) {}

  startListening(): void {
    if (this.isListening) {
      return;
    }

    try {
      this.setupListeners();
      this.isListening = true;
      console.log('[SyncManager] 开始监听书签变化');
    } catch (error) {
      console.log('[SyncManager] 非浏览器环境，跳过监听:', error);
    }
  }

  private setupListeners(): void {
    chrome.bookmarks.onCreated.addListener((_id, bookmark) => {
      console.log('[SyncManager] 书签创建:', bookmark.title);
      this.handleChange('create', bookmark);
    });

    chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
      console.log('[SyncManager] 书签删除:', id);
      this.handleChange('remove', null, removeInfo);
    });

    chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
      console.log('[SyncManager] 书签更新:', id);
      this.handleChange('update', changeInfo as unknown as chrome.bookmarks.BookmarkTreeNode);
    });

    chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
      console.log('[SyncManager] 书签移动:', id);
      this.handleChange('move', moveInfo as unknown as chrome.bookmarks.BookmarkTreeNode);
    });

    chrome.bookmarks.onImportBegan.addListener(() => {
      console.log('[SyncManager] 导入开始');
      this.pendingChanges = 0;
    });

    chrome.bookmarks.onImportEnded.addListener(() => {
      console.log('[SyncManager] 导入结束，触发全量重建');
      this.triggerRebuild();
    });
  }

  stopListening(): void {
    this.isListening = false;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    console.log('[SyncManager] 停止监听');
  }

  private async handleChange(
    action: 'create' | 'remove' | 'update' | 'move',
    bookmark: chrome.bookmarks.BookmarkTreeNode | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    removeInfo?: any,
  ): Promise<void> {
    this.pendingChanges++;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (this.pendingChanges >= this.BATCH_THRESHOLD) {
      console.log('[SyncManager] 批量变化超过阈值，触发全量重建');
      this.pendingChanges = 0;
      this.triggerRebuild();
      return;
    }

    this.debounceTimer = setTimeout(async () => {
      try {
        if (action === 'remove') {
          await this.bookmarkIndexer.updateIndex(null, 'remove', removeInfo);
        } else if (bookmark) {
          await this.bookmarkIndexer.updateIndex(bookmark, action);
        }
      } catch (error) {
        console.error('[SyncManager] 处理变化失败:', error);
      } finally {
        this.pendingChanges = 0;
      }
    }, this.DEBOUNCE_DELAY);
  }

  private async triggerRebuild(): Promise<void> {
    try {
      await this.bookmarkIndexer.buildIndex();
      console.log('[SyncManager] 索引重建完成');
    } catch (error) {
      console.error('[SyncManager] 索引重建失败:', error);
    }
  }
}

export default SyncManager;
