import { PrayerInfo, PrayerLogItem } from '../types';
import { loadStored, saveStored, STORAGE_KEYS } from '../utils/storage';
import { formatTimeArabic } from '../utils/prayerTimes';

export function getPrayerDateTime(timeHHMM: string, baseDate: Date = new Date()): Date {
  const [h, m] = timeHHMM.split(':').map(Number);
  const pDate = new Date(baseDate);
  pDate.setHours(h, m, 0, 0);
  return pDate;
}

export function checkCanConfirmPrayer(
  prayer: PrayerInfo,
  now: Date = new Date()
): { allowed: boolean; reason?: string; prayerDate?: Date } {
  if (prayer.id === 'sunrise') {
    return { allowed: false, reason: 'الشروق هو وقت كراهة للصلاة المفروضة.' };
  }

  const prayerDate = getPrayerDateTime(prayer.time, now);
  
  // Allow a 2-minute margin for slight clock differences, but block if earlier
  if (now.getTime() < prayerDate.getTime() - 2 * 60 * 1000) {
    const formatted = formatTimeArabic(prayer.time);
    return {
      allowed: false,
      reason: `لم يحن موعد صلاة ${prayer.nameAr} بعد! موعد الأذان: (${formatted}). اصبر واستعد بوضوئك وتهيأ لصلاتك في وقتها. 🕌`
    };
  }

  return { allowed: true, prayerDate };
}

export function getNextObligatoryPrayer(
  currentPrayerId: string,
  prayers: PrayerInfo[],
  baseDate: Date = new Date()
): { nextPrayer?: PrayerInfo; nextPrayerDate?: Date } {
  const obligatories = prayers.filter(p => p.id !== 'sunrise');
  const currentIndex = obligatories.findIndex(p => p.id === currentPrayerId);

  if (currentIndex === -1) return {};

  if (currentIndex < obligatories.length - 1) {
    const nextP = obligatories[currentIndex + 1];
    const nextDate = getPrayerDateTime(nextP.time, baseDate);
    return { nextPrayer: nextP, nextPrayerDate: nextDate };
  } else {
    // Current is Isha -> next is Fajr tomorrow
    const fajr = obligatories[0];
    const fajrTomorrow = getPrayerDateTime(fajr.time, baseDate);
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
    return { nextPrayer: fajr, nextPrayerDate: fajrTomorrow };
  }
}

export function checkIsDelayedAfterNextPrayer(
  currentPrayerId: string,
  prayers: PrayerInfo[],
  now: Date = new Date()
): { isDelayed: boolean; nextPrayerName?: string; nextPrayerTimeFormatted?: string } {
  const { nextPrayer, nextPrayerDate } = getNextObligatoryPrayer(currentPrayerId, prayers, now);

  if (nextPrayer && nextPrayerDate && now.getTime() >= nextPrayerDate.getTime()) {
    return {
      isDelayed: true,
      nextPrayerName: nextPrayer.nameAr,
      nextPrayerTimeFormatted: formatTimeArabic(nextPrayer.time)
    };
  }

  return { isDelayed: false };
}

