# Bookmark Helper

## 1. 项目概述

### 1.1 项目名称
Bookmark Helper

### 1.2 项目目标
开发一个 Chrome 浏览器插件，允许用户使用自然语言描述来搜索自己的书签。插件完全在本地运行，不依赖任何云端 API，保护用户隐私。

核心功能包括：

- 自动索引用户所有书签（标题 + URL），生成向量并持久化存储
- 混合搜索：向量语义搜索 + BM25 关键词搜索，结合后处理重排序，提升搜索准确率
- 自适应查询权重：根据查询类型（关键词/语义/混合）动态调整文本与向量搜索的权重比例
- 支持增量更新（书签增删改时自动更新索引）
- 页面元数据自动增强：浏览页面时自动提取 meta 信息，丰富书签索引文本
- 提供简洁美观的弹出窗口界面，结果可一键打开
- 多语言支持：界面支持中文和英文，可在设置中切换

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
| UI 框架 | React 19 | 声明式组件，生态丰富 |
| 类型系统 | TypeScript (strict mode) | 提升代码健壮性，便于维护 |
| 向量模型 | Xenova/gte-small | 384 维，英文语义效果好，Transformers.js 原生支持 |
| 向量数据库 | Orama | 纯 JS，支持向量 + 关键词混合检索 (MODE_HYBRID_SEARCH)，轻量易集成 |
| 国际化 | i18next + react-i18next | 轻量 i18n 方案，支持中英文切换 |
| 持久化存储 | IndexedDB (通过 Orama 内置) + chrome.storage.local + chrome.storage.session | Orama 负责向量索引持久化，chrome.storage.local 存储配置及索引版本号，chrome.storage.session 存储索引进度（防 SW 重启丢失） |
| 构建工具 | Vite (WXT 内置) | 快速 HMR，生产打包优化 |
| 代码规范 | ESLint + Prettier | 统一代码风格，提升可维护性 |
| 测试框架 | Vitest | 单元测试，保证代码质量 |
| 样式方案 | CSS Modules | 局部作用域，避免样式冲突 |

---

## 3. 系统架构

### 3.1 整体架构图

```
[Popup UI (React + CSS Modules)]
      ↕ chrome.runtime.connect / sendMessage
[Background Service Worker]
    ├── Container (依赖注入容器)
    ├── PortManager (Port 连接管理)
    ├── MessageHandler (消息路由)
    ├── Keepalive (SW 保活，防索引期间被杀)
    ├── Transformers.js Pipeline (嵌入模型: gte-small)
    ├── Orama DB (向量索引管理，混合搜索)
    ├── SearchEngine (查询检测 + 混合搜索 + 重排序)
    ├── SyncManager (书签变化监听)
    └── ErrorHandler (重试机制)
            ↕ 读取/监听书签变化
[Content Script] → 自动提取页面 meta/og 元数据 → Background 增强索引
[IndexedDB] ← 存储 Orama 向量数据库快照
[chrome.storage.local] ← 存储配置、索引版本号、上次索引时间等
[chrome.storage.session] ← 存储索引进度（SW 重启恢复）
```

### 3.2 目录结构

```
bookmark-helper/
├── core/                          # 核心业务逻辑
│   ├── model-manager.ts           # 模型管理（自动检测 HuggingFace 镜像）
│   ├── bookmark-indexer.ts        # 书签索引
│   ├── search-engine.ts           # 搜索引擎
│   ├── sync-manager.ts            # 同步管理
│   ├── text-preprocessor.ts       # 文本预处理
│   ├── container.ts               # 依赖注入容器
│   ├── message-handler.ts         # 消息处理
│   ├── message-protocol.ts        # 消息协议
│   ├── port-manager.ts            # Port 管理
│   ├── keepalive.ts               # SW 保活（索引期间防被杀）
│   ├── error-handler.ts           # 错误处理
│   ├── utils.ts                   # 工具函数
│   └── __tests__/                 # 单元测试
├── entrypoints/
│   ├── background.ts              # Service Worker
│   ├── content.ts                 # Content Script
│   └── popup/                     # 弹出窗口
│       ├── App.tsx
│       ├── main.tsx
│       ├── globals.css            # 全局样式
│       ├── style.module.css       # App 样式
│       ├── utils.ts               # 工具函数
│       ├── hooks/                 # 自定义 Hooks
│       │   ├── useSearch.ts
│       │   ├── useConfig.ts
│       │   ├── useTheme.ts
│       │   └── useIndexStatus.ts
│       ├── i18n/                  # 国际化
│       │   ├── index.ts           # i18n 配置
│       │   └── locales/           # 翻译文件
│       │       ├── zh-CN.json
│       │       └── en.json
│       └── components/            # 组件 + CSS Modules
│           ├── SearchInput.tsx
│           ├── ResultList.tsx
│           ├── StatusBar.tsx
│           └── SettingsPanel.tsx
├── types/                         # 类型定义
├── eslint.config.js               # ESLint 配置
├── .prettierrc                    # Prettier 配置
├── vitest.config.ts               # Vitest 配置
└── wxt.config.ts                  # WXT 配置
```

### 3.3 模块划分

