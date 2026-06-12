import React, { useCallback } from "react";
import type { SearchResult } from "../../../types";
import styles from "./ResultList.module.css";

interface ResultListProps {
  results: SearchResult[];
  onOpen: (url: string) => void;
}

const ResultList: React.FC<ResultListProps> = ({ results, onOpen }) => {
  const getFaviconUrl = useCallback((u: string) => {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "16");
    return url.toString();
  }, []);

  const formatSimilarity = useCallback((similarity: number) => {
    return `${Math.round(similarity * 100)}%`;
  }, []);

  const escapeHtml = useCallback((text: string) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }, []);

  return (
    <div className={styles.resultList}>
      {results.map((result) => (
        <div
          key={result.id}
          className={styles.bookmarkItem}
          onClick={() => onOpen(result.url)}
          title={escapeHtml(result.title)}
        >
          <div className={styles.bookmarkMain}>
            <img
              className={styles.bookmarkFavicon}
              src={getFaviconUrl(result.url)}
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className={styles.bookmarkTitle}>{escapeHtml(result.title)}</span>
          </div>
          <div className={styles.bookmarkUrl}>{escapeHtml(result.url)}</div>
          {result.path && <div className={styles.bookmarkPath}>{result.path}</div>}
          <div className={styles.bookmarkSimilarity}>
            <div
              className={styles.similarityBar}
              style={{ width: formatSimilarity(result.similarity) }}
            />
            <span className={styles.similarityText}>{formatSimilarity(result.similarity)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultList;
