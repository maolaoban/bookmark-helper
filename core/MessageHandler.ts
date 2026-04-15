/**
 * 通信层
 * 处理来自 popup 的消息请求
 */

import BookmarkIndexer from './BookmarkIndexer';
import SearchEngine from './SearchEngine';
import SyncManager from './SyncManager';
import type { SearchResult, IndexStatus } from '../types';

// 消息类型定义
interface SearchRequest {
  type: 'search';
  query: string;
  limit?: number;
  threshold?: number;
}

interface RebuildIndexRequest {
  type: 'rebuild-index';
}

interface GetStatusRequest {
  type: 'get-index-status';
}

interface GetBookmarkPathRequest {
  type: 'get-bookmark-path';
  id: string;
}

type MessageRequest =
  | SearchRequest
  | RebuildIndexRequest
  | GetStatusRequest
  | GetBookmarkPathRequest;

// 检查是否在浏览器环境中
const isBrowser = typeof chrome !== 'undefined' && chrome.runtime?.id !== undefined;

class MessageHandler {
  private static instance: MessageHandler;
  private initialized = false;

  private constructor() { }

  static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  /**
   * 初始化消息监听
   */
  init(): void {
    if (this.initialized || !isBrowser) {
      return;
    }

    // 启动同步管理器
    const syncManager = SyncManager.getInstance();
    syncManager.startListening();

    // 初始化数据库
    const indexer = BookmarkIndexer.getInstance();
    indexer.init().then(() => {
      console.log('[MessageHandler] 数据库已初始化');
    });

    // 监听消息
    chrome.runtime.onMessage.addListener(
      (message: MessageRequest, _sender, sendResponse) => {
        this.handleMessage(message)
          .then(sendResponse)
          .catch((error) => {
            console.error('[MessageHandler] 处理消息失败:', error);
            sendResponse({ error: error.message });
          });

        // 异步处理需要返回 true
        return true;
      }
    );

    this.initialized = true;
    console.log('[MessageHandler] 消息监听已启动');
  }

  /**
   * 处理消息
   */
  private async handleMessage(
    message: MessageRequest
  ): Promise<unknown> {
    switch (message.type) {
      case 'search': {
        const searchEngine = SearchEngine.getInstance();
        const results = await searchEngine.search(message.query, {
          limit: message.limit,
          threshold: message.threshold,
        });

        // 获取每个书签的路径
        const resultsWithPath = await Promise.all(
          results.map(async (result) => {
            const path = await this.getBookmarkPath(result.id);
            return { ...result, path };
          })
        );

        return resultsWithPath;
      }

      case 'rebuild-index': {
        const indexer = BookmarkIndexer.getInstance();
        await indexer.buildIndex();
        return { success: true };
      }

      case 'get-index-status': {
        const indexer = BookmarkIndexer.getInstance();
        const status = await indexer.getIndexStatus();
        return status;
      }

      case 'get-bookmark-path': {
        return await this.getBookmarkPath(message.id);
      }

      default:
        throw new Error(`未知消息类型: ${(message as MessageRequest).type}`);
    }
  }

  /**
   * 获取书签路径
   */
  private async getBookmarkPath(id: string): Promise<string> {
    return new Promise((resolve) => {
      const getPath = (currentId: string, path: string[] = []): void => {
        chrome.bookmarks.get(currentId, (results) => {
          if (results && results.length > 0) {
            const item = results[0];
            path.unshift(item.title);

            if (item.parentId && item.parentId !== '0') {
              getPath(item.parentId, path);
            } else {
              // 过滤系统文件夹名
              const filteredPath = path.filter(
                (name) =>
                  !['书签栏', 'Bookmarks bar', '其他书签', 'Other bookmarks'].includes(name)
              );
              resolve(filteredPath.join(' > '));
            }
          } else {
            resolve('');
          }
        });
      };

      getPath(id);
    });
  }
}

export default MessageHandler;