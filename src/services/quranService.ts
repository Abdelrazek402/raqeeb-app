import { QuranSurah, QuranAyah, QuranReciter, KhatmahState, QuranPageData, QuranBookmarkItem } from '../types';
import { loadStored, saveStored } from '../utils/storage';

export const RECITERS_LIST: QuranReciter[] = [
  {
    id: 'minshawi',
    nameAr: 'محمد صديق المنشاوي (المصحف المرتل)',
    nameEn: 'Mohamed Siddiq Al-Minshawi',
    serverUrl: 'https://server10.mp3quran.net/minsh',
    format: '128'
  },
  {
    id: 'husary',
    nameAr: 'محمود خليل الحصري (مرتل دقيق)',
    nameEn: 'Mahmoud Khalil Al-Husary',
    serverUrl: 'https://server13.mp3quran.net/husr',
    format: '128'
  },
  {
    id: 'afs',
    nameAr: 'مشاري بن راشد العفاسي',
    nameEn: 'Mishary Rashid Alafasy',
    serverUrl: 'https://server8.mp3quran.net/afs',
    format: '128'
  },
  {
    id: 'abdulbaset',
    nameAr: 'عبد الباسط عبد الصمد (مرتل)',
    nameEn: 'Abdul Basit Abdul Samad',
    serverUrl: 'https://server7.mp3quran.net/basit',
    format: '128'
  },
  {
    id: 'muaiqly',
    nameAr: 'ماهر المعيقلي (إمام الحرم)',
    nameEn: 'Maher Al-Muaiqly',
    serverUrl: 'https://server12.mp3quran.net/maher',
    format: '128'
  },
  {
    id: 'shatri',
    nameAr: 'أبو بكر الشاطري',
    nameEn: 'Abu Bakr Al-Shatri',
    serverUrl: 'https://server11.mp3quran.net/shatri',
    format: '128'
  }
];

