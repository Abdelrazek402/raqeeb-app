export interface SurahTafseerSummary {
  surahNumber: number;
  virtues: string;
  coreTheme: string;
  practicalReflection: string;
}

export const SURAHS_TAFSEER_BRIEF: Record<number, SurahTafseerSummary> = {
  1: {
    surahNumber: 1,
    virtues: 'أم الكتاب، والسبع المثاني، والشافية؛ لا تصح صلاة إلا بها.',
    coreTheme: 'إخلاص العبودية والاستعانة بالله وحده وطلب الهداية إلى الصراط المستقيم.',
    practicalReflection: 'حين تردد (إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ)، تبرأ من حولك وقوتك والتجئ لقوة الله التامة.'
  },
  2: {
    surahNumber: 2,
    virtues: 'سنام القرآن، أخذها بركة وتركها حسرة، ولا تستطيعها البطلة (السحرة)، وفيها أعظم آية: آية الكرسي.',
    coreTheme: 'الاستخلاف في الأرض وإقامة شرع الله والتحذير من مسالك بني إسرائيل والشيطان.',
    practicalReflection: '«وَٱتَّقُوا۟ يَوْمًا تُرْجَعُونَ فِيهِ إِلَى ٱللَّهِ»؛ استشعر موعد لقاء ربك ليصغر في عينك كل متاع زائل.'
  },
  3: {
    surahNumber: 3,
    virtues: 'إحدى الزهراوين، تحاجّ عن صاحبها يوم القيامة كغمامتين تظلانه.',
    coreTheme: 'الثبات على الإيمان في مواجهة الشبهات الفكرية والشهوات والفتن.',
    practicalReflection: '«رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا»؛ كرر هذا الدعاء يومياً فالثبات بيد مقلب القلوب.'
  },
  24: {
    surahNumber: 24,
    virtues: 'سورة العفاف والستر والنور، قال عمر رضي الله عنه: (علِّموا نساءَكم سورةَ النُّور).',
    coreTheme: 'حماية المجتمع المسلم من الفواحش، حفظ الأبصار والفروج، وآداب الاستئذان.',
    practicalReflection: '«قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ»؛ البصر سهم مسموم، وحفظه يورث حلاوة في القلب تجدها إلى يوم تلقاه.'
  },
  67: {
    surahNumber: 67,
    virtues: 'المانعة والمنجية من عذاب القبر، كان النبي ﷺ لا ينام حتى يقرأها.',
    coreTheme: 'استحضار عظمة ملك الله، وبداية الخلق والموت ليبلوكم أيكم أحسن عملاً.',
    practicalReflection: '«إِنَّ الَّذِينَ يَخْشَوْنَ رَبَّهُم بِالْغَيْبِ لَهُم مَّغْفِرَةٌ وَأَجْرٌ كَبِيرٌ»؛ خشيتك في خلوتك هي حقيقة إيمانك.'
  }
};

export function getSurahTafseer(surahNumber: number): SurahTafseerSummary {
  if (SURAHS_TAFSEER_BRIEF[surahNumber]) {
    return SURAHS_TAFSEER_BRIEF[surahNumber];
  }

  // Generalized reflection for any other Surah
  return {
    surahNumber,
    virtues: 'كلام الله المعجز الذي أنزل لهداية القلوب وشفاء الصدور والسكينة.',
    coreTheme: 'الدعوة لتوحيد الله وتدبر آياته الكونية والتشريعية والاستعداد لليوم الآخر.',
    practicalReflection: 'اقرأ الآيات بتؤدة، وقف عند آيات الرحمة فاسأل الله، وعند آيات العذاب فاستعذ به.'
  };
}
