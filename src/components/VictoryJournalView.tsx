import React, { useState } from 'react';
import { 
  Trophy, 
  Moon, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  Calendar,
  Flame,
  Plus,
  Eye,
  Heart,
  BookOpen,
  ShieldAlert,
  FlameKindling,
  X,
  Briefcase,
  Dumbbell
} from 'lucide-react';
import { VictoryLog, VictoryCategory } from '../types';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';

interface VictoryJournalViewProps {
  victories: VictoryLog[];
  streakDays: number;
  onOpenTawbahPlan: () => void;
  onOpenPanic: () => void;
  onAddVictory?: (title: string, category: VictoryCategory, notes?: string) => void;
}

export const VICTORY_CATEGORY_CONFIG: Record<VictoryCategory, {
  label: string;
  icon: typeof Eye;
  color: string;
  bgLight: string;
  border: string;
}> = {
  gaze_lowered: {
    label: 'غض بصر',
    icon: Eye,
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50',
    border: 'border-indigo-200'
  },
  prayer_completed: {
    label: 'إتمام صلاة',
    icon: Heart,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-200'
  },
  quran_recited: {
    label: 'قراءة ورد',
    icon: BookOpen,
    color: 'text-teal-600',
    bgLight: 'bg-teal-50',
    border: 'border-teal-200'
  },
  work_accomplishment: {
    label: 'إنجاز عمل',
    icon: Briefcase,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200'
  },
  sports_fitness: {
    label: 'رياضة',
    icon: Dumbbell,
    color: 'text-orange-600',
    bgLight: 'bg-orange-50',
    border: 'border-orange-200'
  },
  resisted_urge: {
    label: 'مقاومة وسواس',
    icon: ShieldCheck,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    border: 'border-amber-200'
  },
  istighfar_adhkar: {
    label: 'استغفار وذكر',
    icon: Sparkles,
    color: 'text-cyan-600',
    bgLight: 'bg-cyan-50',
    border: 'border-cyan-200'
  },
  panic_rescue: {
    label: 'زر الاستغاثة',
    icon: ShieldAlert,
    color: 'text-rose-600',
    bgLight: 'bg-rose-50',
    border: 'border-rose-200'
  }
};

