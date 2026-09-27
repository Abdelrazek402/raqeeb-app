import { DailyStats, PrayerInfo, BlockedAttempt, IntentionLog, DeviceSyncHubState } from '../types';
import { 
  getDayPeriod, 
  getWeekPeriod, 
  getMonthPeriod, 
  DayPeriod, 
  WeekPeriod, 
  MonthPeriod,
  getLocalFormattedDate 
} from '../utils/dateUtils';
import { loadStored, saveStored } from '../utils/storage';

export const STATS_HISTORY_KEY = 'raqeeb_daily_stats_history_v1';

export interface DayStatsRecord {
  dateStr: string;
  confirmedPrayers: number;
  socialTimeMinutes: number;
  browserTimeMinutes: number;
  blockedAttemptsCount: number;
  remindersShown: number;
  istighfarCount: number;
  focusSessionsCount: number;
  focusMinutesTotal: number;
}

export interface WeekDayStatItem {
  dayIndex: number; // 0 = السبت, 6 = الجمعة
  nameAr: string;   // 'السبت', 'الأحد', ... 'الجمعة'
  dateStr: string;
  dayOfMonth: number;
  isToday: boolean;
  hasRecordedData: boolean;
  isPast: boolean;
  isFuture: boolean;
  confirmedPrayers: number;
  socialMins: number;
  browserMins: number;
  blockedCount: number;
  remindersCount: number;
  istighfarCount: number;
  focusMins: number;
  focusSessions: number;
}

export interface PeriodAggregatedData {
  periodType: 'today' | 'week' | 'month';
  dayPeriod: DayPeriod;
  weekPeriod: WeekPeriod;
  monthPeriod: MonthPeriod;
  title: string;
  timeRangeLabel: string;
  badgeLabel: string;
  recordedDaysCount: number;
  elapsedDaysCount: number;
  
  // Unified Aggregated Metrics
  confirmedPrayers: number;
  totalPossiblePrayers: number;
  socialTimeMinutes: number;
  browserTimeMinutes: number;
  totalScreenMinutes: number;
  blockedAttemptsCount: number;
  remindersShown: number;
  istighfarCount: number;
  focusSessionsCount: number;
  focusMinutesTotal: number;

  // Visual breakdown data
  weekDaysData: WeekDayStatItem[]; // Always 7 days: السبت -> الجمعة
  
  // Multi-device breakdown
  windowsScreenMins: number;
  androidScreenMins: number;
}

/**
 * Retrieve the full historical records by date string (YYYY-MM-DD)
 */
export function getStoredStatsHistory(): Record<string, DayStatsRecord> {
  return loadStored<Record<string, DayStatsRecord>>(STATS_HISTORY_KEY, {});
}

/**
 * Store or update a specific day's stats in history
 */
export function recordStatsForDay(dateStr: string, stats: Partial<DayStatsRecord>): void {
  const history = getStoredStatsHistory();
  const existing = history[dateStr] || {
    dateStr,
    confirmedPrayers: 0,
    socialTimeMinutes: 0,
    browserTimeMinutes: 0,
    blockedAttemptsCount: 0,
    remindersShown: 0,
    istighfarCount: 0,
    focusSessionsCount: 0,
    focusMinutesTotal: 0
  };

  history[dateStr] = {
    ...existing,
    ...stats,
    dateStr
  };

  saveStored(STATS_HISTORY_KEY, history);
}

/**
 * Returns a clean, empty daily stat record for days without actual measured history.
 * Ensures that historical reports contain 100% real measured user metrics with zero artificial generation.
 */
function getEmptyPastDay(dateStr: string): DayStatsRecord {
  return {
    dateStr,
    confirmedPrayers: 0,
    socialTimeMinutes: 0,
    browserTimeMinutes: 0,
    blockedAttemptsCount: 0,
    remindersShown: 0,
    istighfarCount: 0,
    focusSessionsCount: 0,
    focusMinutesTotal: 0
  };
}

/**
 * Aggregates statistics for the requested period:
 * - 'today': 12:00 AM to 11:59 PM (Today only)
 * - 'week': Saturday (12:00 AM) to Friday (11:59 PM)
 * - 'month': Day 1 (12:00 AM) to Day 28/29/30/31 (11:59 PM)
 */
