/**
 * 存储管理模块
 * 处理配置和数据的本地存储
 */

// 默认配置
const DEFAULT_CONFIG = {
    provider: 'gemini',
    apiKeys: {
        gemini: '',
        openai: '',
        anthropic: '',
        ollama: '',
        baidu: '',
        glm: '',
        qwen: '',
        deepseek: ''
    },
    models: {
        gemini: 'gemini-2.0-flash-exp',
        openai: 'gpt-4o-mini',
        anthropic: 'claude-sonnet-4-20250514',
        ollama: 'llama3',
        baidu: 'ernie-4.0',
        glm: 'glm-4',
        qwen: 'qwen-max',
        deepseek: 'deepseek-chat'
    },
    systemPrompt: '你是书签助手，帮助用户找到相关的书签。根据用户的描述，从书签列表中推荐最相关的书签，并简要说明为什么推荐。每条推荐格式为"[书签标题] - 原因"。',
    shortcut: 'Ctrl+Shift+B',
    theme: 'system',
    sortBy: 'dateAdded',  // 排序方式: dateAdded 或 dateLastUsed
    aiEnabled: false      // 是否启用 AI 功能
};

/**
 * 加载配置
 * @returns {Promise<Object>} 配置对象
 */
async function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get('config', (result) => {
            // 合并默认配置和保存的配置
            const config = result.config ? { ...DEFAULT_CONFIG, ...result.config } : DEFAULT_CONFIG;
            resolve(config);
        });
    });
}

/**
 * 保存配置
 * @param {Object} config - 配置对象
 * @returns {Promise<void>}
 */
async function saveConfig(config) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ config }, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

/**
 * 获取特定提供商的 API Key
 * @param {string} provider - 提供商名称
 * @returns {Promise<string>} API Key
 */
async function getApiKey(provider) {
    const config = await loadConfig();
    return config.apiKeys?.[provider] || '';
}

/**
 * 保存特定提供商的 API Key
 * @param {string} provider - 提供商名称
 * @param {string} apiKey - API Key
 * @returns {Promise<void>}
 */
async function saveApiKey(provider, apiKey) {
    const config = await loadConfig();
    config.apiKeys[provider] = apiKey;
    return saveConfig(config);
}

/**
 * 获取当前的 AI 模型
 * @param {string} provider - 提供商名称
 * @returns {Promise<string>} 模型名称
 */
async function getModel(provider) {
    const config = await loadConfig();
    return config.models?.[provider] || '';
}

/**
 * 保存当前的 AI 模型
 * @param {string} provider - 提供商名称
 * @param {string} model - 模型名称
 * @returns {Promise<void>}
 */
async function saveModel(provider, model) {
    const config = await loadConfig();
    config.models[provider] = model;
    return saveConfig(config);
}

/**
 * 获取系统提示词
 * @returns {Promise<string>} 系统提示词
 */
async function getSystemPrompt() {
    const config = await loadConfig();
    return config.systemPrompt || DEFAULT_CONFIG.systemPrompt;
}

/**
 * 保存系统提示词
 * @param {string} prompt - 新的系统提示词
 * @returns {Promise<void>}
 */
async function saveSystemPrompt(prompt) {
    const config = await loadConfig();
    config.systemPrompt = prompt;
    return saveConfig(config);
}

/**
 * 清除所有存储数据（恢复默认）
 * @returns {Promise<void>}
 */
async function clearAllStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}
