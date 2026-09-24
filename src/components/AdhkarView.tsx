import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Sparkles, 
  CheckCircle2, 
  Heart, 
  RotateCcw, 
  BookOpen, 
  Compass, 
  Layers, 
  Volume2, 
  VolumeX,
  Plus,
  BellRing,
  Clock,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { adhkarData, wisdomData, AdhkarItem } from '../data/adhkar';
import { sounds } from '../utils/audio';
import { AthkarReminderSettings } from '../types';
import { INITIAL_ATHKAR_SETTINGS } from '../utils/storage';
import { AthkarNotificationModal } from './AthkarNotificationModal';
import { getNotificationPermission } from '../utils/pushNotificationService';

interface AdhkarViewProps {
  onIncrementIstighfar?: () => void;
  istighfarTotal?: number;
  initialCategory?: 'morning' | 'evening' | 'post_prayer' | 'sleep' | 'tasbih';
  pairingCode?: string;
  athkarSettings?: AthkarReminderSettings;
  onUpdateAthkarSettings?: (newSettings: AthkarReminderSettings) => void;
}

type TabType = 'morning' | 'evening' | 'post_prayer' | 'sleep' | 'tasbih';

const TASBIH_OPTIONS = [
  { id: 'istighfar', text: 'أَسْتَغْفِرُ اللَّهَ العَظِيمَ وَأَتُوبُ إِلَيْهِ', category: 'istighfar', virtue: 'ممحاة للذنوب، جالب للرزق، تفريج للكروب' },
  { id: 'subhanallah', text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ العَظِيمِ', category: 'tasbih', virtue: 'كلمتان خفيفتان على اللسان، ثقيلتان في الميزان' },
  { id: 'hawqala', text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ العَلِيِّ العَظِيمِ', category: 'tasbih', virtue: 'كنز من كنوز الجنة ودواء لتسعة وتسعين داء' },
  { id: 'salawat', text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', category: 'salawat', virtue: 'من صلى عليّ صلاة صلى الله عليه بها عشراً' },
  { id: 'tahlil', text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', category: 'tahlil', virtue: 'أفضل ما قلت أنا والنبيون من قبلي' },
  { id: 'baqiyat', text: 'سُبْحَانَ اللَّهِ ، وَالحَمْدُ لِلَّهِ ، وَلَا إِلَهَ إِلَّا اللَّهُ ، وَاللَّهُ أَكْبَرُ', category: 'tasbih', virtue: 'أحب الكلام إلى الله، الباقيات الصالحات' },
];

export const AdhkarView: React.FC<AdhkarViewProps> = ({ 
  onIncrementIstighfar,
  istighfarTotal = 0,
  initialCategory,
  pairingCode = 'RQ-LOCAL',
  athkarSettings = INITIAL_ATHKAR_SETTINGS,
  onUpdateAthkarSettings
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(() => initialCategory || 'morning');
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [permission, setPermission] = useState(() => getNotificationPermission());

  useEffect(() => {
    if (initialCategory) {
      setActiveTab(initialCategory);
    }
  }, [initialCategory]);

  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('raqeeb_adhkar_counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Free Tasbih State
  const [selectedTasbih, setSelectedTasbih] = useState(TASBIH_OPTIONS[0]);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTarget, setTasbihTarget] = useState<number | null>(33);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem('raqeeb_adhkar_counts', JSON.stringify(counts));
    } catch {
      // Ignore
    }
  }, [counts]);

  const handleRead = (id: string, total: number, isIstighfar = false) => {
    const current = counts[id] || 0;
    if (current < total) {
      setCounts(prev => ({ ...prev, [id]: current + 1 }));
      if (soundEnabled) sounds.playSuccessTone();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
      if (isIstighfar && onIncrementIstighfar) {
        onIncrementIstighfar();
      }
    }
  };

  const handleTasbihClick = () => {
    setTasbihCount(prev => prev + 1);
    if (soundEnabled) sounds.playSuccessTone();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
    if (selectedTasbih.id === 'istighfar' && onIncrementIstighfar) {
      onIncrementIstighfar();
    }
  };

  const resetCategoryCounts = (category: string) => {
    const items = adhkarData.filter(a => a.category === category);
    setCounts(prev => {
      const updated = { ...prev };
      items.forEach(item => {
        delete updated[item.id];
      });
      return updated;
    });
  };

  const getCategoryIcon = () => {
    if (activeTab === 'morning') return <Sun className="w-8 h-8 text-amber-500" />;
    if (activeTab === 'evening') return <Moon className="w-8 h-8 text-indigo-500" />;
    if (activeTab === 'post_prayer') return <Compass className="w-8 h-8 text-teal-500" />;
    if (activeTab === 'sleep') return <Sparkles className="w-8 h-8 text-sky-400" />;
    return <Layers className="w-8 h-8 text-emerald-500" />;
  };

  const categoryAdhkar = adhkarData.filter(a => a.category === activeTab);
  const completedCount = categoryAdhkar.filter(a => (counts[a.id] || 0) >= a.count).length;
  const progressPercent = categoryAdhkar.length > 0 
    ? Math.round((completedCount / categoryAdhkar.length) * 100) 
    : 0;

  const currentWisdom = wisdomData[activeTab] || {
    title: 'فضل الذكر والتسبيح',
    text: 'الذكر غذاء الروح وسلاح المسلم في وجه الفتن والتشتت، يثبت القلب ويربطه بمعية الله في كل لحظة.'
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600" />
            حصن المسلم والأذكار اليومية
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            أذكار مأثورة، تعزيز للحضور القلبي، ومسبحة إلكترونية متصلة بإحصائياتك
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Background Reminder Settings Button */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-teal-900 border-teal-200 shadow-2xs cursor-pointer active:scale-95"
            title="ضبط مواعيد تنبيهات أذكار الصباح والمساء في الخلفية"
          >
            <BellRing className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>تنبيهات الأذكار بالخلفية</span>
            <span className="bg-white/80 border border-teal-200 text-teal-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg">
              ☀️ {athkarSettings.morningTime} | 🌙 {athkarSettings.eveningTime}
            </span>
          </button>

          {/* Audio click feedback toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              soundEnabled 
                ? 'bg-teal-50 text-teal-700 border-teal-200' 
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? 'صوت النقر مفعل' : 'صوت النقر صامت'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {soundEnabled ? 'صوت التسبيح' : 'صامت'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl shadow-2xs border border-slate-200">
        <button
          onClick={() => setActiveTab('morning')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'morning' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sun className="w-4 h-4" />
          أذكار الصباح
        </button>
        <button
          onClick={() => setActiveTab('evening')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'evening' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Moon className="w-4 h-4" />
          أذكار المساء
        </button>
        <button
          onClick={() => setActiveTab('post_prayer')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'post_prayer' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          دبر الصلاة
        </button>
        <button
          onClick={() => setActiveTab('sleep')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'sleep' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          أذكار النوم
        </button>
        <button
          onClick={() => setActiveTab('tasbih')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tasbih' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          السبحة الإلكترونية
        </button>
      </div>

      {/* Background Notification Schedule Badge for Morning/Evening */}
      {(activeTab === 'morning' || activeTab === 'evening') && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${activeTab === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800">
                {activeTab === 'morning' ? 'موعد تنبيه أذكار الصباح في الخلفية:' : 'موعد تنبيه أذكار المساء في الخلفية:'}
              </span>
              <span className="font-mono font-bold text-emerald-700 mr-1.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {activeTab === 'morning' ? athkarSettings.morningTime : athkarSettings.eveningTime}
              </span>
              <span className="text-slate-500 mr-2 text-[11px]">
                {((activeTab === 'morning' && athkarSettings.morningEnabled) || (activeTab === 'evening' && athkarSettings.eveningEnabled))
                  ? '(مفعّل تلقائياً حتى عند إغلاق التطبيق)'
                  : '(التنبيه معطل حالياً)'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 transition-colors cursor-pointer self-end sm:self-center"
          >
            <Settings className="w-3.5 h-3.5" />
            تخصيص الموعد
          </button>
        </div>
      )}

      {/* Conditional Rendering: Free Tasbih vs Categorized Adhkar */}
      {activeTab === 'tasbih' ? (
        /* FREE TASBIH VIEW */
        <div className="space-y-6">
          {/* Main Tasbih Card */}
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-2xs text-center space-y-8">
            
            {/* Phrase Selector */}
            <div className="space-y-2 max-w-xl mx-auto">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                اختر الذكر المبارك
              </label>
              <select
                value={selectedTasbih.id}
                onChange={(e) => {
                  const found = TASBIH_OPTIONS.find(o => o.id === e.target.value);
                  if (found) {
                    setSelectedTasbih(found);
                    setTasbihCount(0);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {TASBIH_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.text}
                  </option>
                ))}
              </select>
              <p className="text-xs text-emerald-700 bg-emerald-50 py-1 px-3 rounded-lg inline-block">
                ✨ {selectedTasbih.virtue}
              </p>
            </div>

            {/* Target Selector */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-slate-500 font-bold ml-2">الهدف:</span>
              {[33, 100, 500, null].map((target) => (
                <button
                  key={target === null ? 'open' : target}
                  onClick={() => setTasbihTarget(target)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    tasbihTarget === target
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {target === null ? 'مفتوح' : `${target} مرة`}
                </button>
              ))}
            </div>

            {/* Interactive Giant Bead Button */}
            <div className="flex flex-col items-center justify-center py-4">
              <button
                onClick={handleTasbihClick}
                className="relative w-56 h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-b from-emerald-500 to-teal-700 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all duration-150 flex flex-col items-center justify-center select-none cursor-pointer border-8 border-emerald-100/50 group"
              >
                {/* Visual pulse ring */}
                <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-pulse"></div>

                <span className="text-xs text-emerald-100 font-medium mb-1">
                  {tasbihTarget ? `الهدف: ${tasbihTarget}` : 'ذكر مفتوح'}
                </span>
                
                <span className="text-6xl md:text-7xl font-bold font-mono tracking-tight drop-shadow-xs">
                  {tasbihCount}
                </span>

                <span className="text-xs text-emerald-200 mt-2 flex items-center gap-1 font-bold group-hover:text-white">
                  <Plus className="w-3.5 h-3.5" />
                  اضغط للتسبيح
                </span>
              </button>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => setTasbihCount(0)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                تصفير العداد
              </button>

              {selectedTasbih.id === 'istighfar' && (
                <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  إجمالي استغفارك اليوم: <strong className="font-mono text-teal-700">{istighfarTotal}</strong>
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* CATEGORIZED ADHKAR VIEW */
        <div className="space-y-6">
          
          {/* Wisdom & Context Card */}
          <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shrink-0">
                  {getCategoryIcon()}
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-1.5 flex items-center gap-2">
                    {currentWisdom.title}
                  </h2>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl">
                    {currentWisdom.text}
                  </p>
                </div>
              </div>

              {/* Progress pill */}
              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 shrink-0 text-center min-w-[140px]">
                <div className="text-xs text-slate-300 font-bold mb-1">نسبة الإنجاز</div>
                <div className="text-2xl font-bold font-mono text-teal-400">
                  {completedCount} / {categoryAdhkar.length}
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="bg-teal-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>{categoryAdhkar.length} من الأذكار النبوية المأثورة</span>
              <button
                onClick={() => resetCategoryCounts(activeTab)}
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                إعادة ضبط هذا القسم
              </button>
            </div>
          </div>

          {/* Adhkar Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryAdhkar.map(dhikr => {
              const currentCount = counts[dhikr.id] || 0;
              const isDone = currentCount >= dhikr.count;
              const isIstighfar = dhikr.text.includes('أَسْتَغْفِرُ') || dhikr.text.includes('سيد الاستغفار');
              
              return (
                <div 
                  key={dhikr.id} 
                  className={`bg-white p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    isDone 
                      ? 'border-teal-200 bg-teal-50/20 shadow-2xs' 
                      : 'border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-4 mb-6">
                    <p className="text-slate-900 text-base md:text-lg leading-loose font-serif text-right select-text">
                      {dhikr.text}
                    </p>
                    {dhikr.virtue && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-teal-50 text-teal-800 rounded-xl border border-teal-100">
                        <Heart className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{dhikr.virtue}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    <div className="text-xs font-bold text-slate-500">
                      التكرار المطلوب: <strong className="font-mono text-slate-800">{dhikr.count}</strong>
                    </div>
                    
                    <button
                      onClick={() => handleRead(dhikr.id, dhikr.count, isIstighfar)}
                      disabled={isDone}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer select-none ${
                        isDone 
                          ? 'bg-teal-100 text-teal-800 cursor-default'
                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-teal-700" />
                          مكتمل ({dhikr.count}/{dhikr.count})
                        </>
                      ) : (
                        `قرأت (${currentCount}/${dhikr.count})`
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Background Athkar Notification Settings Modal */}
      <AthkarNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        settings={athkarSettings}
        onSave={(newSettings) => {
          if (onUpdateAthkarSettings) {
            onUpdateAthkarSettings(newSettings);
          }
        }}
        pairingCode={pairingCode}
      />

    </div>
  );
};
