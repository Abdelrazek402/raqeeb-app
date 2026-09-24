import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Heart, 
  Clock, 
  ChevronUp, 
  ChevronDown, 
  X,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { PrayerInfo } from '../types';
import { getNextPrayer } from '../utils/prayerTimes';
import { sounds } from '../utils/audio';

interface MiniFloatingBarProps {
  prayers: PrayerInfo[];
  istighfarCount: number;
  onIncrementIstighfar: () => void;
  onOpenPanic: () => void;
  onGoToPrayers?: () => void;
  onClose?: () => void;
  onOpenFloatingGuide?: () => void;
}

export const MiniFloatingBar: React.FC<MiniFloatingBarProps> = ({
  prayers,
  istighfarCount,
  onIncrementIstighfar,
  onOpenPanic,
  onGoToPrayers,
  onClose,
  onOpenFloatingGuide
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const nextPrayer = getNextPrayer(prayers);

  const hours = Math.floor(nextPrayer.minutesLeft / 60);
  const mins = nextPrayer.minutesLeft % 60;

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-16 sm:bottom-4 left-4 z-40 animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        <div className="bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-full p-1.5 shadow-2xl flex items-center gap-1.5">
          <button
            onClick={onOpenPanic}
            className="px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
            title="زر الاستغاثة اللحظي لغض البصر"
          >
            <ShieldAlert className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>غض البصر</span>
          </button>

          <button
            onClick={() => {
              sounds.playIstighfarClick();
              onIncrementIstighfar();
            }}
            className="px-2 py-1 rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="استغفار سريع"
          >
            <Heart className="w-3 h-3 text-teal-400 fill-teal-400" />
            <span>({istighfarCount})</span>
          </button>

          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="توسيع الشريط العائم"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside 
      aria-label="الشريط العائم السريع"
      className="fixed bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-[96vw] sm:max-w-xl w-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" 
      dir="rtl"
    >
      <div className="bg-slate-900/95 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/90 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-2xl flex items-center justify-center gap-1.5 sm:gap-3 text-xs">
        
        {/* Panic Button */}
        <button
          onClick={onOpenPanic}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold transition-all shadow-xs cursor-pointer shrink-0"
          title="زر الاستغاثة اللحظي لغض البصر"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-bold">غض البصر</span>
        </button>

        {/* Divider */}
        <div className="h-3.5 sm:h-4 w-[1px] bg-slate-700 shrink-0" />

        {/* Next Prayer Pill */}
        <button
          onClick={() => onGoToPrayers?.()}
          className="flex items-center gap-1 sm:gap-1.5 hover:text-teal-300 transition-colors text-right cursor-pointer shrink-0"
          title="انقر لعرض تفاصيل الصلاة والقبلة"
        >
          <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-teal-400 shrink-0" />
          <div className="flex flex-col text-[9px] sm:text-[10px] leading-tight">
            <span className="text-slate-400 truncate max-w-[80px] sm:max-w-none">{nextPrayer.next.nameAr}:</span>
            <span className="font-bold text-teal-300 whitespace-nowrap font-mono">
              {hours > 0 ? `${hours}س ${mins}د` : `${mins}د`}
            </span>
          </div>
        </button>

        {/* Divider */}
        <div className="h-3.5 sm:h-4 w-[1px] bg-slate-700 shrink-0" />

        {/* Quick Istighfar Tap */}
        <button
          onClick={() => {
            sounds.playIstighfarClick();
            onIncrementIstighfar();
          }}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
          title="انقر لزيادة رصيد الاستغفار"
        >
          <Heart className="w-3 h-3 text-teal-400 fill-teal-400" />
          <span className="text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
            أستغفر الله ({istighfarCount})
          </span>
        </button>

        {/* Native OS Floating Widget Info Button */}
        {onOpenFloatingGuide && (
          <>
            <div className="h-3.5 sm:h-4 w-[1px] bg-slate-700 shrink-0 hidden md:block" />
            <button
              onClick={onOpenFloatingGuide}
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] border border-slate-600/70 transition-colors cursor-pointer shrink-0"
              title="تفعيل الودجت العائم على سطح مكتب الويندوز وشاشة الموبايل خارج البرنامج"
            >
              <Layers className="w-3 h-3 text-teal-400" />
              <span>ودجت الشاشة</span>
            </button>
          </>
        )}

        {/* Minimize Button */}
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          title="تصغير الشريط"
        >
          <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* Close / Hide Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
            title="إخفاء الشريط العائم (يمكنك إعادة تفعيله من الإعدادات أو القائمة)"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        )}

      </div>
    </aside>
  );
};
