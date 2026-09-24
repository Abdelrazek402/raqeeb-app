import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  MapPin, 
  CheckCircle2, 
  Circle, 
  Heart, 
  Play, 
  Sparkles, 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset,
  Navigation,
  Volume2,
  Clock,
  Building2,
  AlertTriangle,
  Award,
  History,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds, MUEZZIN_LIST } from '../utils/audio';
import { loadStored, saveStored } from '../utils/storage';
import { PrayerInfo, PrayerLogItem } from '../types';
import { CITIES_LIST, CityPreset, formatTimeArabic, getNextPrayer } from '../utils/prayerTimes';
import { QiblaCompass } from './QiblaCompass';
import { checkCanConfirmPrayer, getStoredPrayerLogs, calculatePrayerLogStats } from '../services/prayerLogService';
import { PrayerConfirmationModal } from './PrayerConfirmationModal';

interface SunnahRawatibItem {
  id: string;
  nameAr: string;
  rakats: string;
  type: string;
  quote: string;
  points: number;
}

const SUNAN_RAWATIB_LIST: SunnahRawatibItem[] = [
  { id: 'fajr_pre', nameAr: 'الفجر (ركعتان)', rakats: 'ركعتان قبلية', type: 'سنة مؤكدة قبليّة', quote: '«ركعتا الفجر خيرٌ من الدنيا وما فيها»', points: 15 },
  { id: 'dhuhr_pre', nameAr: 'الظهر القبليّة (٤ ركعات)', rakats: '٤ ركعات قبلية', type: 'سنة مؤكدة قبلية', quote: 'تُفتح لها أبواب السماء', points: 20 },
  { id: 'dhuhr_post', nameAr: 'الظهر البعديّة (ركعتان)', rakats: 'ركعتان بعدية', type: 'سنة مؤكدة بعدية', quote: '«حرم الله جثته على النار»', points: 15 },
  { id: 'asr_pre', nameAr: 'العصر (٤ ركعات)', rakats: '٤ ركعات قبلية', type: 'سنة مستحبة', quote: '«رَحِمَ اللَّهُ امْرَأً صَلَّى قَبْلَ الْعَصْرِ أَرْبَعًا»', points: 15 },
  { id: 'maghrib_post', nameAr: 'المغرب (ركعتان)', rakats: 'ركعتان بعدية', type: 'سنة مؤكدة بعدية', quote: 'يُستحب قراءة الكافرون والإخلاص', points: 15 },
  { id: 'isha_post', nameAr: 'العشاء والوتر', rakats: 'ركعتان بعدية + الوتر', type: 'سنة مؤكدة ووتر', quote: '«إنَّ اللَّهَ وِترٌ يُحبُّ الوِترَ»', points: 20 },
];

interface PrayerTimesViewProps {
  prayers: PrayerInfo[];
  selectedCity: CityPreset;
  onSelectCity: (city: CityPreset) => void;
  onTogglePrayer: (prayerId: string) => void;
  onTriggerPrayerModal: (prayerName: string, prayerTime: string) => void;
  onSavePrayerLog?: (logItem: PrayerLogItem) => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  prayers,
  selectedCity,
  onSelectCity,
  onTogglePrayer,
  onTriggerPrayerModal,
  onSavePrayerLog
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [earlyNoticeMsg, setEarlyNoticeMsg] = useState<string | null>(null);
  const [confirmingPrayer, setConfirmingPrayer] = useState<PrayerInfo | null>(null);
  const [activeTabSection, setActiveTabSection] = useState<'schedule' | 'logs'>('schedule');
  const [selectedMuezzin, setSelectedMuezzin] = useState<string>(() => {
    return localStorage.getItem('raqeeb_adhan_sound') || 'azhar';
  });
  const [isAdhanPlaying, setIsAdhanPlaying] = useState<boolean>(false);

  useEffect(() => {
    const handleEnd = () => setIsAdhanPlaying(false);
    sounds.addOnEndListener(handleEnd);
    return () => {
      sounds.removeOnEndListener(handleEnd);
    };
  }, []);

  // Sunan Rawatib interactive state & points
  const todayKey = new Date().toISOString().split('T')[0];
  const [completedSunan, setCompletedSunan] = useState<Record<string, boolean>>(() => {
    return loadStored<Record<string, boolean>>(`raqeeb_sunan_completed_${todayKey}`, {});
  });

