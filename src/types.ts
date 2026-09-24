export type ActiveTab = 'analytics' | 'dashboard' 
  | 'sync'
  | 'focus' 
  | 'quran'
  | 'companion'
  | 'adhkar'
  | 'simulator'
  | 'apps' 
  | 'protection' 
  | 'prayers' 
  | 'extension'
  | 'checklist';

export type ProtectionLevel = 1 | 2 | 3 | 4;
export type DeviceViewFilter = 'all' | 'windows' | 'android';

export interface DeviceStats {
  totalTimeMinutes: number;
  socialTimeMinutes: number;
  browserTimeMinutes: number;
  blockedAttemptsCount: number;
  remindersShown: number;
  istighfarCount: number;
  confirmedPrayers: number;
  focusMinutesTotal: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  platform: 'windows' | 'android';
  status: 'connected' | 'syncing' | 'offline' | 'disconnected';
  lastSyncTime: string;
  version: string;
  ipAddress?: string;
  batteryLevel?: number;
  isCharging?: boolean;
  wifiSsid?: string;
  isFocusShieldActive?: boolean;
  isRinging?: boolean;
  stats: DeviceStats;
}

export interface PhoneLinkNotification {
  id: string;
  title: string;
  body: string;
  source: 'android' | 'windows';
  type: 'prayer' | 'blocked' | 'reminder' | 'clipboard' | 'ring' | 'focus';
  timestamp: string;
  read: boolean;
}

export interface PhoneLinkState {
  isLinked: boolean;
  pairingCode: string;
  phoneBattery: number | null;
  isCharging: boolean;
  phoneModel: string;
  wifiName: string;
  isRinging: boolean;
  focusShieldActive: boolean;
  sharedClipboard: string;
  clipboardSender: 'windows' | 'android' | null;
  lastClipboardSync: string | null;
  lastPingSecondsAgo: number;
  notifications: PhoneLinkNotification[];
}

export interface DeviceSyncHubState {
  pairingCode: string;
  token: string;
  autoSync: boolean;
  lastFullSync: string;
  phoneLink: PhoneLinkState;
  devices: {
    windows: DeviceInfo;
    android: DeviceInfo;
  };
}

export interface MonitoredApp {
  id: string;
  name: string;
  nameEn: string;
  category: 'browser' | 'social' | 'entertainment';
  icon: string;
  iconBg: string;
  enabled: boolean;
  dailyLimitMinutes?: number;
  timeSpentMinutes: number;
}

export interface IntentionLog {
  id: string;
  timestamp: string;
  appName: string;
  intent: string;
  category: 'useful' | 'study' | 'quick_search' | 'browsing' | 'custom';
}

export interface BlockedAttempt {
  id: string;
  timestamp: string;
  urlOrQuery: string;
  reason: string;
  app: string;
}

export interface PrayerInfo {
  id: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameAr: string;
  time: string; // HH:mm
  confirmed: boolean;
  confirmedAt?: string;
}

export interface PrayerLogItem {
  id: string;
  prayerId: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  prayerName: string;
  scheduledTime: string; // HH:mm
  scheduledDateTimeISO: string;
  completedAtISO: string;
  dateStr: string; // YYYY-MM-DD
  delayMinutes: number; // Difference in minutes
  isDelayedAfterNextPrayer: boolean;
  justification?: 'travel_combined' | 'excuse_valid' | 'none_world_distraction';
  justificationText?: string;
  isCongregationOrMosque: boolean;
  feedbackMessage: string;
}

export interface WuduReminder {
  id: string;
  prayerName: string;
  prayerTime: string;
  triggerTimestamp: number; // epoch ms
  isActive: boolean;
}

export interface AthkarReminderSettings {
  morningEnabled: boolean;
  morningTime: string; // HH:mm format, 24h
  eveningEnabled: boolean;
  eveningTime: string; // HH:mm format, 24h
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  spiritualQuoteEnabled: boolean;
  lastMorningAlertDate?: string; // YYYY-MM-DD
  lastEveningAlertDate?: string; // YYYY-MM-DD
}

export interface FocusTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface FocusSession {
  id: string;
  goal: string;
  durationMinutes: number;
  remainingSeconds: number;
  isActive: boolean;
  isCompleted: boolean;
  startedAt: string;
  completedAt?: string;
  reflections?: string;
  tasks?: FocusTask[];
}

export interface DailyStats {
  date: string;
  confirmedPrayers: number;
  socialTimeMinutes: number;
  browserTimeMinutes: number;
  blockedAttemptsCount: number;
  remindersShown: number;
  istighfarCount: number;
  focusSessionsCount: number;
  focusMinutesTotal: number;
  streakDays?: number;
  quranPagesRead?: number;
}

