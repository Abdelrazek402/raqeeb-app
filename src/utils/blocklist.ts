// Adult and explicit content blocker engine & blacklist patterns
// Featuring multilingual support, regional dialectal slang, normalization, leetspeak neutralization, and smart context filtering

export const TRUSTED_SAFE_DOMAINS: string[] = [
  'example.com', 'excel.com', 'gov.eg', 'tax.gov.eg', 'moe.gov.eg', 'mohp.gov.eg', 'egypt.gov.eg',
  'wikipedia.org', 'ar.wikipedia.org', 'wikimedia.org',
  'openai.com', 'chatgpt.com', 'anthropic.com', 'claude.ai',
  'khanacademy.org', 'coursera.org', 'edx.org', 'udemy.com', 'udacity.com',
  'un.org', 'who.int', 'unesco.org',
  'mozilla.org', 'developer.mozilla.org',
  'typescriptlang.org', 'python.org', 'nodejs.org', 'pytorch.org', 'tensorflow.org',
  'google.com', 'github.com', 'stackoverflow.com', 'microsoft.com', 'w3schools.com',
  'bing.com', 'duckduckgo.com', 'yahoo.com', 'amazon.com', 'cloudflare.com',
  'oracle.com', 'apple.com', 'android.com', 'java.com', 'npmjs.com', 'github.io',
  'alazhar.eg', 'dar-alifta.org', 'islamweb.net', 'islamqa.info', 'quran.com', 'sunnah.com'
];

