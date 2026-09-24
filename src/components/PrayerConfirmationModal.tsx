import React, { useState } from 'react';
import { Heart, CheckCircle2, Building2, UserCheck, AlertTriangle, Sparkles, Clock, Compass, BookOpen } from 'lucide-react';
import { PrayerInfo } from '../types';
import { formatTimeArabic } from '../utils/prayerTimes';
import { checkIsDelayedAfterNextPrayer, generatePrayerFeedbackMessage } from '../services/prayerLogService';

interface PrayerConfirmationModalProps {
  isOpen: boolean;
  prayer: PrayerInfo | null;
  prayers: PrayerInfo[];
  onClose: () => void;
  onConfirm: (details: {
    prayerId: string;
    isCongregationOrMosque: boolean;
    justification?: 'travel_combined' | 'excuse_valid' | 'none_world_distraction';
    feedbackMessage: string;
    delayMinutes: number;
    isDelayedAfterNext: boolean;
  }) => void;
}

export const PrayerConfirmationModal: React.FC<PrayerConfirmationModalProps> = ({
  isOpen,
  prayer,
  prayers,
  onClose,
  onConfirm
}) => {
  const [isMosque, setIsMosque] = useState<boolean>(true);
  const [justification, setJustification] = useState<'travel_combined' | 'excuse_valid' | 'none_world_distraction'>('none_world_distraction');

  if (!isOpen || !prayer) return null;

  const now = new Date();
  const [h, m] = prayer.time.split(':').map(Number);
  const scheduledDate = new Date();
  scheduledDate.setHours(h, m, 0, 0);

  const delayMs = now.getTime() - scheduledDate.getTime();
  const delayMinutes = Math.max(0, Math.floor(delayMs / 60000));

  // Check if delayed after next obligatory prayer
  const { isDelayed: isDelayedAfterNext, nextPrayerName, nextPrayerTimeFormatted } = checkIsDelayedAfterNextPrayer(prayer.id, prayers, now);

  const handleComplete = () => {
    const feedback = generatePrayerFeedbackMessage(
      delayMinutes,
      isDelayedAfterNext,
      isDelayedAfterNext ? justification : undefined,
      isMosque
    );

    onConfirm({
      prayerId: prayer.id,
      isCongregationOrMosque: isMosque,
      justification: isDelayedAfterNext ? justification : undefined,
      feedbackMessage: feedback,
      delayMinutes,
      isDelayedAfterNext
    });
  };

  const getMosqueVirtue = () => {
    const virtues = [
      '«صلاة الجماعة تفضل صلاة الفذ بسبع وعشرين درجة» [متفق عليه]',
      '«من تطهر في بيته ثم مشى إلى بيت من بيوت الله.. كانت خطواته إحداها تحط خطيئة والأخرى ترفع درجة» [مسلم]',
      '«بشر المشائين في الظلم إلى المساجد بالنور التام يوم القيامة» [أبو داود والترمذي]',
      '«أعظم الناس أجراً في الصلاة أبعدهم إليها ممشىً» [البخاري ومسلم]',
      '«من صلى الفجر في جماعة ثم قعد يذكر الله حتى تطلع الشمس كان له كأجر حجة وعمرة تامة» [الترمذي]'
    ];
    return virtues[Math.floor(Math.random() * virtues.length)];
  };

  return (
    <div 
      id="prayer-confirmation-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="prayer-confirmation-card"
        className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-5 text-right relative overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Amiri',serif] text-slate-900">
                تسجيل أداء صلاة {prayer.nameAr}
              </h3>
              <p className="text-xs text-slate-500">
                الموعد المحدد: <span className="font-mono font-bold text-teal-700">{formatTimeArabic(prayer.time)}</span>
              </p>
            </div>
          </div>

          {/* Delay Badge */}
          {delayMinutes > 0 ? (
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              isDelayedAfterNext
                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                : delayMinutes > 30
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-slate-100 border border-slate-200 text-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {isDelayedAfterNext ? `تأخير بعد ${nextPrayerName}` : `فرق الوقت: +${delayMinutes} دقيقة`}
            </span>
          ) : (
            <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              في أول الوقت ✨
            </span>
          )}
        </div>

        {/* Warning & Justification if delayed after next prayer */}
        {isDelayedAfterNext && (
          <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-rose-950">
                  تأخير الصلاة عن وقتها الأصلي ودخول وقت صلاة {nextPrayerName} ({nextPrayerTimeFormatted})
                </h4>
                <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                  تأخرت صلاة {prayer.nameAr} حتى دخل وقت {nextPrayerName}.. الصلاة كانت على المؤمنين كتاباً موقوتاً. يرجى اختيار السبب والمبرر لتسجيل العهد:
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                justification === 'travel_combined' ? 'bg-white border-teal-500 text-teal-900 font-bold shadow-2xs' : 'bg-rose-100/50 border-rose-200 text-slate-700'
              }`}>
                <input 
                  type="radio" 
                  name="justification" 
                  checked={justification === 'travel_combined'} 
                  onChange={() => setJustification('travel_combined')}
                  className="accent-teal-600"
                />
                <span>✈️ كنت على سفر وحصل جمع تأخير شرعي</span>
              </label>

              <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                justification === 'excuse_valid' ? 'bg-white border-teal-500 text-teal-900 font-bold shadow-2xs' : 'bg-rose-100/50 border-rose-200 text-slate-700'
              }`}>
                <input 
                  type="radio" 
                  name="justification" 
                  checked={justification === 'excuse_valid'} 
                  onChange={() => setJustification('excuse_valid')}
                  className="accent-teal-600"
                />
                <span>🩺 عذر شرعي / نوم غلبني / مرض قهري</span>
              </label>

              <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                justification === 'none_world_distraction' ? 'bg-white border-rose-400 text-rose-950 font-bold shadow-2xs' : 'bg-rose-100/50 border-rose-200 text-slate-700'
              }`}>
                <input 
                  type="radio" 
                  name="justification" 
                  checked={justification === 'none_world_distraction'} 
                  onChange={() => setJustification('none_world_distraction')}
                  className="accent-rose-600"
                />
                <span>😔 لا يوجد عذر، شغلني أمر من أمور الدنيا (أستغفر الله)</span>
              </label>
            </div>
          </div>
        )}

        {/* Location & Congregation Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-teal-600" />
            أين أديت الصلاة؟ (تحفيز أجر المسجد والجماعة)
          </label>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setIsMosque(true)}
              className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2 cursor-pointer ${
                isMosque
                  ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isMosque ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold">في المسجد / جماعة 🕌</span>
                <span className="text-[10px] text-teal-700 font-medium">أفضل بـ 27 درجة!</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsMosque(false)}
              className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2 cursor-pointer ${
                !isMosque
                  ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${!isMosque ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold">في البيت / فردياً 🏠</span>
                <span className="text-[10px] text-amber-800 font-medium">جاهد للمسجد المرة القادمة</span>
              </div>
            </button>
          </div>
        </div>

        {/* Spiritual Encouragement Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1">
          <p className="font-bold text-teal-800 flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            تحفيز النية وعمارة المساجد:
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {getMosqueVirtue()}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleComplete}
            className="flex-1 py-3 px-5 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تأكيد وتسجيل الصلاة ✅</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
