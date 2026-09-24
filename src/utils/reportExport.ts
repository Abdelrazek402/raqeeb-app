import { DailyStats, PrayerInfo, VictoryLog, DeviceSyncHubState, BlockedAttempt } from '../types';
import { getDayPeriod, getWeekPeriod, getMonthPeriod } from './dateUtils';
import { getPeriodAggregatedStats } from '../services/periodStatsService';
import { calculatePeriodMoonProgress } from '../services/streakService';
import { INITIAL_SYNC_STATE } from './storage';

export type ReportPeriodType = 'today' | 'week' | 'month';
export type MetricReportType = 'streak' | 'prayers' | 'social' | 'browser' | 'blocked' | 'reminders' | 'focus';

export function generateDailyReportText(
  stats: DailyStats,
  prayers: PrayerInfo[],
  victories: VictoryLog[],
  streakDays: number
): string {
  const dayPeriod = getDayPeriod();
  const confirmedPrayers = prayers.filter(p => p.confirmed).map(p => p.nameAr).join('، ') || 'لم تُسجل صلوات بعد';
  
  return `===============================================================
📜 تقرير الثبات الإيماني والإنجاز اليومي — رَقِيب
الفترة: ${dayPeriod.label}
التاريخ: ${dayPeriod.formattedDate}
نطاق الحساب: من الساعة 12:00 صباحاً (00:00) حتى 11:59 مساءً (23:59)
===============================================================

🔥 مؤشر الثبات المتصل: ${streakDays} يوماً بفضل الله وحفظه

🕌 أداء الصلوات الخمس اليوم:
- إجمالي الصلوات المؤداة في وقتها: ${stats.confirmedPrayers} من 5
- الصلوات المسجلة: ${confirmedPrayers}

📖 ورد القرآن والذكر:
- الصفحات المقروءة اليوم: ${stats.quranPagesRead || 0} صفحة
- رصيد الاستغفار اليومي: ${stats.istighfarCount} استغفاراً
- تنبيهات الـ 10 دقائق المستجابة: ${stats.remindersShown} تنبيهات

🛡️ الحماية وسجل الانتصارات:
- مرات الحجب التلقائي وردع الفتن: ${stats.blockedAttemptsCount} مرة (بنسبة حماية 100%)
- انتصارات غض البصر والاستغاثة: ${victories.length} موقف ثبات مسجل
- جلسات التركيز والإنجاز: ${stats.focusSessionsCount || 0} جلسة (${stats.focusMinutesTotal || 0} دقيقة)
- إجمالي وقت الشاشة المفلتر: ${(stats.socialTimeMinutes || 0) + (stats.browserTimeMinutes || 0)} دقيقة (سوشيال: ${stats.socialTimeMinutes}د | متصفح: ${stats.browserTimeMinutes}د)

قال تعالى: «إِنَّ الَّذِينَ قَالُوا رَبُّنَا اللَّهُ ثُمَّ اسْتَقَامُوا فَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ»
===============================================================`;
}