// All 114 Surahs catalog with standard page indices
export const SURAHS_METADATA: QuranSurah[] = [
  { number: 1, name: "الفاتحة", englishName: "Al-Fatihah", englishNameTranslation: "The Opening", numberOfAyahs: 7, revelationType: "Meccan", pageNumber: 1 },
  { number: 2, name: "البقرة", englishName: "Al-Baqarah", englishNameTranslation: "The Cow", numberOfAyahs: 286, revelationType: "Medinan", pageNumber: 2 },
  { number: 3, name: "آل عمران", englishName: "Ali 'Imran", englishNameTranslation: "Family of Imran", numberOfAyahs: 200, revelationType: "Medinan", pageNumber: 50 },
  { number: 4, name: "النساء", englishName: "An-Nisa", englishNameTranslation: "The Women", numberOfAyahs: 176, revelationType: "Medinan", pageNumber: 77 },
  { number: 5, name: "المائدة", englishName: "Al-Ma'idah", englishNameTranslation: "The Table Spread", numberOfAyahs: 120, revelationType: "Medinan", pageNumber: 106 },
  { number: 6, name: "الأنعام", englishName: "Al-An'am", englishNameTranslation: "The Cattle", numberOfAyahs: 165, revelationType: "Meccan", pageNumber: 128 },
  { number: 7, name: "الأعراف", englishName: "Al-A'raf", englishNameTranslation: "The Heights", numberOfAyahs: 206, revelationType: "Meccan", pageNumber: 151 },
  { number: 8, name: "الأنفال", englishName: "Al-Anfal", englishNameTranslation: "The Spoils of War", numberOfAyahs: 75, revelationType: "Medinan", pageNumber: 177 },
  { number: 9, name: "التوبة", englishName: "At-Tawbah", englishNameTranslation: "The Repentance", numberOfAyahs: 129, revelationType: "Medinan", pageNumber: 187 },
  { number: 10, name: "يونس", englishName: "Yunus", englishNameTranslation: "Jonah", numberOfAyahs: 109, revelationType: "Meccan", pageNumber: 208 },
  { number: 11, name: "هود", englishName: "Hud", englishNameTranslation: "Hud", numberOfAyahs: 123, revelationType: "Meccan", pageNumber: 221 },
  { number: 12, name: "يوسف", englishName: "Yusuf", englishNameTranslation: "Joseph", numberOfAyahs: 111, revelationType: "Meccan", pageNumber: 235 },
  { number: 13, name: "الرعد", englishName: "Ar-Ra'd", englishNameTranslation: "The Thunder", numberOfAyahs: 43, revelationType: "Medinan", pageNumber: 249 },
  { number: 14, name: "إبراهيم", englishName: "Ibrahim", englishNameTranslation: "Abraham", numberOfAyahs: 52, revelationType: "Meccan", pageNumber: 255 },
  { number: 15, name: "الحجر", englishName: "Al-Hijr", englishNameTranslation: "The Rocky Tract", numberOfAyahs: 99, revelationType: "Meccan", pageNumber: 262 },
  { number: 16, name: "النحل", englishName: "An-Nahl", englishNameTranslation: "The Bee", numberOfAyahs: 128, revelationType: "Meccan", pageNumber: 267 },
  { number: 17, name: "الإسراء", englishName: "Al-Isra", englishNameTranslation: "The Night Journey", numberOfAyahs: 111, revelationType: "Meccan", pageNumber: 282 },
  { number: 18, name: "الكهف", englishName: "Al-Kahf", englishNameTranslation: "The Cave", numberOfAyahs: 110, revelationType: "Meccan", pageNumber: 293 },
  { number: 19, name: "مريم", englishName: "Maryam", englishNameTranslation: "Mary", numberOfAyahs: 98, revelationType: "Meccan", pageNumber: 305 },
  { number: 20, name: "طه", englishName: "Ta-Ha", englishNameTranslation: "Ta-Ha", numberOfAyahs: 135, revelationType: "Meccan", pageNumber: 312 },
  { number: 21, name: "الأنبياء", englishName: "Al-Anbiya", englishNameTranslation: "The Prophets", numberOfAyahs: 112, revelationType: "Meccan", pageNumber: 322 },
  { number: 22, name: "الحج", englishName: "Al-Hajj", englishNameTranslation: "The Pilgrimage", numberOfAyahs: 78, revelationType: "Medinan", pageNumber: 332 },
  { number: 23, name: "المؤمنون", englishName: "Al-Mu'minun", englishNameTranslation: "The Believers", numberOfAyahs: 118, revelationType: "Meccan", pageNumber: 342 },
  { number: 24, name: "النور", englishName: "An-Nur", englishNameTranslation: "The Light", numberOfAyahs: 64, revelationType: "Medinan", pageNumber: 350 },
  { number: 25, name: "الفرقان", englishName: "Al-Furqan", englishNameTranslation: "The Criterion", numberOfAyahs: 77, revelationType: "Meccan", pageNumber: 359 },
  { number: 26, name: "الشعراء", englishName: "Ash-Shu'ara", englishNameTranslation: "The Poets", numberOfAyahs: 227, revelationType: "Meccan", pageNumber: 367 },
  { number: 27, name: "النمل", englishName: "An-Naml", englishNameTranslation: "The Ant", numberOfAyahs: 93, revelationType: "Meccan", pageNumber: 377 },
  { number: 28, name: "القصص", englishName: "Al-Qasas", englishNameTranslation: "The Stories", numberOfAyahs: 88, revelationType: "Meccan", pageNumber: 385 },
  { number: 29, name: "العنكبوت", englishName: "Al-'Ankabut", englishNameTranslation: "The Spider", numberOfAyahs: 69, revelationType: "Meccan", pageNumber: 396 },
  { number: 30, name: "الروم", englishName: "Ar-Rum", englishNameTranslation: "The Romans", numberOfAyahs: 60, revelationType: "Meccan", pageNumber: 404 },
  { number: 31, name: "لقمان", englishName: "Luqman", englishNameTranslation: "Luqman", numberOfAyahs: 34, revelationType: "Meccan", pageNumber: 411 },
  { number: 32, name: "السجدة", englishName: "As-Sajdah", englishNameTranslation: "The Prostration", numberOfAyahs: 30, revelationType: "Meccan", pageNumber: 415 },
  { number: 33, name: "الأحزاب", englishName: "Al-Ahzab", englishNameTranslation: "The Combined Forces", numberOfAyahs: 73, revelationType: "Medinan", pageNumber: 418 },
  { number: 34, name: "سبأ", englishName: "Saba", englishNameTranslation: "Sheba", numberOfAyahs: 54, revelationType: "Meccan", pageNumber: 428 },
  { number: 35, name: "فاطر", englishName: "Fatir", englishNameTranslation: "Originator", numberOfAyahs: 45, revelationType: "Meccan", pageNumber: 434 },
  { number: 36, name: "يس", englishName: "Ya-Sin", englishNameTranslation: "Ya-Sin", numberOfAyahs: 83, revelationType: "Meccan", pageNumber: 440 },
  { number: 37, name: "الصافات", englishName: "As-Saffat", englishNameTranslation: "Those who set the Ranks", numberOfAyahs: 182, revelationType: "Meccan", pageNumber: 446 },
  { number: 38, name: "ص", englishName: "Sad", englishNameTranslation: "Sad", numberOfAyahs: 88, revelationType: "Meccan", pageNumber: 453 },
  { number: 39, name: "الزمر", englishName: "Az-Zumar", englishNameTranslation: "The Troops", numberOfAyahs: 75, revelationType: "Meccan", pageNumber: 458 },
  { number: 40, name: "غافر", englishName: "Ghafir", englishNameTranslation: "The Forgiver", numberOfAyahs: 85, revelationType: "Meccan", pageNumber: 467 },
  { number: 41, name: "فصلت", englishName: "Fussilat", englishNameTranslation: "Explained in Detail", numberOfAyahs: 54, revelationType: "Meccan", pageNumber: 477 },
  { number: 42, name: "الشورى", englishName: "Ash-Shura", englishNameTranslation: "The Consultation", numberOfAyahs: 53, revelationType: "Meccan", pageNumber: 483 },
  { number: 43, name: "الزخرف", englishName: "Az-Zukhruf", englishNameTranslation: "The Ornaments of Gold", numberOfAyahs: 89, revelationType: "Meccan", pageNumber: 489 },
  { number: 44, name: "الدخان", englishName: "Ad-Dukhan", englishNameTranslation: "The Smoke", numberOfAyahs: 59, revelationType: "Meccan", pageNumber: 496 },
  { number: 45, name: "الجاثية", englishName: "Al-Jathiyah", englishNameTranslation: "The Crouching", numberOfAyahs: 37, revelationType: "Meccan", pageNumber: 499 },
  { number: 46, name: "الأحقاف", englishName: "Al-Ahqaf", englishNameTranslation: "The Wind-Curved Sandhills", numberOfAyahs: 35, revelationType: "Meccan", pageNumber: 502 },
  { number: 47, name: "محمد", englishName: "Muhammad", englishNameTranslation: "Muhammad", numberOfAyahs: 38, revelationType: "Medinan", pageNumber: 507 },
  { number: 48, name: "الفتح", englishName: "Al-Fath", englishNameTranslation: "The Victory", numberOfAyahs: 29, revelationType: "Medinan", pageNumber: 511 },
  { number: 49, name: "الحجرات", englishName: "Al-Hujurat", englishNameTranslation: "The Rooms", numberOfAyahs: 18, revelationType: "Medinan", pageNumber: 515 },
  { number: 50, name: "ق", englishName: "Qaf", englishNameTranslation: "Qaf", numberOfAyahs: 45, revelationType: "Meccan", pageNumber: 518 },
  { number: 51, name: "الذاريات", englishName: "Adh-Dhariyat", englishNameTranslation: "The Winnowing Winds", numberOfAyahs: 60, revelationType: "Meccan", pageNumber: 520 },
  { number: 52, name: "الطور", englishName: "At-Tur", englishNameTranslation: "The Mount", numberOfAyahs: 49, revelationType: "Meccan", pageNumber: 523 },
  { number: 53, name: "النجم", englishName: "An-Najm", englishNameTranslation: "The Star", numberOfAyahs: 62, revelationType: "Meccan", pageNumber: 526 },
  { number: 54, name: "القمر", englishName: "Al-Qamar", englishNameTranslation: "The Moon", numberOfAyahs: 55, revelationType: "Meccan", pageNumber: 528 },
  { number: 55, name: "الرحمن", englishName: "Ar-Rahman", englishNameTranslation: "The Beneficent", numberOfAyahs: 78, revelationType: "Medinan", pageNumber: 531 },
  { number: 56, name: "الواقعة", englishName: "Al-Waqi'ah", englishNameTranslation: "The Inevitable", numberOfAyahs: 96, revelationType: "Meccan", pageNumber: 534 },
  { number: 57, name: "الحديد", englishName: "Al-Hadid", englishNameTranslation: "The Iron", numberOfAyahs: 29, revelationType: "Medinan", pageNumber: 537 },
  { number: 58, name: "المجادلة", englishName: "Al-Mujadila", englishNameTranslation: "The Pleading Woman", numberOfAyahs: 22, revelationType: "Medinan", pageNumber: 542 },
  { number: 59, name: "الحشر", englishName: "Al-Hashr", englishNameTranslation: "The Exile", numberOfAyahs: 24, revelationType: "Medinan", pageNumber: 545 },
  { number: 60, name: "الممتحنة", englishName: "Al-Mumtahanah", englishNameTranslation: "She that is to be examined", numberOfAyahs: 13, revelationType: "Medinan", pageNumber: 549 },
  { number: 61, name: "الصف", englishName: "As-Saff", englishNameTranslation: "The Ranks", numberOfAyahs: 14, revelationType: "Medinan", pageNumber: 551 },
  { number: 62, name: "الجمعة", englishName: "Al-Jumu'ah", englishNameTranslation: "Friday", numberOfAyahs: 11, revelationType: "Medinan", pageNumber: 553 },
  { number: 63, name: "المنافقون", englishName: "Al-Munafiqun", englishNameTranslation: "The Hypocrites", numberOfAyahs: 11, revelationType: "Medinan", pageNumber: 554 },
  { number: 64, name: "التغابن", englishName: "At-Taghabun", englishNameTranslation: "Mutual Disillusion", numberOfAyahs: 18, revelationType: "Medinan", pageNumber: 556 },
  { number: 65, name: "الطلاق", englishName: "At-Talaq", englishNameTranslation: "The Divorce", numberOfAyahs: 12, revelationType: "Medinan", pageNumber: 558 },
  { number: 66, name: "التحريم", englishName: "At-Tahrim", englishNameTranslation: "The Prohibition", numberOfAyahs: 12, revelationType: "Medinan", pageNumber: 560 },
  { number: 67, name: "الملك", englishName: "Al-Mulk", englishNameTranslation: "The Sovereignty", numberOfAyahs: 30, revelationType: "Meccan", pageNumber: 562 },
  { number: 68, name: "القلم", englishName: "Al-Qalam", englishNameTranslation: "The Pen", numberOfAyahs: 52, revelationType: "Meccan", pageNumber: 564 },
  { number: 69, name: "الحاقة", englishName: "Al-Haqqah", englishNameTranslation: "The Reality", numberOfAyahs: 52, revelationType: "Meccan", pageNumber: 566 },
  { number: 70, name: "المعارج", englishName: "Al-Ma'arij", englishNameTranslation: "The Ascending Stairways", numberOfAyahs: 44, revelationType: "Meccan", pageNumber: 568 },
  { number: 71, name: "نوح", englishName: "Nuh", englishNameTranslation: "Noah", numberOfAyahs: 28, revelationType: "Meccan", pageNumber: 570 },
  { number: 72, name: "الجن", englishName: "Al-Jinn", englishNameTranslation: "The Jinn", numberOfAyahs: 28, revelationType: "Meccan", pageNumber: 572 },
  { number: 73, name: "المزمل", englishName: "Al-Muzzammil", englishNameTranslation: "The Enshrouded One", numberOfAyahs: 20, revelationType: "Meccan", pageNumber: 574 },
  { number: 74, name: "المدثر", englishName: "Al-Muddaththir", englishNameTranslation: "The Cloaked One", numberOfAyahs: 56, revelationType: "Meccan", pageNumber: 575 },
  { number: 75, name: "القيامة", englishName: "Al-Qiyamah", englishNameTranslation: "The Resurrection", numberOfAyahs: 40, revelationType: "Meccan", pageNumber: 577 },
  { number: 76, name: "الإنسان", englishName: "Al-Insan", englishNameTranslation: "Man", numberOfAyahs: 31, revelationType: "Medinan", pageNumber: 578 },
  { number: 77, name: "المرسلات", englishName: "Al-Mursalat", englishNameTranslation: "The Emissaries", numberOfAyahs: 50, revelationType: "Meccan", pageNumber: 580 },
  { number: 78, name: "النبأ", englishName: "An-Naba", englishNameTranslation: "The Tidings", numberOfAyahs: 40, revelationType: "Meccan", pageNumber: 582 },
  { number: 79, name: "النازعات", englishName: "An-Nazi'at", englishNameTranslation: "Those who drag forth", numberOfAyahs: 46, revelationType: "Meccan", pageNumber: 583 },
  { number: 80, name: "عبس", englishName: "'Abasa", englishNameTranslation: "He frowned", numberOfAyahs: 42, revelationType: "Meccan", pageNumber: 585 },
  { number: 81, name: "التكوير", englishName: "At-Takwir", englishNameTranslation: "The Overthrowing", numberOfAyahs: 29, revelationType: "Meccan", pageNumber: 586 },
  { number: 82, name: "الانفطار", englishName: "Al-Infitar", englishNameTranslation: "The Cleaving", numberOfAyahs: 19, revelationType: "Meccan", pageNumber: 587 },
  { number: 83, name: "المطففين", englishName: "Al-Mutaffifin", englishNameTranslation: "Defrauding", numberOfAyahs: 36, revelationType: "Meccan", pageNumber: 587 },
  { number: 84, name: "الانشقاق", englishName: "Al-Inshiqaq", englishNameTranslation: "The Splitting Open", numberOfAyahs: 25, revelationType: "Meccan", pageNumber: 589 },
  { number: 85, name: "البروج", englishName: "Al-Buruj", englishNameTranslation: "The Mansions of the Stars", numberOfAyahs: 22, revelationType: "Meccan", pageNumber: 590 },
  { number: 86, name: "الطارق", englishName: "At-Tariq", englishNameTranslation: "The Morning Star", numberOfAyahs: 17, revelationType: "Meccan", pageNumber: 591 },
  { number: 87, name: "الأعلى", englishName: "Al-A'la", englishNameTranslation: "The Most High", numberOfAyahs: 19, revelationType: "Meccan", pageNumber: 591 },
  { number: 88, name: "الغاشية", englishName: "Al-Ghashiyah", englishNameTranslation: "The Overwhelming", numberOfAyahs: 26, revelationType: "Meccan", pageNumber: 592 },
  { number: 89, name: "الفجر", englishName: "Al-Fajr", englishNameTranslation: "The Dawn", numberOfAyahs: 30, revelationType: "Meccan", pageNumber: 593 },
  { number: 90, name: "البلد", englishName: "Al-Balad", englishNameTranslation: "The City", numberOfAyahs: 20, revelationType: "Meccan", pageNumber: 594 },
  { number: 91, name: "الشمس", englishName: "Ash-Shams", englishNameTranslation: "The Sun", numberOfAyahs: 15, revelationType: "Meccan", pageNumber: 595 },
  { number: 92, name: "الليل", englishName: "Al-Layl", englishNameTranslation: "The Night", numberOfAyahs: 21, revelationType: "Meccan", pageNumber: 595 },
  { number: 93, name: "الضحى", englishName: "Ad-Duha", englishNameTranslation: "The Morning Hours", numberOfAyahs: 11, revelationType: "Meccan", pageNumber: 596 },
  { number: 94, name: "الشرح", englishName: "Ash-Sharh", englishNameTranslation: "The Relief", numberOfAyahs: 8, revelationType: "Meccan", pageNumber: 596 },
  { number: 95, name: "التين", englishName: "At-Tin", englishNameTranslation: "The Fig", numberOfAyahs: 8, revelationType: "Meccan", pageNumber: 597 },
  { number: 96, name: "العلق", englishName: "Al-'Alaq", englishNameTranslation: "The Clot", numberOfAyahs: 19, revelationType: "Meccan", pageNumber: 597 },
  { number: 97, name: "القدر", englishName: "Al-Qadr", englishNameTranslation: "The Power", numberOfAyahs: 5, revelationType: "Meccan", pageNumber: 598 },
  { number: 98, name: "البينة", englishName: "Al-Bayyinah", englishNameTranslation: "The Clear Proof", numberOfAyahs: 8, revelationType: "Medinan", pageNumber: 598 },
  { number: 99, name: "الزلزلة", englishName: "Az-Zalzalah", englishNameTranslation: "The Earthquake", numberOfAyahs: 8, revelationType: "Medinan", pageNumber: 599 },
  { number: 100, name: "العاديات", englishName: "Al-'Adiyat", englishNameTranslation: "The Courser", numberOfAyahs: 11, revelationType: "Meccan", pageNumber: 599 },
  { number: 101, name: "القارعة", englishName: "Al-Qari'ah", englishNameTranslation: "The Calamity", numberOfAyahs: 11, revelationType: "Meccan", pageNumber: 600 },
  { number: 102, name: "التكاثر", englishName: "At-Takathur", englishNameTranslation: "The Rivalry in world increase", numberOfAyahs: 8, revelationType: "Meccan", pageNumber: 600 },
  { number: 103, name: "العصر", englishName: "Al-'Asr", englishNameTranslation: "The Declining Day", numberOfAyahs: 3, revelationType: "Meccan", pageNumber: 601 },
  { number: 104, name: "الهمزة", englishName: "Al-Humazah", englishNameTranslation: "The Traducer", numberOfAyahs: 9, revelationType: "Meccan", pageNumber: 601 },
  { number: 105, name: "الفيل", englishName: "Al-Fil", englishNameTranslation: "The Elephant", numberOfAyahs: 5, revelationType: "Meccan", pageNumber: 601 },
  { number: 106, name: "قريش", englishName: "Quraysh", englishNameTranslation: "Quraysh", numberOfAyahs: 4, revelationType: "Meccan", pageNumber: 602 },
  { number: 107, name: "الماعون", englishName: "Al-Ma'un", englishNameTranslation: "The Small Kindness", numberOfAyahs: 7, revelationType: "Meccan", pageNumber: 602 },
  { number: 108, name: "الكوثر", englishName: "Al-Kawthar", englishNameTranslation: "The Abundance", numberOfAyahs: 3, revelationType: "Meccan", pageNumber: 602 },
  { number: 109, name: "الكافرون", englishName: "Al-Kafirun", englishNameTranslation: "The Disbelievers", numberOfAyahs: 6, revelationType: "Meccan", pageNumber: 603 },
  { number: 110, name: "النصر", englishName: "An-Nasr", englishNameTranslation: "The Divine Support", numberOfAyahs: 3, revelationType: "Medinan", pageNumber: 603 },
  { number: 111, name: "المسد", englishName: "Al-Masad", englishNameTranslation: "The Palm Fiber", numberOfAyahs: 5, revelationType: "Meccan", pageNumber: 603 },
  { number: 112, name: "الإخلاص", englishName: "Al-Ikhlas", englishNameTranslation: "The Sincerity", numberOfAyahs: 4, revelationType: "Meccan", pageNumber: 604 },
  { number: 113, name: "الفلق", englishName: "Al-Falaq", englishNameTranslation: "The Daybreak", numberOfAyahs: 5, revelationType: "Meccan", pageNumber: 604 },
  { number: 114, name: "الناس", englishName: "An-Nas", englishNameTranslation: "Mankind", numberOfAyahs: 6, revelationType: "Meccan", pageNumber: 604 }
];

