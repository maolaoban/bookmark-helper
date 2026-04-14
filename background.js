// 后台脚本 - 处理快捷键和其他后台任务

chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-popup') {
        // 打开弹窗
        chrome.action.openPopup();
    }
});

// 初始化扩展
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {

    }
});
