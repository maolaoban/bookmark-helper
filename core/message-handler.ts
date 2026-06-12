/**
 * 消息处理模块
 * 处理 popup 与 background 之间的消息
 */

import type { BookmarkIndexer } from './bookmark-indexer';
import type { SearchEngine } from './search-engine';
import type { PageMetadata } from '../types';
import { buildEnrichedText } from './text-preprocessor';
import type { ModelManager } from './model-manager';

export type MessageRequest =
  | { type: 'search'; query: string; limit?: number; threshold?: number }
  | { type: 'rebuild-index' }
  | { type: 'metadata-extracted'; payload: PageMetadata };

export interface MessageHandlerDeps {
  bookmarkIndexer: BookmarkIndexer;
  searchEngine: SearchEngine;
  modelManager: ModelManager;
  broadcastStatus: () => Promise<void>;
}

export async function handleMessage(
  message: MessageRequest,
  deps: MessageHandlerDeps,
): Promise<unknown> {
  const { bookmarkIndexer, searchEngine, broadcastStatus } = deps;

  switch (message.type) {
    case 'search': {
      return await searchEngine.search(message.query, {
        limit: message.limit,
        threshold: message.threshold,
      });
    }
    case 'rebuild-index': {
      await bookmarkIndexer.buildIndex(() => broadcastStatus());
      await broadcastStatus();
      return { success: true };
    }
    case 'metadata-extracted': {
      handleMetadataExtracted(message.payload, deps).catch((e) =>
        console.error('[Background] 元数据增强失败:', e),
      );
      return null;
    }
    default:
      throw new Error(`未知消息类型: ${(message as MessageRequest).type}`);
  }
}

async function handleMetadataExtracted(
  meta: PageMetadata,
  deps: MessageHandlerDeps,
): Promise<void> {
  const { bookmarkIndexer, modelManager } = deps;
  if (!bookmarkIndexer.isReady()) return;

  const bookmarks = await chrome.bookmarks.search({ url: meta.url });
  if (bookmarks.length === 0) return;

  for (const bm of bookmarks) {
    if (!bm.id) continue;

    const doc = await bookmarkIndexer.getDocument(bm.id);
    if (!doc) continue;

    if (doc.enrichCount && doc.enrichCount > 0) continue;

    const enrichedText = buildEnrichedText(
      bm.title || '',
      meta.url,
      meta.description || '',
      meta.bodyText || '',
    );

    if (enrichedText === doc.text) continue;

    const embedding = await modelManager.generateEmbedding(enrichedText);

    await bookmarkIndexer.enrichDocument(bm.id, {
      text: enrichedText,
      embedding,
      enrichedAt: Date.now(),
      enrichCount: 1,
    });

    console.log('[Background] 已增强书签:', bm.title);
    console.log('[Background] 增强内容:', enrichedText);
  }
}

export default handleMessage;