export function getPeriodAggregatedStats(
  periodType: 'today' | 'week' | 'month',
  todayStats: DailyStats,
  syncState: DeviceSyncHubState,
  prayers: PrayerInfo[],
  blockedAttempts: BlockedAttempt[]
): PeriodAggregatedData {
  const refDate = new Date();
  const dayPeriod = getDayPeriod(refDate);
  const weekPeriod = getWeekPeriod(refDate);
  const monthPeriod = getMonthPeriod(refDate);
  const history = getStoredStatsHistory();

  const todayConfirmedCount = prayers.filter(p => p.id !== 'sunrise' && p.confirmed).length;
  const streakDays = todayStats.streakDays || 1;

  // Make sure today's active live stats are mirrored in today's history
  const todayRecord: DayStatsRecord = {
    dateStr: dayPeriod.dateStr,
    confirmedPrayers: todayConfirmedCount,
    socialTimeMinutes: todayStats.socialTimeMinutes || 0,
    browserTimeMinutes: todayStats.browserTimeMinutes || 0,
    blockedAttemptsCount: blockedAttempts.length,
    remindersShown: todayStats.remindersShown || 0,
    istighfarCount: todayStats.istighfarCount || 0,
    focusSessionsCount: todayStats.focusSessionsCount || 0,
    focusMinutesTotal: todayStats.focusMinutesTotal || 0
  };
  const hasTodayMeasurements = todayConfirmedCount > 0 ||
    todayStats.browserTimeMinutes > 0 ||
    todayStats.focusMinutesTotal > 0 ||
    todayStats.focusSessionsCount > 0 ||
    todayStats.istighfarCount > 0 ||
    todayStats.remindersShown > 0 ||
    blockedAttempts.length > 0;

  // Build the 7 Week Days Data (Saturday -> Friday)
  const weekDaysData: WeekDayStatItem[] = weekPeriod.days.map((item) => {
    let dayData: DayStatsRecord;
    let hasRecordedData: boolean;

    if (item.isToday) {
      dayData = todayRecord;
      hasRecordedData = hasTodayMeasurements;
    } else if (item.isPast) {
      dayData = history[item.dateStr] || getEmptyPastDay(item.dateStr);
      hasRecordedData = Boolean(history[item.dateStr]);
    } else {
      // Future day in the current week (e.g. today is Tuesday, so Wednesday, Thursday, Friday are upcoming)
      dayData = {
        dateStr: item.dateStr,
        confirmedPrayers: 0,
        socialTimeMinutes: 0,
        browserTimeMinutes: 0,
        blockedAttemptsCount: 0,
        remindersShown: 0,
        istighfarCount: 0,
        focusSessionsCount: 0,
        focusMinutesTotal: 0
      };
      hasRecordedData = false;
    }

    return {
      dayIndex: item.dayIndex,
      nameAr: item.nameAr,
      dateStr: item.dateStr,
      dayOfMonth: item.dayOfMonth,
      isToday: item.isToday,
      isPast: item.isPast,
      isFuture: item.isFuture,
      hasRecordedData,
      confirmedPrayers: dayData.confirmedPrayers,
      socialMins: dayData.socialTimeMinutes,
      browserMins: dayData.browserTimeMinutes,
      blockedCount: dayData.blockedAttemptsCount,
      remindersCount: dayData.remindersShown,
      istighfarCount: dayData.istighfarCount,
      focusMins: dayData.focusMinutesTotal,
      focusSessions: dayData.focusSessionsCount
    };
  });

  // Calculate Week Totals
  const weekElapsedDays = weekDaysData.filter(d => d.isPast || d.isToday);
  const weekRecordedDaysCount = weekElapsedDays.filter(d => d.hasRecordedData).length;
  const weekRecordedDays = weekElapsedDays.filter(d => d.hasRecordedData);
  const weekConfirmedPrayers = weekRecordedDays.reduce((sum, d) => sum + d.confirmedPrayers, 0);
  const weekPossiblePrayers = weekRecordedDaysCount * 5;
  const weekSocialMins = weekRecordedDays.reduce((sum, d) => sum + d.socialMins, 0);
  const weekBrowserMins = weekRecordedDays.reduce((sum, d) => sum + d.browserMins, 0);
  const weekBlockedCount = weekRecordedDays.reduce((sum, d) => sum + d.blockedCount, 0);
  const weekReminders = weekRecordedDays.reduce((sum, d) => sum + d.remindersCount, 0);
  const weekIstighfar = weekRecordedDays.reduce((sum, d) => sum + d.istighfarCount, 0);
  const weekFocusSessions = weekRecordedDays.reduce((sum, d) => sum + d.focusSessions, 0);
  const weekFocusMins = weekRecordedDays.reduce((sum, d) => sum + d.focusMins, 0);

  // Calculate Month Totals (Day 1 to Last Day: 28/29/30/31)
  const monthElapsedDaysCount = monthPeriod.currentDayNum; // 1 to 31
  let monthConfirmedPrayers = 0;
  let monthSocialMins = 0;
  let monthBrowserMins = 0;
  let monthBlockedCount = 0;
  let monthReminders = 0;
  let monthIstighfar = 0;
  let monthFocusSessions = 0;
  let monthFocusMins = 0;
  let monthRecordedDaysCount = 0;

  for (let dayNum = 1; dayNum <= monthElapsedDaysCount; dayNum++) {
    const dayDate = new Date(monthPeriod.year, monthPeriod.monthIndex, dayNum, 12, 0, 0, 0);
    const dateStr = getLocalFormattedDate(dayDate);
    let record: DayStatsRecord;

    if (dateStr === dayPeriod.dateStr) {
      record = todayRecord;
      if (hasTodayMeasurements) monthRecordedDaysCount += 1;
    } else {
      record = history[dateStr] || getEmptyPastDay(dateStr);
      if (history[dateStr]) monthRecordedDaysCount += 1;
    }

    monthConfirmedPrayers += record.confirmedPrayers;
    monthSocialMins += record.socialTimeMinutes;
    monthBrowserMins += record.browserTimeMinutes;
    monthBlockedCount += record.blockedAttemptsCount;
    monthReminders += record.remindersShown;
    monthIstighfar += record.istighfarCount;
    monthFocusSessions += record.focusSessionsCount;
    monthFocusMins += record.focusMinutesTotal;
  }

  const monthPossiblePrayers = monthRecordedDaysCount * 5;

  // Multi-device distribution

  if (periodType === 'today') {
    const totalScreen = todayRecord.socialTimeMinutes + todayRecord.browserTimeMinutes;
    return {
      periodType: 'today',
      dayPeriod,
      weekPeriod,
      monthPeriod,
      title: 'تقرير اليوم (من 12:00 ص إلى 11:59 م)',
      timeRangeLabel: dayPeriod.label,
      badgeLabel: 'اليوم (12:00 ص - 11:59 م)',
      recordedDaysCount: hasTodayMeasurements ? 1 : 0,
      elapsedDaysCount: 1,
      confirmedPrayers: todayRecord.confirmedPrayers,
      totalPossiblePrayers: hasTodayMeasurements ? 5 : 0,
      socialTimeMinutes: todayRecord.socialTimeMinutes,
      browserTimeMinutes: todayRecord.browserTimeMinutes,
      totalScreenMinutes: totalScreen,
      blockedAttemptsCount: todayRecord.blockedAttemptsCount,
      remindersShown: todayRecord.remindersShown,
      istighfarCount: todayRecord.istighfarCount,
      focusSessionsCount: todayRecord.focusSessionsCount,
      focusMinutesTotal: todayRecord.focusMinutesTotal,
      weekDaysData,
      windowsScreenMins: 0,
      androidScreenMins: 0
    };
  }

  if (periodType === 'week') {
    const totalScreen = weekSocialMins + weekBrowserMins;
    return {
      periodType: 'week',
      dayPeriod,
      weekPeriod,
      monthPeriod,
      title: `تقرير الأسبوع (من السبت ${weekPeriod.startFormatted} حتى الجمعة ${weekPeriod.endFormatted})`,
      timeRangeLabel: weekPeriod.label,
      badgeLabel: `الأسبوع: السبت - الجمعة (${weekPeriod.elapsedDaysCount} من 7 أيام)`,
      recordedDaysCount: weekRecordedDaysCount,
      elapsedDaysCount: weekElapsedDays.length,
      confirmedPrayers: weekConfirmedPrayers,
      totalPossiblePrayers: weekPossiblePrayers,
      socialTimeMinutes: weekSocialMins,
      browserTimeMinutes: weekBrowserMins,
      totalScreenMinutes: totalScreen,
      blockedAttemptsCount: weekBlockedCount,
      remindersShown: weekReminders,
      istighfarCount: weekIstighfar,
      focusSessionsCount: weekFocusSessions,
      focusMinutesTotal: weekFocusMins,
      weekDaysData,
      windowsScreenMins: 0,
      androidScreenMins: 0
    };
  }

  // periodType === 'month'
  const totalScreen = monthSocialMins + monthBrowserMins;
  return {
    periodType: 'month',
    dayPeriod,
    weekPeriod,
    monthPeriod,
    title: `تقرير شهر ${monthPeriod.monthNameAr} (من يوم 1 حتى ${monthPeriod.totalDays})`,
    timeRangeLabel: monthPeriod.label,
    badgeLabel: `الشهر: 1 - ${monthPeriod.totalDays} ${monthPeriod.monthNameAr} (اليوم ${monthPeriod.currentDayNum})`,
    recordedDaysCount: monthRecordedDaysCount,
    elapsedDaysCount: monthElapsedDaysCount,
    confirmedPrayers: monthConfirmedPrayers,
    totalPossiblePrayers: monthPossiblePrayers,
    socialTimeMinutes: monthSocialMins,
    browserTimeMinutes: monthBrowserMins,
    totalScreenMinutes: totalScreen,
    blockedAttemptsCount: monthBlockedCount,
    remindersShown: monthReminders,
    istighfarCount: monthIstighfar,
    focusSessionsCount: monthFocusSessions,
    focusMinutesTotal: monthFocusMins,
    weekDaysData,
    windowsScreenMins: 0,
    androidScreenMins: 0
  };
}

