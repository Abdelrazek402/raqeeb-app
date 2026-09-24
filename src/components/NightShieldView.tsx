import React from 'react';
import { Moon, ShieldCheck, Heart } from 'lucide-react';

interface NightShieldViewProps {
  onDismiss?: () => void;
}

export const NightShieldView: React.FC<NightShieldViewProps> = ({ onDismiss }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500" dir="rtl">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[20%] left-[30%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse"></div>
        <div className="absolute top-[40%] left-[70%] w-1.5 h-1.5 bg-blue-200 rounded-full shadow-[0_0_8px_white] animate-pulse delay-75"></div>
        <div className="absolute top-[70%] left-[20%] w-2.5 h-2.5 bg-purple-200 rounded-full shadow-[0_0_12px_white] animate-pulse delay-150"></div>
      </div>
      
      <Moon className="w-20 h-20 text-indigo-400 mb-6 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
      
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 font-['Amiri',serif] mb-4">
        حارسك الليلي (الدرع المُغلّظ) مفعل
      </h1>
      
      <p className="text-slate-300 text-lg max-w-xl leading-relaxed mb-8">
        وقت السهر والعزلة هو أكثر أوقات الضعف البشري. أغلق جهازك الآن، وتذكر أن راحة جسدك وطهارة قلبك أهم من أي تصفح.
      </p>

      <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 max-w-lg w-full mb-8 backdrop-blur-md">
        <h3 className="text-indigo-300 font-bold mb-3 flex items-center justify-center gap-2">
          <Heart className="w-5 h-5" /> دعاء الأرق
        </h3>
        <p className="text-slate-200 font-['Amiri',serif] text-xl leading-relaxed">
          «اللهم غارت النجوم وهدأت العيون وأنت حي قيوم لا تأخذك سنة ولا نوم، يا حي يا قيوم أهدئ ليلي وأنم عيني»
        </p>
      </div>

      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors text-sm underline decoration-slate-700 underline-offset-4"
        >
          أحتاج الجهاز لضرورة قصوى لمدة 5 دقائق
        </button>
      )}
    </div>
  );
};
