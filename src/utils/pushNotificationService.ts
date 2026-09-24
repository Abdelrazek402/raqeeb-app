import { AthkarReminderSettings } from '../types';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

export async function getOrRegisterPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Fetch public VAPID key from server
      const res = await fetch('/api/push/public-key');
      if (!res.ok) throw new Error('Failed to retrieve VAPID public key');
      const data = await res.json();
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    return subscription;
  } catch (err) {
    console.warn('Push subscription error:', err);
    return null;
  }
}

export async function syncAthkarSettingsToServer(
  pairingCode: string,
  settings: AthkarReminderSettings
): Promise<{ success: boolean; message?: string }> {
  try {
    const subscription = await getOrRegisterPushSubscription();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh';

    const response = await fetch('/api/push/athkar-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pairingCode,
        subscription: subscription ? subscription.toJSON() : null,
        settings,
        timezone
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.error || 'فشل تحديث الجدول' };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (err: any) {
    console.warn('Failed to sync athkar schedule to server:', err);
    return { success: false, message: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function sendTestAthkarPush(
  pairingCode: string,
  type: 'morning' | 'evening'
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch('/api/push/test-athkar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairingCode, type })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, message: data.error || 'تعذر إرسال التنبيه التجريبي' };
    }
    return { success: true, message: data.message || 'تم إرسال الإشعار بنجاح' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'خطأ في الاتصال' };
  }
}