const STORAGE_KHATMAH_KEY = 'raqeeb_khatmah_state_v3';
const QURAN_CACHE_PREFIX = 'raqeeb_quran_cache_surah_';

export const INITIAL_KHATMAH_STATE: KhatmahState = {
  currentPage: 1,
  currentSurahNumber: 1,
  dailyPagesTarget: 20, // 1 Juz per day = 30 days khatmah
  startDate: new Date().toISOString().split('T')[0],
  lastReadDate: new Date().toISOString().split('T')[0],
  bookmarkPage: 1,
  bookmarkSurahName: 'الفاتحة',
  completedKhatmahsCount: 0,
  notes: 'ختمة مباركة - اجعل كل حرف شاهداً لك'
};

/**
 * Fetch text of a Surah from official AlQuran Cloud API with local caching
 */
export async function fetchSurahText(surahNumber: number): Promise<QuranAyah[]> {
  const cacheKey = `${QURAN_CACHE_PREFIX}${surahNumber}`;
  const cached = loadStored<QuranAyah[] | null>(cacheKey, null);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
    if (!res.ok) throw new Error(`Quran API returned status ${res.status}`);
    const data = await res.json();
    if (data && data.code === 200 && data.data && Array.isArray(data.data.ayahs)) {
      const ayahs: QuranAyah[] = data.data.ayahs.map((a: any) => ({
        number: a.number,
        text: a.text,
        numberInSurah: a.numberInSurah,
        juz: a.juz,
        page: a.page,
        surahNumber
      }));
      saveStored(cacheKey, ayahs);
      return ayahs;
    }
  } catch (err) {
    console.warn(`Failed to fetch online surah ${surahNumber}, checking fallback:`, err);
  }

  // Offline fallback for important surahs if network fails
  return getOfflineFallbackSurah(surahNumber);
}

