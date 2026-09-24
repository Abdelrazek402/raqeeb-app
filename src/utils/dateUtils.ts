export function getLocalFormattedDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const ARABIC_WEEKDAY_NAMES_FROM_SATURDAY = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة'
] as const;

export const ARABIC_MONTH_NAMES = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
] as const;

export interface DayPeriod {
  type: 'today';
  date: Date;
  dateStr: string;
  startTime: Date; // 00:00:00 (12:00 AM)
  endTime: Date;   // 23:59:59.999 (11:59 PM)
  label: string;   // "اليوم (من 12:00 ص حتى 11:59 م)"
  shortLabel: string;
  formattedDate: string;
}

export interface WeekDayItem {
  dayIndex: number; // 0 to 6 (0 = Saturday, 6 = Friday)
  nameAr: string;   // 'السبت' .. 'الجمعة'
  date: Date;
  dateStr: string;  // YYYY-MM-DD
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  dayOfMonth: number;
}

export interface WeekPeriod {
  type: 'week';
  startDate: Date;      // Saturday 00:00:00
  endDate: Date;        // Friday 23:59:59.999
  startDateStr: string; // YYYY-MM-DD
  endDateStr: string;   // YYYY-MM-DD
  startFormatted: string;
  endFormatted: string;
  label: string;        // "الأسبوع (من السبت إلى الجمعة)"
  shortLabel: string;
  days: WeekDayItem[];  // Exactly 7 days in order: Saturday to Friday
  elapsedDaysCount: number; // How many days up to today have elapsed
}

export interface MonthPeriod {
  type: 'month';
  year: number;
  monthIndex: number;   // 0-11
  monthNameAr: string;  // 'سبتمبر', etc.
  startDate: Date;      // Day 1 at 00:00:00
  endDate: Date;        // Day 28/29/30/31 at 23:59:59.999
  totalDays: number;    // 28, 29, 30, or 31
  currentDayNum: number;
  startDateStr: string;
  endDateStr: string;
  label: string;        // "الشهر (من يوم 1 حتى 31/30)"
  shortLabel: string;
  elapsedDaysCount: number;
}

/**
 * Returns exact Day Period:
 * Starts at 12:00:00 AM (00:00:00) and ends at 11:59:59 PM (23:59:59.999).
 */
export function getDayPeriod(refDate: Date = new Date()): DayPeriod {
  const d = new Date(refDate);
  const startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const dateStr = getLocalFormattedDate(d);

  const formattedDate = d.toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return {
    type: 'today',
    date: d,
    dateStr,
    startTime,
    endTime,
    label: `اليوم (من الساعة 12:00 ص حتى 11:59 م)`,
    shortLabel: `اليوم (${formattedDate})`,
    formattedDate
  };
}

/**
 * Returns exact Week Period:
 * Strictly starts on Saturday at 12:00:00 AM (00:00:00)
 * and ends on Friday at 11:59:59 PM (23:59:59.999).
 */
export function getWeekPeriod(refDate: Date = new Date()): WeekPeriod {
  const d = new Date(refDate);
  const dayOfWeek = d.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
  
  // Days since last Saturday:
  // Sat(6) => 0
  // Sun(0) => 1
  // Mon(1) => 2
  // Tue(2) => 3
  // Wed(3) => 4
  // Thu(4) => 5
  // Fri(5) => 6
  const daysSinceSaturday = (dayOfWeek + 1) % 7;

  const startDate = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() - daysSinceSaturday,
    0, 0, 0, 0
  );

  const endDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate() + 6,
    23, 59, 59, 999
  );

  const todayStr = getLocalFormattedDate(d);
  let elapsedDaysCount = 0;

  const days: WeekDayItem[] = ARABIC_WEEKDAY_NAMES_FROM_SATURDAY.map((nameAr, idx) => {
    const dayDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + idx,
      12, 0, 0, 0
    );
    const dateStr = getLocalFormattedDate(dayDate);
    const isToday = dateStr === todayStr;
    const isPast = idx < daysSinceSaturday;
    const isFuture = idx > daysSinceSaturday;

    if (idx <= daysSinceSaturday) {
      elapsedDaysCount++;
    }

    return {
      dayIndex: idx,
      nameAr,
      date: dayDate,
      dateStr,
      isToday,
      isPast,
      isFuture,
      dayOfMonth: dayDate.getDate()
    };
  });

  const startFormatted = startDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  const endFormatted = endDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });

  return {
    type: 'week',
    startDate,
    endDate,
    startDateStr: getLocalFormattedDate(startDate),
    endDateStr: getLocalFormattedDate(endDate),
    startFormatted,
    endFormatted,
    label: `الأسبوع الحالي (من السبت ${startFormatted} حتى الجمعة ${endFormatted})`,
    shortLabel: `الأسبوع (السبت - الجمعة)`,
    days,
    elapsedDaysCount
  };
}

/**
 * Returns exact Month Period:
 * Starts on day 1 (01) at 12:00:00 AM (00:00:00)
 * and ends on the last day of the month (28, 29, 30, or 31) at 11:59:59 PM (23:59:59.999).
 */
export function getMonthPeriod(refDate: Date = new Date()): MonthPeriod {
  const d = new Date(refDate);
  const year = d.getFullYear();
  const monthIndex = d.getMonth();
  const currentDayNum = d.getDate();

  const startDate = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const totalDays = new Date(year, monthIndex + 1, 0).getDate(); // 28, 29, 30, or 31
  const endDate = new Date(year, monthIndex, totalDays, 23, 59, 59, 999);

  const monthNameAr = ARABIC_MONTH_NAMES[monthIndex] || d.toLocaleDateString('ar-EG', { month: 'long' });

  return {
    type: 'month',
    year,
    monthIndex,
    monthNameAr,
    startDate,
    endDate,
    totalDays,
    currentDayNum,
    startDateStr: getLocalFormattedDate(startDate),
    endDateStr: getLocalFormattedDate(endDate),
    label: `شهر ${monthNameAr} (من يوم 1 حتى يوم ${totalDays} ${monthNameAr})`,
    shortLabel: `الشهر (يوم 1 - ${totalDays})`,
    elapsedDaysCount: currentDayNum
  };
}

