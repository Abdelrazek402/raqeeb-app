import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  Compass, 
  ChevronLeft,
  Filter,
  CheckCircle2,
  Sparkles,
  Zap,
  Hash,
  ArrowRight,
  Loader2,
  Bookmark,
  Check,
  Trash2,
  Plus,
  Pin,
  Calendar,
  BookmarkCheck
} from 'lucide-react';
import { 
  QURAN_AJZA, 
  QURAN_AHZAB, 
  QURAN_QUARTERS, 
  QUARTER_POSITION_LABELS,
  QuranJuz,
  QuranHizb,
  QuranQuarter
} from '../data/quranNavigationData';
import { 
  SURAHS_METADATA, 
  getSavedBookmarks, 
  addSavedBookmark, 
  deleteSavedBookmark, 
  setBookmark,
  getSurahForPage,
  getJuzForPage,
  loadKhatmahState
} from '../services/quranService';
import { getPageForAyah } from '../data/quranPageStarts';
import { 
  searchQuranByKeyword, 
  findMatchRanges, 
  QuranSearchResultItem 
} from '../services/quranSearchService';
import { QuranBookmarkItem } from '../types';

export type QuranNavTab = 'direct' | 'search' | 'bookmarks' | 'juz' | 'hizb' | 'quarter' | 'surah';

interface QuranNavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: number;
  onSelectPage: (page: number, label?: string) => void;
  initialTab?: QuranNavTab;
  onBookmarkUpdated?: () => void;
}

const POPULAR_SEARCH_SUGGESTIONS = [
  'الصلاة',
  'الصبر',
  'الجنة',
  'الرحمة',
  'التقوى',
  'المغفرة',
  'الوالدين',
  'التوبة',
  'الهدى',
  'النور'
];

