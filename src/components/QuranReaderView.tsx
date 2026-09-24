import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  PlayCircle, 
  PauseCircle, 
  Search, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Compass,
  Loader2,
  Edit3,
  Settings,
  ArrowRight,
  ArrowLeft,
  X,
  Check
} from 'lucide-react';
import { DailyStats, QuranSurah, QuranAyah, QuranReciter, KhatmahState, QuranPageData } from '../types';
import { 
  SURAHS_METADATA, 
  RECITERS_LIST, 
  fetchSurahText, 
  fetchPageText,
  getSurahForPage,
  getJuzForPage,
  getReciterAudioUrl, 
  loadKhatmahState, 
  saveKhatmahState, 
  setBookmark, 
  advanceKhatmah,
  jumpToKhatmahPage,
  updateDailyTarget,
  resetKhatmahProgress
} from '../services/quranService';
import { WhyCardsAccordion } from './WhyCardsAccordion';
import { getSurahTafseer } from '../utils/tafseerData';
import { QuranNavigatorModal, QuranNavTab } from './QuranNavigatorModal';

interface QuranReaderViewProps {
  stats: DailyStats;
  onUpdateStats: (newStats: DailyStats) => void;
  onDailyWirdCompleted?: () => void;
}

export const QuranReaderView: React.FC<QuranReaderViewProps> = ({ stats, onUpdateStats, onDailyWirdCompleted }) => {
  // Khatmah state
  const [khatmah, setKhatmah] = useState<KhatmahState>(loadKhatmahState);
  const [readMode, setReadMode] = useState<'page' | 'surah'>('page');
  const [showTafseer, setShowTafseer] = useState(false);
  
  // Page Reading Mode State (1 - 604)
  const [activePage, setActivePage] = useState<number>(khatmah.currentPage || 1);
  const [pageData, setPageData] = useState<QuranPageData | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Selected surah & reciter (for Surah mode and audio recitation)
  const [selectedSurah, setSelectedSurah] = useState<QuranSurah>(() => {
    return getSurahForPage(khatmah.currentPage || 1);
  });
  const [selectedReciter, setSelectedReciter] = useState<QuranReciter>(RECITERS_LIST[0]);
  
  // Surah text reading
  const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Status notification message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Navigation & Search Modal
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [navigatorInitialTab, setNavigatorInitialTab] = useState<QuranNavTab>('direct');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [targetPagesInput, setTargetPagesInput] = useState<number>(khatmah.dailyPagesTarget || 20);

  const openNavigator = (tab: QuranNavTab = 'direct') => {
    setNavigatorInitialTab(tab);
    setIsNavigatorOpen(true);
  };

  // Load Page text when activePage changes in 'page' mode
  useEffect(() => {
    let isMounted = true;
    setIsLoadingPage(true);
    fetchPageText(activePage).then((data) => {
      if (isMounted) {
        setPageData(data);
        setIsLoadingPage(false);
        const surah = getSurahForPage(activePage);
        setSelectedSurah(surah);
      }
    }).catch(() => {
      if (isMounted) setIsLoadingPage(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activePage]);

  // Load Surah text when selectedSurah changes in 'surah' mode
  useEffect(() => {
    if (readMode !== 'surah') return;
    let isMounted = true;
    setIsLoadingAyahs(true);
    fetchSurahText(selectedSurah.number).then((res) => {
      if (isMounted) {
        setAyahs(res);
        setIsLoadingAyahs(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoadingAyahs(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedSurah.number, readMode]);

  // Clean audio state when switching surah or reciter
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setAudioLoading(false);
    setAudioProgress(0);
    setAudioDuration(0);
  }, [selectedSurah.number, selectedReciter.id]);

  // Audio cleanup on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleAudio = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const primaryUrl = getReciterAudioUrl(selectedReciter.id, selectedSurah.number);
    const fallbackUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${selectedSurah.number}.mp3`;

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }

    setAudioLoading(true);

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration || 0);
      setAudioLoading(false);
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      setAudioLoading(false);
    };

    audio.onerror = () => {
      console.warn('Audio stream error on primary source, trying fallback CDN...');
      if (audio.src !== fallbackUrl) {
        audio.src = fallbackUrl;
        audio.load();
        audio.play().then(() => {
          setIsPlaying(true);
          setAudioLoading(false);
        }).catch(err => {
          console.warn('Fallback stream playback failed:', err);
          setIsPlaying(false);
          setAudioLoading(false);
          showNotice('تعذر تشغيل التلاوة الصوتية حالياً بسبب قيود الاتصال.');
        });
      } else {
        setIsPlaying(false);
        setAudioLoading(false);
        showNotice('تعذر تشغيل التلاوة الصوتية حالياً.');
      }
    };

    if (audio.src !== primaryUrl && audio.src !== fallbackUrl) {
      audio.src = primaryUrl;
    }

    audio.play().then(() => {
      setIsPlaying(true);
      setAudioLoading(false);
    }).catch(err => {
      console.warn('Audio play request interrupted, trying fallback stream:', err);
      if (audio.src !== fallbackUrl) {
        audio.src = fallbackUrl;
        audio.load();
        audio.play().then(() => {
          setIsPlaying(true);
          setAudioLoading(false);
        }).catch(fallbackErr => {
          console.warn('Audio fallback also prevented:', fallbackErr);
          setIsPlaying(false);
          setAudioLoading(false);
          showNotice('انقر مجدداً لتفعيل الإذن بتشغيل الصوت.');
        });
      } else {
        setIsPlaying(false);
        setAudioLoading(false);
      }
    });
  };

  const handleBookmarkCurrent = () => {
    const pageToBookmark = readMode === 'page' ? activePage : (selectedSurah.pageNumber || khatmah.currentPage);
    const updated = setBookmark(pageToBookmark, selectedSurah.number);
    setKhatmah(updated);
    showNotice(`تم حفظ موضع فاصلتك بنجاح: صفحة ${updated.bookmarkPage} (${updated.bookmarkSurahName})`);
  };

  const handleResumeBookmark = () => {
    const targetPage = Math.max(1, Math.min(604, khatmah.bookmarkPage || 1));
    const bookmarkSurah = getSurahForPage(targetPage);
    setSelectedSurah(bookmarkSurah);
    setActivePage(targetPage);
    setReadMode('page');
    const updated = jumpToKhatmahPage(targetPage);
    setKhatmah(updated);
    showNotice(`تم الانتقال لموضع فاصلتك المحفوظ: صفحة ${targetPage} (${bookmarkSurah.name})`);
    
    // Smooth scroll down to reading area
    const readerElement = document.getElementById('mushaf-reading-card');
    if (readerElement) {
      readerElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleIncrementPage = () => {
    const { state, completedNow } = advanceKhatmah(1);
    setKhatmah(state);
    setActivePage(state.currentPage);
    
    // Update daily stats
    const newPagesRead = (stats.quranPagesRead || 0) + 1;
    onUpdateStats({
      ...stats,
      quranPagesRead: newPagesRead,
      streakDays: Math.max(stats.streakDays || 1, 1)
    });

    if (newPagesRead === 1 && onDailyWirdCompleted) {
      onDailyWirdCompleted();
    }

    if (completedNow) {
      showNotice('مبارك! أتممت ختمة كاملة لكتاب الله، جعلها الله نوراً وبركة لك في الدارين!');
    } else {
      showNotice(`تم تسجيل قراءة الصفحة ${state.currentPage - 1} والانتقال للصفحة ${state.currentPage}`);
    }
  };

  const handleDecrementPage = () => {
    if (khatmah.currentPage > 1) {
      const updatedPage = khatmah.currentPage - 1;
      const updated = jumpToKhatmahPage(updatedPage);
      setKhatmah(updated);
      setActivePage(updatedPage);
    }
  };

  const handlePageNavigation = (newPage: number, syncKhatmah: boolean = false) => {
    const safePage = Math.max(1, Math.min(604, newPage));
    setActivePage(safePage);
    if (syncKhatmah) {
      const updated = jumpToKhatmahPage(safePage);
      setKhatmah(updated);
    }
  };

  const handleSelectNavigatorPage = (page: number, label?: string) => {
    setReadMode('page');
    handlePageNavigation(page, true);
    setIsNavigatorOpen(false);
    showNotice(label ? `تم الانتقال بنجاح: ${label}` : `تم الانتقال للصفحة ${page}`);

    // Smooth scroll down to reader
    setTimeout(() => {
      const readerElement = document.getElementById('mushaf-reading-card');
      if (readerElement) {
        readerElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSaveDailyTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetPagesInput >= 1 && targetPagesInput <= 100) {
      const updated = updateDailyTarget(targetPagesInput);
      setKhatmah(updated);
      setIsSettingsModalOpen(false);
      showNotice(`تم تحديث الورد اليومي المستهدف: ${targetPagesInput} صفحة يومياً`);
    }
  };

  const handleResetKhatmah = () => {
    if (window.confirm('هل تود حقاً بدء ختمة جديدة من الصفحة الأولى؟')) {
      const updated = resetKhatmahProgress();
      setKhatmah(updated);
      setActivePage(1);
      setIsSettingsModalOpen(false);
      showNotice('تمت إعادة ضبط الختمة للبدء من الصفحة الأولى بحول الله.');
    }
  };

  const showNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const filteredSurahs = SURAHS_METADATA.filter(s => 
    s.name.includes(searchQuery.trim()) ||
    s.englishName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
    String(s.number).includes(searchQuery.trim())
  );

  const khatmahPercentage = ((khatmah.currentPage / 604) * 100).toFixed(1);
  const remainingPages = Math.max(0, 604 - khatmah.currentPage);
  const estimatedDaysLeft = Math.ceil(remainingPages / (khatmah.dailyPagesTarget || 20));
  const currentSurahForHeader = getSurahForPage(activePage);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-teal-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-teal-700 flex items-center gap-3 text-sm font-bold animate-in fade-in zoom-in-95 duration-200">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Comprehensive Quran Navigator & Search Modal */}
      <QuranNavigatorModal
        isOpen={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
        currentPage={activePage}
        onSelectPage={handleSelectNavigatorPage}
        initialTab={navigatorInitialTab}
        onBookmarkUpdated={() => {
          setKhatmah(loadKhatmahState());
        }}
      />

      {/* Khatmah Target & Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-right space-y-5" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
                <Settings className="w-5 h-5 text-teal-600" />
                <span>خطة الورد والختمة القرآنية</span>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDailyTarget} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  كم صفحة تريد قراءتها يومياً؟ (الورد المستهدف):
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: '5 صفحات', val: 5, time: 'ختمة في 4 أشهر' },
                    { label: '10 صفحات', val: 10, time: 'ختمة في شهرين' },
                    { label: '20 صفحة (جزء)', val: 20, time: 'ختمة في شهر' },
                    { label: '40 صفحة (جزأين)', val: 40, time: 'ختمة في 15 يوم' }
                  ].map(plan => (
                    <button
                      key={plan.val}
                      type="button"
                      onClick={() => setTargetPagesInput(plan.val)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        targetPagesInput === plan.val
                          ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 text-xs'
                      }`}
                    >
                      <div className="text-xs font-bold">{plan.val} صفحة</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{plan.val === 20 ? 'جزء كامل' : ''}</div>
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={targetPagesInput}
                  onChange={(e) => setTargetPagesInput(Number(e.target.value))}
                  className="w-full text-center font-mono text-xl font-bold py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 text-teal-900"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>المتبقي من المصحف الشريف:</span>
                  <strong className="font-mono text-slate-900">{remainingPages} صفحة</strong>
                </div>
                <div className="flex justify-between">
                  <span>المدة التقديرية للختم بهدفك:</span>
                  <strong className="font-mono text-teal-700">حوالي {Math.ceil(remainingPages / (targetPagesInput || 20))} يوم</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer"
                >
                  حفظ الخطة اليومية
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </form>

            <div className="border-t border-slate-100 pt-4">
              <div className="text-xs text-slate-500 mb-2">هل أنهيت ختمة أو ترغب في البدء من البداية؟</div>
              <button
                type="button"
                onClick={handleResetKhatmah}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بدء ختمة جديدة من الصفحة الأولى</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-emerald-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-teal-200 border border-white/10">
              <BookOpen className="w-3.5 h-3.5" />
              المصحف الشريف ومتابعة الختمة (صفحة بصفحة 1 - 604)
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-['Amiri',serif]">
              «إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ»
            </h2>
            <p className="text-teal-100 text-sm md:text-base leading-relaxed font-medium">
              تصفح وقراءة حقيقية لصفحات المصحف الشريف بالرسم العثماني المعتمد، ومتابعة دقيقة لختمتك مع تلاوات خاشعة.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleResumeBookmark}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs md:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title={`استئناف القراءة فوراً من صفحة ${khatmah.bookmarkPage}`}
            >
              <Bookmark className="w-4 h-4 fill-slate-900" />
              استئناف من الفاصلة (ص {khatmah.bookmarkPage})
            </button>
            <button
              onClick={handleBookmarkCurrent}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs md:text-sm font-bold border border-white/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              title="تثبيت الفاصلة عند الصفحة المعروضة حالياً"
            >
              <Bookmark className="w-4 h-4" />
              احفظ موضعي الحالي (ص {activePage})
            </button>
          </div>
        </div>
      </div>

      {/* Khatmah Tracker Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Current Page Card with Direct Jump / Edit */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold mb-1 flex items-center justify-between">
              <span>الصفحة الحالية</span>
              <button
                onClick={() => openNavigator('direct')}
                className="text-[11px] text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 cursor-pointer"
                title="تعديل أو إدخال صفحتك الفعلية مباشرة"
              >
                <Edit3 className="w-3 h-3" />
                <span>انتقال وفهرس</span>
              </button>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 flex items-baseline gap-1.5 sm:gap-2">
              <span>{khatmah.currentPage}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-normal">من 604</span>
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              سورة {getSurahForPage(khatmah.currentPage).name} • جزء {getJuzForPage(khatmah.currentPage)}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDecrementPage}
              disabled={khatmah.currentPage <= 1}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] sm:text-xs font-bold disabled:opacity-40 cursor-pointer"
              title="الصفحة السابقة في الختمة"
            >
              - صفحة
            </button>
            <button
              onClick={handleIncrementPage}
              className="flex-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
              title="تسجيل قراءة الصفحة والانتقال للصفحة التالية"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>+ قرأت</span>
            </button>
          </div>
        </div>

        {/* Progress in Khatmah */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold mb-1 flex items-center justify-between">
              <span>نسبة الإنجاز</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">
              {khatmahPercentage}%
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              أنجزت {khatmah.currentPage} من 604 صفحة
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Number(khatmahPercentage), 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Remaining & Pace Card */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold mb-1 flex items-center justify-between">
              <span>المتبقي للختم</span>
              <button
                onClick={() => {
                  setTargetPagesInput(khatmah.dailyPagesTarget || 20);
                  setIsSettingsModalOpen(true);
                }}
                className="text-[11px] text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 cursor-pointer"
                title="تخصيص هدف الورد اليومي"
              >
                <Settings className="w-3 h-3" />
                <span>الورد: {khatmah.dailyPagesTarget || 20}ص</span>
              </button>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 flex items-baseline gap-1.5 sm:gap-2">
              <span>{remainingPages}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-normal">صفحة</span>
            </div>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 mt-2 truncate">
            حوالي <strong>{estimatedDaysLeft}</strong> يوم بمعدل {khatmah.dailyPagesTarget || 20} ص/يوم
          </div>
        </div>

        {/* Completed Khatmahs */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold mb-1 flex items-center justify-between">
              <span>الختمات المكتملة</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600">
              {khatmah.completedKhatmahsCount}
            </div>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>{khatmah.completedKhatmahsCount === 0 ? 'في طريق الختمة الأولى' : 'مبارك ومتقبل'}</span>
            <button
              onClick={() => {
                setTargetPagesInput(khatmah.dailyPagesTarget || 20);
                setIsSettingsModalOpen(true);
              }}
              className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
            >
              إعدادات
            </button>
          </div>
        </div>
      </div>

      {/* Reading Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setReadMode('page')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              readMode === 'page'
                ? 'bg-white text-teal-900 shadow-xs border border-teal-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>عرض صفحات المصحف (صفحة {activePage})</span>
          </button>
          <button
            onClick={() => setReadMode('surah')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              readMode === 'surah'
                ? 'bg-white text-teal-900 shadow-xs border border-teal-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>عرض السورة كاملة (فهرس 114)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          <button
            onClick={() => openNavigator('direct')}
            className="px-4 py-2 bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all text-xs sm:text-sm"
            title="فتح فهرس المصحف والانتقال الشامل والبحث والفواصل المحفوظة"
          >
            <Compass className="w-4 h-4 text-amber-300" />
            <span>الانتقال والبحث</span>
          </button>
        </div>
      </div>

      {/* MODE 1: REAL MUSHAF PAGE-BY-PAGE READER (1 - 604) */}
      {readMode === 'page' && (
        <div id="mushaf-reading-card" className="space-y-6">
          {/* Audio Reciter Bar for Current Page */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  تلاوة سورة {selectedSurah.name} (الصفحة {activePage})
                </div>
                <div className="text-[11px] text-slate-500">
                  القارئ: {selectedReciter.nameAr}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <select
                value={selectedReciter.id}
                onChange={(e) => {
                  const found = RECITERS_LIST.find(r => r.id === e.target.value);
                  if (found) setSelectedReciter(found);
                }}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {RECITERS_LIST.map((reciter) => (
                  <option key={reciter.id} value={reciter.id}>
                    {reciter.nameAr}
                  </option>
                ))}
              </select>

              <button
                onClick={toggleAudio}
                disabled={audioLoading}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-2xs shrink-0"
              >
                {audioLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <PauseCircle className="w-4 h-4" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                <span>{isPlaying ? 'إيقاف مؤقت' : 'استماع للتلاوة'}</span>
              </button>
            </div>
          </div>

          {/* Authentic Madinah Mushaf Page Sheet */}
          <div className="relative bg-[#fcfbf7] border-2 border-emerald-900/20 rounded-3xl p-4 sm:p-8 md:p-12 shadow-sm min-h-[580px] flex flex-col justify-between overflow-hidden" dir="rtl">
            {/* Hanging Golden Bookmark Ribbon if this page is bookmarked */}
            {activePage === khatmah.bookmarkPage && (
              <div 
                className="absolute top-0 left-8 z-20 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-bold text-[11px] px-2.5 py-3 shadow-md rounded-b-lg border-x border-b border-amber-800/40 flex flex-col items-center gap-1 transition-all animate-bounce-short"
                title="هذه هي الصفحة المثبتة بالفاصلة"
              >
                <Bookmark className="w-4 h-4 fill-slate-950" />
                <span className="text-[10px] whitespace-nowrap">الفاصلة المثبتة</span>
              </div>
            )}

            {/* Page Header (Juz, Surah, Page & Direct Bookmark Pinning Button) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-emerald-900/15 text-xs font-bold text-teal-900 font-['Amiri',serif]">
              <div 
                onClick={() => openNavigator('juz')}
                className="text-sm cursor-pointer hover:text-emerald-700 hover:underline transition-colors flex items-center gap-1"
                title="فتح فهرس الأجزاء الثلاثين"
              >
                <span>الجزء {pageData?.juz || getJuzForPage(activePage)}</span>
                {pageData?.hizbQuarter ? ` • الحزب ${Math.ceil(pageData.hizbQuarter / 4)}` : ''}
              </div>
              <div 
                onClick={() => openNavigator('surah')}
                className="text-base md:text-lg font-bold text-center cursor-pointer hover:text-emerald-700 transition-colors"
                title="فتح فهرس السور"
              >
                {pageData?.surahsInPage?.map(s => s.name).join(' • ') || currentSurahForHeader.name}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBookmarkCurrent}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                    activePage === khatmah.bookmarkPage
                      ? 'bg-amber-500 text-slate-950 shadow-xs border border-amber-600'
                      : 'bg-emerald-800/10 hover:bg-emerald-800/20 text-teal-950 border border-emerald-800/20'
                  }`}
                  title="تثبيت الفاصلة عند هذه الصفحة"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${activePage === khatmah.bookmarkPage ? 'fill-slate-950' : ''}`} />
                  <span>{activePage === khatmah.bookmarkPage ? '📌 الفاصلة مثبتة هنا' : 'تثبيت الفاصلة هنا'}</span>
                </button>

                <button
                  onClick={() => openNavigator('direct')}
                  className="text-sm font-mono font-bold bg-amber-100/80 hover:bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-md border border-amber-300/60 cursor-pointer transition-colors shadow-2xs"
                  title="انتقال برقم الآية، الربع، الحزب، الجزء، أو الصفحة"
                >
                  صفحة {activePage}
                </button>
              </div>
            </div>

            {/* Ayahs Display Area */}
            <div className="py-8 flex-1 flex flex-col justify-center">
              {isLoadingPage ? (
                <div className="py-24 text-center space-y-3">
                  <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-500 font-medium">جارٍ استرجاع الصفحة {activePage} بالرسم العثماني المعتمد...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Render Page Ayahs */}
                  {pageData?.ayahs && pageData.ayahs.length > 0 ? (
                    <div className="font-['Amiri',serif] text-xl sm:text-2xl md:text-[27px] leading-[2.6] md:leading-[2.9] text-slate-900 text-justify space-y-4">
                      {pageData.ayahs.map((ayah, idx) => {
                        const isFirstAyahInSurah = ayah.numberInSurah === 1;
                        const surahObj = SURAHS_METADATA.find(s => s.number === ayah.surahNumber) || getSurahForPage(activePage);

                        return (
                          <React.Fragment key={ayah.number}>
                            {/* Decorative Surah Title Box if a new Surah starts on this page */}
                            {isFirstAyahInSurah && (
                              <div className="my-6 text-center">
                                <div className="inline-block border-2 border-emerald-800/30 bg-emerald-50/50 rounded-2xl px-6 sm:px-10 py-2.5 my-2 shadow-2xs">
                                  <div className="text-base sm:text-xl font-bold text-teal-950">
                                    سُورَةُ {surahObj.name}
                                  </div>
                                  <div className="text-[11px] text-teal-800 font-sans mt-0.5">
                                    {surahObj.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • عدد آياتها: {surahObj.numberOfAyahs}
                                  </div>
                                </div>
                                {surahObj.number !== 9 && (
                                  <div className="text-lg sm:text-xl text-teal-900 font-bold py-2">
                                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Ayah Text with Number Badge */}
                            <span className="inline">
                              {ayah.text}{' '}
                              <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 mx-1 rounded-full border border-teal-600/40 text-xs font-mono font-bold text-teal-800 bg-teal-50/80 align-middle">
                                ﴿{ayah.numberInSurah}﴾
                              </span>{' '}
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-500 text-sm">
                      تأكد من الاتصال بالإنترنت لتحميل نصوص المصحف الشريف.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Page Footer */}
            <div className="text-center pt-4 border-t border-emerald-900/15 text-xs text-slate-500 font-mono font-bold">
              — {activePage} —
            </div>
          </div>

          {/* Page Navigation Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => handlePageNavigation(activePage - 1, true)}
              disabled={activePage <= 1}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs md:text-sm disabled:opacity-40 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الصفحة السابقة ({activePage - 1})</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleIncrementPage}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs md:text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                title="تسجيل قراءة هذه الصفحة في الختمة والانتقال للصفحة التالية"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>+ قرأت هذه الصفحة (الانتقال لـ {Math.min(604, activePage + 1)})</span>
              </button>
            </div>

            <button
              onClick={() => handlePageNavigation(activePage + 1, true)}
              disabled={activePage >= 604}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs md:text-sm disabled:opacity-40 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>الصفحة التالية ({activePage + 1})</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: FULL SURAH BROWSER & TAFSEER */}
      {readMode === 'surah' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Sidebar: Surah Selector & Reciter */}
          <div className="lg:col-span-4 space-y-4">
            {/* Reciter Selector & Audio Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-teal-600" />
                  القارئ المختار
                </span>
                <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-bold">
                  تلاوة مرئية وصوتية
                </span>
              </div>

              <select
                value={selectedReciter.id}
                onChange={(e) => {
                  const found = RECITERS_LIST.find(r => r.id === e.target.value);
                  if (found) setSelectedReciter(found);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {RECITERS_LIST.map((reciter) => (
                  <option key={reciter.id} value={reciter.id}>
                    {reciter.nameAr}
                  </option>
                ))}
              </select>

              {/* Audio Playback Controls */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={toggleAudio}
                  disabled={audioLoading}
                  className="w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                  title={audioLoading ? 'جار التحميل...' : isPlaying ? 'إيقاف مؤقت' : 'استماع للسورة'}
                >
                  {audioLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isPlaying ? (
                    <PauseCircle className="w-5 h-5" />
                  ) : (
                    <PlayCircle className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    سورة {selectedSurah.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {selectedReciter.nameAr}
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div 
                      className="bg-teal-600 h-1.5 rounded-full transition-all duration-150"
                      style={{ width: `${audioProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Surah List with Search */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">فهرس السور الكريمة</span>
                <span className="text-xs text-slate-400 font-mono">114 سورة</span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث باسم السورة أو رقمها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredSurahs.map((surah) => {
                  const isCurrent = selectedSurah.number === surah.number;
                  return (
                    <button
                      key={surah.number}
                      onClick={() => {
                        setSelectedSurah(surah);
                        setActivePage(surah.pageNumber);
                      }}
                      className={`w-full p-2.5 rounded-xl text-right flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isCurrent 
                          ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200' 
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center font-mono text-[11px] text-slate-600 shrink-0">
                          {surah.number}
                        </span>
                        <span>سورة {surah.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>ص {surah.pageNumber}</span>
                        <span className="font-mono">({surah.numberOfAyahs} آية)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right / Main Reading Sheet */}
          <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[550px]">
            <div>
              {/* Surah Title Banner */}
              <div className="text-center pb-6 border-b border-slate-100 space-y-2">
                <div className="text-xs font-bold text-teal-700 tracking-wider">
                  {selectedSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • عدد آياتها: {selectedSurah.numberOfAyahs} • تبدأ من صفحة {selectedSurah.pageNumber}
                </div>
                <h3 className="text-3xl md:text-4xl font-bold font-['Amiri',serif] text-slate-900">
                  سُورَةُ {selectedSurah.name}
                </h3>
                {selectedSurah.number !== 9 && (
                  <div className="pt-3 text-lg md:text-xl font-['Amiri',serif] text-teal-800">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </div>
                )}

                {/* Tafseer Toggle Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowTafseer(!showTafseer)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      showTafseer
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showTafseer ? 'إخفاء التفسير والمقاصد' : 'عرض التفسير الميسر ومقاصد السورة'}</span>
                  </button>
                </div>

                {/* Tafseer Card */}
                {showTafseer && (() => {
                  const tafseer = getSurahTafseer(selectedSurah.number);
                  return (
                    <div className="mt-4 p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-right text-xs space-y-2 animate-in fade-in duration-200" dir="rtl">
                      <div className="flex items-center gap-2 font-bold text-teal-950 text-sm">
                        <BookOpen className="w-4 h-4 text-teal-700" />
                        <span>مقاصد وهدايات سورة {selectedSurah.name}:</span>
                      </div>
                      <div className="text-slate-700 leading-relaxed">
                        <strong className="text-teal-900">فضائلها: </strong>
                        {tafseer.virtues}
                      </div>
                      <div className="text-slate-700 leading-relaxed">
                        <strong className="text-teal-900">المحور والهدف: </strong>
                        {tafseer.coreTheme}
                      </div>
                      <div className="text-slate-800 bg-white/80 p-2.5 rounded-xl border border-teal-100 leading-relaxed font-['Amiri',serif] text-sm">
                        <strong className="text-teal-900 font-sans text-xs block mb-0.5">وقفة وتدبر عملي:</strong>
                        {tafseer.practicalReflection}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Ayahs Display */}
              <div className="py-8">
                {isLoadingAyahs ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-500 font-medium">جارٍ استرجاع الآيات الكريمة من المصحف الشريف...</p>
                  </div>
                ) : (
                  <div 
                    className="font-['Amiri',serif] text-xl md:text-2xl leading-[2.6] text-slate-900 text-justify space-y-2"
                    dir="rtl"
                  >
                    {ayahs.map((ayah) => (
                      <span key={ayah.number} className="inline">
                        {ayah.text}{' '}
                        <span className="inline-flex items-center justify-center w-7 h-7 mx-1 rounded-full border border-teal-300 text-xs font-mono font-bold text-teal-800 bg-teal-50/60 align-middle">
                          {ayah.numberInSurah}
                        </span>{' '}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info className="w-4 h-4 text-teal-600" />
                <span>
                  المصحف برواية حفص عن عاصم بالرسم العثماني.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedSurah.number > 1) {
                      const prev = SURAHS_METADATA.find(s => s.number === selectedSurah.number - 1);
                      if (prev) {
                        setSelectedSurah(prev);
                        setActivePage(prev.pageNumber);
                      }
                    }
                  }}
                  disabled={selectedSurah.number <= 1}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  السورة السابقة
                </button>
                <button
                  onClick={() => {
                    if (selectedSurah.number < 114) {
                      const next = SURAHS_METADATA.find(s => s.number === selectedSurah.number + 1);
                      if (next) {
                        setSelectedSurah(next);
                        setActivePage(next.pageNumber);
                      }
                    }
                  }}
                  disabled={selectedSurah.number >= 114}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  السورة التالية
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theological & Psychological Guidance (Why Card) */}
      <WhyCardsAccordion categoryFilter="quran" />
    </div>
  );
};
