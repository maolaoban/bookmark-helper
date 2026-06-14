import { useState, useEffect, useCallback } from "react";
import type { IndexStatus, SearchResult } from "../../../types";

export function useIndexStatus() {
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "popup" });
    port.onMessage.addListener((msg) => {
      if (msg.type === "index-status") {
        setIndexStatus(msg.payload);
      }
    });
    // 主动查询一次当前状态（SW 重启后恢复）
    chrome.runtime.sendMessage({ type: "get-index-status" }).then((status) => {
      if (status && typeof status === "object" && "isIndexing" in status) {
        setIndexStatus(status as IndexStatus);
      }
    }).catch(() => {});
    return () => port.disconnect();
  }, []);

  const rebuildIndex = useCallback(async () => {
    setIndexStatus((prev) => ({
      isIndexing: true,
      totalBookmarks: prev?.totalBookmarks ?? 0,
      indexedBookmarks: prev?.indexedBookmarks ?? 0,
      lastIndexTime: prev?.lastIndexTime,
    }));

    try {
      await chrome.runtime.sendMessage({ type: "rebuild-index" });
    } catch (e) {
      console.error("重建索引失败:", e);
      setIndexStatus((prev) => (prev ? { ...prev, isIndexing: false } : null));
    }
  }, []);

  const loadRecentBookmarks = useCallback(async (): Promise<SearchResult[]> => {
    return new Promise((resolve) => {
      chrome.bookmarks.getRecent(20, (recent) => {
        const results = recent
          .filter((b) => b.url)
          .map((b) => ({
            id: b.id,
            title: b.title || "无标题",
            url: b.url!,
            similarity: 0,
          }));
        resolve(results);
      });
    });
  }, []);

  return {
    indexStatus,
    rebuildIndex,
    loadRecentBookmarks,
  };
}
