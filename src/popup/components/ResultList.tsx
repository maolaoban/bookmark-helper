import React, { useCallback } from 'react';
import type { SearchResult } from '../../types';

interface ResultListProps {
  results: SearchResult[];
  onOpen: (url: string) => void;
}

const ResultList: React.FC<ResultListProps> = ({ results, onOpen }) => {
  // 获取 favicon URL
  const getFaviconUrl = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return '';
    }
  }, []);

  // 格式化相似度为百分比
  const formatSimilarity = useCallback((similarity: number) => {
    return `${Math.round(similarity * 100)}%`;
  }, []);

  // 转义 HTML
  const escapeHtml = useCallback((text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }, []);

  return (
    <div className="result-list">
      {results.map((result) => (
        <div
          key={result.id}
          className="bookmark-item"
          onClick={() => onOpen(result.url)}
          title={escapeHtml(result.title)}
        >
          <div className="bookmark-main">
            <img
              className="bookmark-favicon"
              src={getFaviconUrl(result.url)}
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="bookmark-content">
              <span className="bookmark-title">{escapeHtml(result.title)}</span>
              <span className="bookmark-url">{escapeHtml(result.url)}</span>
              {result.path && (
                <span className="bookmark-path">{escapeHtml(result.path)}</span>
              )}
            </div>
          </div>
          <div className="bookmark-similarity">
            <div
              className="similarity-bar"
              style={{ width: formatSimilarity(result.similarity) }}
            />
            <span className="similarity-text">
              {formatSimilarity(result.similarity)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultList;