import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Battery, 
  BatteryCharging, 
  Wifi, 
  Bell, 
  BellRing, 
  Copy, 
  Check, 
  Send, 
  Sparkles, 
  Trash2, 
  Laptop,
  Radio,
  Lock,
  Unlock,
  Globe
} from 'lucide-react';
import { PhoneLinkState } from '../types';
import { sounds } from '../utils/audio';

interface PhoneLinkCenterProps {
  pairingCode: string;
  phoneLinkState: PhoneLinkState;
  onUpdatePhoneLinkState: (newState: PhoneLinkState) => void;
  onSendCommand: (command: string, payload?: any) => Promise<void>;
  onConfirmPrayerSync?: (prayerName: string) => void;
  currentDeviceType?: 'windows' | 'android';
  isPhoneRinging?: boolean;
  onDismissRing?: () => void;
}

export const PhoneLinkCenter: React.FC<PhoneLinkCenterProps> = ({
  pairingCode,
  phoneLinkState,
  onUpdatePhoneLinkState,
  onSendCommand,
  onConfirmPrayerSync,
  currentDeviceType = 'windows',
  isPhoneRinging = false,
  onDismissRing
}) => {
  const [clipboardInput, setClipboardInput] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [isSendingClipboard, setIsSendingClipboard] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const isRinging = isPhoneRinging || phoneLinkState.isRinging;
  const isPhoneConnected = Boolean(
    phoneLinkState.isLinked && 
    phoneLinkState.phoneModel && 
    phoneLinkState.phoneModel !== 'غير مقترن'
  );

  // Real Device Battery Reading (Active when on mobile)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'getBattery' in navigator && currentDeviceType === 'android') {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          const level = Math.round(battery.level * 100);
          const charging = battery.charging;
          onSendCommand('sync_battery', { level, charging });
        };
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        updateBattery();
      }).catch(() => {});
    }
  }, [currentDeviceType, onSendCommand]);

  // 1. Toggle Ring Phone
  const handleToggleRing = async () => {
    sounds.playSuccessTone();
    if (isPhoneRinging || phoneLinkState.isRinging) {
      await onSendCommand('stop_ring');
      onDismissRing?.();
      setActionSuccessMsg('تم إيقاف رنين الهاتف.');
    } else {
      if (!isPhoneConnected) {
        setActionSuccessMsg('⚠️ لا يوجد هاتف مقترن حالياً! افتح التطبيق على هاتفك وإدخل رمز الاقتران أو امسح QR Code لربطه أولاً.');
        setTimeout(() => setActionSuccessMsg(null), 4000);
        return;
      }
      await onSendCommand('ring_phone');
      setActionSuccessMsg('🔔 جاري إرسال إشارة الرنين إلى الهاتف المقترن...');
    }
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // 2. Toggle Focus Shield on Phone
  const handleToggleFocusShield = async () => {
    if (!isPhoneConnected) {
      setActionSuccessMsg('⚠️ لا يوجد هاتف مقترن حالياً! قم بربط هاتفك أولاً لتفعيل درع التركيز عليه.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      return;
    }
    sounds.playSuccessTone();
    const nextState = !phoneLinkState.focusShieldActive;
    await onSendCommand('toggle_focus_shield', { active: nextState });
    setActionSuccessMsg(nextState ? '🛡️ تم قفل تطبيقات التشتيت على الأجهزة المشتركة!' : '🔓 تم فك قفل التركيز بنجاح.');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // 3. Send Live Shared Clipboard
  const handleSendClipboard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clipboardInput.trim()) return;

    if (!isPhoneConnected) {
      setActionSuccessMsg('⚠️ لا يوجد هاتف مقترن حالياً! افتح التطبيق على الهاتف أولاً لمشاركة الحافظة.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      return;
    }

    setIsSendingClipboard(true);
    sounds.playClipboardTone();
    await onSendCommand('send_clipboard', { 
      text: clipboardInput.trim(), 
      sender: currentDeviceType 
    });
    setClipboardInput('');
    setIsSendingClipboard(false);
    setActionSuccessMsg(currentDeviceType === 'android' ? '📋 تم إرسال النص إلى حافظة الحاسوب فوراً!' : '📋 تم إرسال النص إلى حافظة الهاتف فوراً!');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // 4. Copy current shared clipboard
  const handleCopyClipboard = () => {
    if (!phoneLinkState.sharedClipboard) return;
    sounds.playSuccessTone();
    navigator.clipboard.writeText(phoneLinkState.sharedClipboard);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // 5. Dismiss notification locally
  const handleDismissNotification = (notifId: string) => {
    sounds.playSuccessTone();
    const updated = phoneLinkState.notifications.filter(n => n.id !== notifId);
    onUpdatePhoneLinkState({
      ...phoneLinkState,
      notifications: updated
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xs space-y-6" dir="rtl">
      {/* Title & Live Heartbeat Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Radio className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900">
                تزامن الهاتف المباشر (Phone Link)
              </h2>
              {isPhoneConnected ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    مقترن ومتصل سحابياً
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold">
                    <Globe className="w-3 h-3 text-teal-600" />
                    4G/5G/Wi-Fi
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  غير مقترن (رمز الربط: {pairingCode})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              مزامنة لحظية مستمرة بين أجهزتك لمشاركة الحافظة، تنبيهات الصلوات، والتحكم السريع.
            </p>
          </div>
        </div>

        {/* Device Quick Stats Pill */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs text-slate-700 w-fit">
          <div className="flex items-center gap-1.5 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="font-bold truncate max-w-[120px]">
              {isPhoneConnected ? phoneLinkState.phoneModel : 'غير مقترن'}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            {isPhoneConnected && phoneLinkState.isCharging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="font-mono font-bold">
              {isPhoneConnected && phoneLinkState.phoneBattery !== null ? `${phoneLinkState.phoneBattery}%` : '—'}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-mono text-[11px] truncate max-w-[100px]">
              {isPhoneConnected ? (phoneLinkState.wifiName || 'متصل') : 'غير متصل'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionSuccessMsg && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Ringing Alert Banner if Active */}
      {isRinging && isPhoneConnected && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-950 animate-pulse">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 text-rose-600 animate-bounce shrink-0" />
            <div>
              <span className="text-sm font-bold block">🔔 جاري رنين الهاتف الآن!</span>
              <span className="text-xs text-rose-700">يصدر الهاتف صوتاً عالياً لمساعدتك في العثور عليه.</span>
            </div>
          </div>
          <button
            onClick={handleToggleRing}
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
          >
            إيقاف الرنين الآن
          </button>
        </div>
      )}

      {/* 2-Column Grid: Left (Phone Link Controls) & Right (Live Shared Clipboard & Notifications) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Quick Remote Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            أدوات التحكم اللحظية بالهاتف
          </h3>

          {/* 1. Ring Phone Tool */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isRinging ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-700'
              }`}>
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {currentDeviceType === 'android' ? 'تجربة رنين الهاتف' : 'رنين للبحث عن الهاتف'}
                </h4>
                <p className="text-[11px] text-slate-500">تشغيل نغمة عالية للعثور عليه فوراً</p>
              </div>
            </div>

            <button
              onClick={handleToggleRing}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isRinging 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs' 
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
              }`}
            >
              {isRinging ? 'إيقاف' : 'رنين الآن'}
            </button>
          </div>

          {/* 2. Remote Focus Shield Lock */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                phoneLinkState.focusShieldActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {phoneLinkState.focusShieldActive ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">درع قفل التشتيت بالهاتف</h4>
                <p className="text-[11px] text-slate-500">
                  {phoneLinkState.focusShieldActive ? 'تطبيقات السوشيال مقفولة' : 'السوشيال متاح حالياً'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleFocusShield}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                phoneLinkState.focusShieldActive 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs' 
                  : 'bg-slate-800 hover:bg-slate-900 text-white shadow-xs'
              }`}
            >
              {phoneLinkState.focusShieldActive ? 'فك القفل' : 'قفل فوري'}
            </button>
          </div>

          {/* 3. Fast Cross-Device Prayer Sync Test */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">مزامنة فريضة الصلاة</h4>
                <p className="text-[11px] text-slate-500">تأكيد أداء الفريضة على الهاتف والكمبيوتر</p>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playPrayerAlert();
                onSendCommand('confirm_prayer', { prayerName: 'العصر', sender: currentDeviceType });
                onConfirmPrayerSync?.('asr');
                setActionSuccessMsg('🕌 تم تسجيل وتأكيد الصلاة ومزامنتها على جميع أجهزتك فوراً!');
                setTimeout(() => setActionSuccessMsg(null), 3500);
              }}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
            >
              تأكيد الصلاة
            </button>
          </div>

          {/* Device Sync Info Box */}
          <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-[11px] text-teal-950 leading-relaxed space-y-1">
            <span className="font-bold block">✨ كيفية عمل Phone Link في رَقِيب:</span>
            <p>
              ترتبط جلسة أجهزتك سحابياً عبر كود الاقتران 
              <strong className="font-mono mx-1 text-teal-800 font-bold">[{pairingCode}]</strong>
              لتنتقل الحافظة وتأكيدات الصلاة وتنبيهات الحجب بين الهاتف والحاسوب في أجزاء من الثانية.
            </p>
          </div>
        </div>

        {/* Right Column: Live Shared Clipboard & Live Notifications Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* SECTION A: LIVE SHARED CLIPBOARD */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-teal-600" />
                الحافظة المشتركة اللحظية (Shared Clipboard)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {phoneLinkState.lastClipboardSync ? `آخر نص: ${new Date(phoneLinkState.lastClipboardSync).toLocaleTimeString('ar-EG')}` : ''}
              </span>
            </div>

            {/* Current Shared Clipboard Display */}
            {phoneLinkState.sharedClipboard ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 overflow-hidden">
                  <span className="text-xs text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md font-bold shrink-0 mt-0.5">
                    {phoneLinkState.clipboardSender === 'windows' ? '💻 الحاسوب' : '📱 الهاتف'}
                  </span>
                  <p className="text-xs text-slate-800 font-mono select-all truncate">
                    {phoneLinkState.sharedClipboard}
                  </p>
                </div>

                <button
                  onClick={handleCopyClipboard}
                  className="p-2 bg-white hover:bg-teal-50 text-teal-700 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
                  title="نسخ النص"
                >
                  {copiedText ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs text-slate-400">
                الحافظة المشتركة فارغة حالياً. أرسل نصاً أو رابطاً من أحد أجهزتك وسيظهر هنا فوراً.
              </div>
            )}

            {/* Input to send new text */}
            <form onSubmit={handleSendClipboard} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={clipboardInput}
                onChange={(e) => setClipboardInput(e.target.value)}
                placeholder={currentDeviceType === 'android' ? 'اكتب نصاً أو رابطاً لمشاركته مع الحاسوب...' : 'اكتب نصاً أو رابطاً لمشاركته مع الهاتف...'}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!clipboardInput.trim() || isSendingClipboard}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{currentDeviceType === 'android' ? 'إرسال للحاسوب 💻' : 'إرسال للهاتف 📱'}</span>
              </button>
            </form>
          </div>

          {/* SECTION B: LIVE NOTIFICATIONS BRIDGE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-teal-600" />
                جسر الإشعارات وتنبيهات الحماية المشتركة
              </h3>
              <span className="text-[11px] text-slate-500 font-bold">
                {phoneLinkState.notifications.length} إشعار
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {phoneLinkState.notifications.length === 0 ? (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                  لا توجد إشعارات مسجلة حتى الآن.
                </div>
              ) : (
                phoneLinkState.notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-2xl border flex items-start justify-between gap-3 transition-all ${
                      notif.type === 'blocked'
                        ? 'bg-rose-50/70 border-rose-200'
                        : notif.type === 'ring'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === 'blocked' 
                          ? 'bg-rose-100 text-rose-600' 
                          : notif.type === 'ring' 
                          ? 'bg-amber-100 text-amber-600' 
                          : 'bg-teal-100 text-teal-700'
                      }`}>
                        {notif.source === 'android' ? <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Laptop className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(notif.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{notif.body}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDismissNotification(notif.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                      title="مسح الإشعار"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
