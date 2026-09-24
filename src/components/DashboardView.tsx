import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Smartphone, 
  Globe, 
  ShieldAlert, 
  Bell, 
  Target, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Moon, 
  Clock, 
  RotateCcw,
  Laptop,
  Activity,
  BookOpen,
  Download,
  Trophy,
  Flame,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { DailyStats, PrayerInfo, BlockedAttempt, IntentionLog, DeviceSyncHubState, DeviceViewFilter, ActiveTab, VictoryLog, VictoryCategory } from '../types';
import { formatTimeArabic } from '../utils/prayerTimes';
import { calculateMoonPhase, calculatePeriodMoonProgress } from '../services/streakService';
import { getPeriodAggregatedStats } from '../services/periodStatsService';
import { WhyCardsAccordion } from './WhyCardsAccordion';
import { NeuroplasticityCard } from './NeuroplasticityCard';
import { VictoryJournalView } from './VictoryJournalView';
import { MetricDetailReportModal, MetricReportType } from './MetricDetailReportModal';
import { RealisticMoonPhase } from './RealisticMoonPhase';
import { getTodaySpiritualQuote } from '../data/dailyQuotes';

interface DashboardViewProps {
  stats: DailyStats;
  prayers: PrayerInfo[];
  blockedAttempts: BlockedAttempt[];
  recentIntentions: IntentionLog[];
  syncState: DeviceSyncHubState;
  selectedDeviceFilter: DeviceViewFilter;
  onSelectDeviceFilter: (filter: DeviceViewFilter) => void;
  onGoToSyncHub: () => void;
  onTogglePrayer: (prayerId: string) => void;
  onOpenIntentionTest: () => void;
  onOpenReminderTest: () => void;
  onOpenBlockTest: () => void;
  onOpenPrayerTest: () => void;
  onResetStats: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onRecordDailyWird?: () => void;
  victories?: VictoryLog[];
  onOpenPanic?: () => void;
  onOpenTawbahPlan?: () => void;
  onExportReport?: (period?: 'today' | 'week' | 'month') => void;
  onAddVictory?: (title: string, category: VictoryCategory, notes?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  prayers,
  blockedAttempts,
  recentIntentions,
  syncState,
  selectedDeviceFilter,
  onSelectDeviceFilter,
  onGoToSyncHub,
  onTogglePrayer,
  onOpenIntentionTest,
  onOpenReminderTest,
  onOpenBlockTest,
  onOpenPrayerTest,
  onResetStats,
  onNavigateTab,
  onRecordDailyWird,
  victories = [],
  onOpenPanic,
  onOpenTawbahPlan,
  onExportReport,
  onAddVictory
}) => {
  // Period filter for the entire dashboard: 'today' | 'week' | 'month'
  const [dashboardPeriod, setDashboardPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [selectedReportModal, setSelectedReportModal] = useState<MetricReportType | null>(null);
  const [activityTab, setActivityTab] = useState<'blocked' | 'neuro' | 'victories' | 'intentions'>('blocked');

  // Real period aggregated data matching strict time boundaries:
  // - Today: 12:00 AM to 11:59 PM
  // - Week: Saturday to Friday (7 days)
  // - Month: 1st to 31st
  const periodData = useMemo(() => {
    return getPeriodAggregatedStats(dashboardPeriod, stats, syncState, prayers, blockedAttempts);
  }, [dashboardPeriod, stats, syncState, prayers, blockedAttempts]);

  const confirmedCount = prayers.filter(p => p.id !== 'sunrise' && p.confirmed).length;
  const streakInfo = calculatePeriodMoonProgress(dashboardPeriod, periodData.confirmedPrayers, stats.streakDays || 1);

  const win = syncState.devices.windows;
  const android = syncState.devices.android;

  // Device-filtered metrics derived from real period data
  const isWindows = selectedDeviceFilter === 'windows';
  const isAndroid = selectedDeviceFilter === 'android';

  const displaySocialMins = isWindows 
    ? Math.round(periodData.socialTimeMinutes * (win.stats.socialTimeMinutes / Math.max(1, stats.socialTimeMinutes || 1)))
    : isAndroid 
      ? Math.round(periodData.socialTimeMinutes * (android.stats.socialTimeMinutes / Math.max(1, stats.socialTimeMinutes || 1)))
      : periodData.socialTimeMinutes;

  const displayBrowserMins = isWindows 
    ? Math.round(periodData.browserTimeMinutes * (win.stats.browserTimeMinutes / Math.max(1, stats.browserTimeMinutes || 1)))
    : isAndroid 
      ? Math.round(periodData.browserTimeMinutes * (android.stats.browserTimeMinutes / Math.max(1, stats.browserTimeMinutes || 1)))
      : periodData.browserTimeMinutes;

  const displayBlockedCount = isWindows 
    ? win.stats.blockedAttemptsCount 
    : isAndroid 
      ? android.stats.blockedAttemptsCount 
      : periodData.blockedAttemptsCount;

  const displayReminders = isWindows 
    ? win.stats.remindersShown 
    : isAndroid 
      ? android.stats.remindersShown 
      : periodData.remindersShown;

  const displayIstighfar = isWindows 
    ? win.stats.istighfarCount 
    : isAndroid 
      ? android.stats.istighfarCount 
      : periodData.istighfarCount;

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} دقيقة`;
    return `${h}:${String(m).padStart(2, '0')} ساعة`;
  };

  const totalDeviceMinutes = win.stats.totalTimeMinutes + android.stats.totalTimeMinutes;
  const winPercent = totalDeviceMinutes > 0 ? Math.round((win.stats.totalTimeMinutes / totalDeviceMinutes) * 100) : 60;
  const androidPercent = 100 - winPercent;

  // Late night detection (23:00 - 05:00)
  const currentHour = new Date().getHours();
  const isLateNight = currentHour >= 23 || currentHour < 5;

  // Spiritual daily quote rotated consistently with 'جِد قلبك ✨'
  const todayQuote = useMemo(() => getTodaySpiritualQuote(), []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* 1. Late-Night Guard Alert (Shown only when critically needed) */}
      {isLateNight && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5 text-indigo-300 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 border border-indigo-300/30">
                    منطقة ضعف وتأهب روحي • ساعات الليل المتأخرة
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-white font-['Amiri',serif]">
                  الوقت متأخر يا أخي.. النوم الآن صيانة لقلبك ولصلاة الفجر
                </h4>
                <p className="text-xs text-indigo-200/80 max-w-xl">
                  تُثبت دراسات التعافي أن معظم الزلات تقع في سكون الليل بعد الإجهاد الذهني. أغلق شاشتك وتوضأ ونم على طهارة.
                </p>
              </div>
            </div>

            {onOpenPanic && (
              <button
                onClick={onOpenPanic}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>غض البصر السريع 🛡️</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Top Spiritual Welcome & Primary Actions Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>جِد قلبك ✨</span>
              <span className="text-[10px] text-teal-600 bg-teal-100/70 px-1.5 py-0.5 rounded-md font-bold">
                {todayQuote.categoryLabel}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-['Amiri',serif] text-slate-900">
              {todayQuote.quote}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed flex items-center gap-2 flex-wrap">
              <span>{todayQuote.explanation}</span>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                {todayQuote.source}
              </span>
            </p>
          </div>

          {/* Core Non-Duplicated Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            {onOpenTawbahPlan && (
              <button
                id="dash-open-tawbah-btn"
                onClick={onOpenTawbahPlan}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer"
                title="خطة التوبة النصوح وتدارك النفس"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>خطة التوبة 🌿</span>
              </button>
            )}

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('quran')}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 shadow-2xs transition-all flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer"
                title="الانتقال إلى ورد القرآن والختمة"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>الورد القرآني 📖</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Unified Control Bar (Time Period Filter + Device Filter + Sync Status) */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Real Time Period Filter: اليوم - الأسبوع - الشهر + زر التصدير المخصص حسب الفلتر */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 hidden sm:inline flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            فترة التقرير:
          </span>
          <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
            <button
              id="dash-period-today"
              onClick={() => setDashboardPeriod('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                dashboardPeriod === 'today'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اليوم (12ص - 11:59م)
            </button>
            <button
              id="dash-period-week"
              onClick={() => setDashboardPeriod('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                dashboardPeriod === 'week'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الأسبوع (السبت - الجمعة)
            </button>
            <button
              id="dash-period-month"
              onClick={() => setDashboardPeriod('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                dashboardPeriod === 'month'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الشهر (1 - 31)
            </button>
          </div>

          {onExportReport && (
            <button
              id="dash-export-period-report-btn"
              onClick={() => onExportReport(dashboardPeriod)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              title={`تصدير تقرير ${dashboardPeriod === 'today' ? 'اليوم' : dashboardPeriod === 'week' ? 'الأسبوع' : 'الشهر'} حسب الفلتر والنتائج الحالية`}
            >
              <Download className="w-3.5 h-3.5 text-teal-300" />
              <span>تصدير تقرير {dashboardPeriod === 'today' ? 'اليوم' : dashboardPeriod === 'week' ? 'الأسبوع' : 'الشهر'} 📥</span>
            </button>
          )}
        </div>

        {/* Device View Filter & Sync Indicator */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              id="filter-device-all"
              onClick={() => onSelectDeviceFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDeviceFilter === 'all'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌐 كل الأجهزة
            </button>
            <button
              id="filter-device-windows"
              onClick={() => onSelectDeviceFilter('windows')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedDeviceFilter === 'windows'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3 h-3" />
              <span>كمبيوتر</span>
            </button>
            <button
              id="filter-device-android"
              onClick={() => onSelectDeviceFilter('android')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedDeviceFilter === 'android'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>موبايل</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
            </span>
            <span className="font-mono text-teal-700 font-bold">{syncState.pairingCode}</span>
            <button
              onClick={onGoToSyncHub}
              className="text-teal-700 hover:text-teal-800 font-bold underline cursor-pointer"
            >
              إدارة
            </button>
          </div>
        </div>
      </div>

      {/* Period Context Badge */}
      <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl px-4 py-2 text-xs text-teal-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-medium">
        <span className="flex items-center gap-2">
          <span>📊</span>
          <span>{periodData.title} • {periodData.badgeLabel}</span>
        </span>
        <span className="text-[11px] text-teal-700">
          انقر على أي مؤشر أدناه لفتح التقرير البصري والرسوم البيانية المخصصة
        </span>
      </div>

      {/* 4. Main Stats Cards Grid (Interactive Visual Reports) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Card 1: Spiritual Streak */}
        <div 
          onClick={() => setSelectedReportModal('streak')}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 border border-teal-800/40 p-3.5 sm:p-4 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all text-white relative overflow-hidden cursor-pointer group"
          title="اضغط لفتح التقرير البصري للثبات"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-teal-200">الاستمرار الروحي</span>
              <RealisticMoonPhase fraction={streakInfo.fraction} size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {streakInfo.currentValue} <span className="text-[10px] sm:text-xs font-normal text-teal-300">{streakInfo.unitLabel}</span>
            </div>
            <div className="mt-1.5 text-[10px] sm:text-[11px] text-teal-200 truncate flex items-center justify-between">
              <span>🌙 {streakInfo.stageName}</span>
              <span className="text-[9px] bg-teal-800/80 px-1.5 py-0.5 rounded text-amber-300 font-bold">تقرير 📊</span>
            </div>
          </div>
        </div>

        {/* Card 2: Obligatory Prayers */}
        <div 
          onClick={() => setSelectedReportModal('prayers')}
          className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-sm hover:border-teal-500/60 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
          title="اضغط لفتح التقرير البصري للصلوات المفروضة"
        >
          <div className="flex items-center justify-between text-teal-600 mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600">الصلوات المؤكدة</span>
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {periodData.confirmedPrayers} <span className="text-xs sm:text-sm font-normal text-slate-500">/ {periodData.totalPossiblePrayers}</span>
          </div>
          <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 truncate flex items-center justify-between">
            <span>
              {dashboardPeriod === 'today' 
                ? (confirmedCount === 5 ? 'تمت الفروض 🌟' : `${5 - confirmedCount} متبقية اليوم`)
                : `${Math.round((periodData.confirmedPrayers / Math.max(1, periodData.totalPossiblePrayers)) * 100)}% التزام`}
            </span>
            <span className="text-[9px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">تقرير 📊</span>
          </div>
        </div>

        {/* Card 3: Social Media Time */}
        <div 
          onClick={() => setSelectedReportModal('social')}
          className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-sm hover:border-blue-500/60 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
          title="اضغط لفتح التقرير البصري لوقت السوشيال"
        >
          <div className="flex items-center justify-between text-blue-600 mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600">وقت السوشيال</span>
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {formatHoursMins(displaySocialMins)}
          </div>
          <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 truncate flex items-center justify-between">
            <span>{isWindows ? 'تصفح السوشيال' : isAndroid ? 'تصفح الهاتف' : 'إجمالي السوشيال'}</span>
            <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">تقرير 📊</span>
          </div>
        </div>

        {/* Card 4: Safe Browser Time */}
        <div 
          onClick={() => setSelectedReportModal('browser')}
          className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-sm hover:border-cyan-500/60 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
          title="اضغط لفتح التقرير البصري لسجل المتصفح"
        >
          <div className="flex items-center justify-between text-cyan-600 mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600">وقت المتصفح</span>
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {formatHoursMins(displayBrowserMins)}
          </div>
          <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 truncate flex items-center justify-between">
            <span>{isWindows ? 'استخدام المتصفح' : isAndroid ? 'متصفح الهاتف' : 'التصفح الآمن'}</span>
            <span className="text-[9px] text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">تقرير 📊</span>
          </div>
        </div>

        {/* Card 5: Blocked Deflected Attempts */}
        <div 
          onClick={() => setSelectedReportModal('blocked')}
          className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-sm hover:border-rose-500/60 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
          title="اضغط لفتح التقرير البصري للمحاولات المحجوبة"
        >
          <div className="flex items-center justify-between text-rose-600 mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600">محاولات محجوبة</span>
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 font-mono">
            {displayBlockedCount}
          </div>
          <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 truncate flex items-center justify-between">
            <span>ردع وحماية 100% 🔒</span>
            <span className="text-[9px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">تقرير 📊</span>
          </div>
        </div>

        {/* Card 6: Reminders & Istighfar */}
        <div 
          onClick={() => setSelectedReportModal('reminders')}
          className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-sm hover:border-amber-500/60 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
          title="اضغط لفتح التقرير البصري للتذكيرات والاستغفار"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600">التذكيرات والذكر</span>
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {displayReminders} <span className="text-[10px] sm:text-xs text-amber-600 font-sans font-bold">({displayIstighfar} ذكر)</span>
          </div>
          <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 truncate flex items-center justify-between">
            <span>تنبيهات مستجابة</span>
            <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">تقرير 📊</span>
          </div>
        </div>
      </div>

      {/* 5. Merged Two-Column Master Core (No Duplications) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Right 2 cols: Unified Daily Worship & Digital Discipline Center */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 font-['Amiri',serif]">
                  <Heart className="w-5 h-5 text-rose-500" />
                  مركز الطاعات اليومية والتحكم الرقمي
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  متابعة الصلوات الخمس، وِرد القرآن، وميزان وقت الشاشة في مكان واحد دون تكرار
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-teal-50 px-3 py-1 rounded-full text-teal-800 border border-teal-200 font-bold whitespace-nowrap">
                  🕌 {confirmedCount} / 5 مؤكدة اليوم
                </span>
              </div>
            </div>

            {/* Uplifting Evening Reflection */}
            <div className="p-3.5 bg-slate-50/60 border border-slate-200/60 rounded-2xl text-center">
              <p className="text-teal-950 font-bold font-['Amiri',serif] text-base">
                «بكرة فرصة جديدة... خليك أقرب لربنا.»
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                استغفر لما فات، واحمد الله على ما أعانك عليه، واستقبل غدك بهمة عالية ثابتاً على الحق.
              </p>
            </div>
          </div>
        </div>

        {/* Left col: Unified Activity & Recovery Center (Tabs for All Logs) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                مركز السجلات وتتبع التعافي
              </h3>
            </div>

            {/* Merged Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActivityTab('blocked')}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer text-center text-[11px] ${
                  activityTab === 'blocked'
                    ? 'bg-white text-rose-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🛡️ الحجب ({blockedAttempts.length})
              </button>
              <button
                onClick={() => setActivityTab('neuro')}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer text-center text-[11px] ${
                  activityTab === 'neuro'
                    ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌱 التعافي
              </button>
              <button
                onClick={() => setActivityTab('victories')}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer text-center text-[11px] ${
                  activityTab === 'victories'
                    ? 'bg-white text-amber-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏆 الانتصارات
              </button>
              <button
                onClick={() => setActivityTab('intentions')}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer text-center text-[11px] ${
                  activityTab === 'intentions'
                    ? 'bg-white text-teal-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌿 النوايا
              </button>
            </div>

            {/* Tab 1: Privacy-Preserving Blocked Attempts */}
            {activityTab === 'blocked' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>سجل محاولات المنع والتصدي الناجحة</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                    سجل عفيف ومحمي الخصوصية 🔒
                  </span>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-2.5 text-[11px] text-emerald-900 flex items-center gap-2">
                  <span className="text-sm">🛡️</span>
                  <span>حفاظاً على خصوصيتك وسترك التام، يوثق السجل فقط عدد المحاولات التي تم إحباطها بنجاح دون إظهار أي تفاصيل فاضحة.</span>
                </div>

                {blockedAttempts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    لا توجد أي محاولات محظورة اليوم، الحمد لله على العافية والسلامة.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {blockedAttempts.map((item, index) => (
                      <div 
                        key={item.id || index}
                        className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-2 text-xs hover:bg-slate-100/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900 truncate">
                              محاولة ردع وتصدي ناجحة #{index + 1}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              تم صد المحاولة وحفظ البصر تلقائياً • <span className="text-slate-700 font-medium">{item.app || 'المتصفح'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {item.timestamp}
                          </span>
                          <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            تم الحجب بنجاح
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Neuroplasticity */}
            {activityTab === 'neuro' && (
              <div className="pt-1">
                <NeuroplasticityCard streakDays={stats.streakDays || 1} />
              </div>
            )}

            {/* Tab 3: Victories Log */}
            {activityTab === 'victories' && (
              <div className="pt-1">
                <VictoryJournalView
                  victories={victories}
                  streakDays={stats.streakDays || 1}
                  onOpenTawbahPlan={onOpenTawbahPlan || (() => {})}
                  onOpenPanic={onOpenPanic || (() => {})}
                  onAddVictory={onAddVictory}
                />
              </div>
            )}

            {/* Tab 4: Intentions */}
            {activityTab === 'intentions' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>سجل النوايا المعلنة عند فتح التطبيقات</span>
                  <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 text-[10px]">
                    تثبيت الواعية 🌿
                  </span>
                </div>

                {recentIntentions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    لم تُسجل نيات بعد. ستظهر هنا فور فتح أي متصفح أو تطبيق.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {recentIntentions.map((intent) => (
                      <div 
                        key={intent.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-slate-800 font-bold block truncate">
                            {intent.intent}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {intent.appName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                          {intent.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reset Today stats button */}
          <div className="flex justify-end">
            <button
              id="reset-stats-btn"
              onClick={onResetStats}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors p-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة ضبط إحصائيات اليوم (بدء جلسة جديدة)
            </button>
          </div>
        </div>
      </div>

      {/* 6. Guidance & Wisdom Accordion (Why Cards) */}
      <div className="pt-2 border-t border-slate-200/80">
        <WhyCardsAccordion 
          onActionClick={(actionLabel, cardId) => {
            if (cardId === 'why-intention') onOpenIntentionTest();
            else if (cardId === 'why-istighfar') onOpenReminderTest();
            else if (cardId === 'why-protection') onOpenBlockTest();
            else if (cardId === 'why-prayer') onOpenPrayerTest();
            else if (cardId === 'why-quran' && onNavigateTab) onNavigateTab('quran');
          }}
        />
      </div>

      {/* 7. Metric Detail Visual Report Modal (Synchronized with Dashboard Period) */}
      <MetricDetailReportModal
        isOpen={selectedReportModal !== null}
        type={selectedReportModal}
        initialTimeRange={dashboardPeriod}
        onClose={() => setSelectedReportModal(null)}
        stats={stats}
        prayers={prayers}
        blockedAttempts={blockedAttempts}
        recentIntentions={recentIntentions}
        syncState={syncState}
        victories={victories}
      />
    </div>
  );
};