export const DEFAULT_BLOCKED_DOMAINS: string[] = [
  // Major Adult Tube & Video Platforms
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com', 'youporn.com',
  'onlyfans.com', 'chaturbate.com', 'stripchat.com', 'livejasmin.com', 'cam4.com', 'bonga.com',
  'brazzers.com', 'porn.com', 'tube8.com', 'spankwire.com', 'beeg.com', 'tnaflix.com',
  'heavy-r.com', 'motherless.com', 'empflix.com', 'ero-video.net', 'hqporner.com', 'eporner.com',
  'daftsex.com', 'xvideos2.com', 'xnxx2.com', 'pornhubpremium.com', 'xhamster18.com', 'x-hamster.com',
  'sex.com', 'x-heroin.com', 'boundhub.com', 'fapello.com', 'bongacams.com', 'camsoda.com',
  'camster.com', 'myfreecams.com', 'flirt4free.com', 'streamate.com', 'jasmin.com', 'imlive.com',
  'camfap.com', 'camwhores.tv', 'camcaps.io', 'dirtyroulette.com', 'faphouse.com', 'fapics.com',
  'faphero.com', 'vipsexy.net', 'x-nxx.com', 'x-videos.com', 'pornone.com', 'porn300.com',
  'porndig.com', 'pornhits.com', 'pornrabbit.com', 'pornktube.com', 'porntrex.com', 'txxx.com',
  'upornia.com', 'vporn.com', 'voyeurhit.com', 'watchmygf.me', 'x-fuck.com', 'xfantazy.com',
  'xglamour.com', 'xkeezmovies.com', 'xlxx.com', 'xoslut.com', 'xozilla.com', 'x-tube.com',
  'xtube.com', 'x-unlimited.com', 'youjizz.com', 'zztube.com', '4tube.com', '321sex.com',
  'ah-me.com', 'amateur-file.com', 'anyporn.com', 'asiani.ru', 'badjojo.com', 'bangbros.com',
  'bestpornsites.net', 'bigo.tv', 'bitporn.com', 'celebkleaks.com', 'cliphunter.com', 'cumlouder.com',
  'drtuber.com', 'efukt.com', 'extremetube.com', 'fakers.app', 'findtubes.com', 'fleshbot.com',
  'freeomovie.com', 'gotporn.com', 'hardsextube.com', 'hclips.com', 'hotshame.com', 'inporn.com',
  'javhd.com', 'javlibrary.com', 'javmost.com', 'jizzhut.com', 'keezmovies.com', 'kink.com',

  // Anime, Manga, Hentai & Doujinshi
  'hentaihaven.xxx', 'nhentai.net', 'luscious.net', 'e-hentai.org', 'rule34.xxx', 'gelbooru.com',
  'danbooru.donmai.us', 'taboo.xxx', 'hentai2read.com', 'hentai.tv', 'hentaigasm.com', 'hentaicream.com',
  'hentaistorm.com', 'hentaimama.io', 'hentai3z.xyz', 'pururin.to', 'hitomi.la', 'yande.re',
  'sankakucomplex.com', 'exhentai.org', 'asmhentai.com', '321hentai.com', 'imhentai.xxx', 'allhentai.ru',
  'multporn.net', 'hentaicosplay.org', 'hentaifox.com', 'simply-hentai.com', 'hentaicafe.com',

  // Leaks, Coomer, Cyber-Escorts & OnlyFans Aggregators
  'leakfans.com', 'coomer.party', 'kemono.party', 'anonib.al', 'fapello.com', 'thotsbay.tv',
  'simpcity.su', 'bunkr.is', 'bunkr.ru', 'cyberdrop.me', 'pixeldrain.com', 'gofile.io',
  'erome.com', 'thothub.to', 'coomer.su', 'kemono.su', 'influencersgonewild.com', 'leakedzone.com',
  'dirtyleaks.com', 'nudeleak.net', 'celebnsfw.com', 'vipr.im', 'fapster.com', 'hotcelebs.net',

  // AI Undress, Nudify & Deepfake Generators
  'nudify.online', 'undress.app', 'soulgen.ai', 'clothoff.io', 'deepnude.to', 'nudify.art',
  'promptchan.ai', 'deepfakeer.com', 'nudify.vip', 'undress.vip', 'aiundress.com', 'undressai.tools',
  'nudeai.online', 'clothoff.net', 'porndude.com', 'seduce.ai', 'dreamshaper.ai', 'nude-gen.com',

  // Adult Chat, Random Cams & Dating
  'adultfriendfinder.com', 'ashleymadison.com', 'imlive.com', 'cams.com', 'flirt4free.com',
  'myfreecams.com', 'camgirl.com', 'omegle.com', 'chatrandom.com', 'shagle.com', 'flirtymania.com',
  'chathub.cam', 'coomeet.com', 'chaturbate.de', 'tinychat.com', 'camfrog.com', 'icq.com',
  'cam4.de', 'chatroulette.com', 'fling.com', 'passion.com', 'sexier.com', 'camzap.com',

  // Additional 250+ Regional & Global Adult Domains
  'xvideos.es', 'xvideos.fr', 'pornhub.com.br', 'xhamster.de', 'redtube.com.br', 'xnxx.tv',
  'xvideos.in', 'pornhub.ru', 'youporn.ru', 'xhamster.com.br', 'sex.com.br', 'tub8.com',
  'spankbang.com', 'xvideos.club', 'pornpics.com', 'thumbzilla.com', 'sunporno.com', 'xfreehd.com',
  'hulkshare.com', 'tube8.es', 'porntube.com', 'x-videos.es', 'porn-hub.com', 'you-porn.com',
  'pornhub.net', 'pornhub.org', 'xvideos.net', 'xnxx.net', 'xhamster.net', 'redtube.net',
  'pornhub.es', 'pornhub.de', 'pornhub.fr', 'xvideos.de', 'xvideos.ru', 'xvideos.co.uk',
  'xnxx.club', 'xnxx.in', 'xnxx.es', 'xnxx.fr', 'xhamster.es', 'xhamster.fr',
  'redtube.es', 'redtube.fr', 'redtube.de', 'beeg.net', 'beeg.org', 'spankwire.net',
  'tnaflix.net', 'heavy-r.net', 'motherless.net', 'empflix.net', 'hqporner.net', 'eporner.net',
  'daftsex.net', 'tube8.net', 'tube8.org', 'vporn.net', 'txxx.net', 'porntrex.net',
  'upornia.net', 'xoslut.net', 'youjizz.net', '4tube.net', 'anyporn.net', 'bangbros.net',
  'cliphunter.net', 'cumlouder.net', 'drtuber.net', 'efukt.net', 'extremetube.net', 'fleshbot.net',
  'hardsextube.net', 'hclips.net', 'inporn.net', 'javhd.net', 'keezmovies.net', 'kink.net',
  'spankbang.net', 'pornpics.net', 'thumbzilla.net', 'sunporno.net', 'xfreehd.net', 'porntube.net',
  'xvideos.link', 'pornhub.link', 'xnxx.link', 'xhamster.link', 'redtube.link', 'youporn.link',
  'onlyfans.link', 'chaturbate.link', 'stripchat.link', 'livejasmin.link', 'cam4.link', 'bonga.link',
  'brazzers.link', 'porn.link', 'tube8.link', 'beeg.link', 'tnaflix.link', 'heavy-r.link',
  'motherless.link', 'empflix.link', 'hqporner.link', 'eporner.link', 'daftsex.link', 'xvideos.party',
  'pornhub.party', 'xnxx.party', 'xhamster.party', 'redtube.party', 'youporn.party', 'onlyfans.party',
  'chaturbate.party', 'stripchat.party', 'livejasmin.party', 'cam4.party', 'bonga.party', 'brazzers.party',
  'xvideos.live', 'pornhub.live', 'xnxx.live', 'xhamster.live', 'redtube.live', 'youporn.live',
  'onlyfans.live', 'chaturbate.live', 'stripchat.live', 'livejasmin.live', 'cam4.live', 'bonga.live',
  'brazzers.live', 'porn.live', 'tube8.live', 'beeg.live', 'tnaflix.live', 'heavy-r.live',
  'xvideos.cam', 'pornhub.cam', 'xnxx.cam', 'xhamster.cam', 'redtube.cam', 'youporn.cam',
  'onlyfans.cam', 'chaturbate.cam', 'stripchat.cam', 'livejasmin.cam', 'cam4.cam', 'bonga.cam',
  'brazzers.cam', 'porn.cam', 'tube8.cam', 'beeg.cam', 'tnaflix.cam', 'heavy-r.cam',
  'xvideos.app', 'pornhub.app', 'xnxx.app', 'xhamster.app', 'redtube.app', 'youporn.app',
  'onlyfans.app', 'chaturbate.app', 'stripchat.app', 'livejasmin.app', 'cam4.app', 'bonga.app',
  'brazzers.app', 'porn.app', 'tube8.app', 'beeg.app', 'tnaflix.app', 'heavy-r.app',
  'xvideos.video', 'pornhub.video', 'xnxx.video', 'xhamster.video', 'redtube.video', 'youporn.video',
  'xvideos.media', 'pornhub.media', 'xnxx.media', 'xhamster.media', 'redtube.media', 'youporn.media',
  'xvideos.digital', 'pornhub.digital', 'xnxx.digital', 'xhamster.digital', 'redtube.digital', 'youporn.digital',
  'xvideos.tech', 'pornhub.tech', 'xnxx.tech', 'xhamster.tech', 'redtube.tech', 'youporn.tech',
  'xvideos.store', 'pornhub.store', 'xnxx.store', 'xhamster.store', 'redtube.store', 'youporn.store',
  'xvideos.shop', 'pornhub.shop', 'xnxx.shop', 'xhamster.shop', 'redtube.shop', 'youporn.shop',
  'xvideos.vip', 'pornhub.vip', 'xnxx.vip', 'xhamster.vip', 'redtube.vip', 'youporn.vip',
  'xvideos.site', 'pornhub.site', 'xnxx.site', 'xhamster.site', 'redtube.site', 'youporn.site',
  'xvideos.online', 'pornhub.online', 'xnxx.online', 'xhamster.online', 'redtube.online', 'youporn.online',
  'xvideos.space', 'pornhub.space', 'xnxx.space', 'xhamster.space', 'redtube.space', 'youporn.space',
  'xvideos.top', 'pornhub.top', 'xnxx.top', 'xhamster.top', 'redtube.top', 'youporn.top',
  'xvideos.xyz', 'pornhub.xyz', 'xnxx.xyz', 'xhamster.xyz', 'redtube.xyz', 'youporn.xyz',
  'xvideos.icu', 'pornhub.icu', 'xnxx.icu', 'xhamster.icu', 'redtube.icu', 'youporn.icu',
  'xvideos.club', 'pornhub.club', 'xnxx.club', 'xhamster.club', 'redtube.club', 'youporn.club',
  'xvideos.work', 'pornhub.work', 'xnxx.work', 'xhamster.work', 'redtube.work', 'youporn.work',
  'xvideos.pw', 'pornhub.pw', 'xnxx.pw', 'xhamster.pw', 'redtube.pw', 'youporn.pw',
  'xvideos.cx', 'pornhub.cx', 'xnxx.cx', 'xhamster.cx', 'redtube.cx', 'youporn.cx',
  'xvideos.cc', 'pornhub.cc', 'xnxx.cc', 'xhamster.cc', 'redtube.cc', 'youporn.cc'
];

