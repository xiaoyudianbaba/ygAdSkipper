// YouTube Ad Skipper - Content Script
// 在页面上下文执行，绕过 event.isTrusted 检查

(() => {
  'use strict';

  // ========== 配置 ==========
  const CONFIG = {
    // 跳过按钮选择器（按优先级排列）
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
    // 广告状态标志
    AD_SHOWING_SELECTORS: [
      '.ad-showing',
      '.ad-interrupting'
    ],
    // 广告容器
    AD_CONTAINER_SELECTORS: [
      '.video-ads',
      '.ytp-ad-text',
      '.ytp-ad-overlay-container',
      '.ytp-ad-text-wrapper'
    ],
    // 不可跳过广告的视频选择器
    UNSKIPPABLE_AD_SELECTORS: [
      '.ytp-ad-preview-slot',
      '.ytp-ad-preview',
      '.ytp-ad-image-overlay'
    ],
    // 轮询间隔（毫秒）
    POLL_INTERVAL: 500,
    // MutationObserver 超时
    OBSERVER_TIMEOUT: 30000
  };

  // ========== 状态 ==========
  let settings = {
    enabled: true,
    autoSkip: true,
    autoMute: true,
    fastForward: true
  };
  let isAdPlaying = false;
  let originalVolume = 1;
  let observer = null;
  let pollTimer = null;

  // ========== 工具函数 ==========

  /**
   * 检查是否处于广告播放状态
   */
  function isAdShowing() {
    return CONFIG.AD_SHOWING_SELECTORS.some(sel =>
      document.querySelector(sel) !== null
    );
  }

  /**
   * 查找跳过按钮
   */
  function findSkipButton() {
    for (const selector of CONFIG.SKIP_BUTTON_SELECTORS) {
      const btn = document.querySelector(selector);
      if (btn && btn.offsetParent !== null) {
        return btn;
      }
    }
    // 备用：遍历所有 button 查找包含 Skip 文本的
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent.toLowerCase();
      if ((text.includes('skip') || text.includes('跳过')) && btn.offsetParent !== null) {
        return btn;
      }
    }
    return null;
  }

  /**
   * 查找视频元素
   */
  function findVideo() {
    return document.querySelector('video');
  }

  /**
   * 检查是否有不可跳过广告
   */
  function hasUnskippableAd() {
    return CONFIG.UNSKIPPABLE_AD_SELECTORS.some(sel =>
      document.querySelector(sel) !== null
    );
  }

  /**
   * 点击跳过按钮（使用页面上下文）
   */
  function clickSkipButton() {
    const btn = findSkipButton();
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }

  // ========== 核心功能 ==========

  /**
   * 处理广告播放
   */
  function handleAdPlaying() {
    if (!settings.enabled) return;

    // 静音广告
    if (settings.autoMute) {
      const video = findVideo();
      if (video && !video.muted) {
        originalVolume = video.volume;
        video.muted = true;
      }
    }

    // 尝试点击跳过按钮
    if (settings.autoSkip) {
      if (clickSkipButton()) {
        chrome.runtime.sendMessage({ type: 'AD_SKIPPED' });
        return;
      }
    }

    // 快进不可跳过广告
    if (settings.fastForward && hasUnskippableAd()) {
      const video = findVideo();
      if (video && video.duration) {
        video.currentTime = video.duration - 0.1;
      }
    }
  }

  /**
   * 处理广告结束
   */
  function handleAdEnded() {
    if (!settings.enabled) return;

    // 恢复音量
    if (settings.autoMute) {
      const video = findVideo();
      if (video) {
        video.muted = false;
        video.volume = originalVolume;
      }
    }
  }

  /**
   * 主检查循环
   */
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

    // 广告播放中持续尝试跳过
    if (isAdPlaying && settings.autoSkip) {
      clickSkipButton();
    }
  }

  // ========== MutationObserver ==========

  function startObserver() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      if (!settings.enabled) return;

      for (const mutation of mutations) {
        // 检查新增节点中是否有广告相关元素
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

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // ========== 轮询机制（备用） ==========

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(checkForAds, CONFIG.POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // ========== 初始化 ==========

  function init() {
    // 加载设置
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response) {
        settings = { ...settings, ...response };
      }

      if (settings.enabled) {
        startObserver();
        startPolling();
      }
    });

    // 监听设置更新
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SETTINGS_UPDATED') {
        settings = { ...settings, ...message.settings };

        if (settings.enabled) {
          startObserver();
          startPolling();
        } else {
          stopObserver();
          stopPolling();
        }
      }
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // YouTube SPA 导航监听
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      checkForAds();
    }
  }).observe(document, { childList: true, subtree: true });

})();
