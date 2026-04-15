# Bookmark Helper

## 1. 项目概述

### 1.1 项目名称
Bookmark Helper

### 1.2 项目目标
开发一个 Chrome 浏览器插件，允许用户使用自然语言描述来搜索自己的书签。插件完全在本地运行，不依赖任何云端 API，保护用户隐私。

核心功能包括：

- 自动索引用户所有书签（标题 + URL），生成向量并持久化存储
- 用户输入任意描述（如"我收藏的那个 Python 异步教程"），返回语义最相关的书签列表
- 支持增量更新（书签增删改时自动更新索引）
- 提供简洁美观的弹出窗口界面，结果可一键打开

### 1.3 非功能性目标

| 指标 | 目标 |
|------|------|
| 性能 | 首次索引 1000 个书签耗时 < 30 秒；后续搜索响应 < 1 秒 |
| 内存 | 运行时内存占用 < 200MB |
| 离线可用 | 首次加载模型后，完全离线工作 |
| 兼容性 | Chrome 最新版 + 其他 Chromium 浏览器（Edge、Brave 等） |

---

## 2. 技术选型

| 层次 | 技术 | 理由 |
|------|------|------|
| 插件框架 | WXT | 现代化，支持 React，热更新，自动生成 manifest，开发体验好 |
| UI 框架 | React 18 | 声明式组件，生态丰富 |
| 类型系统 | TypeScript | 提升代码健壮性，便于维护 |
| 向量模型 | Xenova/all-MiniLM-L6-v2 | 轻量（384维），效果好，Transformers.js 原生支持 |
| 向量数据库 | Orama | 纯 JS，支持向量 + 关键词混合检索，轻量易集成 |
| 持久化存储 | IndexedDB (通过 Orama 内置) + chrome.storage.local | Orama 负责向量索引持久化，chrome.storage 存储配置 |
| 构建工具 | Vite (WXT 内置) | 快速 HMR，生产打包优化 |

---

## 3. 系统架构

### 3.1 整体架构图

```
[Popup UI (React)]
        ↕ chrome.runtime.sendMessage
[Background Service Worker]
    ├── Transformers.js Pipeline (嵌入模型)
    ├── Orama DB (向量索引管理)
    └── Chrome Bookmarks API 监听器
              ↕ 读取/监听书签变化
[IndexedDB] ← 存储向量数据库文件
[chrome.storage.local] ← 存储配置、上次索引时间等
```

### 3.2 模块划分

#### 模块1：模型管理模块 (ModelManager)
负责加载、缓存嵌入模型。

对外提供 `generateEmbedding(text: string): Promise<number[]>` 方法。

#### 模块2：书签索引模块 (BookmarkIndexer)
- 遍历 `chrome.bookmarks.getTree()` 获取所有书签（过滤文件夹）
- 将每个书签的 title + url 送入模型生成向量
- 调用 Orama 的 insert 批量写入
- 索引完成后将数据库快照保存到 IndexedDB

#### 模块3：搜索模块 (SearchEngine)
- 接收用户查询文本，生成查询向量
- 调用 Orama 的向量搜索（支持相似度阈值、返回 top K）
- 返回包含书签完整信息（id, title, url, similarity）的结果集

#### 模块4：同步模块 (SyncManager)
- 监听 `chrome.bookmarks.onCreated`, `onRemoved`, `onChanged`, `onMoved` 事件
- 增量更新索引（插入、删除、修改对应文档），避免全量重建
- 若短时间内大量变化（如导入书签），触发节流后的全量重建

#### 模块5：通信层 (MessageHandler)
- 在 background 中监听 `runtime.onMessage`，处理来自 popup 的 search 请求
- 也用于 popup 查询索引状态（如是否正在构建）

#### 模块6：UI 层 (React Components)
| 组件 | 功能 |
|------|------|
| SearchInput | 输入框，防抖处理 |
| ResultList | 展示搜索结果，包含相似度百分比，点击打开书签 |
| StatusBar | 显示索引状态（如"正在索引 120/1500 书签"） |