export function generatePrayerFeedbackMessage(
  delayMinutes: number,
  isDelayedAfterNext: boolean,
  justification?: 'travel_combined' | 'excuse_valid' | 'none_world_distraction',
  isMosque: boolean = false
): string {
  let baseMsg = '';

  if (isDelayedAfterNext) {
    if (justification === 'travel_combined') {
      baseMsg = 'تقبل الله منك! الرخصة للمسافر من رحمة الله ويسره. أتم الله سفرك وحفظك. ✈️';
    } else if (justification === 'excuse_valid') {
      baseMsg = 'تقبل الله صلاتك وعفا عنك. «رُفِع عن أمّتي الخطأُ والنّسيان وما استُكرهوا عليه». 🤲';
    } else {
      baseMsg = 'يا حبيب، لماذا ضيعت منك الخير والبركة في أول الوقت؟ 😔 الصلاة كانت على المؤمنين كتاباً موقوتاً. لا تجعل الدنيا تأخذك من موعدك مع الله، واستغفر الله ونافس نفسك لتصلي الصلاة القادمة فور الأذان!';
    }
  } else {
    if (delayMinutes <= 15) {
      baseMsg = 'ما شاء الله! أديت الصلاة في أول وقتها وفي معية الله. «أحب الأعمال إلى الله الصلاة على وقتها». 🌟';
    } else if (delayMinutes <= 45) {
      baseMsg = 'تقبل الله طاعتك! حاول في المرة القادمة الإسراع فور إعلان الأذان لتدرك تكبيرة الإحرام وثواب الجماعة 🕌';
    } else {
      baseMsg = 'تأخرت قليلاً يا غالي.. الصلاة أولى من كل مشاغل الدنيا! اجعل الأذان إشارة التوقف الفورية لك ⏱️';
    }
  }

  if (isMosque) {
    baseMsg += ' • 🕌 «صلاة الجماعة تفضل صلاة الفذ بسبع وعشرين درجة» [متفق عليه] هنيئاً لك خطوات المسجد!';
  } else {
    baseMsg += ' • 💡 تذكر: الخطوة إلى المسجد ترفعك درجة وتحط عنك خطيئة، احرص عليها في الصلاة القادمة!';
  }

  return baseMsg;
}

export function getStoredPrayerLogs(): PrayerLogItem[] {
  return loadStored<PrayerLogItem[]>(STORAGE_KEYS.PRAYER_LOGS, []);
}

export function savePrayerLogItem(logItem: PrayerLogItem): PrayerLogItem[] {
  const currentLogs = getStoredPrayerLogs();
  // Filter out any existing log for the same prayer on the same date (replacement update)
  const filtered = currentLogs.filter(
    l => !(l.dateStr === logItem.dateStr && l.prayerId === logItem.prayerId)
  );
  const updated = [logItem, ...filtered].slice(0, 100); // keep max 100 entries
  saveStored(STORAGE_KEYS.PRAYER_LOGS, updated);
  return updated;
}

export function savePrayerLog(logItem: PrayerLogItem): PrayerLogItem[] {
  return savePrayerLogItem(logItem);
}

export function saveWuduReminder(prayerName: string, minutes: number = 5) {
  const currentReminders = loadStored<any[]>(STORAGE_KEYS.WUDU_REMINDERS, []);
  const newReminder = {
    id: `wudu_${Date.now()}`,
    prayerName,
    createdAtISO: new Date().toISOString(),
    triggerAtISO: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
    snoozeMinutes: minutes,
    status: 'pending'
  };
  const updated = [newReminder, ...currentReminders].slice(0, 50);
  saveStored(STORAGE_KEYS.WUDU_REMINDERS, updated);
  return updated;
}

export function calculatePrayerLogStats(logs: PrayerLogItem[]) {
  if (logs.length === 0) {
    return {
      totalRecorded: 0,
      onTimePercentage: 100,
      avgDelayMinutes: 0,
      mosquePercentage: 0,
      delayedAfterNextCount: 0
    };
  }

  const total = logs.length;
  const onTimeCount = logs.filter(l => !l.isDelayedAfterNextPrayer && l.delayMinutes <= 30).length;
  const mosqueCount = logs.filter(l => l.isCongregationOrMosque).length;
  const delayedAfterNextCount = logs.filter(l => l.isDelayedAfterNextPrayer).length;
  const totalDelay = logs.reduce((acc, l) => acc + Math.max(0, l.delayMinutes), 0);

  return {
    totalRecorded: total,
    onTimePercentage: Math.round((onTimeCount / total) * 100),
    avgDelayMinutes: Math.round(totalDelay / total),
    mosquePercentage: Math.round((mosqueCount / total) * 100),
    delayedAfterNextCount
  };
}
