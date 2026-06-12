/**
 * 消息通信协议
 * 统一 popup ↔ background 的消息类型定义和通信方式
 */

import type {
  BackgroundRequest,
  SearchResult,
  IndexStatus,
  PageMetadata,
} from '../types';

export type { BackgroundRequest, SearchResult, IndexStatus, PageMetadata };

/**
 * 发送消息到 background 并等待响应
 */
export async function sendMessage(
  message: BackgroundRequest,
): Promise<SearchResult[] | IndexStatus | null> {
  return chrome.runtime.sendMessage(message);
}

/**
 * 发送搜索请求
 */
export async function sendSearchRequest(
  query: string,
  options: { limit?: number; threshold?: number } = {},
): Promise<SearchResult[]> {
  const response = await sendMessage({
    type: 'search',
    query,
    ...options,
  });
  return Array.isArray(response) ? response : [];
}

/**
 * 发送重建索引请求
 */
export async function sendRebuildIndexRequest(): Promise<boolean> {
  const response = await sendMessage({ type: 'rebuild-index' });
  return !!(response && typeof response === 'object' && 'success' in response);
}

/**
 * 发送元数据提取消息
 */
export async function sendMetadataExtracted(metadata: PageMetadata): Promise<void> {
  await sendMessage({
    type: 'metadata-extracted',
    payload: metadata,
  });
}

/**
 * 连接到 background 端口
 */
export function connectToBackground(): chrome.runtime.Port {
  return chrome.runtime.connect({ name: 'popup' });
}

/**
 * 监听索引状态更新
 */
export function onIndexStatusUpdate(
  port: chrome.runtime.Port,
  callback: (status: IndexStatus) => void,
): () => void {
  const listener = (msg: { type: string; payload?: IndexStatus }) => {
    if (msg.type === 'index-status' && msg.payload) {
      callback(msg.payload);
    }
  };
  port.onMessage.addListener(listener);
  return () => port.onMessage.removeListener(listener);
}

/**
 * 获取最近书签
 */
export async function getRecentBookmarks(limit: number = 20): Promise<SearchResult[]> {
  return new Promise((resolve) => {
    chrome.bookmarks.getRecent(limit, (bookmarks) => {
      const results = bookmarks
        .filter((b) => b.url)
        .map((b) => ({
          id: b.id,
          title: b.title || '无标题',
          url: b.url!,
          similarity: 0,
        }));
      resolve(results);
    });
  });
}
