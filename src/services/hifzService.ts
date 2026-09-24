import { HifzState, HifzStrength, HifzLog, HifzPageItem } from '../types';
import { loadStored, saveStored } from '../utils/storage';
import { SURAHS_METADATA } from './quranService';
import { QURAN_AJZA } from '../data/quranNavigationData';

const STORAGE_HIFZ_KEY = 'raqeeb_hifz_state_v1';

export const INITIAL_HIFZ_STATE: HifzState = {
  memorizedPages: [],
  pagesStatus: {},
  surahsStatus: {},
  dailyTarget: {
    newPagesCount: 1, // 1 page new memorization
    revisionPagesCount: 10 // 10 pages revision
  },
  dailyRevisionPlan: {
    newHifzStartPage: 1,
    newHifzEndPage: 1,
    revisionStartPage: 1,
    revisionEndPage: 10,
    completedToday: false,
    lastCompletedDate: ''
  },
  historyLogs: []
};

/**
 * Load Hifz and Revision state from local storage
 */
export function loadHifzState(): HifzState {
  const loaded = loadStored<HifzState>(STORAGE_HIFZ_KEY, INITIAL_HIFZ_STATE);
  
  // Reset daily completed status if new day
  const today = new Date().toISOString().split('T')[0];
  if (loaded.dailyRevisionPlan.lastCompletedDate !== today && loaded.dailyRevisionPlan.completedToday) {
    loaded.dailyRevisionPlan.completedToday = false;
  }

  return loaded;
}

/**
 * Save Hifz state
 */
export function saveHifzState(state: HifzState): void {
  saveStored(STORAGE_HIFZ_KEY, state);
}

/**
 * Toggle single page memorization status
 */
export function togglePageHifz(pageNumber: number, strength: HifzStrength = 'good'): HifzState {
  const safePage = Math.max(1, Math.min(604, pageNumber));
  const current = loadHifzState();
  const isAlready = current.memorizedPages.includes(safePage);
  const today = new Date().toISOString().split('T')[0];

  let newPages = [...current.memorizedPages];
  const newPagesStatus = { ...current.pagesStatus };

  if (isAlready) {
    newPages = newPages.filter(p => p !== safePage);
    delete newPagesStatus[safePage];
  } else {
    newPages.push(safePage);
    newPages.sort((a, b) => a - b);
    newPagesStatus[safePage] = {
      strength,
      lastReviewed: today,
      repetitions: (newPagesStatus[safePage]?.repetitions || 0) + 1
    };
  }

  const updated: HifzState = {
    ...current,
    memorizedPages: newPages,
    pagesStatus: newPagesStatus
  };

  saveHifzState(updated);
  return updated;
}

/**
 * Set strength rating for a specific page (mastered, good, needs_practice)
 */
export function setPageStrength(pageNumber: number, strength: HifzStrength): HifzState {
  const safePage = Math.max(1, Math.min(604, pageNumber));
  const current = loadHifzState();
  const today = new Date().toISOString().split('T')[0];

  let newPages = [...current.memorizedPages];
  if (!newPages.includes(safePage)) {
    newPages.push(safePage);
    newPages.sort((a, b) => a - b);
  }

  const existing = current.pagesStatus[safePage] || {
    repetitions: 0,
    lastReviewed: today,
    strength: 'good'
  };

  const updated: HifzState = {
    ...current,
    memorizedPages: newPages,
    pagesStatus: {
      ...current.pagesStatus,
      [safePage]: {
        ...existing,
        strength,
        lastReviewed: today,
        repetitions: existing.repetitions + 1
      }
    }
  };

  saveHifzState(updated);
  return updated;
}

/**
 * Mark an entire Surah as memorized or not
 */
export function toggleSurahHifz(surahNumber: number, isMemorized: boolean, strength: HifzStrength = 'good'): HifzState {
  const current = loadHifzState();
  const surah = SURAHS_METADATA.find(s => s.number === surahNumber);
  if (!surah) return current;

  // Determine start and end page for surah
  const startPage = surah.pageNumber;
  const nextSurah = SURAHS_METADATA.find(s => s.number === surahNumber + 1);
  const endPage = nextSurah ? Math.max(startPage, nextSurah.pageNumber - 1) : 604;
  const today = new Date().toISOString().split('T')[0];

  let newPages = new Set(current.memorizedPages);
  const newPagesStatus = { ...current.pagesStatus };

  for (let p = startPage; p <= endPage; p++) {
    if (isMemorized) {
      newPages.add(p);
      newPagesStatus[p] = {
        strength,
        lastReviewed: today,
        repetitions: (newPagesStatus[p]?.repetitions || 0) + 1
      };
    } else {
      newPages.delete(p);
      delete newPagesStatus[p];
    }
  }

  const updatedSurahs = {
    ...current.surahsStatus,
    [surahNumber]: {
      isMemorized,
      strength,
      lastReviewed: today,
      repetitions: ((current.surahsStatus[surahNumber]?.repetitions) || 0) + (isMemorized ? 1 : 0)
    }
  };

  const updated: HifzState = {
    ...current,
    memorizedPages: Array.from(newPages).sort((a, b) => a - b),
    pagesStatus: newPagesStatus,
    surahsStatus: updatedSurahs
  };

  saveHifzState(updated);
  return updated;
}

