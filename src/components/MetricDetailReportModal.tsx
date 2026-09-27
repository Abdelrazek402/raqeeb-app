import React, { useState, useEffect } from 'react';
import { 
  X, 
  Moon, 
  Heart, 
  Smartphone, 
  Globe, 
  ShieldAlert, 
  Bell, 
  Target, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  BarChart3, 
  PieChart, 
  Laptop, 
  ShieldCheck, 
  Award, 
  Zap, 
  Filter, 
  Info,
  ChevronLeft,
  Flame,
  ArrowUpRight,
  Download
} from 'lucide-react';
import { DailyStats, PrayerInfo, BlockedAttempt, IntentionLog, DeviceSyncHubState, VictoryLog } from '../types';
import { formatTimeArabic } from '../utils/prayerTimes';
import { calculatePeriodMoonProgress } from '../services/streakService';
import { getPeriodAggregatedStats, getStoredStatsHistory } from '../services/periodStatsService';
import { getLocalFormattedDate } from '../utils/dateUtils';
import { downloadMetricDetailReport } from '../utils/reportExport';
import { RealisticMoonPhase } from './RealisticMoonPhase';

export type MetricReportType = 'streak' | 'prayers' | 'social' | 'browser' | 'blocked' | 'reminders' | 'focus';

interface MetricDetailReportModalProps {
  isOpen: boolean;
  type: MetricReportType | null;
  onClose: () => void;
  stats: DailyStats;
  prayers: PrayerInfo[];
  blockedAttempts: BlockedAttempt[];
  recentIntentions: IntentionLog[];
  syncState: DeviceSyncHubState;
  victories?: VictoryLog[];
  initialTimeRange?: 'today' | 'week' | 'month';
}

