/**
 * 书签索引模块 - 基于 Orama 向量数据库
 */

import {
  create,
  insert,
  insertMultiple,
  remove,
  update,
  save,
  load,
  search,
  searchVector,
  count as oramaCount,
  getByID,
  MODE_HYBRID_SEARCH,
  MODE_VECTOR_SEARCH,
  type AnyOrama,
} from '@orama/orama';
import { createTokenizer } from '@orama/tokenizers/mandarin';
import { pluginQPS } from '@orama/plugin-qps';
import { openDB, type IDBPDatabase } from 'idb';
import { ModelManager, type ModelProgress } from './model-manager';
import { buildEmbeddingText } from './text-preprocessor';

const IDB_NAME = 'bookmark-helper';
const IDB_VERSION = 1;
const IDB_STORE = 'orama';
const IDB_KEY = 'orama_db';

const BOOKMARK_SCHEMA = {
  title: 'string',
  url: 'string',
  text: 'string',
  embedding: 'vector[384]',
  dateAdded: 'number',
  dateLastUsed: 'number',
  parentId: 'string',
  enrichedAt: 'number',
  enrichCount: 'number',
} as const;

export type BookmarkDoc = {
  id: string;
  title: string;
  url: string;
  text: string;
  embedding: number[];
  dateAdded?: number;
  dateLastUsed?: number;
  parentId?: string;
  enrichedAt?: number;
  enrichCount?: number;
};

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

export class BookmarkIndexer {
  private db: AnyOrama | null = null;
  private isIndexing = false;
  private isInitialized = false;
  private indexingProgress = { current: 0, total: 0 };
  private indexingPhase: 'loading_model' | 'indexing' | null = null;
  private dbPromise: Promise<IDBPDatabase> | null = null;

  constructor(private modelManager: ModelManager) { }

  private async saveIndexingState(): Promise<void> {
    await chrome.storage.session.set({
      indexingState: {
        isIndexing: this.isIndexing,
        phase: this.indexingPhase,
        current: this.indexingProgress.current,
        total: this.indexingProgress.total,
      },
    });
  }

