import React, { useState, useCallback } from "react";
import type { AppConfig } from "../../../types";
import styles from "./SettingsPanel.module.css";

interface SettingsPanelProps {
  config: AppConfig;
  onSave: (config: AppConfig) => Promise<void> | void;
  onClose: () => Promise<void> | void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  const handleThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalConfig((prev: AppConfig) => ({
      ...prev,
      theme: e.target.value as AppConfig["theme"],
    }));
  }, []);

  const handleSortByChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalConfig((prev: AppConfig) => ({
      ...prev,
      sortBy: e.target.value as AppConfig["sortBy"],
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(localConfig);
    onClose();
  }, [localConfig, onSave, onClose]);

  const handleReset = useCallback(() => {
    setLocalConfig({
      theme: "system",
      sortBy: "dateAdded",
    });
  }, []);

  return (
    <div className={styles.settingsOverlay} onClick={onClose}>
      <div className={styles.settingsPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.settingsHeader}>
          <h3>设置</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.settingsContent}>
          <div className={styles.formGroup}>
            <label htmlFor="theme">主题</label>
            <select id="theme" value={localConfig.theme} onChange={handleThemeChange}>
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sortBy">排序方式</label>
            <select id="sortBy" value={localConfig.sortBy} onChange={handleSortByChange}>
              <option value="dateAdded">按添加时间</option>
              <option value="dateLastUsed">按上次使用时间</option>
            </select>
            <p className={styles.helpText}>按上次使用时间排序时，若无使用记录则使用添加时间</p>
          </div>

          <div className={styles.infoSection}>
            <h4>关于</h4>
            <p>Bookmark Helper - 智能书签搜索</p>
            <p className={styles.helpText}>使用本地向量模型进行语义搜索，完全离线工作，保护隐私。</p>
          </div>
        </div>

        <div className={styles.settingsFooter}>
          <button className={styles.buttonSecondary} onClick={handleReset}>
            恢复默认
          </button>
          <button className={styles.buttonPrimary} onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