/**
 * Mark an entire Juz as memorized or not
 */
export function toggleJuzHifz(juzNumber: number, isMemorized: boolean, strength: HifzStrength = 'good'): HifzState {
  const current = loadHifzState();
  const juzItem = QURAN_AJZA.find(j => j.juzNumber === juzNumber);
  if (!juzItem) return current;

  const startPage = juzItem.pageNumber;
  const nextJuz = QURAN_AJZA.find(j => j.juzNumber === juzNumber + 1);
  const endPage = nextJuz ? Math.max(startPage, nextJuz.pageNumber - 1) : 604;
  const today = new Date().toISOString().split('T')[0];

  let newPages = new Set(current.memorizedPages);
  const newPagesStatus = { ...current.pagesStatus };

  for (let p = startPage; p <= endPage; p++) {
    if (isMemorized) {
      newPages.add(p);
      newPagesStatus[p] = {
        strength,
        lastReviewed: today,
        repetitions: (newPagesStatus[p]?.repetitions || 0) + 1
      };
    } else {
      newPages.delete(p);
      delete newPagesStatus[p];
    }
  }

  const updated: HifzState = {
    ...current,
    memorizedPages: Array.from(newPages).sort((a, b) => a - b),
    pagesStatus: newPagesStatus
  };

  saveHifzState(updated);
  return updated;
}

/**
 * Record a revision or new memorization session
 */
export function recordHifzSession(params: {
  type: 'new_hifz' | 'revision' | 'testing';
  pageStart: number;
  pageEnd: number;
  surahName?: string;
  notes?: string;
  strength?: HifzStrength;
}): HifzState {
  const current = loadHifzState();
  const today = new Date().toISOString().split('T')[0];
  const newLog: HifzLog = {
    id: `hifz_${Date.now()}_${crypto.randomUUID().split("-")[0]}`,
    date: today,
    type: params.type,
    pageStart: params.pageStart,
    pageEnd: params.pageEnd,
    surahName: params.surahName,
    notes: params.notes
  };

  // If new_hifz, mark those pages as memorized
  let newPages = new Set(current.memorizedPages);
  const newPagesStatus = { ...current.pagesStatus };

  for (let p = params.pageStart; p <= params.pageEnd; p++) {
    newPages.add(p);
    const existing = newPagesStatus[p];
    newPagesStatus[p] = {
      strength: params.strength || existing?.strength || 'good',
      lastReviewed: today,
      repetitions: (existing?.repetitions || 0) + 1
    };
  }

  const updated: HifzState = {
    ...current,
    memorizedPages: Array.from(newPages).sort((a, b) => a - b),
    pagesStatus: newPagesStatus,
    historyLogs: [newLog, ...current.historyLogs].slice(0, 50)
  };

  saveHifzState(updated);
  return updated;
}

/**
 * Update daily Hifz and Muraja'ah target pages
 */
export function updateHifzDailyTargets(newPages: number, revisionPages: number): HifzState {
  const current = loadHifzState();
  const updated: HifzState = {
    ...current,
    dailyTarget: {
      newPagesCount: Math.max(1, Math.min(20, newPages)),
      revisionPagesCount: Math.max(1, Math.min(100, revisionPages))
    }
  };
  saveHifzState(updated);
  return updated;
}

/**
 * Mark daily revision plan as completed for today
 */
export function markDailyPlanCompleted(completed: boolean): HifzState {
  const current = loadHifzState();
  const today = new Date().toISOString().split('T')[0];
  const updated: HifzState = {
    ...current,
    dailyRevisionPlan: {
      ...current.dailyRevisionPlan,
      completedToday: completed,
      lastCompletedDate: today
    }
  };
  saveHifzState(updated);
  return updated;
}

/**
 * Compute detailed statistics of memorized Quran
 */
export function getHifzStatistics(state: HifzState) {
  const totalPages = state.memorizedPages.length;
  const percentage = Number(((totalPages / 604) * 100).toFixed(1));

  let masteredCount = 0;
  let goodCount = 0;
  let needsPracticeCount = 0;

  Object.values(state.pagesStatus).forEach(item => {
    if (item.strength === 'mastered') masteredCount++;
    else if (item.strength === 'good') goodCount++;
    else if (item.strength === 'needs_practice') needsPracticeCount++;
  });

  // Calculate completed Juz
  let completedJuzCount = 0;
  for (let j = 1; j <= 30; j++) {
    const juzItem = QURAN_AJZA.find(x => x.juzNumber === j);
    if (!juzItem) continue;
    const startP = juzItem.pageNumber;
    const nextJ = QURAN_AJZA.find(x => x.juzNumber === j + 1);
    const endP = nextJ ? nextJ.pageNumber - 1 : 604;
    
    let allInJuz = true;
    for (let p = startP; p <= endP; p++) {
      if (!state.memorizedPages.includes(p)) {
        allInJuz = false;
        break;
      }
    }
    if (allInJuz && endP >= startP) {
      completedJuzCount++;
    }
  }

  return {
    totalPages,
    percentage,
    masteredCount,
    goodCount,
    needsPracticeCount,
    completedJuzCount
  };
}
