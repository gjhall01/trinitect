'use client';

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function getNotifPermission(): NotifPermission {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as NotifPermission;
}

export async function requestNotifPermission(): Promise<NotifPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  return result as NotifPermission;
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // SW registration failure is non-fatal
  });
}

// Show a local notification (requires permission already granted)
export function showLocalNotification(title: string, body: string, url = '/today'): void {
  if (getNotifPermission() !== 'granted') return;
  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(title, {
      body,
      icon: '/icon-192.png',
      tag: 'trinitect-daily',
      data: { url },
    });
  }).catch(() => {
    // Fallback to direct Notification API if SW not ready
    new Notification(title, { body, icon: '/icon-192.png' });
  });
}

// Call on app load — shows a reminder if it's been 20+ hours since last visit
export function checkAndShowDailyReminder(name: string): void {
  if (getNotifPermission() !== 'granted') return;
  const LAST_KEY = 'trinitect_last_notif';
  const last = parseInt(localStorage.getItem(LAST_KEY) || '0', 10);
  const now = Date.now();
  const h = new Date().getHours();
  // Only fire between 7am–9am or 6pm–8pm, and only once per 20 hours
  const isReminderWindow = (h >= 7 && h < 9) || (h >= 18 && h < 20);
  if (!isReminderWindow || now - last < 20 * 3600 * 1000) return;
  localStorage.setItem(LAST_KEY, String(now));
  const isEvening = h >= 18;
  showLocalNotification(
    isEvening ? "Don't break the chain." : `Good morning${name ? ', ' + name : ''}.`,
    isEvening
      ? "Your patterns are still waiting. 15 minutes compounds."
      : "Today's practice is ready. Build the pattern.",
    '/today'
  );
}
