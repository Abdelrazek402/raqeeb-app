import { getLocalFormattedDate } from "./dateUtils";
import { MonitoredApp, DailyStats, ChecklistItem, BlockedAttempt, IntentionLog, FocusSession, ProtectionLevel, DeviceSyncHubState, AthkarReminderSettings } from '../types';

export const INITIAL_SYNC_STATE: DeviceSyncHubState = {
  pairingCode: `RQ-${100000 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 900000)}`,
  token: 'rq_sec_' + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join(""),
  autoSync: true,
  lastFullSync: 'الآن (متزامن محلياً)',
  phoneLink: {
    isLinked: false,
    pairingCode: '',
    phoneBattery: null,
    isCharging: false,
    phoneModel: 'غير مقترن',
    wifiName: 'غير متصل',
    isRinging: false,
    focusShieldActive: false,
    sharedClipboard: '',
    clipboardSender: null,
    lastClipboardSync: null,
    lastPingSecondsAgo: 0,
    notifications: []
  },
  devices: {
    windows: {
      id: 'dev_win_active',
      name: 'هذا الجهاز (الواجهة الرئيسية)',
      platform: 'windows',
      status: 'connected',
      lastSyncTime: 'الآن (نشط)',
      version: 'v1.2.4 (النسخة الكاملة)',
      ipAddress: '127.0.0.1 (محلي)',
      stats: {
        totalTimeMinutes: 0,
        socialTimeMinutes: 0,
        browserTimeMinutes: 0,
        blockedAttemptsCount: 0,
        remindersShown: 0,
        istighfarCount: 0,
        confirmedPrayers: 0,
        focusMinutesTotal: 0
      }
    },
    android: {
      id: 'dev_and_active',
      name: 'هاتف أندرويد (بانتظام الربط)',
      platform: 'android',
      status: 'disconnected',
      lastSyncTime: 'غير مربوط بعد',
      version: 'v1.2.4 (Native APK)',
      ipAddress: 'محلي',
      stats: {
        totalTimeMinutes: 0,
        socialTimeMinutes: 0,
        browserTimeMinutes: 0,
        blockedAttemptsCount: 0,
        remindersShown: 0,
        istighfarCount: 0,
        confirmedPrayers: 0,
        focusMinutesTotal: 0
      }
    }
  }
};

export const INITIAL_MONITORED_APPS: MonitoredApp[] = [
  { id: 'chrome', name: 'جوجل كروم', nameEn: 'Google Chrome', category: 'browser', icon: 'Globe', iconBg: 'bg-blue-600', enabled: true, timeSpentMinutes: 0 },
  { id: 'edge', name: 'مايكروسوفت إيدج', nameEn: 'Microsoft Edge', category: 'browser', icon: 'Compass', iconBg: 'bg-sky-600', enabled: true, timeSpentMinutes: 0 },
  { id: 'firefox', name: 'فايرفوكس', nameEn: 'Mozilla Firefox', category: 'browser', icon: 'Flame', iconBg: 'bg-orange-600', enabled: true, timeSpentMinutes: 0 },
  { id: 'facebook', name: 'فيسبوك', nameEn: 'Facebook', category: 'social', icon: 'Facebook', iconBg: 'bg-blue-700', enabled: true, timeSpentMinutes: 0 },
  { id: 'instagram', name: 'إنستغرام', nameEn: 'Instagram', category: 'social', icon: 'Instagram', iconBg: 'bg-pink-600', enabled: true, timeSpentMinutes: 0 },
  { id: 'tiktok', name: 'تيك توك', nameEn: 'TikTok', category: 'social', icon: 'Video', iconBg: 'bg-neutral-800', enabled: true, timeSpentMinutes: 0 },
  { id: 'youtube', name: 'يوتيوب', nameEn: 'YouTube', category: 'entertainment', icon: 'Youtube', iconBg: 'bg-red-600', enabled: true, timeSpentMinutes: 0 },
  { id: 'x', name: 'منصة إكس (تويتر)', nameEn: 'X (Twitter)', category: 'social', icon: 'Twitter', iconBg: 'bg-black', enabled: true, timeSpentMinutes: 0 },
  { id: 'snapchat', name: 'سناب شات', nameEn: 'Snapchat', category: 'social', icon: 'Ghost', iconBg: 'bg-yellow-500', enabled: true, timeSpentMinutes: 0 },
  { id: 'reddit', name: 'ريديت', nameEn: 'Reddit', category: 'social', icon: 'MessageCircle', iconBg: 'bg-orange-500', enabled: true, timeSpentMinutes: 0 },
  { id: 'telegram', name: 'تيليجرام', nameEn: 'Telegram', category: 'social', icon: 'Send', iconBg: 'bg-sky-500', enabled: true, timeSpentMinutes: 0 },
  { id: 'whatsapp', name: 'واتساب ويب / تطبيق', nameEn: 'WhatsApp', category: 'social', icon: 'MessageSquare', iconBg: 'bg-emerald-600', enabled: false, timeSpentMinutes: 0 },
];