/**
 * Build reciter audio stream URL (standard mp3quran format)
 */
export function getReciterAudioUrl(reciterId: string, surahNumber: number): string {
  const reciter = RECITERS_LIST.find(r => r.id === reciterId) || RECITERS_LIST[0];
  const padNumber = String(surahNumber).padStart(3, '0');
  return `${reciter.serverUrl}/${padNumber}.mp3`;
}

const QURAN_PAGE_CACHE_PREFIX = 'raqeeb_quran_cache_page_v1_';

/**
 * Identify the Surah that contains or begins on a given Madinah page (1-604)
 */
export function getSurahForPage(pageNumber: number): QuranSurah {
  const safePage = Math.max(1, Math.min(604, pageNumber));
  for (let i = SURAHS_METADATA.length - 1; i >= 0; i--) {
    if (SURAHS_METADATA[i].pageNumber <= safePage) {
      return SURAHS_METADATA[i];
    }
  }
  return SURAHS_METADATA[0];
}

/**
 * Approximate Juz for any page in Madinah Mushaf (1-604)
 */
export function getJuzForPage(pageNumber: number): number {
  if (pageNumber <= 21) return 1;
  return Math.min(30, Math.floor((pageNumber - 2) / 20) + 1);
}

/**
 * Fetch verified text of a specific Quran Page (1 - 604) from AlQuran Cloud with caching
 */