export const MetricDetailReportModal: React.FC<MetricDetailReportModalProps> = ({
  isOpen,
  type,
  onClose,
  stats,
  prayers,
  blockedAttempts,
  recentIntentions,
  syncState,
  victories = [],
  initialTimeRange = 'today'
}) => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>(initialTimeRange);

  useEffect(() => {
    if (isOpen && initialTimeRange) {
      setTimeRange(initialTimeRange);
    }
  }, [isOpen, initialTimeRange]);

  if (!isOpen || !type) return null;

  const confirmedCount = prayers.filter(p => p.id !== 'sunrise' && p.confirmed).length;

  // Real aggregated period calculations following strict boundaries:
  // - Today: 12:00 AM to 11:59 PM
  // - Week: Saturday to Friday (7 days)
  // - Month: 1st to 31st (or 28/29/30)
  const periodData = getPeriodAggregatedStats(timeRange, stats, syncState, prayers, blockedAttempts);
  const statsHistory = getStoredStatsHistory();
  
  const streakDays = stats.streakDays || 0;
  const streakInfo = calculatePeriodMoonProgress(timeRange, periodData.confirmedPrayers, streakDays);
  
  const { weekPeriod, monthPeriod, dayPeriod, weekDaysData } = periodData;

  const rangeConfirmedPrayers = periodData.confirmedPrayers;
  const totalPossiblePrayers = periodData.totalPossiblePrayers;
  const rangeBrowserMins = periodData.browserTimeMinutes;
  const rangeBlockedCount = periodData.blockedAttemptsCount;
  const rangeReminders = periodData.remindersShown;
  const rangeIstighfar = periodData.istighfarCount;
  const rangeFocusSessions = periodData.focusSessionsCount;
  const rangeFocusMins = periodData.focusMinutesTotal;

  // Title and metadata mapping
  const reportMeta = {
    streak: {
      title: 'تقرير الاستمرار الروحي والأيام الثابتة',
      subtitle: 'تحليل بصري لرحلة الثبات، مراحل القمر الروحية، وإعادة بناء المسارات العصبية للدماغ',
      icon: Moon,
      color: 'amber',
      accentBg: 'bg-amber-50',
      accentBorder: 'border-amber-200',
      accentText: 'text-amber-700',
      iconColor: 'text-amber-500'
    },
    prayers: {
      title: 'تقرير الصلوات الخمس والمواظبة',
      subtitle: 'سجل زمني دقيق لمواعيد الصلاة وتوثيق الأداء في وقتها مع الجماعة',
      icon: Heart,
      color: 'teal',
      accentBg: 'bg-teal-50',
      accentBorder: 'border-teal-200',
      accentText: 'text-teal-700',
      iconColor: 'text-teal-600'
    },
    social: {
      title: 'قياس وقت تطبيقات التواصل',
      subtitle: 'هذا القياس غير متاح حالياً في لوحة الويب',
      icon: Smartphone,
      color: 'blue',
      accentBg: 'bg-blue-50',
      accentBorder: 'border-blue-200',
      accentText: 'text-blue-700',
      iconColor: 'text-blue-600'
    },
    browser: {
      title: 'نشاط تبويب رقيب',
      subtitle: 'مدة ظهور هذا التبويب ونشاطه فقط، وليست قياساً لإجمالي استخدام المتصفح',
      icon: Globe,
      color: 'cyan',
      accentBg: 'bg-cyan-50',
      accentBorder: 'border-cyan-200',
      accentText: 'text-cyan-700',
      iconColor: 'text-cyan-600'
    },
    blocked: {
      title: 'تقرير سجل المحاولات المحجوبة والردع',
      subtitle: 'توثيق بصري لمحاولات التشتت والمحتوى المحجوب لحفظ البصر والقلب',
      icon: ShieldAlert,
      color: 'rose',
      accentBg: 'bg-rose-50',
      accentBorder: 'border-rose-200',
      accentText: 'text-rose-700',
      iconColor: 'text-rose-600'
    },
    reminders: {
      title: 'تقرير التذكيرات والاستغفار ووقف التشتت',
      subtitle: 'سجل التنبيهات الدورية كل 10 دقائق وتجاوب الروح مع الاستغفار',
      icon: Bell,
      color: 'amber',
      accentBg: 'bg-amber-50',
      accentBorder: 'border-amber-200',
      accentText: 'text-amber-700',
      iconColor: 'text-amber-600'
    },
    focus: {
      title: 'تقرير جلسات التركيز والإنتاجية',
      subtitle: 'مؤشرات الإنجاز البعيد عن المشتتات وعدد الساعات المحمية بالدرع',
      icon: Target,
      color: 'emerald',
      accentBg: 'bg-emerald-50',
      accentBorder: 'border-emerald-200',
      accentText: 'text-emerald-700',
      iconColor: 'text-emerald-600'
    }
  }[type];

  const IconComponent = reportMeta.icon;

  const handleExportThisReport = () => {
    downloadMetricDetailReport(
      type,
      timeRange,
      stats,
      prayers,
      blockedAttempts,
      syncState,
      victories,
      streakDays
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 dir-rtl">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 ${reportMeta.accentBg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-white shadow-xs border ${reportMeta.accentBorder}`}>
              <IconComponent className={`w-6 h-6 ${reportMeta.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white border ${reportMeta.accentBorder} ${reportMeta.accentText}`}>
                  تقرير بصري تفصيلي
                </span>
                <span className="text-xs text-slate-600 font-bold bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                  {periodData.badgeLabel}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 font-['Amiri',serif]">
                {reportMeta.title}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 hidden sm:block">
                {reportMeta.subtitle}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                السجل متوفر لـ {periodData.recordedDaysCount} من {periodData.elapsedDaysCount} يوماً منقضياً؛ الأيام بلا سجل ليست صفراً مقاساً.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            {/* Time Filter Controls with Standardized Periods */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === 'today' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="يبدأ من 12:00 ص حتى 11:59 م"
              >
                اليوم
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === 'week' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="يبدأ من السبت حتى الجمعة"
              >
                الأسبوع
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === 'month' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="يبدأ من يوم 1 حتى 31 إن وجد"
              >
                الشهر
              </button>
            </div>

            {/* Export Report according to current filter & metric */}
            <button
              id="metric-export-report-btn"
              onClick={handleExportThisReport}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              title={`تصدير تقرير ${reportMeta.title} (${timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'}) حسب الفلتر والنتائج الحالية`}
            >
              <Download className="w-3.5 h-3.5 text-teal-300" />
              <span>تصدير التقرير 📥</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-full transition-colors cursor-pointer"
              title="إغلاق التقرير"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Period Banner Indicator */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-900">
              {timeRange === 'today' && 'نطاق اليوم: يبدأ من الساعة 12:00 ص حتى 11:59 م'}
              {timeRange === 'week' && `دورة الأسبوع: تبدأ من السبت حتى الجمعة (${weekPeriod.startFormatted} ⬅ ${weekPeriod.endFormatted})`}
              {timeRange === 'month' && `دورة الشهر: تبدأ من يوم 1 حتى ${monthPeriod.totalDays} ${monthPeriod.monthNameAr}`}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            {timeRange === 'today' ? dayPeriod.formattedDate : `${periodData.confirmedPrayers} صلوات مسجلة للفترة`}
          </span>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

          {/* ---------------------------------------------------- */}
          {/* 1. STREAK REPORT (الاستمرار الروحي) */}
          {/* ---------------------------------------------------- */}
          {type === 'streak' && (
            <div className="space-y-6">
              {/* Top Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-slate-900 to-teal-950 p-4 rounded-2xl text-white border border-teal-800">
                  <div className="flex items-center justify-between text-teal-300 text-xs font-bold mb-1">
                    <span>مؤشر اكتمال الفريضة/الثبات</span>
                    <RealisticMoonPhase fraction={streakInfo.fraction} size={28} className="hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-amber-300">
                    {streakInfo.currentValue} <span className="text-xs font-normal text-teal-200">{streakInfo.unitLabel}</span>
                  </div>
                  <p className="text-[11px] text-teal-200 mt-2">
                    🌙 حالة القمر: {streakInfo.stageName}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>تقدم سلسلة الأيام</span>
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-600">
                    {Math.min(100, Math.round((streakDays / 90) * 100))}%
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, Math.round((streakDays / 90) * 100))}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    نسبة من هدف شخصي مدته 90 يوماً؛ ليست مقياساً طبياً.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>الانتصارات المسجلة</span>
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {victories.length} <span className="text-xs text-slate-500 font-normal">انتصاراً مسجلاً</span>
                  </div>
                  <p className="text-[11px] text-teal-700 font-medium mt-2">
                    🛡️ مواقف تجاوزت فيها التشتت بنجاح
                  </p>
                </div>
              </div>

              {/* Monthly Visual Heatmap */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    خريطة الثبات اليومية (الـ 30 يوماً الأخيرة)
                  </h4>
                  <span className="text-xs text-slate-600 font-bold bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                    بيانات مسجلة فقط
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2 pt-2">
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (27 - idx));
                    const dateStr = getLocalFormattedDate(date);
                    const isToday = dateStr === dayPeriod.dateStr;
                    const record = statsHistory[dateStr];
                    const hasRecord = isToday || Boolean(record);
                    const confirmedPrayers = isToday
                      ? confirmedCount
                      : record?.confirmedPrayers || 0;
                    const isSuccess = hasRecord && confirmedPrayers === 5;
                    return (
                      <div 
                        key={idx}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 text-center transition-all ${
                          isSuccess 
                            ? 'bg-emerald-500 text-white font-bold shadow-2xs' 
                            : hasRecord ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-400'
                        }`}
                        title={`${dateStr}: ${hasRecord ? `${confirmedPrayers}/5 صلوات مؤكدة` : 'لا يوجد سجل لهذا اليوم'}`}
                      >
                        <span className="text-[10px] opacity-80">{hasRecord ? `${confirmedPrayers}/5` : '—'}</span>
                        <span className="text-xs font-mono font-bold">{date.getDate()}</span>
                        {isToday && <span className="text-[9px]">اليوم</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reflection */}
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-teal-900 text-xs leading-relaxed font-medium">
                <p className="font-bold text-sm text-teal-950 mb-1 font-['Amiri',serif]">
                  «تذكر دائماً: كثرة الطاعات الصغيرة تبني حصناً متيناً أمام المشتتات»
                </p>
                {streakInfo.calmReflection}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 2. PRAYERS REPORT (الصلوات الخمس) */}
          {/* ---------------------------------------------------- */}
          {type === 'prayers' && (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-teal-600 text-white p-4 rounded-2xl border border-teal-700">
                  <span className="text-xs text-teal-100 block font-semibold mb-1">
                    الصلوات المؤكدة ({timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'})
                  </span>
                  <div className="text-3xl font-extrabold font-mono">
                    {rangeConfirmedPrayers} <span className="text-xs font-normal text-teal-200">/ {totalPossiblePrayers}</span>
                  </div>
                  <p className="text-xs text-teal-100 mt-2">
                    {Math.round((rangeConfirmedPrayers / Math.max(1, totalPossiblePrayers)) * 100)}% من إجمالي الفروض المقررة
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">صلاة الفجر في وقتها</span>
                  <div className="text-2xl font-bold font-mono text-emerald-600">
                    {prayers.find(p => p.id === 'fajr')?.confirmed ? 'مؤداة في وقتها 🌟' : 'قيد الانتظار'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    أعظم مفاتيح البركة والوقاية من الزلل
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">حالة الالتزام اليومي</span>
                  <div className="text-2xl font-bold font-mono text-teal-700">
                    {confirmedCount === 5 ? 'كامل 5/5' : `${confirmedCount} من 5 مؤكدة`}
                  </div>
                  <p className="text-[11px] text-teal-700 font-medium mt-2">
                    {confirmedCount === 5 ? 'تمت جميع الفروض الخمس بفضل الله' : 'باقي صلوات اليوم لم تؤكد بعد'}
                  </p>
                </div>
              </div>

              {/* Prayers Timeline Checklist for Today */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    مواقيت صلوات اليوم الخمس وحالة التوثيق (12 ص - 11:59 م)
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    {prayers.filter(p => p.confirmed).length} من {prayers.length - 1}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {prayers.filter(p => p.id !== 'sunrise').map((p) => (
                    <div 
                      key={p.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        p.confirmed 
                          ? 'bg-teal-50/70 border-teal-200' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{p.nameAr}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {formatTimeArabic(p.time)}
                        </div>
                      </div>

                      <div>
                        {p.confirmed ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-100/80 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            مؤكدة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium text-[11px]">
                            في الانتظار
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Prayer Bar Chart Visual: Saturday to Friday Cycle */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    مستوى المحافظة على صلوات الأسبوع (دورة: السبت ⬅ الجمعة)
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    {weekPeriod.startFormatted} إلى {weekPeriod.endFormatted}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4">
                  {weekDaysData.map((dayItem) => {
                    const pct = (dayItem.confirmedPrayers / 5) * 100;
                    return (
                      <div key={dayItem.dayIndex} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-mono font-bold text-slate-600">
                          {dayItem.isFuture ? '-' : `${dayItem.confirmedPrayers}/5`}
                        </span>
                        <div className={`w-full rounded-t-lg h-24 relative overflow-hidden ${
                          dayItem.isToday ? 'bg-teal-100 ring-2 ring-teal-500/50' : 'bg-slate-100'
                        }`}>
                          {!dayItem.isFuture && (
                            <div 
                              className={`w-full absolute bottom-0 transition-all rounded-t-lg ${
                                dayItem.isToday ? 'bg-teal-600' : 'bg-teal-700/80'
                              }`} 
                              style={{ height: `${pct}%` }} 
                            />
                          )}
                          {dayItem.isFuture && (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                              قادم
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={`text-[10px] ${dayItem.isToday ? 'font-bold text-teal-700' : 'font-medium text-slate-600'}`}>
                            {dayItem.nameAr}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {dayItem.dayOfMonth}
                          </span>
                          {dayItem.isToday && (
                            <span className="text-[8px] bg-teal-600 text-white px-1 rounded-sm font-bold mt-0.5">
                              اليوم
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 3. SOCIAL MEDIA REPORT (السوشيال ميديا) */}
          {/* ---------------------------------------------------- */}
          {type === 'social' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-950">
              <h3 className="font-bold mb-2">غير مقاس</h3>
              <p className="text-sm leading-relaxed">
                لوحة الويب لا تجمع وقت استخدام تطبيقات التواصل ولا تصنفه حسب التطبيق؛ لذلك لا تعرض أصفاراً أو حدوداً آمنة مضللة. يتوفر ملخص UsageStats على جهاز Android نفسه عند منح إذن بيانات الاستخدام، لكن مزامنته إلى هذه اللوحة لم تُنفذ بعد.
              </p>
              </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 4. BROWSER REPORT (المتصفح والتصفح الآمن) */}
          {/* ---------------------------------------------------- */}
          {type === 'browser' && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-cyan-700 text-white p-4 rounded-2xl border border-cyan-800">
                  <span className="text-xs text-cyan-100 block font-semibold mb-1">
                    نشاط تبويب رقيب ({timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'})
                  </span>
                  <div className="text-3xl font-extrabold font-mono">
                    {rangeBrowserMins} <span className="text-xs font-normal text-cyan-200">دقيقة</span>
                  </div>
                  <p className="text-xs text-cyan-100 mt-2 font-mono">
                    {(rangeBrowserMins / 60).toFixed(1)} ساعة نشاط للتبويب
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">سجل حراسة النوايا</span>
                  <div className="text-2xl font-bold font-mono text-cyan-700">
                    {recentIntentions.length} <span className="text-xs font-normal text-slate-500">نية مسجلة</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-bold mt-2">
                    عدد العناصر المحفوظة حالياً فقط؛ لا يتوفر أرشيف زمني
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">التحقق من SafeSearch</span>
                  <div className="text-lg font-bold text-slate-600">
                    غير متحقق
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    لا يعرض التطبيق دليلاً على حالة إعدادات محركات البحث الخارجية.
                  </p>
                </div>
              </div>

              {/* Intentions History Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>سجل النوايا التي أعلنتها أثناء التصفح</span>
                  <span className="text-xs text-teal-700 font-bold">حراسة النية 🌿</span>
                </div>
                {recentIntentions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    لم تُسجل نيات تصفح بعد. يظهر هذا السجل فور إعلانك نية عند فتح أي موقع.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentIntentions.map((intent) => (
                      <div key={intent.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{intent.intent}</div>
                          <div className="text-[11px] text-slate-500">المتصفح: {intent.appName}</div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{intent.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 5. BLOCKED ATTEMPTS REPORT (المحاولات المحجوبة) */}
          {/* ---------------------------------------------------- */}
          {type === 'blocked' && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-rose-600 text-white p-4 rounded-2xl border border-rose-700">
                  <span className="text-xs text-rose-100 block font-semibold mb-1">
                    إجمالي المحاولات المحجوبة ({timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'})
                  </span>
                  <div className="text-3xl font-extrabold font-mono">
                    {rangeBlockedCount} <span className="text-xs font-normal text-rose-200">محاولات</span>
                  </div>
                  <p className="text-xs text-rose-100 mt-2">
                    سجل محاولات محلية؛ لا يمثل نسبة نجاح مثبتة
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">مصدر السجل</span>
                  <div className="text-sm font-bold text-slate-500 mt-2">لا يتوفر حالياً تفصيل موثوق حسب الجهاز.</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">حالة الدرع والحماية</span>
                  <div className="text-lg font-bold text-slate-600">
                    الحالة غير متحققة
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    يلزم اختبار الحجب الفعلي على الجهاز لمعرفة حالة الحماية.
                  </p>
                </div>
              </div>

              {/* Weekly Blocked Attempts Chart: Saturday to Friday */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-rose-600" />
                    المحاولات المحجوبة على مدار الأسبوع (السبت ⬅ الجمعة)
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">سجل الحجب العفيف</span>
                </div>

                <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4">
                  {weekDaysData.map((d) => {
                    const maxCount = Math.max(...weekDaysData.map(w => w.blockedCount), 4);
                    const pct = Math.min(100, Math.round((d.blockedCount / maxCount) * 100));
                    return (
                      <div key={d.dayIndex} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-mono font-bold text-slate-600">
                          {d.isFuture ? '-' : d.blockedCount}
                        </span>
                        <div className={`w-full rounded-t-lg h-24 relative overflow-hidden ${
                          d.isToday ? 'bg-rose-100 ring-2 ring-rose-500/50' : 'bg-slate-100'
                        }`}>
                          {!d.isFuture && (
                            <div 
                              className={`w-full absolute bottom-0 transition-all rounded-t-lg ${
                                d.isToday ? 'bg-rose-600' : 'bg-rose-700/80'
                              }`} 
                              style={{ height: `${pct}%` }} 
                            />
                          )}
                          {d.isFuture && (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                              قادم
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] ${d.isToday ? 'font-bold text-rose-700' : 'text-slate-600'}`}>
                          {d.nameAr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Blocked Attempts Log List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>سجل محاولات المنع والتصدي الناجحة ({timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'سجل الأسبوع' : 'سجل الشهر'})</span>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">🔒 سجل عفيف مشفّر للخصوصية</span>
                </div>
                
                <div className="bg-emerald-50/60 border-b border-emerald-100 p-3 text-[11px] text-emerald-900 flex items-center gap-2">
                  <span>🛡️</span>
                  <span>حفاظاً على خصوصيتك وسترك التام، يوثق السجل فقط عدد المحاولات التي تم إحباطها بنجاح دون إظهار أي تفاصيل فاضحة.</span>
                </div>

                {blockedAttempts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    لا توجد محاولات حجب اليوم. الحمد لله على سلامة النفس والعين.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {blockedAttempts.map((item, index) => (
                      <div key={item.id || index} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            🛡️
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">محاولة منع وتصدي ناجحة #{index + 1}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              تم صد المحاولة وحماية البصر تلقائياً • <span className="font-medium text-slate-700">{item.app || 'المتصفح'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono block whitespace-nowrap">{item.timestamp}</span>
                          <span className="text-[9px] text-slate-500 font-bold">سجل محلي</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 6. REMINDERS REPORT (التذكيرات والاستغفار) */}
          {/* ---------------------------------------------------- */}
          {type === 'reminders' && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-amber-600 text-white p-4 rounded-2xl border border-amber-700">
                  <span className="text-xs text-amber-100 block font-semibold mb-1">
                    عدد التنبيهات المستجابة ({timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'})
                  </span>
                  <div className="text-3xl font-extrabold font-mono">
                    {rangeReminders} <span className="text-xs font-normal text-amber-200">تنبيهات</span>
                  </div>
                  <p className="text-xs text-amber-100 mt-2">
                    تذكير دوري كل 10 دقائق من التصفح المستمر
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">مرات الاستغفار المسجلة</span>
                  <div className="text-2xl font-bold font-mono text-amber-700">
                    {rangeIstighfar} <span className="text-xs font-normal text-slate-500">مرة</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-bold mt-2">
                    «استغفر الله العظيم وأتوب إليه»
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">معدل الاستجابة للتوقف</span>
                  <div className="text-2xl font-bold font-mono text-emerald-600">
                    94%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    استجابة بالذكر والدعاء
                  </p>
                </div>
              </div>

              {/* Information Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed font-medium">
                <p className="font-bold text-slate-900 text-sm mb-1">
                  💡 لماذا تظهر التذكيرات كل 10 دقائق؟
                </p>
                التصفح اللاواعي والانغماس التلقائي يحدث عند ترك الشاشة مفتوحة لفترات متصلة. يتدخل التطبيق بتنبيه لطيف يعيد وعيك للنية وللاستغفار لمنع الانزلاق للمشتتات.
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 7. FOCUS SESSIONS REPORT (جلسات التركيز) */}
          {/* ---------------------------------------------------- */}
          {type === 'focus' && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-600 text-white p-4 rounded-2xl border border-emerald-700">
                  <span className="text-xs text-emerald-100 block font-semibold mb-1">
                    جلسات التركيز المنجزة ({timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'})
                  </span>
                  <div className="text-3xl font-extrabold font-mono">
                    {rangeFocusSessions} <span className="text-xs font-normal text-emerald-200">جلسات</span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-2 font-mono">
                    إجمالي {rangeFocusMins} دقيقة عميقة
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">معدل الإنجاز</span>
                  <div className="text-2xl font-bold font-mono text-emerald-700">
                    {(rangeFocusMins / 60).toFixed(1)} <span className="text-xs font-normal text-slate-500">ساعة</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    إنتاجية خالية من المشتتات
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">تقييم التركيز الذهني</span>
                  <div className="text-2xl font-bold font-mono text-emerald-600">
                    ممتاز 🌟
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    صفاء ذهن وتركيز عالي
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block animate-pulse"></span>
            دورة التقارير: اليوم (12ص-11:59م) • الأسبوع (السبت-الجمعة) • الشهر (1-31)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </div>
  );
};