export const EXPLICIT_KEYWORDS: string[] = [
  // --- English & Western Keywords ---
  'porn', 'porno', 'xxx', 'sex', 'nude', 'nudes', 'naked', 'hentai', 'erotic', 'erotica',
  'boobs', 'pussy', 'dick', 'cock', 'blowjob', 'creampie', 'gangbang', 'camgirl', 'escort',
  'milf', 'nsfw', 'stripchat', 'chaturbate', 'onlyfans', 'leaked nudes', 'fap', 'fapping',
  'x-rated', 'adult movie', 'fetish', 'bdsm', 'interracial sex', 'threesome', 'orgy',
  'deepfake nude', 'ai nude', 'undress ai', 'strip ai', 'nude generator', 'uncensored 18+',
  'bitch', 'slut', 'whore', 'hardcore', 'softcore', 'anal', 'cunt', 'squirt', 'deepthroat',
  'bukkake', 'facelfuck', 'footfetish', 'stepmom', 'stepsister', 'thot', 'leakfans',

  // --- Arabic Standard & Regional Dialectal Slang (مصرية، شامية، خليجية، مغاربية، عراقية، يمنية، سودانية) ---
  'سكس', 'إباحي', 'اباحي', 'اباحيه', 'إباحية', 'افلام للكبار', 'أفلام للكبار', 'افلام ممنوعة',
  'افلام +18', 'افلام 18', 'سكس مصري', 'سكس عربي', 'سكس خليجي', 'سكس مغربي', 'سكس عراقي',
  'سكس جزائري', 'سكس سوداني', 'سكس شامي', 'سكس تونسي', 'سكس محجبات', 'سكس منزلي', 'سكس طالبات',
  'مقاطع عارية', 'مقاطع ساخنة', 'فيديوهات ساخنة', 'فضايح', 'فضائح', 'تسريبات', 'تسريبات ممثلات',
  'رقص منازل ساخن', 'رقص عاري', 'روتيني اليومي الساخن', 'شات تعارف عاري', 'كاميرات لايف عارية',
  'طيز', 'كس', 'زب', 'نيك', 'تناك', 'مناكة', 'منكوك', 'شرموط', 'شرموطة', 'شراميط',
  'قحبة', 'قحاب', 'عاهرة', 'عاهرات', 'متناكة', 'لبوة', 'حلوانية', 'معرص', 'تعريص',
  'مص زب', 'لحس كس', 'جنس خلفي', 'جنس جماعي', 'جنس شفاه', 'شهوة', 'افلام جنس', 'مقاطع جنسية',
  'بنات عاريات', 'صور عارية', 'صور بدون ملابس', 'خلع ملابس', 'سحاق', 'سحاقيات', 'مواليد18',
  'ممحونة', 'ممحون', 'سالب وموجب', 'لواط', 'شواذ', 'تعارف عاري', 'شات عاري', 'بدون ملابس',
  'بث مباشر عاري', 'بدون كلوت', 'بدون ستيان', 'صدر عاري', 'مؤخرة عارية', 'سكس امهات', 'سكس محارم',
  'صور خاصة مسربة', 'مساج جنسي', 'نيك خلفي',

  // --- French & Spanish ---
  'porno', 'sexe', 'chatte', 'bite', 'salope', 'encule', 'baiser', 'pute', 'coño', 'follar',
  'chupada', 'tetas', 'chota', 'puta', 'culona', 'verga', 'pene', 'mamasita', 'film x', 'baise',
  'femme nue', 'video cul', 'escort girl', 'desnuda', 'pornografa', 'videos x', 'coito',

  // --- Russian & Eastern European ---
  'порно', 'секс', 'сиськи', 'шлюха', 'жопа', 'трах', 'пизда', 'хуй', 'минет', 'блят', 'голые',
  'эротика', 'шлюхи', 'хентай', 'порнуха',

  // --- German, Turkish & Italian ---
  'ficken', 'fotze', 'titten', 'amcık', 'sikiş', 'sik', 'porno izle', 'orospu', 'fregna', 'troia',
  'sokuş', 'yarrak', 'çıplak', 'sikis', 'pornografik', 'liseli porno',

  // --- South & East Asian (Hindi, Urdu, Tagalog, Indonesian, Japanese, Chinese) ---
  'bokep', 'memek', 'kontol', 'puki', 'kantot', 'bastos', 'chudai', 'muth', 'bhabhi', 'chut',
  'gand', 'land', '裏ビデオ', 'アダルト', '変態', '色情', '黃片', '成人影片', 'ecchi', 'jav',
  'doujinshi', '18禁', 'AV女優',

  // --- Franco-Arabic & Leetspeak Variations ---
  's3x', 'p0rn', 'p0rn0', 'x3x', 's.e.x', 'p.o.r.n', '3arabi sex', 'sex 3arabi', '6iz', '7elma'
];

