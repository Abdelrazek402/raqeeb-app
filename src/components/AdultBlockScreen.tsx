import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, ArrowRight, Lock, HeartHandshake, AlertTriangle, Play, Pause, Loader2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface AdultBlockScreenProps {
  isOpen: boolean;
  blockedUrlOrQuery: string;
  reason?: string;
  onGoBack: () => void;
}

export const AdultBlockScreen: React.FC<AdultBlockScreenProps> = ({
  isOpen,
  blockedUrlOrQuery,
  reason = 'نطاق أو محتوى إباحي محظور',
  onGoBack
}) => {
  const [isPlayingVerse, setIsPlayingVerse] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlayingVerse(false);
    setAudioLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      sounds.playBlockWarning();
    } else {
      stopAudio();
    }
    return () => {
      stopAudio();
    };
  }, [isOpen]);

  const handleToggleVerse = () => {
    // If currently playing or loading or has active audio instance, stop it immediately
    if (isPlayingVerse || audioLoading || audioRef.current) {
      stopAudio();
      return;
    }

    // Start playing Ayat Al-Kursi (Surah 2 Ayah 255 = Quran Ayah 262)
    setAudioLoading(true);
    const primaryUrl = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3';
    const fallbackUrl = 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3';

    const audio = new Audio(primaryUrl);
    audio.preload = 'auto';

    audio.onplay = () => {
      setIsPlayingVerse(true);
      setAudioLoading(false);
    };

    audio.onended = () => {
      stopAudio();
    };

    audio.onerror = () => {
      console.warn('Primary audio failed, trying fallback URL...');
      if (audio.src !== fallbackUrl) {
        audio.src = fallbackUrl;
        audio.load();
        audio.play().then(() => {
          setIsPlayingVerse(true);
          setAudioLoading(false);
        }).catch((err) => {
          console.warn('Fallback audio failed:', err);
          stopAudio();
        });
      } else {
        stopAudio();
      }
    };

    audioRef.current = audio;

    audio.play().then(() => {
      setIsPlayingVerse(true);
      setAudioLoading(false);
    }).catch((err) => {
      console.warn('Audio play failed on primary URL, trying fallback:', err);
      audio.src = fallbackUrl;
      audio.load();
      audio.play().then(() => {
        setIsPlayingVerse(true);
        setAudioLoading(false);
      }).catch((fallbackErr) => {
        console.warn('All audio attempts failed:', fallbackErr);
        stopAudio();
      });
    });
  };

  const handleClose = () => {
    stopAudio();
    onGoBack();
  };

  if (!isOpen) return null;

  return (
    <div 
      id="adult-block-screen-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in zoom-in-95 duration-200"
    >
      <div 
        id="adult-block-screen-card"
        className="relative w-full max-w-xl bg-white border border-rose-300 rounded-3xl shadow-xl p-6 md:p-10 text-center text-slate-900 overflow-hidden"
      >
        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-5 shadow-2xs">
          <ShieldAlert className="w-9 h-9 text-rose-600 animate-pulse" />
        </div>

        {/* The Exact User Prompt Heading */}
        <h2 className="text-2xl md:text-3xl font-black font-['Amiri',serif] text-rose-600 mb-2 tracking-wide">
          مش خايف من ربك؟
        </h2>

        {/* The Exact Sub-message */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 text-slate-700 text-sm md:text-base leading-relaxed space-y-2 shadow-2xs">
          <p className="font-bold text-slate-900 text-lg">
            أنت عارف إنك داخل على حاجة بتضرك...
          </p>
          <p className="text-rose-700 font-bold">
            «اقفل الباب ده قبل ما تندم»
          </p>
          <div className="text-xs text-slate-500 pt-3 border-t border-slate-200 flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            <span>الموقع المستهدف: <code className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-mono text-xs">{blockedUrlOrQuery || 'موقع محظور'}</code></span>
          </div>
          <p className="text-[11px] text-slate-500">
            السبب: {reason}
          </p>
        </div>

        {/* Spiritual encouragement */}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3.5 mb-6 text-xs text-teal-800 flex items-center justify-center gap-2 shadow-2xs">
          <HeartHandshake className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>«مَن تَرَكَ شيئاً للهِ عَوَّضَهُ اللهُ خَيْراً مِنْه» — النية الصالحة الآن ترفع قدرك عند الله.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleToggleVerse}
            disabled={audioLoading}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-teal-800 font-bold text-sm rounded-xl border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {audioLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>جارٍ تجهيز التلاوة...</span>
              </>
            ) : isPlayingVerse ? (
              <>
                <Pause className="w-4 h-4 text-teal-700" />
                <span>إيقاف تلاوة آية الكرسي</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-teal-700" />
                <span>بدل كده، تسمع آية دلوقتي؟</span>
              </>
            )}
          </button>
          
          <button
            id="block-screen-return-btn"
            onClick={handleClose}
            className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-base rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            رجوع فوري وإغلاق الصفحة
          </button>
        </div>

        {/* Technical Notice on network enforcement */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>تم الحجب على مستوى محرك الشبكة / الإضافة لمنع أي Redirect أو تحايل.</span>
        </div>
      </div>
    </div>
  );
};