export const QuranNavigatorModal: React.FC<QuranNavigatorModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  onSelectPage,
  initialTab = 'direct',
  onBookmarkUpdated
}) => {
  const [activeTab, setActiveTab] = useState<QuranNavTab>(initialTab);

  // Sync tab when initialTab prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Bookmarks State
  const [bookmarksList, setBookmarksList] = useState<QuranBookmarkItem[]>([]);
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const [bookmarkSuccessNotice, setBookmarkSuccessNotice] = useState<string | null>(null);
  const [primaryBookmarkPage, setPrimaryBookmarkPage] = useState<number>(1);

  // Sync bookmarks list whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setBookmarksList(getSavedBookmarks());
      const k = loadKhatmahState();
      setPrimaryBookmarkPage(k.bookmarkPage || 1);
    }
  }, [isOpen]);

  const handleAddCurrentPageAsBookmark = () => {
    const res = addSavedBookmark(currentPage, newBookmarkNote.trim() || undefined);
    setBookmarksList(res.bookmarks);
    setPrimaryBookmarkPage(res.updatedKhatmah.bookmarkPage);
    setNewBookmarkNote('');
    setBookmarkSuccessNotice(`تم حفظ صفحة ${currentPage} كفاصلة بنجاح!`);
    setTimeout(() => setBookmarkSuccessNotice(null), 3000);
    onBookmarkUpdated?.();
  };

  const handleDeleteBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = deleteSavedBookmark(id);
    setBookmarksList(updated);
    onBookmarkUpdated?.();
  };

  const handleSetPrimaryBookmark = (item: QuranBookmarkItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = setBookmark(item.page, item.surahNumber);
    setPrimaryBookmarkPage(updated.bookmarkPage);
    setBookmarkSuccessNotice(`تم تعيين صفحة ${item.page} (${item.surahName}) كفاصلة رئيسية للختمة`);
    setTimeout(() => setBookmarkSuccessNotice(null), 3000);
    onBookmarkUpdated?.();
  };

  const currentPageSurah = useMemo(() => getSurahForPage(currentPage), [currentPage]);
  const currentPageJuz = useMemo(() => getJuzForPage(currentPage), [currentPage]);

  // General list filter query for Juz, Hizb, Quarter, Surah
  const [listFilterQuery, setListFilterQuery] = useState('');
  const [selectedJuzFilter, setSelectedJuzFilter] = useState<number | 'all'>('all');

  // Direct Ayah Jump States
  const [directSurahNumber, setDirectSurahNumber] = useState<number>(1);
  const [directAyahInput, setDirectAyahInput] = useState<number>(1);

  // Search by Keyword States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<QuranSearchResultItem[]>([]);
  const [totalMatchesCount, setTotalMatchesCount] = useState<number>(0);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when switching to search tab
  useEffect(() => {
    if (isOpen && activeTab === 'search') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeTab]);

  // Selected Surah for Ayah navigation
  const selectedSurahMeta = useMemo(() => {
    return SURAHS_METADATA.find(s => s.number === directSurahNumber) || SURAHS_METADATA[0];
  }, [directSurahNumber]);

  // Calculated page for selected Surah + Ayah
  const calculatedAyahPage = useMemo(() => {
    const validAyah = Math.max(1, Math.min(directAyahInput, selectedSurahMeta.numberOfAyahs));
    return getPageForAyah(directSurahNumber, validAyah);
  }, [directSurahNumber, directAyahInput, selectedSurahMeta]);

  if (!isOpen) return null;

  // Handle Search Execution
  const executeSearch = async (queryText?: string) => {
    const term = (queryText ?? searchKeyword).trim();
    if (!term || term.length < 2) {
      setSearchError('يرجى إدخال حرفين على الأقل للبحث');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const response = await searchQuranByKeyword(term, 150);
      setSearchResults(response.matches);
      setTotalMatchesCount(response.count);
      setHasPerformedSearch(true);
    } catch (err) {
      setSearchError('تعذر إجراء البحث عبر الإنترنت، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (page: number, label: string) => {
    onSelectPage(page, label);
    onClose();
  };

  // Filtered Surahs
  const filteredSurahs = SURAHS_METADATA.filter(s => 
    s.name.includes(listFilterQuery.trim()) ||
    s.englishName.toLowerCase().includes(listFilterQuery.trim().toLowerCase()) ||
    String(s.number).includes(listFilterQuery.trim())
  );

  // Filtered Ajza
  const filteredAjza = QURAN_AJZA.filter(j => 
    `جزء ${j.juzNumber}`.includes(listFilterQuery.trim()) ||
    String(j.juzNumber) === listFilterQuery.trim() ||
    j.name.includes(listFilterQuery.trim()) ||
    j.surahName.includes(listFilterQuery.trim()) ||
    j.snippet.includes(listFilterQuery.trim())
  );

  // Filtered Ahzab
  const filteredAhzab = QURAN_AHZAB.filter(h => 
    `حزب ${h.hizbNumber}`.includes(listFilterQuery.trim()) ||
    String(h.hizbNumber) === listFilterQuery.trim() ||
    h.surahName.includes(listFilterQuery.trim()) ||
    h.snippet.includes(listFilterQuery.trim())
  );

  // Filtered Quarters
  const filteredQuarters = QURAN_QUARTERS.filter(q => {
    if (selectedJuzFilter !== 'all' && q.juzNumber !== selectedJuzFilter) {
      return false;
    }
    if (!listFilterQuery.trim()) return true;
    const qTerm = listFilterQuery.trim();
    return (
      String(q.quarterNumber) === qTerm ||
      q.surahName.includes(qTerm) ||
      q.snippet.includes(qTerm) ||
      `حزب ${q.hizbNumber}`.includes(qTerm) ||
      `جزء ${q.juzNumber}`.includes(qTerm)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>فهرس المصحف والانتقال الشامل</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono">
                  ص {currentPage}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                الانتقال برقم الآية • بحث بالكلمة في الآيات • الفواصل المحفوظة • فهرس المصحف
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Tabs */}
        <div className="px-3 sm:px-6 pt-2.5 pb-1 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs font-bold">
            <button
              onClick={() => setActiveTab('direct')}
              className={`py-2 px-3 sm:px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'direct' 
                  ? 'bg-teal-600 text-white shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>الانتقال برقم الآية</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-3 sm:px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'search' 
                  ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>بحث بالكلمة في الآيات</span>
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`py-2 px-3 sm:px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'bookmarks' 
                  ? 'bg-amber-600 text-white shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${activeTab === 'bookmarks' ? 'fill-white' : 'text-amber-600'}`} />
              <span>الفواصل المحفوظة ({bookmarksList.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('surah'); setListFilterQuery(''); }}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer shrink-0 ${
                activeTab === 'surah' 
                  ? 'bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              السور (114)
            </button>

            <button
              onClick={() => { setActiveTab('juz'); setListFilterQuery(''); }}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer shrink-0 ${
                activeTab === 'juz' 
                  ? 'bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              الأجزاء (30)
            </button>

            <button
              onClick={() => { setActiveTab('hizb'); setListFilterQuery(''); }}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer shrink-0 ${
                activeTab === 'hizb' 
                  ? 'bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              الأحزاب (60)
            </button>

            <button
              onClick={() => { setActiveTab('quarter'); setListFilterQuery(''); }}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer shrink-0 ${
                activeTab === 'quarter' 
                  ? 'bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              الأرباع (240)
            </button>
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[62vh]">
          {/* ========================================================================= */}
          {/* TAB 1: SEARCH BY WORD IN AYAT */}
          {/* ========================================================================= */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              {/* Search Box */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4 space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeSearch();
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="اكتب كلمة أو عبارة للبحث (مثال: الصلاة، الجنة، الصبر، الرحمة)..."
                      className="w-full pr-11 pl-10 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                    />
                    {searchKeyword && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchKeyword('');
                          setSearchResults([]);
                          setHasPerformedSearch(false);
                          searchInputRef.current?.focus();
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSearching || !searchKeyword.trim()}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري البحث...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>بحث</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                  <span className="text-slate-500 font-medium ml-1">كلمات شائعة:</span>
                  {POPULAR_SEARCH_SUGGESTIONS.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => {
                        setSearchKeyword(word);
                        executeSearch(word);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer text-[11px]"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Status & Errors */}
              {searchError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                  {searchError}
                </div>
              )}

              {/* Results Count Header */}
              {hasPerformedSearch && (
                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                  <div>
                    تم العثور على <strong className="text-emerald-700 font-bold">{totalMatchesCount}</strong> موضعاً لكلمة «<strong>{searchKeyword}</strong>»:
                  </div>
                  {totalMatchesCount > searchResults.length && (
                    <div className="text-[11px] text-slate-400">
                      (معروض أول {searchResults.length} آية)
                    </div>
                  )}
                </div>
              )}

              {/* Results List */}
              {isSearching ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    جاري البحث في جميع آيات القرآن الكريم...
                  </p>
                </div>
              ) : hasPerformedSearch && searchResults.length === 0 ? (
                <div className="py-16 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">لم يتم العثور على نتائج</div>
                  <div className="text-xs text-slate-400 max-w-sm mx-auto">
                    تأكد من كتابة الكلمة بصورة صحيحة بدون تشكيل أو جرب كلمة بحثية أخرى.
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((item) => {
                    const matchRanges = findMatchRanges(item.text, searchKeyword);

                    return (
                      <div
                        key={item.number}
                        className="p-4 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-emerald-400 rounded-2xl transition-all space-y-3 shadow-2xs group"
                      >
                        {/* Verse Meta Row */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">
                              {item.surahName}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-bold">
                              الآية {item.numberInSurah}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                              الجزء {item.juzNumber}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200/60">
                              صفحة {item.pageNumber}
                            </span>
                            <button
                              onClick={() => handleSelect(item.pageNumber, `${item.surahName} آية ${item.numberInSurah}`)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>انتقال</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Verse Text with Highlighted Keywords */}
                        <div className="text-base leading-loose font-['Amiri',serif] text-slate-800 text-justify">
                          {matchRanges.length === 0 ? (
                            item.text
                          ) : (
                            renderHighlightedText(item.text, matchRanges)
                          )}
                          <span className="inline-block mx-1.5 text-xs text-emerald-700 font-sans font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            ﴿{item.numberInSurah}﴾
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty state when tab is first opened */
                <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      محرك البحث القرآني الدقيق
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      ابحث عن أي لفظ أو جملة في القرآن الكريم للوصول إلى الآيات، أسماء السور، وأرقام الصفحات مع إمكانية الانتقال الفوري للمصحف.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DIRECT NAVIGATION BY AYAH ONLY (SURAH + AYAH NUMBER) */}
          {/* ========================================================================= */}
          {activeTab === 'direct' && (
            <div className="space-y-4">
              <div className="p-5 sm:p-6 bg-gradient-to-br from-teal-50/70 via-emerald-50/40 to-white border border-teal-200/90 rounded-3xl space-y-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-teal-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                      <Hash className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-teal-950">انتقال برقم الآية (السورة + الآية)</div>
                      <div className="text-xs text-teal-700">حدد السورة الشريفة ورقم الآية للانتقال مباشرة إلى صفحتها بالمصحف</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-2xl border border-teal-200 text-teal-900 font-bold text-xs shadow-2xs">
                    <span>تقع في صفحة:</span>
                    <span className="font-mono text-sm text-teal-700 font-extrabold">{calculatedAyahPage}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  {/* Surah Dropdown */}
                  <div className="sm:col-span-7 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">السورة الشريفة (114 سورة):</label>
                    <select
                      value={directSurahNumber}
                      onChange={(e) => {
                        const newSurahNum = Number(e.target.value);
                        setDirectSurahNumber(newSurahNum);
                        setDirectAyahInput(1);
                      }}
                      className="w-full py-3 px-3.5 bg-white border border-teal-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer shadow-2xs"
                    >
                      {SURAHS_METADATA.map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. سورة {s.name} ({s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {s.numberOfAyahs} آية)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ayah Number Input */}
                  <div className="sm:col-span-5 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      رقم الآية (1 إلى {selectedSurahMeta.numberOfAyahs}):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={selectedSurahMeta.numberOfAyahs}
                        value={directAyahInput}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setDirectAyahInput(Math.max(1, Math.min(val, selectedSurahMeta.numberOfAyahs)));
                          } else {
                            setDirectAyahInput(1);
                          }
                        }}
                        className="w-full py-3 px-3 bg-white border border-teal-300 rounded-2xl text-center font-mono font-bold text-base text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setDirectAyahInput(1)}
                        className="px-2.5 py-3 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer shrink-0 transition-colors"
                        title="أول آية في السورة"
                      >
                        الآية 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirectAyahInput(selectedSurahMeta.numberOfAyahs)}
                        className="px-2.5 py-3 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer shrink-0 transition-colors"
                        title="آخر آية في السورة"
                      >
                        آخر آية
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metadata card about destination */}
                <div className="bg-white/80 p-4 rounded-2xl border border-teal-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 flex-wrap">
                    <span className="font-bold text-teal-900">سورة {selectedSurahMeta.name}</span>
                    <span className="text-slate-400">•</span>
                    <span>الآية رقم <strong className="font-mono text-teal-800">{directAyahInput}</strong> من أصل {selectedSurahMeta.numberOfAyahs} آية</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                      {selectedSurahMeta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelect(calculatedAyahPage, `${selectedSurahMeta.name} آية ${directAyahInput}`)}
                    className="w-full sm:w-auto py-2.5 px-6 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>الانتقال فوراً إلى صفحة {calculatedAyahPage}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: SAVED BOOKMARKS LIST & PINNING */}
          {/* ========================================================================= */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              {/* Success Notification if any action was performed */}
              {bookmarkSuccessNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{bookmarkSuccessNotice}</span>
                </div>
              )}

              {/* Quick Pin / Add Current Page as Bookmark */}
              <div className="p-4 bg-gradient-to-r from-amber-50/80 via-amber-100/40 to-slate-50 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                      <Bookmark className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                        حفظ الصفحة الحالية (ص {currentPage}) كفاصلة
                      </h4>
                      <p className="text-[11px] text-amber-900/80 font-medium">
                        سورة {currentPageSurah.name} • الجزء {currentPageJuz}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-lg border border-amber-300/60">
                    صفحة {currentPage}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newBookmarkNote}
                    onChange={(e) => setNewBookmarkNote(e.target.value)}
                    placeholder="ملاحظة أو عنوان للفاصلة (اختياري، مثلاً: ورد الصباح، مراجعة)..."
                    className="flex-1 px-3 py-2 bg-white border border-amber-300/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCurrentPageAsBookmark();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCurrentPageAsBookmark}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>حفظ كفاصلة</span>
                  </button>
                </div>
              </div>

              {/* Bookmarks List Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span className="font-bold text-slate-700">قائمة الفواصل المحفوظة ({bookmarksList.length})</span>
                  <span className="text-[11px]">انقر على أي فاصلة للانتقال إليها مباشرة</span>
                </div>

                {bookmarksList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">لا توجد فواصل محفوظة حتى الآن</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        يمكنك حفظ أي صفحة تقف عندها في المصحف لتستأنف قراءتك منها لاحقاً بسهولة.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCurrentPageAsBookmark}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-white" />
                      <span>حفظ الصفحة الحالية (ص {currentPage}) الآن</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 max-h-[48vh] overflow-y-auto pr-1">
                    {bookmarksList.map((bm) => {
                      const isPrimary = bm.page === primaryBookmarkPage;
                      const isCurrent = bm.page === currentPage;
                      const formattedDate = bm.createdAt ? bm.createdAt.split('T')[0] : '';

                      return (
                        <div
                          key={bm.id}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isPrimary
                              ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                              : isCurrent
                              ? 'bg-teal-50/50 border-teal-200'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-sm ${
                              isPrimary
                                ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              <span className="text-xs">ص {bm.page}</span>
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-slate-900">
                                  سورة {bm.surahName}
                                </span>
                                <span className="text-xs text-slate-500">
                                  (الجزء {bm.juzNumber})
                                </span>
                                {isPrimary && (
                                  <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-300">
                                    <Pin className="w-2.5 h-2.5 fill-amber-950" />
                                    <span>فاصلة الختمة الرئيسية</span>
                                  </span>
                                )}
                                {isCurrent && (
                                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-md">
                                    المعروضة حالياً
                                  </span>
                                )}
                              </div>

                              {bm.note && (
                                <p className="text-xs text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md inline-block max-w-full truncate">
                                  📝 {bm.note}
                                </p>
                              )}

                              {formattedDate && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>تم الحفظ: {formattedDate}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleSelect(bm.page, `فاصلة سورة ${bm.surahName} (ص ${bm.page})`)}
                              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                              title="انتقال فوري إلى هذه الصفحة في المصحف"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              <span>انتقال للصفحة</span>
                            </button>

                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={(e) => handleSetPrimaryBookmark(bm, e)}
                                className="p-2 text-slate-500 hover:text-amber-800 hover:bg-amber-100/60 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-amber-200"
                                title="تعيين كفاصلة رئيسية للختمة"
                              >
                                <Pin className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleDeleteBookmark(bm.id, e)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="حذف هذه الفاصلة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: AJZA (ALL 30 COMPLETE) */}
          {/* ========================================================================= */}
          {activeTab === 'juz' && (
            <div className="space-y-3">
              {/* Search input for Ajza */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث برقم الجزء، اسمه، السورة، أو مطلع الآية..."
                  value={listFilterQuery}
                  onChange={(e) => setListFilterQuery(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredAjza.map((juz) => {
                  const isCurrent = currentPage >= juz.pageNumber && currentPage <= juz.endPageNumber;

                  return (
                    <button
                      key={juz.juzNumber}
                      onClick={() => handleSelect(juz.pageNumber, `الجزء ${juz.juzNumber}: ${juz.name}`)}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-xs' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-teal-300 text-slate-800 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                          isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {juz.juzNumber}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
                            <span>الجزء {juz.juzNumber}: {juz.name}</span>
                          </div>
                          <div className="text-[11px] text-teal-800 font-medium">
                            {juz.surahName} (آية {juz.ayahNumberInSurah})
                          </div>
                          <div className="text-[11px] text-slate-500 font-['Amiri',serif] truncate mt-0.5">
                            «{juz.snippet}»
                          </div>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 block">
                          ص {juz.pageNumber} - {juz.endPageNumber}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: AHZAB (60) */}
          {activeTab === 'hizb' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث برقم الحزب، السورة، أو مطلع الآية..."
                  value={listFilterQuery}
                  onChange={(e) => setListFilterQuery(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredAhzab.map((hizb) => (
                  <button
                    key={hizb.hizbNumber}
                    onClick={() => handleSelect(hizb.pageNumber, `الحزب ${hizb.hizbNumber}`)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50 text-right transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                        {hizb.hizbNumber}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>الحزب {hizb.hizbNumber}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            (الجزء {hizb.juzNumber})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-['Amiri',serif] truncate mt-0.5">
                          «{hizb.snippet}»
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border border-slate-200">
                        ص {hizb.pageNumber}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: QUARTERS (240) */}
          {activeTab === 'quarter' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ابحث برقم الربع، السورة، أو كلمات البداية..."
                    value={listFilterQuery}
                    onChange={(e) => setListFilterQuery(e.target.value)}
                    className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <span className="text-xs text-slate-500 shrink-0 font-medium">تصفية بالجزء:</span>
                  <select
                    value={selectedJuzFilter}
                    onChange={(e) => setSelectedJuzFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
                  >
                    <option value="all">كل الأجزاء (1-30)</option>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                      <option key={j} value={j}>الجزء {j}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredQuarters.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    لا توجد أرباع تطابق معايير البحث
                  </div>
                ) : (
                  filteredQuarters.map((quarter) => {
                    const positionLabel = QUARTER_POSITION_LABELS[quarter.quarterInHizb] || `ربع ${quarter.quarterInHizb}`;

                    return (
                      <button
                        key={quarter.id}
                        onClick={() => handleSelect(quarter.pageNumber, `الربع ${quarter.quarterNumber}: ${quarter.snippet}`)}
                        className="w-full p-3 rounded-2xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50 text-right transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                            {quarter.quarterNumber}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              <span>{quarter.surahName}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">
                                {positionLabel} • حزب {quarter.hizbNumber} (جزء {quarter.juzNumber})
                              </span>
                            </div>
                            <div className="text-xs text-teal-900 font-['Amiri',serif] truncate mt-1 group-hover:text-teal-700">
                              «{quarter.snippet}...»
                            </div>
                          </div>
                        </div>

                        <div className="text-left shrink-0">
                          <span className="text-xs font-mono font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-200/60">
                            صفحة {quarter.pageNumber}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: SURAHS (114) */}
          {activeTab === 'surah' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث باسم السورة، رقمها، أو نوعها..."
                  value={listFilterQuery}
                  onChange={(e) => setListFilterQuery(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredSurahs.map((surah) => (
                  <button
                    key={surah.number}
                    onClick={() => handleSelect(surah.pageNumber, `سورة ${surah.name}`)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50 text-right transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                        {surah.number}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          سورة {surah.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.numberOfAyahs} آية
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border border-slate-200">
                        ص {surah.pageNumber}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>الصفحة المعروضة حالياً بالمصحف:</span>
            <span className="font-mono font-bold text-teal-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              صفحة {currentPage}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper to slice and highlight matched substrings safely
 */
function renderHighlightedText(text: string, ranges: [number, number][]) {
  if (!ranges || ranges.length === 0) return text;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  ranges.forEach(([start, end], idx) => {
    if (start > lastIndex) {
      elements.push(text.slice(lastIndex, start));
    }
    elements.push(
      <mark
        key={idx}
        className="bg-amber-200/90 text-amber-950 font-bold px-1 py-0.5 rounded-sm shadow-2xs"
      >
        {text.slice(start, end)}
      </mark>
    );
    lastIndex = end;
  });

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return <>{elements}</>;
}
