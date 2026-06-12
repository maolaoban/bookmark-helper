import BookmarkIndexer from '../core/BookmarkIndexer';
import SearchEngine from '../core/SearchEngine';
import SyncManager from '../core/SyncManager';
import ModelManager from '../core/ModelManager';
import { buildEnrichedText } from '../core/TextPreprocessor';
import type { PageMetadata } from '../types';

const INDEX_VERSION = 2;

const ports = new Set<chrome.runtime.Port>();

async function broadcastStatus() {
  if (ports.size === 0) return;
  try {
    const indexer = BookmarkIndexer.getInstance();
    const status = await indexer.getIndexStatus();
    for (const port of ports) {
      try { port.postMessage({ type: 'index-status', payload: status }); } catch { ports.delete(port); }
    }
  } catch { /* indexer not ready */ }
}

type MessageRequest =
  | { type: 'search'; query: string; limit?: number; threshold?: number }
  | { type: 'rebuild-index' }
  | { type: 'metadata-extracted'; payload: PageMetadata };

async function handleMessage(message: MessageRequest): Promise<unknown> {
  const indexer = BookmarkIndexer.getInstance();

  switch (message.type) {
    case 'search': {
      return await SearchEngine.getInstance().search(message.query, {
        limit: message.limit,
        threshold: message.threshold,
      });
    }
    case 'rebuild-index': {
      await indexer.buildIndex(() => broadcastStatus());
      await broadcastStatus();
      return { success: true };
    }
    case 'metadata-extracted': {
      handleMetadataExtracted(message.payload).catch((e) =>
        console.error('[Background] 元数据增强失败:', e)
      );
      return null;
    }
    default:
      throw new Error(`未知消息类型: ${(message as MessageRequest).type}`);
  }
}

async function handleMetadataExtracted(meta: PageMetadata): Promise<void> {
  const indexer = BookmarkIndexer.getInstance();
  if (!indexer.isReady()) return;

  // 查找 URL 对应的书签
  const bookmarks = await chrome.bookmarks.search({ url: meta.url });
  if (bookmarks.length === 0) return;

  for (const bm of bookmarks) {
    if (!bm.id) continue;

    const doc = await indexer.getDocument(bm.id);
    if (!doc) continue;

    // 只增强一次，避免重复
    if (doc.enrichCount && doc.enrichCount > 0) continue;

    const enrichedText = buildEnrichedText(
      bm.title || '',
      meta.url,
      meta.description || '',
      meta.bodyText || '',
    );

    if (enrichedText === doc.text) continue;

    // 生成新嵌入向量
    const model = ModelManager.getInstance();
    const embedding = await model.generateEmbedding(enrichedText);

    await indexer.enrichDocument(bm.id, {
      text: enrichedText,
      embedding,
      enrichedAt: Date.now(),
      enrichCount: 1,
    });

    console.log('[Background] 已增强书签:', bm.title);
  }
}

export default defineBackground(async () => {
  console.log('[Background] 启动中...');

  // 同步注册监听器，保证 Service Worker 可靠接收事件
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') {
      ports.add(port);
      port.onDisconnect.addListener(() => ports.delete(port));
      broadcastStatus();
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleMessage(message).then(sendResponse).catch((error) => {
      console.error('[Background] 处理消息失败:', error);
      sendResponse({ error: error.message });
    });
    return true;
  });

  const indexer = BookmarkIndexer.getInstance();

  SyncManager.getInstance().startListening();

  try {
    chrome.commands.onCommand.addListener((command: string) => {
      if (command === 'toggle-popup') {
        chrome.action.openPopup();
      }
    });
  } catch (e) {
    console.log('[Background] 非浏览器环境，跳过快捷键监听');
  }

  const exists = await indexer.hasPersistedData();
  const storedVersion = (await chrome.storage.local.get(['indexVersion'])).indexVersion as number | undefined;

  if (exists && storedVersion === INDEX_VERSION) {
    await indexer.init();
  } else {
    if (exists && storedVersion !== INDEX_VERSION) {
      console.log(`[Background] 索引版本变更 (${storedVersion} → ${INDEX_VERSION})，自动重建索引`);
    }
    try {
      await indexer.buildIndex(() => broadcastStatus());
      await chrome.storage.local.set({ indexVersion: INDEX_VERSION });
    } catch (e) {
      console.error('[Background] 初始索引构建失败:', (e as Error).message);
    }
  }

  broadcastStatus();
  console.log('[Background] Bookmark Helper 已启动');
});
