import React, { useState, useMemo } from 'react';
import { Clock, Calendar, Sparkles, BookOpen, X, Heart, ShieldCheck, MapPin } from 'lucide-react';
import { PrayerInfo } from '../types';
import { CityPreset, calculatePrayerTimes, formatTimeArabic, getNextPrayer } from '../utils/prayerTimes';

interface NextPrayerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayers: PrayerInfo[];
  selectedCity: CityPreset;
}

export const NextPrayerInfoModal: React.FC<NextPrayerInfoModalProps> = ({
  isOpen,
  onClose,
  prayers,
  selectedCity,
}) => {
  if (!isOpen) return null;

  const nextPrayerData = getNextPrayer(prayers);
  const hoursLeft = Math.floor(nextPrayerData.minutesLeft / 60);
  const minsLeft = nextPrayerData.minutesLeft % 60;

  // Calculate current week schedule (Today + 6 days)
  const weekSchedule = useMemo(() => {
    const schedule = [];
    const today = new Date();
    
    // Get starting from today
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const times = calculatePrayerTimes(selectedCity, d);
      const isToday = i === 0;

      const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });
      const dateStr = d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });

      schedule.push({
        date: d,
        dayName,
        dateStr,
        isToday,
        times,
      });
    }

    return schedule;
  }, [selectedCity]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-teal-700/80 border border-teal-500/40 text-amber-300 flex items-center justify-center shadow-md shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold font-['Amiri',serif] tracking-wide">
                معلومات الصلاة القادمة وسجل الأسبوع
              </h3>
              <p className="text-xs text-teal-200 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{selectedCity.nameAr}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer relative z-10 shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin scrollbar-thumb-teal-200">
          
          {/* Featured Card: Next Prayer Countdown */}
          <div className="bg-gradient-to-br from-teal-50 via-emerald-50/50 to-slate-50 border border-teal-200 rounded-3xl p-5 shadow-2xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-100/80 px-3 py-1 rounded-full border border-teal-200 mb-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                  الصلاة القادمة
                </span>
                <h4 className="text-2xl font-black text-slate-900 font-['Amiri',serif]">
                  صلاة {nextPrayerData.next.nameAr}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  موعد الأذان: <strong className="text-teal-800 font-mono text-sm">{formatTimeArabic(nextPrayerData.next.time)}</strong>
                </p>
              </div>

              <div className="bg-white border border-teal-200/80 rounded-2xl p-4 shadow-sm text-center min-w-[170px] w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">المتبقي على الأذان:</span>
                <span className="text-xl font-black text-teal-700 font-mono dir-ltr block">
                  {hoursLeft > 0 ? `${hoursLeft}س و ${minsLeft}د` : `${minsLeft} دقيقة`}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Virtues of Obligatory Prayer (فضل الصلاة المفروضة) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <h4 className="text-base font-extrabold text-slate-900 font-['Amiri',serif]">
                فضل الصلاة المفروضة وأهمية أدائها في وقتها
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Heart className="w-4 h-4 text-amber-600 fill-amber-200 shrink-0" />
                  <span>أحب الأعمال إلى الله تعالى</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  سُئِلَ النبي ﷺ: أيُّ العَمَلِ أحَبُّ إلى اللَّهِ؟ قَالَ: «الصَّلَاةُ علَى وقْتِهَا» [متفق عليه]
                </p>
              </div>

              <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>تكفير الذنوب والآثام</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  «الصَّلَوَاتُ الخَمْسُ، وَالْجُمُعَةُ إِلَى الْجُمُعَةِ، كَفَّارَاتٌ لِمَا بَيْنَهُنَّ مَا لَمْ تُغْشَ الْكَبَائِرُ» [مسلم]
                </p>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>فريضة محددة في وقت معلوم</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  «إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا» [النساء: 103]
                </p>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-900 font-bold">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>نور في القبر والقيامة</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  «بَشِّرِ المَشَّائِينَ فِي الظُّلَمِ إِلَى المَسَاجِدِ بِالنُّورِ التَّامِّ يَوْمَ القِيَامَةِ» [أبو داود والترمذي]
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Weekly Prayer Times Schedule (سجل مواقيت الصلوات للأسبوع الحالي) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
                <h4 className="text-base font-extrabold text-slate-900 font-['Amiri',serif]">
                  جدول مواقيت الصلاة للأسبوع الحالي (7 أيام)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">{selectedCity.nameAr}</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">اليوم والتاريخ</th>
                      <th className="p-3">الفجر</th>
                      <th className="p-3 text-slate-400">الشروق</th>
                      <th className="p-3">الظهر</th>
                      <th className="p-3">العصر</th>
                      <th className="p-3">المغرب</th>
                      <th className="p-3">العشاء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {weekSchedule.map((item, idx) => {
                      const fajr = item.times.find(p => p.id === 'fajr')?.time;
                      const sunrise = item.times.find(p => p.id === 'sunrise')?.time;
                      const dhuhr = item.times.find(p => p.id === 'dhuhr')?.time;
                      const asr = item.times.find(p => p.id === 'asr')?.time;
                      const maghrib = item.times.find(p => p.id === 'maghrib')?.time;
                      const isha = item.times.find(p => p.id === 'isha')?.time;

                      return (
                        <tr 
                          key={idx}
                          className={`transition-colors ${
                            item.isToday 
                              ? 'bg-teal-50/80 font-bold text-teal-900 border-l-4 border-l-teal-600' 
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <td className="p-3 font-sans">
                            <div className="flex items-center gap-1.5">
                              <span>{item.dayName}</span>
                              <span className="text-[10px] text-slate-500 dir-ltr font-mono">({item.dateStr})</span>
                              {item.isToday && (
                                <span className="text-[9px] bg-teal-600 text-white px-1.5 py-0.2 rounded-md shrink-0">
                                  اليوم
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">{fajr ? formatTimeArabic(fajr) : '-'}</td>
                          <td className="p-3 text-slate-400">{sunrise ? formatTimeArabic(sunrise) : '-'}</td>
                          <td className="p-3">{dhuhr ? formatTimeArabic(dhuhr) : '-'}</td>
                          <td className="p-3">{asr ? formatTimeArabic(asr) : '-'}</td>
                          <td className="p-3">{maghrib ? formatTimeArabic(maghrib) : '-'}</td>
                          <td className="p-3">{isha ? formatTimeArabic(isha) : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-[11px] text-slate-600 text-center">
            💡 <strong>تنبيه:</strong> هذه الشاشة مخصصة لمعرفة الوقت والاطلاع على سجل المواعيد والأفضلية الشرعية. لتأكيد إتمام الصلاة، يرجى الاستعانة بـ <strong>تنبيه الصلاة</strong> عند الأذان أو من تبويب <strong>مواقيت الصلاة</strong>.
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