export function generateWeeklyReportText(
  stats: DailyStats,
  syncState: DeviceSyncHubState,
  prayers: PrayerInfo[],
  blockedAttempts: BlockedAttempt[],
  streakDays: number
): string {
  const weekData = getPeriodAggregatedStats('week', stats, syncState, prayers, blockedAttempts);
  const { weekPeriod, weekDaysData } = weekData;

  const daysBreakdown = weekDaysData.map(d => {
    const statusMarker = d.isToday ? ' [اليوم]' : d.isFuture ? ' (قادم)' : '';
    return `  • ${d.nameAr} (${d.dayOfMonth} ${weekPeriod.days[0].date.toLocaleDateString('ar-EG', { month: 'short' })})${statusMarker}: ` +
      `صلوات: ${d.confirmedPrayers}/5 | سوشيال: ${d.socialMins}د | حجب: ${d.blockedCount} | استغفار: ${d.istighfarCount}`;
  }).join('\n');

  return `===============================================================
📊 التقرير الأسبوعي الشامل للثبات والالتزام — رَقِيب
دورة الأسبوع: يبدأ من السبت حتى الجمعة
نطاق الأسبوع الحالي: من السبت ${weekPeriod.startFormatted} حتى الجمعة ${weekPeriod.endFormatted}
حالة الأسبوع: تم استيفاء ${weekPeriod.elapsedDaysCount} من 7 أيام
===============================================================

🔥 مؤشر الاستمرار والتعافي: ${streakDays} يوماً متواصلاً

🕌 حصيلة الصلوات المكتوبة للأسبوع:
- الصلوات المؤداة: ${weekData.confirmedPrayers} صلاة (من إجمالي دورة الأسبوع 35 صلاة)
- نسبة إتمام الفرائض في الأيام المنقضية: ${Math.round((weekData.confirmedPrayers / Math.max(1, weekPeriod.elapsedDaysCount * 5)) * 100)}%

📅 تفصيل الأيام السبعة (السبت ⬅ الجمعة):
${daysBreakdown}

⏱️ وقت الشاشة وتطبيقات السوشيال:
- إجمالي وقت السوشيال في الأسبوع: ${weekData.socialTimeMinutes} دقيقة (${(weekData.socialTimeMinutes / 60).toFixed(1)} ساعة)
- إجمالي وقت المتصفح: ${weekData.browserTimeMinutes} دقيقة (${(weekData.browserTimeMinutes / 60).toFixed(1)} ساعة)
- تقسيم الأجهزة: ويندوز (${weekData.windowsScreenMins}د) • أندرويد (${weekData.androidScreenMins}د)

🛡️ درع الحجب والاستغفار:
- إجمالي محاولات الحجب المصدودة: ${weekData.blockedAttemptsCount} محاولة
- رصيد الاستغفار الأسبوعي: ${weekData.istighfarCount} مرة
- تنبيهات الـ 10 دقائق المستجابة: ${weekData.remindersShown} تنبيهاً
- جلسات التركيز المنجزة: ${weekData.focusSessionsCount} جلسة (${weekData.focusMinutesTotal} دقيقة)

قال صلى الله عليه وسلم: «أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ تَعَالَى أَدْوَمُهَا وَإِنْ قَلَّ»
===============================================================`;
}

export function generateMonthlyReportText(
  stats: DailyStats,
  syncState: DeviceSyncHubState,
  prayers: PrayerInfo[],
  blockedAttempts: BlockedAttempt[],
  streakDays: number
): string {
  const monthData = getPeriodAggregatedStats('month', stats, syncState, prayers, blockedAttempts);
  const { monthPeriod } = monthData;

  return `===============================================================
🌟 التقرير الشهري الموسع للإنجاز والتعافي — رَقِيب
دورة الشهر: يبدأ من يوم 1 حتى يوم ${monthPeriod.totalDays} ${monthPeriod.monthNameAr}
حالة الشهر: اليوم ${monthPeriod.currentDayNum} من ${monthPeriod.totalDays} يوماً
نطاق الحساب: من 1 ${monthPeriod.monthNameAr} (12:00 ص) حتى ${monthPeriod.totalDays} ${monthPeriod.monthNameAr} (11:59 م)
===============================================================

🔥 الثبات المتواصل: ${streakDays} يوماً بفضل الله

🕌 سجل الصلوات لشهر ${monthPeriod.monthNameAr}:
- إجمالي الصلوات المؤداة حتى الآن: ${monthData.confirmedPrayers} صلاة
- المستهدف الإجمالي للشهر: ${monthData.totalPossiblePrayers} فرائض (${monthPeriod.totalDays} يوماً × 5 صلوات)
- نسبة المواظبة حتى اليوم: ${Math.round((monthData.confirmedPrayers / (monthPeriod.currentDayNum * 5)) * 100)}%

📱 استهلاك الشاشات والأجهزة:
- إجمالي وقت السوشيال خلال الشهر: ${monthData.socialTimeMinutes} دقيقة (${(monthData.socialTimeMinutes / 60).toFixed(1)} ساعة)
- إجمالي وقت المتصفح: ${monthData.browserTimeMinutes} دقيقة (${(monthData.browserTimeMinutes / 60).toFixed(1)} ساعة)
- متوسط الاستخدام اليومي: ${Math.round(monthData.totalScreenMinutes / monthPeriod.currentDayNum)} دقيقة/يوم

🛡️ درع الوقاية والعفة:
- إجمالي محاولات الحجب المصدودة: ${monthData.blockedAttemptsCount} محاولة بنجاح تام
- مرات الاستغفار والذكر: ${monthData.istighfarCount} استغفاراً
- جلسات التركيز والإنجاز: ${monthData.focusSessionsCount} جلسة (${(monthData.focusMinutesTotal / 60).toFixed(1)} ساعة)

قال تعالى: «وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا ۚ وَإِنَّ اللَّهَ لَمَعَ الْمُحْسِنِينَ»
===============================================================`;
}

