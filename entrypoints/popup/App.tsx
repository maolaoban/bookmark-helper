import React, { useState, useEffect, useCallback } from "react";
import SearchInput from "./components/SearchInput";
import ResultList from "./components/ResultList";
import StatusBar from "./components/StatusBar";
import SettingsPanel from "./components/SettingsPanel";
import type { SearchResult, IndexStatus } from "../../types";

// 默认配置
const DEFAULT_CONFIG = {
  theme: "system" as const,
  sortBy: "dateAdded" as const,
};

const App: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [error, setError] = useState<string | null>(null);

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const stored = await chrome.storage.local.get(["config"]);
        if (stored.config) {
          setConfig(stored.config);
        }
      } catch (e) {
        console.error("加载配置失败:", e);
      }
    };
    loadConfig();
  }, []);

  // 应用主题
  useEffect(() => {
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
    applyTheme();

    // 监听系统主题变化
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [config.theme]);

  // 获取索引状态
  const fetchIndexStatus = useCallback(async () => {
    try {
      const status = await chrome.runtime.sendMessage({
        type: "get-index-status",
      });
      setIndexStatus(status);
      setIsIndexing(status.isIndexing);
    } catch (e) {
      console.error("获取索引状态失败:", e);
    }
  }, []);

  // 首次加载时获取状态
  useEffect(() => {
    fetchIndexStatus();
  }, [fetchIndexStatus]);

  // 处理搜索
  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      setResults([]);
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

  // 处理重建索引
  const handleRebuildIndex = useCallback(async () => {
    setIsIndexing(true);
    setError(null);

    try {
      await chrome.runtime.sendMessage({ type: "rebuild-index" });
      await fetchIndexStatus();
    } catch (e) {
      console.error("重建索引失败:", e);
      setError(e instanceof Error ? e.message : "重建索引失败");
    } finally {
      setIsIndexing(false);
    }
  }, [fetchIndexStatus]);

  // 打开书签
  const handleOpenBookmark = useCallback((url: string) => {
    chrome.tabs.create({ url });
    window.close();
  }, []);

  // 切换设置面板
  const toggleSettings = useCallback(() => {
    setIsSettingsOpen((prev) => !prev);
  }, []);

  // 保存设置
  const handleSaveSettings = useCallback(
    async (newConfig: typeof DEFAULT_CONFIG) => {
      try {
        await chrome.storage.local.set({ config: newConfig });
        setConfig(newConfig);
      } catch (e) {
        console.error("保存设置失败:", e);
      }
    },
    [],
  );

  return (
    <div className="app">
      <div className="header">
        <SearchInput
          value={query}
          onChange={handleSearch}
          placeholder="用自然语言描述你想找的书签..."
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

      <StatusBar
        indexStatus={indexStatus}
        isIndexing={isIndexing}
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