export interface DNSProvider {
  name: string;
  nameAr: string;
  primaryIPv4: string;
  secondaryIPv4: string;
  dohUrl: string;
  description: string;
}

export const RECOMMENDED_FAMILY_DNS: DNSProvider[] = [
  {
    name: 'CleanBrowsing Family Filter',
    nameAr: 'كلين براوزينج (فلتر العائلة)',
    primaryIPv4: '185.228.168.168',
    secondaryIPv4: '185.228.169.168',
    dohUrl: 'https://doh.cleanbrowsing.org/doh/family-filter/',
    description: 'يحجب المواقع الإباحية، البحث غير الآمن، ومواقع الخبث مع إجبار محركات البحث على وضع SafeSearch.'
  },
  {
    name: 'AdGuard Family Protection',
    nameAr: 'أدجارد حماية الأسرة',
    primaryIPv4: '94.140.14.15',
    secondaryIPv4: '94.140.15.16',
    dohUrl: 'https://dns.adguard-dns.com/dns-query',
    description: 'حجب كامل للمواقع الإباحية والإعلانات المزعجة وفرض البحث الآمن في جوجل ويوتيوب وبينج.'
  },
  {
    name: 'Cloudflare 1.1.1.3 (Malware & Adult)',
    nameAr: 'كلاود فلير العائلي',
    primaryIPv4: '1.1.1.3',
    secondaryIPv4: '1.0.0.3',
    dohUrl: 'https://family.cloudflare-dns.com/dns-query',
    description: 'أسرع DNS في العالم مزود بحجب تلقائي للمواقع الإباحية والبرمجيات الخبيثة.'
  }
];