export interface ChecklistItem {
  id: string;
  phase: number;
  phaseTitle: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'tested' | 'completed';
  platform: 'android' | 'windows' | 'extension' | 'all';
}

// ==========================================
// PHASE 01: EXTENDED DOMAIN MODELS
// ==========================================

export interface QuranSurah {
  number: number;
  name: string; // Arabic name (e.g. سُورَةُ ٱلْفَاتِحَةِ)
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  pageNumber: number; // Approximate starting page in standard Madinah Mushaf (604 pages)
}

export interface QuranAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surahNumber?: number;
  surahName?: string;
  hizbQuarter?: number;
}

export interface QuranPageData {
  pageNumber: number;
  ayahs: QuranAyah[];
  surahsInPage: { number: number; name: string; englishName: string }[];
  juz: number;
  hizbQuarter?: number;
}

export interface QuranReciter {
  id: string;
  nameAr: string;
  nameEn: string;
  serverUrl: string; // mp3quran server URL base
  format: string; // e.g. 128kbps mp3
}

export interface QuranBookmarkItem {
  id: string;
  page: number;
  surahNumber: number;
  surahName: string;
  juzNumber: number;
  note?: string;
  createdAt: string;
}

export interface KhatmahState {
  currentPage: number; // 1 to 604
  currentSurahNumber: number;
  dailyPagesTarget: number; // default 20 pages (1 Juz)
  startDate: string;
  lastReadDate: string;
  bookmarkPage: number;
  bookmarkSurahName: string;
  completedKhatmahsCount: number;
  notes?: string;
}

export type HifzStrength = 'mastered' | 'good' | 'needs_practice';

export interface HifzPageItem {
  strength: HifzStrength;
  lastReviewed: string;
  repetitions: number;
}

export interface HifzLog {
  id: string;
  date: string;
  type: 'new_hifz' | 'revision' | 'testing';
  pageStart: number;
  pageEnd: number;
  surahName?: string;
  notes?: string;
}

export interface HifzState {
  memorizedPages: number[]; // e.g. [1, 2, 3, ...]
  pagesStatus: Record<number, HifzPageItem>;
  surahsStatus: Record<number, { isMemorized: boolean; strength: HifzStrength; lastReviewed: string; repetitions: number }>;
  dailyTarget: {
    newPagesCount: number;
    revisionPagesCount: number;
  };
  dailyRevisionPlan: {
    newHifzStartPage?: number;
    newHifzEndPage?: number;
    revisionStartPage?: number;
    revisionEndPage?: number;
    completedToday: boolean;
    lastCompletedDate?: string;
  };
  historyLogs: HifzLog[];
}

export type QuranNavType = 'surah' | 'juz' | 'hizb' | 'quarter' | 'page';

export type WhyCategory = 'intention' | 'istighfar' | 'protection' | 'prayer' | 'quran';

export interface WhyCard {
  id: string;
  category: WhyCategory;
  title: string;
  subtitle: string;
  theologicalProof: {
    verseOrHadith: string;
    reference: string;
    explanation: string;
  };
  psychologicalInsight: string;
  practicalAdvice: string;
  actionLabel?: string;
}

export type MoonPhase = 'new_moon' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full_moon';

export interface SpiritualStreakInfo {
  consecutiveDays: number;
  moonPhase: MoonPhase;
  phaseTitle: string;
  calmReflection: string;
  lastActiveDate: string;
}

export interface NarrativeDailyReport {
  tone: 'peaceful' | 'encouraging' | 'steadfast';
  openingTitle: string;
  narrativeBody: string;
  spiritualFocus: string;
  suggestedAction: string;
}

export type VictoryCategory = 
  | 'gaze_lowered'          // غض بصر
  | 'prayer_completed'      // إتمام صلاة
  | 'quran_recited'         // قراءة ورد
  | 'resisted_urge'         // مقاومة وسواس
  | 'istighfar_adhkar'      // استغفار وذكر
  | 'panic_rescue'          // زر النجدة والاستغاثة
  | 'work_accomplishment'   // إنجاز عمل
  | 'sports_fitness';       // رياضة

export interface VictoryLog {
  id: string;
  timestamp: string;
  type?: 'panic_button' | 'resisted_urge' | 'closed_tab' | 'istighfar';
  category?: VictoryCategory;
  categoryLabel?: string;
  title: string;
  notes?: string;
}

export interface TawbahStep {
  id: string;
  title: string;
  desc: string;
  actionText?: string;
  completed: boolean;
}

export interface QiblaData {
  bearing: number;
  distanceKm: number;
}