export interface DailySummaryItem {
  dateStr: string;
  dayName: string;
  dayShort: string;
  formattedDate: string;
  isToday: boolean;
  hasRecordedData: boolean;
  
  // Metrics
  confirmedPrayers: number;
  totalPrayers: number;
  prayerPercentage: number;
  
  focusMinutes: number;
  focusSessions: number;
  
  screenTimeMinutes: number;
  socialMinutes: number;
  browserMinutes: number;
  
  blockedAttempts: number;
  istighfarCount: number;
  remindersShown: number;
  
  statusVerdict: string;
}

export interface WeeklySummaryReport {
  days: DailySummaryItem[];
  recordedDaysCount: number;
  elapsedDaysCount: number;
  
  totalConfirmedPrayers: number;
  totalPossiblePrayers: number;
  prayerConsistencyPercentage: number;
  
  totalFocusMinutes: number;
  totalFocusHoursFormatted: string;
  totalFocusSessions: number;
  averageDailyFocusMinutes: number;
  
  totalScreenTimeMinutes: number;
  totalScreenTimeHoursFormatted: string;
  averageDailyScreenMinutes: number;
  
  totalBlockedAttempts: number;
  totalIstighfarCount: number;
  
  focusToScreenRatio: number;
  
  weeklyScore: number | null;
  weeklyGrade: string;
  weeklyBadgeColor: string;
  weeklyAdvice: string;
}

/**
 * Aggregates daily stats, prayer consistency, and focus sessions over the last 7 days.
 */
