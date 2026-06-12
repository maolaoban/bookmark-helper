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
        {indexStatus && indexStatus.lastIndexTime ? (
          <>
            <span className={styles.statusCount}>
              已索引 {indexStatus.totalBookmarks ?? 0} 个书签
            </span>
            <span className={styles.statusTime}>
              上次更新: {formatTime(indexStatus.lastIndexTime)}
            </span>
          </>
        ) : (
          <span className={styles.statusCount}>未建立索引</span>
        )}
      </div>

      <div className={styles.statusActions}>
        <button className={styles.iconButton} onClick={onRebuild} disabled={isIndexing} title="重建索引">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
            <path
              d="M524.288 25.173333l2.816 2.389334 128 128a21.333333 21.333333 0 0 1 2.432 27.221333l-2.432 2.986667-128 128a21.333333 21.333333 0 0 1-36.138667-11.434667L490.666667 298.666667V213.973333a341.333333 341.333333 0 1 0 317.141333 170.24 42.666667 42.666667 0 0 1 73.898667-42.666666A424.874667 424.874667 0 0 1 938.666667 554.666667c0 235.648-191.018667 426.666667-426.666667 426.666666S85.333333 790.314667 85.333333 554.666667c0-228.48 179.626667-415.018667 405.333334-426.154667V42.666667a21.333333 21.333333 0 0 1 33.621333-17.493334z"
              fill="#000000"
              opacity=".65"
            />
          </svg>
        </button>

        <button className={styles.iconButton} onClick={onOpenSettings} title="设置">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
            <path
              d="M512.25928 704c-108.8 0-192-83.2-192-192s83.2-192 192-192 192 83.2 192 192-83.2 192-192 192z m0-320c-70.4 0-128 57.6-128 128s57.6 128 128 128 128-57.6 128-128-57.6-128-128-128z"
              fill="#333333"
            />
            <path
              d="M640.25928 1024H384.25928c-19.2 0-32-12.8-32-32v-121.6c-25.6-12.8-51.2-25.6-70.4-38.4l-102.4 64c-12.8 6.4-32 6.4-44.8-12.8l-128-224C-6.14072 640 0.25928 620.8 19.45928 614.4l102.4-64v-76.8l-102.4-64C0.25928 403.2-6.14072 384 6.65928 364.8l128-224c6.4-12.8 25.6-19.2 44.8-6.4l102.4 64c19.2-12.8 44.8-32 70.4-38.4V32c0-19.2 12.8-32 32-32h256c19.2 0 32 12.8 32 32v121.6c25.6 12.8 51.2 25.6 70.4 38.4l102.4-64c12.8-6.4 32-6.4 44.8 12.8l128 224c12.8 19.2 6.4 38.4-12.8 44.8l-102.4 64v76.8l102.4 64c12.8 6.4 19.2 25.6 12.8 44.8l-128 224c-6.4 12.8-25.6 19.2-44.8 12.8l-102.4-64c-19.2 12.8-44.8 32-70.4 38.4V992c0 19.2-12.8 32-32 32z m-224-64h192v-108.8c0-12.8 6.4-25.6 19.2-32 32-12.8 64-32 89.6-51.2 12.8-6.4 25.6-6.4 38.4 0l96 57.6 96-166.4-96-57.6c-12.8-12.8-19.2-25.6-12.8-38.4 0-19.2 6.4-32 6.4-51.2s0-32-6.4-51.2c0-12.8 6.4-25.6 12.8-32l96-57.6-96-166.4-96 57.6c-12.8 6.4-25.6 6.4-38.4 0-25.6-19.2-57.6-38.4-89.6-51.2-12.8-12.8-19.2-25.6-19.2-38.4V64H416.25928v108.8c0 12.8-6.4 25.6-19.2 32-32 12.8-64 32-89.6 51.2-12.8 6.4-25.6 6.4-38.4 0l-96-51.2-96 166.4 96 57.6c12.8 6.4 19.2 19.2 12.8 32 0 19.2-6.4 32-6.4 51.2 0 19.2 0 32 6.4 51.2 6.4 12.8 0 25.6-12.8 32l-96 57.6 96 166.4 96-57.6c12.8-6.4 25.6-6.4 38.4 0 25.6 19.2 57.6 38.4 89.6 51.2 12.8 6.4 19.2 19.2 19.2 32V960z"
              fill="#333333"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
