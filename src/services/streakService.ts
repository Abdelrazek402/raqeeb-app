import { SpiritualStreakInfo, MoonPhase } from '../types';
import { loadStored, saveStored } from '../utils/storage';

const STORAGE_STREAK_KEY = 'raqeeb_spiritual_streak_v3';

export function calculateMoonPhase(days: number): { moonPhase: MoonPhase; phaseTitle: string; calmReflection: string } {
  if (days <= 0) {
    return {
      moonPhase: 'new_moon',
      phaseTitle: 'بداية المحاق (تجديد النية)',
      calmReflection: 'كل يوم جديد هو فرصة إلهية للبدء من جديد. لا تيأس من عثرات الأمس، فباب التوبة مفتوح في كل لحظة.'
    };
  }
  if (days <= 3) {
    return {
      moonPhase: 'waxing_crescent',
      phaseTitle: 'هلال البداية المبارك',
      calmReflection: 'نور خفيف وخطوة مباركة أولى. تذكر: «أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ».'
    };
  }
  if (days <= 7) {
    return {
      moonPhase: 'first_quarter',
      phaseTitle: 'التربيع الأول (رسوخ العادة)',
      calmReflection: 'مضى أسبوع وأنت تجاهد وتصلي وتذكر. ثبتك الله وبارك في صبرك، ها هو النور يزداد وضوحاً في قلبك.'
    };
  }
  if (days <= 14) {
    return {
      moonPhase: 'waxing_gibbous',
      phaseTitle: 'الأحدب المتزايد (قوة الثبات)',
      calmReflection: 'أسبوعان من الاستقامة والوعي. أصبحت العبادة سلوى لك لا عبئاً، وانكسرت شوكة التشتت تدريجياً.'
    };
  }
  return {
    moonPhase: 'full_moon',
    phaseTitle: 'بدر التمام (طهارة وسكينة)',
    calmReflection: 'ما شاء الله، اكتملت الدورة واستنار القلب بفضل الله ورحمته. اسأل الله الثبات وحسن الخاتمة.'
  };
}

export interface PeriodMoonProgress {
  periodType: 'today' | 'week' | 'month';
  currentValue: number;
  targetValue: number;
  fraction: number; // 0.0 to 1.0 for realistic SVG
  percentage: number; // 0 to 100
  phaseTitle: string;
  stageName: string;
  isFullMoon: boolean;
  calmReflection: string;
  unitLabel: string;
  badgeText: string;
}

