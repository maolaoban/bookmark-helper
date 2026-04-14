let config = null;
let isAIMode = false;
let apiService = null;
let isSettingsOpen = false;

const PROVIDER_HELP = {
    gemini: '获取 API Key: https://ai.google.dev/\n支持模型: gemini-2.0-flash-exp, gemini-2.0-flash',
    openai: '获取 API Key: https://platform.openai.com/api-keys\n支持模型: gpt-4o-mini, gpt-4o',
    anthropic: '获取 API Key: https://console.anthropic.com/\n支持模型: claude-opus-4-1, claude-sonnet-4-20250514',
    ollama: 'Ollama 本地模型运行\n获取: https://ollama.ai\n支持模型: llama2, llama3, mistral 等',
    baidu: '获取 API Key: https://console.bce.baidu.com/\n支持模型: ernie-4.0, ernie-3.5',
    glm: '获取 API Key: https://open.bigmodel.cn/\n支持模型: glm-4, glm-3-turbo',
    qwen: '获取 API Key: https://dashscope.aliyun.com/\n支持模型: qwen-max, qwen-plus',
    deepseek: '获取 API Key: https://platform.deepseek.com/\n支持模型: deepseek-chat, deepseek-coder'
};

const PROVIDER_MODELS = {
    gemini: [
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
    ],
    openai: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4'
    ],
    anthropic: [
        'claude-opus-4-1',
        'claude-sonnet-4-20250514',
        'claude-haiku-3-5'
    ],
    ollama: [
        'llama2',
        'llama3',
        'mistral',
        'neural-chat',
        'starling-lm'
    ],
    baidu: [
        'ernie-4.0',
        'ernie-3.5-turbo',
        'ernie-speed-128k'
    ],
    glm: [
        'glm-4',
        'glm-3-turbo',
        'glm-4v'
    ],
    qwen: [
        'qwen-max',
        'qwen-plus',
        'qwen-turbo'
    ],
    deepseek: [
        'deepseek-chat',
        'deepseek-coder'
    ]
};

// 初始化
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // 加载配置
    config = await loadConfig();

    // 设置 AI 按钮
    const aiBtn = document.getElementById('aiModeBtn');
    aiBtn.addEventListener('click', handleAISearch);

    // 搜索输入
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchInput.focus();

    // 设置面板事件
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
    document.getElementById('aiEnabled').addEventListener('change', onAiEnabledChange);
    document.getElementById('provider').addEventListener('change', onProviderChange);
    document.getElementById('toggleApiKeyBtn').addEventListener('click', toggleApiKeyVisibility);
    document.getElementById('resetPromptBtn').addEventListener('click', resetPrompt);
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    document.getElementById('resetBtn').addEventListener('click', resetSettings);

    // 加载初始书签
    await handleSearch('');

    // 根据 AI 配置显示/隐藏按钮
    updateAiButtonVisibility();

    // 应用保存的主题
    applyTheme(config.theme);
}

function updateAiButtonVisibility() {
    const aiBtn = document.getElementById('aiModeBtn');
    if (config.aiEnabled) {
        aiBtn.style.display = '';
    } else {
        aiBtn.style.display = 'none';
    }
}

function onAiEnabledChange() {
    const aiEnabled = document.getElementById('aiEnabled').checked;
    const aiConfigs = document.querySelectorAll('.ai-config');

    aiConfigs.forEach(el => {
        el.classList.toggle('hidden', !aiEnabled);
    });
}

function handleAISearch() {
    const searchInput = document.getElementById('searchInput');
    performAISearch(searchInput.value);
}

async function handleSearch(query) {
    // 处理 input 事件传入的 Event 对象
    if (query && typeof query === 'object' && query.target) {
        query = query.target.value;
    }

    const content = document.getElementById('content');

    try {
        // 输入框输入时总是触发普通搜索，AI 模式只有点击按钮才触发
        await performNormalSearch(query);
    } catch (error) {
        console.error('搜索错误:', error);
        content.innerHTML = `<div class="error">错误: ${error.message}</div>`;
    }
}

