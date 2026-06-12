import React, { useEffect, useCallback } from "react";
import SearchInput from "./components/SearchInput";
import ResultList from "./components/ResultList";
import StatusBar from "./components/StatusBar";
import SettingsPanel from "./components/SettingsPanel";
import { useSearch } from "./hooks/useSearch";
import { useConfig } from "./hooks/useConfig";
import { useTheme } from "./hooks/useTheme";
import { useIndexStatus } from "./hooks/useIndexStatus";
import { formatBytes } from "./utils";
import styles from "./style.module.css";

const App: React.FC = () => {
  const { query, results, isLoading, error, search, setResults } = useSearch();
  const { config, saveConfig } = useConfig();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  useTheme(config.theme);

  const { indexStatus, rebuildIndex, loadRecentBookmarks } = useIndexStatus();

  // 索引完成后展示最新书签
  useEffect(() => {
    if (query) return;
    if (indexStatus?.isIndexing) return;
    if (!indexStatus?.lastIndexTime) return;

    loadRecentBookmarks().then(setResults);
  }, [indexStatus?.isIndexing, indexStatus?.lastIndexTime, query, loadRecentBookmarks, setResults]);

  const handleOpenBookmark = useCallback((url: string) => {
    chrome.tabs.create({ url });
    window.close();
  }, []);

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen((prev) => !prev);
  }, []);

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <SearchInput
          value={query}
          onChange={search}
          placeholder="用自然语言描述你想找的书签..."
          disabled={indexStatus?.isIndexing || false}
        />
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorMessage}>{error}</div>}

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <span>搜索中...</span>
          </div>
        ) : results.length > 0 ? (
          <ResultList results={results} onOpen={handleOpenBookmark} />
        ) : query ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} viewBox="0 0 1024 1024" width="64" height="64">
              <path
                d="M832 981.333333a21.333333 21.333333 0 0 1-11.333333-3.24l-330-206.266666-330 206.266666a21.333333 21.333333 0 0 1-32.666667-18.093333V181.333333a53.393333 53.393333 0 0 1 53.333333-53.333333h618.666667a53.393333 53.393333 0 0 1 53.333333 53.333333v778.666667a21.333333 21.333333 0 0 1-21.333333 21.333333z"
                fill="#707070"
              />
            </svg>
            <span>未找到相关书签</span>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>输入关键词或描述来搜索书签</span>
          </div>
        )}
      </div>

      {indexStatus?.isIndexing && (
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar}>
            {(indexStatus.totalBookmarks ?? 0) > 0 ? (
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.round(
                    ((indexStatus.indexedBookmarks ?? 0) / (indexStatus.totalBookmarks || 1)) * 100,
                  )}%`,
                }}
              />
            ) : (
              <div className={styles.progressBarIndeterminate} />
            )}
          </div>
          <span className={styles.progressText}>
            {indexStatus.phase === "loading_model"
              ? `正在下载模型... ${formatBytes(indexStatus.indexedBookmarks ?? 0)} / ${formatBytes(indexStatus.totalBookmarks ?? 0)}`
              : (indexStatus.totalBookmarks ?? 0) > 0
                ? `正在索引书签: ${indexStatus.indexedBookmarks ?? 0} / ${indexStatus.totalBookmarks ?? 0}`
                : "正在准备索引..."}
          </span>
        </div>
      )}

      <StatusBar
        indexStatus={indexStatus}
        isIndexing={indexStatus?.isIndexing || false}
        onRebuild={rebuildIndex}
        onOpenSettings={toggleSettings}
      />

      {isSettingsOpen && (
        <SettingsPanel config={config} onSave={saveConfig} onClose={toggleSettings} />
      )}
    </div>
  );
};

export default App;
