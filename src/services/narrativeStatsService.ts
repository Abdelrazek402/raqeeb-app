import { DailyStats, NarrativeDailyReport } from '../types';

export function generateNarrativeReport(stats: DailyStats): NarrativeDailyReport {
  const { confirmedPrayers, istighfarCount, blockedAttemptsCount, quranPagesRead = 0, focusMinutesTotal } = stats;

  // High engagement
  if (confirmedPrayers >= 4 && istighfarCount >= 10) {
    return {
      tone: 'peaceful',
      openingTitle: 'الحمد لله.. يوم مشرق بالصلوات والذكر',
      narrativeBody: `قضيت اليوم في معية مباركة؛ حيث حافظت على أداء ${confirmedPrayers} صلوات، ورطبت لسانك بالاستغفار ${istighfarCount} مرة.${
        quranPagesRead > 0 ? ` وتلوت ${quranPagesRead} صفحات من كتاب الله.` : ''
      }${
        blockedAttemptsCount > 0 ? ` وقد صرف الله عنك ${blockedAttemptsCount} محاولات تشتت بفضل درع الحجب.` : ''
      } هذا الثبات علامة خير وتوفيق.`,
      spiritualFocus: 'شكر الله على نعمة التوفيق للاستقامة وسؤاله القبول.',
      suggestedAction: 'اختم يومك بركعتي قيام ليل خفيفتين ودعاء بظهر الغيب لمن تحب.'
    };
  }

  // Struggling but engaged
  if (blockedAttemptsCount > 3 || (confirmedPrayers < 3 && confirmedPrayers > 0)) {
    return {
      tone: 'steadfast',
      openingTitle: 'يوم مجاهدة وصبر.. وما كان ربك نسياً',
      narrativeBody: `مرت بك اليوم لحظات مجاهدة وتدافع، وقد صرف الدرع عنك ${blockedAttemptsCount} محاولات، وأكدت ${confirmedPrayers} صلوات. تذكر أن المجاهدة عبادة عظيمة، وأن الله لا ينظر إلى الكمال بل إلى صدق المحاولة وتكرار التوبة.`,
      spiritualFocus: 'تجديد العهد والعزم على عدم الركون للفتور أو الخلوة بالشاشات.',
      suggestedAction: 'توضأ الآن واقرأ صفحة من سورة البقرة أو الملك لتهدئة النفس.'
    };
  }

  // Balanced default
  return {
    tone: 'encouraging',
    openingTitle: '«وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا»',
    narrativeBody: `خطوة جديدة في يومك المبارك. كل استغفار (${istighfarCount}) وكل صلاة تؤديها هي بذرة نور تنمو في قلبك.${
      focusMinutesTotal > 0 ? ` أنجزت ${focusMinutesTotal} دقيقة من التركيز الواعي.` : ''
    } اجعل جهازك شاهداً لك لا عليك.`,
    spiritualFocus: 'استحضار النية الخالصة في كل نقرة ورسالة.',
    suggestedAction: 'ردد الآن: "سبحان الله وبحمده، أستغفر الله وأتوب إليه" 10 مرات.'
  };
}