export async function fetchPageText(pageNumber: number): Promise<QuranPageData> {
  const safePage = Math.max(1, Math.min(604, pageNumber));
  const cacheKey = `${QURAN_PAGE_CACHE_PREFIX}${safePage}`;
  const cached = loadStored<QuranPageData | null>(cacheKey, null);
  if (cached && cached.ayahs && cached.ayahs.length > 0) {
    return cached;
  }

  try {
    const res = await fetch(`https://api.alquran.cloud/v1/page/${safePage}/quran-uthmani`);
    if (!res.ok) throw new Error(`AlQuran API returned status ${res.status}`);
    const data = await res.json();
    if (data && data.code === 200 && data.data && Array.isArray(data.data.ayahs)) {
      const ayahs: QuranAyah[] = data.data.ayahs.map((a: any) => ({
        number: a.number,
        text: a.text,
        numberInSurah: a.numberInSurah,
        juz: a.juz,
        page: a.page || safePage,
        surahNumber: a.surah?.number,
        surahName: a.surah?.name,
        hizbQuarter: a.hizbQuarter
      }));

      const surahsInPage = Object.values(data.data.surahs || {}).map((s: any) => ({
        number: s.number,
        name: s.name,
        englishName: s.englishName
      }));

      const pageData: QuranPageData = {
        pageNumber: safePage,
        ayahs,
        surahsInPage: surahsInPage.length > 0 ? surahsInPage : [{
          number: getSurahForPage(safePage).number,
          name: getSurahForPage(safePage).name,
          englishName: getSurahForPage(safePage).englishName
        }],
        juz: ayahs[0]?.juz || getJuzForPage(safePage),
        hizbQuarter: ayahs[0]?.hizbQuarter
      };

      saveStored(cacheKey, pageData);
      return pageData;
    }
  } catch (err) {
    console.warn(`Could not load online Quran page ${safePage}:`, err);
  }

  // Fallback for offline viewing
  const fallbackSurah = getSurahForPage(safePage);
  return {
    pageNumber: safePage,
    ayahs: [
      {
        number: 1,
        text: `صفحة ${safePage} - ${fallbackSurah.name}. جارٍ استرجاع الآيات برسم المصحف الشريف؛ اضغط لتحديث الاتصال بالشبكة.`,
        numberInSurah: 1,
        juz: getJuzForPage(safePage),
        page: safePage,
        surahNumber: fallbackSurah.number,
        surahName: fallbackSurah.name
      }
    ],
    surahsInPage: [{
      number: fallbackSurah.number,
      name: fallbackSurah.name,
      englishName: fallbackSurah.englishName
    }],
    juz: getJuzForPage(safePage)
  };
}

