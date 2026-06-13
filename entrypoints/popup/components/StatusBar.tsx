import React from "react";
import type { IndexStatus } from "../../../types";
import styles from "./StatusBar.module.css";

type StatusBarProps = {
  indexStatus: IndexStatus | null;
  isIndexing: boolean;
  onRebuild: () => void;
  onOpenSettings: () => void;
};

const StatusBar: React.FC<StatusBarProps> = ({
  indexStatus,
  isIndexing,
  onRebuild,
  onOpenSettings,
}) => {
  const formatTime = (timestamp?: number | null) => {
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
    <div className={styles.statusBar}>
      <div className={styles.statusInfo}>
        <div className={styles.statusIndicator}>
          <span
            className={`${styles.statusDot} ${isIndexing ? styles.statusDotIndexing : styles.statusDotNormal}`}
          />
          {indexStatus && indexStatus.lastIndexTime ? (
            <div className={styles.statusText}>
              <span className={styles.statusCount}>
                {indexStatus.totalBookmarks ?? 0} 个书签
              </span>
              <span className={styles.statusTime}>
                更新于 {formatTime(indexStatus.lastIndexTime)}
              </span>
            </div>
          ) : (
            <div className={styles.statusText}>
              <span className={styles.statusCount}>未建立索引</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.statusActions}>
        <button
          className={styles.iconButton}
          onClick={onRebuild}
          disabled={isIndexing}
          title="重建索引"
        >
          <svg
            className={`${styles.refreshIcon} ${isIndexing ? styles.refreshIconSpinning : ""}`}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>

        <button
          className={`${styles.iconButton} ${styles.iconButtonWithLabel}`}
          onClick={onOpenSettings}
          title="设置"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className={styles.buttonLabel}>设置</span>
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
