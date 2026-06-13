import React, { useCallback } from 'react';
import type { SearchResult } from '../../../types';
import styles from './ResultList.module.css';

interface ResultListProps {
  results: SearchResult[];
  onOpen: (url: string) => void;
  selectedIndex?: number;
}

const ResultList: React.FC<ResultListProps> = ({ results, onOpen, selectedIndex = -1 }) => {
  const getFaviconUrl = useCallback((u: string) => {
    const url = new URL(chrome.runtime.getURL('/_favicon/'));
    url.searchParams.set('pageUrl', u);
    url.searchParams.set('size', '16');
    return url.toString();
  }, []);

  const getDomain = useCallback((u: string) => {
    try {
      const url = new URL(u);
      return url.hostname;
    } catch {
      return u;
    }
  }, []);

  const getInitial = useCallback((title: string) => {
    return title?.charAt(0)?.toUpperCase() || '?';
  }, []);

  const getSimilarityClass = useCallback((similarity: number) => {
    if (similarity >= 0.8) return styles.similarityHigh;
    if (similarity >= 0.6) return styles.similarityMedium;
    return styles.similarityLow;
  }, []);

  const escapeHtml = useCallback((text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }, []);

  return (
    <div className={styles.resultList}>
      {results.map((result, index) => (
        <div
          key={result.id}
          className={`${styles.bookmarkItem} ${selectedIndex === index ? styles.bookmarkItemSelected : ''}`}
          onClick={() => onOpen(result.url)}
          title={escapeHtml(result.title)}
          data-index={index}
        >
          <div className={styles.bookmarkHeader}>
            <span className={styles.bookmarkIndex}>{index + 1}</span>
            <div className={styles.bookmarkFaviconWrapper}>
              <img
                className={styles.bookmarkFavicon}
                src={getFaviconUrl(result.url)}
                alt=""
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  const fallback = img.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <span className={styles.bookmarkFaviconFallback} style={{ display: 'none' }}>
                {getInitial(result.title)}
              </span>
            </div>
            <span className={styles.bookmarkTitle}>{escapeHtml(result.title)}</span>
            {result.similarity > 0 && (
              <span
                className={`${styles.similarityBadge} ${getSimilarityClass(result.similarity)}`}
              >
                {Math.round(result.similarity * 100)}%
              </span>
            )}
          </div>
          <div className={styles.bookmarkMeta}>
            <span className={styles.bookmarkDomain}>{getDomain(result.url)}</span>
            <span className={styles.bookmarkPath}>{result.path}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultList;