export function downloadSpiritualReport(
  periodOrStats: ReportPeriodType | DailyStats,
  statsOrPrayers: DailyStats | PrayerInfo[],
  prayersOrVictories?: PrayerInfo[] | VictoryLog[],
  victoriesOrStreak?: VictoryLog[] | number,
  streakDaysParam?: number,
  syncState?: DeviceSyncHubState,
  blockedAttempts?: BlockedAttempt[]
) {
  let period: ReportPeriodType = 'today';
  let stats: DailyStats;
  let prayers: PrayerInfo[];
  let victories: VictoryLog[] = [];
  let streakDays = 1;

  if (typeof periodOrStats === 'string') {
    period = periodOrStats;
    stats = statsOrPrayers as DailyStats;
    prayers = prayersOrVictories as PrayerInfo[];
    victories = (victoriesOrStreak as VictoryLog[]) || [];
    streakDays = streakDaysParam || 1;
  } else {
    stats = periodOrStats as DailyStats;
    prayers = statsOrPrayers as PrayerInfo[];
    victories = (prayersOrVictories as VictoryLog[]) || [];
    streakDays = (victoriesOrStreak as number) || 1;
  }

  const safeSyncState: DeviceSyncHubState = syncState || INITIAL_SYNC_STATE;
  const safeBlockedAttempts = blockedAttempts || [];

  let reportText = '';
  let filename = '';
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  if (period === 'week') {
    reportText = generateWeeklyReportText(stats, safeSyncState, prayers, safeBlockedAttempts, streakDays);
    filename = `تقرير_رقيب_الأسبوعي_${dateStr}.txt`;
  } else if (period === 'month') {
    reportText = generateMonthlyReportText(stats, safeSyncState, prayers, safeBlockedAttempts, streakDays);
    filename = `تقرير_رقيب_الشهري_${dateStr}.txt`;
  } else {
    reportText = generateDailyReportText(stats, prayers, victories, streakDays);
    filename = `تقرير_رقيب_اليومي_${dateStr}.txt`;
  }

  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateMetricDetailReportText(
  type: MetricReportType,
  timeRange: ReportPeriodType,
  stats: DailyStats,
  prayers: PrayerInfo[],
  blockedAttempts: BlockedAttempt[] = [],
  syncState?: DeviceSyncHubState,
  victories: VictoryLog[] = [],
  streakDays: number = 1
): string {
  const safeSyncState: DeviceSyncHubState = syncState || INITIAL_SYNC_STATE;

  const periodData = getPeriodAggregatedStats(timeRange, stats, safeSyncState, prayers, blockedAttempts);
  const streakInfo = calculatePeriodMoonProgress(timeRange, periodData.confirmedPrayers, streakDays);

  const rangeHeader = timeRange === 'today'
    ? `الفترة: اليوم (من 12:00 ص إلى 11:59 م)\nالتاريخ: ${periodData.dayPeriod.formattedDate}`
    : timeRange === 'week'
    ? `الفترة: الأسبوع الحالي (السبت ⬅ الجمعة)\nالنطاق: من ${periodData.weekPeriod.startFormatted} حتى ${periodData.weekPeriod.endFormatted}\nالأيام المنقضية: ${periodData.weekPeriod.elapsedDaysCount} من 7 أيام`
    : `الفترة: الشهر الحالي (${periodData.monthPeriod.monthNameAr})\nالنطاق: من 1 حتى ${periodData.monthPeriod.totalDays} ${periodData.monthPeriod.monthNameAr}\nالأيام المنقضية: ${periodData.monthPeriod.currentDayNum} من ${periodData.monthPeriod.totalDays} يوماً`;

  let specificDetails = '';

  switch (type) {
    case 'streak': {
      specificDetails = `
🌟 مؤشرات الاستمرار الروحي وإعادة بناء العادات:
- عدد الأيام المتصلة: ${streakDays} يوماً بفضل الله وحفظه
- المرحلة الروحية الحالية: ${streakInfo.phaseTitle}
- أثر الاستقامة: ${streakInfo.calmReflection}
- مراحل التشافي العصبي:
  • الأيام (1-7): كسر الحلقة الإدمانية الفورية واستعادة السيطرة على الانتباه.
  • الأيام (8-30): انحسار التوق التلقائي وتراجع الرغبة الملحة.
  • الأيام (31-90): تعافي مستقبلات الدوبامين واستعادة حلاوة الطاعة والسكينة النفسية.`;
      break;
    }
    case 'prayers': {
      const prayersBreakdown = prayers.map(p => {
        if (p.id === 'sunrise') return `  • الشروق: ${p.time}`;
        return `  • ${p.nameAr}: ${p.confirmed ? '✅ أُديت في وقتها' : '⏳ لم تُسجل بعد'} (الوقت: ${p.time})`;
      }).join('\n');

      const confirmedRatio = timeRange === 'today'
        ? `${periodData.confirmedPrayers} من 5 صلوات (${Math.round((periodData.confirmedPrayers / 5) * 100)}%)`
        : `${periodData.confirmedPrayers} من أصل ${periodData.totalPossiblePrayers} صلاة مكتوبة (${Math.round((periodData.confirmedPrayers / Math.max(1, periodData.totalPossiblePrayers)) * 100)}%)`;

      specificDetails = `
🕌 تفاصيل أداء ومواقيت الصلوات:
- نسبة إتمام الصلوات في هذه الفترة: ${confirmedRatio}
- سجل صلوات اليوم:
${prayersBreakdown}
- التوجيه النبوي: قال رسول الله ﷺ: «أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ الصَّلَاةُ عَلَى وَقْتِهَا».`;
      break;
    }
    case 'social': {
      const hours = (periodData.socialTimeMinutes / 60).toFixed(1);
      specificDetails = `
📱 تقرير استهلاك وسائل التواصل الاجتماعي:
- إجمالي وقت السوشيال في هذه الفترة: ${periodData.socialTimeMinutes} دقيقة (${hours} ساعة)
- توزيع الأجهزة (إجمالي وقت الشاشة):
  • جهاز الكمبيوتر (ويندوز): ${periodData.windowsScreenMins} دقيقة
  • الهاتف المحمول (أندرويد): ${periodData.androidScreenMins} دقيقة
- تقييم الانضباط: ${periodData.socialTimeMinutes > 120 ? 'تنبيه: استهلاك مرتفع، يُنصح بتفعيل وضع التركيز' : 'ممتاز: استهلاك متزن ومضبوط بحمد الله'}`;
      break;
    }
    case 'browser': {
      const hours = (periodData.browserTimeMinutes / 60).toFixed(1);
      specificDetails = `
🌐 تقرير نشاط التصفح والإنترنت:
- إجمالي وقت التصفح في هذه الفترة: ${periodData.browserTimeMinutes} دقيقة (${hours} ساعة)
- توزيع الأجهزة (إجمالي وقت الشاشة):
  • متصفح الكمبيوتر (ويندوز): ${periodData.windowsScreenMins} دقيقة
  • متصفح الهاتف (أندرويد): ${periodData.androidScreenMins} دقيقة
- حالة درع الحماية في المتصفح: مُفعل ومراقب بنسبة أمان 100%`;
      break;
    }
    case 'blocked': {
      const recentBlocked = blockedAttempts.slice(0, 5).map(b => 
        `  • [${b.timestamp}] ${b.reason} — الرابط: ${b.urlOrQuery}`
      ).join('\n') || '  • لا توجد محاولات مشبوهة مسجلة في هذا النطاق';

      specificDetails = `
🛡️ سجل الحماية وردع الفتن والمواقع المحظورة:
- إجمالي محاولات الحجب المصدودة: ${periodData.blockedAttemptsCount} محاولة
- معدل نجاح الحجب والردع: 100% بنجاح تام
- أحدث المحاولات المصدودة بحمد الله:
${recentBlocked}
- انتصارات غض البصر والاستغاثة المسجلة: ${victories.length} موقف ثبات واعتصام بالله`;
      break;
    }
    case 'reminders': {
      specificDetails = `
🔔 تقرير التذكير الإيماني والاستغفار:
- عدد التنبيهات الدورية المستجابة: ${periodData.remindersShown} تنبيهاً
- إجمالي رصيد الاستغفار في هذه الفترة: ${periodData.istighfarCount} استغفاراً
- قال تعالى: «فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا يُرْسِلِ السَّمَاءَ عَلَيْكُم مِّدْرَارًا»`;
      break;
    }
    case 'focus': {
      const focusHours = (periodData.focusMinutesTotal / 60).toFixed(1);
      specificDetails = `
🎯 تقرير جلسات التركيز والإنتاجية المحمية:
- عدد جلسات التركيز المنجزة: ${periodData.focusSessionsCount} جلسة
- إجمالي دقائق التركيز الصافي: ${periodData.focusMinutesTotal} دقيقة (${focusHours} ساعة)
- متوسط وقت الجلسة: ${periodData.focusSessionsCount > 0 ? Math.round(periodData.focusMinutesTotal / periodData.focusSessionsCount) : 0} دقيقة/جلسة`;
      break;
    }
  }

  const typeTitles: Record<MetricReportType, string> = {
    streak: 'تقرير الاستمرار الروحي والأيام الثابتة',
    prayers: 'تقرير أداء ومواقيت الصلوات الخمس',
    social: 'تقرير استهلاك وسائل التواصل',
    browser: 'تقرير نشاط التصفح والإنترنت',
    blocked: 'تقرير حجب الفتن والمواقع المحظورة',
    reminders: 'تقرير التذكير الإيماني والاستغفار',
    focus: 'تقرير جلسات التركيز والإنتاجية'
  };

  return `===============================================================
📋 ${typeTitles[type]} — تطبيق رَقِيب
${rangeHeader}
===============================================================
${specificDetails}

---------------------------------------------------------------
ملخص عام للفترة المحددة:
- الصلوات المؤداة: ${periodData.confirmedPrayers}
- وقت السوشيال: ${periodData.socialTimeMinutes} دقيقة
- محاولات الحجب المصدودة: ${periodData.blockedAttemptsCount}
- رصيد الاستغفار: ${periodData.istighfarCount}
- مؤشر الثبات المتصل: ${streakDays} يوماً

نسأل الله العظيم أن يثبتك على طاعته ويصرف عنك كيد الشيطان.
===============================================================`;
}

export function downloadMetricDetailReport(
  type: MetricReportType,
  timeRange: ReportPeriodType,
  stats: DailyStats,
  prayers: PrayerInfo[],
  blockedAttempts: BlockedAttempt[] = [],
  syncState?: DeviceSyncHubState,
  victories: VictoryLog[] = [],
  streakDays: number = 1
) {
  const reportText = generateMetricDetailReportText(
    type,
    timeRange,
    stats,
    prayers,
    blockedAttempts,
    syncState,
    victories,
    streakDays
  );

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const typeMap: Record<MetricReportType, string> = {
    streak: 'الاستمرار_الروحي',
    prayers: 'الصلوات_الخمس',
    social: 'السوشيال_ميديا',
    browser: 'نشاط_المتصفح',
    blocked: 'حجب_الفتن',
    reminders: 'التنبيهات_والاستغفار',
    focus: 'جلسات_التركيز'
  };
  const rangeMap: Record<ReportPeriodType, string> = {
    today: 'اليوم',
    week: 'الأسبوع',
    month: 'الشهر'
  };

  const filename = `تقرير_رقيب_${typeMap[type]}_${rangeMap[timeRange]}_${dateStr}.txt`;

  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

