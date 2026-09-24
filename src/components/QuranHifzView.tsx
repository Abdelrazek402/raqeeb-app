import React, { useState, useMemo } from 'react';
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  RotateCcw, 
  Bookmark, 
  TrendingUp, 
  Filter, 
  Search, 
  Check, 
  Layers, 
  Eye, 
  ListChecks, 
  Calendar, 
  Edit3,
  Flame,
  ChevronLeft
} from 'lucide-react';
import { HifzState, HifzStrength, HifzLog } from '../types';
import { 
  loadHifzState, 
  saveHifzState, 
  togglePageHifz, 
  setPageStrength, 
  toggleSurahHifz, 
  toggleJuzHifz, 
  recordHifzSession, 
  updateHifzDailyTargets, 
  markDailyPlanCompleted, 
  getHifzStatistics 
} from '../services/hifzService';
import { SURAHS_METADATA } from '../services/quranService';
import { QURAN_AJZA } from '../data/quranNavigationData';

interface QuranHifzViewProps {
  onNavigateToPage: (page: number) => void;
  onOpenSelfTestMode: (page: number) => void;
}

export const QuranHifzView: React.FC<QuranHifzViewProps> = ({ 
  onNavigateToPage, 
  onOpenSelfTestMode 
}) => {
  const [hifz, setHifz] = useState<HifzState>(loadHifzState);
  const [subTab, setSubTab] = useState<'plan' | 'surahs' | 'ajza' | 'pagesMap' | 'history'>('plan');
  const [surahSearch, setSurahSearch] = useState('');
  const [editingTargets, setEditingTargets] = useState(false);
  const [newPagesTargetInput, setNewPagesTargetInput] = useState(hifz.dailyTarget.newPagesCount);
  const [revisionTargetInput, setRevisionTargetInput] = useState(hifz.dailyTarget.revisionPagesCount);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const stats = useMemo(() => getHifzStatistics(hifz), [hifz]);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSaveTargets = () => {
    const updated = updateHifzDailyTargets(newPagesTargetInput, revisionTargetInput);
    setHifz(updated);
    setEditingTargets(false);
    showNotification('تم تحديث الأهداف اليومية للحفظ والمراجعة بنجاح');
  };

  const handleToggleDailyComplete = () => {
    const nextState = !hifz.dailyRevisionPlan.completedToday;
    const updated = markDailyPlanCompleted(nextState);
    if (nextState) {
      // Also record in log
      const withLog = recordHifzSession({
        type: 'revision',
        pageStart: hifz.dailyRevisionPlan.revisionStartPage || 1,
        pageEnd: hifz.dailyRevisionPlan.revisionEndPage || 10,
        notes: 'إنجاز ورد المراجعة اليومي'
      });
      setHifz(withLog);
      showNotification('مبارك! تم تسجيل إنجاز ورد المراجعة اليومي بنجاح 🌿');
    } else {
      setHifz(updated);
      showNotification('تم إلغاء تحديد إنجاز اليوم');
    }
  };

  const handleSurahToggle = (surahNum: number, currentMemorized: boolean) => {
    const updated = toggleSurahHifz(surahNum, !currentMemorized, 'good');
    setHifz(updated);
    showNotification(!currentMemorized ? `تم تسجيل حفظ سورة ${SURAHS_METADATA.find(s => s.number === surahNum)?.name} 🌟` : 'تم تعديل حالة السورة');
  };

  const handleSurahStrengthChange = (surahNum: number, strength: HifzStrength) => {
    const updated = toggleSurahHifz(surahNum, true, strength);
    setHifz(updated);
    showNotification(`تم ضبط مستوى الإتقان: ${strength === 'mastered' ? 'متقن 🌟' : strength === 'good' ? 'جيد 🌿' : 'يحتاج مراجعة ⏳'}`);
  };

  const handlePageClick = (pageNum: number) => {
    const updated = togglePageHifz(pageNum, 'good');
    setHifz(updated);
  };

  const handleSetStrengthForPage = (pageNum: number, strength: HifzStrength) => {
    const updated = setPageStrength(pageNum, strength);
    setHifz(updated);
  };

  const filteredSurahs = SURAHS_METADATA.filter(s => 
    s.name.includes(surahSearch.trim()) || 
    String(s.number).includes(surahSearch.trim())
  );

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="p-3.5 bg-emerald-800 text-white text-xs font-bold rounded-2xl shadow-lg border border-emerald-600 flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Top Banner & Stats Overview */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/60 border border-teal-600/40 text-xs font-bold text-teal-200">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>منظومة الحفظ والضبط والإتقان</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Amiri',serif] tracking-wide">
              «خيركم من تعلّم القرآن وعلّمه»
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
              تابع محفوظك بدقة، نظّم ورد مراجعتك الصغرى والكبرى، واختبر استحضارك للآيات عبر التسميع الذاتي.
            </p>
          </div>

          {/* Key Stat Badges */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15 text-center">
            <div className="p-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                {stats.totalPages}
                <span className="text-[11px] font-normal text-teal-200 mr-1">/ 604</span>
              </div>
              <div className="text-[11px] text-teal-100 mt-0.5">صفحة محفوظة</div>
            </div>

            <div className="p-2 border-r border-l border-white/10">
              <div className="text-xl sm:text-2xl font-black font-mono text-teal-200">
                %{stats.percentage}
              </div>
              <div className="text-[11px] text-teal-100 mt-0.5">من كتاب الله</div>
            </div>

            <div className="p-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
                {stats.completedJuzCount}
                <span className="text-[11px] font-normal text-teal-200 mr-1">/ 30</span>
              </div>
              <div className="text-[11px] text-teal-100 mt-0.5">أجزاء تامة</div>
            </div>
          </div>
        </div>

        {/* Strength breakdown bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-teal-200/90 font-medium">مستويات الإتقان:</span>
            <div className="flex items-center gap-1.5 text-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>متقن راسخ ({stats.masteredCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-200">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
              <span>جيد ({stats.goodCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span>يحتاج مراجعة ({stats.needsPracticeCount})</span>
            </div>
          </div>

          <button
            onClick={() => onOpenSelfTestMode(1)}
            className="px-3.5 py-1.5 rounded-xl bg-teal-700/80 hover:bg-teal-600 border border-teal-500/50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-amber-300" />
            <span>بدء التسميع الذاتي (إخفاء الآيات)</span>
          </button>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          onClick={() => setSubTab('plan')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            subTab === 'plan' 
              ? 'bg-white text-teal-900 shadow-xs border border-teal-200' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-teal-700" />
          <span>ورد اليوم والمراجعة</span>
        </button>

        <button
          onClick={() => setSubTab('surahs')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            subTab === 'surahs' 
              ? 'bg-white text-teal-900 shadow-xs border border-teal-200' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-teal-700" />
          <span>المحفوظ بالسُوَر (114)</span>
        </button>

        <button
          onClick={() => setSubTab('ajza')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            subTab === 'ajza' 
              ? 'bg-white text-teal-900 shadow-xs border border-teal-200' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-700" />
          <span>المحفوظ بالأجزاء (30)</span>
        </button>

        <button
          onClick={() => setSubTab('pagesMap')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            subTab === 'pagesMap' 
              ? 'bg-white text-teal-900 shadow-xs border border-teal-200' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Filter className="w-4 h-4 text-teal-700" />
          <span>خريطة صفحات المصحف (604)</span>
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            subTab === 'history' 
              ? 'bg-white text-teal-900 shadow-xs border border-teal-200' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListChecks className="w-4 h-4 text-teal-700" />
          <span>سجل الجلسات</span>
        </button>
      </div>

      {/* SUBTAB 1: DAILY PLAN & REVISION */}
      {subTab === 'plan' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Hifz Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">ورد الحفظ الجديد</h4>
                    <p className="text-xs text-slate-500">حفظ يومي متقن ومثبّت</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                  {hifz.dailyTarget.newPagesCount} صفحة يومياً
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>موضع الحفظ المقترح:</span>
                  <span className="font-bold text-slate-800">
                    صفحة {hifz.dailyRevisionPlan.newHifzStartPage || 1}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  نصيحة الحفاظ: اقرأ الصفحة 15 إلى 20 مرة نظراً من المصحف قبل البدء في التسميع غيباً لترسيخ رسم الكلمات.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onNavigateToPage(hifz.dailyRevisionPlan.newHifzStartPage || 1)}
                  className="flex-1 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>فتح الصفحة في المصحف</span>
                </button>
                <button
                  onClick={() => onOpenSelfTestMode(hifz.dailyRevisionPlan.newHifzStartPage || 1)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>تسميع غيبي</span>
                </button>
              </div>
            </div>

            {/* Daily Revision Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">ورد المراجعة والتثبيت</h4>
                    <p className="text-xs text-slate-500">حماية المحفوظ من التفلت</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {hifz.dailyTarget.revisionPagesCount} صفحة يومياً
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>نطاق المراجعة اليومي:</span>
                  <span className="font-bold text-slate-800">
                    من ص {hifz.dailyRevisionPlan.revisionStartPage || 1} إلى ص {hifz.dailyRevisionPlan.revisionEndPage || 10}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  «تعاهدوا هذا القرآن؛ فوالذي نفس محمد بيده لهو أشد تفلتاً من الإبل في عقلها».
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onNavigateToPage(hifz.dailyRevisionPlan.revisionStartPage || 1)}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>بدء المراجعة في المصحف</span>
                </button>
                <button
                  onClick={handleToggleDailyComplete}
                  className={`py-2.5 px-4 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                    hifz.dailyRevisionPlan.completedToday
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{hifz.dailyRevisionPlan.completedToday ? 'أُنجز اليوم' : 'تسجيل الإنجاز'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action to customize targets */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-right">
              <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                  تخصيص خطة الحفظ والمراجعة اليومية
                </h5>
                <p className="text-[11px] text-slate-500">
                  عدّل عدد صفحات الحفظ الجديد وورد المراجعة اليومي ليناسب وقتك
                </p>
              </div>
            </div>

            {editingTargets ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1 text-xs">
                  <span>جديد:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newPagesTargetInput}
                    onChange={(e) => setNewPagesTargetInput(Number(e.target.value))}
                    className="w-14 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-xs"
                  />
                  <span>ص</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span>مراجعة:</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={revisionTargetInput}
                    onChange={(e) => setRevisionTargetInput(Number(e.target.value))}
                    className="w-16 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-xs"
                  />
                  <span>ص</span>
                </div>
                <button
                  onClick={handleSaveTargets}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-teal-700"
                >
                  حفظ
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTargets(true)}
                className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
              >
                تعديل الأهداف
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: SURAHS LIST (114) */}
      {subTab === 'surahs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث باسم السورة أو رقمها..."
                value={surahSearch}
                onChange={(e) => setSurahSearch(e.target.value)}
                className="w-full pr-9 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
              />
            </div>
            <div className="text-xs text-slate-500 shrink-0">
              المحفوظ: {Object.values(hifz.surahsStatus).filter((s: any) => s.isMemorized).length} سورة
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSurahs.map((surah) => {
              const surahState = hifz.surahsStatus[surah.number];
              const isMemorized = surahState?.isMemorized || false;
              const strength = surahState?.strength || 'good';

              return (
                <div
                  key={surah.number}
                  className={`p-3.5 rounded-2xl border transition-all text-right flex flex-col justify-between gap-3 ${
                    isMemorized
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                        isMemorized ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {surah.number}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          سورة {surah.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {surah.numberOfAyahs} آية • صفحة {surah.pageNumber}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSurahToggle(surah.number, isMemorized)}
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        isMemorized 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                      }`}
                      title={isMemorized ? 'تم حفظها (انقر للإلغاء)' : 'تعليم كمحفوظة'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>

                  {isMemorized && (
                    <div className="pt-2 border-t border-emerald-200/50 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">الإتقان:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSurahStrengthChange(surah.number, 'mastered')}
                          className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                            strength === 'mastered' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          🌟 متقن
                        </button>
                        <button
                          onClick={() => handleSurahStrengthChange(surah.number, 'good')}
                          className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                            strength === 'good' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          🌿 جيد
                        </button>
                        <button
                          onClick={() => handleSurahStrengthChange(surah.number, 'needs_practice')}
                          className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                            strength === 'needs_practice' 
                              ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          ⏳ مراجعة
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onNavigateToPage(surah.pageNumber)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      عرض في المصحف
                    </button>
                    <button
                      onClick={() => onOpenSelfTestMode(surah.pageNumber)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      تسميع غيبي
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: AJZA (30) */}
      {subTab === 'ajza' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QURAN_AJZA.map((juz) => {
            const startPage = juz.pageNumber;
            const nextJuz = QURAN_AJZA.find(x => x.juzNumber === juz.juzNumber + 1);
            const endPage = nextJuz ? nextJuz.pageNumber - 1 : 604;
            const totalInJuz = endPage - startPage + 1;
            
            const memorizedInJuz = hifz.memorizedPages.filter(p => p >= startPage && p <= endPage).length;
            const isFullJuz = memorizedInJuz === totalInJuz && totalInJuz > 0;
            const pct = Math.round((memorizedInJuz / totalInJuz) * 100);

            return (
              <div
                key={juz.juzNumber}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between gap-3 ${
                  isFullJuz 
                    ? 'bg-emerald-50/70 border-emerald-300' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                      isFullJuz ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {juz.juzNumber}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>الجزء {juz.juzNumber}</span>
                        {isFullJuz && (
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                            تام الحفظ 🌟
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-['Amiri',serif] truncate max-w-[200px]">
                        «{juz.snippet}»
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const updated = toggleJuzHifz(juz.juzNumber, !isFullJuz, 'good');
                      setHifz(updated);
                      showNotification(!isFullJuz ? `تم تعليم الجزء ${juz.juzNumber} كاملاً كمحفوظ 🌿` : `تم تعديل حالة الجزء ${juz.juzNumber}`);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      isFullJuz
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isFullJuz ? 'محفوظ بالكامل' : 'تحديد الجزء كاملاً'}
                  </button>
                </div>

                {/* Progress bar for Juz */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>نسبة الإنجاز: {memorizedInJuz} من {totalInJuz} صفحة</span>
                    <span className="font-mono font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => onNavigateToPage(juz.pageNumber)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold text-center cursor-pointer transition-colors"
                  >
                    فتح بداية الجزء (ص {juz.pageNumber})
                  </button>
                  <button
                    onClick={() => onOpenSelfTestMode(juz.pageNumber)}
                    className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    تسميع ذاتي
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 4: PAGES MAP (604) */}
      {subTab === 'pagesMap' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                خريطة صفحات المصحف الشريف (604 صفحة)
              </h4>
              <p className="text-xs text-slate-500">
                انقر على أي صفحة لتبديل حالة حفظها، أو الانتقال إليها مباشرة
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded-md bg-amber-400"></span>
                <span>متقن</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                <span>جيد</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded-md bg-rose-400"></span>
                <span>مراجعة</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200"></span>
                <span>غير محفوظ</span>
              </div>
            </div>
          </div>

          {/* Grid of 604 pages */}
          <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1 sm:gap-1.5 max-h-[60vh] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100">
            {Array.from({ length: 604 }, (_, i) => i + 1).map((pageNum) => {
              const isMemorized = hifz.memorizedPages.includes(pageNum);
              const strength = hifz.pagesStatus[pageNum]?.strength || 'good';

              let bgClass = 'bg-white border-slate-200 text-slate-600 hover:bg-slate-200';
              if (isMemorized) {
                if (strength === 'mastered') bgClass = 'bg-amber-400 border-amber-500 text-white font-bold';
                else if (strength === 'needs_practice') bgClass = 'bg-rose-400 border-rose-500 text-white font-bold';
                else bgClass = 'bg-emerald-500 border-emerald-600 text-white font-bold';
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageClick(pageNum)}
                  onDoubleClick={() => onNavigateToPage(pageNum)}
                  title={`صفحة ${pageNum} ${isMemorized ? `(محفوظة: ${strength})` : ''} - انقر للتبديل، نقر مزدوج للفتح`}
                  className={`aspect-square rounded-lg border text-[10px] font-mono flex items-center justify-center transition-all cursor-pointer ${bgClass}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 5: HISTORY LOGS */}
      {subTab === 'history' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">سجل جلسات الحفظ والمراجعة</h4>
              <p className="text-xs text-slate-500">توثيق جهادك مع القرآن وتثبيت آياته</p>
            </div>
          </div>

          {hifz.historyLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <ListChecks className="w-8 h-8 mx-auto text-slate-300" />
              <div>لا توجد جلسات مسجلة بعد. عند إتمام الورد اليومي سيتم توثيقه هنا تلقائياً.</div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {hifz.historyLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                      {log.type === 'revision' ? 'مراجعة' : log.type === 'new_hifz' ? 'جديد' : 'تسميع'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {log.notes || `ورد الصفحات ${log.pageStart} إلى ${log.pageEnd}`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {log.date} {log.surahName ? `• ${log.surahName}` : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToPage(log.pageStart)}
                    className="text-xs font-bold text-teal-700 bg-white border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-50 cursor-pointer"
                  >
                    فتح ص {log.pageStart}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
