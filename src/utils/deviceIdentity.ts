import { DeviceInfo } from '../types';

export interface LocalDeviceMetadata {
  deviceId: string;
  deviceName: string;
  platform: 'windows' | 'android';
  browserName: string;
  userAgent: string;
}

const DEVICE_ID_KEY = 'raqeeb_local_device_id_v2';
const DEVICE_NAME_KEY = 'raqeeb_local_device_name_v2';

export function generateUUIDToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const hex = Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateCryptographicToken(): string {
  return `rq-tok-${generateUUIDToken()}`;
}

export function generateDynamicPairingCode(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const num = 100000 + (array[0] % 900000);
    return `RQ-${num}`;
  }
  const num = 100000 + Math.floor(Math.random() * 900000);
  return `RQ-${num}`;
}

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'dev_server';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id || !/^dev_[a-zA-Z0-9_\-]{6,64}$/.test(id)) {
    const token = generateCryptographicToken().replace(/^rq-tok-/, '');
    const platform = detectDevicePlatform();
    id = `dev_${platform === 'android' ? 'and' : 'win'}_${token}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function detectDevicePlatform(): 'windows' | 'android' {
  if (typeof window === 'undefined') return 'windows';
  const params = new URLSearchParams(window.location.search);
  const devParam = params.get('device');
  if (devParam === 'android' || devParam === 'mobile') return 'android';
  if (devParam === 'windows' || devParam === 'pc') return 'windows';
  if (params.has('pairing_code')) return 'android';

  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isMobile || window.innerWidth < 768 ? 'android' : 'windows';
}

export function getDeviceFriendlyName(platform: 'windows' | 'android'): string {
  if (typeof window === 'undefined') return 'جهاز غير معروف';
  const custom = localStorage.getItem(DEVICE_NAME_KEY);
  if (custom && custom.trim()) return custom.trim();

  const ua = navigator.userAgent;
  let browser = 'المتصفح';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';

  if (platform === 'android') {
    if (ua.includes('Samsung')) return `هاتف Samsung Galaxy (${browser})`;
    if (ua.includes('Xiaomi') || ua.includes('Redmi')) return `هاتف Xiaomi / Redmi (${browser})`;
    if (ua.includes('Pixel')) return `هاتف Google Pixel (${browser})`;
    if (ua.includes('iPhone')) return `هاتف iPhone (${browser})`;
    return `هاتف أندرويد (${browser})`;
  } else {
    if (ua.includes('Windows NT 10.0')) return `حاسوب Windows 10/11 (${browser})`;
    if (ua.includes('Macintosh')) return `حاسوب macOS (${browser})`;
    if (ua.includes('Linux')) return `حاسوب Linux (${browser})`;
    return `حاسوب شخصي (${browser})`;
  }
}

export function setCustomDeviceName(name: string): void {
  if (typeof window !== 'undefined' && name.trim()) {
    localStorage.setItem(DEVICE_NAME_KEY, name.trim());
  }
}
