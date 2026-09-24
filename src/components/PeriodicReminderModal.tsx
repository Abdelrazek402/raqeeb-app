import React, { useEffect, useState } from 'react';
import { Clock, HeartHandshake, Sparkles, X, Check, Eye } from 'lucide-react';
import { sounds } from '../utils/audio';

interface PeriodicReminderModalProps {
  isOpen: boolean;
  minutesSpent: number;
  appName?: string;
  onDismiss: () => void;
  onLogIstighfar: (count: number) => void;
}

export const PeriodicReminderModal: React.FC<PeriodicReminderModalProps> = ({
  isOpen,
  minutesSpent = 10,
  appName = 'المتصفح / السوشيال ميديا',
  onDismiss,
  onLogIstighfar
}) => {
  const [localIstighfarCount, setLocalIstighfarCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      sounds.playTenMinReminder();
      setLocalIstighfarCount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Smart escalation logic based on time
  const isFirstTier = minutesSpent <= 15;
  const isSecondTier = minutesSpent > 15 && minutesSpent <= 25;
  const isThirdTier = minutesSpent > 25;

  let headerColor = 'text-teal-800 bg-teal-50 border-teal-200';
  let tierLabel = 'تنبيه الـ 10 دقائق';

  if (isSecondTier) {
    headerColor = 'text-amber-800 bg-amber-50 border-amber-200';
    tierLabel = 'تنبيه الـ 20 دقيقة (محاسبة النفس)';
  } else if (isThirdTier) {
    headerColor = 'text-rose-800 bg-rose-50 border-rose-200';
    tierLabel = 'تنبيه متقدم (طالت الجلسة)';
  }

  const handleAddIstighfar = () => {
    sounds.playSuccessTone();
    const newCount = localIstighfarCount + 1;
    setLocalIstighfarCount(newCount);
    onLogIstighfar(1);
  };

  return (
    <div 
      id="periodic-reminder-backdrop"
      className="fixed bottom-4 left-4 right-4 md:right-auto md:left-6 md:bottom-6 z-50 md:max-w-md animate-in slide-in-from-bottom-5 duration-300"
    >
      <div 
        id="periodic-reminder-card"
        className="bg-white border border-slate-200 rounded-3xl shadow-xl p-5 md:p-6 relative overflow-hidden text-slate-900"
      >
        {/* Ambient Top Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500" />

        {/* Top bar with timer indicator */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${headerColor}`}>
              <Clock className="w-3.5 h-3.5" />
              {tierLabel}
            </span>
            <span className="text-xs text-slate-500">
              في: <strong className="text-slate-800">{appName}</strong>
            </span>
          </div>

          <button
            id="dismiss-reminder-btn"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="إخفاء التنبيه ومتابعة العمل"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main core message strictly from user prompt */}
        <div className="mb-4 text-right">
          <h3 className="text-xl font-bold font-['Amiri',serif] text-slate-900 mb-2 leading-relaxed">
            {isThirdTier ? 'يا غالي، تجاوزت نصف ساعة متواصلة!' : 'طوّلت على فكرة...'}
          </h3>
          <div className="space-y-1.5 text-slate-600 text-sm leading-relaxed">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              خلصت اللي وراك ومسؤولياتك؟
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              طب هل ذكرت ربك وأنت جالس تتصفح؟
            </p>
            <p className="text-teal-900 font-bold bg-teal-50 p-2.5 rounded-xl border border-teal-200 mt-2 shadow-2xs">
              قل بلسانك وقلبك: «أستغفر الله وأتوب إليه»
            </p>
          </div>
        </div>

        {/* Interactive Istighfar counter */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-4 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="text-slate-800 block font-bold">سجل استغفارك الآن</span>
              <span className="text-slate-500">تم تسجيل: {localIstighfarCount} مرات</span>
            </div>
          </div>

          <button
            id="istighfar-click-btn"
            onClick={handleAddIstighfar}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            أستغفر الله +1
          </button>
        </div>

        {/* Quick actions without disturbing device */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <Eye className="w-3 h-3 text-teal-600" />
            التنبيه لا يعطل تطبيقاتك الأخرى
          </span>

          <button
            id="continue-work-btn"
            onClick={onDismiss}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
          >
            <Check className="w-3.5 h-3.5 text-teal-600" />
            إخفاء ومتابعة
          </button>
        </div>
      </div>
    </div>
  );
};
