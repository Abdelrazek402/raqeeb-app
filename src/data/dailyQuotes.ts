export interface DailySpiritualQuote {
  id: string;
  type: 'ayah' | 'hadith';
  category: 'habit' | 'reminder' | 'advice';
  categoryLabel: string;
  quote: string;
  source: string;
  explanation: string;
}

export const DAILY_SPIRITUAL_QUOTES: DailySpiritualQuote[] = [
  {
    id: 'quote-1',
    type: 'ayah',
    category: 'reminder',
    categoryLabel: 'تنبيه ومراقبة',
    quote: '«مَا يَلْفِظُ مِن قَوْلٍ إِلَّا لَدَيْهِ رَقِيبٌ عَتِيدٌ»',
    source: 'سورة ق: 18',
    explanation: 'تذكر أن كل كلمة ونقرة مسجلة في صحيفتك، فاجعل شاشتك شاهدة لك لا عليك.'
  },
  {
    id: 'quote-2',
    type: 'hadith',
    category: 'advice',
    categoryLabel: 'نصيحة وتثبيت',
    quote: '«وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا»',
    source: 'جامع الترمذي',
    explanation: 'مهما كانت زلات الأمس، اليوم فرصة جديدة للمسح والبدء من جديد بقلب نقي.'
  },
  {
    id: 'quote-3',
    type: 'ayah',
    category: 'reminder',
    categoryLabel: 'حفظ البصر',
    quote: '«يَعْلَمُ خَائِنَةَ الْأَعْيُنِ وَمَا تُخْفِي الصُّدُورُ»',
    source: 'سورة غافر: 19',
    explanation: 'الله يرى التفاتة عينك قبل أن يراها الخلق، فاستحِ من نظره إليك.'
  },
  {
    id: 'quote-4',
    type: 'hadith',
    category: 'reminder',
    categoryLabel: 'تنبيه ومراقبة',
    quote: '«احْفَظِ اللَّهَ يَحْفَظْكَ، احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ»',
    source: 'سنن الترمذي',
    explanation: 'حين تحفظ حدود الله في خلوتك وأمام جهازك، يتكفل الله بحفظك وتوفيقك.'
  },
  {
    id: 'quote-5',
    type: 'ayah',
    category: 'habit',
    categoryLabel: 'عادة إيمانية',
    quote: '«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»',
    source: 'سورة الرعد: 28',
    explanation: 'إذا أحسست بضيق أو تشتت رقمي، فاجعل لسانك رطباً بذكر الله يهدأ فؤادك.'
  },
  {
    id: 'quote-6',
    type: 'ayah',
    category: 'reminder',
    categoryLabel: 'معية الله',
    quote: '«وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ»',
    source: 'سورة الحديد: 4',
    explanation: 'أنت لست وحدك في غرفتك أو خلف شاشتك؛ معية الله تحيط بك وترعاك.'
  },
  {
    id: 'quote-7',
    type: 'ayah',
    category: 'advice',
    categoryLabel: 'مجاهدة وثبات',
    quote: '«وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا»',
    source: 'سورة العنكبوت: 69',
    explanation: 'كل ثانية تصبر فيها وتكبح جماح نفسك تؤهلك لنور وهداية خاصة من الله.'
  },
  {
    id: 'quote-8',
    type: 'hadith',
    category: 'habit',
    categoryLabel: 'استثمار الوقت',
    quote: '«نِعْمَتَانِ مَغْبُونٌ فِيهِمَا كَثِيرٌ مِنَ النَّاسِ: الصِّحَّةُ وَالفَرَاغُ»',
    source: 'صحيح البخاري',
    explanation: 'الوقت هو رأس مالك الحقيقي؛ لا تدع السوشيال ميديا تسرق ساعات عمرك.'
  },
  {
    id: 'quote-9',
    type: 'ayah',
    category: 'reminder',
    categoryLabel: 'حفظ البصر',
    quote: '«قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ وَيَحْفَظُوا فُرُوجَهُمْ»',
    source: 'سورة النور: 30',
    explanation: 'غض البصر يورث حلاوة في القلب ونوراً في الوجه وفراسة في العقل.'
  },
  {
    id: 'quote-10',
    type: 'hadith',
    category: 'habit',
    categoryLabel: 'خير الأعمال',
    quote: '«أَحَبُّ الأَعْمَالِ إِلَى اللهِ أَدْوَمُهَا وَإِنْ قَلَّ»',
    source: 'صحيح مسلم',
    explanation: 'صفحة قرآن واحدة و10 دقائق تركيز يومياً أعظم أثراً من حماس منقطع.'
  },
  {
    id: 'quote-11',
    type: 'ayah',
    category: 'advice',
    categoryLabel: 'رحمة وتوبة',
    quote: '«قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ»',
    source: 'سورة الزمر: 53',
    explanation: 'باب التوبة مفتوح على مصراعيه؛ انفض غبار اليأس وعُد إلى مولاك الآن.'
  },
  {
    id: 'quote-12',
    type: 'hadith',
    category: 'advice',
    categoryLabel: 'إصلاح النية',
    quote: '«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى»',
    source: 'متفق عليه',
    explanation: 'اجعل فتحك للحاسوب أو الهاتف مقروناً بنية صالحة تبتغي بها وجه الله.'
  },
  {
    id: 'quote-13',
    type: 'ayah',
    category: 'reminder',
    categoryLabel: 'استشعار المراقبة',
    quote: '«أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَىٰ»',
    source: 'سورة العلق: 14',
    explanation: 'آية تهز الوجدان وتوقظ الغافل حين تهم به المعصية في السر.'
  },
  {
    id: 'quote-14',
    type: 'hadith',
    category: 'habit',
    categoryLabel: 'عمارة الوقت',
    quote: '«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»',
    source: 'صحيح البخاري',
    explanation: 'لا يمرن عليك يوم دون أن تنهل من كتاب ربك وتتلو آياته بتدبر.'
  }
];

export function getTodaySpiritualQuote(): DailySpiritualQuote {
  const now = new Date();
  // Generate consistent day-of-year index
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = Math.abs(dayOfYear) % DAILY_SPIRITUAL_QUOTES.length;
  return DAILY_SPIRITUAL_QUOTES[index];
}