/**
 * Calculates Levenshtein Distance between two strings to detect typos/obfuscations
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates similarity ratio between two strings (0.0 to 1.0)
 */
export function getSimilarityRatio(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  const dist = calculateLevenshteinDistance(str1, str2);
  return 1.0 - dist / maxLen;
}

/**
 * Checks if a token fuzzy matches a target explicit keyword with smart thresholding
 */
export function isFuzzyMatch(token: string, keyword: string): boolean {
  if (!token || !keyword) return false;
  const t = token.toLowerCase();
  const k = keyword.toLowerCase();

  if (t === k) return true;

  // Length difference threshold safeguard
  if (Math.abs(t.length - k.length) > 2) return false;

  // Very short keywords (<= 3 chars) require exact match
  if (k.length <= 3) return t === k;

  // Medium keywords (4-5 chars): allow 1 edit distance ONLY if similarity is >= 82%
  if (k.length <= 5) {
    const dist = calculateLevenshteinDistance(t, k);
    return dist <= 1 && getSimilarityRatio(t, k) >= 0.82;
  }

  // Long keywords (6+ chars): allow up to 2 edit distances if similarity >= 80%
  const dist = calculateLevenshteinDistance(t, k);
  return dist <= 2 && getSimilarityRatio(t, k) >= 0.80;
}