async function performNormalSearch(query) {
    const content = document.getElementById('content');
    const sortBy = config.sortBy || 'dateAdded';

    // 搜索书签
    const bookmarks = await searchBookmarks(query, sortBy);

    if (bookmarks.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <svg t="1776161520859" class="empty-icon icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8072" width="200" height="200"><path d="M832 981.333333a21.333333 21.333333 0 0 1-11.333333-3.24l-330-206.266666-330 206.266666a21.333333 21.333333 0 0 1-32.666667-18.093333V181.333333a53.393333 53.393333 0 0 1 53.333333-53.333333h618.666667a53.393333 53.393333 0 0 1 53.333333 53.333333v778.666667a21.333333 21.333333 0 0 1-21.333333 21.333333z m-341.333333-256a21.333333 21.333333 0 0 1 11.333333 3.24l308.666667 192.933334V181.333333a10.666667 10.666667 0 0 0-10.666667-10.666666H181.333333a10.666667 10.666667 0 0 0-10.666666 10.666666v740.173334l308.666666-192.933334a21.333333 21.333333 0 0 1 11.333334-3.24z m448 64V96a53.393333 53.393333 0 0 0-53.333334-53.333333H320a21.333333 21.333333 0 0 0 0 42.666666h565.333333a10.666667 10.666667 0 0 1 10.666667 10.666667v693.333333a21.333333 21.333333 0 0 0 42.666667 0z" fill="#707070" p-id="8073"></path></svg>
                <div>未找到书签</div>
            </div>
        `;
        return;
    }

    // 为每个书签获取路径信息
    const bookmarksWithPath = await Promise.all(
        bookmarks.map(async (bookmark) => ({
            ...bookmark,
            path: await getBookmarkPath(bookmark.id)
        }))
    );

    content.innerHTML = bookmarksWithPath
        .map(bookmark => createBookmarkHTML(bookmark))
        .join('');

    // 添加点击事件
    content.querySelectorAll('.bookmark-item').forEach((item) => {
        item.addEventListener('click', () => {
            const url = item.dataset.url;
            chrome.tabs.create({ url });
            window.close();
        });
    });
}

async function performAISearch(query) {
    const content = document.getElementById('content');
    const sortBy = config.sortBy || 'dateAdded';

    if (!query || !query.trim()) {
        showToast('请输入你想搜索的内容');
        return;
    }

    try {
        // 初始化 AI 服务
        if (!apiService) {
            apiService = new AIService(config);
        }

        const allBookmarks = await getAllBookmarks(sortBy);
        const recommendations = await apiService.chat(query, allBookmarks);

        if (!recommendations || recommendations.length === 0) {
            content.innerHTML = `
            <div class="empty-state">
                <svg t="1776161520859" class="empty-icon icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8072" width="200" height="200"><path d="M832 981.333333a21.333333 21.333333 0 0 1-11.333333-3.24l-330-206.266666-330 206.266666a21.333333 21.333333 0 0 1-32.666667-18.093333V181.333333a53.393333 53.393333 0 0 1 53.333333-53.333333h618.666667a53.393333 53.393333 0 0 1 53.333333 53.333333v778.666667a21.333333 21.333333 0 0 1-21.333333 21.333333z m-341.333333-256a21.333333 21.333333 0 0 1 11.333333 3.24l308.666667 192.933334V181.333333a10.666667 10.666667 0 0 0-10.666667-10.666666H181.333333a10.666667 10.666667 0 0 0-10.666666 10.666666v740.173334l308.666666-192.933334a21.333333 21.333333 0 0 1 11.333334-3.24z m448 64V96a53.393333 53.393333 0 0 0-53.333334-53.333333H320a21.333333 21.333333 0 0 0 0 42.666666h565.333333a10.666667 10.666667 0 0 1 10.666667 10.666667v693.333333a21.333333 21.333333 0 0 0 42.666667 0z" fill="#707070" p-id="8073"></path></svg>
                <div>未找到相关的书签</div>
            </div>
        `;
            return;
        }

        // 为推荐的书签获取路径信息
        const recommendedBookmarks = await Promise.all(
            recommendations.map(async (rec) => {
                const bookmark = allBookmarks.find(b => b.title === rec.title);
                if (bookmark) {
                    const path = await getBookmarkPath(bookmark.id);
                    return { ...bookmark, path, reason: rec.reason };
                }
                return null;
            }).filter(Boolean)
        );

        // 构建响应 HTML
        let html = '<div class="ai-response">';

        recommendedBookmarks.forEach((bookmark, index) => {
            const title = `${index + 1}. ${bookmark.title}`;
            const bookmarkWithTitle = { ...bookmark, title };
            html += createBookmarkHTML(bookmarkWithTitle);
            if (bookmark.reason) {
                html += `<div class="ai-reason">💡 ${escapeHtml(bookmark.reason)}</div>`;
            }
        });

        html += '</div>';
        content.innerHTML = html;

        // 添加点击事件
        content.querySelectorAll('.bookmark-item').forEach((item) => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                chrome.tabs.create({ url });
                window.close();
            });
        });

    } catch (error) {
        console.error('AI 搜索错误:', error);
        content.innerHTML = `<div class="error">AI 搜索失败: ${error.message}</div>`;
    }
}

function createBookmarkHTML(bookmark) {
    const title = escapeHtml(bookmark.title || '无标题');
    const url = escapeHtml(bookmark.url);
    const path = bookmark.path ? escapeHtml(bookmark.path) : '';

    // 提取域名作为 favicon
    let faviconUrl = getFaviconURL(bookmark.url)
    let faviconHtml = `<img class="bookmark-favicon" src="${faviconUrl}" alt="">`;

    return `
    <div class="bookmark-item" data-url="${bookmark.url}" title="${title}">
      <div class="bookmark-main">
        ${faviconHtml}
        <span class="bookmark-title">${title}</span>
      </div>
      <div class="bookmark-url">${url}</div>
      ${path ? `<div class="bookmark-path">${path}</div>` : ''}
    </div>
  `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
// 设置面板相关函数
function openSettings() {
    isSettingsOpen = true;
    loadSettingsToForm();
    document.getElementById('settingsPanel').classList.add('show');
}

function closeSettings() {
    isSettingsOpen = false;
    document.getElementById('settingsPanel').classList.remove('show');
}

function loadSettingsToForm() {
    // AI 开关
    document.getElementById('aiEnabled').checked = config.aiEnabled || false;

    // 根据 AI 开关显示/隐藏配置
    onAiEnabledChange();

    // 提供商
    document.getElementById('provider').value = config.provider;

    // API Key
    document.getElementById('apiKey').value = config.apiKeys[config.provider] || '';

    // 模型
    updateModelOptions();
    document.getElementById('model').value = config.models[config.provider] || '';

    // 系统提示词
    document.getElementById('systemPrompt').value = config.systemPrompt;

    // 主题
    document.getElementById('theme').value = config.theme;

    // 排序方式
    document.getElementById('sortBy').value = config.sortBy || 'dateAdded';

    // 更新帮助文本
    updateProviderHelp();
}

function onProviderChange() {
    const provider = document.getElementById('provider').value;
    const apiKeyInput = document.getElementById('apiKey');

    // 切换 API Key
    apiKeyInput.value = config.apiKeys[provider] || '';
    apiKeyInput.type = 'password';

    // 更新模型
    updateModelOptions();

    // 更新帮助文本
    updateProviderHelp();
}

function updateModelOptions() {
    const provider = document.getElementById('provider').value;
    const models = PROVIDER_MODELS[provider] || [];
    const modelSelect = document.getElementById('model');

    modelSelect.innerHTML = models
        .map(m => `<option value="${m}">${m}</option>`)
        .join('');

    modelSelect.value = config.models[provider] || models[0];
}

function updateProviderHelp() {
    const provider = document.getElementById('provider').value;
    const helpText = document.getElementById('providerHelp');
    helpText.textContent = PROVIDER_HELP[provider] || '';
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('apiKey');
    const btn = document.getElementById('toggleApiKeyBtn');

    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁';
    }
}

function resetPrompt() {
    document.getElementById('systemPrompt').value = DEFAULT_CONFIG.systemPrompt;
}

async function saveSettings() {
    try {
        const provider = document.getElementById('provider').value;
        const aiEnabled = document.getElementById('aiEnabled').checked;
        const newConfig = {
            ...config,
            aiEnabled,
            provider,
            apiKeys: {
                ...config.apiKeys,
                [provider]: document.getElementById('apiKey').value
            },
            models: {
                ...config.models,
                [provider]: document.getElementById('model').value
            },
            systemPrompt: document.getElementById('systemPrompt').value,
            theme: document.getElementById('theme').value,
            sortBy: document.getElementById('sortBy').value
        };

        // 只有启用 AI 时才验证 API Key
        if (aiEnabled && !newConfig.apiKeys[provider] && provider !== 'ollama') {
            throw new Error('请输入 API Key');
        }

        await chrome.storage.local.set({ config: newConfig });
        config = newConfig;

        // 更新 AI 按钮显示状态
        updateAiButtonVisibility();

        // 重新初始化 AI 服务
        try {
            apiService = new AIService(config);
        } catch (e) {
            console.log('AI 服务重新初始化失败:', e);
        }

        // 应用主题
        applyTheme(newConfig.theme);

        showToast('设置已保存', false);
        closeSettings();
    } catch (error) {
        showToast('保存失败: ' + error.message, true);
    }
}

async function resetSettings() {
    if (confirm('确定要恢复默认设置吗？')) {
        try {
            await chrome.storage.local.set({ config: DEFAULT_CONFIG });
            config = DEFAULT_CONFIG;
            loadSettingsToForm();
            applyTheme(DEFAULT_CONFIG.theme);
            showToast('已恢复默认设置', false);
        } catch (error) {
            showToast('恢复失败: ' + error.message, true);
        }
    }
}

function applyTheme(theme) {
    const html = document.documentElement;

    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.classList.toggle('dark', prefersDark);
    } else {
        html.classList.toggle('dark', theme === 'dark');
    }
}

function showToast(message, isError = false) {
    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) toast.classList.add('error');
    toast.textContent = message;

    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => toast.classList.add('show'), 10);

    // 自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}


function getFaviconURL(u) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "16");
    return url.toString();
}