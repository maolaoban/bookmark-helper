import React, { useState, useCallback } from 'react';

interface AppConfig {
  theme: 'system' | 'light' | 'dark';
  sortBy: 'dateAdded' | 'dateLastUsed';
}

interface SettingsPanelProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onSave,
  onClose,
}) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  const handleThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalConfig((prev) => ({
      ...prev,
      theme: e.target.value as AppConfig['theme'],
    }));
  }, []);

  const handleSortByChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalConfig((prev) => ({
      ...prev,
      sortBy: e.target.value as AppConfig['sortBy'],
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(localConfig);
    onClose();
  }, [localConfig, onSave, onClose]);

  const handleReset = useCallback(() => {
    setLocalConfig({
      theme: 'system',
      sortBy: 'dateAdded',
    });
  }, []);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>设置</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-content">
          <div className="form-group">
            <label htmlFor="theme">主题</label>
            <select
              id="theme"
              value={localConfig.theme}
              onChange={handleThemeChange}
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sortBy">排序方式</label>
            <select
              id="sortBy"
              value={localConfig.sortBy}
              onChange={handleSortByChange}
            >
              <option value="dateAdded">按添加时间</option>
              <option value="dateLastUsed">按上次使用时间</option>
            </select>
            <p className="help-text">
              按上次使用时间排序时，若无使用记录则使用添加时间
            </p>
          </div>

          <div className="info-section">
            <h4>关于</h4>
            <p>Bookmark Helper - 智能书签搜索</p>
            <p className="help-text">
              使用本地向量模型进行语义搜索，完全离线工作，保护隐私。
            </p>
          </div>
        </div>

        <div className="settings-footer">
          <button className="button-secondary" onClick={handleReset}>
            恢复默认
          </button>
          <button className="button-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;