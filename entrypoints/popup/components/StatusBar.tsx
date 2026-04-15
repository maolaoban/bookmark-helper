import React from "react";
import type { IndexStatus } from "../../../types";

interface StatusBarProps {
  indexStatus: IndexStatus | null;
  isIndexing: boolean;
  onRebuild: () => void;
  onOpenSettings: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  indexStatus,
  isIndexing,
  onRebuild,
  onOpenSettings,
}) => {
  // 格式化时间
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "未知";
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="status-bar">
      <div className="status-info">
        {isIndexing ? (
          <span className="status-indexing">
            <span className="spinner-small"></span>
            正在索引...
          </span>
        ) : indexStatus ? (
          <>
            <span className="status-count">
              已索引 {indexStatus.totalBookmarks} 个书签
            </span>
            <span className="status-time">
              上次更新: {formatTime(indexStatus.lastIndexTime)}
            </span>
          </>
        ) : (
          <span className="status-count">未建立索引</span>
        )}
      </div>

      <div className="status-actions">
        <button
          className="icon-button"
          onClick={onRebuild}
          disabled={isIndexing}
          title="重建索引"
        >
          <svg viewBox="0 0 1024 1024" width="16" height="16">
            <path
              d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-204.8 0-372-167.2-372-372s167.2-372 372-372 372 167.2 372 372-167.2 372-372 372zm52-392c-27.2 0-49.4 22.2-49.4 49.4V500c0 27.2 22.2 49.4 49.4 49.4s49.4-22.2 49.4-49.4v-58.6c0-27.2-22.2-49.4-49.4-49.4zm0 147.2c-27.2 0-49.4 22.2-49.4 49.4s22.2 49.4 49.4 49.4 49.4-22.2 49.4-49.4-22.2-49.4-49.4-49.4z"
              fill="currentColor"
            />
          </svg>
        </button>

        <button className="icon-button" onClick={onOpenSettings} title="设置">
          <svg viewBox="0 0 1024 1024" width="16" height="16">
            <path
              d="M1072.1 406.2c-6.3-33.5-26.8-55.1-52-55.1-0.3 0-0.7 0-0.8 0l-4.7 0c-73.1 0-132.6-59.5-132.6-132.6 0-23.7 11.4-50.3 11.5-50.6 13.1-29.5 3-65.7-23.4-84.1l-1.6-1.1-134.4-74.7-1.7-0.7c-8.8-3.8-18.3-5.7-28.5-5.7-20.8 0-41.2 8.3-54.7 22.3-14.7 15.2-65.6 58.6-104.7 58.6-39.5 0-90.6-44.3-105.4-59.8-13.5-14.2-34.1-22.8-55.1-22.8-9.9 0-19.4 1.9-28 5.5l-1.7 0.7-139.1 76.4-1.6 1.1c-26.5 18.4-36.7 54.6-23.6 84.1 0.1 0.3 11.6 26.7 11.6 50.6 0 73.1-59.5 132.6-132.6 132.6l-4.6 0c-0.3 0-0.6 0-0.9 0-25.3 0-45.7 21.6-52 55.1-0.5 2.5-11.3 60.6-11.3 106.1 0 45.5 10.9 103.7 11.3 106.1 6.3 33.5 26.8 55.1 52 55.1 0.3 0 0.7 0 0.8 0l4.7 0c73.1 0 132.6 59.5 132.6 132.6 0 23.8-11.4 50.3-11.5 50.6-13.1 29.5-3 65.7 23.4 84.1l1.6 1.1 131.8 73.7 1.7 0.7c8.8 3.8 18.3 5.7 28.5 5.7 21.1 0 41.7-8.7 55.1-23.3 18.7-20.3 69.5-62.4 107-62.4 40.6 0 92.7 47.1 107.8 63.6 13.4 14.8 34.2 23.7 55.5 23.7l0 0c9.9 0 19.3-1.9 27.9-5.6l1.7-0.7 136.7-75.5 1.6-1.1c26.5-18.5 36.6-54.6 23.5-84-0.1-0.3-11.6-27.1-11.6-50.7 0-73.1 59.5-132.6 132.6-132.6l4.5 0c0.3 0 0.6 0 0.9 0 25.3 0 45.8-21.6 52.1-55.1 0.1-0.6 11.3-59.5 11.3-106.1-0.1-45.4-11.2-103.6-11.4-106z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
