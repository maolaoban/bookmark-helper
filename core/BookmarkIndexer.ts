/**
 * 书签索引模块
 * 负责遍历、索引书签到向量数据库
 */

import ModelManager from './ModelManager';

// 书签文档（包含向量）
type BookmarkDocType = {
  /** 书签ID  */
  id: string;
  /** 书签标题 */
  title: string;
  /** 书签URL */
  url: string;
  /** 书签文本 */
  text: string;
  /** 向量表示 */
  embedding: number[];
  /** 添加时间 */
  dateAdded?: number;
  /** 最后使用时间 */
  dateLastUsed?: number;
  /** 父级ID */
  parentId?: string;
}

type BookmarkTreeNodeType = chrome.bookmarks.BookmarkTreeNode;

// 存储键名
const STORAGE_KEY = 'bookmark_index_data';

class BookmarkIndexer {
  private static instance: BookmarkIndexer;
  private bookmarks: Map<string, BookmarkDocType> = new Map();
  private isIndexing = false;
  private isInitialized = false;

  private constructor() { }

  static getInstance(): BookmarkIndexer {
    if (!BookmarkIndexer.instance) {
      BookmarkIndexer.instance = new BookmarkIndexer();
    }
    return BookmarkIndexer.instance;
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 尝试从存储加载
      await this.loadFromStorage();
      console.log('[BookmarkIndexer] 已加载索引数据');
    } catch (error) {
      console.error('[BookmarkIndexer] 初始化失败:', error);
    }

    this.isInitialized = true;
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 获取所有书签
   */
  async getAllBookmarks(): Promise<BookmarkTreeNodeType[]> {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        const bookmarks: BookmarkTreeNodeType[] = [];
        const flatten = (nodes: BookmarkTreeNodeType[]) => {
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

  /**
   * 构建索引
   * @param onProgress - 进度回调
   */
  async buildIndex(
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    if (this.isIndexing) {
      throw new Error('索引正在构建中');
    }

    this.isIndexing = true;

    try {
      // 确保模型已加载
      const modelManager = ModelManager.getInstance();
      await modelManager.loadModel();

      // 获取所有书签
      const allBookmarks = await this.getAllBookmarks();
      const total = allBookmarks.length;

      console.log(`[BookmarkIndexer] 开始索引 ${total} 个书签`);

      // 清空现有索引
      this.bookmarks.clear();

      // 批量处理
      const BATCH_SIZE = 10;
      for (let i = 0; i < allBookmarks.length; i += BATCH_SIZE) {
        const batch = allBookmarks.slice(i, i + BATCH_SIZE);

        for (const node of batch) {
          if (node.url) {
            const text = `${node.title} ${node.url}`;
            const embedding = await modelManager.generateEmbedding(text);

            const doc: BookmarkDocType = {
              id: node.id,
              title: node.title || '无标题',
              url: node.url,
              text: text.toLowerCase(),
              embedding,
              dateAdded: node.dateAdded,
              dateLastUsed: node.dateLastUsed,
              parentId: node.parentId,
            };

            this.bookmarks.set(node.id, doc);
          }
        }

        // 报告进度
        if (onProgress) {
          onProgress(Math.min(i + BATCH_SIZE, total), total);
        }
      }

      // 保存到存储
      await this.saveToStorage();

      // 更新索引时间
      await chrome.storage.local.set({ lastIndexTime: Date.now() });

      console.log(`[BookmarkIndexer] 索引构建完成，共 ${this.bookmarks.size} 个书签`);
    } catch (error) {
      console.error('[BookmarkIndexer] 索引构建失败:', error);
      throw error;
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * 保存到存储
   */
  private async saveToStorage(): Promise<void> {
    // 将 Map 转换为可序列化的数组
    const data = Array.from(this.bookmarks.values()).map((doc) => ({
      ...doc,
      embedding: doc.embedding, // 数组可以JSON序列化
    }));

    await chrome.storage.local.set({ [STORAGE_KEY]: data });

    console.log('[BookmarkIndexer] 数据已保存到存储');
  }

  /**
   * 从存储加载
   */
  private async loadFromStorage(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY] && Array.isArray(result[STORAGE_KEY])) {
          const data = result[STORAGE_KEY] as BookmarkDocType[];
          this.bookmarks.clear();
          for (const doc of data) {
            this.bookmarks.set(doc.id, doc);
          }
        }
        resolve();
      });
    });
  }

  /**
   * 获取所有文档
   */
  getAllDocs(): BookmarkDocType[] {
    return Array.from(this.bookmarks.values());
  }

  /**
   * 获取文档数量
   */
  getCount(): number {
    return this.bookmarks.size;
  }

  /**
   * 获取索引状态
   */
  async getIndexStatus(): Promise<{
    /** 是否正在索引 */
    isIndexing: boolean;
    /** 书签总数 */
    totalBookmarks: number;
    /** 最后一次索引时间 */
    lastIndexTime: number | null;
  }> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['lastIndexTime'], (result) => {
        let lastIndexTime: number | null = (result.lastIndexTime as number) || null;
        resolve({
          isIndexing: this.isIndexing,
          totalBookmarks: this.bookmarks.size,
          lastIndexTime,
        });
      });
    })
  }
}

export default BookmarkIndexer;