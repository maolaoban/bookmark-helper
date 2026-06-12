import { createContainer } from '../core/container';
import { handleMessage, type MessageRequest } from '../core/message-handler';
import { PortManager } from '../core/port-manager';

const INDEX_VERSION = 2;

export default defineBackground(async () => {
  console.log('[Background] 启动中...');

  const container = createContainer();
  const { bookmarkIndexer, syncManager } = container;
  const portManager = new PortManager();

  const broadcastStatus = async () => {
    if (portManager.portCount === 0) return;
    const status = await bookmarkIndexer.getIndexStatus();
    await portManager.broadcastStatus(status);
  };

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') {
      portManager.addPort(port);
      broadcastStatus();
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleMessage(message as MessageRequest, {
      ...container,
      broadcastStatus,
    })
      .then(sendResponse)
      .catch((error) => {
        console.error('[Background] 处理消息失败:', error);
        sendResponse({ error: error.message });
      });
    return true;
  });

  try {
    chrome.commands.onCommand.addListener((command: string) => {
      if (command === 'toggle-popup') {
        chrome.action.openPopup();
      }
    });
  } catch {
    console.log('[Background] 非浏览器环境，跳过快捷键监听');
  }

  const exists = await bookmarkIndexer.hasPersistedData();
  const storedVersion = (
    await chrome.storage.local.get(['indexVersion'])
  ).indexVersion as number | undefined;

  if (exists && storedVersion === INDEX_VERSION) {
    await bookmarkIndexer.init();
  } else {
    if (exists && storedVersion !== INDEX_VERSION) {
      console.log(
        `[Background] 索引版本变更 (${storedVersion} → ${INDEX_VERSION})，自动重建索引`,
      );
    }
    try {
      await bookmarkIndexer.buildIndex(() => broadcastStatus());
      await chrome.storage.local.set({ indexVersion: INDEX_VERSION });
    } catch (error) {
      console.error('[Background] 初始索引构建失败:', (error as Error).message);
    }
  }

  syncManager.startListening();

  broadcastStatus();
  console.log('[Background] Bookmark Helper 已启动');
});