export const VictoryJournalView: React.FC<VictoryJournalViewProps> = ({
  victories,
  streakDays,
  onOpenTawbahPlan,
  onOpenPanic,
  onAddVictory
}) => {
  const currentHour = new Date().getHours();
  const isLateNight = currentHour >= 23 || currentHour < 5;

  const [isAddingVictory, setIsAddingVictory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<VictoryCategory>('gaze_lowered');
  const [customTitle, setCustomTitle] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleSaveVictory = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = customTitle.trim() || `نصر: ${VICTORY_CATEGORY_CONFIG[selectedCategory].label}`;
    
    if (onAddVictory) {
      onAddVictory(finalTitle, selectedCategory, customNotes.trim() || undefined);
    }
    
    sounds.playSuccessTone();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // safe fallback
    }

    setCustomTitle('');
    setCustomNotes('');
    setIsAddingVictory(false);
  };

  const filteredVictories = victories.filter(v => {
    if (filterCategory === 'all') return true;
    const cat = v.category || (v.type === 'panic_button' ? 'panic_rescue' : 'resisted_urge');
    return cat === filterCategory;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Late-Night Vulnerability Heatmap & Advisor */}
      {isLateNight && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Moon className="w-6 h-6 text-indigo-300 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 border border-indigo-300/30">
                    منطقة ضعف وتأهب روحي • ساعات الليل المتأخرة
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-white font-['Amiri',serif]">
                  الوقت متأخر يا أخي.. النوم الآن عبادة وصيانة لقلبك ولصلاة الفجر
                </h4>
                <p className="text-xs text-indigo-200/80 max-w-xl leading-relaxed">
                  تُثبت الدراسات وتجارب السالكين أن معظم الانتكاسات تحدث في خلوات الليل المتأخرة بعد الإنهاك الذهني. أغلق شاشتك الآن، واقرأ سورة الملك وتوضأ قبل النوم.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={onOpenPanic}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                زر غض البصر 🛡️
              </button>
              <button
                onClick={onOpenTawbahPlan}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                خطة التوبة النصوح 🌿
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Victory Journal & Streak Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-['Amiri',serif]">
                سجل الانتصارات والمكتسبات الإيمانية
              </h3>
              <p className="text-xs text-slate-500">
                كل لحظة آثرت فيها مرضاة الله على شهوة نفسك هي نصر يُكتب في صحيفتك
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingVictory(!isAddingVictory)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل نصر جديد</span>
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>{streakDays} أيام ثبات</span>
            </span>
          </div>
        </div>

        {/* Form to Add Victory with Category Selection */}
        {isAddingVictory && (
          <form onSubmit={handleSaveVictory} className="mb-6 p-4 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-teal-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>إضافة نصر أو مكتسب إيماني جديد</span>
              </h4>
              <button 
                type="button" 
                onClick={() => setIsAddingVictory(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                اختر تصنيف النصر:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(VICTORY_CATEGORY_CONFIG) as VictoryCategory[]).map((catKey) => {
                  const cfg = VICTORY_CATEGORY_CONFIG[catKey];
                  const Icon = cfg.icon;
                  const isSelected = selectedCategory === catKey;
                  return (
                    <button
                      type="button"
                      key={catKey}
                      onClick={() => setSelectedCategory(catKey)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer text-right ${
                        isSelected 
                          ? `${cfg.bgLight} ${cfg.border} ${cfg.color} ring-2 ring-teal-500/40 shadow-xs`
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Notes Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  عنوان النصر (اختياري):
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`مثال: نصر ${VICTORY_CATEGORY_CONFIG[selectedCategory].label}`}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-teal-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ملاحظات أو خاطرة إيمانية (اختياري):
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="مثال: استعذت بالله وتركت الهاتف وتوضأت"
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-teal-600 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingVictory(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                حفظ النصر في الصحيفة ✨
              </button>
            </div>
          </form>
        )}

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-slate-100">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({victories.length})
          </button>
          {(Object.keys(VICTORY_CATEGORY_CONFIG) as VictoryCategory[]).map((catKey) => {
            const cfg = VICTORY_CATEGORY_CONFIG[catKey];
            const count = victories.filter(v => (v.category || (v.type === 'panic_button' ? 'panic_rescue' : 'resisted_urge')) === catKey).length;
            if (count === 0 && filterCategory !== catKey) return null;
            return (
              <button
                key={catKey}
                onClick={() => setFilterCategory(catKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterCategory === catKey
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Victories List */}
        {filteredVictories.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-teal-600 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-700">لا توجد انتصارات مسجلة في هذا التصنيف</p>
            <p className="text-xs text-slate-500 mt-1">
              سجّل صمودك أو غض بصرك الآن لتعزيز مسار الثبات ورفع همتك الإيمانية.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVictories.slice(0, 10).map((vic) => {
              const catKey = (vic.category || (vic.type === 'panic_button' ? 'panic_rescue' : 'resisted_urge')) as VictoryCategory;
              const cfg = VICTORY_CATEGORY_CONFIG[catKey] || VICTORY_CATEGORY_CONFIG.gaze_lowered;
              const Icon = cfg.icon;

              return (
                <div 
                  key={vic.id}
                  className={`p-4 rounded-2xl ${cfg.bgLight} border ${cfg.border} flex items-start justify-between gap-4 transition-all hover:shadow-2xs`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-white border ${cfg.border} ${cfg.color} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-900">{vic.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border ${cfg.border} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      {vic.notes && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{vic.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap font-mono">
                    {vic.timestamp}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