export function getRolling7DaysSummary(
  todayStats: DailyStats,
  prayers: PrayerInfo[],
  blockedAttempts: BlockedAttempt[]
): WeeklySummaryReport {
  const daysOfWeekAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const history = getStoredStatsHistory();
  const todayStr = getLocalFormattedDate();
  const todayConfirmedPrayers = prayers.filter(p => p.id !== 'sunrise' && p.confirmed).length;
  const hasTodayMeasurements = todayConfirmedPrayers > 0 ||
    todayStats.browserTimeMinutes > 0 ||
    todayStats.focusMinutesTotal > 0 ||
    todayStats.focusSessionsCount > 0 ||
    todayStats.istighfarCount > 0 ||
    todayStats.remindersShown > 0 ||
    blockedAttempts.length > 0;

  const days: DailySummaryItem[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = i === 0 ? 'اليوم' : i === 1 ? 'أمس' : daysOfWeekAr[d.getDay()];
    const dayShort = daysOfWeekAr[d.getDay()];
    const formattedDate = `${dd}/${mm}`;
    const isToday = dateStr === todayStr;

    let confirmedPrayers = 0;
    let focusMins = 0;
    let focusSessions = 0;
    let screenMins = 0;
    let socialMins = 0;
    let browserMins = 0;
    let blockedCount = 0;
    let istighfar = 0;
    let reminders = 0;
    const hasRecordedData = Boolean(history[dateStr]) || (isToday && hasTodayMeasurements);

    if (isToday) {
      confirmedPrayers = todayConfirmedPrayers;
      browserMins = todayStats.browserTimeMinutes || 0;
      screenMins = browserMins;
      blockedCount = blockedAttempts.length;
      istighfar = todayStats.istighfarCount || 0;
      reminders = todayStats.remindersShown || 0;
      focusMins = todayStats.focusMinutesTotal || 0;
      focusSessions = todayStats.focusSessionsCount || 0;
    } else {
      const record = history[dateStr] || getEmptyPastDay(dateStr);
      confirmedPrayers = Math.min(5, record.confirmedPrayers || 0);
      browserMins = record.browserTimeMinutes || 0;
      screenMins = browserMins;
      blockedCount = record.blockedAttemptsCount || 0;
      istighfar = record.istighfarCount || 0;
      reminders = record.remindersShown || 0;
      focusMins = record.focusMinutesTotal || 0;
      focusSessions = record.focusSessionsCount || 0;
    }

    const prayerPct = hasRecordedData ? Math.round((confirmedPrayers / 5) * 100) : 0;

    let statusVerdict = hasRecordedData ? 'ثبات والتزام' : 'لا توجد بيانات مسجلة لهذا اليوم';
    if (hasRecordedData) {
      if (confirmedPrayers === 5 && focusMins >= 45) {
        statusVerdict = 'يوم نوراني متكامل 🌟';
      } else if (confirmedPrayers >= 4) {
        statusVerdict = 'محافظة عالية على الصلاة 🕌';
      } else if (focusMins >= 60) {
        statusVerdict = 'تركيز عميق وإنجاز 🎯';
      } else {
        statusVerdict = 'ثبات ومجاهدة مستمرة 🛡️';
      }
    }

    days.push({
      dateStr,
      dayName,
      dayShort,
      formattedDate,
      isToday,
      hasRecordedData,
      confirmedPrayers,
      totalPrayers: 5,
      prayerPercentage: prayerPct,
      focusMinutes: focusMins,
      focusSessions,
      screenTimeMinutes: screenMins,
      socialMinutes: socialMins,
      browserMinutes: browserMins,
      blockedAttempts: blockedCount,
      istighfarCount: istighfar,
      remindersShown: reminders,
      statusVerdict
    });
  }

  // Aggregate stats
  const recordedDays = days.filter(day => day.hasRecordedData);
  const recordedDaysCount = recordedDays.length;
  const elapsedDaysCount = days.filter(day => day.isToday || day.dateStr < todayStr).length;
  const totalConfirmedPrayers = recordedDays.reduce((sum, d) => sum + d.confirmedPrayers, 0);
  const totalPossiblePrayers = recordedDaysCount * 5;
  const prayerConsistencyPercentage = totalPossiblePrayers > 0
    ? Math.round((totalConfirmedPrayers / totalPossiblePrayers) * 100)
    : 0;

  const totalFocusMinutes = recordedDays.reduce((sum, d) => sum + d.focusMinutes, 0);
  const totalFocusSessions = recordedDays.reduce((sum, d) => sum + d.focusSessions, 0);
  const averageDailyFocusMinutes = recordedDaysCount > 0 ? Math.round(totalFocusMinutes / recordedDaysCount) : 0;
  const focusHours = (totalFocusMinutes / 60).toFixed(1);
  const totalFocusHoursFormatted = `${focusHours} ساعة`;

  const totalScreenTimeMinutes = recordedDays.reduce((sum, d) => sum + d.screenTimeMinutes, 0);
  const screenHours = (totalScreenTimeMinutes / 60).toFixed(1);
  const totalScreenTimeHoursFormatted = `${screenHours} ساعة`;
  const averageDailyScreenMinutes = recordedDaysCount > 0 ? Math.round(totalScreenTimeMinutes / recordedDaysCount) : 0;

  const totalBlockedAttempts = recordedDays.reduce((sum, d) => sum + d.blockedAttempts, 0);
  const totalIstighfarCount = recordedDays.reduce((sum, d) => sum + d.istighfarCount, 0);

  const focusToScreenRatio = totalScreenTimeMinutes > 0 
    ? Math.min(100, Math.round((totalFocusMinutes / totalScreenTimeMinutes) * 100))
    : 0;

  // Spiritual Momentum Calculation (Weighted: 50% Prayers, 30% Focus & Discipline, 20% Istighfar & Protection)
  const prayerFactor = (prayerConsistencyPercentage / 100) * 50;
  const focusFactor = Math.min(30, (totalFocusMinutes / Math.max(1, recordedDaysCount * 45)) * 30);
  const istighfarFactor = Math.min(20, (totalIstighfarCount / Math.max(1, recordedDaysCount * 10)) * 20);
  const weeklyScore = recordedDaysCount > 0
    ? Math.min(100, Math.round(prayerFactor + focusFactor + istighfarFactor))
    : null;

  let weeklyGrade = 'ثبات واستقامة استثنائية (ممتاز)';
  let weeklyBadgeColor = 'emerald';
  let weeklyAdvice = 'ما شاء الله تبارك الله! استمرارك على الصلوات الخمس مع جلسات التركيز يبني حصناً منيعاً لقلبك ووعيك.';

  if (weeklyScore === null) {
    weeklyGrade = 'لا توجد بيانات مسجلة بعد';
    weeklyBadgeColor = 'slate';
    weeklyAdvice = 'ستظهر المؤشرات بعد تسجيل نشاط فعلي في التطبيق.';
  } else if (weeklyScore < 60) {
    weeklyGrade = 'بحاجة إلى تعزيز الهمة والمواظبة';
    weeklyBadgeColor = 'amber';
    weeklyAdvice = 'اجعل نداء الأذان نقطة انطلاق فورية لصلاتك، وابدأ بجلسة تركيز واحدة يومياً لمدة 25 دقيقة.';
  } else if (weeklyScore < 80) {
    weeklyGrade = 'أداء طيب ومبشر (جيد جداً)';
    weeklyBadgeColor = 'teal';
    weeklyAdvice = 'أداؤك متوازن وثابت. عزز الورد القرآني بعد صلاة الفجر وأكثر من الاستغفار وقت الخلوة لرفع التركيز.';
  }

  return {
    days,
    recordedDaysCount,
    elapsedDaysCount,
    totalConfirmedPrayers,
    totalPossiblePrayers,
    prayerConsistencyPercentage,
    totalFocusMinutes,
    totalFocusHoursFormatted,
    totalFocusSessions,
    averageDailyFocusMinutes,
    totalScreenTimeMinutes,
    totalScreenTimeHoursFormatted,
    averageDailyScreenMinutes,
    totalBlockedAttempts,
    totalIstighfarCount,
    focusToScreenRatio,
    weeklyScore,
    weeklyGrade,
    weeklyBadgeColor,
    weeklyAdvice
  };
}

export interface WeekComparisonItem {
  weekIndex: number;
  weekKey: string;
  weekLabel: string;
  dateRangeLabel: string;
  recordedDaysCount: number;
  confirmedPrayers: number;
  possiblePrayers: number;
  prayerPercentage: number | null;
  focusMinutes: number;
  focusHours: number;
  focusHoursFormatted: string;
  focusSessions: number;
  screenTimeMinutes: number;
  screenHours: number;
  screenHoursFormatted: string;
  blockedAttempts: number;
  istighfarCount: number;
  productivityScore: number | null;
}

