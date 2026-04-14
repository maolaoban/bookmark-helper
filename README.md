# Bookmarks Helper

## 项目概述

一个功能强大的 Chrome 插件，帮助用户智能搜索和推荐书签。支持普通关键词搜索和 AI 智能推荐。

## 功能特性

✅ **关键词搜索** - 快速搜索书签标题和 URL  
✅ **最近书签** - 显示最近添加的书签  
✅ **AI 推荐** - 使用多种 AI 模型智能推荐书签  
✅ **多模型支持** - Google Gemini, OpenAI, Anthropic, Ollama, 百度文心一言, 智谱GLM, 阿里通义千问, DeepSeek  
✅ **一键打开** - 快捷键 `Ctrl+Shift+B` (Mac: `Cmd+Shift+B`)  
✅ **主题切换** - 支持浅色、深色和跟随系统主题  
✅ **弹窗设置** - 点击设置按钮直接配置，无需跳转页面  
✅ **本地存储** - API Key 仅保存在本地，不会上传  

## 项目结构

```
bookmark-ai/
├── manifest.json              # 插件配置 (Manifest V3)
├── background.js              # 后台服务脚本
├── popup/
│   ├── popup.html             # 搜索弹窗 + 设置面板
│   ├── popup.css              # 弹窗样式
│   └── popup.js               # 搜索逻辑 + 设置逻辑
├── js/
│   ├── storage.js             # 本地存储管理
│   ├── bookmarks.js           # 书签操作
│   └── api.js                 # AI 服务封装（8种模型）
├── icons/                     # 图标资源（待添加）
└── README.md                  # 本文档
```

## 快速开始

### 加载扩展

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `bookmark-helper` 文件夹

### 配置 API

1. 点击插件图标，打开弹窗
2. 点击右下角"⚙️ 设置"按钮
3. 选择 AI 提供商并输入 API Key
4. 保存设置

### 使用方式

#### 普通搜索
- 按 `Ctrl+Shift+B` 打开弹窗
- 输入关键词搜索书签
- 点击书签即可打开

#### AI 推荐
- 点击"🤖 AI"按钮切换到 AI 模式
- 输入自然语言描述（如 "学习机器学习的资源"）
- AI 会推荐最相关的书签

## 支持的 AI 模型

| 提供商 | 推荐模型 | 获取方式 | 成本 |
|--------|---------|---------|------|
| **Google Gemini** | gemini-2.0-flash-exp | https://ai.google.dev | 免费额度充足 |
| **OpenAI** | gpt-4o-mini | https://platform.openai.com/api-keys | 付费 |
| **Anthropic** | claude-sonnet-4-20250514 | https://console.anthropic.com | 付费 |
| **Ollama** | llama3 | https://ollama.ai | 本地免费 |
| **百度文心一言** | ernie-4.0 | https://console.bce.baidu.com | 免费额度 |
| **智谱GLM** | glm-4 | https://open.bigmodel.cn | 免费额度 |
| **阿里通义千问** | qwen-max | https://dashscope.aliyun.com | 免费额度 |
| **DeepSeek** | deepseek-chat | https://platform.deepseek.com | 免费额度 |

## 核心代码模块

### storage.js - 配置存储
- `loadConfig()` - 加载配置
- `saveConfig()` - 保存配置
- `getApiKey()` / `saveApiKey()` - 管理 API Key

### bookmarks.js - 书签操作
- `searchBookmarks(query)` - 搜索书签
- `getRecentBookmarks(limit)` - 获取最近书签
- `getAllBookmarks()` - 获取所有书签

### api.js - AI 服务（8种模型支持）
- `AIService` 类 - 多模型 AI 服务
- `callGemini()` - Gemini API
- `callOpenAI()` - OpenAI API
- `callAnthropic()` - Anthropic API
- `callOllama()` - Ollama API
- `callBaidu()` - 百度文心一言 API
- `callGlm()` - 智谱GLM API
- `callQwen()` - 阿里通义千问 API
- `callDeepSeek()` - DeepSeek API

## 开发指南

### 添加新的 AI 提供商

1. 在 `js/api.js` 中添加新的 `call{Provider}()` 方法
2. 在 `options.js` 中的 `PROVIDER_MODELS` 添加模型列表
3. 在 `PROVIDER_HELP` 中添加帮助文本
4. 在 `AIService.chat()` 中添加 case 分支

### 修改系统提示词

编辑 `js/storage.js` 中的 `DEFAULT_CONFIG.systemPrompt`

### 调试

1. 打开 `chrome://extensions/`
2. 在插件旁边点击「检查视图 > Service Worker」查看后台日志
3. 在弹窗页面右键选择「检查」查看弹窗控制台

## 安全性

⚠️ **重要提示：**
- API Key 存储在 `chrome.storage.local`，仅在本地使用
- 切勿在公开场合分享 API Key
- 定期轮换 API Key 增强安全性
- 建议使用专用的 API 密钥，设置最小化权限

## 故障排除

### AI 搜索不工作
- 检查 API Key 是否正确
- 确认网络连接
- 查看浏览器控制台是否有错误信息
- 尝试切换不同的 AI 提供商

### 书签搜索为空
- 确认 Chrome 中有已保存的书签
- 尝试使用不同的关键词
- 检查书签文件夹权限

### 快捷键不响应
- 访问 `chrome://extensions/shortcuts` 修改快捷键
- 确认快捷键未被其他程序占用

## 已实现功能 (Phase 1-4)

- ✅ 项目骨架和 Manifest 配置
- ✅ 搜索弹窗 UI + 设置面板
- ✅ 普通关键词搜索
- ✅ 最近书签显示
- ✅ 设置页面（弹窗内集成）
- ✅ 多提供商 API 支持（8种模型）
- ✅ AI 搜索功能

## 待实现功能 (Phase 3-5)

- ⏳ AI 搜索优化
- ⏳ 搜索历史记录
- ⏳ 书签分类筛选
- ⏳ 自定义快捷键
- ⏳ 右键菜单支持

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新**: 2026-04-14  
**版本**: v1.0.0
