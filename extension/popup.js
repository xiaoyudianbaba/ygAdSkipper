// YouTube Ad Skipper - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const toggleEnabled = document.getElementById('toggleEnabled');
  const toggleAutoSkip = document.getElementById('toggleAutoSkip');
  const toggleAutoMute = document.getElementById('toggleAutoMute');
  const toggleFastForward = document.getElementById('toggleFastForward');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const skipCount = document.getElementById('skipCount');

  // 加载设置
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (settings) => {
    if (settings) {
      toggleEnabled.checked = settings.enabled;
      toggleAutoSkip.checked = settings.autoSkip;
      toggleAutoMute.checked = settings.autoMute;
      toggleFastForward.checked = settings.fastForward;
      updateStatus(settings.enabled);
    }
  });

  // 加载统计
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, (stats) => {
    if (stats) {
      skipCount.textContent = stats.skipCount || 0;
    }
  });

  // 更新状态显示
  function updateStatus(enabled) {
    if (enabled) {
      statusDot.classList.remove('disabled');
      statusText.textContent = '运行中';
    } else {
      statusDot.classList.add('disabled');
      statusText.textContent = '已暂停';
    }
  }

  // 保存设置
  function saveSettings() {
    const settings = {
      enabled: toggleEnabled.checked,
      autoSkip: toggleAutoSkip.checked,
      autoMute: toggleAutoMute.checked,
      fastForward: toggleFastForward.checked
    };

    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: settings
    }, () => {
      updateStatus(settings.enabled);
    });
  }

  // 绑定事件
  toggleEnabled.addEventListener('change', saveSettings);
  toggleAutoSkip.addEventListener('change', saveSettings);
  toggleAutoMute.addEventListener('change', saveSettings);
  toggleFastForward.addEventListener('change', saveSettings);
});
