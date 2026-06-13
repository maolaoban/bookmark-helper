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

  const handleSearchLimitChange = useCallback((value: number) => {
    setLocalConfig((prev: AppConfig) => ({
      ...prev,
      searchLimit: value,
    }));
  }, []);

  const handleSimilarityThresholdChange = useCallback((value: number) => {
    setLocalConfig((prev: AppConfig) => ({
      ...prev,
      similarityThreshold: value,
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
      autoIndex: true,
      indexThreshold: 0.6,
      searchLimit: 20,
      similarityThreshold: 0.3,
    });
  }, []);

  return (
    <div className={styles.settingsOverlay} onClick={onClose}>
      <div className={styles.settingsPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.settingsHeader}>
          <h3>设置</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭设置">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
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

          <div className={styles.formGroup}>
            <label>搜索结果数量</label>
            <div className={styles.radioGroup}>
              {[10, 20, 50].map((limit) => (
                <label key={limit} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="searchLimit"
                    value={limit}
                    checked={(localConfig.searchLimit ?? 20) === limit}
                    onChange={() => handleSearchLimitChange(limit)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioCustom} />
                  <span>{limit}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>相似度阈值</label>
            <div className={styles.radioGroup}>
              {[
                { value: 0.2, label: "低", desc: "更多结果" },
                { value: 0.3, label: "中", desc: "推荐" },
                { value: 0.5, label: "高", desc: "更精确" },
              ].map((threshold) => (
                <label key={threshold.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="similarityThreshold"
                    value={threshold.value}
                    checked={(localConfig.similarityThreshold ?? 0.3) === threshold.value}
                    onChange={() => handleSimilarityThresholdChange(threshold.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioCustom} />
                  <div className={styles.radioContent}>
                    <span>{threshold.label}</span>
                    <span className={styles.radioDesc}>{threshold.value} · {threshold.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.infoSection}>
            <h4>关于</h4>
            <p>Bookmark Helper - 智能书签搜索</p>
            <p className={styles.helpText}>使用本地向量模型进行语义搜索，完全离线工作，保护隐私。</p>
            <p className={styles.helpText}>页面元数据自动增强：浏览页面时自动提取标题、描述等信息，丰富书签索引，提升搜索准确率。</p>
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
