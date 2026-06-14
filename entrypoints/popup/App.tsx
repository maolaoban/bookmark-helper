import React, { useEffect, useCallback, useRef, useState } from 'react';
import SearchInput from './components/SearchInput';
import ResultList from './components/ResultList';
import StatusBar from './components/StatusBar';
import SettingsPanel from './components/SettingsPanel';
import { useSearch } from './hooks/useSearch';
import { useConfig } from './hooks/useConfig';
import { useTheme } from './hooks/useTheme';
import { useIndexStatus } from './hooks/useIndexStatus';
import { formatBytes } from './utils';
import styles from './style.module.css';

const App: React.FC = () => {
  const { query, results, isLoading, error, search, setResults } = useSearch();
  const { config, saveConfig } = useConfig();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultListRef = useRef<HTMLDivElement>(null);

  useTheme(config.theme);

  const { indexStatus, rebuildIndex, loadRecentBookmarks } = useIndexStatus();

  useEffect(() => {
    if (query) return;
    if (indexStatus?.isIndexing) return;
    if (!indexStatus?.lastIndexTime) return;

    loadRecentBookmarks().then(setResults);
  }, [indexStatus?.isIndexing, indexStatus?.lastIndexTime, query, loadRecentBookmarks, setResults]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleOpenBookmark = useCallback((url: string) => {
    chrome.tabs.create({ url });
    window.close();
  }, []);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      search(searchQuery, {
        searchLimit: config.searchLimit,
        similarityThreshold: config.similarityThreshold,
      });
    },
    [search, config.searchLimit, config.similarityThreshold],
  );

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen((prev) => !prev);
  }, []);

  const scrollToSelected = useCallback((index: number) => {
    if (!resultListRef.current) return;
    const items = resultListRef.current.querySelectorAll('[data-index]');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettingsOpen) return;

      const isMac = navigator.platform?.toUpperCase().includes('MAC');
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === 'Escape') {
        if (query) {
          handleSearch('');
          searchInputRef.current?.focus();
        }
        return;
      }

      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev < results.length - 1 ? prev + 1 : 0;
          scrollToSelected(next);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : results.length - 1;
          scrollToSelected(next);
          return next;
        });
      } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleOpenBookmark(results[selectedIndex].url);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    results,
    selectedIndex,
    query,
    isSettingsOpen,
    handleOpenBookmark,
    scrollToSelected,
    handleSearch,
  ]);

  const recentBookmarks =
    !query && !isLoading && results.length > 0 && indexStatus?.lastIndexTime ? results : [];
  const searchResults = query ? results : [];

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <div className={styles.branding}>
          <svg
            className={styles.logo}
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span className={styles.appName}>Bookmark Helper</span>
          <kbd className={styles.shortcutHint}>
            {navigator.platform?.toUpperCase().includes('MAC') ? '\u2318+Shift+L' : 'Ctrl+Shift+L'}
          </kbd>
        </div>
        <SearchInput
          ref={searchInputRef}
          value={query}
          onChange={handleSearch}
          placeholder="搜索你的书签... 支持自然语言描述"
          disabled={indexStatus?.isIndexing || false}
        />
      </div>

      <div className={styles.content} ref={resultListRef}>
        {error && (
          <div className={styles.errorMessage}>
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonItem}>
                <div className={styles.skeletonIndex} />
                <div className={styles.skeletonFavicon} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle} />
                  <div className={styles.skeletonSubtitle} />
                </div>
              </div>
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <ResultList
            results={searchResults}
            onOpen={handleOpenBookmark}
            selectedIndex={selectedIndex}
          />
        ) : query ? (
          <div className={styles.emptyState}>
            <svg
              className={styles.emptyIcon}
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <path d="M8 11h6" />
            </svg>
            <span className={styles.emptyTitle}>未找到相关书签</span>
            <span className={styles.emptyHint}>尝试使用不同的关键词或描述</span>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <svg
              className={styles.emptyIcon}
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span className={styles.emptyTitle}>开始搜索你的书签</span>
            <span className={styles.emptyHint}>输入关键词或用自然语言描述</span>
            {recentBookmarks.length > 0 && (
              <div className={styles.recentSection}>
                <span className={styles.recentDivider}>最近访问</span>
                <ResultList results={recentBookmarks.slice(0, 5)} onOpen={handleOpenBookmark} />
              </div>
            )}
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
