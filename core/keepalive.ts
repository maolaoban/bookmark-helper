/**
 * Service Worker 保活模块
 * 通过 chrome.alarms 定期唤醒 SW，防止空闲时被 Chrome 终止
 */

const KEEPALIVE_ALARM = 'bookmark-helper-keepalive';
const KEEPALIVE_INTERVAL_MINUTES = 0.4; // ~24 秒

let isActive = false;

export function startKeepalive(): void {
  if (isActive) return;
  isActive = true;

  chrome.alarms.create(KEEPALIVE_ALARM, {
    periodInMinutes: KEEPALIVE_INTERVAL_MINUTES,
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === KEEPALIVE_ALARM && isActive) {
      // alarm 触发本身就会重置 SW 的空闲计时器
    }
  });

  console.log('[Keepalive] 已启动');
}

export function stopKeepalive(): void {
  if (!isActive) return;
  isActive = false;

  chrome.alarms.clear(KEEPALIVE_ALARM);
  console.log('[Keepalive] 已停止');
}