/**
 * Load Khatmah state from storage
 */
export function loadKhatmahState(): KhatmahState {
  return loadStored<KhatmahState>(STORAGE_KHATMAH_KEY, INITIAL_KHATMAH_STATE);
}

/**
 * Save Khatmah state to storage
 */
export function saveKhatmahState(state: KhatmahState): void {
  saveStored(STORAGE_KHATMAH_KEY, state);
}

/**
 * Jump directly to a specific page in Khatmah
 */
export function jumpToKhatmahPage(pageNumber: number): KhatmahState {
  const safePage = Math.max(1, Math.min(604, pageNumber));
  const current = loadKhatmahState();
  const surah = getSurahForPage(safePage);
  const updated: KhatmahState = {
    ...current,
    currentPage: safePage,
    currentSurahNumber: surah.number,
    lastReadDate: new Date().toISOString().split('T')[0]
  };
  saveKhatmahState(updated);
  return updated;
}

/**
 * Update daily reading goal (target pages per day)
 */
export function updateDailyTarget(target: number): KhatmahState {
  const current = loadKhatmahState();
  const updated: KhatmahState = {
    ...current,
    dailyPagesTarget: Math.max(1, Math.min(100, target))
  };
  saveKhatmahState(updated);
  return updated;
}

/**
 * Reset Khatmah to page 1 for starting a new Khatmah
 */
