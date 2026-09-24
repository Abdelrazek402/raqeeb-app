import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Filter,
  Layers,
  Smartphone,
  Laptop,
  Globe,
  Search,
  RotateCcw,
  CheckCheck,
  ShieldCheck
} from 'lucide-react';
import { ChecklistItem } from '../types';

interface ChecklistViewProps {
  items: ChecklistItem[];
  onUpdateStatus: (itemId: string, status: ChecklistItem['status']) => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  items,
  onUpdateStatus
}) => {
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'android' | 'windows' | 'extension' | 'core'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Platform filter
      if (filterPlatform === 'android' && item.platform !== 'android') return false;
      if (filterPlatform === 'windows' && item.platform !== 'windows') return false;
      if (filterPlatform === 'extension' && item.platform !== 'extension') return false;
      if (filterPlatform === 'core' && item.platform !== 'all') return false;

      // Status filter
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesPhase = item.phaseTitle.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesPhase) return false;
      }

      return true;
    });
  }, [items, filterPlatform, filterStatus, searchQuery]);

  const completedCount = items.filter(i => i.status === 'completed').length;
  const testedCount = items.filter(i => i.status === 'tested').length;
  const inProgressCount = items.filter(i => i.status === 'in_progress').length;
  const plannedCount = items.filter(i => i.status === 'planned').length;
  const progressPercent = Math.round(((completedCount + testedCount * 0.5) / items.length) * 100);

  const statusConfig = {
    planned: { label: '⬜ مخطط', color: 'text-slate-700 bg-slate-200 border-slate-300' },
    in_progress: { label: '🟡 قيد التطوير', color: 'text-amber-800 bg-amber-100 border-amber-300' },
    tested: { label: '🧪 تم الاختبار', color: 'text-teal-800 bg-teal-100 border-teal-300' },
    completed: { label: '✅ مكتمل', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' },
  };

  const platformLabels: Record<string, { label: string; icon: React.ReactNode; badgeColor: string }> = {
    all: { label: 'نظام عام مشترك', icon: <ShieldCheck className="w-3 h-3" />, badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    android: { label: 'أندرويد APK', icon: <Smartphone className="w-3 h-3" />, badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    windows: { label: 'ويندوز PC', icon: <Laptop className="w-3 h-3" />, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    extension: { label: 'إضافة المتصفح', icon: <Globe className="w-3 h-3" />, badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  const handleMarkAllCompleted = () => {
    items.forEach(item => {
      onUpdateStatus(item.id, 'completed');
    });
  };

  const handleResetFilters = () => {
    setFilterPlatform('all');
    setFilterStatus('all');
    setSearchQuery('');
  };

  // Group filtered items by phase
  const visiblePhases = Array.from(new Set(filteredItems.map(i => i.phase))).sort((a: number, b: number) => a - b);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              خارطة طريق المشروع المعتمدة
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-['Amiri',serif] text-slate-900">
              قائمة التحقق وخارطة طريق المشروع (Project Checklist)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              متابعة حية لكل مكون في منظومة رَقِيب (لوحة التحكم بدون سيرفر، سكربتات ويندوز، خدمات أندرويد، وإضافات المتصفح).
            </p>
          </div>

          {/* Progress Box */}
          <div className="bg-gradient-to-br from-teal-50/50 to-slate-50 p-4 sm:p-5 rounded-2xl border border-teal-100 w-full md:w-auto md:min-w-[260px] shadow-2xs">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-800 font-bold flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-teal-600" />
                نسبة استكمال المشروع:
              </span>
              <span className="font-mono text-teal-700 font-black text-sm">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-600 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-600 mt-2.5 flex justify-between font-medium">
              <span className="text-emerald-700 font-bold">{completedCount} مكتمل</span>
              <span>{testedCount} مختبر</span>
              <span className="text-slate-500">{items.length - completedCount - testedCount} متبقي</span>
            </div>

            {progressPercent < 100 && (
              <button
                onClick={handleMarkAllCompleted}
                className="w-full mt-3 px-2 py-1 text-[11px] bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                اعتماد جميع المراحل كمكتملة (100%)
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters Controls */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المراحل أو الخصائص أو الكلمات المفتاحية..."
              className="w-full pr-10 pl-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Platform Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 flex items-center gap-1 font-semibold min-w-[70px]">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              المنصة:
            </span>

            <button
              id="filter-plat-all"
              onClick={() => setFilterPlatform('all')}
              className={`px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                filterPlatform === 'all' ? 'bg-teal-600 text-white border-teal-600 shadow-2xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              الكل ({items.length})
            </button>
            <button
              id="filter-plat-android"
              onClick={() => setFilterPlatform('android')}
              className={`px-3 py-1.5 rounded-xl border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterPlatform === 'android' ? 'bg-teal-600 text-white border-teal-600 shadow-2xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              أندرويد فقط ({items.filter(i => i.platform === 'android').length})
            </button>
            <button
              id="filter-plat-windows"
              onClick={() => setFilterPlatform('windows')}
              className={`px-3 py-1.5 rounded-xl border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterPlatform === 'windows' ? 'bg-teal-600 text-white border-teal-600 shadow-2xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              ويندوز فقط ({items.filter(i => i.platform === 'windows').length})
            </button>
            <button
              id="filter-plat-ext"
              onClick={() => setFilterPlatform('extension')}
              className={`px-3 py-1.5 rounded-xl border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterPlatform === 'extension' ? 'bg-teal-600 text-white border-teal-600 shadow-2xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              إضافة المتصفح ({items.filter(i => i.platform === 'extension').length})
            </button>
            <button
              id="filter-plat-core"
              onClick={() => setFilterPlatform('core')}
              className={`px-3 py-1.5 rounded-xl border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterPlatform === 'core' ? 'bg-teal-600 text-white border-teal-600 shadow-2xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              النظام المشترك ({items.filter(i => i.platform === 'all').length})
            </button>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-2">
            <span className="text-slate-500 font-semibold min-w-[70px]">
              الحالة:
            </span>

            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                filterStatus === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              كل الحالات
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                filterStatus === 'completed' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ✅ مكتمل ({completedCount})
            </button>
            <button
              onClick={() => setFilterStatus('tested')}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                filterStatus === 'tested' ? 'bg-teal-700 text-white border-teal-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🧪 تم الاختبار ({testedCount})
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                filterStatus === 'in_progress' ? 'bg-amber-700 text-white border-amber-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🟡 قيد العمل ({inProgressCount})
            </button>

            {(filterPlatform !== 'all' || filterStatus !== 'all' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="mr-auto px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                إعادة ضبط الفلترة
              </button>
            )}
          </div>

          {/* Active Filter Counter Banner */}
          <div className="bg-slate-50 px-3 py-2 rounded-xl text-xs text-slate-600 flex items-center justify-between border border-slate-200">
            <span>
              يتم الآن عرض <strong>{filteredItems.length}</strong> عنصر من أصل <strong>{items.length}</strong>
              {filterPlatform !== 'all' && ` (منصة: ${filterPlatform})`}
              {filterStatus !== 'all' && ` (حالة: ${filterStatus})`}
            </span>
            {filteredItems.length === 0 && (
              <span className="text-amber-700 font-semibold">
                لا توجد عناصر مطابقة للفلترة الحالية
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Empty State when filters yield zero items */}
      {filteredItems.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">لا توجد عناصر مطابقة للفلتر المحدد</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            جرّب تغيير المنصة أو إزالة كلمة البحث لإظهار بقية مراحل المشروع.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            عرض جميع المراحل (الكل)
          </button>
        </div>
      )}

      {/* Grouped by Phase list */}
      <div className="space-y-6">
        {visiblePhases.map((phaseNum) => {
          const phaseItems = filteredItems.filter(i => i.phase === phaseNum);
          if (phaseItems.length === 0) return null;
          const phaseTitle = phaseItems[0].phaseTitle;

          return (
            <div key={phaseNum} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-600" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {phaseTitle}
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium font-mono">
                  {phaseItems.length} عنصر
                </span>
              </div>

              <div className="space-y-3">
                {phaseItems.map((item) => {
                  const platInfo = platformLabels[item.platform] || platformLabels.all;
                  return (
                    <div 
                      key={item.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300 shadow-2xs"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {item.title}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${platInfo.badgeColor}`}>
                            {platInfo.icon}
                            {platInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                          {item.description}
                        </p>
                      </div>

                      {/* Status changer buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {(['planned', 'in_progress', 'tested', 'completed'] as const).map((st) => (
                          <button
                            key={st}
                            id={`status-btn-${item.id}-${st}`}
                            onClick={() => onUpdateStatus(item.id, st)}
                            className={`px-2.5 py-1.5 text-[11px] rounded-lg border font-semibold transition-all cursor-pointer ${
                              item.status === st
                                ? statusConfig[st].color + ' shadow-2xs scale-102 font-bold ring-1 ring-current'
                                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {statusConfig[st].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
