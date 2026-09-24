import React from 'react';
import { Activity, Brain, CheckCircle2, Lock, Flame } from 'lucide-react';

interface NeuroplasticityCardProps {
  streakDays: number;
}

export const NeuroplasticityCard: React.FC<NeuroplasticityCardProps> = ({ streakDays }) => {
  const phases = [
    { day: 3, title: 'كسر حدة الإثارة', desc: 'تخفيف التوتر وانسحاب الدوبامين السلبي.' },
    { day: 7, title: 'التوازن العصبي', desc: 'عودة التوازن وتحسن جودة النوم.' },
    { day: 21, title: 'مسارات جديدة', desc: 'بناء مسارات عصبية جديدة وارتفاع التركيز.' },
    { day: 40, title: 'استقرار العادة', desc: 'استعادة نقاء البصيرة والتحكم الذاتي.' }
  ];

  const currentPhaseIndex = phases.findIndex(p => streakDays < p.day) !== -1 
    ? phases.findIndex(p => streakDays < p.day) 
    : phases.length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative overflow-hidden" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">مسار التعافي العصبي</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">التغيير البيولوجي في الدماغ مع كل يوم صمود</p>
        </div>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-y-0 before:right-3.5 before:w-0.5 before:bg-slate-100">
        {phases.map((phase, idx) => {
          const isPassed = streakDays >= phase.day;
          const isCurrent = idx === currentPhaseIndex;
          const isLocked = !isPassed && !isCurrent;
          
          return (
            <div key={phase.day} className={`relative flex items-start gap-4 transition-all ${isLocked ? 'opacity-50' : 'opacity-100'}`}>
              <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center relative z-10 border-2 ${
                isPassed ? 'bg-purple-600 border-purple-600 text-white' : 
                isCurrent ? 'bg-white border-purple-600 text-purple-600' : 
                'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                 isLocked ? <Lock className="w-3 h-3" /> : 
                 <Flame className="w-3.5 h-3.5 animate-pulse" />}
              </div>
              <div className={`flex-1 pt-1 ${isCurrent ? 'scale-105 transform origin-right transition-transform' : ''}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className={`text-xs font-bold ${isPassed || isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                    {phase.title}
                  </h4>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isPassed ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    يوم {phase.day}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{phase.desc}</p>
                {isCurrent && (
                  <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-1000"
                      style={{ width: `${(streakDays / phase.day) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
