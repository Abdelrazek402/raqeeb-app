import React, { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { sounds, MUEZZIN_LIST } from '../utils/audio';

export const GlobalAudioBar: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSoundName, setCurrentSoundName] = useState('');

  useEffect(() => {
    const handleStateChange = (playing: boolean) => {
      setIsPlaying(playing);
      if (playing) {
        const savedKey = localStorage.getItem('raqeeb_adhan_sound') || 'azhar';
        const muezzin = MUEZZIN_LIST.find(m => m.id === savedKey) || MUEZZIN_LIST[0];
        setCurrentSoundName(muezzin.nameAr);
      }
    };

    sounds.addStateListener(handleStateChange);
    return () => {
      sounds.removeStateListener(handleStateChange);
    };
  }, []);

  if (!isPlaying) return null;

  return (
    <div
      id="global-audio-floating-bar"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:right-6 z-50 max-w-md bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-rose-500/60 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
      dir="rtl"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-9 h-9 rounded-xl bg-rose-950 border border-rose-600/50 flex items-center justify-center text-rose-400 shrink-0">
          <Volume2 className="w-5 h-5 animate-pulse text-rose-400" />
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[10px] text-rose-300 font-extrabold block uppercase tracking-wider">
              صوت الأذان / التنبيه يعمل الآن
            </span>
          </div>
          <strong className="text-xs font-bold text-white truncate block">
            {currentSoundName || 'أذان الصلوات المباركة'}
          </strong>
        </div>
      </div>

      <button
        id="global-stop-audio-button"
        onClick={() => {
          sounds.stopAdhan();
          setIsPlaying(false);
        }}
        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all shrink-0 border border-rose-400/40"
        title="انقر لإيقاف جميع الأصوات فوراً"
      >
        <Square className="w-3.5 h-3.5 fill-white" />
        <span>إيقاف الصوت ⏹️</span>
      </button>
    </div>
  );
};
