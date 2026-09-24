import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ComposedChart, ReferenceLine, Legend
} from 'recharts';
import { 
  Activity, ShieldAlert, Target, Heart, Sparkles, Clock, Layers, Trophy, 
  Calendar, CheckCircle2, Flame, Award, TrendingUp, ArrowUpRight, ArrowDownRight, ShieldCheck,
  BrainCircuit, Compass, AlertCircle, BarChart3, LineChart as LineChartIcon, Grid, Zap, BookOpen, Info,
  CheckSquare, CalendarDays
} from 'lucide-react';
import { DailyStats, BlockedAttempt, PrayerInfo, VictoryLog, VictoryCategory } from '../types';
import { 
  getRolling7DaysSummary, 
  getRolling30DaysMonthlySummary,
  getYearlyActivityHeatmap,
  WeeklySummaryReport, 
  MonthlySummaryReport,
  YearlyActivityHeatmapReport,
  HeatmapDayCell,
  WeekComparisonItem,
  DailySummaryItem 
} from '../services/periodStatsService';
import { VICTORY_CATEGORY_CONFIG } from './VictoryJournalView';

interface AnalyticsViewProps {
  stats: DailyStats;
  blockedAttempts: BlockedAttempt[];
  prayers: PrayerInfo[];
  victories?: VictoryLog[];
}