const INNOCENT_SAFEWORDS = [
  'اكسل', 'إكسل', 'excel', 'تاكسي', 'تكسير', 'مكسور', 'كسر', 'كسور', 'كسوف', 'الكسوف', 'خسوف', 'الخسوف',
  'اوكسجين', 'أوكسجين', 'ماكس', 'اليكس', 'الكسندر', 'انعكاس', 'انعكاسات', 'انتكاس', 'انتكاسة',
  'تكساس', 'سكسونيا', 'مكسيك', 'مكسيكي', 'كسب', 'مكسب', 'كاسبر', 'ماركس', 'كسكسي', 'فصل',
  'tax', 'python', 'pytorch', 'tensorflow', 'node', 'nodejs', 'vite', 'react', 'typescript', 'github', 'stackoverflow',
  'wikipedia', 'openai', 'khanacademy', 'coursera', 'un', 'unesco', 'mozilla', 'developer', 'microsoft', 'google'
];

/**
 * Normalizes text to counter bypass techniques (diacritics, leetspeak, punctuation tricks, character repeats)
 */
export function normalizeSearchInput(input: string): {
  raw: string;
  normalized: string;
  deSpaced: string;
} {
  if (!input) return { raw: '', normalized: '', deSpaced: '' };

  let text = input.trim().toLowerCase();

  // 1. Remove Arabic Tashkeel & Diacritics
  text = text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '');

  // 2. Normalize Arabic Alef, Ya, Ta Marbuta & Tatweel
  text = text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, ''); // Tatweel

  // 3. De-leetspeak & Symbol Replacement
  const leetMap: Record<string, string> = {
    '@': 'a',
    '$': 's',
    '!': 'i',
    '0': 'o',
    '3': 'e',
    '1': 'i',
    '5': 's',
    '7': 'h',
    '8': 'g',
    '9': 'q',
    'v': 'u'
  };

  text = text.split('').map(char => leetMap[char] || char).join('');

  // 4. Collapse repeated characters (e.g., "seeeeeexxxxx" -> "sex", "سسسسكسسس" -> "سكس")
  const collapsed = text.replace(/(.)\1{2,}/g, '$1');

  // 5. De-spaced version (e.g., "s e x" -> "sex", "س ك س" -> "سكس", "p_o_r_n" -> "porn")
  const deSpaced = collapsed.replace(/[\s._\-+/\\,*#@!$%^&()=[\]{}|;:'"<>?]+/g, '');

  return {
    raw: input.trim().toLowerCase(),
    normalized: collapsed,
    deSpaced
  };
}

/**
 * Checks if a given URL or query contains blocked domains or adult keywords using smart heuristics
 */
export function isUrlOrQueryBlocked(
  input: string, 
  customBlockedDomains: string[] = []
): { blocked: boolean; reason?: string } {
  if (!input || !input.trim()) return { blocked: false };

  const { raw, normalized, deSpaced } = normalizeSearchInput(input);

  // 0. High Priority Allowlist Check (Trusted Educational, Tech, Governmental & Scientific Domains)
  const isTrustedSafeDomain = TRUSTED_SAFE_DOMAINS.some(domain => {
    return raw.includes(domain) || normalized.includes(domain);
  });
  if (isTrustedSafeDomain) {
    return { blocked: false };
  }

  // 1. Check direct domain & custom domain match
  const allBlockedDomains = [
    ...DEFAULT_BLOCKED_DOMAINS, 
    ...customBlockedDomains.map(d => d.toLowerCase().trim())
  ];
  
  for (const domain of allBlockedDomains) {
    if (domain && (raw.includes(domain) || normalized.includes(domain) || deSpaced.includes(domain.replace(/\./g, '')))) {
      return {
        blocked: true,
        reason: 'محاولة الوصول لنطاق محظور لحماية البصر'
      };
    }
  }

  // 2. High-Risk Adult TLD Check (.adult, .sex, .porn, .xxx, .erotica)
  const adultTldRegex = /\.(adult|sex|porn|xxx|erotica|cam)\b/i;
  if (adultTldRegex.test(raw) || adultTldRegex.test(normalized)) {
    return {
      blocked: true,
      reason: 'محاولة تصفح موقع ذي امتداد محظور لحفظ القلب'
    };
  }

  // 3. AI Nude / Deepfake Generator Pattern Check
  const aiNudeRegex = /(undress|nudify|deepnude|clothoff|strip\s*ai|nude\s*generator|promptchan)/i;
  if (aiNudeRegex.test(raw) || aiNudeRegex.test(normalized) || aiNudeRegex.test(deSpaced)) {
    return {
      blocked: true,
      reason: 'اكتشاف أداة توليد صور غير لائقة بالذكاء الاصطناعي'
    };
  }

  // 4. Check for innocent safe words (e.g. "إكسل", "تاكسي", "أوكسجين") to prevent false positives on short 2-3 char substrings
  const isSafeInnocentContext = INNOCENT_SAFEWORDS.some(word => normalized.includes(word) || raw.includes(word));

  // 5. Keyword Checks (Arabic dialects, English, global slang, leetspeak, de-spaced)
  for (const keyword of EXPLICIT_KEYWORDS) {
    const isArabic = /[\u0600-\u06FF]/.test(keyword);
    const normKeyword = normalizeSearchInput(keyword).normalized;

    if (isArabic) {
      // Short 2-3 letter Arabic terms like 'كس', 'زب', 'طيز'
      if (normKeyword.length <= 3) {
        if (isSafeInnocentContext) continue;

        const shortRegex = new RegExp(`(?:^|[^a-zA-Z0-9\\u0621-\\u064A])(ال|بال|فال|كال|لل)?${normKeyword}(ها|هم|هن|ين|ون|ات|ي)?(?:$|[^a-zA-Z0-9\\u0621-\\u064A])`, 'u');
        if (shortRegex.test(normalized) || shortRegex.test(deSpaced)) {
          return {
            blocked: true,
            reason: 'اكتشاف لفظ غير لائق في نتائج البحث'
          };
        }
      } else {
        // Longer Arabic phrase/term substring check (including deSpaced matching e.g. 'س ك س' -> 'سكس')
        if (
          raw.includes(keyword) || 
          normalized.includes(keyword) || 
          normalized.includes(normKeyword) ||
          deSpaced.includes(normKeyword.replace(/\s+/g, ''))
        ) {
          return {
            blocked: true,
            reason: 'اكتشاف عبارة أو لفظ غير لائق لحفظ البصر'
          };
        }
      }
    } else {
      // Non-Arabic word boundary & leet/de-spaced check
      if (normKeyword.length <= 3 && isSafeInnocentContext) continue;

      const regexRaw = new RegExp(`(?:^|[^a-z0-9])${keyword}(?:[^a-z0-9]|$)`, 'i');
      const regexNorm = new RegExp(`(?:^|[^a-z0-9])${normKeyword}(?:[^a-z0-9]|$)`, 'i');

      const matchesRegex = regexRaw.test(raw) || regexNorm.test(normalized);
      const matchesDeSpaced = normKeyword.length > 3 && deSpaced.includes(normKeyword.replace(/\s+/g, ''));

      if (matchesRegex || matchesDeSpaced) {
        return {
          blocked: true,
          reason: 'اكتشاف كلمة أو رموش بحث غير لائقة'
        };
      }
    }
  }

  // 6. Dynamic Fuzzy Search Algorithm (Levenshtein Distance & Phonetic Similarity Detection)
  // Tokenize normalized input by space/punctuation to analyze typos/obfuscation per word
  const inputTokens = normalized.split(/[\s._\-+/\\,*#@!$%^&()=[\]{}|;:'"<>?]+/g).filter(t => t.length >= 3);

  if (!isSafeInnocentContext && inputTokens.length > 0) {
    for (const token of inputTokens) {
      // Ignore token if it's explicitly in the innocent safewords
      if (INNOCENT_SAFEWORDS.includes(token)) continue;

      for (const keyword of EXPLICIT_KEYWORDS) {
        const normKeyword = normalizeSearchInput(keyword).normalized;
        
        // Apply fuzzy matching algorithm
        if (isFuzzyMatch(token, normKeyword)) {
          return {
            blocked: true,
            reason: 'اكتشاف كلمة أو إيحاء غير لائق عبر خوارزمية البحث الضبابي الذكية (Fuzzy Detection Engine)'
          };
        }
      }
    }
  }

  // 7. Smart Combination Heuristics (e.g., (+18 / للكبار) combined with (رقص / بنات / شات / عاري / بدون ملابس))
  const ageRestrictedTerms = ['+18', '18+', 'للكبار فقط', 'غير عائلي', 'ممنوع من العرض', 'adults only', 'nsfw'];
  const mediaRiskTerms = ['رقص', 'بنات', 'شات', 'تعارف', 'تسريبات', 'كاميرا', 'بدون ملابس', 'عاري', 'عريانة', 'leak', 'leaks', 'nudes', 'hot'];

  const hasAgeRestriction = ageRestrictedTerms.some(term => raw.includes(term) || normalized.includes(term));
  const hasRiskMedia = mediaRiskTerms.some(term => raw.includes(term) || normalized.includes(term));

  if (hasAgeRestriction && hasRiskMedia) {
    return {
      blocked: true,
      reason: 'اكتشاف محاولة بحث دقيقة تجمع بين وسم +18 ومحتوى عارٍ أو غير لائق'
    };
  }

  return { blocked: false };
}

/**
 * Generates declarativeNetRequest rules for Chrome / Edge Extension Manifest V3
 * containing the full master blocklist (480+ domains) plus custom user domains.
 */
export function generateDeclarativeNetRequestRules(customDomains: string[] = []) {
  const allDomains = Array.from(new Set([
    ...DEFAULT_BLOCKED_DOMAINS,
    ...customDomains.map(d => d.trim().toLowerCase()).filter(Boolean)
  ]));

  return allDomains.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: 'block' },
    condition: {
      urlFilter: domain,
      resourceTypes: ['main_frame', 'sub_frame']
    }
  }));
}

/**
 * Exports the full master blocklist (480+ domains) formatted as JSON string for rules.json
 */
export function generateDeclarativeNetRequestRulesJson(customDomains: string[] = []): string {
  const rules = generateDeclarativeNetRequestRules(customDomains);
  return JSON.stringify(rules, null, 2);
}

