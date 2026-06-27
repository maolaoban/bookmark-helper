import { useState, useCallback, useEffect } from "react";
import type { AppConfig } from "../../../types";
import { changeLanguage } from "../i18n";

const DEFAULT_CONFIG: AppConfig = {
  theme: "system",
  locale: "system",
  sortBy: "dateAdded",
  autoIndex: true,
  indexThreshold: 0.6,
  searchLimit: 20,
  similarityThreshold: 0.3,
  metadataExpiryDays: 7,
};

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const stored = await chrome.storage.local.get(["config"]);
        if (stored.config) {
          const loadedConfig = stored.config as AppConfig;
          setConfig(loadedConfig);
          changeLanguage(loadedConfig.locale || "system");
        }
      } catch (e) {
        console.error("加载配置失败:", e);
      }
    };
    loadConfig();
  }, []);

  const saveConfig = useCallback(async (newConfig: AppConfig) => {
    try {
      await chrome.storage.local.set({ config: newConfig });
      setConfig(newConfig);
    } catch (e) {
      console.error("保存设置失败:", e);
    }
  }, []);

  return {
    config,
    saveConfig,
  };
}
