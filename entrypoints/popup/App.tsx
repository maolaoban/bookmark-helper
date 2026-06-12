import React, { useState, useEffect, useCallback } from "react";
import SearchInput from "./components/SearchInput";
import ResultList from "./components/ResultList";
import StatusBar from "./components/StatusBar";
import SettingsPanel from "./components/SettingsPanel";
import type {
  SearchResult,
  IndexStatus,
  AppConfig,
} from "../../types";

const DEFAULT_CONFIG: AppConfig = {
  theme: "system",
  sortBy: "dateAdded",
  autoIndex: true,
  indexThreshold: 0.6,
  searchLimit: 20,
  similarityThreshold: 0.3,
};

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

const App: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [error, setError] = useState<string | null>(null);

  const getConfigAsync = async () => {
    try {
      const stored = await chrome.storage.local.get(["config"]);
      if (stored.config) {
        setConfig(stored.config as AppConfig);
      }
    } catch (e) {
      console.error("加载配置失败:", e);
    }
  };

  const applyTheme = () => {
    const html = document.documentElement;
    if (config.theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      html.classList.toggle("dark", prefersDark);
    } else {
      html.classList.toggle("dark", config.theme === "dark");
    }
  };

  useEffect(() => {
    getConfigAsync();
    applyTheme();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [config.theme]);

  // 通过 Port 接收 background 推送的索引状态
  useEffect(() => {
    const port = chrome.runtime.connect({ name: "popup" });
    port.onMessage.addListener((msg) => {
      if (msg.type === "index-status") {
        setIndexStatus(msg.payload);
      }
    });
    return () => port.disconnect();
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await chrome.runtime.sendMessage({
        type: "search",
        query: searchQuery,
        limit: 20,
        threshold: 0.3,
      });

      if (Array.isArray(searchResults)) {
        setResults(searchResults);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error("搜索失败:", e);
      setError(e instanceof Error ? e.message : "搜索失败");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 索引完成后展示最新书签
  useEffect(() => {
    if (query) return;
    if (indexStatus?.isIndexing) return;
    if (!indexStatus?.lastIndexTime) return;

    chrome.bookmarks.getRecent(20, (recent) => {
      const mapped: SearchResult[] = recent
        .filter((b) => b.url)
        .map((b) => ({
          id: b.id,
          title: b.title || "无标题",
          url: b.url!,
          similarity: 0,
        }));
      setResults(mapped);
    });
  }, [indexStatus?.isIndexing, indexStatus?.lastIndexTime, query]);

  const handleRebuildIndex = useCallback(async () => {
    setIndexStatus((prev) => ({
      isIndexing: true,
      totalBookmarks: prev?.totalBookmarks ?? 0,
      indexedBookmarks: prev?.indexedBookmarks ?? 0,
      lastIndexTime: prev?.lastIndexTime,
    }));
    setError(null);

    try {
      await chrome.runtime.sendMessage({ type: "rebuild-index" });
    } catch (e) {
      console.error("重建索引失败:", e);
      setError(e instanceof Error ? e.message : "重建索引失败");
      setIndexStatus((prev) => prev ? { ...prev, isIndexing: false } : null);
    }
  }, []);

  const handleOpenBookmark = useCallback((url: string) => {
    chrome.tabs.create({ url });
    window.close();
  }, []);

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen((prev) => !prev);
  }, []);

  const handleSaveSettings = async (newConfig: typeof DEFAULT_CONFIG) => {
    try {
      await chrome.storage.local.set({ config: newConfig });
      setConfig(newConfig);
    } catch (e) {
      console.error("保存设置失败:", e);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <SearchInput
          value={query}
          onChange={handleSearch}
          placeholder="用自然语言描述你想找的书签..."
          disabled={indexStatus?.isIndexing || false}
        />
      </div>

      <div className="content">
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>搜索中...</span>
          </div>
        ) : results.length > 0 ? (
          <ResultList results={results} onOpen={handleOpenBookmark} />
        ) : query ? (
          <div className="empty-state">
            <svg
              className="empty-icon"
              viewBox="0 0 1024 1024"
              width="64"
              height="64"
            >
              <path
                d="M832 981.333333a21.333333 21.333333 0 0 1-11.333333-3.24l-330-206.266666-330 206.266666a21.333333 21.333333 0 0 1-32.666667-18.093333V181.333333a53.393333 53.393333 0 0 1 53.333333-53.333333h618.666667a53.393333 53.393333 0 0 1 53.333333 53.333333v778.666667a21.333333 21.333333 0 0 1-21.333333 21.333333z"
                fill="#707070"
              />
            </svg>
            <span>未找到相关书签</span>
          </div>
        ) : (
          <div className="empty-state">
            <span>输入关键词或描述来搜索书签</span>
          </div>
        )}
      </div>

      {indexStatus?.isIndexing && (
        <div className="progress-bar-container">
          <div className="progress-bar">
            {(indexStatus.totalBookmarks ?? 0) > 0 ? (
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.round(
                    ((indexStatus.indexedBookmarks ?? 0) / (indexStatus.totalBookmarks || 1)) * 100
                  )}%`,
                }}
              />
            ) : (
              <div className="progress-bar-indeterminate" />
            )}
          </div>
          <span className="progress-text">
            {indexStatus.phase === 'loading_model'
              ? `正在下载模型... ${formatBytes(indexStatus.indexedBookmarks ?? 0)} / ${formatBytes(indexStatus.totalBookmarks ?? 0)}`
              : (indexStatus.totalBookmarks ?? 0) > 0
                ? `正在索引书签: ${indexStatus.indexedBookmarks ?? 0} / ${indexStatus.totalBookmarks ?? 0}`
                : '正在准备索引...'}
          </span>
        </div>
      )}

      <StatusBar
        indexStatus={indexStatus}
        isIndexing={indexStatus?.isIndexing || false}
        onRebuild={handleRebuildIndex}
        onOpenSettings={toggleSettings}
      />

      {isSettingsOpen && (
        <SettingsPanel
          config={config}
          onSave={handleSaveSettings}
          onClose={toggleSettings}
        />
      )}
    </div>
  );
};

export default App;