export function calculatePeriodMoonProgress(
  period: 'today' | 'week' | 'month',
  confirmedPrayersToday: number,
  streakDays: number
): PeriodMoonProgress {
  if (period === 'today') {
    const targetValue = 5;
    const currentValue = Math.max(0, Math.min(5, confirmedPrayersToday));
    const fraction = currentValue / targetValue;
    const percentage = Math.round(fraction * 100);
    const isFullMoon = currentValue >= 5;

    let stageName = 'هلال';
    let phaseTitle = 'هلال البداية';
    let calmReflection = '';

    if (currentValue === 0) {
      stageName = 'محاق';
      phaseTitle = 'محاق اليوم (بانتظار الفجر)';
      calmReflection = 'يوم جديد يبدأ مع فجر جديد، استعن بالله وجدد نيتك.';
    } else if (currentValue === 1) {
      stageName = 'هلال';
      phaseTitle = 'هلال الفجر (1 من 5 صلوات)';
      calmReflection = 'خطوة أولى مضيئة في أول فرض من فروض اليوم، طوبى لمن صلى الفجر في وقته.';
    } else if (currentValue === 2) {
      stageName = 'هلال متزايد';
      phaseTitle = 'هلال متزايد (2 من 5 صلوات)';
      calmReflection = 'اثنان من خمسة، يستمر النور في الزيادة مع تتابع الصلاة والذكر.';
    } else if (currentValue === 3) {
      stageName = 'تربيع أول';
      phaseTitle = 'التربيع الأول (3 من 5 صلوات)';
      calmReflection = 'نصف اليوم انقضى بحفظ الله وطاعته، بقيت ركعات المساء ليكتمل النور.';
    } else if (currentValue === 4) {
      stageName = 'أحدب متزايد';
      phaseTitle = 'أحدب متزايد (4 من 5 صلوات)';
      calmReflection = 'أوشك نور اليوم على الاكتمال، صلاة العشاء تختم يومك بالسكينة والتمام.';
    } else {
      stageName = 'بدر التمام';
      phaseTitle = 'بدر التمام (صلوات اليوم مكتملة 5/5 🌟)';
      calmReflection = 'الحمد لله الذي بنعمته تتم الصالحات، اكتملت خمس صلوات وأشرق بدر يومك بالطهارة والسكينة.';
    }

    return {
      periodType: 'today',
      currentValue,
      targetValue,
      fraction,
      percentage,
      phaseTitle,
      stageName,
      isFullMoon,
      calmReflection,
      unitLabel: 'صلوات',
      badgeText: `${currentValue}/5 صلوات`
    };
  }

  if (period === 'week') {
    const targetValue = 7;
    const currentValue = Math.max(1, Math.min(7, streakDays));
    const fraction = currentValue / targetValue;
    const percentage = Math.round(fraction * 100);
    const isFullMoon = currentValue >= 7;

    let stageName = 'هلال';
    let phaseTitle = 'هلال الأسبوع';
    let calmReflection = '';

    if (currentValue <= 2) {
      stageName = 'هلال الأسبوع';
      phaseTitle = `هلال الأسبوع (${currentValue} من 7 أيام)`;
      calmReflection = 'بداية أسبوع مبارك، ثباتك في الأيام الأولى يؤسس لنور دائم.';
    } else if (currentValue <= 4) {
      stageName = 'تربيع الأسبوع';
      phaseTitle = `التربيع الأول (${currentValue} من 7 أيام)`;
      calmReflection = 'منتصف الأسبوع بثبات وعزيمة، قطع الشوط الأكبر يبشر باكتمال البدر.';
    } else if (currentValue < 7) {
      stageName = 'أحدب متزايد';
      phaseTitle = `أحدب متزايد (${currentValue} من 7 أيام)`;
      calmReflection = 'أيام قليلة تفصلك عن تمام أسبوع كامل من الطاعة والاستقامة.';
    } else {
      stageName = 'بدر التمام';
      phaseTitle = 'بدر الأسبوع التام (7 من 7 أيام إلتزام 🌟)';
      calmReflection = 'ما شاء الله تبارك الله، تم أسبوعك كاملاً بنور الطاعة وبدر الاستقامة التام.';
    }

    return {
      periodType: 'week',
      currentValue,
      targetValue,
      fraction,
      percentage,
      phaseTitle,
      stageName,
      isFullMoon,
      calmReflection,
      unitLabel: 'أيام',
      badgeText: `${currentValue}/7 أيام`
    };
  }

  // month
  const targetValue = 30;
  const currentValue = Math.max(1, Math.min(30, streakDays));
  const fraction = currentValue / targetValue;
  const percentage = Math.round(fraction * 100);
  const isFullMoon = currentValue >= 30;

  let stageName = 'هلال';
  let phaseTitle = 'هلال الشهر';
  let calmReflection = '';

  if (currentValue <= 7) {
    stageName = 'هلال الشهر الأول';
    phaseTitle = `هلال الشهر الأول (${currentValue} من 30 يوماً)`;
    calmReflection = 'أسبوعك الأول في رحاب الاستقامة، الهلال ينمو مع كل سجدة وغض بصر.';
  } else if (currentValue <= 14) {
    stageName = 'التربيع الأول للشهر';
    phaseTitle = `التربيع الأول للشهر (${currentValue} من 30 يوماً)`;
    calmReflection = 'اقتربت من نصف الشهر، الاستقامة أصبحت عادة والقلب يجد راحته في الطاعة.';
  } else if (currentValue <= 21) {
    stageName = 'أحدب متزايد';
    phaseTitle = `أحدب متزايد (${currentValue} من 30 يوماً)`;
    calmReflection = 'ثلثا الشهر انقضيا بسلام وثبات، النور يغمر الروح ومستقبلات الدوبامين تتعافى.';
  } else if (currentValue < 30) {
    stageName = 'قرب اكتمال البدر';
    phaseTitle = `قرب اكتمال البدر (${currentValue} من 30 يوماً)`;
    calmReflection = 'أيام معدودة لبلوغ ثلاثين يوماً كاملة من الطهارة، اصبر وصابر ورابط.';
  } else {
    stageName = 'بدر التمام';
    phaseTitle = 'بدر التمام الشهري (30 يوماً ثبات مكتمل 🌟)';
    calmReflection = 'أتممت 30 يوماً بفضل الله ورعايته، طهارة قلبية واستنارة روحية كبدر ليلة أربع عشرة.';
  }

  return {
    periodType: 'month',
    currentValue,
    targetValue,
    fraction,
    percentage,
    phaseTitle,
    stageName,
    isFullMoon,
    calmReflection,
    unitLabel: 'يوماً',
    badgeText: `${currentValue}/30 يوماً`
  };
}

export function getSpiritualStreak(): SpiritualStreakInfo {
  const defaultStreak: SpiritualStreakInfo = {
    consecutiveDays: 1,
    moonPhase: 'waxing_crescent',
    phaseTitle: 'هلال البداية المبارك',
    calmReflection: 'خطوة أولى في طريق الاستقامة الرقمية واليقظة القلبية.',
    lastActiveDate: new Date().toISOString().split('T')[0]
  };

  const stored = loadStored<SpiritualStreakInfo>(STORAGE_STREAK_KEY, defaultStreak);
  const today = new Date().toISOString().split('T')[0];

  // If last active was yesterday, streak continues. If today, it's current. If more than 1 day ago, recalculate gently.
  return stored;
}

export function updateSpiritualStreak(completedPrayersToday: number, quranPagesToday: number): SpiritualStreakInfo {
  const current = getSpiritualStreak();
  const today = new Date().toISOString().split('T')[0];

  if (current.lastActiveDate === today) {
    // Already updated today, return with calculated phase
    const phaseInfo = calculateMoonPhase(current.consecutiveDays);
    return {
      ...current,
      ...phaseInfo
    };
  }

  // Calculate day difference
  const lastDate = new Date(current.lastActiveDate);
  const nowDate = new Date(today);
  const diffDays = Math.round((nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  let newDays = current.consecutiveDays;
  if (diffDays === 1) {
    // Consecutive day
    if (completedPrayersToday >= 3 || quranPagesToday > 0) {
      newDays += 1;
    }
  } else if (diffDays > 1) {
    // Graceful continuation: instead of resetting to 0 brutally, preserve gentle momentum
    newDays = Math.max(1, Math.floor(current.consecutiveDays / 2));
  }

  const phaseInfo = calculateMoonPhase(newDays);
  const updated: SpiritualStreakInfo = {
    consecutiveDays: newDays,
    lastActiveDate: today,
    ...phaseInfo
  };

  saveStored(STORAGE_STREAK_KEY, updated);
  return updated;
}
