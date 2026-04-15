import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(async () => {
  // 动态导入核心模块
  const { default: MessageHandler } = await import('../src/core/MessageHandler');

  // 初始化消息处理器
  const messageHandler = MessageHandler.getInstance();
  messageHandler.init();

  // 监听快捷键 (添加错误处理)
  try {
    chrome.commands.onCommand.addListener((command: string) => {
      if (command === 'toggle-popup') {
        chrome.action.openPopup();
      }
    });
  } catch (e) {
    console.log('[Background] 非浏览器环境，跳过快捷键监听');
  }

  // 安装时初始化
  try {
    chrome.runtime.onInstalled.addListener((details: { reason: string }) => {
      if (details.reason === 'install') {
        console.log('[Background] 扩展已安装');
      }
    });
  } catch (e) {
    console.log('[Background] 非浏览器环境，跳过安装监听');
  }

  console.log('[Background] Bookmark Helper 已启动');
});