  private async clearIndexingState(): Promise<void> {
    await chrome.storage.session.remove('indexingState');
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const raw = await this.loadFromIDB();
      if (raw) {
        this.db = create({
          schema: BOOKMARK_SCHEMA,
          components: {
            tokenizer: createTokenizer()
          },
          plugins: [pluginQPS()]
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        load(this.db, raw as any);
        this.isInitialized = true;
        console.log('[BookmarkIndexer] 从 IndexedDB 加载了索引数据');
      }
    } catch {
      console.log('[BookmarkIndexer] 未找到持久化数据，需要构建索引');
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async hasPersistedData(): Promise<boolean> {
    const idb = await this.getIDB();
    const count = await idb.count(IDB_STORE);
    return count > 0;
  }

  private async ensureDB(): Promise<AnyOrama> {
    if (!this.isInitialized) await this.init();
    if (!this.db) {
      throw new Error('数据库未初始化，请先调用 buildIndex() 构建索引');
    }
    return this.db;
  }

  private getIDB(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(IDB_NAME, IDB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE);
          }
        },
      });
    }
    return this.dbPromise;
  }

  private async persist(): Promise<void> {
    if (!this.db) return;
    const raw = save(this.db);
    const idb = await this.getIDB();
    await idb.put(IDB_STORE, raw, IDB_KEY);
  }

  private async loadFromIDB(): Promise<Record<string, unknown> | null> {
    const idb = await this.getIDB();
    return (await idb.get(IDB_STORE, IDB_KEY)) ?? null;
  }

  private async getAllBookmarks(): Promise<BookmarkTreeNode[]> {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        const bookmarks: BookmarkTreeNode[] = [];
        const flatten = (nodes: BookmarkTreeNode[]) => {
          for (const node of nodes) {
            if (node.url && node.url.trim() !== '') {
              bookmarks.push(node);
            }
            if (node.children) {
              flatten(node.children);
            }
          }
        };
        flatten(tree);
        resolve(bookmarks);
      });
    });
  }

  async buildIndex(onProgress?: (current: number, total: number) => void): Promise<void> {
    if (this.isIndexing) {
      throw new Error('索引正在构建中');
    }

    this.isIndexing = true;
    this.indexingPhase = 'loading_model';
    this.indexingProgress = { current: 0, total: 0 };
    await this.saveIndexingState();
    onProgress?.(0, 0);

    try {
      await this.modelManager.loadModel((progress: ModelProgress) => {
        this.indexingProgress = { current: progress.loaded, total: progress.total };
        onProgress?.(progress.loaded, progress.total);
      });

      this.indexingPhase = 'indexing';
      this.indexingProgress = { current: 0, total: 0 };
      await this.saveIndexingState();
      onProgress?.(0, 0);

      const allBookmarks = await this.getAllBookmarks();
      const total = allBookmarks.length;

      console.log(`[BookmarkIndexer] 开始索引 ${total} 个书签`);

      this.indexingProgress = { current: 0, total };
      await this.saveIndexingState();
      onProgress?.(0, total);

      this.db = create({
        schema: BOOKMARK_SCHEMA,
        components: {
          tokenizer: createTokenizer()
        },
        plugins: [pluginQPS()]
      });

      const BATCH_SIZE = 10;
      const docs: Array<Record<string, unknown>> = [];

      for (let i = 0; i < allBookmarks.length; i++) {
        const node = allBookmarks[i];
        if (!node?.url) continue;

        const text = buildEmbeddingText(node.title || '', node.url || '');
        const embedding = await this.modelManager.generateEmbedding(text);

        docs.push({
          id: node.id,
          title: node.title || '无标题',
          url: node.url,
          text,
          embedding,
          dateAdded: node.dateAdded ?? 0,
          dateLastUsed: node.dateLastUsed ?? 0,
          parentId: node.parentId ?? '',
          enrichedAt: 0,
          enrichCount: 0,
        });

        this.indexingProgress = { current: Math.min(i + 1, total), total };

        if (docs.length >= BATCH_SIZE || i === allBookmarks.length - 1) {
          await this.saveIndexingState();
          onProgress?.(this.indexingProgress.current, this.indexingProgress.total);
        }
      }

      if (docs.length > 0) {
        await insertMultiple(this.db!, docs, BATCH_SIZE);
      }

      await this.persist();
      await chrome.storage.local.set({ lastIndexTime: Date.now() });
      this.isInitialized = true;

      console.log(`[BookmarkIndexer] 索引构建完成，共 ${docs.length} 个书签`);
    } catch (error) {
      console.error('[BookmarkIndexer] 索引构建失败:', error);
      throw error;
    } finally {
      this.isIndexing = false;
      this.indexingProgress = { current: 0, total: 0 };
      await this.clearIndexingState();
    }
  }

  async updateIndex(
    bookmark: chrome.bookmarks.BookmarkTreeNode | null,
    action: 'create' | 'remove' | 'update' | 'move',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    removeInfo?: any,
  ): Promise<void> {
    const db = await this.ensureDB();

    try {
      switch (action) {
        case 'remove': {
          const id = removeInfo?.node?.id;
          if (id) {
            await remove(db, id);
            await this.persist();
            console.log('[BookmarkIndexer] 已删除书签:', id);
          }
          break;
        }
        case 'create': {
          if (bookmark?.url) {
            await this.insertBookmark(bookmark);
            await this.persist();
          }
          break;
        }
        case 'update':
        case 'move': {
          if (bookmark?.id) {
            const [full] = await chrome.bookmarks.get(bookmark.id);
            if (full) {
              await this.insertOrUpdateBookmark(full);
              await this.persist();
            }
          }
          break;
        }
      }
    } catch (error) {
      console.error('[BookmarkIndexer] 增量更新失败:', error);
      throw error;
    }
  }

  private async insertBookmark(node: BookmarkTreeNode): Promise<void> {
    await this.modelManager.loadModel();

    const text = buildEmbeddingText(node.title || '', node.url || '');
    const embedding = await this.modelManager.generateEmbedding(text);

    await insert(this.db!, {
      id: node.id,
      title: node.title || '无标题',
      url: node.url!,
      text,
      embedding,
      dateAdded: node.dateAdded ?? 0,
      dateLastUsed: node.dateLastUsed ?? 0,
      parentId: node.parentId ?? '',
      enrichedAt: 0,
      enrichCount: 0,
    } as Record<string, unknown>);
  }

  private async insertOrUpdateBookmark(node: BookmarkTreeNode): Promise<void> {
    await this.modelManager.loadModel();

    const text = buildEmbeddingText(node.title || '', node.url || '');
    const embedding = await this.modelManager.generateEmbedding(text);

    const doc: Record<string, unknown> = {
      title: node.title || '无标题',
      url: node.url!,
      text,
      embedding,
      dateAdded: node.dateAdded ?? 0,
      dateLastUsed: node.dateLastUsed ?? 0,
      parentId: node.parentId ?? '',
    };

    try {
      await update(this.db!, node.id, doc);
    } catch {
      await insert(this.db!, { id: node.id, ...doc, enrichedAt: 0, enrichCount: 0 });
    }
  }

  async enrichDocument(
    bookmarkId: string,
    updates: {
      text: string;
      embedding: number[];
      enrichedAt: number;
      enrichCount: number;
    },
  ): Promise<void> {
    const db = await this.ensureDB();

    try {
      const existing = getByID(db, bookmarkId) as Record<string, unknown> | null;
      if (!existing) return;

      await update(db, bookmarkId, {
        ...existing,
        text: updates.text,
        embedding: updates.embedding,
        enrichedAt: updates.enrichedAt,
        enrichCount: updates.enrichCount,
      } as unknown as Record<string, unknown>);
      await this.persist();
    } catch (error) {
      console.error('[BookmarkIndexer] 增强文档失败:', bookmarkId, error);
    }
  }

  async getDocument(id: string): Promise<BookmarkDoc | null> {
    const db = await this.ensureDB();
    const doc = getByID(db, id);
    return doc as BookmarkDoc | null;
  }

  async searchByVector(
    embedding: number[],
    options: { limit?: number; threshold?: number } = {},
  ): Promise<Array<{ id: string; score: number; document: BookmarkDoc }>> {
    const db = await this.ensureDB();
    const raw = await searchVector(db, {
      mode: MODE_VECTOR_SEARCH,
      vector: { property: 'embedding', value: embedding },
      similarity: options.threshold ?? 0.3,
      limit: options.limit ?? 20,
      includeVectors: false,
    });

    return raw.hits.map((hit) => ({
      id: hit.id,
      score: hit.score,
      document: hit.document as BookmarkDoc,
    }));
  }

  async searchHybrid(
    query: string,
    embedding: number[],
    options: {
      limit?: number;
      threshold?: number;
      vectorWeight?: number;
      textWeight?: number;
    } = {},
  ): Promise<Array<{ id: string; score: number; document: BookmarkDoc }>> {
    const db = await this.ensureDB();
    const raw = await search(db, {
      mode: MODE_HYBRID_SEARCH,
      term: query,
      vector: { property: 'embedding', value: embedding },
      properties: ['title', 'url', 'text'],
      boost: {
        title: 2.0,
        url: 1.0,
        text: 3.0,
      },
      hybridWeights: {
        text: options.textWeight ?? 0.6,
        vector: options.vectorWeight ?? 0.4,
      },
      similarity: options.threshold ?? 0.3,
      limit: options.limit ?? 20,
      includeVectors: false,
    });

    return raw.hits.map((hit) => ({
      id: hit.id,
      score: hit.score,
      document: hit.document as BookmarkDoc,
    }));
  }

  async getCount(): Promise<number> {
    const db = await this.ensureDB();
    return oramaCount(db);
  }

  async getIndexStatus(): Promise<{
    isIndexing: boolean;
    phase?: 'loading_model' | 'indexing' | null;
    totalBookmarks: number;
    indexedBookmarks: number;
    lastIndexTime: number | null;
  }> {
    if (this.isIndexing) {
      return {
        isIndexing: true,
        phase: this.indexingPhase,
        totalBookmarks: this.indexingProgress.total,
        indexedBookmarks: this.indexingProgress.current,
        lastIndexTime: null,
      };
    }

    // 检查 session storage 中是否有未完成的索引（SW 重启后恢复）
    const session = await chrome.storage.session.get('indexingState') as { indexingState?: { isIndexing: boolean; phase?: string; total: number; current: number } };
    if (session.indexingState?.isIndexing) {
      return {
        isIndexing: true,
        phase: session.indexingState.phase as 'loading_model' | 'indexing' | null,
        totalBookmarks: session.indexingState.total,
        indexedBookmarks: session.indexingState.current,
        lastIndexTime: null,
      };
    }

    let totalBookmarks = 0;
    try {
      totalBookmarks = await this.getCount();
    } catch {
      totalBookmarks = 0;
    }

    return new Promise((resolve) => {
      chrome.storage.local.get(['lastIndexTime'], (result) => {
        resolve({
          isIndexing: false,
          phase: null,
          totalBookmarks,
          indexedBookmarks: totalBookmarks,
          lastIndexTime: (result.lastIndexTime as number) || null,
        });
      });
    });
  }
}

export default BookmarkIndexer;