export interface MonthlySummaryReport {
  days: DailySummaryItem[];
  weeksComparison: WeekComparisonItem[];
  recordedDaysCount: number;
  elapsedDaysCount: number;
  
  totalConfirmedPrayers: number;
  totalPossiblePrayers: number;
  prayerConsistencyPercentage: number;
  
  totalFocusMinutes: number;
  totalFocusHoursFormatted: string;
  totalFocusSessions: number;
  averageDailyFocusMinutes: number;
  
  totalScreenTimeMinutes: number;
  totalScreenTimeHoursFormatted: string;
  averageDailyScreenMinutes: number;
  
  totalBlockedAttempts: number;
  totalIstighfarCount: number;
  
  focusToScreenRatio: number;
  
  monthlyScore: number | null;
  monthlyGrade: string;
  monthlyBadgeColor: string;
  monthlyAdvice: string;
  
  prayerGrowthVsLastWeek: number | null;
  focusGrowthVsLastWeek: number | null;
}

/**
 * Aggregates daily stats, prayer consistency, and focus sessions over the last 30 days,
 * with structured 4-week comparative metrics.
 */
export function getRolling30DaysMonthlySummary(
  todayStats: DailyStats,
  prayers: PrayerInfo[],
  blockedAttempts: BlockedAttempt[]
): MonthlySummaryReport {
  const daysOfWeekAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const history = getStoredStatsHistory();
  const todayStr = getLocalFormattedDate();
  const todayConfirmedPrayers = prayers.filter(p => p.id !== 'sunrise' && p.confirmed).length;
  const hasTodayMeasurements = todayConfirmedPrayers > 0 ||
    todayStats.browserTimeMinutes > 0 ||
    todayStats.focusMinutesTotal > 0 ||
    todayStats.focusSessionsCount > 0 ||
    todayStats.istighfarCount > 0 ||
    todayStats.remindersShown > 0 ||
    blockedAttempts.length > 0;

  const days: DailySummaryItem[] = [];

  // Generate 30 days from 29 days ago up to today
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = i === 0 ? 'اليوم' : i === 1 ? 'أمس' : daysOfWeekAr[d.getDay()];
    const dayShort = daysOfWeekAr[d.getDay()];
    const formattedDate = `${dd}/${mm}`;
    const isToday = dateStr === todayStr;

    let confirmedPrayers = 0;
    let focusMins = 0;
    let focusSessions = 0;
    let screenMins = 0;
    let socialMins = 0;
    let browserMins = 0;
    let blockedCount = 0;
    let istighfar = 0;
    let reminders = 0;
    const hasRecordedData = Boolean(history[dateStr]) || (isToday && hasTodayMeasurements);

    if (isToday) {
      confirmedPrayers = todayConfirmedPrayers;
      browserMins = todayStats.browserTimeMinutes || 0;
      screenMins = browserMins;
      blockedCount = blockedAttempts.length;
      istighfar = todayStats.istighfarCount || 0;
      reminders = todayStats.remindersShown || 0;
      focusMins = todayStats.focusMinutesTotal || 0;
      focusSessions = todayStats.focusSessionsCount || 0;
    } else {
      const record = history[dateStr] || getEmptyPastDay(dateStr);
      confirmedPrayers = Math.min(5, record.confirmedPrayers || 0);
      browserMins = record.browserTimeMinutes || 0;
      screenMins = browserMins;
      blockedCount = record.blockedAttemptsCount || 0;
      istighfar = record.istighfarCount || 0;
      reminders = record.remindersShown || 0;
      focusMins = record.focusMinutesTotal || 0;
      focusSessions = record.focusSessionsCount || 0;
    }

    const prayerPct = hasRecordedData ? Math.round((confirmedPrayers / 5) * 100) : 0;

    let statusVerdict = hasRecordedData ? 'ثبات والتزام' : 'لا توجد بيانات مسجلة لهذا اليوم';
    if (hasRecordedData) {
      if (confirmedPrayers === 5 && focusMins >= 45) {
        statusVerdict = 'يوم نوراني متكامل 🌟';
      } else if (confirmedPrayers >= 4) {
        statusVerdict = 'محافظة عالية على الصلاة 🕌';
      } else if (focusMins >= 60) {
        statusVerdict = 'تركيز عميق وإنجاز 🎯';
      } else {
        statusVerdict = 'ثبات ومجاهدة مستمرة 🛡️';
      }
    }

    days.push({
      dateStr,
      dayName,
      dayShort,
      formattedDate,
      isToday,
      hasRecordedData,
      confirmedPrayers,
      totalPrayers: 5,
      prayerPercentage: prayerPct,
      focusMinutes: focusMins,
      focusSessions,
      screenTimeMinutes: screenMins,
      socialMinutes: socialMins,
      browserMinutes: browserMins,
      blockedAttempts: blockedCount,
      istighfarCount: istighfar,
      remindersShown: reminders,
      statusVerdict
    });
  }

  // Aggregate monthly totals (30 days)
  const recordedDays = days.filter(day => day.hasRecordedData);
  const recordedDaysCount = recordedDays.length;
  const totalConfirmedPrayers = recordedDays.reduce((sum, d) => sum + d.confirmedPrayers, 0);
  const totalPossiblePrayers = recordedDaysCount * 5;
  const prayerConsistencyPercentage = totalPossiblePrayers > 0
    ? Math.round((totalConfirmedPrayers / totalPossiblePrayers) * 100)
    : 0;

  const totalFocusMinutes = recordedDays.reduce((sum, d) => sum + d.focusMinutes, 0);
  const totalFocusSessions = recordedDays.reduce((sum, d) => sum + d.focusSessions, 0);
  const averageDailyFocusMinutes = recordedDaysCount > 0 ? Math.round(totalFocusMinutes / recordedDaysCount) : 0;
  const focusHours = (totalFocusMinutes / 60).toFixed(1);
  const totalFocusHoursFormatted = `${focusHours} ساعة`;

  const totalScreenTimeMinutes = recordedDays.reduce((sum, d) => sum + d.screenTimeMinutes, 0);
  const screenHours = (totalScreenTimeMinutes / 60).toFixed(1);
  const totalScreenTimeHoursFormatted = `${screenHours} ساعة`;
  const averageDailyScreenMinutes = recordedDaysCount > 0 ? Math.round(totalScreenTimeMinutes / recordedDaysCount) : 0;

  const totalBlockedAttempts = recordedDays.reduce((sum, d) => sum + d.blockedAttempts, 0);
  const totalIstighfarCount = recordedDays.reduce((sum, d) => sum + d.istighfarCount, 0);

  const focusToScreenRatio = totalScreenTimeMinutes > 0 
    ? Math.min(100, Math.round((totalFocusMinutes / totalScreenTimeMinutes) * 100))
    : 0;

  // Split into 4 distinct weeks for multi-week comparison
  // Week 1 (oldest): days[0..6] (7 days)
  // Week 2: days[7..13] (7 days)
  // Week 3: days[14..20] (7 days)
  // Week 4 (current): days[21..29] (9 days)
  const weekChunks = [
    { label: 'الأسبوع 1', slice: days.slice(0, 7), key: 'week_1' },
    { label: 'الأسبوع 2', slice: days.slice(7, 14), key: 'week_2' },
    { label: 'الأسبوع 3', slice: days.slice(14, 21), key: 'week_3' },
    { label: 'الأسبوع 4 (الحالي)', slice: days.slice(21, 30), key: 'week_4' }
  ];

  const weeksComparison: WeekComparisonItem[] = weekChunks.map((chunk, index) => {
    const chunkDays = chunk.slice;
    const recordedChunkDays = chunkDays.filter(day => day.hasRecordedData);
    const count = recordedChunkDays.length;
    const confirmed = recordedChunkDays.reduce((sum, d) => sum + d.confirmedPrayers, 0);
    const possible = count * 5;
    const prayerPct = count > 0 ? Math.round((confirmed / possible) * 100) : null;
    const focusM = recordedChunkDays.reduce((sum, d) => sum + d.focusMinutes, 0);
    const focusH = Number((focusM / 60).toFixed(1));
    const focusSess = recordedChunkDays.reduce((sum, d) => sum + d.focusSessions, 0);
    const screenM = recordedChunkDays.reduce((sum, d) => sum + d.screenTimeMinutes, 0);
    const screenH = Number((screenM / 60).toFixed(1));
    const blocked = recordedChunkDays.reduce((sum, d) => sum + d.blockedAttempts, 0);
    const istighfar = recordedChunkDays.reduce((sum, d) => sum + d.istighfarCount, 0);

    const firstDate = chunkDays[0]?.formattedDate || '';
    const lastDate = recordedChunkDays[recordedChunkDays.length - 1]?.formattedDate || '';
    const dateRangeLabel = `${firstDate} - ${lastDate}`;

    // Productivity score (0-100)
    const pScore = count > 0 ? Math.min(100, Math.round(
      (prayerPct * 0.45) + 
      (Math.min(35, (focusM / Math.max(1, count * 45)) * 35)) +
      (Math.min(20, (istighfar / Math.max(1, count * 10)) * 20))
    )) : null;

    return {
      weekIndex: index + 1,
      weekKey: chunk.key,
      weekLabel: chunk.label,
      dateRangeLabel,
      recordedDaysCount: count,
      confirmedPrayers: confirmed,
      possiblePrayers: possible,
      prayerPercentage: prayerPct,
      focusMinutes: focusM,
      focusHours: focusH,
      focusHoursFormatted: `${focusH} س`,
      focusSessions: focusSess,
      screenTimeMinutes: screenM,
      screenHours: screenH,
      screenHoursFormatted: `${screenH} س`,
      blockedAttempts: blocked,
      istighfarCount: istighfar,
      productivityScore: pScore
    };
  });

  // Calculate Growth Trends between Week 3 and Week 4
  const w3 = weeksComparison[2];
  const w4 = weeksComparison[3];
  const prayerGrowthVsLastWeek = w3 && w3.recordedDaysCount > 0 && w4.recordedDaysCount > 0
    ? w4.prayerPercentage - w3.prayerPercentage
    : null;
  const focusGrowthVsLastWeek = w3 && w3.recordedDaysCount > 0 && w4.recordedDaysCount > 0 && w3.focusHours > 0
    ? Math.round(((w4.focusHours - w3.focusHours) / w3.focusHours) * 100)
    : null;

  // Monthly Score
  const prayerFactor = (prayerConsistencyPercentage / 100) * 50;
  const focusFactor = Math.min(30, (totalFocusMinutes / Math.max(1, recordedDaysCount * 45)) * 30);
  const istighfarFactor = Math.min(20, (totalIstighfarCount / Math.max(1, recordedDaysCount * 10)) * 20);
  const monthlyScore = recordedDaysCount > 0
    ? Math.min(100, Math.round(prayerFactor + focusFactor + istighfarFactor))
    : null;

  let monthlyGrade = 'حصن إيماني راسخ (ممتاز جداً)';
  let monthlyBadgeColor = 'emerald';
  let monthlyAdvice = 'ثباتك الشهري المتين على مدار 30 يوماً يعكس نضجاً روحياً رائعاً. استمر على هذا المنهاج وبارك الله في وقتك.';

  if (monthlyScore === null) {
    monthlyGrade = 'لا توجد بيانات مسجلة بعد';
    monthlyBadgeColor = 'slate';
    monthlyAdvice = 'ستظهر المؤشرات بعد تسجيل نشاط فعلي في التطبيق.';
  } else if (monthlyScore < 60) {
    monthlyGrade = 'تحديات شهرية تستدعي تجديد العزيمة';
    monthlyBadgeColor = 'amber';
    monthlyAdvice = 'الشهر مضى بدروس قيمة، ابدأ الشهر الجديد بجدول صارم للصلوات وجلسة تركيز واحدة يومياً صباحاً.';
  } else if (monthlyScore < 80) {
    monthlyGrade = 'أداء شهري متوازن ومتقدم (جيد جداً)';
    monthlyBadgeColor = 'teal';
    monthlyAdvice = 'معدلاتك على مدار الـ 30 يوماً جيدة جداً، مع نمو ملحوظ في الأسبوع الأخير. ركّز على زيادة دقائق الخشوع في الصلاة.';
  }

  return {
    days,
    weeksComparison,
    recordedDaysCount,
    elapsedDaysCount: days.length,
    totalConfirmedPrayers,
    totalPossiblePrayers,
    prayerConsistencyPercentage,
    totalFocusMinutes,
    totalFocusHoursFormatted,
    totalFocusSessions,
    averageDailyFocusMinutes,
    totalScreenTimeMinutes,
    totalScreenTimeHoursFormatted,
    averageDailyScreenMinutes,
    totalBlockedAttempts,
    totalIstighfarCount,
    focusToScreenRatio,
    monthlyScore,
    monthlyGrade,
    monthlyBadgeColor,
    monthlyAdvice,
    prayerGrowthVsLastWeek,
    focusGrowthVsLastWeek
  };
}

