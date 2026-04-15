import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Bookmark Helper',
    version: '1.0.0',
    description: '智能书签搜索 - 使用本地向量模型进行语义搜索',
    permissions: ['bookmarks', 'activeTab', 'storage', 'favicon'],
    action: {
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
  }
});
