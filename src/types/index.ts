/**
 * 类型定义
 */

// 书签数据类型
export interface BookmarkData {
  id: string;
  title: string;
  url: string;
  dateAdded?: number;
  dateLastUsed?: number;
  parentId?: string;
  path?: string;
}

// 搜索结果
export interface SearchResult {
  id: string;
  title: string;
  url: string;
  similarity: number;
  path?: string;
}

// 索引状态
export interface IndexStatus {
  isIndexing: boolean;
  totalBookmarks: number;
  indexedBookmarks: number;
  lastIndexTime?: number;
  error?: string;
}

// 消息类型
export type MessageType =
  | 'search'
  | 'rebuild-index'
  | 'get-index-status'
  | 'search-result'
  | 'index-status'
  | 'error';

export interface Message {
  type: MessageType;
  payload?: unknown;
}

export interface SearchMessage {
  type: 'search';
  payload: {
    query: string;
    limit?: number;
    threshold?: number;
  };
}

export interface SearchResultMessage {
  type: 'search-result';
  payload: SearchResult[];
}

export interface IndexStatusMessage {
  type: 'index-status';
  payload: IndexStatus;
}

// 配置类型
export interface AppConfig {
  theme: 'system' | 'light' | 'dark';
  sortBy: 'dateAdded' | 'dateLastUsed';
  autoIndex: boolean;
  indexThreshold: number;
  searchLimit: number;
  similarityThreshold: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  theme: 'system',
  sortBy: 'dateAdded',
  autoIndex: true,
  indexThreshold: 0.6,
  searchLimit: 20,
  similarityThreshold: 0.3,
};