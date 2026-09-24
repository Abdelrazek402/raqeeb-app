import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { 
  ActiveTab, 
  ProtectionLevel, 
  MonitoredApp, 
  PrayerInfo, 
  DailyStats, 
  ChecklistItem, 
  BlockedAttempt, 
  IntentionLog, 
  FocusSession,
  FocusTask,
  DeviceSyncHubState,
  DeviceViewFilter,
  VictoryLog,
  VictoryCategory,
  AthkarReminderSettings
} from './types';
import { 
  CITIES_LIST, 
  CityPreset, 
  calculatePrayerTimes, 
  getNextPrayer, 
  formatTimeArabic 
} from './utils/prayerTimes';
import { 
  INITIAL_MONITORED_APPS, 
  INITIAL_CHECKLIST, 
  INITIAL_DAILY_STATS, 
  INITIAL_BLOCKED_ATTEMPTS, 
  INITIAL_SYNC_STATE,
  INITIAL_ATHKAR_SETTINGS,
  STORAGE_KEYS, 
  loadStored, 
  saveStored 
} from './utils/storage';
import { sounds } from './utils/audio';
import { syncAthkarSettingsToServer } from './utils/pushNotificationService';
import { advanceKhatmah } from './services/quranService';

import { saveWuduReminder, savePrayerLog } from './services/prayerLogService';

import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useCloudSync } from './hooks/useCloudSync';

// Core UI Components (Direct load for instant First Meaningful Paint)
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { FocusModeView } from './components/FocusModeView';
import { PrayerTimesView } from './components/PrayerTimesView';
import { AiCompanionView } from './components/AiCompanionView';

