import React, { useState } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Bell, 
  BellRing, 
  Check, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Send, 
  AlertCircle,
  Smartphone,
  Laptop
} from 'lucide-react';
import { AthkarReminderSettings } from '../types';
import { 
  getNotificationPermission, 
  requestPushPermission, 
  syncAthkarSettingsToServer, 
  sendTestAthkarPush 
} from '../utils/pushNotificationService';
import { sounds } from '../utils/audio';

interface AthkarNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AthkarReminderSettings;
  onSave: (newSettings: AthkarReminderSettings) => void;
  pairingCode: string;
}

export const AthkarNotificationModal: React.FC<AthkarNotificationModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  pairingCode
}) => {
  const [localSettings, setLocalSettings] = useState<AthkarReminderSettings>({ ...settings });
  const [permission, setPermission] = useState<string>(() => getNotificationPermission());
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; message: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const MORNING_PRESETS = [
    { label: 'بعد الفجر (05:30)', time: '05:30' },
    { label: 'شروق الشمس (06:30)', time: '06:30' },
    { label: 'بداية العمل (08:00)', time: '08:00' },
  ];

  const EVENING_PRESETS = [
    { label: 'بعد العصر (16:30)', time: '16:30' },
    { label: 'قبل المغرب (17:30)', time: '17:30' },
    { label: 'بعد المغرب (19:00)', time: '19:00' },
  ];

  const handleRequestPermission = async () => {
    const res = await requestPushPermission();
    setPermission(res);
    if (res === 'granted') {
      sounds.playSuccessTone();
      // Auto-sync current settings to server with active push subscription
      await syncAthkarSettingsToServer(pairingCode, localSettings);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave(localSettings);
      await syncAthkarSettingsToServer(pairingCode, localSettings);
      sounds.playSuccessTone();
      onClose();
    } catch (e) {
      console.warn('Error saving athkar settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async (type: 'morning' | 'evening') => {
    setTestStatus({ loading: true, message: 'جاري إرسال التنبيه التجريبي عبر الخادم...' });
    if (permission !== 'granted') {
      const p = await requestPushPermission();
      setPermission(p);
      if (p !== 'granted') {
        setTestStatus({
          loading: false,
          isError: true,
          message: 'يجب السماح بالإشعارات في المتصفح أولاً لإمكانية استلام التنبيهات في الخلفية.'
        });
        return;
      }
    }

    // Ensure server has latest subscription
    await syncAthkarSettingsToServer(pairingCode, localSettings);

    const result = await sendTestAthkarPush(pairingCode, type);
    if (result.success) {
      sounds.playSuccessTone();
      setTestStatus({
        loading: false,
        isError: false,
        message: result.message || 'تم إرسال الإشعار بنجاح! راجع لوحة إشعارات جهازك.'
      });
    } else {
      setTestStatus({
        loading: false,
        isError: true,
        message: result.message || 'تعذر إرسال الإشعار'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white text-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute left-5 top-5 text-teal-200 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
              <BellRing className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold">تنبيهات الأذكار اليومية في الخلفية</h3>
              <p className="text-teal-200 text-xs mt-0.5">
                تصلك في موعدك المخصص حتى لو كان التطبيق مغلقاً تماماً
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">

          {/* Background Service Status Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            permission === 'granted' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : permission === 'denied'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/80 shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
                {permission === 'granted' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {permission === 'granted' 
                    ? 'إشعارات النظام والخلفية مفعّلة' 
                    : permission === 'denied'
                      ? 'إشعارات المتصفح محظورة'
                      : 'تنبيهات الخلفية بحاجة إلى إذن'}
                </h4>
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                  {permission === 'granted'
                    ? 'الخدمة السحابية نشطة وترسل إشعارات Web Push لجهازك في مواعيدك حتى عند إغلاق التطبيق.'
                    : permission === 'denied'
                      ? 'يرجى النقر على قفل المتصفح بجانب شريط العنوان والسماح بالإشعارات.'
                      : 'اضغط على الزر لمنح الإذن لضمان وصول أذكارك عند إغلاق التطبيق.'}
                </p>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="shrink-0 w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                تفعيل الإشعارات الآن
              </button>
            )}
          </div>

          {/* Morning Athkar Settings Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">تنبيه أذكار الصباح</h4>
                  <p className="text-xs text-slate-500">وِرد بداية اليوم والبركة والتحصين</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.morningEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, morningEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {localSettings.morningEnabled && (
              <div className="pt-2 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    وقت التنبيه المخصص:
                  </span>
                  <input
                    type="time"
                    value={localSettings.morningTime}
                    onChange={(e) => setLocalSettings({ ...localSettings, morningTime: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {MORNING_PRESETS.map((preset) => (
                    <button
                      key={preset.time}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, morningTime: preset.time })}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                        localSettings.morningTime === preset.time
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Evening Athkar Settings Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">تنبيه أذكار المساء</h4>
                  <p className="text-xs text-slate-500">وِرد حفظ النفس والأهل قبل غياب الشمس</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.eveningEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, eveningEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {localSettings.eveningEnabled && (
              <div className="pt-2 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    وقت التنبيه المخصص:
                  </span>
                  <input
                    type="time"
                    value={localSettings.eveningTime}
                    onChange={(e) => setLocalSettings({ ...localSettings, eveningTime: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {EVENING_PRESETS.map((preset) => (
                    <button
                      key={preset.time}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, eveningTime: preset.time })}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                        localSettings.eveningTime === preset.time
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preferences (Sound & Quotes) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700">خيارات التنبيه الإضافية</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={localSettings.soundEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  {localSettings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  صوت التنبيه والاهتزاز
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={localSettings.spiritualQuoteEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, spiritualQuoteEnabled: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  إرفاق ذكر مأثور في نص الإشعار
                </span>
              </label>
            </div>
          </div>

          {/* Instant Test Section */}
          <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-teal-700" />
                اختبار وصول الإشعار لجهازك الآن:
              </span>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Smartphone className="w-3.5 h-3.5" />
                <span>هاتف / حاسوب</span>
                <Laptop className="w-3.5 h-3.5 mr-1" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleTestNotification('morning')}
                disabled={testStatus?.loading}
                className="px-3 py-1.5 bg-white border border-teal-300 text-teal-800 rounded-xl text-xs font-bold hover:bg-teal-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                تجربة إشعار الصباح
              </button>

              <button
                type="button"
                onClick={() => handleTestNotification('evening')}
                disabled={testStatus?.loading}
                className="px-3 py-1.5 bg-white border border-teal-300 text-teal-800 rounded-xl text-xs font-bold hover:bg-teal-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                تجربة إشعار المساء
              </button>
            </div>

            {testStatus && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                testStatus.isError ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {testStatus.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>جاري الحفظ والمزامنة...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                حفظ الإعدادات وتفعيل الخلفية
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
