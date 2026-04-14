/**
 * 书签操作模块
 * 提供搜索、获取书签的功能
 */

/**
 * 搜索书签
 * @param {string} query - 搜索查询字符串
 * @param {string} sortBy - 排序方式: 'dateAdded' 或 'dateLastUsed'
 * @returns {Promise<Array>} 搜索结果
 */
async function searchBookmarks(query, sortBy = 'dateAdded') {
    if (!query || query.trim() === '') {
        // 如果查询为空，返回排序后的最近书签
        return await getRecentBookmarks(20, sortBy);
    }

    return new Promise((resolve) => {
        chrome.bookmarks.search(query, (results) => {
            // 过滤掉文件夹，只保留有 URL 的书签
            const bookmarks = results
                .filter(item => item.url && item.url.trim() !== '')
                .slice(0, 30);
            // 对结果排序
            resolve(sortBookmarks(bookmarks, sortBy));
        });
    });
}

/**
 * 获取最近添加的书签
 * @param {number} limit - 返回数量限制
 * @param {string} sortBy - 排序方式: 'dateAdded' 或 'dateLastUsed'
 * @returns {Promise<Array>} 最近的书签列表
 */
async function getRecentBookmarks(limit = 20, sortBy = 'dateAdded') {
    return new Promise((resolve) => {
        chrome.bookmarks.getRecent(limit, (results) => {
            const bookmarks = results
                .filter(item => item.url && item.url.trim() !== '')
                .slice(0, limit);
            resolve(sortBookmarks(bookmarks, sortBy));
        });
    });
}

/**
 * 排序书签
 * @param {Array} bookmarks - 书签数组
 * @param {string} sortBy - 排序方式: 'dateAdded' 或 'dateLastUsed'
 * @returns {Array} 排序后的书签数组
 */
function sortBookmarks(bookmarks, sortBy = 'dateAdded') {
    return [...bookmarks].sort((a, b) => {
        // 获取排序字段值，若无 dateLastUsed 则使用 dateAdded
        const aTime = a.dateLastUsed || a.dateAdded;
        const bTime = b.dateLastUsed || b.dateAdded;

        if (sortBy === 'dateLastUsed') {
            // 按上次使用时间排序（优先使用 dateLastUsed）
            const aUseTime = a.dateLastUsed || a.dateAdded;
            const bUseTime = b.dateLastUsed || b.dateAdded;
            return bUseTime - aUseTime;
        } else {
            // 按添加时间排序（默认）
            return (b.dateAdded || 0) - (a.dateAdded || 0);
        }
    });
}

/**
 * 获取所有书签（用于 AI 推荐）
 * @param {string} sortBy - 排序方式: 'dateAdded' 或 'dateLastUsed'
 * @returns {Promise<Array>} 所有书签列表
 */
async function getAllBookmarks(sortBy = 'dateAdded') {
    return new Promise((resolve) => {
        chrome.bookmarks.getTree((tree) => {
            const bookmarks = [];

            /**
             * 递归展平书签树
             * @param {Array} nodes - 书签节点数组
             */
            const flatten = (nodes) => {
                nodes.forEach((node) => {
                    // 只收集有 URL 的书签（不是文件夹）
                    if (node.url && node.url.trim() !== '') {
                        bookmarks.push({
                            id: node.id,
                            title: node.title || '无标题',
                            url: node.url,
                            dateAdded: node.dateAdded,
                            dateLastUsed: node.dateLastUsed
                        });
                    }
                    // 递归处理子节点
                    if (node.children && Array.isArray(node.children)) {
                        flatten(node.children);
                    }
                });
            };

            // 从根节点开始展平
            if (tree && Array.isArray(tree)) {
                flatten(tree);
            }

            // 排序
            resolve(sortBookmarks(bookmarks, sortBy));
        });
    });
}

/**
 * 打开书签
 * @param {string} url - 书签 URL
 * @param {string} target - 打开方式（'current', 'new_tab', 'new_window'）
 */
function openBookmark(url, target = 'new_tab') {
    switch (target) {
        case 'current':
            chrome.tabs.update({ url });
            break;
        case 'new_tab':
            chrome.tabs.create({ url });
            break;
        case 'new_window':
            chrome.windows.create({ url });
            break;
    }
}

/**
 * 获取书签的完整路径
 * @param {string} id - 书签 ID
 * @returns {Promise<string>} 书签路径
 */
async function getBookmarkPath(id) {
    return new Promise((resolve) => {
        const getPath = (currentId, path = []) => {
            chrome.bookmarks.get(currentId, (results) => {
                if (results && results.length > 0) {
                    const item = results[0];
                    path.unshift(item.title);

                    if (item.parentId && item.parentId !== '0') {
                        getPath(item.parentId, path);
                    } else {
                        // 到达根节点，移除"书签栏"等系统文件夹名
                        const filteredPath = path.filter(name =>
                            !['书签栏', 'Bookmarks bar', '其他书签', 'Other bookmarks'].includes(name)
                        );
                        resolve(filteredPath.join(' > '));
                    }
                } else {
                    resolve('');
                }
            });
        };

        getPath(id);
    });
}
