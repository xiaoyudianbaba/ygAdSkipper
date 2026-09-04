// YouTube Ad Skipper - Background Service Worker

const DEFAULT_SETTINGS = {
  enabled: true,
  autoSkip: true,
  autoMute: true,
  fastForward: true,
  skipCount: 0
};

// 初始化设置
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }
  });
});

// 监听来自 content script 和 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get('settings', (result) => {
      sendResponse(result.settings || DEFAULT_SETTINGS);
    });
    return true;
  }

  if (message.type === 'UPDATE_SETTINGS') {
    chrome.storage.local.set({ settings: message.settings }, () => {
      // 通知所有 YouTube 标签页设置已更新
      chrome.tabs.query({ url: ['*://www.youtube.com/*', '*://youtube.com/*'] }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            settings: message.settings
          }).catch(() => {});
        });
      });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'AD_SKIPPED') {
    // 更新跳过计数
    chrome.storage.local.get('settings', (result) => {
      const settings = result.settings || DEFAULT_SETTINGS;
      settings.skipCount = (settings.skipCount || 0) + 1;
      chrome.storage.local.set({ settings });
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_STATS') {
    chrome.storage.local.get('settings', (result) => {
      const settings = result.settings || DEFAULT_SETTINGS;
      sendResponse({ skipCount: settings.skipCount || 0 });
    });
    return true;
  }
});