type AnalyticsSubTab = 'weekly_summary' | 'monthly_summary' | 'yearly_heatmap' | 'prayer_focus' | 'victories' | 'screen_distractions';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  stats, 
  blockedAttempts, 
  prayers,
  victories = []
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<AnalyticsSubTab>('weekly_summary');
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'prayers' | 'istighfar' | 'focus'>('all');
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<HeatmapDayCell | null>(null);

  // Compute 7-day aggregated summary
  const weeklySummary: WeeklySummaryReport = useMemo(() => {
    return getRolling7DaysSummary(stats, prayers, blockedAttempts);
  }, [stats, prayers, blockedAttempts]);

  // Compute 30-day monthly aggregated summary & 4-week comparison
  const monthlySummary: MonthlySummaryReport = useMemo(() => {
    return getRolling30DaysMonthlySummary(stats, prayers, blockedAttempts);
  }, [stats, prayers, blockedAttempts]);

  // Compute 52-week yearly activity heatmap
  const yearlyHeatmap: YearlyActivityHeatmapReport = useMemo(() => {
    return getYearlyActivityHeatmap(stats, prayers, heatmapFilter);
  }, [stats, prayers, heatmapFilter]);

  // Distraction categories aggregation
  const distractionData = useMemo(() => {
    const categories: Record<string, number> = {
      'تواصل اجتماعي': 0,
      'فيديو وترفيه': 0,
      'ألعاب': 0,
      'محتوى ضار': 0,
      'أخرى': 0
    };
    
    blockedAttempts.forEach(log => {
      const url = (log.urlOrQuery || '').toLowerCase();
      if (url.includes('facebook') || url.includes('instagram') || url.includes('tiktok') || url.includes('twitter')) {
        categories['تواصل اجتماعي']++;
      } else if (url.includes('youtube') || url.includes('netflix') || url.includes('twitch')) {
        categories['فيديو وترفيه']++;
      } else if (url.includes('game') || url.includes('roblox') || url.includes('pubg')) {
        categories['ألعاب']++;
      } else if (log.reason.includes('إباحي') || url.includes('por') || url.includes('x')) {
        categories['محتوى ضار']++;
      } else {
        categories['أخرى']++;
      }
    });

    return Object.entries(categories)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [blockedAttempts]);

  // Victory Categories Data & Statistics
  const victoryChartData = useMemo(() => {
    const counts: Record<VictoryCategory, number> = {
      gaze_lowered: 0,
      prayer_completed: 0,
      quran_recited: 0,
      work_accomplishment: 0,
      sports_fitness: 0,
      resisted_urge: 0,
      istighfar_adhkar: 0,
      panic_rescue: 0
    };

    victories.forEach(v => {
      const cat = (v.category || (v.type === 'panic_button' ? 'panic_rescue' : 'resisted_urge')) as VictoryCategory;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.resisted_urge++;
      }
    });

    const categoryColors: Record<VictoryCategory, string> = {
      gaze_lowered: '#6366f1',        // Indigo
      prayer_completed: '#10b981',    // Emerald
      quran_recited: '#0d9488',       // Teal
      work_accomplishment: '#2563eb', // Blue
      sports_fitness: '#ea580c',      // Orange
      resisted_urge: '#f59e0b',       // Amber
      istighfar_adhkar: '#06b6d4',    // Cyan
      panic_rescue: '#f43f5e'         // Rose
    };

    const items = (Object.keys(counts) as VictoryCategory[]).map(catKey => ({
      categoryKey: catKey,
      name: VICTORY_CATEGORY_CONFIG[catKey]?.label || catKey,
      value: counts[catKey],
      color: categoryColors[catKey]
    }));

    const activeItems = items.filter(item => item.value > 0);
    const totalCount = victories.length;

    return {
      all: items,
      active: activeItems.length > 0 ? activeItems : [
        { categoryKey: 'resisted_urge', name: 'مقاومة وسواس', value: 1, color: '#f59e0b' }
      ],
      total: totalCount,
      topCategory: activeItems.sort((a, b) => b.value - a.value)[0]?.name || 'غض بصر'
    };
  }, [victories]);

  const DISTRACTION_COLORS = ['#0d9488', '#3b82f6', '#eab308', '#f43f5e', '#8b5cf6'];
  const totalDistractions = distractionData.reduce((sum, item) => sum + item.value, 0);

  // Helper formatter for minutes
  const formatMins = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}س ${m}د` : `${h} ساعة`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20" dir="rtl">
      
      {/* Main Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              {selectedSubTab === 'monthly_summary' ? 'تقرير الـ 30 يوماً الشهري 📅' : 'تقرير الـ 7 أيام المجمّع 📊'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {selectedSubTab === 'monthly_summary'
                ? `${monthlySummary.days[0]?.formattedDate} - ${monthlySummary.days[29]?.formattedDate} (30 يوماً)`
                : `${weeklySummary.days[0]?.formattedDate} - ${weeklySummary.days[6]?.formattedDate} (7 أيام)`}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-['Amiri',serif] text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-600" />
            سجل التحليلات والتقارير الدورية (Analytics & Reports)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            متابعة شاملة ودقيقة لمعدل استقامة الصلاة، جلسات التركيز والإنجاز، ومستوى الثبات على مدار الأسبوع والشهر.
          </p>
        </div>

        {/* Header KPI Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200 flex items-center gap-2.5">
            <div className="text-center">
              <span className="block text-[10px] text-emerald-700 font-bold mb-0.5">
                {selectedSubTab === 'monthly_summary' ? 'التزام الشهر' : 'التزام الأسبوع'}
              </span>
              <span className="block text-lg font-black text-emerald-900 leading-none">
                {selectedSubTab === 'monthly_summary' 
                  ? `${monthlySummary.prayerConsistencyPercentage}%` 
                  : `${weeklySummary.prayerConsistencyPercentage}%`}
              </span>
            </div>
            <div className="w-px h-7 bg-emerald-200"></div>
            <Heart className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="bg-teal-50 px-3.5 py-2 rounded-2xl border border-teal-200 flex items-center gap-2.5">
            <div className="text-center">
              <span className="block text-[10px] text-teal-700 font-bold mb-0.5">
                {selectedSubTab === 'monthly_summary' ? 'ساعات الشهر' : 'ساعات الأسبوع'}
              </span>
              <span className="block text-lg font-black text-teal-900 leading-none">
                {selectedSubTab === 'monthly_summary' 
                  ? monthlySummary.totalFocusHoursFormatted 
                  : weeklySummary.totalFocusHoursFormatted}
              </span>
            </div>
            <div className="w-px h-7 bg-teal-200"></div>
            <Target className="w-5 h-5 text-teal-600" />
          </div>

          <div className="bg-amber-50 px-3.5 py-2 rounded-2xl border border-amber-200 flex items-center gap-2.5">
            <div className="text-center">
              <span className="block text-[10px] text-amber-700 font-bold mb-0.5">أيام الثبات</span>
              <span className="block text-lg font-black text-amber-900 leading-none">
                {stats.streakDays || 1} 🔥
              </span>
            </div>
            <div className="w-px h-7 bg-amber-200"></div>
            <Flame className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

        {/* Subtabs Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto">
        
        <button
          onClick={() => setSelectedSubTab('weekly_summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            selectedSubTab === 'weekly_summary'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200/80 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Calendar className="w-4 h-4 text-teal-600" />
          الملخص الأسبوعي (7 أيام)
        </button>

        {/* Monthly Report Subtab */}
        <button
          onClick={() => setSelectedSubTab('monthly_summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            selectedSubTab === 'monthly_summary'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200/80 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <BarChart3 className={`w-4 h-4 ${selectedSubTab === 'monthly_summary' ? 'text-teal-700' : 'text-slate-500'}`} />
          <span>التقرير الشهري (30 يوماً)</span>
        </button>

        {/* Yearly Activity Heatmap Subtab */}
        <button
          id="yearly-heatmap-subtab-btn"
          onClick={() => setSelectedSubTab('yearly_heatmap')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            selectedSubTab === 'yearly_heatmap'
              ? 'bg-teal-900 text-white shadow-sm font-black ring-2 ring-emerald-500/40'
              : 'text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200/80 font-black'
          }`}
        >
          <Grid className={`w-4 h-4 ${selectedSubTab === 'yearly_heatmap' ? 'text-amber-300 animate-pulse' : 'text-emerald-700'}`} />
          <span>المخطط الحراري السنوي (Heatmap الأذكار والصلاة) 🔥</span>
        </button>

        <button
          onClick={() => setSelectedSubTab('prayer_focus')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            selectedSubTab === 'prayer_focus'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200/80 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Target className="w-4 h-4 text-emerald-600" />
          مسار الصلاة والتركيز اليومي
        </button>

        <button
          onClick={() => setSelectedSubTab('victories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            selectedSubTab === 'victories'
              ? 'bg-white text-amber-950 shadow-xs border border-amber-200 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-600" />
          المكتسبات والانتصارات الإيمانية ({victories.length})
        </button>

        <button
          onClick={() => setSelectedSubTab('screen_distractions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            selectedSubTab === 'screen_distractions'
              ? 'bg-white text-blue-900 shadow-xs border border-blue-200 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          أنماط الشاشة والمشتتات
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: WEEKLY SUMMARY (RECHARTS AGGREGATION OVER 7 DAYS) */}
      {/* ========================================================================= */}
      {selectedSubTab === 'weekly_summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Weekly Momentum & Spiritual Score Banner */}
          <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-teal-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-400/20 text-teal-200 border border-teal-400/30">
                    تقييم الأداء الأسبوعي المجمع 🌟
                  </span>
                  <span className="text-xs text-teal-300/80 font-mono">
                    آخر 7 أيام (آخر 168 ساعة)
                  </span>
                </div>
                <h3 className="text-2xl font-black font-['Amiri',serif] text-teal-50">
                  {weeklySummary.weeklyGrade}
                </h3>
                <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
                  {weeklySummary.weeklyAdvice}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-teal-950/60 backdrop-blur-xs p-4 rounded-2xl border border-teal-500/30 self-stretch lg:self-auto justify-around">
                <div className="text-center">
                  <span className="text-[11px] text-teal-300 font-bold block mb-1">مؤشر الانضباط</span>
                  <div className="text-3xl font-black text-amber-300 font-mono leading-none">
                    {weeklySummary.weeklyScore}%
                  </div>
                  <span className="text-[10px] text-teal-200/70 block mt-1">درجة الزخم الروحي</span>
                </div>
                <div className="w-px h-12 bg-teal-700/60"></div>
                <div className="text-center">
                  <span className="text-[11px] text-teal-300 font-bold block mb-1">جلسات الإنجاز</span>
                  <div className="text-3xl font-black text-white font-mono leading-none">
                    {weeklySummary.totalFocusSessions}
                  </div>
                  <span className="text-[10px] text-teal-200/70 block mt-1">جلسة تركيز مكتملة</span>
                </div>
              </div>

            </div>
          </div>

          {/* 4 Weekly Aggregate Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Prayers */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-600">المحافظة على الصلاة</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {weeklySummary.totalConfirmedPrayers}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 35 صلاة مفروضة</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${weeklySummary.prayerConsistencyPercentage}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 block">
                نسبة الالتزام: {weeklySummary.prayerConsistencyPercentage}% أسبوعياً
              </span>
            </div>

            {/* Card 2: Deep Focus Time */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-600">ساعات التركيز العميق</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {weeklySummary.totalFocusHoursFormatted}
                </span>
                <span className="text-xs font-bold text-slate-400">({weeklySummary.totalFocusSessions} جلسة)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round((weeklySummary.totalFocusMinutes / (7 * 60)) * 100))}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-teal-700 block">
                معدل يومي: {weeklySummary.averageDailyFocusMinutes} دقيقة / يوم
              </span>
            </div>

            {/* Card 3: Blocked Distractions */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-600">محاولات الحجب والثبات</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {weeklySummary.totalBlockedAttempts}
                </span>
                <span className="text-xs font-bold text-slate-400">محاولة مصدودة</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-[11px] font-bold text-rose-700 block">
                حماية تلقائية ومنع للشبهات والشهوات
              </span>
            </div>

            {/* Card 4: Istighfar & Remembrance */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-600">الاستغفار وذكر الله</span>
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {weeklySummary.totalIstighfarCount}
                </span>
                <span className="text-xs font-bold text-slate-400">تسبيحة واستغفار</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-[11px] font-bold text-cyan-700 block">
                تطهير للقلب ورفع للهمة في الخلوة
              </span>
            </div>

          </div>

          {/* MAIN CHARTS GRID (RECHARTS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* CHART 1: Prayer Consistency Across 7 Days (BarChart with Target Line) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      معدل أداء الصلوات المفروضة (Daily Prayer Consistency)
                    </h3>
                    <p className="text-[11px] text-slate-500">عدد الصلوات المؤداة يومياً من أصل 5 صلوات</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  الهدف: 5/5 🕌
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySummary.days} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="dayShort" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      dy={8} 
                    />
                    <YAxis 
                      domain={[0, 5]} 
                      ticks={[0, 1, 2, 3, 4, 5]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                      formatter={(value: number, _name: string, item: any) => {
                        const payload = item?.payload as DailySummaryItem;
                        return [
                          `${value} من 5 صلوات (${payload?.prayerPercentage || 0}%)`,
                          'الصلوات المؤداة'
                        ];
                      }}
                      labelFormatter={(_label: any, items: any[]) => {
                        const payload = items?.[0]?.payload as DailySummaryItem;
                        return payload ? `${payload.dayName} (${payload.formattedDate})` : _label;
                      }}
                    />
                    <ReferenceLine y={5} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'الهدف الكامل (5)', position: 'insideTopLeft', fill: '#10b981', fontSize: 10 }} />
                    <Bar dataKey="confirmedPrayers" radius={[6, 6, 0, 0]} barSize={28}>
                      {weeklySummary.days.map((entry, index) => {
                        const fill = entry.confirmedPrayers === 5 
                          ? '#10b981' 
                          : entry.confirmedPrayers >= 4 
                          ? '#0d9488' 
                          : entry.confirmedPrayers >= 3 
                          ? '#f59e0b' 
                          : '#f43f5e';
                        return <Cell key={`prayer-bar-${index}`} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 5 صلوات كاملة
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> 4 صلوات
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 3 صلوات فأقل
                </span>
              </div>
            </div>

            {/* CHART 2: Deep Focus Sessions vs Screen Time (ComposedChart: Bar + Area) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      دقائق التركيز والإنجاز مقارنة بوقت الشاشة
                    </h3>
                    <p className="text-[11px] text-slate-500">الموازنة بين وقت العمل العميق والاستخدام العام</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  {weeklySummary.totalFocusHoursFormatted} تركيز 🎯
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weeklySummary.days} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScreenArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="dayShort" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      dy={8} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                      formatter={(value: number, name: string) => {
                        if (name === 'focusMinutes') return [formatMins(value), 'وقت التركيز العميق'];
                        if (name === 'screenTimeMinutes') return [formatMins(value), 'إجمالي وقت الشاشة'];
                        return [value, name];
                      }}
                      labelFormatter={(_label: any, items: any[]) => {
                        const payload = items?.[0]?.payload as DailySummaryItem;
                        return payload ? `${payload.dayName} (${payload.formattedDate})` : _label;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="screenTimeMinutes" 
                      name="screenTimeMinutes"
                      stroke="#0284c7" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorScreenArea)" 
                    />
                    <Bar 
                      dataKey="focusMinutes" 
                      name="focusMinutes"
                      fill="#0d9488" 
                      radius={[6, 6, 0, 0]} 
                      barSize={24} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> وقت التركيز (أعمدة)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> وقت الشاشة الكلي (مساحة)
                </span>
                <span className="text-teal-700 font-bold">
                  كفاءة التركيز: {weeklySummary.focusToScreenRatio}%
                </span>
              </div>
            </div>

          </div>

          {/* 7-DAY DETAILED BREAKDOWN GRID */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    سجل الأيام السبعة التفصيلي (7-Day Breakdown)
                  </h3>
                  <p className="text-[11px] text-slate-500">ملخص يوم بيوم يشمل الصلاة، جلسات التركيز، والحجب</p>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                مجموع الأسبوع: {weeklySummary.totalConfirmedPrayers}/35 صلاة • {weeklySummary.totalFocusHoursFormatted} تركيز
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {weeklySummary.days.map((day) => (
                <div 
                  key={day.dateStr}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    day.isToday 
                      ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/20 shadow-xs' 
                      : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/50'
                  }`}
                >
                  {/* Top: Day Title & Date */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        {day.dayName} {day.isToday && '🌟'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{day.formattedDate}</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      day.confirmedPrayers === 5 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                        : day.confirmedPrayers >= 4 
                        ? 'bg-teal-100 text-teal-800 border-teal-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {day.confirmedPrayers}/5 صلوات
                    </span>
                  </div>

                  {/* Middle metrics */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-teal-600" /> التركيز:
                      </span>
                      <span className="font-bold text-slate-900">{formatMins(day.focusMinutes)}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" /> الشاشة:
                      </span>
                      <span className="font-bold text-slate-900">{formatMins(day.screenTimeMinutes)}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-500" /> الحجب:
                      </span>
                      <span className="font-bold text-rose-700">{day.blockedAttempts}</span>
                    </div>
                  </div>

                  {/* Verdict tag */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-600 font-medium truncate block">
                      {day.statusVerdict}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: MONTHLY SUMMARY (30-DAY COMPREHENSIVE & 4-WEEK COMPARISON) */}
      {/* ========================================================================= */}
      {selectedSubTab === 'monthly_summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Monthly Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-teal-700/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    التقرير الشهري التراكمي (30 يوماً)
                  </span>
                  <span className="text-xs text-teal-200 font-mono bg-teal-950/80 px-2.5 py-0.5 rounded-lg border border-teal-700/50">
                    من {monthlySummary.days[0]?.formattedDate} إلى {monthlySummary.days[29]?.formattedDate}
                  </span>
                  {monthlySummary.prayerGrowthVsLastWeek >= 0 && (
                    <span className="text-xs text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-700/50 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      +{monthlySummary.prayerGrowthVsLastWeek}% نمو التزام الصلاة
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-black font-['Amiri',serif] text-teal-50">
                  {monthlySummary.monthlyGrade}
                </h3>
                <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
                  {monthlySummary.monthlyAdvice}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-950/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-teal-500/40 self-stretch lg:self-auto justify-around">
                <div className="text-center">
                  <span className="text-[11px] text-teal-300 font-bold block mb-1">مؤشر الانضباط الشهري</span>
                  <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono leading-none">
                    {monthlySummary.monthlyScore}%
                  </div>
                  <span className="text-[10px] text-teal-200/70 block mt-1">معدل الثبات العام</span>
                </div>
                <div className="w-px h-14 bg-teal-700/60"></div>
                <div className="text-center">
                  <span className="text-[11px] text-teal-300 font-bold block mb-1">جلسات الإنجاز (30 يوم)</span>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono leading-none">
                    {monthlySummary.totalFocusSessions}
                  </div>
                  <span className="text-[10px] text-teal-200/70 block mt-1">جلسة تركيز كاملة</span>
                </div>
              </div>

            </div>
          </div>

          {/* 4 Monthly KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Monthly Prayers */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-700">صلوات الـ 30 يوماً</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {monthlySummary.totalConfirmedPrayers}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 150 صلاة مفروضة</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${monthlySummary.prayerConsistencyPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-700">
                  نسبة الالتزام: {monthlySummary.prayerConsistencyPercentage}%
                </span>
                <span className="text-slate-400 font-mono">معدل {(monthlySummary.totalConfirmedPrayers / 30).toFixed(1)} يومياً</span>
              </div>
            </div>

            {/* Card 2: Deep Focus Hours */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-700">ساعات التركيز الشهرية</span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {monthlySummary.totalFocusHoursFormatted}
                </span>
                <span className="text-xs font-bold text-slate-400">({monthlySummary.totalFocusSessions} جلسة)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round((monthlySummary.totalFocusMinutes / (30 * 60)) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-teal-700">
                  معدل يومي: {monthlySummary.averageDailyFocusMinutes} دقيقة
                </span>
                <span className="text-slate-400 font-mono">كفاءة {monthlySummary.focusToScreenRatio}%</span>
              </div>
            </div>

            {/* Card 3: Blocked Distractions */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-700">المحجوبات والفتن المصدودة</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {monthlySummary.totalBlockedAttempts}
                </span>
                <span className="text-xs font-bold text-slate-400">محاولة مصدودة</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-rose-700">
                  حماية 30 يوماً مستمرة 🛡️
                </span>
                <span className="text-slate-400 font-mono">حفظ البصر والقلب</span>
              </div>
            </div>

            {/* Card 4: Istighfar & Remembrance */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-700">رصيد الاستغفار والذكر</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {monthlySummary.totalIstighfarCount}
                </span>
                <span className="text-xs font-bold text-slate-400">تسبيحة واستغفار</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-cyan-700">
                  معدل {Math.round(monthlySummary.totalIstighfarCount / 30)} يومياً
                </span>
                <span className="text-slate-400 font-mono">طهارة دائمة ✨</span>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* SECTION: 4-WEEK COMPARISON (مقارنة الأسابيع الأربعة الأخيرة) */}
          {/* ========================================================================= */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Amiri',serif]">
                    مقارنة الأداء والإنتاجية بين الأسابيع الأربعة الأخيرة (4-Week Comparative Analysis)
                  </h3>
                  <p className="text-xs text-slate-500">
                    مقارنة تفصيلية لتطور التزام الصلاة وساعات التركيز ونسب الحجب أسبوعاً بأسبوع
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 self-start sm:self-auto">
                مقارنة 4 أسابيع متتالية 📊
              </span>
            </div>

            {/* 4 Week Metric Cards Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {monthlySummary.weeksComparison.map((week, idx) => {
                const isCurrentWeek = idx === 3;
                return (
                  <div 
                    key={week.weekKey}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3.5 ${
                      isCurrentWeek
                        ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Week Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                          {week.weekLabel}
                          {isCurrentWeek && <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{week.dateRangeLabel}</span>
                      </div>
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border ${
                        week.productivityScore >= 80 
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                          : week.productivityScore >= 60 
                          ? 'bg-teal-100 text-teal-900 border-teal-300' 
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        مؤشر {week.productivityScore}%
                      </span>
                    </div>

                    {/* Breakdown Numbers */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-emerald-600" /> الصلوات:
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          {week.confirmedPrayers} / {week.possiblePrayers} ({week.prayerPercentage}%)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-teal-600" /> التركيز:
                        </span>
                        <span className="font-bold text-teal-700 font-mono">
                          {week.focusHoursFormatted} ({week.focusSessions} جلسة)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" /> الشاشة:
                        </span>
                        <span className="font-bold text-slate-800 font-mono">
                          {week.screenHoursFormatted}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> الحجب والذكر:
                        </span>
                        <span className="font-bold text-slate-800 font-mono text-[11px]">
                          {week.blockedAttempts} حجب • {week.istighfarCount} ذكر
                        </span>
                      </div>
                    </div>

                    {/* Week Progress Bar */}
                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-teal-600 h-full rounded-full" 
                          style={{ width: `${week.productivityScore}%` }} 
                        />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* CHARTS: Multi-Week Comparisons (Recharts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              
              {/* CHART 1: Weekly Prayer Adherence Comparison (BarChart) */}
              <div className="p-5 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-emerald-600" />
                      مقارنة نسبة أداء الصلاة بين الأسابيع الأربعة (%)
                    </h4>
                    <p className="text-[11px] text-slate-500">تدرج نسبة الصلوات المؤداة أسبوعاً بأسبوع</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    الهدف 100%
                  </span>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySummary.weeksComparison} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} dy={8} />
                      <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                        formatter={(value: number, _name: string, item: any) => {
                          const payload = item?.payload as WeekComparisonItem;
                          return [
                            `${value}% (${payload.confirmedPrayers} من ${payload.possiblePrayers} صلاة)`,
                            'نسبة أداء الصلوات'
                          ];
                        }}
                      />
                      <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" />
                      <Bar dataKey="prayerPercentage" radius={[8, 8, 0, 0]} barSize={34}>
                        {monthlySummary.weeksComparison.map((entry, index) => (
                          <Cell 
                            key={`week-prayer-cell-${index}`} 
                            fill={index === 3 ? '#0d9488' : '#10b981'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>الأسبوع 1: {monthlySummary.weeksComparison[0]?.prayerPercentage}%</span>
                  <span>الأسبوع 2: {monthlySummary.weeksComparison[1]?.prayerPercentage}%</span>
                  <span>الأسبوع 3: {monthlySummary.weeksComparison[2]?.prayerPercentage}%</span>
                  <span className="font-bold text-teal-700">الأسبوع 4 (الحالي): {monthlySummary.weeksComparison[3]?.prayerPercentage}%</span>
                </div>
              </div>

              {/* CHART 2: Focus Hours vs Screen Time Across 4 Weeks (Grouped Bar / ComposedChart) */}
              <div className="p-5 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-teal-600" />
                      مقارنة ساعات التركيز وساعات الشاشة أسبوعياً
                    </h4>
                    <p className="text-[11px] text-slate-500">تطور العمل العميق مقارنة بالوقت الإجمالي للشاشة</p>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                    بالساعات ⏱️
                  </span>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySummary.weeksComparison} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'focusHours') return [`${value} ساعة`, 'ساعات التركيز العميق'];
                          if (name === 'screenHours') return [`${value} ساعة`, 'إجمالي ساعات الشاشة'];
                          return [value, name];
                        }}
                      />
                      <Legend 
                        formatter={(value) => value === 'focusHours' ? 'ساعات التركيز' : 'ساعات الشاشة'} 
                        wrapperStyle={{ fontSize: 11, paddingTop: 6 }} 
                      />
                      <Bar dataKey="focusHours" name="focusHours" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={20} />
                      <Bar dataKey="screenHours" name="screenHours" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> ساعات التركيز العميق
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> إجمالي ساعات الشاشة
                  </span>
                  <span className="text-teal-700 font-bold">
                    المجموع: {monthlySummary.totalFocusHoursFormatted}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* SECTION: 30-DAY CONTINUOUS DAILY PERFORMANCE CURVE */}
          {/* ========================================================================= */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base font-['Amiri',serif]">
                    منحنى الأداء اليومي المستمر على مدار 30 يوماً (30-Day Daily Timeline)
                  </h3>
                  <p className="text-[11px] text-slate-500">مسار دقّة أداء الصلوات الخمس ودقائق التركيز اليومية</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                30 نقطة بيانات متتالية 📈
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySummary.days} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMonthFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="formattedDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    interval={3}
                    dy={8} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    cursor={{ stroke: '#0d9488', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'focusMinutes') return [formatMins(value), 'دقائق التركيز'];
                      if (name === 'confirmedPrayers') return [`${value} من 5 صلوات`, 'الصلوات المؤداة'];
                      return [value, name];
                    }}
                    labelFormatter={(_label: any, items: any[]) => {
                      const payload = items?.[0]?.payload as DailySummaryItem;
                      return payload ? `${payload.dayName} (${payload.formattedDate})` : _label;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="focusMinutes" 
                    name="focusMinutes"
                    stroke="#0d9488" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorMonthFocus)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confirmedPrayers" 
                    name="confirmedPrayers"
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={{ r: 2, fill: '#f59e0b' }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> دقائق التركيز اليومية (مساحة متدرجة)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> عدد الصلوات المؤداة (خط أصفر 0-5)
              </span>
              <span className="text-slate-700 font-medium">
                متوسط يومي: {monthlySummary.averageDailyFocusMinutes} دقيقة تركيز • {(monthlySummary.totalConfirmedPrayers / 30).toFixed(1)} صلاة
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB: YEARLY ACTIVITY HEATMAP (مخطط وتيرة النشاط الإيماني السنوي 52 أسبوعاً) */}
      {/* ========================================================================= */}
      {selectedSubTab === 'yearly_heatmap' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Banner & Filter Selector */}
          <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-emerald-900 text-white p-6 sm:p-7 rounded-3xl shadow-md space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
                  <Grid className="w-3.5 h-3.5 text-amber-300" />
                  <span>المخطط الحراري السنوي ({yearlyHeatmap.year}) — من يناير حتى ديسمبر</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-['Amiri',serif] text-white flex items-center gap-2">
                  سجل الاستمرارية الإيمانية والمواظبة على الطاعات
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                  خريطة تقويمية سنوية متكاملة تبدأ من أول يناير حتى نهاية ديسمبر، توضح وتيرة محافظتك على الصلوات الخمس ورصيد التسبيح والتركيز.
                </p>
              </div>

              {/* Metric Filter Tabs */}
              <div className="bg-teal-950/70 p-1.5 rounded-2xl border border-teal-700/60 flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setHeatmapFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    heatmapFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs font-black'
                      : 'text-emerald-200 hover:text-white hover:bg-teal-800/60'
                  }`}
                >
                  🌿 النشاط الشامل
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapFilter('prayers')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    heatmapFilter === 'prayers'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs font-black'
                      : 'text-emerald-200 hover:text-white hover:bg-teal-800/60'
                  }`}
                >
                  🕌 الصلوات (5/5)
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapFilter('istighfar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    heatmapFilter === 'istighfar'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs font-black'
                      : 'text-emerald-200 hover:text-white hover:bg-teal-800/60'
                  }`}
                >
                  📿 الأذكار والاستغفار
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapFilter('focus')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    heatmapFilter === 'focus'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs font-black'
                      : 'text-emerald-200 hover:text-white hover:bg-teal-800/60'
                  }`}
                >
                  🎯 ساعات التركيز
                </button>
              </div>
            </div>

            {/* 4 Yearly KPI Cards Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 relative z-10">
              
              <div className="bg-teal-950/60 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-teal-700/50 flex flex-col justify-between">
                <span className="text-[11px] text-emerald-300 font-bold block mb-1">
                  نسبة الاستقامة على الصلاة
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {yearlyHeatmap.prayerAdherencePercentage}%
                  </span>
                  <span className="text-[10px] text-emerald-200 font-mono">
                    ({yearlyHeatmap.totalYearlyPrayers.toLocaleString('ar-EG')} صلاة)
                  </span>
                </div>
                <div className="w-full bg-teal-900/80 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${yearlyHeatmap.prayerAdherencePercentage}%` }} />
                </div>
              </div>

              <div className="bg-teal-950/60 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-teal-700/50 flex flex-col justify-between">
                <span className="text-[11px] text-emerald-300 font-bold block mb-1">
                  أيام النشاط والاستمرارية
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-amber-300">
                    {yearlyHeatmap.totalActiveDays}
                  </span>
                  <span className="text-[10px] text-emerald-200">
                    من أصل {yearlyHeatmap.totalEvaluatedDays} يوماً
                  </span>
                </div>
                <span className="text-[10px] text-emerald-300/90 mt-1 font-semibold">
                  معدل ثبات: {Math.round((yearlyHeatmap.totalActiveDays / yearlyHeatmap.totalEvaluatedDays) * 100)}% من العام
                </span>
              </div>

              <div className="bg-teal-950/60 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-teal-700/50 flex flex-col justify-between">
                <span className="text-[11px] text-emerald-300 font-bold block mb-1">
                  أطول سلسلة ثبات متصلة
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white flex items-center gap-1">
                    {yearlyHeatmap.longestStreak} <Flame className="w-5 h-5 text-amber-400 fill-current" />
                  </span>
                  <span className="text-[10px] text-emerald-200">يوماً متتالياً</span>
                </div>
                <span className="text-[10px] text-amber-300 mt-1 font-semibold">
                  الحالية: {yearlyHeatmap.currentStreak} يوم مستمر
                </span>
              </div>

              <div className="bg-teal-950/60 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-teal-700/50 flex flex-col justify-between">
                <span className="text-[11px] text-emerald-300 font-bold block mb-1">
                  رصيد الأذكار والاستغفار
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-200 font-mono">
                    {yearlyHeatmap.totalYearlyIstighfar.toLocaleString('ar-EG')}
                  </span>
                  <span className="text-[10px] text-emerald-300">تسبيحة</span>
                </div>
                <span className="text-[10px] text-emerald-300/90 mt-1 font-semibold">
                  +{yearlyHeatmap.totalYearlyFocusHoursFormatted} تركيز
                </span>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE 52-WEEK HEATMAP VISUAL GRID (CALENDAR MATRIX) */}
          {/* ========================================================================= */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-black">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Amiri',serif] flex items-center gap-2">
                    المخطط السنوي المتصل (52 أسبوعاً × 7 أيام)
                  </h3>
                  <p className="text-xs text-slate-500">
                    مرر الفأرة أو اضغط على أي مربع لمعاينة تفاصيل اليوم بدقة (الصلاة، الأذكار، التركيز).
                  </p>
                </div>
              </div>

              {/* Intensity Legend */}
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">أقل نشاط</span>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-[3px] bg-slate-100 border border-slate-200" title="المستوى 0 (فارغ / لم يُسجل)" />
                  <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-200" title="المستوى 1 (نشاط خفيف)" />
                  <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-400" title="المستوى 2 (نشاط متوسط)" />
                  <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-600" title="المستوى 3 (نشاط مرتفع)" />
                  <span className="w-3.5 h-3.5 rounded-[3px] bg-teal-950 ring-1 ring-amber-400" title="المستوى 4 (يوم نوراني استثنائي)" />
                </div>
                <span className="text-[11px] font-bold text-teal-800">أعلى نشاط 🌟</span>
              </div>
            </div>

            {/* Scrollable Heatmap Canvas */}
            <div className="overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              <div className="min-w-[780px] select-none">
                
                {/* Month Names Header Row - precisely matching each week column position */}
                <div className="flex gap-2 items-center mb-1.5">
                  {/* Space matching Day Labels on the right */}
                  <div className="shrink-0 w-10 text-transparent select-none text-[10px] pointer-events-none" aria-hidden="true" />

                  {/* 52 Columns Grid Header */}
                  <div className="flex gap-1 sm:gap-1.5 flex-1 relative h-5">
                    {yearlyHeatmap.weeks.map((_, weekIdx) => {
                      const monthLabel = yearlyHeatmap.monthLabels.find(m => m.weekIndex === weekIdx);
                      return (
                        <div key={`month-col-${weekIdx}`} className="w-3.5 sm:w-4 shrink-0 relative">
                          {monthLabel && (
                            <span className="absolute top-0 right-0 text-[10px] sm:text-[11px] font-bold text-slate-500 whitespace-nowrap z-0 pointer-events-none">
                              {monthLabel.name}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Main Grid: 7 Rows (Saturday to Friday) with 52 Columns */}
                <div className="flex gap-2 items-start">
                  
                  {/* Row Day Labels on the right */}
                  <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-400 shrink-0 w-10 pt-0.5 text-right">
                    <span className="h-3.5 sm:h-4 leading-none flex items-center justify-end">السبت</span>
                    <span className="h-3.5 sm:h-4 leading-none flex items-center justify-end text-slate-300">الأحد</span>
                    <span className="h-3.5 sm:h-4 leading-none flex items-center justify-end">الإثنين</span>
                    <span className="h-3.5 sm:h-4 leading-none flex items-center justify-end text-slate-300">الثلاثاء</span>
                    <span className="h-3.5 sm:h-4 leading-none flex items-center justify-end">الأربعاء</span>
                    <span className="h-3.5 sm:h-4 leading-none flex items-center justify-end text-slate-300">الخميس</span>
                    <span className="h-3.5 sm:h-4 leading-none flex items-center justify-end font-extrabold text-teal-700">الجمعة</span>
                  </div>

                  {/* 52 Columns Grid */}
                  <div className="flex gap-1 sm:gap-1.5 flex-1">
                    {yearlyHeatmap.weeks.map((weekCol, weekIdx) => (
                      <div key={`week-col-${weekIdx}`} className="flex flex-col gap-1 sm:gap-1.5 shrink-0">
                        {weekCol.map((day, dayIdx) => {
                          if (!day) {
                            return <div key={`empty-${dayIdx}`} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] opacity-0" />;
                          }

                          let cellBg = 'bg-slate-100 hover:bg-slate-200';
                          if (day.isOutsideYear) {
                            cellBg = 'bg-transparent opacity-0 pointer-events-none cursor-default';
                          } else if (day.isFuture) {
                            cellBg = 'bg-slate-50/60 border border-slate-100 opacity-40 cursor-default';
                          } else if (day.intensityLevel === 4) {
                            cellBg = 'bg-teal-950 ring-1 ring-amber-400 shadow-2xs hover:scale-125';
                          } else if (day.intensityLevel === 3) {
                            cellBg = 'bg-emerald-600 hover:scale-125';
                          } else if (day.intensityLevel === 2) {
                            cellBg = 'bg-emerald-400 hover:scale-125';
                          } else if (day.intensityLevel === 1) {
                            cellBg = 'bg-emerald-200 hover:scale-125';
                          }

                          const isSelected = selectedHeatmapCell?.dateStr === day.dateStr;

                          return (
                            <button
                              key={day.dateStr}
                              type="button"
                              disabled={day.isOutsideYear}
                              onClick={() => !day.isFuture && !day.isOutsideYear && setSelectedHeatmapCell(day)}
                              onMouseEnter={() => !day.isFuture && !day.isOutsideYear && setSelectedHeatmapCell(day)}
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] transition-all cursor-pointer relative ${cellBg} ${
                                isSelected ? 'ring-2 ring-teal-600 ring-offset-1 scale-125 z-10' : ''
                              } ${day.isToday ? 'ring-2 ring-amber-400 ring-offset-1 animate-pulse' : ''}`}
                              title={day.isOutsideYear ? '' : `${day.dayName} ${day.formattedDate}: ${day.statusLabel}`}
                            >
                              {day.isToday && (
                                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            </div>

            {/* Interactive Selected Day Inspector Panel */}
            {selectedHeatmapCell ? (
              <div className="p-4 sm:p-5 bg-gradient-to-l from-teal-50/80 via-emerald-50/60 to-slate-50 rounded-2xl border border-teal-200/90 shadow-2xs space-y-3 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded-[4px] ${
                      selectedHeatmapCell.intensityLevel === 4 ? 'bg-teal-950 ring-1 ring-amber-400' :
                      selectedHeatmapCell.intensityLevel === 3 ? 'bg-emerald-600' :
                      selectedHeatmapCell.intensityLevel === 2 ? 'bg-emerald-400' :
                      selectedHeatmapCell.intensityLevel === 1 ? 'bg-emerald-200' : 'bg-slate-200'
                    }`} />
                    <span className="text-sm sm:text-base font-black text-slate-900 font-['Amiri',serif]">
                      {selectedHeatmapCell.dayName}، {selectedHeatmapCell.formattedDate}
                    </span>
                    {selectedHeatmapCell.isToday && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black">
                        اليوم الحالي 🌟
                      </span>
                    )}
                  </div>
                  
                  <span className="text-xs font-bold text-teal-900 bg-teal-100/80 px-3 py-1 rounded-xl border border-teal-200 self-start sm:self-auto">
                    {selectedHeatmapCell.statusLabel}
                  </span>
                </div>

                {/* Day Metric Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-0.5 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-emerald-600" /> الصلوات المؤداة:
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {selectedHeatmapCell.confirmedPrayers} من 5 صلوات
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" /> الأذكار والاستغفار:
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {selectedHeatmapCell.istighfarCount} تسبيحة وذكر
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-0.5 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-blue-600" /> جلسات التركيز:
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {selectedHeatmapCell.focusMinutes} دقيقة عمل عميق
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> المشتتات المحجوبة:
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {selectedHeatmapCell.blockedAttempts} محاولات محصنة
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                مرر مؤشر الفأرة على أي مربع من مربعات الـ 52 أسبوعاً لعرض تفاصيل ذلك اليوم.
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* ANNUAL CONTINUITY & SPIRITUAL MOMENTUM INSIGHTS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Prophetic Persistence Wisdom */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-teal-800">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base font-['Amiri',serif]">
                    فلسفة الاستمرارية في المنهاج النبوي
                  </h4>
                </div>

                <blockquote className="p-4 bg-teal-50/70 border-r-4 border-teal-600 rounded-2xl text-xs sm:text-sm text-teal-950 font-bold leading-relaxed font-['Amiri',serif]">
                  «سُئِلَ رَسُولُ اللَّهِ ﷺ: أَيُّ الأَعْمَالِ أَحَبُّ إِلَى اللَّهِ؟ قَالَ: أَدْوَمُهَا وَإِنْ قَلَّ»
                </blockquote>

                <p className="text-xs text-slate-600 leading-relaxed">
                  قيمة هذا المخطط الحراري ليست في الوصول إلى 100% كل يوم دون استثناء، بل في <strong>عدم الانقطاع الطويل</strong>. اليوم الهادئ يتبعه عزم متجدد، وركعتان خاشعتان مع تسبيح يسير يومياً خير من عبادة متقطعة تتبعها شهور من الغفلة.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>المداومة تبني الهوية الإيمانية الراسخة 🌱</span>
                <span className="font-bold text-teal-700">ثبات دائم</span>
              </div>
            </div>

            {/* Quarterly Momentum Breakdown (Q1 to Q4) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base font-['Amiri',serif]">
                    توزيع وتيرة الثبات عبر فصول العام (Quarterly Momentum)
                  </h4>
                </div>
                <span className="text-[11px] font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                  عام {yearlyHeatmap.year}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>الربع الأول (يناير - مارس) • بواكير العام والاستعداد</span>
                    <span className="text-emerald-700">92% ثبات</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>الربع الثاني (أبريل - يونيو) • موسم إقبال الطاعات</span>
                    <span className="text-emerald-700">95% ثبات</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>الربع الثالث (يوليو - سبتمبر) • مجاهدة الفراغ والصيف</span>
                    <span className="text-teal-700">88% ثبات</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>الربع الرابع (أكتوبر - ديسمبر) • قطاف الثمار وحصاد الانضباط</span>
                    <span className="text-emerald-800 font-black">94% ثبات</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-700 h-full rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>

              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>يتم تحديث المخطط الحراري تلقائياً فور تأكيد أي صلاة أو تسجيل ذكر واستغفار أو جلسة تركيز.</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: PRAYER & FOCUS DEEP DIVE */}
      {/* ========================================================================= */}
      {selectedSubTab === 'prayer_focus' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Prayer Adherence Radial / Gauge */}
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                  <Heart className="w-5 h-5 text-teal-600" />
                  الالتزام بالصلوات الخمس (اليوم)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  تأكيد أداء الصلوات في مواقيتها الشرعية وحفظ أركانها
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'أديتها', value: stats.confirmedPrayers || 0 },
                        { name: 'متبقية', value: Math.max(0, 5 - (stats.confirmedPrayers || 0)) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#0d9488" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-teal-900">{stats.confirmedPrayers || 0}/5</span>
                  <span className="text-xs text-teal-600 font-bold">صلوات اليوم</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>المتبقي اليوم: {Math.max(0, 5 - (stats.confirmedPrayers || 0))} صلوات</span>
                <span className="text-teal-700 font-bold">حافظ عليها تسعد دنيا وآخرة ✨</span>
              </div>
            </div>

            {/* Weekly Prayer Trend Area Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  منحنى المواظبة على الصلاة (7 أيام)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  معدل الصلوات المؤداة في كل يوم من الأيام السبعة الماضية
                </p>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklySummary.days} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrayerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="dayShort" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                      formatter={(value: number) => [`${value} من 5 صلوات`, 'المؤداة']}
                    />
                    <Area type="monotone" dataKey="confirmedPrayers" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPrayerGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>المتوسط الأسبوعي: {(weeklySummary.totalConfirmedPrayers / 7).toFixed(1)} صلاة / يوم</span>
                <span className="text-emerald-700 font-bold">ثبات مستمر 🌟</span>
              </div>
            </div>

          </div>

          {/* Deep Focus Breakdown Table */}
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                تحليل أوقات العمل العميق والتركيز (Focus Sessions Analysis)
              </h3>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                إجمالي الأسبوع: {weeklySummary.totalFocusHoursFormatted}
              </span>
            </div>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySummary.days} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dayShort" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                    formatter={(value: number) => [formatMins(value), 'وقت التركيز']}
                  />
                  <Bar dataKey="focusMinutes" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: SPIRITUAL VICTORIES & REWARDS */}
      {/* ========================================================================= */}
      {selectedSubTab === 'victories' && (
        <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-['Amiri',serif]">
                  توزيع المكتسبات والانتصارات الإيمانية (Spiritual Victories)
                </h2>
                <p className="text-xs text-slate-500">
                  رصد تصنيفات لحظات الثبات وغض البصر وإتمام الطاعات
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                أعلى تصنيف: {victoryChartData.topCategory} 🌟
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Donut Chart: Proportions */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <h4 className="text-xs font-bold text-slate-600 mb-2">نسب توزيع المكتسبات</h4>
              <div className="w-full h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={victoryChartData.active}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {victoryChartData.active.map((entry, index) => (
                        <Cell key={`vic-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                      formatter={(value: number) => [`${value} نصر ومكتسب`, 'العدد']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 font-mono">{victories.length}</span>
                  <span className="text-[11px] text-slate-500 font-bold">مكتسب روحي</span>
                </div>
              </div>
            </div>

            {/* Bar Chart: Counts by Category */}
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-bold text-slate-600">إحصاءات الانتصارات حسب التصنيف</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={victoryChartData.all} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#334155' }} width={85} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                      formatter={(value: number) => [`${value} مرة`, 'عدد المرات']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                      {victoryChartData.all.map((entry, index) => (
                        <Cell key={`vic-bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: SCREEN TIME & DISTRACTIONS */}
      {/* ========================================================================= */}
      {selectedSubTab === 'screen_distractions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          
          {/* 1. Screen Time Trend */}
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-blue-500" />
              معدل وقت الشاشة اليومي (آخر 7 أيام)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklySummary.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dayShort" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                    formatter={(value: number) => [`${Math.floor(value / 60)}س ${value % 60}د`, 'وقت الشاشة']}
                  />
                  <Area type="monotone" dataKey="screenTimeMinutes" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScreen)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>إجمالي وقت الشاشة للأسبوع: {weeklySummary.totalScreenTimeHoursFormatted}</span>
              <span>المتوسط اليومي: {formatMins(weeklySummary.averageDailyScreenMinutes)}</span>
            </div>
          </div>

          {/* 2. Blocked Attempts Trend */}
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              محاولات التشتت المحجوبة (آخر 7 أيام)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySummary.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dayShort" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                    formatter={(value: number) => [value, 'موقع محجوب']}
                  />
                  <Bar dataKey="blockedAttempts" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>إجمالي المحجوبات للأسبوع: {weeklySummary.totalBlockedAttempts} محاولة</span>
              <span className="text-rose-600 font-bold">حماية مستمرة 🛡️</span>
            </div>
          </div>

          {/* 3. Distraction Categories (Donut) */}
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200 lg:col-span-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              تحليل أنواع المشتتات المحظورة
            </h3>
            {totalDistractions > 0 ? (
              <div className="flex flex-col sm:flex-row items-center h-full gap-6">
                <div className="w-full sm:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distractionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {distractionData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={DISTRACTION_COLORS[index % DISTRACTION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-3">
                  {distractionData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DISTRACTION_COLORS[i % DISTRACTION_COLORS.length] }}></div>
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{Math.round((item.value / totalDistractions) * 100)}% ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-teal-500" />
                </div>
                <p className="text-slate-500 text-sm">أداء ممتاز! لم يتم تسجيل أي محاولات تشتت مسجلة.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
