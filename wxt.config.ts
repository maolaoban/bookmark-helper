import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Bookmark Helper',
    version: '1.0.0',
    default_locale: 'zh_CN',
    description: '__MSG_extDescription__',
    permissions: ['bookmarks', 'storage', 'favicon', 'tabs', 'alarms'],
    host_permissions: ["http://*/*", "https://*/*"],
    content_security_policy: {
      "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
    },
    action: {
      default_title: 'Bookmark Helper',
    },
    commands: {
      'toggle-popup': {
        suggested_key: {
          default: 'Ctrl+Shift+L',
          mac: 'Command+Shift+L',
        },
        description: '__MSG_togglePopup__',
      },
    },
  }
});
