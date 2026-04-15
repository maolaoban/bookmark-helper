import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 不设置 srcDir，WXT 默认在根目录查找 entrypoints
  manifest: {
    name: 'Bookmark Helper',
    version: '1.0.0',
    description: '智能书签搜索 - 使用本地向量模型进行语义搜索',
    permissions: ['bookmarks', 'activeTab', 'storage'],
    action: {
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png',
      },
      default_title: 'Bookmark Helper',
    },
    commands: {
      'toggle-popup': {
        suggested_key: {
          default: 'Ctrl+Shift+L',
          mac: 'Command+Shift+L',
        },
        description: '打开书签搜索',
      },
    },
  },
});