export interface HeatmapDayCell {
  dateStr: string;
  formattedDate: string;
  dayIndexInWeek: number; // 0=السبت .. 6=الجمعة
  dayName: string;
  monthName: string;
  monthIndex: number;
  confirmedPrayers: number;
  istighfarCount: number;
  focusMinutes: number;
  blockedAttempts: number;
  activityScore: number;
  intensityLevel: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  hasRecordedData: boolean;
  isFuture: boolean;
  isOutsideYear?: boolean;
  statusLabel: string;
}

export interface HeatmapMonthLabel {
  name: string;
  weekIndex: number;
}

export interface YearlyActivityHeatmapReport {
  year: number;
  totalActiveDays: number;
  totalEvaluatedDays: number;
  currentStreak: number;
  longestStreak: number;
  totalYearlyPrayers: number;
  totalYearlyIstighfar: number;
  totalYearlyFocusMinutes: number;
  totalYearlyFocusHoursFormatted: string;
  prayerAdherencePercentage: number;
  
  // 52/53 columns, each column has 7 items for Saturday -> Friday
  weeks: (HeatmapDayCell | null)[][];
  monthLabels: HeatmapMonthLabel[];
  dayLabels: string[];
}

/**
 * Generates calendar year activity heatmap data starting from January to December (52-53 weeks)
 * tracking prayer constancy, istighfar/adhkar, and focus momentum across the entire calendar year.
 */