export function resetKhatmahProgress(): KhatmahState {
  const current = loadKhatmahState();
  const updated: KhatmahState = {
    ...current,
    currentPage: 1,
    currentSurahNumber: 1,
    bookmarkPage: 1,
    bookmarkSurahName: 'الفاتحة',
    startDate: new Date().toISOString().split('T')[0],
    lastReadDate: new Date().toISOString().split('T')[0]
  };
  saveKhatmahState(updated);
  return updated;
}

const SAVED_BOOKMARKS_KEY = 'raqib_quran_saved_bookmarks';

/**
 * Get full list of saved bookmarks
 */
export function getSavedBookmarks(): QuranBookmarkItem[] {
  const stored = loadStored<QuranBookmarkItem[]>(SAVED_BOOKMARKS_KEY, []);
  if (stored && stored.length > 0) {
    return stored;
  }
  // Initialize with current khatmah bookmark if available
  const current = loadKhatmahState();
  const page = current.bookmarkPage || 1;
  const surah = getSurahForPage(page);
  const initialItem: QuranBookmarkItem = {
    id: 'initial_primary_bm',
    page,
    surahNumber: surah.number,
    surahName: surah.name,
    juzNumber: getJuzForPage(page),
    note: 'فاصلة الختمة الرئيسية',
    createdAt: new Date().toISOString()
  };
  saveStored(SAVED_BOOKMARKS_KEY, [initialItem]);
  return [initialItem];
}

/**
 * Save / add a new bookmark to list and update primary bookmark
 */
export function addSavedBookmark(page: number, note?: string, surahNumber?: number): { bookmarks: QuranBookmarkItem[]; updatedKhatmah: KhatmahState } {
  const safePage = Math.max(1, Math.min(604, page));
  const surah = surahNumber ? (SURAHS_METADATA.find(s => s.number === surahNumber) || getSurahForPage(safePage)) : getSurahForPage(safePage);
  const currentList = getSavedBookmarks();
  
  // Check if a bookmark already exists for this exact page
  const existingIndex = currentList.findIndex(b => b.page === safePage);
  let updatedList: QuranBookmarkItem[];
  
  if (existingIndex >= 0) {
    updatedList = [...currentList];
    updatedList[existingIndex] = {
      ...updatedList[existingIndex],
      note: note !== undefined ? note : updatedList[existingIndex].note,
      createdAt: new Date().toISOString()
    };
  } else {
    const newItem: QuranBookmarkItem = {
      id: 'bm_' + Date.now() + '_' + crypto.randomUUID().split("-")[0],
      page: safePage,
      surahNumber: surah.number,
      surahName: surah.name,
      juzNumber: getJuzForPage(safePage),
      note: note || undefined,
      createdAt: new Date().toISOString()
    };
    updatedList = [newItem, ...currentList];
  }

  saveStored(SAVED_BOOKMARKS_KEY, updatedList);

  // Also update KhatmahState primary bookmark
  const updatedKhatmah = setBookmark(safePage, surah.number, false);
  return { bookmarks: updatedList, updatedKhatmah };
}

/**
 * Delete a bookmark from saved list
 */
export function deleteSavedBookmark(id: string): QuranBookmarkItem[] {
  const currentList = getSavedBookmarks();
  const updatedList = currentList.filter(b => b.id !== id);
  saveStored(SAVED_BOOKMARKS_KEY, updatedList);
  return updatedList;
}

/**
 * Update bookmark to current page
 */
export function setBookmark(page: number, surahNumber?: number, syncList: boolean = true): KhatmahState {
  const current = loadKhatmahState();
  const safePage = Math.max(1, Math.min(604, page));
  const surah = surahNumber ? (SURAHS_METADATA.find(s => s.number === surahNumber) || getSurahForPage(safePage)) : getSurahForPage(safePage);
  const updated: KhatmahState = {
    ...current,
    bookmarkPage: safePage,
    bookmarkSurahName: surah.name,
    lastReadDate: new Date().toISOString().split('T')[0]
  };
  saveKhatmahState(updated);

  if (syncList) {
    // Also ensure this bookmark exists in saved list
    const currentList = loadStored<QuranBookmarkItem[]>(SAVED_BOOKMARKS_KEY, []);
    const exists = currentList.some(b => b.page === safePage);
    if (!exists) {
      const newItem: QuranBookmarkItem = {
        id: 'bm_' + Date.now() + '_' + crypto.randomUUID().split("-")[0],
        page: safePage,
        surahNumber: surah.number,
        surahName: surah.name,
        juzNumber: getJuzForPage(safePage),
        note: 'فاصلة الختمة',
        createdAt: new Date().toISOString()
      };
      saveStored(SAVED_BOOKMARKS_KEY, [newItem, ...currentList]);
    }
  }

  return updated;
}

