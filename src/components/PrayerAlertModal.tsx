import React, { useEffect, useState } from 'react';
import { Heart, CheckCircle2, Clock, BellRing, Sparkles, Volume2, VolumeX, Square, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds, MUEZZIN_LIST } from '../utils/audio';

interface PrayerAlertModalProps {
  isOpen: boolean;
  prayerName: string;
  prayerTime: string;
  onConfirmPrayer: () => void;
  onSnooze?: () => void;
}

export const PrayerAlertModal: React.FC<PrayerAlertModalProps> = ({
  isOpen,
  prayerName = 'الصلاة',
  prayerTime = '',
  onConfirmPrayer,
  onSnooze
}) => {
  const [isPlayingAdhan, setIsPlayingAdhan] = useState(false);
  const [currentMuezzinKey, setCurrentMuezzinKey] = useState<string>('azhar');

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('raqeeb_adhan_sound') || 'azhar';
      setCurrentMuezzinKey(savedKey);
      setIsPlayingAdhan(true);
      sounds.playAdhan(savedKey);
    } else {
      sounds.stopAdhan();
      setIsPlayingAdhan(false);
    }

    return () => {
      sounds.stopAdhan();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMuezzin = MUEZZIN_LIST.find(m => m.id === currentMuezzinKey) || MUEZZIN_LIST[0];

  const handleToggleAudio = () => {
    if (isPlayingAdhan) {
      sounds.stopAdhan();
      setIsPlayingAdhan(false);
    } else {
      setIsPlayingAdhan(true);
      sounds.playAdhan(currentMuezzinKey);
    }
  };

  const handleConfirm = () => {
    sounds.stopAdhan();
    setIsPlayingAdhan(false);
    sounds.playSuccessTone();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0d9488', '#14b8a6', '#f59e0b', '#0284c7']
      });
    } catch {
      // safe fallback if confetti fails
    }
    onConfirmPrayer();
  };

  const handleSnoozeAction = () => {
    sounds.stopAdhan();
    setIsPlayingAdhan(false);
    if (onSnooze) onSnooze();
  };

  const getPrayerVirtue = (name: string) => {
    if (name.includes('الفجر')) return '«من صلى الصبح فهو في ذمة الله»';
    if (name.includes('الظهر')) return 'وقت تفتح فيه أبواب السماء';
    if (name.includes('العصر')) return '«من ترك صلاة العصر فقد حبط عمله»';
    if (name.includes('المغرب')) return 'صلاة الأوابين وبداية ليل جديد';
    if (name.includes('العشاء')) return '«من صلى العشاء في جماعة فكأنما قام نصف الليل»';
    return '«أرحنا بها يا بلال»';
  };

  return (
    <div 
      id="prayer-alert-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-300"
      dir="rtl"
    >
      <div 
        id="prayer-alert-card"
        className="relative w-full max-w-lg bg-white border border-teal-300 rounded-3xl shadow-2xl p-6 md:p-8 text-center text-slate-900 overflow-hidden"
      >
        {/* Top Header with Mosque Icon */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold shadow-2xs">
            <BellRing className="w-3.5 h-3.5 animate-bounce text-amber-500" />
            حان الآن موعد أذان {prayerName} {prayerTime ? `(${prayerTime})` : ''}
          </span>
        </div>

        {/* Real Adhan Audio Player Controls */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white rounded-2xl p-3 mb-5 flex items-center justify-between gap-3 shadow-md border border-teal-600/40">
          <div className="flex items-center gap-2.5 overflow-hidden text-right">
            <div className="w-9 h-9 rounded-xl bg-teal-700/80 border border-teal-500/50 flex items-center justify-center text-amber-300 shrink-0">
              <Volume2 className={`w-5 h-5 ${isPlayingAdhan ? 'animate-pulse text-amber-400' : 'text-slate-300'}`} />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] text-teal-200 font-bold block">صوت الأذان المباشر:</span>
              <strong className="text-xs font-bold text-white truncate block">
                {currentMuezzin.nameAr} ({currentMuezzin.locationAr})
              </strong>
            </div>
          </div>

          <button
            onClick={handleToggleAudio}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              isPlayingAdhan 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
            }`}
          >
            {isPlayingAdhan ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>إيقاف الأذان</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>تشغيل الأذان</span>
              </>
            )}
          </button>
        </div>

        {/* Heart icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mb-4 shadow-2xs">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-500/20 animate-pulse" />
        </div>

        {/* The Exact User Prompt Words */}
        <div className="mb-5 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold font-['Amiri',serif] text-slate-900 leading-snug">
            ربنا قصر معاك عشان متكونش حابب تقابله؟
          </h2>

          <p className="text-xl md:text-2xl font-bold font-['Amiri',serif] text-teal-700 flex items-center justify-center gap-2">
            قوم قابل ربنا لقاء المحب ❤️
          </p>

          <div>
            <span className="text-xs md:text-sm text-slate-700 font-bold bg-slate-100 py-1.5 px-3.5 rounded-xl border border-slate-200 inline-block shadow-2xs">
              «الصلاة أولى من اللي في إيدك»
            </span>
          </div>
        </div>

        {/* Spiritual encouragement quote */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-5 text-xs text-slate-600 leading-relaxed shadow-2xs">
          <p className="flex items-center justify-center gap-1.5 text-teal-700 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            {getPrayerVirtue(prayerName)}
          </p>
          <p className="text-slate-500 text-[11px]">
            اللهم اجعلنا ممن يقيم الصلاة. دعاء ما بعد الأذان: "اللهم رب هذه الدعوة التامة، والصلاة القائمة، آت محمداً الوسيلة والفضيلة..."
          </p>
        </div>

        {/* Action Button: صليت والحمد لله ✅ */}
        <div className="space-y-2.5">
          <button
            id="prayer-confirm-button"
            onClick={handleConfirm}
            className="w-full py-3.5 px-6 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-base md:text-lg rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            صليت والحمد لله ✅
          </button>

          {onSnooze && (
            <button
              id="prayer-snooze-button"
              onClick={handleSnoozeAction}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              أنا أتوضأ الآن (تذكير بعد 5 دقائق)
            </button>
          )}
        </div>

        {/* Disclaimer on personal covenant */}
        <p className="text-[10px] text-slate-400 mt-3.5 leading-relaxed">
          * تأكيد "تمت الصلاة" هو تسجيل شخصي لمتابعة همتك ووفائك بعهدك مع الله، وليس ادعاءً من التطبيق بالاطلاع على الغيب.
        </p>
      </div>
    </div>
  );
};
