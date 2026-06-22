import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";
import type { AppConfig } from "../../../types";
import styles from "./SettingsPanel.module.css";

interface SettingsPanelProps {
  config: AppConfig;
  onSave: (config: AppConfig) => Promise<void> | void;
  onClose: () => Promise<void> | void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onSave, onClose }) => {
  const { t } = useTranslation();
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  const handleLocaleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalConfig((prev: AppConfig) => ({
      ...prev,
      locale: e.target.value as AppConfig["locale"],
    }));
  }, []);

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
    changeLanguage(localConfig.locale);
    onSave(localConfig);
    onClose();
  }, [localConfig, onSave, onClose]);

  const handleReset = useCallback(() => {
    setLocalConfig({
      theme: "system",
      locale: "system",
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
          <h3>{t('settings')}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label={t('closeSettings')}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.settingsContent}>
          <div className={styles.formGroup}>
            <label htmlFor="locale">{t('language')}</label>
            <select id="locale" value={localConfig.locale} onChange={handleLocaleChange}>
              <option value="system">{t('langSystem')}</option>
              <option value="zh-CN">{t('langZhCN')}</option>
              <option value="en">{t('langEn')}</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="theme">{t('theme')}</label>
            <select id="theme" value={localConfig.theme} onChange={handleThemeChange}>
              <option value="system">{t('followSystem')}</option>
              <option value="light">{t('light')}</option>
              <option value="dark">{t('dark')}</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sortBy">{t('sortBy')}</label>
            <select id="sortBy" value={localConfig.sortBy} onChange={handleSortByChange}>
              <option value="dateAdded">{t('sortByDateAdded')}</option>
              <option value="dateLastUsed">{t('sortByLastUsed')}</option>
            </select>
            <p className={styles.helpText}>{t('sortByHelp')}</p>
          </div>

          <div className={styles.formGroup}>
            <label>{t('searchResultCount')}</label>
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
            <label>{t('similarityThreshold')}</label>
            <div className={styles.radioGroup}>
              {[
                { value: 0.2, labelKey: "low", descKey: "moreResults" },
                { value: 0.3, labelKey: "medium", descKey: "recommended" },
                { value: 0.5, labelKey: "high", descKey: "moreAccurate" },
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
                    <span>{t(threshold.labelKey)}</span>
                    <span className={styles.radioDesc}>{threshold.value} · {t(threshold.descKey)}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.infoSection}>
            <h4>{t('about')}</h4>
            <p>{t('aboutDesc')}</p>
            <p className={styles.helpText}>{t('aboutPrivacy')}</p>
            <p className={styles.helpText}>{t('aboutEnhance')}</p>
          </div>
        </div>

        <div className={styles.settingsFooter}>
          <button className={styles.buttonSecondary} onClick={handleReset}>
            {t('resetDefault')}
          </button>
          <button className={styles.buttonPrimary} onClick={handleSave}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