export const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: 'p1_1', phase: 1, phaseTitle: 'المرحلة 1: المعمارية والمتطلبات (Architecture)', title: 'تحديد حدود المراقبة ومستويات الصلاحيات', description: 'حصر المراقبة في المتصفحات وتطبيقات التواصل فقط دون المساس بباقي وظائف النظام.', status: 'completed', platform: 'all' },
  { id: 'p1_2', phase: 1, phaseTitle: 'المرحلة 1: المعمارية والمتطلبات (Architecture)', title: 'تصميم تدفق تنبيه النية وتذكير الـ 10 دقائق', description: 'اعتماد شاشات Overlay خفيفة قابلة للإخفاء التلقائي والسريع دون مقاطعة العمل.', status: 'completed', platform: 'all' },
  { id: 'p2_1', phase: 2, phaseTitle: 'المرحلة 2: واجهة وتجربة المستخدم (UI/UX كامل)', title: 'تصميم لوحة التحكم والرفيق الروحي الرقمي', description: 'واجهة متناسقة، مؤشرات واضحة للصلوات والوقت، خطوط عربية رصينة (Cairo و Amiri).', status: 'completed', platform: 'all' },
  { id: 'p2_2', phase: 2, phaseTitle: 'المرحلة 2: واجهة وتجربة المستخدم (UI/UX كامل)', title: 'شاشة حجب المواقع غير اللائقة (مش خايف من ربك؟)', description: 'شاشة ردع وقورة، هيبة روحانية، آيات استحضار معية الله، وزر توبة ورجوع سريع.', status: 'completed', platform: 'all' },
  { id: 'p3_1', phase: 3, phaseTitle: 'المرحلة 3: منظومة الأندرويد (Android MVP)', title: 'خدمة سهولة الاستخدام Accessibility Service', description: 'مراقبة Package Names للتطبيقات المحددة وإظهار شاشة نية خفيفة عند فتح السوشيال.', status: 'completed', platform: 'android' },
  { id: 'p3_2', phase: 3, phaseTitle: 'المرحلة 3: منظومة الأندرويد (Android MVP)', title: 'نظام حجب DNS المحلي (Local VPN Loopback)', description: 'تحويل استعلامات DNS لفلتر عائلي يمنع النطاقات الإباحية على مستوى نظام الأندرويد.', status: 'completed', platform: 'android' },
  { id: 'p4_1', phase: 4, phaseTitle: 'المرحلة 4: تطبيق ويندوز (Windows Desktop App)', title: 'مشغل الخلفية وشريط المهام (Background Tray Daemon)', description: 'خادم صامت VBScript يعمل في خلفية ويندوز كل 10 دقائق لتذكير المستخدم بالأذكار والصلوات.', status: 'completed', platform: 'windows' },
  { id: 'p4_2', phase: 4, phaseTitle: 'المرحلة 4: تطبيق ويندوز (Windows Desktop App)', title: 'تثبيت درع الحجب المحلي (Hosts & DNS & Policies)', description: 'سكربت تنفيذي مستقل يضبط DNS النظيف لجميع كروت الشبكة ويقفل النطاقات في hosts.', status: 'completed', platform: 'windows' },
  { id: 'p5_1', phase: 5, phaseTitle: 'المرحلة 5: ملحقات المتصفحات (Browser Extensions)', title: 'إضافة Chrome / Edge / Firefox (Manifest V3)', description: 'قواعد DeclarativeNetRequest لحجب المواقع + Content Script للتذكيرات المباشرة في المتصفح.', status: 'completed', platform: 'extension' },
  { id: 'p6_1', phase: 6, phaseTitle: 'المرحلة 6: محرك مواقيت الصلاة (Prayer System)', title: 'حساب المواقيت والربط بالتنبيه الملح', description: 'حساب فلكي دقيق لمواقيت الصلوات الخمس مع تنبيه "قوم قابل ربنا لقاء المحب" وتأكيد الصلاة.', status: 'completed', platform: 'all' },
  { id: 'p7_1', phase: 7, phaseTitle: 'المرحلة 7: درع حماية المواقع الإباحية (Porn Shield)', title: 'قائمة النطاقات السوداء والكلمات المحظورة والبحث الآمن', description: 'حجب النطاقات المحظورة وفلترة الكلمات المريبة وإجبار SafeSearch في Google و Bing و Edge.', status: 'completed', platform: 'all' },
  { id: 'p8_1', phase: 8, phaseTitle: 'المرحلة 8: تتبع الاستخدام وتذكيرات الـ 10 دقائق (Usage & Reminders)', title: 'مؤقت التدرج الذكي للأذكار والاستغفار', description: 'تذكير رقيق بالله والاستغفار كل 10 دقائق مع عداد استغفار تفاعلي حقيقي.', status: 'completed', platform: 'all' },
  { id: 'p9_1', phase: 9, phaseTitle: 'المرحلة 9: لوحة الإحصائيات (Dashboard + Statistics)', title: 'حصيلة اليوم والتقرير المسائي الحقيقي', description: 'عرض الصلوات المؤكدة، وقت الاستخدام الحقيقي، ومحاولات الحجب الفورية وجلسات التركيز.', status: 'completed', platform: 'all' },
  { id: 'p10_1', phase: 10, phaseTitle: 'المرحلة 10: اختبارات الأداء والأمان (Testing & Security)', title: 'منع استهلاك الذاكرة والبطارية والعمل المستقل', description: 'تطبيق أوفلاين بالكامل 100% بدون أي سيرفر خارجي، وتخزين محلي آمن في متصفحك.', status: 'completed', platform: 'all' },
  { id: 'p11_1', phase: 11, phaseTitle: 'المرحلة 11: حزم التثبيت والأدوات (Installers & Scripts)', title: 'سكربتات ويندوز التلقائية بدون إنترنت', description: 'ملفات باتش وويندوز سكريبت معربة ونظيفة للتثبيت، الفحص، والتجربة، وإلغاء التثبيت.', status: 'completed', platform: 'windows' },
  { id: 'p12_1', phase: 12, phaseTitle: 'المرحلة 12: الإصدار الإنتاجي النهائي (Production Release)', title: 'النسخة الحقيقية المستقلة الجاهزة للعمل', description: 'ملف HTML وحيد يعمل بنقرة واحدة على أي جهاز ومتصفح دون أي خوادم أو تبعيات.', status: 'completed', platform: 'all' },
];

