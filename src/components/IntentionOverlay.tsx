import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, BookOpen, Search, MessageSquare, Check, X, Clock } from 'lucide-react';
import { sounds } from '../utils/audio';

interface IntentionOverlayProps {
  isOpen: boolean;
  appName?: string;
  onSelectIntent: (intentText: string, category: 'useful' | 'study' | 'quick_search' | 'browsing' | 'custom') => void;
  onClose: () => void;
}

export const IntentionOverlay: React.FC<IntentionOverlayProps> = ({
  isOpen,
  appName = 'المتصفح',
  onSelectIntent,
  onClose,
}) => {
  const [customIntent, setCustomIntent] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(8);
  const onCloseRef = React.useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    sounds.playIntentionChime();
    setSecondsRemaining(8);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    const timeout = setTimeout(() => {
      onCloseRef.current();
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const options = [
    {
      id: 'useful',
      title: 'أنا داخل أعمل حاجة مفيدة',
      subtitle: 'عمل صالح أو منفعة دنيوية نافعة',
      icon: Sparkles,
      color: 'hover:border-teal-400 text-teal-700 bg-teal-50/60 border-teal-200',
      category: 'useful' as const
    },
    {
      id: 'study',
      title: 'دراسة / شغل',
      subtitle: 'طلب علم أو إنجاز مهام عملية',
      icon: BookOpen,
      color: 'hover:border-blue-400 text-blue-700 bg-blue-50/60 border-blue-200',
      category: 'study' as const
    },
    {
      id: 'quick_search',
      title: 'بحث سريع',
      subtitle: 'استعلام محدد وسأغلق فوراً',
      icon: Search,
      color: 'hover:border-amber-400 text-amber-700 bg-amber-50/60 border-amber-200',
      category: 'quick_search' as const
    },
    {
      id: 'browsing',
      title: 'تصفح عادي',
      subtitle: 'ترويح مباح بوعي وانتباه للوقت',
      icon: MessageSquare,
      color: 'hover:border-slate-400 text-slate-700 bg-slate-100 border-slate-200',
      category: 'browsing' as const
    }
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customIntent.trim()) {
      onSelectIntent(customIntent.trim(), 'custom');
    }
  };

  return (
    <div 
      id="intention-overlay-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        id="intention-overlay-card"
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl p-6 md:p-8 text-slate-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative green aura */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header with App badge and Close timer */}
        <div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-600">
              <Shield className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-teal-700 block">
                تنبيه النية المسبقة
              </span>
              <span className="text-xs text-slate-500">
                فتح: <strong className="text-slate-800">{appName}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
              <Clock className="w-3 h-3 text-teal-600" />
              يختفي خلال {secondsRemaining}ث
            </span>
            <button
              id="close-intention-overlay"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="إغلاق التنبيه والمتابعة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Spiritual Inquiry */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold font-['Amiri',serif] text-slate-900 mb-2 leading-relaxed">
            أنت داخل تعمل إيه؟
          </h2>
          <p className="text-teal-900 font-bold text-base md:text-lg leading-relaxed bg-teal-50 py-2.5 px-4 rounded-2xl border border-teal-200 shadow-2xs">
            «خلي بالك، ربنا شايفك ومطلع عليك، فاتقِ الله»
          </p>
          <p className="text-xs text-slate-500 mt-2">
            جدد نيتك واجعل وقتك حجة لك لا عليك
          </p>
        </div>

        {/* Quick Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                id={`intent-btn-${opt.id}`}
                onClick={() => onSelectIntent(opt.title, opt.category)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 text-right group ${opt.color} hover:shadow-xs active:scale-[0.99]`}
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-bold block text-slate-900">
                    {opt.title}
                  </span>
                  <span className="text-xs text-slate-500 line-clamp-1">
                    {opt.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom text intent */}
        <form onSubmit={handleCustomSubmit} className="relative">
          <input
            id="custom-intent-input"
            type="text"
            placeholder="أو اكتب نيتك تحديداً (مثلاً: إنهاء تقرير الحسابات)..."
            value={customIntent}
            onChange={(e) => setCustomIntent(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 pl-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs transition-all"
          />
          <button
            id="submit-custom-intent"
            type="submit"
            disabled={!customIntent.trim()}
            className="absolute left-1.5 top-1.5 bottom-1.5 px-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            تأكيد
          </button>
        </form>
      </div>
    </div>
  );
};
