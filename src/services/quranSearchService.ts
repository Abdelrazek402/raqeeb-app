import { getPageForAyah } from '../data/quranPageStarts';

export function getJuzForPage(pageNumber: number): number {
  if (pageNumber <= 21) return 1;
  return Math.min(30, Math.floor((pageNumber - 2) / 20) + 1);
}

export interface QuranSearchResultItem {
  number: number; // Global ayah number (1 - 6236)
  surahNumber: number;
  surahName: string;
  surahEnglishName?: string;
  numberInSurah: number;
  text: string;
  pageNumber: number;
  juzNumber: number;
}

export interface QuranSearchResponse {
  query: string;
  totalCount: number;
  matches: QuranSearchResultItem[];
}

// In-memory cache for fast search retrieval
const searchCache = new Map<string, QuranSearchResultItem[]>();

/**
 * Remove Arabic diacritics and normalize letters for flexible matching
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Tashkeel
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

/**
 * Identify exact start and end character indices in the original diacritized text
 * that correspond to the search query, allowing accurate UI highlighting
 */
export function findMatchRanges(original: string, query: string): [number, number][] {
  const normQuery = normalizeArabic(query);
  if (!normQuery) return [];

  // Map each normalized index to original character index
  const origIndices: number[] = [];
  let normOriginal = '';
  
  for (let i = 0; i < original.length; i++) {
    const ch = original[i];
    const isDiacritic = /[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(ch);
    if (!isDiacritic) {
      origIndices.push(i);
      let normCh = ch;
      if (/[إأآا]/.test(ch)) normCh = 'ا';
      else if (ch === 'ى') normCh = 'ي';
      else if (ch === 'ة') normCh = 'ه';
      normOriginal += normCh;
    }
  }

  const ranges: [number, number][] = [];
  let start = 0;
  while ((start = normOriginal.indexOf(normQuery, start)) !== -1) {
    const origStart = origIndices[start];
    const normEnd = start + normQuery.length - 1;
    // For original end, capture character and any trailing diacritics
    let origEnd = (origIndices[normEnd] ?? original.length - 1) + 1;
    while (origEnd < original.length && /[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(original[origEnd])) {
      origEnd++;
    }
    ranges.push([origStart, origEnd]);
    start += normQuery.length;
  }
  return ranges;
}

/**
 * Execute full-text search across the Holy Quran text via AlQuran Cloud
 * Returns matching verses with exact page, surah, ayah, and juz metadata
 */
export async function searchQuranByKeyword(
  rawQuery: string,
  limit = 200
): Promise<{ query: string; count: number; matches: QuranSearchResultItem[] }> {
  const query = rawQuery.trim();
  if (!query || query.length < 2) {
    return { query, count: 0, matches: [] };
  }

  const cacheKey = normalizeArabic(query);
  if (searchCache.has(cacheKey)) {
    const cached = searchCache.get(cacheKey)!;
    return {
      query,
      count: cached.length,
      matches: cached.slice(0, limit)
    };
  }

  try {
    const encoded = encodeURIComponent(query);
    const response = await fetch(`https://api.alquran.cloud/v1/search/${encoded}/all/quran-simple`);
    if (!response.ok) {
      throw new Error(`Search request failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 200 && data.data && Array.isArray(data.data.matches)) {
      const items: QuranSearchResultItem[] = data.data.matches.map((m: any) => {
        const surahNum = Number(m.surah?.number) || 1;
        const ayahNum = Number(m.numberInSurah) || 1;
        const page = getPageForAyah(surahNum, ayahNum);
        return {
          number: m.number,
          surahNumber: surahNum,
          surahName: m.surah?.name || `سورة ${surahNum}`,
          surahEnglishName: m.surah?.englishName,
          numberInSurah: ayahNum,
          text: m.text,
          pageNumber: page,
          juzNumber: getJuzForPage(page)
        };
      });

      // Cache the result
      searchCache.set(cacheKey, items);

      return {
        query,
        count: data.data.count || items.length,
        matches: items.slice(0, limit)
      };
    }
  } catch (err) {
    console.warn('Online Quran search failed:', err);
  }

  return { query, count: 0, matches: [] };
}
