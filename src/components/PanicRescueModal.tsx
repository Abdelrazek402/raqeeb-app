import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Heart, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Sparkles, 
  Wind, 
  Droplets, 
  Footprints, 
  X,
  FlameKindling,
  Trophy,
  Dumbbell,
  Phone,
  Headphones,
  MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';

interface PanicRescueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordVictory?: (notes?: string) => void;
  onVictoryClaimed?: (notes?: string) => void;
}

export const PanicRescueModal: React.FC<PanicRescueModalProps> = ({
  isOpen,
  onClose,
  onRecordVictory,
  onVictoryClaimed
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [breathPhase, setBreathPhase] = useState<'شهيق (4 ث)' | 'حبس (4 ث)' | 'زفير بطيء (6 ث)'>('شهيق (4 ث)');
  const [breathCountdown, setBreathCountdown] = useState(4);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [activeAlternativeMessage, setActiveAlternativeMessage] = useState<string | null>(null);

  const handleAlternativeClick = (type: string, message: string) => {
    sounds.playSuccessTone();
    setActiveAlternativeMessage(message);
    if (type === 'social') {
      window.open('tel:', '_self');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }
      setIsPlayingAudio(false);
      return;
    }

    // Play alert sound gently and start Quran recitation
    sounds.playSpiritualReflectTone();

    // Recitation audio for Ayat Al-Kursi (Surah 2 Ayah 255 = Quran Ayah 262)
    const primaryUrl = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3';
    const fallbackUrl = 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3';
    const audio = new Audio(primaryUrl);
    audio.loop = true;
    audio.onerror = () => {
      if (audio.src !== fallbackUrl) {
        audio.src = fallbackUrl;
        audio.load();
        audio.play().catch(() => setIsPlayingAudio(false));
      }
    };
    audio.play().then(() => {
      setIsPlayingAudio(true);
    }).catch(() => {
      setIsPlayingAudio(false);
    });
    setAudioRef(audio);

    // Breathing loop timer
    let phaseIdx = 0;
    const phases: Array<{ name: 'شهيق (4 ث)' | 'حبس (4 ث)' | 'زفير بطيء (6 ث)'; secs: number }> = [
      { name: 'شهيق (4 ث)', secs: 4 },
      { name: 'حبس (4 ث)', secs: 4 },
      { name: 'زفير بطيء (6 ث)', secs: 6 },
    ];

    let timerSec = phases[0].secs;
    setBreathPhase(phases[0].name);
    setBreathCountdown(timerSec);

    const interval = setInterval(() => {
      timerSec -= 1;
      if (timerSec <= 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        timerSec = phases[phaseIdx].secs;
        setBreathPhase(phases[phaseIdx].name);
      }
      setBreathCountdown(timerSec);
    }, 1000);

    return () => {
      clearInterval(interval);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleAudio = () => {
    if (!audioRef) return;
    if (isPlayingAudio) {
      audioRef.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const handleStepToggle = (id: string) => {
    setCheckedSteps(prev => ({ ...prev, [id]: !prev[id] }));
    sounds.playSuccessTone();
  };

  const handleVictoryClaim = () => {
    sounds.playSuccessTone();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }

    const victoryNote = 'قاومت الشهوة اللحظية بالاستغاثة والوضوء وغض البصر بفضل الله';
    if (typeof onRecordVictory === 'function') {
      onRecordVictory(victoryNote);
    } else if (typeof onVictoryClaimed === 'function') {
      onVictoryClaimed(victoryNote);
    }
    if (audioRef) {
      audioRef.pause();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 rounded-2xl bg-white/15 border border-white/20">
              <ShieldAlert className="w-6 h-6 text-amber-300 animate-pulse" />
            </span>
            <div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">
                زر الاستغاثة اللحظي • غض البصر
              </span>
              <h2 className="text-xl font-black font-['Amiri',serif] tracking-wide mt-1">
                اثبُت يا أخي.. إن الله يراك، وما ترك عبدٌ شيئاً لله إلا عوّضه خيراً منه!
              </h2>
            </div>
          </div>

          <p className="text-xs text-teal-100/90 leading-relaxed font-['Amiri',serif] text-base mt-2 bg-black/15 p-3 rounded-xl border border-white/10">
            «قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ وَيَحْفَظُوا فُرُوجَهُمْ ذَٰلِكَ أَزْكَىٰ لَهُمْ إِنَّ اللَّهَ خَبِيرٌ بِمَا يَصْنَعُونَ» [النور: 30]
          </p>

          <div className="flex items-center justify-between mt-3 text-xs">
            <button
              onClick={toggleAudio}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-medium cursor-pointer transition-all"
            >
              {isPlayingAudio ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4 text-slate-300" />}
              <span>{isPlayingAudio ? 'آية الكرسي تُتلى الآن (إيقاف)' : 'تشغيل تلاوة خاشعة سكينة'}</span>
            </button>
            <span className="text-[11px] text-teal-200">الدقائق الـ 3 القادمة هي لحظة النصر</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          
          {/* 1. Breathing Exercise Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold mb-1">
              <Wind className="w-4 h-4 text-teal-600 animate-spin" />
              <span>تمرين تهدئة النبض وتفريغ فوران الشهوة</span>
            </div>
            <div className="text-2xl font-black font-['Amiri',serif] text-slate-900 my-1">
              {breathPhase}
            </div>
            <div className="w-12 h-12 rounded-full bg-teal-100 border-2 border-teal-500 flex items-center justify-center text-teal-800 font-extrabold text-lg shadow-inner">
              {breathCountdown}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              خذ نفساً عميقاً من أنفك، واحبسه، ثم أخرجه ببطء شديد لاستعادة سيطرة عقلك الواعي.
            </p>
          </div>

          {/* 2. Immediate Physical Action Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Footprints className="w-4 h-4 text-teal-600" />
              <span>خطة الإفاقة الفورية (خطوات عملية الآن):</span>
            </h4>

            {[
              { id: 'stand', icon: Footprints, text: 'قِف فوراً وغيّر وضعية جسدك، ولا تبقَ منفرداً في الغرفة' },
              { id: 'wudu', icon: Droplets, text: 'توجّه فوراً وتوضأ بماء بارد يُطفئ نار وسوسة الشيطان' },
              { id: 'taawudh', icon: FlameKindling, text: 'استعذ بالله بلسانك وقلبك: «أعوذُ باللهِ من الشيطانِ الرجيم»' },
              { id: 'dua', icon: Heart, text: 'ادعُ: «اللهم إني أسألك الهدى والتقى والعفاف والغنى»' }
            ].map(step => {
              const isDone = !!checkedSteps[step.id];
              const StepIcon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepToggle(step.id)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-right transition-all cursor-pointer ${
                    isDone 
                      ? 'bg-teal-50/80 border-teal-300 text-teal-900 font-semibold shadow-xs' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`p-1.5 rounded-lg ${isDone ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <StepIcon className="w-4 h-4" />
                    </span>
                    <span className="text-xs">{step.text}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${isDone ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'}`}>
                    {isDone && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 3. Dopamine Substitution Menu */}
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900">بدائل فورية الآن (توجيه الدوبامين):</h4>
            </div>

            {activeAlternativeMessage && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-bold text-xs animate-in fade-in flex items-center justify-between">
                <span>💪 {activeAlternativeMessage}</span>
                <button 
                  onClick={() => setActiveAlternativeMessage(null)}
                  className="text-teal-600 hover:text-teal-900 text-xs underline cursor-pointer"
                >
                  إخفاء
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button 
                onClick={() => handleAlternativeClick('exercise', 'بديل حركي مفعل: قم الآن بـ 15 تمرين ضغط أو القفز في المكان لمدة دقيقة!')}
                className="flex flex-col items-start p-3 bg-white border border-slate-200 rounded-xl hover:bg-teal-50 hover:border-teal-200 transition-all text-right cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-2 text-teal-700 mb-1">
                  <Dumbbell className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs">بديل حركي</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-relaxed">قم الآن بعمل 15 تمرين ضغط أو امشِ 5 دقائق لتفريغ الطاقة.</span>
              </button>

              <button 
                onClick={() => handleAlternativeClick('social', 'بديل اجتماعي مفعل: اتصل بأمك أو أحد أصدقائك الصالحين الآن!')}
                className="flex flex-col items-start p-3 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-right cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs">بديل اجتماعي</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-relaxed">اتصل بوالدتك أو أرسل رسالة صلة رحم لشخص تحبه الآن.</span>
              </button>

              <a 
                href="https://www.youtube.com/results?search_query=مقطع+مؤثر+عبدالرزاق+البدر" 
                target="_blank" rel="noopener noreferrer"
                onClick={() => handleAlternativeClick('audio', 'بديل سمعي: تم فتح تلاوات ومقاطع السكينة الإيمانية.')}
                className="flex flex-col items-start p-3 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-right cursor-pointer group"
              >
                <div className="flex items-center gap-2 text-indigo-700 mb-1">
                  <Headphones className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs">بديل سمعي</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-relaxed">استمع لمقطع دعوي مؤثر (الشيخ عبد الرزاق البدر).</span>
              </a>

              <button 
                onClick={() => handleAlternativeClick('spatial', 'بديل مكاني مفعل: اخرج فوراً للشرفة أو المسجد أو غيّر الغرفة التي أنت بها!')}
                className="flex flex-col items-start p-3 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all text-right cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-2 text-emerald-700 mb-1">
                  <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs">بديل مكاني</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-relaxed">اخرج فوراً إلى المسجد أو شرفة المنزل لتغيير البيئة.</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 text-center sm:text-right">
            تذكّر: لحظة انتصارك على نفسك تسوى الدنيا وما فيها عند الله!
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleVictoryClaim}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>الحمد لله، صمدت وقهرت الشهوة 🏆</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
