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

// 索引阶段
export type IndexingPhase = 'loading_model' | 'indexing';

// 索引状态
export interface IndexStatus {
  isIndexing: boolean;
  phase?: IndexingPhase;
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
  | 'error'
  | 'extract-metadata'
  | 'metadata-extracted';

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

// Content script 提取的页面元信息
export interface PageMetadata {
  url: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  metaDescription?: string;
  bodyText?: string;
}

// 配置类型
export interface AppConfig {
  theme: 'system' | 'light' | 'dark';
  sortBy: 'dateAdded' | 'dateLastUsed';
  autoIndex?: boolean;
  indexThreshold?: number;
  searchLimit?: number;
  similarityThreshold?: number;
}