  const handleToggleSunnah = (sunnahId: string) => {
    const isNowCompleted = !completedSunan[sunnahId];
    const updated = { ...completedSunan, [sunnahId]: isNowCompleted };
    setCompletedSunan(updated);
    saveStored(`raqeeb_sunan_completed_${todayKey}`, updated);

    if (isNowCompleted) {
      sounds.playSuccessTone();
      const totalDone = Object.values(updated).filter(Boolean).length;
      if (totalDone === SUNAN_RAWATIB_LIST.length) {
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#0d9488', '#f59e0b', '#10b981', '#6366f1']
          });
        } catch {}
      }
    }
  };

  const totalSunanPointsEarned = SUNAN_RAWATIB_LIST.reduce((acc, s) => {
    return acc + (completedSunan[s.id] ? s.points : 0);
  }, 0);
  const maxSunanPoints = 100;

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Prayer logs stored locally
  const [prayerLogs, setPrayerLogs] = useState<PrayerLogItem[]>(() => getStoredPrayerLogs());
  const logStats = calculatePrayerLogStats(prayerLogs);

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          new Notification('تم تفعيل إشعارات الأذان بنجاح! 🕌', {
            body: 'ستصلك تنبيهات الصلوات في موعدها حتى لو كان المتصفح مصغراً.',
            icon: '/pwa-192x192.png'
          });
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handlePrayerCardClick = (prayer: PrayerInfo) => {
    // If already confirmed, toggle off normally
    if (prayer.confirmed) {
      onTogglePrayer(prayer.id);
      return;
    }

    // Check if prayer time has arrived
    const check = checkCanConfirmPrayer(prayer);
    if (!check.allowed) {
      setEarlyNoticeMsg(check.reason || 'لم يحن وقت هذه الصلاة بعد!');
      return;
    }

    // Valid time -> open confirmation modal with options
    setConfirmingPrayer(prayer);
  };

  const handleConfirmPrayerDetails = (details: {
    prayerId: string;
    isCongregationOrMosque: boolean;
    justification?: 'travel_combined' | 'excuse_valid' | 'none_world_distraction';
    feedbackMessage: string;
    delayMinutes: number;
    isDelayedAfterNext: boolean;
  }) => {
    const targetPrayer = prayers.find(p => p.id === details.prayerId);
    if (!targetPrayer) return;

    // Toggle prayer confirmed state in App
    onTogglePrayer(details.prayerId);

    // Build log item
    const now = new Date();
    const logItem: PrayerLogItem = {
      id: `log_${Date.now()}`,
      prayerId: details.prayerId as any,
      prayerName: targetPrayer.nameAr,
      scheduledTime: targetPrayer.time,
      scheduledDateTimeISO: now.toISOString(),
      completedAtISO: now.toISOString(),
      dateStr: now.toISOString().split('T')[0],
      delayMinutes: details.delayMinutes,
      isDelayedAfterNextPrayer: details.isDelayedAfterNext,
      justification: details.justification,
      isCongregationOrMosque: details.isCongregationOrMosque,
      feedbackMessage: details.feedbackMessage
    };

    if (onSavePrayerLog) {
      onSavePrayerLog(logItem);
    }

    // Refresh local logs
    const updatedLogs = [logItem, ...prayerLogs.filter(l => !(l.dateStr === logItem.dateStr && l.prayerId === logItem.prayerId))].slice(0, 100);
    setPrayerLogs(updatedLogs);

    setConfirmingPrayer(null);
  };
  
  const executeLocationDetection = async () => {
    setIsDetecting(true);
    setLocationFeedback(null);

    const applyLocationData = (lat: number, lng: number, label: string) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const autoCity: CityPreset = {
        id: 'auto',
        nameAr: label,
        nameEn: 'Auto Location',
        lat,
        lng,
        timezone
      };
      onSelectCity(autoCity);
      setLocationFeedback(`تم تحديد موقعك بدقة فائقة (${label}) وتحديث مواقيت الصلاة فورياً.`);
      setIsDetecting(false);
      setShowLocationModal(false);
    };

    const tryIpLocationFallback = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          if (data.latitude && data.longitude) {
            applyLocationData(
              data.latitude, 
              data.longitude, 
              `📍 ${data.city || 'موقعي التلقائي'} (تلقائي)`
            );
            return true;
          }
        }
      } catch (err) {
        console.warn('IP location fetch failed', err);
      }
      return false;
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let label = '📍 موقعي الحالي (GPS دقيق)';
          
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const cityName = geoData.city || geoData.locality || geoData.principalSubdivision;
              if (cityName) {
                label = `📍 ${cityName} (GPS دقيق)`;
              }
            }
          } catch (e) {
            console.warn('Reverse geocode failed, using default GPS label', e);
          }

          applyLocationData(latitude, longitude, label);
        },
        async (error) => {
          console.warn('GPS location error:', error);
          const success = await tryIpLocationFallback();
          if (!success) {
            setLocationFeedback('تعذر تحديد الموقع تلقائياً. يمكنك مراجعة إعدادات الموقع أو اختيار مدينتك يدوياً.');
            setShowLocationModal(true);
            setIsDetecting(false);
          }
        },
        { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      const success = await tryIpLocationFallback();
      if (!success) {
        setLocationFeedback('خدمة تحديد الموقع غير مدعومة في المتصفح. يمكنك اختيار المدينة يدوياً.');
        setIsDetecting(false);
      }
    }
  };

  const nextPrayer = getNextPrayer(prayers, new Date(), selectedCity.timezone);

  const getPrayerIcon = (id: string) => {
    switch (id) {
      case 'fajr': return Sunrise;
      case 'sunrise': return Sun;
      case 'dhuhr': return Sun;
      case 'asr': return Sun;
      case 'maghrib': return Sunset;
      case 'isha': return Moon;
      default: return Bell;
    }
  };

  const confirmedCount = prayers.filter(p => p.id !== 'sunrise' && p.confirmed).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with City Selector & View Switcher */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-['Amiri',serif] text-slate-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500" />
              مواقيت الصلاة، التزام الوقت، وسجل الأداء
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              محرك حساب المواقيت الدقيق المربوط بتنبيه «لقاء المحب ❤️» ومتابعة فرق وقت الأداء وتحفيز عمارة المساجد.
            </p>
          </div>

          {/* Section Selector Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setActiveTabSection('schedule')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTabSection === 'schedule'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>جدول المواقيت</span>
            </button>

            <button
              onClick={() => setActiveTabSection('logs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTabSection === 'logs'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>سجل فرق الوقت والتحفيز</span>
              {prayerLogs.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.2 rounded-full font-bold">
                  {prayerLogs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Location & Sound controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={executeLocationDetection}
              disabled={isDetecting}
              className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-2 rounded-xl border border-teal-200 text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <Navigation className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
              {isDetecting ? 'جاري التحديد...' : 'تحديد تلقائي'}
            </button>
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
              <MapPin className="w-4 h-4 text-teal-600" />
              <label htmlFor="city-select" className="sr-only">اختر مدينتك</label>
              <select
                id="city-select"
                value={selectedCity.id}
                onChange={(e) => {
                  if (e.target.value === 'auto') return;
                  const found = CITIES_LIST.find(c => c.id === e.target.value);
                  if (found) onSelectCity(found);
                }}
                className="bg-transparent text-xs md:text-sm text-slate-800 font-semibold focus:outline-none cursor-pointer max-w-[130px]"
              >
                {selectedCity.id === 'auto' && (
                  <option value="auto" className="bg-white text-slate-800 font-bold text-teal-700">
                    {selectedCity.nameAr}
                  </option>
                )}
                {CITIES_LIST.map((city) => (
                  <option key={city.id} value={city.id} className="bg-white text-slate-800">
                    {city.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
              <Volume2 className="w-4 h-4 text-teal-600 shrink-0" />
              <label htmlFor="muezzin-select" className="sr-only">صوت الأذان ونغمة التنبيه</label>
              <select
                id="muezzin-select"
                value={selectedMuezzin}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMuezzin(val);
                  localStorage.setItem('raqeeb_adhan_sound', val);
                  if (isAdhanPlaying) {
                    sounds.stopAdhan();
                    setIsAdhanPlaying(false);
                  }
                }}
                className="bg-transparent text-xs md:text-sm text-slate-800 font-semibold focus:outline-none cursor-pointer max-w-[210px]"
              >
                {MUEZZIN_LIST.map((muezzin) => (
                  <option key={muezzin.id} value={muezzin.id} className="bg-white text-slate-800">
                    {muezzin.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {locationFeedback && (
          <div className="mt-4 p-3.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-2xl flex items-center justify-between gap-3">
            <span>{locationFeedback}</span>
            <button 
              onClick={() => setLocationFeedback(null)} 
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>

      {/* Notification Permissions Banner */}
      {notificationPermission !== 'granted' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">إشعارات الأذان وسطح المكتب بحاجة لتفعيل</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                فعّل إشعارات المتصفح لضمان سماع الأذان وظهور التنبيه في موعده حتى عندما يكون المتصفح مصغراً.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestNotification}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-xs shrink-0 cursor-pointer transition-all whitespace-nowrap"
          >
            تفعيل إشعارات الأذان 🔔
          </button>
        </div>
      ) : (
        <div className="bg-teal-50/80 border border-teal-200 rounded-2xl px-5 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs text-teal-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>إشعارات الأذان مفعلة، وسيقوم النظام بتنبيهك فور دخول الوقت.</span>
          </div>
          <button
            onClick={() => onTriggerPrayerModal('المغرب', prayers.find(p => p.id === 'maghrib')?.time || '18:15')}
            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
          >
            تجربة أذان المغرب الآن 🕌
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {activeTabSection === 'schedule' ? (
        <>
          {/* Next Prayer Highlight Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  الصلاة القادمة
                </span>
                <div className="text-3xl md:text-4xl font-black font-['Amiri',serif] text-slate-900 flex items-center gap-3">
                  <span>أذان {nextPrayer.next.nameAr}</span>
                  <span className="text-teal-700 font-mono text-2xl md:text-3xl">
                    ({formatTimeArabic(nextPrayer.next.time)})
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  المتبقي: <span className="font-bold text-teal-700 font-mono">{Math.floor(nextPrayer.minutesLeft / 60)} ساعة و {nextPrayer.minutesLeft % 60} دقيقة</span> • تأهب بوضوئك وتهيأ للقاء المحب.
                </p>
              </div>

              <button
                id="trigger-active-prayer-btn"
                onClick={() => onTriggerPrayerModal(nextPrayer.next.nameAr, formatTimeArabic(nextPrayer.next.time))}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
              >
                <Play className="w-4 h-4" />
                اختبار تنبيه لقاء المحب الآن
              </button>
            </div>
          </div>

          {/* Prayers Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {prayers.map((prayer) => {
              const Icon = getPrayerIcon(prayer.id);
              const isNext = nextPrayer.next.id === prayer.id;
              const isConfirmed = prayer.confirmed;
              const isObligatory = prayer.id !== 'sunrise';

              return (
                <div
                  key={prayer.id}
                  className={`rounded-2xl p-3.5 sm:p-5 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                    isNext
                      ? 'bg-teal-50/40 border-teal-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {isNext && (
                    <div className="absolute top-0 right-0 left-0 h-1 bg-teal-500" />
                  )}

                  <div>
                    <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{prayer.nameAr}</span>
                        {isObligatory && (
                          <button
                            onClick={() => onTriggerPrayerModal(prayer.nameAr, formatTimeArabic(prayer.time))}
                            title={`سماع وتجربة تنبيه ${prayer.nameAr}`}
                            className="text-slate-400 hover:text-teal-700 hover:bg-teal-50 p-1 rounded-md transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isNext ? 'text-teal-600' : 'text-slate-400'}`} />
                    </div>

                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mb-1.5 sm:mb-2">
                      {formatTimeArabic(prayer.time)}
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100">
                    {isObligatory ? (
                      <button
                        id={`toggle-prayer-view-${prayer.id}`}
                        onClick={() => handlePrayerCardClick(prayer)}
                        className={`w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isConfirmed
                            ? 'bg-teal-100 text-teal-800 border border-teal-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isConfirmed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>صليت ✅</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>تسجيل صليت</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block text-center py-1 font-medium">
                        وقت الشروق
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Qibla Compass */}
          <QiblaCompass selectedCity={selectedCity} />

          {/* Sunan Rawatib Interactive Tracker & Bonus Commitment Points */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 font-['Amiri',serif] flex items-center gap-2">
                    <span>جدول وتأكيد أداء السنن الرواتب</span>
                    <span className="text-xs font-normal text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                      حافز الالتزام 🌟
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600">
                    «مَنْ ثَابَرَ عَلَى اثْنَتَيْ عَشْرَةَ رَكْعَةً مِنْ السُّنَّةِ بُنِيَ لَهُ بَيْتٌ فِي الْجَنَّةِ» [الترمذي]
                  </p>
                </div>
              </div>

              {/* Bonus Points Badge */}
              <div className="bg-white border border-teal-200 rounded-2xl p-3 shadow-2xs flex items-center gap-3 self-start md:self-auto">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm shrink-0 border border-amber-200">
                  ✨
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">نقاط حافز السنن اليوم:</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-teal-800 font-mono">{totalSunanPointsEarned}</span>
                    <span className="text-xs text-slate-400 font-bold">/ {maxSunanPoints} نقطة</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-amber-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${(totalSunanPointsEarned / maxSunanPoints) * 100}%` }}
              />
            </div>

            {/* Sunan Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {SUNAN_RAWATIB_LIST.map((sunnah) => {
                const isDone = !!completedSunan[sunnah.id];
                return (
                  <div
                    key={sunnah.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                      isDone
                        ? 'bg-teal-50/70 border-teal-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-extrabold text-slate-900 text-sm">{sunnah.nameAr}</span>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/60">
                          +{sunnah.points} نقطة
                        </span>
                      </div>
                      <span className="text-teal-700 font-bold block text-xs mb-1">{sunnah.type}</span>
                      <p className="text-[11px] text-slate-500 leading-snug">{sunnah.quote}</p>
                    </div>

                    <button
                      onClick={() => handleToggleSunnah(sunnah.id)}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                        isDone
                          ? 'bg-teal-700 text-white shadow-xs hover:bg-teal-800'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                          <span>صليت السنة ✅ (+{sunnah.points} نقطة)</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>تسجيل أداء السنة (+{sunnah.points} نقطة)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* PRAYER LOGS & MOTIVATION TAB */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Key Metrics Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">في أول الوقت</span>
                <Sparkles className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black font-mono text-teal-700">
                {logStats.onTimePercentage}%
              </div>
              <p className="text-[11px] text-slate-500">أداء الصلاة قبل مضي 30 دقيقة</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">في المسجد / جماعة</span>
                <Building2 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black font-mono text-amber-600">
                {logStats.mosquePercentage}%
              </div>
              <p className="text-[11px] text-slate-500">الفوز بـ 27 ضعفاً من الأجر</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">متوسط فرق الوقت</span>
                <Clock className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-800">
                +{logStats.avgDelayMinutes} دقيقة
              </div>
              <p className="text-[11px] text-slate-500">الفارق بين الأذان والإتمام</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">تأخير بعد الصلاة التالية</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black font-mono text-rose-600">
                {logStats.delayedAfterNextCount}
              </div>
              <p className="text-[11px] text-slate-500">حالات الصلاة بعد وقتها</p>
            </div>
          </div>

          {/* Motivational Encouragement Banner */}
          <div className="bg-teal-900 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden space-y-3">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
              <Award className="w-4 h-4 text-amber-400" />
              <span>محفزات الصلاة والجماعة:</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold font-['Amiri',serif] leading-relaxed">
              «أحب الأعمال إلى الله: الصلاة على وقتها، ثم بر الوالدين، ثم الجهاد في سبيل الله»
            </h3>
            <p className="text-xs md:text-sm text-teal-100/90 leading-relaxed max-w-3xl">
              تذكر دائماً أن الخطوة التي تخطوها إلى المسجد ترفعك درجة عند الله وتحط عنك خطيئة، وأن إدراكك لتكبيرة الإحرام يمنحك براءة من النفاق وحفظاً في ذمة الله طوال اليوم.
            </p>
          </div>

          {/* Prayer Logs Table / History */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold font-['Amiri',serif] text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                سجل أداء الصلوات وفرق وقت الإتمام
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                {prayerLogs.length} سجلات محفوظة
              </span>
            </div>

            {prayerLogs.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-500">
                <Info className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold">لم تقم بتسجيل أداء صلوات في السجل بعد.</p>
                <p className="text-xs text-slate-400">عند الضغط على "تسجيل صليت" في جدول المواقيت، سيتم تسجيل فرق الوقت وتفاصيل الأداء هنا تلقائياً.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prayerLogs.map((log) => {
                  const dateFormatted = new Date(log.completedAtISO).toLocaleDateString('ar-EG', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={log.id} 
                      className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            صلاة {log.prayerName}
                          </span>
                          <span className="text-slate-500 text-[11px] font-mono">
                            ({dateFormatted})
                          </span>
                          {log.isCongregationOrMosque ? (
                            <span className="bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              في المسجد 🕌
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                              في البيت 🏠
                            </span>
                          )}
                        </div>

                        {/* Spiritual Feedback Message */}
                        <p className="text-slate-700 leading-relaxed text-xs">
                          {log.feedbackMessage}
                        </p>
                      </div>

                      {/* Status & Delay Badge */}
                      <div className="shrink-0 flex items-center gap-2">
                        {log.isDelayedAfterNextPrayer ? (
                          <span className="bg-rose-100 border border-rose-300 text-rose-800 px-3 py-1 rounded-xl text-xs font-bold">
                            تأخير بعد الصلاة التالية ⚠️
                          </span>
                        ) : log.delayMinutes <= 15 ? (
                          <span className="bg-teal-100 border border-teal-300 text-teal-800 px-3 py-1 rounded-xl text-xs font-bold">
                            في أول الوقت ✨
                          </span>
                        ) : (
                          <span className="bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1 rounded-xl text-xs font-bold">
                            تأخير +{log.delayMinutes} دقيقة
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Early Notice Modal (when clicking prayer before time) */}
      {earlyNoticeMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-right" dir="rtl">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-['Amiri',serif] text-slate-900">
                لم يحن موعد هذه الصلاة بعد! 🕌
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 text-amber-950 font-medium">
                {earlyNoticeMsg}
              </p>
            </div>

            <button
              onClick={() => setEarlyNoticeMsg(null)}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-xs"
            >
              فهمت ذلك، واستعد بالوضوء 👍
            </button>
          </div>
        </div>
      )}

      {/* Confirmation & Delay Modal */}
      {confirmingPrayer && (
        <PrayerConfirmationModal
          isOpen={!!confirmingPrayer}
          prayer={confirmingPrayer}
          prayers={prayers}
          onClose={() => setConfirmingPrayer(null)}
          onConfirm={handleConfirmPrayerDetails}
        />
      )}

      {/* Location Permission & Confirmation Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 text-right overflow-y-auto max-h-[90vh]" dir="rtl">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <Navigation className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[11px] bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full border border-teal-100 font-bold">
                📱 إعدادات موقع الموبايل
              </span>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-['Amiri',serif]">
                تفعيل تحديد الموقع من إعدادات الموبايل (GPS)
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                لحساب مواقيت الصلاة بدقة فائقة حسب مدينتك وحيك الحالي، يرجى التأكد من تفعيل خدمة الموقع (GPS) في هاتفك:
              </p>

              <div className="space-y-2 mt-3 text-xs text-slate-700">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span>🤖 أجهزة الأندرويد (Android):</span>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1 pr-1">
                    <li>اسحب شريط الإشعارات العلوي واضغط على أيقونة <strong>«الموقع / GPS»</strong> لتشغيلها.</li>
                    <li>أو اذهب إلى <strong>إعدادات الموبايل ⚙️ ➔ الموقع (Location) ➔ تفعيل</strong>.</li>
                  </ol>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span>🍎 أجهزة الآيفون (iOS):</span>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1 pr-1">
                    <li>اذهب إلى <strong>الإعدادات ⚙️ ➔ الخصوصية والأمن ➔ خدمات الموقع (Location Services)</strong>.</li>
                    <li>قم بتفعيل خيار <strong>خدمات الموقع</strong>.</li>
                  </ol>
                </div>

                <div className="p-2.5 bg-teal-50/80 border border-teal-100 rounded-xl text-[11px] text-teal-800">
                  💡 <strong>ملاحظة:</strong> بمجرد الضغط على الزر أدناه، سيطلب المتصفح إذن الوصول للموقع، قم باختيار <strong>«السماح أثناء استخدام التطبيق»</strong> لتتم المزامنة التلقائية فوراً.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={executeLocationDetection}
                className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-bold rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                <span>جلب الموقع الآن حساب المواقيت</span>
              </button>

              <button
                onClick={() => setShowLocationModal(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

