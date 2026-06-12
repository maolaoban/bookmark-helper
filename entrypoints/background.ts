import BookmarkIndexer from '../core/BookmarkIndexer';
import SearchEngine from '../core/SearchEngine';
import SyncManager from '../core/SyncManager';

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
  | { type: 'rebuild-index' };

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
    default:
      throw new Error(`未知消息类型: ${(message as MessageRequest).type}`);
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
  if (exists) {
    await indexer.init();
  } else {
    try {
      await indexer.buildIndex(() => broadcastStatus());
    } catch (e) {
      console.error('[Background] 初始索引构建失败:', (e as Error).message);
    }
  }

  broadcastStatus();
  console.log('[Background] Bookmark Helper 已启动');
});