export function getYearlyActivityHeatmap(
  todayStats: DailyStats,
  prayers: PrayerInfo[],
  filterMetric: 'all' | 'prayers' | 'istighfar' | 'focus' = 'all',
  targetYear?: number
): YearlyActivityHeatmapReport {
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const dayLabels = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  const history = getStoredStatsHistory();
  const todayStr = getLocalFormattedDate();
  const todayConfirmedPrayers = prayers.filter(p => p.id !== 'sunrise' && p.confirmed).length;
  const hasTodayMeasurements = todayConfirmedPrayers > 0 ||
    todayStats.browserTimeMinutes > 0 ||
    todayStats.focusMinutesTotal > 0 ||
    todayStats.focusSessionsCount > 0 ||
    todayStats.istighfarCount > 0 ||
    todayStats.remindersShown > 0;

  const today = new Date();
  const currentYear = targetYear || today.getFullYear();

  // Saturday-first index mapping (Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6)
  const mapJsDayToSatIndex = (d: number) => (d + 1) % 7;

  // Calendar year boundaries: Jan 1 to Dec 31
  const jan1 = new Date(currentYear, 0, 1);
  const dec31 = new Date(currentYear, 11, 31);

  // Find the Saturday on or before Jan 1st
  const startSatOffset = mapJsDayToSatIndex(jan1.getDay());
  const startDate = new Date(jan1);
  startDate.setDate(jan1.getDate() - startSatOffset);

  // Find the Friday on or after Dec 31st
  const endFriOffset = 6 - mapJsDayToSatIndex(dec31.getDay());
  const endDate = new Date(dec31);
  endDate.setDate(dec31.getDate() + endFriOffset);

  // Total days & weeks count
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const totalWeeksCount = Math.ceil(totalDays / 7);

  const weeks: (HeatmapDayCell | null)[][] = [];
  const monthLabels: HeatmapMonthLabel[] = [];

  let totalActiveDays = 0;
  let totalEvaluatedDays = 0;
  let totalYearlyPrayers = 0;
  let totalYearlyIstighfar = 0;
  let totalYearlyFocusMinutes = 0;

  let currentStreakCounter = 0;
  let maxStreakCounter = 0;
  let runningStreak = 0;

  const recordedMonths = new Set<number>();

  for (let w = 0; w < totalWeeksCount; w++) {
    const weekCol: (HeatmapDayCell | null)[] = [];

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const currentDayDate = new Date(startDate);
      currentDayDate.setDate(startDate.getDate() + (w * 7) + dayIdx);

      const yyyy = currentDayDate.getFullYear();
      const mm = String(currentDayDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDayDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isToday = dateStr === todayStr;
      const isFuture = currentDayDate.getTime() > today.getTime() && !isToday;
      const isOutsideYear = yyyy !== currentYear;

      const monthIndex = currentDayDate.getMonth();
      const monthName = arabicMonths[monthIndex];

      // Track Month Header for all 12 months (Jan -> Dec)
      if (!isOutsideYear && !recordedMonths.has(monthIndex)) {
        recordedMonths.add(monthIndex);
        monthLabels.push({ name: monthName, weekIndex: w });
      }

      if (isOutsideYear) {
        weekCol.push({
          dateStr,
          formattedDate: `${dd} ${monthName}`,
          dayIndexInWeek: dayIdx,
          dayName: dayLabels[dayIdx],
          monthName,
          monthIndex,
          confirmedPrayers: 0,
          istighfarCount: 0,
          focusMinutes: 0,
          blockedAttempts: 0,
          activityScore: 0,
          intensityLevel: 0,
          isToday: false,
          hasRecordedData: false,
          isFuture: false,
          isOutsideYear: true,
          statusLabel: 'خارج السنة الحالية'
        });
        continue;
      }

      if (isFuture) {
        weekCol.push({
          dateStr,
          formattedDate: `${dd} ${monthName}`,
          dayIndexInWeek: dayIdx,
          dayName: dayLabels[dayIdx],
          monthName,
          monthIndex,
          confirmedPrayers: 0,
          istighfarCount: 0,
          focusMinutes: 0,
          blockedAttempts: 0,
          activityScore: 0,
          intensityLevel: 0,
          isToday: false,
          hasRecordedData: false,
          isFuture: true,
          isOutsideYear: false,
          statusLabel: 'يوم قادم في العام'
        });
        continue;
      }

      const hasRecordedData = (isToday && hasTodayMeasurements) || Boolean(history[dateStr]);
      if (!hasRecordedData) {
        runningStreak = 0;
        weekCol.push({
          dateStr,
          formattedDate: `${dd} ${monthName}`,
          dayIndexInWeek: dayIdx,
          dayName: dayLabels[dayIdx],
          monthName,
          monthIndex,
          confirmedPrayers: 0,
          istighfarCount: 0,
          focusMinutes: 0,
          blockedAttempts: 0,
          activityScore: 0,
          intensityLevel: 0,
          isToday: false,
          hasRecordedData: false,
          isFuture: false,
          isOutsideYear: false,
          statusLabel: 'لا توجد بيانات مسجلة لهذا اليوم'
        });
        continue;
      }

      totalEvaluatedDays++;

      let confirmedPrayers = 0;
      let istighfar = 0;
      let focusMins = 0;
      let blockedCount = 0;

      if (isToday) {
        confirmedPrayers = todayConfirmedPrayers;
        istighfar = todayStats.istighfarCount || 0;
        focusMins = todayStats.focusMinutesTotal || 0;
        blockedCount = todayStats.blockedAttemptsCount || 0;
      } else {
        const rec = history[dateStr] || getEmptyPastDay(dateStr);
        confirmedPrayers = Math.min(5, rec.confirmedPrayers || 0);
        istighfar = rec.istighfarCount || 0;
        focusMins = rec.focusMinutesTotal || 0;
        blockedCount = rec.blockedAttemptsCount || 0;
      }

      totalYearlyPrayers += confirmedPrayers;
      totalYearlyIstighfar += istighfar;
      totalYearlyFocusMinutes += focusMins;

      // Activity Score (0 - 100)
      let score = 0;
      let intensity: 0 | 1 | 2 | 3 | 4 = 0;

      if (filterMetric === 'prayers') {
        score = (confirmedPrayers / 5) * 100;
        if (confirmedPrayers === 5) intensity = 4;
        else if (confirmedPrayers === 4) intensity = 3;
        else if (confirmedPrayers === 3) intensity = 2;
        else if (confirmedPrayers > 0) intensity = 1;
        else intensity = 0;
      } else if (filterMetric === 'istighfar') {
        score = Math.min(100, Math.round((istighfar / 50) * 100));
        if (istighfar >= 40) intensity = 4;
        else if (istighfar >= 25) intensity = 3;
        else if (istighfar >= 15) intensity = 2;
        else if (istighfar > 0) intensity = 1;
        else intensity = 0;
      } else if (filterMetric === 'focus') {
        score = Math.min(100, Math.round((focusMins / 60) * 100));
        if (focusMins >= 60) intensity = 4;
        else if (focusMins >= 45) intensity = 3;
        else if (focusMins >= 25) intensity = 2;
        else if (focusMins > 0) intensity = 1;
        else intensity = 0;
      } else {
        // 'all' composite
        const prayerPct = (confirmedPrayers / 5) * 55;
        const istighfarPct = Math.min(25, (istighfar / 35) * 25);
        const focusPct = Math.min(20, (focusMins / 45) * 20);
        score = Math.min(100, Math.round(prayerPct + istighfarPct + focusPct));

        if (score >= 85 || (confirmedPrayers === 5 && (istighfar >= 30 || focusMins >= 45))) {
          intensity = 4;
        } else if (score >= 65 || confirmedPrayers >= 4) {
          intensity = 3;
        } else if (score >= 40 || confirmedPrayers >= 3) {
          intensity = 2;
        } else if (score > 10 || confirmedPrayers > 0 || istighfar > 0) {
          intensity = 1;
        } else {
          intensity = 0;
        }
      }

      if (intensity > 0) {
        totalActiveDays++;
        runningStreak++;
        if (runningStreak > maxStreakCounter) {
          maxStreakCounter = runningStreak;
        }
      } else {
        runningStreak = 0;
      }

      let statusLabel = 'يوم هادئ';
      if (intensity === 4) statusLabel = 'يوم نوراني استثنائي 🌟 (5 صلوات + أذكار وتركيز)';
      else if (intensity === 3) statusLabel = 'ثبات عالٍ وإنجاز مبارك 🕌';
      else if (intensity === 2) statusLabel = 'محافظة طيبة ومستمرة ✨';
      else if (intensity === 1) statusLabel = 'بواكير طاعة وذكر 🌿';

      weekCol.push({
        dateStr,
        formattedDate: `${dd} ${monthName}`,
        dayIndexInWeek: dayIdx,
        dayName: dayLabels[dayIdx],
        monthName,
        monthIndex,
        confirmedPrayers,
        istighfarCount: istighfar,
        focusMinutes: focusMins,
        blockedAttempts: blockedCount,
        activityScore: score,
        intensityLevel: intensity,
        isToday,
        hasRecordedData: true,
        isFuture: false,
        isOutsideYear: false,
        statusLabel
      });
    }

    weeks.push(weekCol);
  }

  currentStreakCounter = runningStreak;
  const longestStreak = maxStreakCounter;
  const prayerAdherencePercentage = totalEvaluatedDays > 0 
    ? Math.round((totalYearlyPrayers / (totalEvaluatedDays * 5)) * 100) 
    : 0;
  const totalHours = (totalYearlyFocusMinutes / 60).toFixed(1);

  return {
    year: currentYear,
    totalActiveDays,
    totalEvaluatedDays,
    currentStreak: currentStreakCounter,
    longestStreak,
    totalYearlyPrayers,
    totalYearlyIstighfar,
    totalYearlyFocusMinutes,
    totalYearlyFocusHoursFormatted: `${totalHours} ساعة`,
    prayerAdherencePercentage,
    weeks,
    monthLabels,
    dayLabels
  };
}