#### 核心模块 (core/)

| 模块 | 文件 | 职责 |
|------|------|------|
| 模型管理 | `model-manager.ts` | 加载、缓存嵌入模型，自动检测 HuggingFace 镜像（国内网络友好） |
| 书签索引 | `bookmark-indexer.ts` | 遍历书签、生成向量、Orama 索引管理、增量更新、混合搜索 |
| 搜索引擎 | `search-engine.ts` | 查询类型检测、自适应权重、混合搜索、后处理重排序 |
| 同步管理 | `sync-manager.ts` | 监听书签变化事件，增量更新索引 |
| 文本预处理 | `text-preprocessor.ts` | URL 解析、嵌入文本构建、增强文本构建 |
| 依赖注入 | `container.ts` | 管理核心模块的实例创建和依赖关系 |
| 消息处理 | `message-handler.ts` | 处理 popup ↔ background 消息 |
| 消息协议 | `message-protocol.ts` | 统一消息类型定义和通信方式 |
| Port 管理 | `port-manager.ts` | 管理 popup 与 background 的持久连接 |
| SW 保活 | `keepalive.ts` | 索引期间通过 chrome.alarms 保持 Service Worker 存活 |
| 错误处理 | `error-handler.ts` | 重试机制（指数退避） |
| 工具函数 | `utils.ts` | 书签路径获取等 |

#### UI 模块 (entrypoints/popup/)

| 模块 | 文件 | 职责 |
|------|------|------|
| App | `App.tsx` | 主组件，编排所有子组件 |
| SearchInput | `components/SearchInput.tsx` | 搜索输入框，防抖处理 |
| ResultList | `components/ResultList.tsx` | 搜索结果列表，相似度显示 |
| StatusBar | `components/StatusBar.tsx` | 状态栏，索引状态显示 |
| SettingsPanel | `components/SettingsPanel.tsx` | 设置面板（含语言切换） |
| i18n | `i18n/index.ts` | 国际化配置，语言切换 |

#### 自定义 Hooks

| Hook | 文件 | 职责 |
|------|------|------|
| useSearch | `hooks/useSearch.ts` | 搜索逻辑封装 |
| useConfig | `hooks/useConfig.ts` | 配置管理 |
| useTheme | `hooks/useTheme.ts` | 主题切换 |
| useIndexStatus | `hooks/useIndexStatus.ts` | 索引状态管理 |

---

## 4. 开发指南

### 4.1 环境要求

- Node.js >= 18
- pnpm >= 8

### 4.2 安装依赖

```bash
pnpm install
```

### 4.3 开发命令

```bash
# 启动开发服务器（Chrome）
pnpm dev

# 启动开发服务器（Firefox）
pnpm dev:firefox

# 构建生产版本
pnpm build

# 打包扩展
pnpm zip
```

### 4.4 代码规范

```bash
# 检查代码规范
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化代码
pnpm format

# 检查格式
pnpm format:check
```

### 4.5 测试

```bash
# 运行测试
pnpm test:run

# 监听模式
pnpm test

# 生成覆盖率报告
pnpm test:coverage
```

### 4.6 类型检查

```bash
pnpm compile
```

---

## 5. 网络优化与 Service Worker 生命周期

### 5.1 HuggingFace 镜像自动检测

模型下载支持自动检测网络环境：

- 首次加载模型时，向 `huggingface.co` 发送 HEAD 请求（3 秒超时）
- 可达 → 使用 HuggingFace 原站
- 不可达 → 自动切换到 `hf-mirror.com` 镜像站
- 检测结果缓存，仅执行一次

### 5.2 Service Worker 保活

Chrome MV3 的 Service Worker 在空闲时会被终止。索引构建（模型下载 + 向量生成）可能耗时较长，需要保活机制：

- 使用 `chrome.alarms` 每 25 秒触发一次，重置 SW 空闲计时器
- 索引完成后自动停止保活
- 权限：`alarms`

### 5.3 索引进度持久化

索引进度存储在 `chrome.storage.session`（浏览器关闭时自动清除）：

- 开始索引时写入 `{ isIndexing: true, phase, current, total }`
- 每批次处理后更新进度
- 索引完成后清除
- SW 重启时读取，恢复索引状态报告

---

## 6. 索引版本管理

- 索引版本号定义在 `entrypoints/background.ts` 中的 `INDEX_VERSION` 常量
- 启动时检查 `chrome.storage.local` 中的 `indexVersion`，版本不匹配时自动全量重建索引
- 当前版本：`2`（含文本预处理优化）

---

## 7. 架构设计原则

### 7.1 依赖注入
使用简单的依赖注入容器（`container.ts`）管理核心模块实例，避免硬编码单例，便于测试和维护。

### 7.2 模块化
- 核心逻辑与 UI 分离
- 单一职责原则
- 统一的消息通信协议

### 7.3 样式隔离
使用 CSS Modules 实现样式局部作用域，避免全局样式冲突。

### 7.4 错误处理
- 重试机制（指数退避）
- 优雅降级
- 详细的错误日志

### 7.5 类型安全
- TypeScript strict mode
- 完整的类型定义
- 最小化类型断言
