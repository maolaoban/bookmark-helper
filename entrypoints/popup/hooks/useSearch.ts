import { useState, useCallback } from "react";
import type { SearchResult } from "../../../types";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string, config?: { searchLimit?: number; similarityThreshold?: number }) => {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await chrome.runtime.sendMessage({
        type: "search",
        query: searchQuery,
        limit: config?.searchLimit ?? 20,
        threshold: config?.similarityThreshold ?? 0.3,
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

  return {
    query,
    results,
    isLoading,
    error,
    search,
    setResults,
  };
}