/**
 * Advance Khatmah pages and detect Khatmah completion
 */
export function advanceKhatmah(pagesAdded: number): { state: KhatmahState; completedNow: boolean } {
  const current = loadKhatmahState();
  const newPage = current.currentPage + pagesAdded;
  let completedNow = false;
  let updatedPage = newPage;
  let completions = current.completedKhatmahsCount;

  if (newPage >= 604) {
    completedNow = true;
    completions += 1;
    updatedPage = 1; // Start new khatmah
  }

  // Find accurate surah for page
  const matchedSurah = getSurahForPage(updatedPage);

  const newState: KhatmahState = {
    ...current,
    currentPage: updatedPage,
    currentSurahNumber: matchedSurah.number,
    lastReadDate: new Date().toISOString().split('T')[0],
    completedKhatmahsCount: completions
  };

  saveKhatmahState(newState);
  return { state: newState, completedNow };
}

/**
 * Offline fallback for critical Surahs (Al-Fatihah, Al-Ikhlas, Al-Falaq, An-Nas, Ayat Al-Kursi)
 */
function getOfflineFallbackSurah(surahNumber: number): QuranAyah[] {
  if (surahNumber === 1) {
    return [
      { number: 1, text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", numberInSurah: 1, juz: 1, page: 1, surahNumber: 1 },
      { number: 2, text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ", numberInSurah: 2, juz: 1, page: 1, surahNumber: 1 },
      { number: 3, text: "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", numberInSurah: 3, juz: 1, page: 1, surahNumber: 1 },
      { number: 4, text: "مَٰلِكِ يَوْمِ ٱلدِّينِ", numberInSurah: 4, juz: 1, page: 1, surahNumber: 1 },
      { number: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", numberInSurah: 5, juz: 1, page: 1, surahNumber: 1 },
      { number: 6, text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", numberInSurah: 6, juz: 1, page: 1, surahNumber: 1 },
      { number: 7, text: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ", numberInSurah: 7, juz: 1, page: 1, surahNumber: 1 }
    ];
  }
  if (surahNumber === 112) {
    return [
      { number: 6222, text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ", numberInSurah: 1, juz: 30, page: 604, surahNumber: 112 },
      { number: 6223, text: "ٱللَّهُ ٱلصَّمَدُ", numberInSurah: 2, juz: 30, page: 604, surahNumber: 112 },
      { number: 6224, text: "لَمْ يَلِدْ وَلَمْ يُولَدْ", numberInSurah: 3, juz: 30, page: 604, surahNumber: 112 },
      { number: 6225, text: "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ", numberInSurah: 4, juz: 30, page: 604, surahNumber: 112 }
    ];
  }
  if (surahNumber === 113) {
    return [
      { number: 6226, text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ", numberInSurah: 1, juz: 30, page: 604, surahNumber: 113 },
      { number: 6227, text: "مِن شَرِّ مَا خَلَقَ", numberInSurah: 2, juz: 30, page: 604, surahNumber: 113 },
      { number: 6228, text: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", numberInSurah: 3, juz: 30, page: 604, surahNumber: 113 },
      { number: 6229, text: "وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ", numberInSurah: 4, juz: 30, page: 604, surahNumber: 113 },
      { number: 6230, text: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", numberInSurah: 5, juz: 30, page: 604, surahNumber: 113 }
    ];
  }
  if (surahNumber === 114) {
    return [
      { number: 6231, text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ", numberInSurah: 1, juz: 30, page: 604, surahNumber: 114 },
      { number: 6232, text: "مَلِكِ ٱلنَّاسِ", numberInSurah: 2, juz: 30, page: 604, surahNumber: 114 },
      { number: 6233, text: "إِلَٰهِ ٱلنَّاسِ", numberInSurah: 3, juz: 30, page: 604, surahNumber: 114 },
      { number: 6234, text: "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ", numberInSurah: 4, juz: 30, page: 604, surahNumber: 114 },
      { number: 6235, text: "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ", numberInSurah: 5, juz: 30, page: 604, surahNumber: 114 },
      { number: 6236, text: "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ", numberInSurah: 6, juz: 30, page: 604, surahNumber: 114 }
    ];
  }

  // Generic fallback message
  return [
    {
      number: 1,
      text: `سورة ${SURAHS_METADATA.find(s => s.number === surahNumber)?.name || surahNumber} (جارٍ استرجاع الآيات من المصحف الشريف... تأكد من اتصال الإنترنت أو استخدم التلاوة الصوتية المباشرة)`,
      numberInSurah: 1,
      juz: 1,
      page: 1,
      surahNumber
    }
  ];
}