// Code-split Tab Views (Loaded on demand via React.lazy)
const DeviceSyncHubView = lazy(() => import('./components/DeviceSyncHubView').then(m => ({ default: m.DeviceSyncHubView })));
const QuranReaderView = lazy(() => import('./components/QuranReaderView').then(m => ({ default: m.QuranReaderView })));
const AdhkarView = lazy(() => import('./components/AdhkarView').then(m => ({ default: m.AdhkarView })));
const ProtectionSettingsView = lazy(() => import('./components/ProtectionSettingsView').then(m => ({ default: m.ProtectionSettingsView })));
const MonitoredAppsView = lazy(() => import('./components/MonitoredAppsView').then(m => ({ default: m.MonitoredAppsView })));
const ExtensionExportView = lazy(() => import('./components/ExtensionExportView').then(m => ({ default: m.ExtensionExportView })));
const ChecklistView = lazy(() => import('./components/ChecklistView').then(m => ({ default: m.ChecklistView })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then(m => ({ default: m.AnalyticsView })));

import { isUrlOrQueryBlocked } from './utils/blocklist';

// Live Popups / Overlays
import { IntentionOverlay } from './components/IntentionOverlay';
import { PeriodicReminderModal } from './components/PeriodicReminderModal';
import { AdultBlockScreen } from './components/AdultBlockScreen';
import { PrayerAlertModal } from './components/PrayerAlertModal';
import { NextPrayerInfoModal } from './components/NextPrayerInfoModal';
import { InstallGuideModal } from './components/InstallGuideModal';
const PanicRescueModal = lazy(() => import('./components/PanicRescueModal').then(m => ({ default: m.PanicRescueModal })));
const TawbahPlanModal = lazy(() => import('./components/TawbahPlanModal').then(m => ({ default: m.TawbahPlanModal })));
import { MiniFloatingBar } from './components/MiniFloatingBar';
import { FloatingWidgetGuideModal } from './components/FloatingWidgetGuideModal';
import { GlobalAudioBar } from './components/GlobalAudioBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NightShieldView } from './components/NightShieldView';
import { getLocalFormattedDate } from './utils/dateUtils';
import { downloadSpiritualReport, ReportPeriodType } from './utils/reportExport';
import { BellRing, Copy, X, Bell } from 'lucide-react';

function MainApp() {

  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as ActiveTab;
      if (tabParam && ['dashboard', 'monitored_apps', 'protection', 'prayers', 'adhkar', 'quran', 'focus', 'analytics', 'sync', 'companion', 'extension', 'checklist'].includes(tabParam)) {
        return tabParam;
      }
    }
    return 'dashboard';
  });
  const [adhkarInitialCategory, setAdhkarInitialCategory] = useState<'morning' | 'evening' | undefined>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat === 'morning' || cat === 'evening') return cat;
    }
    return undefined;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Daily Athkar Reminder Settings (Background Alerts)
  const [athkarSettings, setAthkarSettings] = useState<AthkarReminderSettings>(() => 
    loadStored<AthkarReminderSettings>(STORAGE_KEYS.ATHKAR_SETTINGS, INITIAL_ATHKAR_SETTINGS)
  );

  // Developer Mode (for Windows scripts & production checklist)
  const [isDevMode, setIsDevMode] = useState<boolean>(() => 
    loadStored<boolean>('raqeeb_dev_mode_enabled', false)
  );

  const handleToggleDevMode = () => {
    setIsDevMode(prev => {
      const nextVal = !prev;
      saveStored('raqeeb_dev_mode_enabled', nextVal);
      if (!nextVal && (activeTab === 'extension' || activeTab === 'checklist')) {
        setActiveTab('dashboard');
      }
      return nextVal;
    });
  };

  // Floating Companion Bar State (User Preference across PC/Mobile/Tablet)
  const [showFloatingBar, setShowFloatingBar] = useState<boolean>(() => 
    loadStored<boolean>('raqeeb_show_floating_bar', true)
  );
  const [isFloatingGuideOpen, setIsFloatingGuideOpen] = useState(false);

  const handleToggleFloatingBar = (enabled?: boolean) => {
    setShowFloatingBar(prev => {
      const nextVal = typeof enabled === 'boolean' ? enabled : !prev;
      saveStored('raqeeb_show_floating_bar', nextVal);
      return nextVal;
    });
  };

  // Night Shield State
  const [isNightShieldActive, setIsNightShieldActive] = useState(false);
  const [nightShieldDismissed, setNightShieldDismissed] = useState(false);

  // Protection Level (1 | 2 | 3 | 4)
  const [protectionLevel, setProtectionLevel] = useState<ProtectionLevel>(() => 
    loadStored<ProtectionLevel>(STORAGE_KEYS.PROTECTION_LEVEL, 2)
  );

  // Selected City & Prayer Times
  const [selectedCity, setSelectedCity] = useState<CityPreset>(() => {
    const savedCityId = loadStored<string>(STORAGE_KEYS.CITY_ID, 'cairo');
    if (savedCityId === 'auto') {
      const custom = loadStored<CityPreset | null>(STORAGE_KEYS.CUSTOM_CITY, null);
      if (custom) return custom;
    }
    return CITIES_LIST.find(c => c.id === savedCityId) || CITIES_LIST[0];
  });

  const [prayers, setPrayers] = useState<PrayerInfo[]>(() => {
    const initial = calculatePrayerTimes(selectedCity);
    const confirmedMap = loadStored<Record<string, boolean>>(STORAGE_KEYS.CONFIRMED_PRAYERS, {});
    return initial.map(p => ({
      ...p,
      confirmed: !!confirmedMap[p.id]
    }));
  });

  // Monitored Apps
  const [monitoredApps, setMonitoredApps] = useState<MonitoredApp[]>(() => 
    loadStored<MonitoredApp[]>(STORAGE_KEYS.APPS, INITIAL_MONITORED_APPS)
  );


  // Daily Stats
  const [dailyStats, setDailyStats] = useState<DailyStats>(() => 
    loadStored<DailyStats>(STORAGE_KEYS.STATS, INITIAL_DAILY_STATS)
  );

  // Blocked Attempts Log
  // Load and sanitize blocked attempts to ensure privacy
  const [blockedAttempts, setBlockedAttempts] = useState<BlockedAttempt[]>(() => {
    const rawLogs = loadStored<BlockedAttempt[]>(STORAGE_KEYS.BLOCKED_LOGS, INITIAL_BLOCKED_ATTEMPTS);
    return rawLogs.map(item => ({
      ...item,
      urlOrQuery: 'محاولة حجب محتوى غير لائق',
      reason: item.reason ? item.reason.replace(/\s*\([^)]*\)/g, '') : 'تم التصدي للمحاولة تلقائياً'
    }));
  });

  // Intentions Log
  const [recentIntentions, setRecentIntentions] = useState<IntentionLog[]>(() => 
    loadStored<IntentionLog[]>(STORAGE_KEYS.INTENTIONS, [])
  );

  // Custom Blocked Domains
  const [customBlockedDomains, setCustomBlockedDomains] = useState<string[]>(() => 
    loadStored<string[]>(STORAGE_KEYS.CUSTOM_BLOCKED, [])
  );

  // Focus Session State
  const [activeFocusSession, setActiveFocusSession] = useState<FocusSession | null>(() => 
    loadStored<FocusSession | null>(STORAGE_KEYS.FOCUS_SESSIONS, null)
  );

  // Multi-Device Synchronization State (Windows PC + Android Phone)
  const [syncState, setSyncState] = useState<DeviceSyncHubState>(() => {
    const stored = loadStored<DeviceSyncHubState>(STORAGE_KEYS.SYNC_STATE, INITIAL_SYNC_STATE);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('pairing_code') || params.get('pair') || params.get('code');
      if (urlCode && /^RQ-[A-Za-z0-9_\-]{4,32}$/i.test(urlCode.trim())) {
        return {
          ...stored,
          pairingCode: urlCode.trim().toUpperCase(),
          devices: {
            ...stored.devices,
            android: {
              ...stored.devices.android,
              status: 'connected',
              lastSyncTime: 'متصل سحابياً الآن'
            }
          }
        };
      }
    }
    return stored;
  });
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<DeviceViewFilter>('all');

  const handleUpdateAthkarSettings = (newSettings: AthkarReminderSettings) => {
    setAthkarSettings(newSettings);
    saveStored(STORAGE_KEYS.ATHKAR_SETTINGS, newSettings);
    syncAthkarSettingsToServer(syncState.pairingCode, newSettings).catch(() => {});
  };

  // Sync Athkar settings to server push daemon on initial load
  useEffect(() => {
    if (syncState.pairingCode) {
      syncAthkarSettingsToServer(syncState.pairingCode, athkarSettings).catch(() => {});
    }
  }, [syncState.pairingCode]);

  // Foreground/Active Tab Timer for Athkar Reminders
  useEffect(() => {
    const checkAthkarInterval = setInterval(() => {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMin = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMin}`;
      const todayStr = getLocalFormattedDate();

      // Morning Dhikr Check
      if (
        athkarSettings.morningEnabled &&
        athkarSettings.morningTime === currentTimeStr &&
        athkarSettings.lastMorningAlertDate !== todayStr
      ) {
        setAthkarSettings(prev => {
          const next = { ...prev, lastMorningAlertDate: todayStr };
          saveStored(STORAGE_KEYS.ATHKAR_SETTINGS, next);
          return next;
        });

        if (athkarSettings.soundEnabled) sounds.playSuccessTone();

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('☀️ حان وقت أذكار الصباح المباركة', {
            body: '«أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ» .. حصّن يومك ونفسك الآن بذكر الله.',
            icon: '/pwa-192x192.png'
          });
        }
      }

      // Evening Dhikr Check
      if (
        athkarSettings.eveningEnabled &&
        athkarSettings.eveningTime === currentTimeStr &&
        athkarSettings.lastEveningAlertDate !== todayStr
      ) {
        setAthkarSettings(prev => {
          const next = { ...prev, lastEveningAlertDate: todayStr };
          saveStored(STORAGE_KEYS.ATHKAR_SETTINGS, next);
          return next;
        });

        if (athkarSettings.soundEnabled) sounds.playSuccessTone();

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('🌙 حان وقت أذكار المساء المباركة', {
            body: '«أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ» .. حصّن نفسك وأهلك واختم نهارك بذكر الله.',
            icon: '/pwa-192x192.png'
          });
        }
      }
    }, 30000);

    return () => clearInterval(checkAthkarInterval);
  }, [athkarSettings]);

  // Global Application Notifications
  const [appNotification, setAppNotification] = useState<{title: string, message: string} | null>(null);

  const triggerAppNotification = (title: string, message: string) => {
    setAppNotification({ title, message });
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: message, icon: '/raqeeq-icon.png' });
      } catch (e) {
        console.warn('Notification error:', e);
      }
    }
    sounds.playSuccessTone();
    setTimeout(() => setAppNotification(null), 10000); // Hide after 10 seconds
  };

  // Checklist state (Execution Plan & Readiness)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() => 
    loadStored<ChecklistItem[]>(STORAGE_KEYS.CHECKLIST, INITIAL_CHECKLIST)
  );

  const handleUpdateChecklistStatus = (itemId: string, status: ChecklistItem['status']) => {
    setChecklistItems(prev => {
      const updated = prev.map(item => item.id === itemId ? { ...item, status } : item);
      saveStored(STORAGE_KEYS.CHECKLIST, updated);
      return updated;
    });
  };

  // Panic Rescue & Tawbah Plan State
  const [isPanicOpen, setIsPanicOpen] = useState(false);
  const [isTawbahOpen, setIsTawbahOpen] = useState(false);
  const [victories, setVictories] = useState<VictoryLog[]>(() => 
    loadStored<VictoryLog[]>('raqeeb_victory_logs', [
      {
        id: 'vic_initial_1',
        timestamp: 'اليوم',
        type: 'panic_button',
        category: 'gaze_lowered',
        categoryLabel: 'غض بصر',
        title: 'صمود واستغاثة فورية عند ورود الخاطرة',
        notes: 'تم تفعيل زر غض البصر والاستماع لآية الكرسي حتى زالت الفكرة بفضل الله'
      },
      {
        id: 'vic_initial_2',
        timestamp: 'اليوم',
        category: 'prayer_completed',
        categoryLabel: 'إتمام صلاة',
        title: 'إتمام صلاة الفجر في وقتها بخشوع',
        notes: 'الاستيقاظ المبكر مع الأذكار وصلاة ركعتي الفجر'
      },
      {
        id: 'vic_initial_3',
        timestamp: 'اليوم',
        category: 'quran_recited',
        categoryLabel: 'قراءة ورد',
        title: 'تلاوة الورد القرآني اليومي (حزب كامل)',
        notes: 'تدبر الآيات واستحضار النية الخالصة'
      },
      {
        id: 'vic_initial_4',
        timestamp: 'اليوم',
        category: 'work_accomplishment',
        categoryLabel: 'إنجاز عمل',
        title: 'إتمام جلسة عمل نافعة بتركيز عالٍ',
        notes: 'استثمار ساعتين في إنجاز المهام المطلوبة بإتقان وتجنب الفراغ والتشتت'
      },
      {
        id: 'vic_initial_5',
        timestamp: 'اليوم',
        category: 'sports_fitness',
        categoryLabel: 'رياضة',
        title: 'نشاط بدني وتمرين رياضي لتفريغ الطاقة',
        notes: 'ممارسة رياضة تقوية البدن، المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف'
      }
    ])
  );

  const handleClaimVictory = (notesOrTitle?: string, category: VictoryCategory = 'panic_rescue', notes?: string) => {
    const defaultLabels: Record<VictoryCategory, string> = {
      gaze_lowered: 'غض بصر',
      prayer_completed: 'إتمام صلاة',
      quran_recited: 'قراءة ورد',
      work_accomplishment: 'إنجاز عمل',
      sports_fitness: 'رياضة',
      resisted_urge: 'مقاومة وسواس',
      istighfar_adhkar: 'استغفار وذكر',
      panic_rescue: 'زر الاستغاثة'
    };

    const defaultNotesMap: Record<VictoryCategory, string> = {
      gaze_lowered: 'غض للبصر وصيانة للقلب والسمع والبصر عما حرم الله',
      prayer_completed: 'أداء الفريضة في وقتها بخشوع وحضور قلب',
      quran_recited: 'تلاوة آيات بينات من كتاب الله وتدبر معانيه',
      work_accomplishment: 'استثمار مبارك للوقت في إنجاز عمل نافع وبناء مستقبل صالح',
      sports_fitness: 'ممارسة الرياضة وتقوية البدن (المؤمن القوي خير وأحب إلى الله)',
      resisted_urge: 'ثبات واستعاذة من وساوس الشيطان وهواه',
      istighfar_adhkar: 'لهج اللسان بذكر الله والاستغفار لتطهير القلب',
      panic_rescue: 'لجوء سريع إلى الله وزر الاستغاثة وتجاوز لحظة الخطر'
    };

    const newVic: VictoryLog = {
      id: `vic_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      type: category === 'panic_rescue' ? 'panic_button' : 'resisted_urge',
      category,
      categoryLabel: defaultLabels[category],
      title: notesOrTitle && !notes ? (notesOrTitle.startsWith('نصر') || notesOrTitle.startsWith('إتمام') || notesOrTitle.startsWith('صمود') || notesOrTitle.startsWith('إنجاز') || notesOrTitle.startsWith('ممارسة') ? notesOrTitle : `نصر ومكتسب: ${defaultLabels[category]}`) : (notesOrTitle || `نصر ومكتسب: ${defaultLabels[category]}`),
      notes: notes || (notesOrTitle && (notesOrTitle.startsWith('نصر') || notesOrTitle.startsWith('إتمام')) ? undefined : notesOrTitle) || defaultNotesMap[category] || 'ثبات واستغلال للوقت في الطاعات والأمور النافعة'
    };
    setVictories(prev => {
      const updated = [newVic, ...prev];
      saveStored('raqeeb_victory_logs', updated);
      return updated;
    });

    setDailyStats(prev => {
      const updated = {
        ...prev,
        istighfarCount: prev.istighfarCount + 10,
        streakDays: Math.max(prev.streakDays || 1, 1)
      };
      saveStored(STORAGE_KEYS.STATS, updated);
      return updated;
    });
  };

  const handleExportReport = (period: ReportPeriodType = 'today') => {
    downloadSpiritualReport(period, dailyStats, prayers, victories, dailyStats.streakDays || 1, syncState, blockedAttempts);
  };

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.warn("Direct install prompt error, showing guide modal instead:", err);
      }
    }
    // Always open the rich, interactive install guide modal
    setIsInstallGuideOpen(true);
  };

  // Real-time Firebase Sync for Multi-Device Pairing & Remote Control
  const {
    isCloudConnected,
    currentDeviceType,
    setCurrentDeviceType,
    localDeviceId,
    localDeviceName,
    isPhoneRinging,
    incomingClipboard,
    pushToCloud,
    sendCommand,
    triggerInstantSync,
    joinSession,
    regeneratePairingCode,
    dismissRing,
    dismissClipboard
  } = useFirebaseSync(
    syncState, 
    setSyncState,
    dailyStats,
    prayers,
    blockedAttempts,
    (prayerId) => {
      const matching = prayers.find(p => p.id === prayerId || p.nameAr.includes(prayerId));
      if (matching && !matching.confirmed) {
        handleTogglePrayer(matching.id);
      }
    }
  );

  // Cloud Sync
  useCloudSync(
    dailyStats,
    setDailyStats,
    monitoredApps,
    setMonitoredApps,
    blockedAttempts,
    setBlockedAttempts,
    protectionLevel,
    setProtectionLevel,
    customBlockedDomains,
    setCustomBlockedDomains,
    prayers,
    setPrayers
  );


  const syncStateRef = useRef(syncState);
  useEffect(() => {
    syncStateRef.current = syncState;
  }, [syncState]);

  // Real Active Session Tracking: increments browser/session minutes every 60 seconds
  useEffect(() => {
    const handleDailyReset = () => {
      const today = getLocalFormattedDate();
      setDailyStats(prev => {
        if (prev.date !== today) {
          // It's a new day! Handle streak calculation
          // If all prayers were confirmed yesterday (or 5 prayers), they keep the streak
          const earnedStreak = prev.confirmedPrayers >= 5;
          const newStreak = earnedStreak ? (prev.streakDays || 0) + 1 : 1;
          
          return {
            ...INITIAL_DAILY_STATS,
            date: today,
            streakDays: newStreak
          };
        }
        return prev;
      });

      // Also reset prayers confirmations if it's a new day
      setPrayers(prev => {
        // We only care about resetting if the date in dailyStats changed, 
        // but since state updates are asynchronous, we compare with our own tracking
        const storedDate = localStorage.getItem('raqeeb_last_prayer_date') || today;
        if (storedDate !== today) {
          localStorage.setItem('raqeeb_last_prayer_date', today);
          return prev.map(p => ({ ...p, confirmed: false }));
        }
        return prev;
      });
    };

    // Run on mount to ensure we catch any timezone/date change while app was closed
    handleDailyReset();

    const sessionTimer = setInterval(() => {
      handleDailyReset(); // Check for midnight crossover every minute

      // Night Shield Check (12 AM to 4 AM)
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 4) {
        if (!nightShieldDismissed) setIsNightShieldActive(true);
      } else {
        setIsNightShieldActive(false);
        setNightShieldDismissed(false);
      }

      setDailyStats(prev => ({
        ...prev,
        browserTimeMinutes: (prev.browserTimeMinutes || 0) + 1
      }));
      setSyncState(prev => ({
        ...prev,
        devices: {
          ...prev.devices,
          windows: {
            ...prev.devices.windows,
            stats: {
              ...prev.devices.windows.stats,
              browserTimeMinutes: (prev.devices.windows.stats.browserTimeMinutes || 0) + 1,
              totalTimeMinutes: (prev.devices.windows.stats.totalTimeMinutes || 0) + 1
            }
          }
        }
      }));

      // Phase 5: Smart Sync & Batch Writes
      // Push state to Firebase only once every 5 minutes
      if ((syncStateRef.current.devices.windows.stats.browserTimeMinutes || 0) % 5 === 0 && syncStateRef.current.autoSync) {
        pushToCloud(syncStateRef.current);
      }

    }, 60000);

    // Initial check
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) {
      if (!nightShieldDismissed) setIsNightShieldActive(true);
    }

    return () => clearInterval(sessionTimer);
  }, [nightShieldDismissed]);

  const handleUpdateSyncState = (newSyncState: DeviceSyncHubState) => {
    setSyncState(newSyncState);
    saveStored(STORAGE_KEYS.SYNC_STATE, newSyncState);
    pushToCloud(newSyncState);
  };

  // Sound toggle
  const [isMuted, setIsMuted] = useState(false);

  // Modals & Overlays Visibility
  const [overlayIntention, setOverlayIntention] = useState<{ isOpen: boolean; appName: string }>({
    isOpen: false,
    appName: 'جوجل كروم'
  });

  const [overlayReminder, setOverlayReminder] = useState<{ isOpen: boolean; appName: string; minutes: number }>({
    isOpen: false,
    appName: 'جوجل كروم',
    minutes: 10
  });

  const [overlayAdultBlock, setOverlayAdultBlock] = useState<{ isOpen: boolean; url: string; reason: string }>({
    isOpen: false,
    url: '',
    reason: ''
  });

  // Global Unified Blocklist Check Listener across components and windows
  useEffect(() => {
    const handleUrlCheck = (event: Event) => {
      const customEvent = event as CustomEvent<{ url: string }>;
      if (customEvent?.detail?.url) {
        const checkResult = isUrlOrQueryBlocked(customEvent.detail.url, customBlockedDomains);
        if (checkResult.blocked) {
          setOverlayAdultBlock({
            isOpen: true,
            url: customEvent.detail.url,
            reason: checkResult.reason || 'محتوى أو نطاق محظور لحفظ البصر'
          });
        }
      }
    };

    window.addEventListener('raqeeb_check_url', handleUrlCheck);
    return () => window.removeEventListener('raqeeb_check_url', handleUrlCheck);
  }, [customBlockedDomains]);

  const [isNextPrayerInfoOpen, setIsNextPrayerInfoOpen] = useState(false);

  const [overlayPrayerAlert, setOverlayPrayerAlert] = useState<{ isOpen: boolean; name: string; time: string }>({
    isOpen: false,
    name: '',
    time: ''
  });

  // Wudu 5-minute reminder tracking
  const [activeWuduReminder, setActiveWuduReminder] = useState<{
    prayerName: string;
    prayerTime: string;
    targetTimeStr: string;
  } | null>(null);

  const handleSnoozeWudu = (prayerName: string, prayerTime: string) => {
    setOverlayPrayerAlert({ isOpen: false, name: '', time: '' });

    const targetDate = new Date(Date.now() + 5 * 60 * 1000);
    const targetTimeStr = targetDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    saveWuduReminder(prayerName, 5);
    setActiveWuduReminder({ prayerName, prayerTime, targetTimeStr });

    sounds.playSuccessTone();

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('تم تفعيل تذكير الوضوء 🚿', {
          body: `سنذكرك مجدداً بعد 5 دقائق (${targetTimeStr}) لصلاة ${prayerName}. تقبل الله طاعتك.`,
          icon: '/pwa-192x192.png'
        });
      } catch (e) {
        console.warn('Wudu notification error:', e);
      }
    }

    // Set 5-minute timer (300,000 ms)
    setTimeout(() => {
      setActiveWuduReminder(null);
      triggerPrayerNotification(`تذكير بعد الوضوء: ${prayerName}`, prayerTime);
    }, 5 * 60 * 1000);
  };

  // Helper to trigger prayer notification reliably across UI, Audio, and OS
  const triggerPrayerNotification = (prayerName: string, prayerTime: string, prayerId?: string) => {
    sounds.playPrayerAlert();
    setOverlayPrayerAlert({
      isOpen: true,
      name: prayerName,
      time: formatTimeArabic(prayerTime)
    });

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`حان الآن موعد أذان ${prayerName}`, {
          body: `حي على الصلاة • قوم قابل ربك لقاء المحب ❤️ (${formatTimeArabic(prayerTime)})\nصلاة على وقتها، نور في قلبك وبركة في يومك.`,
          icon: '/pwa-192x192.png',
          tag: prayerId ? `raqeeb-prayer-${prayerId}` : 'raqeeb-prayer-alert'
        });
      } catch (e) {
        console.warn('Notification dispatch error:', e);
      }
    }
  };

  // Real Automatic Prayer Alerts with Smart 45-Minute Window & OS Notifications
  useEffect(() => {
    let unmounted = false;
    
    const evaluatePrayers = () => {
      if (unmounted || overlayPrayerAlert.isOpen) return;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTotalMin = now.getHours() * 60 + now.getMinutes();

      // Read alerted map for today
      const alertKey = `raqeeb_alerted_prayers_${todayStr}`;
      const alertedMap = loadStored<Record<string, boolean>>(alertKey, {});

      for (const p of prayers) {
        const [pHours, pMins] = p.time.split(':').map(Number);
        const pTotalMin = pHours * 60 + pMins;
        const diffMin = currentTotalMin - pTotalMin;

        // Maghrib Adhkar Reminder (30 mins before Maghrib)
        if (p.id === 'maghrib') {
          const maghribAdhkarKey = `maghrib_adhkar_${todayStr}`;
          if (diffMin >= -30 && diffMin < -25 && !alertedMap[maghribAdhkarKey]) {
            alertedMap[maghribAdhkarKey] = true;
            saveStored(alertKey, alertedMap);
            triggerAppNotification('أذكار المساء 🌙', 'أذكار المساء أوعي تنساها، حافظ على وردك');
          }
        }

        if (p.id === 'sunrise' || p.confirmed) continue;

        // Pre-Adhan Alert (exactly 15 to 10 minutes before)
        const preAdhanKey = `pre_${p.id}`;
        if (diffMin >= -15 && diffMin <= -10 && !alertedMap[preAdhanKey]) {
          alertedMap[preAdhanKey] = true;
          saveStored(alertKey, alertedMap);
          // Only browser notification for Pre-Adhan, no big modal
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`أخي الحبيب، اقترب أذان ${p.nameAr}`, {
              body: 'تهيأ بالوضوء وكن من السابقين للصلاة.',
              icon: '/pwa-192x192.png'
            });
          }
          sounds.playSuccessTone(); // Optional tone
        }

        // Main Prayer Alert (Entered within last 45 minutes)
        if (diffMin >= 0 && diffMin <= 45 && !alertedMap[p.id]) {
          alertedMap[p.id] = true;
          saveStored(alertKey, alertedMap);
          triggerPrayerNotification(p.nameAr, p.time, p.id);
          break; // alert one at a time
        }
      }

      // 10 PM Sleep Adhkar Reminder (22:00 -> 22:05)
      const sleepAdhkarKey = `sleep_adhkar_${todayStr}`;
      if (currentTotalMin >= 22 * 60 && currentTotalMin <= 22 * 60 + 5 && !alertedMap[sleepAdhkarKey]) {
        alertedMap[sleepAdhkarKey] = true;
        saveStored(alertKey, alertedMap);
        triggerAppNotification('أذكار النوم 🛌', 'أذكار النوم ونام بدري عشان تقدر تقوم للفجر 😀');
      }
    };

    // Run immediately on mount or when prayers change
    evaluatePrayers();

    const checkPrayers = setInterval(evaluatePrayers, 15000);

    return () => {
      unmounted = true;
      clearInterval(checkPrayers);
    };
  }, [prayers, overlayPrayerAlert.isOpen]);

  // Real Periodic Reminders (10 minutes)
  useEffect(() => {
    let sessionMinutes = 0;
    
    const reminderTimer = setInterval(() => {
      sessionMinutes++;
      
      if (sessionMinutes % 10 === 0 && protectionLevel >= 2) {
        setDailyStats(s => ({ ...s, remindersShown: (s.remindersShown || 0) + 1 }));
        sounds.playSuccessTone();
        setOverlayReminder(prev => {
          if (!prev.isOpen) {
            return {
              isOpen: true,
              appName: 'المراقبة المستمرة',
              minutes: sessionMinutes
            };
          }
          return prev;
        });
      }
    }, 60000); // 1 minute interval

    return () => clearInterval(reminderTimer);
  }, [protectionLevel]);

  // Save changes to localStorage
  useEffect(() => {
    saveStored(STORAGE_KEYS.PROTECTION_LEVEL, protectionLevel);
  }, [protectionLevel]);

  useEffect(() => {
    saveStored(STORAGE_KEYS.APPS, monitoredApps);
  }, [monitoredApps]);


  useEffect(() => {
    saveStored(STORAGE_KEYS.STATS, dailyStats);
  }, [dailyStats]);

  useEffect(() => {
    saveStored(STORAGE_KEYS.BLOCKED_LOGS, blockedAttempts);
  }, [blockedAttempts]);

  useEffect(() => {
    saveStored(STORAGE_KEYS.INTENTIONS, recentIntentions);
  }, [recentIntentions]);

  useEffect(() => {
    saveStored(STORAGE_KEYS.CUSTOM_BLOCKED, customBlockedDomains);
  }, [customBlockedDomains]);

  useEffect(() => {
    saveStored(STORAGE_KEYS.FOCUS_SESSIONS, activeFocusSession);
  }, [activeFocusSession]);

  // Recalculate prayers when city changes
  const handleSelectCity = (city: CityPreset) => {
    setSelectedCity(city);
    saveStored(STORAGE_KEYS.CITY_ID, city.id);
    if (city.id === 'auto') {
      saveStored(STORAGE_KEYS.CUSTOM_CITY, city);
    }
    const newTimes = calculatePrayerTimes(city);
    setPrayers(prev => newTimes.map(p => {
      const match = prev.find(item => item.id === p.id);
      return { ...p, confirmed: match ? match.confirmed : false };
    }));
  };

  // Toggle prayer confirmation
  const handleTogglePrayer = (prayerId: string) => {
    sounds.playSuccessTone();
    const targetPrayer = prayers.find(p => p.id === prayerId);
    const isMarkingAsConfirmed = targetPrayer && !targetPrayer.confirmed;

    const updated = prayers.map(p => {
      if (p.id === prayerId) {
        return { ...p, confirmed: !p.confirmed, confirmedAt: !p.confirmed ? 'الآن' : undefined };
      }
      return p;
    });

    setPrayers(updated);

    // Save confirmed map
    const confirmedMap: Record<string, boolean> = {};
    updated.forEach(p => { confirmedMap[p.id] = p.confirmed; });
    saveStored(STORAGE_KEYS.CONFIRMED_PRAYERS, confirmedMap);

    const confirmedCount = updated.filter(p => p.id !== 'sunrise' && p.confirmed).length;
    setDailyStats(s => ({ ...s, confirmedPrayers: confirmedCount }));

    if (isMarkingAsConfirmed) {
      // 1. Show Adhkar reminder for all prayers including Fajr
      setTimeout(() => triggerAppNotification('أذكار ما بعد الصلاة', 'أذكار دبر الصلاة تقبل الله منك 🤲'), 2000);
      
      // 2. For Fajr only, follow up with the Wird reminder after the first notification completes (10s duration + some buffer)
      if (prayerId === 'fajr') {
        setTimeout(() => triggerAppNotification('ورد يومك', 'تقبل الله صلاتك.. ورد يومك متنساش 📖'), 13000);
      }
    }
  };

  // Sound mute toggle
  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Handlers for Intention Overlay
  const handleSelectIntent = (intentText: string, category: 'useful' | 'study' | 'quick_search' | 'browsing' | 'custom') => {
    sounds.playSuccessTone();
    const newIntent: IntentionLog = {
      id: `intent_${Date.now()}`,
      timestamp: 'الآن',
      appName: overlayIntention.appName,
      intent: intentText,
      category
    };
    setRecentIntentions(prev => [newIntent, ...prev.slice(0, 19)]);
    setOverlayIntention({ isOpen: false, appName: '' });
  };

  // Log Istighfar
  const handleLogIstighfar = (count: number = 1) => {
    const inc = typeof count === 'number' && !isNaN(count) ? count : 1;
    setDailyStats(prev => {
      const updated = {
        ...prev,
        istighfarCount: (prev.istighfarCount || 0) + inc
      };
      saveStored(STORAGE_KEYS.STATS, updated);
      return updated;
    });
  };

  // Log Blocked Attempt (Privacy Preserving)
  const handleLogBlockedAttempt = (_url: string, reason: string, app: string) => {
    const cleanReason = reason ? reason.replace(/\s*\([^)]*\)/g, '') : 'تم حجب المحاولة تلقائياً لحفظ البصر والقلب';
    const newAttempt: BlockedAttempt = {
      id: `block_${Date.now()}`,
      timestamp: 'الآن',
      urlOrQuery: 'محاولة حجب محتوى غير لائق',
      reason: cleanReason,
      app
    };
    setBlockedAttempts(prev => [newAttempt, ...prev.slice(0, 19)]);
    setDailyStats(prev => ({
      ...prev,
      blockedAttemptsCount: prev.blockedAttemptsCount + 1
    }));
  };

  // Focus Session management
  const handleStartFocus = (goal: string, durationMinutes: number, tasks?: FocusTask[]) => {
    sounds.playSuccessTone();
    const session: FocusSession = {
      id: `focus_${Date.now()}`,
      goal,
      durationMinutes,
      remainingSeconds: durationMinutes * 60,
      isActive: true,
      isCompleted: false,
      startedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      tasks: tasks || []
    };
    setActiveFocusSession(session);
  };

  const handleCompleteFocus = (reflections?: string) => {
    if (activeFocusSession) {
      setDailyStats(prev => ({
        ...prev,
        focusSessionsCount: prev.focusSessionsCount + 1,
        focusMinutesTotal: prev.focusMinutesTotal + activeFocusSession.durationMinutes
      }));
    }
    setActiveFocusSession(null);
  };

  const handleCancelFocus = () => {
    setActiveFocusSession(null);
  };

  // Toggle monitored app
  const handleToggleApp = (appId: string) => {
    setMonitoredApps(prev => prev.map(a => a.id === appId ? { ...a, enabled: !a.enabled } : a));
  };

  // Add new monitored app
  const handleAddApp = (name: string, category: 'browser' | 'social' | 'entertainment') => {
    const newApp: MonitoredApp = {
      id: `app_${Date.now()}`,
      name,
      nameEn: name,
      category,
      icon: 'Globe',
      iconBg: 'bg-emerald-600',
      enabled: true,
      timeSpentMinutes: 0
    };
    setMonitoredApps(prev => [...prev, newApp]);
  };


  // Reset stats today
  const handleResetStats = () => {
    sounds.playSuccessTone();
    setDailyStats({
      date: new Date().toISOString().split('T')[0],
      confirmedPrayers: 0,
      socialTimeMinutes: 0,
      browserTimeMinutes: 0,
      blockedAttemptsCount: 0,
      remindersShown: 0,
      istighfarCount: 0,
      focusSessionsCount: 0,
      focusMinutesTotal: 0
    });
    setPrayers(prev => prev.map(p => ({ ...p, confirmed: false })));
    saveStored(STORAGE_KEYS.CONFIRMED_PRAYERS, {});
    setBlockedAttempts([]);
    setRecentIntentions([]);
    setSyncState(INITIAL_SYNC_STATE);
  };

  const nextPrayer = getNextPrayer(prayers);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex selection:bg-teal-500 selection:text-white" dir="rtl">
      {/* Sidebar for Desktop */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onInstallApp={handleInstallApp}
        isDevMode={isDevMode}
        onToggleDevMode={handleToggleDevMode}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        {/* Night Shield Overlay */}
        {isNightShieldActive && (
          <NightShieldView onDismiss={() => {
            setIsNightShieldActive(false);
            setNightShieldDismissed(true);
          }} />
        )}

        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          protectionLevel={protectionLevel}
        prayers={prayers}
        syncState={syncState}
        stats={dailyStats}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenNextPrayerInfo={() => setIsNextPrayerInfoOpen(true)}
        onInstallApp={handleInstallApp}
        canInstall={!!deferredPrompt}
        onOpenPanic={() => setIsPanicOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-32 lg:pb-10">
        <Suspense fallback={
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-teal-700">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold">جارٍ تحميل القسم...</span>
          </div>
        }>
        {activeTab === 'analytics' && (
          <AnalyticsView
            stats={dailyStats}
            prayers={prayers}
            blockedAttempts={blockedAttempts}
            victories={victories}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={dailyStats}
            prayers={prayers}
            blockedAttempts={blockedAttempts}
            recentIntentions={recentIntentions}
            syncState={syncState}
            selectedDeviceFilter={selectedDeviceFilter}
            onSelectDeviceFilter={setSelectedDeviceFilter}
            onGoToSyncHub={() => setActiveTab('sync')}
            onTogglePrayer={handleTogglePrayer}
            onOpenIntentionTest={() => setOverlayIntention({ isOpen: true, appName: 'جوجل كروم' })}
            onOpenReminderTest={() => {
              setDailyStats(s => ({ ...s, remindersShown: s.remindersShown + 1 }));
              setOverlayReminder({ isOpen: true, appName: 'جوجل كروم', minutes: 10 });
            }}
            onOpenBlockTest={() => setOverlayAdultBlock({ isOpen: true, url: 'blocked-site.com', reason: 'نطاق إباحي محظور' })}
            onOpenPrayerTest={() => setOverlayPrayerAlert({ isOpen: true, name: nextPrayer.next.nameAr, time: formatTimeArabic(nextPrayer.next.time) })}
            onResetStats={handleResetStats}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onRecordDailyWird={() => {
              sounds.playSuccessTone();
              advanceKhatmah(20);
              setDailyStats(prev => ({
                ...prev,
                quranPagesRead: (prev.quranPagesRead || 0) + 20,
                streakDays: Math.max(prev.streakDays || 1, 1)
              }));
            }}
            victories={victories}
            onOpenPanic={() => setIsPanicOpen(true)}
            onOpenTawbahPlan={() => setIsTawbahOpen(true)}
            onExportReport={handleExportReport}
            onAddVictory={(title, category, notes) => handleClaimVictory(title, category, notes)}
          />
        )}

        {activeTab === 'sync' && (
          <DeviceSyncHubView
            syncState={syncState}
            onUpdateSyncState={handleUpdateSyncState}
            onTriggerInstantSync={triggerInstantSync}
            onGoToDashboard={() => setActiveTab('dashboard')}
            onInstallApp={handleInstallApp}
            onConfirmPrayerSync={(prayerName) => {
              const matching = prayers.find(p => p.id === prayerName || p.nameAr.includes(prayerName));
              if (matching && !matching.confirmed) {
                handleTogglePrayer(matching.id);
              }
            }}
            currentDeviceType={currentDeviceType}
            onChangeDeviceType={setCurrentDeviceType}
            onSendCommand={sendCommand}
            onJoinSession={joinSession}
            onRegeneratePairingCode={regeneratePairingCode}
            localDeviceId={localDeviceId}
            localDeviceName={localDeviceName}
            isCloudConnected={isCloudConnected}
            isPhoneRinging={isPhoneRinging}
            onDismissRing={dismissRing}
          />
        )}

        {activeTab === 'focus' && (
          <FocusModeView
            activeSession={activeFocusSession}
            onStartSession={handleStartFocus}
            onCompleteSession={handleCompleteFocus}
            onCancelSession={handleCancelFocus}
          />
        )}

        {activeTab === 'quran' && (
          <QuranReaderView 
            stats={dailyStats}
            onUpdateStats={setDailyStats}
            onDailyWirdCompleted={() => triggerAppNotification('أذكار الصباح ☀️', 'بعد إتمام الورد اليومي.. أذكار الصباح متنساش')}
          />
        )}

        {activeTab === 'companion' && (
          <AiCompanionView 
            stats={dailyStats}
            prayers={prayers}
            blockedAttempts={blockedAttempts}
          />
        )}

        {activeTab === 'adhkar' && (
          <AdhkarView 
            istighfarTotal={dailyStats.istighfarCount || 0}
            onIncrementIstighfar={handleLogIstighfar}
            initialCategory={adhkarInitialCategory}
            pairingCode={syncState.pairingCode}
            athkarSettings={athkarSettings}
            onUpdateAthkarSettings={handleUpdateAthkarSettings}
          />
        )}

        {activeTab === 'prayers' && (
          <PrayerTimesView
            prayers={prayers}
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
            onTogglePrayer={handleTogglePrayer}
            onTriggerPrayerModal={(prayerName, prayerTime) => setOverlayPrayerAlert({ isOpen: true, name: prayerName, time: prayerTime })}
            onSavePrayerLog={savePrayerLog}
          />
        )}

        {activeTab === 'protection' && (
          <ProtectionSettingsView
            currentLevel={protectionLevel}
            onSetLevel={setProtectionLevel}
            customBlockedDomains={customBlockedDomains}
            onAddCustomDomain={(domain) => setCustomBlockedDomains(prev => [...new Set([...prev, domain])])}
            onRemoveCustomDomain={(domain) => setCustomBlockedDomains(prev => prev.filter(d => d !== domain))}
            isDevMode={isDevMode}
            onToggleDevMode={handleToggleDevMode}
            showFloatingBar={showFloatingBar}
            onToggleFloatingBar={handleToggleFloatingBar}
            onOpenFloatingGuide={() => setIsFloatingGuideOpen(true)}
          />
        )}

        {activeTab === 'apps' && (
          <MonitoredAppsView
            apps={monitoredApps}
            onToggleApp={handleToggleApp}
            onAddApp={handleAddApp}
          />
        )}

        {activeTab === 'extension' && (
          <ExtensionExportView />
        )}

        {activeTab === 'checklist' && (
          <ChecklistView 
            items={checklistItems}
            onUpdateStatus={handleUpdateChecklistStatus}
          />
        )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            مشروع «رَقِيب» — الرفيق الرقمي الواعي لحفظ الوقت وغض البصر وإقامة الصلاة.
          </p>
          <p className="font-['Amiri',serif] text-sm text-slate-600 font-semibold">
            «مَا يَلْفِظُ مِن قَوْلٍ إِلَّا لَدَيْهِ رَقِيبٌ عَتِيدٌ»
          </p>
        </div>
      </footer>

      {/* OVERLAY 1: Intention Pop-up upon Opening Browser/Social Apps */}
      <IntentionOverlay
        isOpen={overlayIntention.isOpen}
        appName={overlayIntention.appName}
        onSelectIntent={handleSelectIntent}
        onClose={() => setOverlayIntention({ isOpen: false, appName: '' })}
      />

      {/* OVERLAY 2: 10-Minute Periodic Reminder */}
      <PeriodicReminderModal
        isOpen={overlayReminder.isOpen}
        appName={overlayReminder.appName}
        minutesSpent={overlayReminder.minutes}
        onDismiss={() => setOverlayReminder({ isOpen: false, appName: '', minutes: 10 })}
        onLogIstighfar={handleLogIstighfar}
      />

      {/* OVERLAY 3: Adult Content Red Warning & Shield */}
      <AdultBlockScreen
        isOpen={overlayAdultBlock.isOpen}
        blockedUrlOrQuery={overlayAdultBlock.url}
        reason={overlayAdultBlock.reason}
        onGoBack={() => setOverlayAdultBlock({ isOpen: false, url: '', reason: '' })}
      />

      {/* OVERLAY 4: Prayer Call "لقاء المحب" Confirmation Modal */}
      <PrayerAlertModal
        isOpen={overlayPrayerAlert.isOpen}
        prayerName={overlayPrayerAlert.name}
        prayerTime={overlayPrayerAlert.time}
        onConfirmPrayer={() => {
          // Find matching prayer and confirm it
          const matching = prayers.find(p => p.nameAr.includes(overlayPrayerAlert.name) || overlayPrayerAlert.name.includes(p.nameAr));
          if (matching) {
            handleTogglePrayer(matching.id);
          }
          setOverlayPrayerAlert({ isOpen: false, name: '', time: '' });
        }}
        onSnooze={() => handleSnoozeWudu(overlayPrayerAlert.name, overlayPrayerAlert.time)}
      />

      {/* Floating Active Wudu Reminder Banner */}
      {activeWuduReminder && (
        <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 p-4 bg-teal-900 text-white rounded-2xl shadow-2xl border border-teal-400/40 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300" dir="rtl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-teal-800 text-teal-300 flex items-center justify-center shrink-0 border border-teal-700">
              🚿
            </div>
            <div>
              <span className="text-xs font-bold text-teal-200 block">
                تذكير الوضوء لصلاة {activeWuduReminder.prayerName} 🕌
              </span>
              <p className="text-[11px] text-teal-100">
                سيصلك التنبيه التالي عند الساعة <strong className="font-mono text-amber-300">{activeWuduReminder.targetTimeStr}</strong> (بعد 5 دقائق).
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const matching = prayers.find(p => p.nameAr.includes(activeWuduReminder.prayerName) || activeWuduReminder.prayerName.includes(p.nameAr));
              if (matching) {
                handleTogglePrayer(matching.id);
              }
              setActiveWuduReminder(null);
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer transition-all active:scale-95"
          >
            أتممت الصلاة ✅
          </button>
        </div>
      )}

      {/* OVERLAY 5: Standalone Mobile & Desktop Universal Installation */}
      <InstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
        deferredPrompt={deferredPrompt}
        onPromptTriggered={() => setDeferredPrompt(null)}
        pairingCode={syncState.pairingCode}
        token={syncState.token}
      />

      {/* OVERLAY 6: Next Prayer Info & Weekly Schedule Modal */}
      <NextPrayerInfoModal
        isOpen={isNextPrayerInfoOpen}
        onClose={() => setIsNextPrayerInfoOpen(false)}
        prayers={prayers}
        selectedCity={selectedCity}
      />

      {/* OVERLAY 6: Panic Rescue Immediate Intervention */}
      <Suspense fallback={null}>
        {isPanicOpen && (
          <PanicRescueModal
            isOpen={isPanicOpen}
            onClose={() => setIsPanicOpen(false)}
            onRecordVictory={handleClaimVictory}
            onVictoryClaimed={handleClaimVictory}
          />
        )}
      </Suspense>

      {/* OVERLAY 7: Structured Repentance (Tawbah) 5-Step Plan */}
      <Suspense fallback={null}>
        {isTawbahOpen && (
          <TawbahPlanModal
            isOpen={isTawbahOpen}
            onClose={() => setIsTawbahOpen(false)}
            onPlanCompleted={() => handleClaimVictory('إتمام خطة التوبة النصوح وتجديد العهد مع الله')}
          />
        )}
      </Suspense>

      {/* Persistent Floating Screen Companion (Computer, Tablet, Mobile) */}
      {showFloatingBar && (
        <MiniFloatingBar
          onOpenPanic={() => setIsPanicOpen(true)}
          prayers={prayers}
          istighfarCount={dailyStats.istighfarCount || 0}
          onIncrementIstighfar={() => handleLogIstighfar(1)}
          onGoToPrayers={() => setActiveTab('prayers')}
          onClose={() => handleToggleFloatingBar(false)}
          onOpenFloatingGuide={() => setIsFloatingGuideOpen(true)}
        />
      )}

      {/* Modern Mobile Bottom Navigation & Action Drawer (Mobile only) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMenuOpen={isMobileMenuOpen}
        setIsMenuOpen={setIsMobileMenuOpen}
        onOpenPanic={() => setIsPanicOpen(true)}
        onOpenTawbah={() => setIsTawbahOpen(true)}
        onInstallApp={handleInstallApp}
        onToggleMute={handleToggleMute}
        isMuted={isMuted}
        syncState={syncState}
        protectionLevel={protectionLevel}
        nextPrayerName={nextPrayer.next.nameAr}
        istighfarCount={dailyStats.istighfarCount || 0}
        onIncrementIstighfar={() => handleLogIstighfar(1)}
        isDevMode={isDevMode}
        onToggleDevMode={handleToggleDevMode}
        showFloatingBar={showFloatingBar}
        onToggleFloatingBar={handleToggleFloatingBar}
      />

      {/* OS & Web Floating Screen Companion Guide Modal */}
      <FloatingWidgetGuideModal
        isOpen={isFloatingGuideOpen}
        onClose={() => setIsFloatingGuideOpen(false)}
        onToggleWebFloatingBar={handleToggleFloatingBar}
        isWebFloatingBarEnabled={showFloatingBar}
      />

      {/* Global Phone Ringing Banner (Active on any tab) */}
      {isPhoneRinging && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 p-4 bg-rose-600 text-white rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-bounce border-2 border-white/20" dir="rtl">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 animate-spin shrink-0 text-rose-200" />
            <div>
              <h4 className="font-bold text-sm">🔔 رنين الهاتف مفعل الآن!</h4>
              <p className="text-xs text-rose-100">تم تفعيل الرنين للبحث عن الهاتف عبر الأجهزة المشتركة</p>
            </div>
          </div>
          <button
            onClick={dismissRing}
            className="px-3.5 py-2 bg-white text-rose-700 font-bold text-xs rounded-xl shadow-xs hover:bg-rose-50 cursor-pointer shrink-0 transition-all active:scale-95"
          >
            إيقاف الرنين
          </button>
        </div>
      )}

      {/* Global Incoming Shared Clipboard Toast */}
      {incomingClipboard && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300 border border-teal-500/30" dir="rtl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 text-teal-400 flex items-center justify-center shrink-0">
              <Copy className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[11px] text-teal-400 block font-bold">
                وصلك نص من {incomingClipboard.sender === 'android' ? 'الهاتف 📱' : 'الحاسوب 💻'}:
              </span>
              <p className="text-xs text-slate-200 font-mono truncate">
                {incomingClipboard.text}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(incomingClipboard.text);
                sounds.playSuccessTone();
                dismissClipboard();
              }}
              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              نسخ
            </button>
            <button
              onClick={dismissClipboard}
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global App Notifications Toast */}
      {appNotification && (
        <div className="fixed bottom-24 sm:bottom-28 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 bg-teal-900 text-white rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300 border border-teal-400/30" dir="rtl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-teal-800/80 text-teal-300 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="text-xs text-amber-300 block font-bold mb-0.5">
                {appNotification.title}
              </span>
              <p className="text-[13px] text-teal-50 leading-tight">
                {appNotification.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAppNotification(null)}
            className="p-1.5 text-teal-400 hover:text-white cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Audio Control Floating Bar */}
      <GlobalAudioBar />
      
      </div> {/* End of Main Column */}
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }
  
  if (!user) {
    return <AuthScreen />;
  }
  
  return <MainApp />;
}