export const INITIAL_DAILY_STATS: DailyStats = {
  date: getLocalFormattedDate(),
  confirmedPrayers: 0,
  socialTimeMinutes: 0,
  browserTimeMinutes: 0,
  blockedAttemptsCount: 0,
  remindersShown: 0,
  istighfarCount: 0,
  focusSessionsCount: 0,
  focusMinutesTotal: 0
};

export const INITIAL_BLOCKED_ATTEMPTS: BlockedAttempt[] = [];

export const STORAGE_KEYS = {
  STATS: 'raqeeb_daily_stats_v3',
  APPS: 'raqeeb_monitored_apps_v3',
  CHECKLIST: 'raqeeb_checklist_v3',
  BLOCKED_LOGS: 'raqeeb_blocked_logs_v3',
  INTENTIONS: 'raqeeb_intentions_log_v3',
  PROTECTION_LEVEL: 'raqeeb_protection_level_v3',
  CITY_ID: 'raqeeb_selected_city_v3',
  CUSTOM_CITY: 'raqeeb_custom_city_v3',
  CUSTOM_BLOCKED: 'raqeeb_custom_blocked_domains_v3',
  FOCUS_SESSIONS: 'raqeeb_focus_sessions_v3',
  CONFIRMED_PRAYERS: 'raqeeb_confirmed_prayers_v3',
  PRAYER_LOGS: 'raqeeb_prayer_logs_v3',
  WUDU_REMINDERS: 'raqeeb_wudu_reminders_v3',
  SYNC_STATE: 'raqeeb_sync_state_v3',
  ATHKAR_SETTINGS: 'raqeeb_athkar_settings_v1'
};

export const INITIAL_ATHKAR_SETTINGS: AthkarReminderSettings = {
  morningEnabled: true,
  morningTime: '06:30',
  eveningEnabled: true,
  eveningTime: '17:30',
  soundEnabled: true,
  vibrateEnabled: true,
  spiritualQuoteEnabled: true
};

export function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Storage error loading key', key, e);
    return fallback;
  }
}

export function saveStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error saving key', key, e);
  }
}
