/**
 * AI 服务模块
 * 提供多模型 AI 支持（Gemini, OpenAI, Anthropic, Ollama）
 */

class AIService {
    constructor(config) {
        this.provider = config.provider;
        this.apiKey = config.apiKeys[config.provider];
        this.model = config.models[config.provider];
        this.systemPrompt = config.systemPrompt;
    }

    /**
     * 聊天接口 - 推荐书签
     * @param {string} message - 用户消息
     * @param {Array} bookmarks - 书签列表
     * @returns {Promise<Array>} 推荐的书签
     */
    async chat(message, bookmarks) {
        if (!message || !message.trim()) {
            throw new Error('请输入搜索内容');
        }

        if (!bookmarks || bookmarks.length === 0) {
            throw new Error('没有可用的书签');
        }

        // 构建提示词
        const prompt = this.buildPrompt(message, bookmarks);

        try {
            let response;
            switch (this.provider) {
                case 'gemini':
                    response = await this.callGemini(prompt);
                    break;
                case 'openai':
                    response = await this.callOpenAI(prompt);
                    break;
                case 'anthropic':
                    response = await this.callAnthropic(prompt);
                    break;
                case 'ollama':
                    response = await this.callOllama(prompt);
                    break;
                case 'baidu':
                    response = await this.callBaidu(prompt);
                    break;
                case 'glm':
                    response = await this.callGlm(prompt);
                    break;
                case 'qwen':
                    response = await this.callQwen(prompt);
                    break;
                case 'deepseek':
                    response = await this.callDeepSeek(prompt);
                    break;
                default:
                    throw new Error(`不支持的 AI 提供商: ${this.provider}`);
            }

            // 解析响应并返回推荐
            return this.parseResponse(response);
        } catch (error) {
            console.error(`${this.provider} 调用失败:`, error);
            throw new Error(`AI 服务出错: ${error.message}`);
        }
    }

    /**
     * 构建提示词
     * @param {string} message - 用户消息
     * @param {Array} bookmarks - 书签列表
     * @returns {Object} 包含 system 和 user 的提示词对象
     */
    buildPrompt(message, bookmarks) {
        // 限制书签数量，避免提示词过长
        const limitedBookmarks = bookmarks.slice(0, 10);

        const bookmarksList = limitedBookmarks
            .map((b, i) => `${i + 1}. 标题: ${b.title}, URL: ${b.url}`)
            .join('\n');

        const userPrompt = `我的书签列表（共 ${bookmarks.length} 个，${limitedBookmarks.length > 100 ? '显示前 100 个' : '已全部显示'}）：
${bookmarksList}
${bookmarks.length > 100 ? '\n...（省略其他书签）' : ''}

用户问题：${message}

请从以上书签中选出最相关的（最多 5 个），按相关性排序。
请直接返回 JSON 数组格式，不要有其他内容：
[
  {"title": "书签标题", "url": "https://...", "reason": "推荐理由"},
  ...
]`;

        return {
            system: this.systemPrompt,
            user: userPrompt
        };
    }

    /**
     * 解析 AI 响应，提取书签推荐
     * @param {string} text - AI 返回的文本
     * @returns {Array} 推荐的书签
     */
    parseResponse(text) {
        if (!text || !text.trim()) {
            return [];
        }

        try {
            // 尝试提取 JSON 数组
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const recommendations = JSON.parse(jsonMatch[0]);
                return recommendations.filter(r => r.title && r.url);
            }
        } catch (e) {
            console.error('解析 AI 响应失败:', e);
        }

        return [];
    }

    /**
     * 调用 Google Gemini API
     * @param {Object} prompt - 提示词对象
     * @returns {Promise<string>} API 响应
     */
    async callGemini(prompt) {
        if (!this.apiKey) {
            throw new Error('未配置 Gemini API Key');
        }

        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: prompt.system }]
                },
                contents: [
                    {
                        parts: [{ text: prompt.user }]
                    }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    /**
     * 调用 OpenAI API
     * @param {Object} prompt - 提示词对象
     * @returns {Promise<string>} API 响应
     */
    async callOpenAI(prompt) {
        if (!this.apiKey) {
            throw new Error('未配置 OpenAI API Key');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    /**
     * 调用 Anthropic Claude API
     * @param {Object} prompt - 提示词对象
     * @returns {Promise<string>} API 响应
     */
    async callAnthropic(prompt) {
        if (!this.apiKey) {
            throw new Error('未配置 Anthropic API Key');
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 1024,
                system: prompt.system,
                messages: [
                    { role: 'user', content: prompt.user }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.content?.[0]?.text || '';
    }

    /**
   * 调用百度文心一言 API
   * @param {Object} prompt - 提示词对象
   * @returns {Promise<string>} API 响应
   */
    async callBaidu(prompt) {
        if (!this.apiKey) {
            throw new Error('未配置百度 API Key');
        }

        const response = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${this.model}?access_token=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ],
                temperature: 0.7,
                top_p: 0.8
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error_msg || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.result || '';
    }

    /**
     * 调用智谱GLM API
     * @param {Object} prompt - 提示词对象
     * @returns {Promise<string>} API 响应
     */
    async callGlm(prompt) {
        if (!this.apiKey) {
            throw new Error('未配置智谱 API Key');
        }

        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    /**
     * 调用阿里通义千问 API
     * @param {Object} prompt - 提示词对象
     * @returns {Promise<string>} API 响应
     */
    async callQwen(prompt) {
        if (!this.apiKey) {
            throw new Error('未配置阿里云 API Key');
        }

        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'X-DashScope-SSE': 'disable'
            },
            body: JSON.stringify({
                model: this.model,
                input: {
                    messages: [
                        { role: 'system', content: prompt.system },
                        { role: 'user', content: prompt.user }
                    ]
                },
                parameters: {
                    temperature: 0.7,
                    top_p: 0.8
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.output?.text || '';
    }

    /**
     * 调用 DeepSeek API
     * @param {Object} prompt - 提示词对象
     * @returns {Promise<string>} API 响应
     */
    async callDeepSeek(prompt) {
        if (!this.apiKey) {
            throw new Error('未配置 DeepSeek API Key');
        }

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }
}
