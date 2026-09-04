// ==UserScript==
// @name         YouTube Ad Skipper
// @namespace    https://github.com/xiaoyudianbaba/YouTubeAdSkipper
// @version      1.0.0
// @description  自动跳过 YouTube 广告，支持静音广告播放、快进不可跳过广告
// @author       xiaoyudianbaba
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  // ========== 配置 ==========
  const CONFIG = {
    SKIP_BUTTON_SELECTORS: [
      '.ytp-ad-skip-button-modern',
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button',
      'button.ytp-ad-skip-button',
      '.video-ads .ytp-ad-skip-button',
      'button[aria-label*="Skip"]',
      'button[aria-label*="skip"]',
      'button[aria-label*="跳过"]'
    ],
    AD_SHOWING_SELECTORS: [
      '.ad-showing',
      '.ad-interrupting'
    ],
    UNSKIPPABLE_AD_SELECTORS: [
      '.ytp-ad-preview-slot',
      '.ytp-ad-preview',
      '.ytp-ad-image-overlay'
    ],
    POLL_INTERVAL: 500
  };

  // ========== 设置管理 ==========
  const DEFAULT_SETTINGS = {
    enabled: true,
    autoSkip: true,
    autoMute: true,
    fastForward: true,
    skipCount: 0
  };

  function getSettings() {
    const saved = GM_getValue('settings', null);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  }

  function saveSettings(settings) {
    GM_setValue('settings', JSON.stringify(settings));
  }

  function updateSkipCount() {
    const settings = getSettings();
    settings.skipCount = (settings.skipCount || 0) + 1;
    saveSettings(settings);
  }

  // ========== 状态 ==========
  let settings = getSettings();
  let isAdPlaying = false;
  let originalVolume = 1;

  // ========== 工具函数 ==========
  function isAdShowing() {
    return CONFIG.AD_SHOWING_SELECTORS.some(sel =>
      document.querySelector(sel) !== null
    );
  }

  function findSkipButton() {
    for (const selector of CONFIG.SKIP_BUTTON_SELECTORS) {
      const btn = document.querySelector(selector);
      if (btn && btn.offsetParent !== null) {
        return btn;
      }
    }
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent.toLowerCase();
      if ((text.includes('skip') || text.includes('跳过')) && btn.offsetParent !== null) {
        return btn;
      }
    }
    return null;
  }

  function findVideo() {
    return document.querySelector('video');
  }

  function hasUnskippableAd() {
    return CONFIG.UNSKIPPABLE_AD_SELECTORS.some(sel =>
      document.querySelector(sel) !== null
    );
  }

  // ========== 核心功能 ==========
  function handleAdPlaying() {
    if (!settings.enabled) return;

    if (settings.autoMute) {
      const video = findVideo();
      if (video && !video.muted) {
        originalVolume = video.volume;
        video.muted = true;
      }
    }

    if (settings.autoSkip) {
      const btn = findSkipButton();
      if (btn) {
        btn.click();
        updateSkipCount();
        return;
      }
    }

    if (settings.fastForward && hasUnskippableAd()) {
      const video = findVideo();
      if (video && video.duration) {
        video.currentTime = video.duration - 0.1;
      }
    }
  }

  function handleAdEnded() {
    if (!settings.enabled) return;
    if (settings.autoMute) {
      const video = findVideo();
      if (video) {
        video.muted = false;
        video.volume = originalVolume;
      }
    }
  }

  function checkForAds() {
    if (!settings.enabled) return;

    const adShowing = isAdShowing();
    if (adShowing && !isAdPlaying) {
      isAdPlaying = true;
      handleAdPlaying();
    } else if (!adShowing && isAdPlaying) {
      isAdPlaying = false;
      handleAdEnded();
    }

    if (isAdPlaying && settings.autoSkip) {
      const btn = findSkipButton();
      if (btn) {
        btn.click();
        updateSkipCount();
      }
    }
  }

  // ========== MutationObserver ==========
  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!settings.enabled) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const className = node.className || '';
            if (typeof className === 'string' && (
              className.includes('ad-') ||
              className.includes('ytp-ad') ||
              className.includes('video-ads')
            )) {
              checkForAds();
              return;
            }
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // ========== 轮询 ==========
  function startPolling() {
    setInterval(checkForAds, CONFIG.POLL_INTERVAL);
  }

  // ========== 菜单命令 ==========
  GM_registerMenuCommand('启用/禁用广告跳过', () => {
    settings.enabled = !settings.enabled;
    saveSettings(settings);
    alert(`YouTube Ad Skipper 已${settings.enabled ? '启用' : '禁用'}`);
  });

  GM_registerMenuCommand('查看统计', () => {
    const count = settings.skipCount || 0;
    alert(`已跳过 ${count} 个广告`);
  });

  // ========== 初始化 ==========
  function init() {
    settings = getSettings();
    if (settings.enabled) {
      startObserver();
      startPolling();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // SPA 导航监听
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      settings = getSettings();
      checkForAds();
    }
  }).observe(document, { childList: true, subtree: true });

})();
