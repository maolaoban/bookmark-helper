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
  phase?: IndexingPhase | null;
  totalBookmarks: number;
  indexedBookmarks: number;
  lastIndexTime?: number | null;
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
  headerText?: string;
  footerText?: string;
  keywords?: string;
}

// 配置类型
export interface AppConfig {
  theme: 'system' | 'light' | 'dark';
  locale: 'system' | 'zh-CN' | 'en';
  sortBy: 'dateAdded' | 'dateLastUsed';
  autoIndex?: boolean;
  indexThreshold?: number;
  searchLimit?: number;
  similarityThreshold?: number;
  metadataExpiryDays?: number;
}

// === Message Protocol Types ===

// Popup -> Background requests
export interface SearchRequest {
  type: 'search';
  query: string;
  limit?: number;
  threshold?: number;
}

export interface RebuildIndexRequest {
  type: 'rebuild-index';
}

export interface GetIndexStatusRequest {
  type: 'get-index-status';
}

export interface MetadataExtractedRequest {
  type: 'metadata-extracted';
  payload: PageMetadata;
}

export type BackgroundRequest = SearchRequest | RebuildIndexRequest | GetIndexStatusRequest | MetadataExtractedRequest;

// Background -> Popup responses
export interface SearchResultResponse {
  type: 'search-result';
  payload: SearchResult[];
}

export interface IndexStatusResponse {
  type: 'index-status';
  payload: IndexStatus;
}

export interface ErrorResponse {
  type: 'error';
  payload: { message: string };
}

export type BackgroundResponse = SearchResultResponse | IndexStatusResponse | ErrorResponse;

// Port message types
export interface PortMessage {
  type: 'index-status';
  payload: IndexStatus;
}
