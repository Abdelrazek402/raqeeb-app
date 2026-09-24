import React, { useState } from 'react';
import { 
  Heart, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Droplets, 
  HandHeart, 
  X, 
  RefreshCw,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';

interface TawbahPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompletePlan: () => void;
}

interface StepItem {
  id: string;
  title: string;
  sub: string;
  hadith?: string;
  icon: React.ElementType;
}

const TAWBAH_STEPS: StepItem[] = [
  {
    id: 'regret',
    title: '1. الإقلاع الفوري واستشعار الندم',
    sub: 'الندم توبة، والاعتراف بالذنب بينك وبين ربك هو أول طريق الطهارة.',
    hadith: 'قال ﷺ: «الندمُ توبةٌ» [صحيح ابن ماجه]',
    icon: Heart
  },
  {
    id: 'wudu_salah',
    title: '2. إسباغ الوضوء وصلاة ركعتي التوبة',
    sub: 'قم الآن وتوضأ بهدوء، ثم صلِّ ركعتين خاشعتين تدعو فيهما وتبث حزنك لمولاك.',
    hadith: 'قال ﷺ: «ما مِن رجل يُذنِب ذَنباً، ثم يقوم فيتطهر، ثم يصلي، ثم يستغفر الله إلا غفر الله له» [أبو داود]',
    icon: Droplets
  },
  {
    id: 'istighfar_100',
    title: '3. الاستغفار 100 مرة بيقين',
    sub: 'ردد: (أستغفرُ اللهَ وأتوبُ إليه) مائة مرة، مستحضراً سعة رحمة الله التي سبقت غضبه.',
    hadith: '«إِنَّ اللَّهَ يَبْسُطُ يَدَهُ بِاللَّيْلِ لِيَتُوبَ مُسِيءُ النَّهَارِ»',
    icon: RefreshCw
  },
  {
    id: 'sadaqah',
    title: '4. صدقة خفية تطفئ غضب الرب',
    sub: 'تصدق بمبلغ يسير لأول محتاج، أو انوِ إطعام مسكين فالصدقة برهان وستر.',
    hadith: '«إِنَّ الصَّدَقَةَ لَتُطْفِئُ غَضَبَ الرَّبِّ وَتَدْفَعُ مِيتَةَ السُّوءِ»',
    icon: HandHeart
  },
  {
    id: 'sayyid_istighfar',
    title: '5. ترديد سيد الاستغفار',
    sub: '«اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ»',
    icon: BookOpen
  }
];

export const TawbahPlanModal: React.FC<TawbahPlanModalProps> = ({
  isOpen,
  onClose,
  onCompletePlan
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleStep = (id: string) => {
    sounds.playSuccessTone();
    setCompletedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const isAllComplete = completedCount === TAWBAH_STEPS.length;

  const handleFinish = () => {
    sounds.playSuccessTone();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch {
      // safe fallback
    }
    onCompletePlan();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-white/15 border border-white/20">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </span>
            <div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                خطة التوبة النصوح وتدارك الزلة
              </span>
              <h2 className="text-xl font-black font-['Amiri',serif] tracking-wide mt-1">
                «قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ»
              </h2>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-teal-100">
            <span>إنجاز خطوات التوبة والعودة:</span>
            <span className="font-bold text-amber-300">{completedCount} من {TAWBAH_STEPS.length} خطوات</span>
          </div>
          <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-amber-300 h-full transition-all duration-300"
              style={{ width: `${(completedCount / TAWBAH_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Body Steps */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm">
          {TAWBAH_STEPS.map((step) => {
            const isDone = !!completedSteps[step.id];
            const StepIcon = step.icon;

            return (
              <div 
                key={step.id}
                onClick={() => toggleStep(step.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                  isDone 
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`p-2 rounded-xl mt-0.5 ${isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <StepIcon className="w-4 h-4" />
                    </span>
                    <div className="space-y-1">
                      <h4 className={`text-sm font-bold ${isDone ? 'text-emerald-900 line-through' : 'text-slate-900'}`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{step.sub}</p>
                      {step.hadith && (
                        <p className="text-[11px] text-teal-800 font-['Amiri',serif] font-semibold mt-1 bg-white/70 px-2 py-1 rounded-md border border-slate-200/50">
                          {step.hadith}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                    isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isDone && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 text-center sm:text-right">
            لا تيأس ولا تحزن، فربك يفرح بتوبة عبده حين يتوب إليه أشد من فرحة الضال براحلته.
          </span>
          <button
            onClick={handleFinish}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>{isAllComplete ? 'أتممت الخطة والحمد لله 🌿' : 'حفظ الخطة واستمرار التثبيت'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
