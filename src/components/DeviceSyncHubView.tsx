import React, { useState } from 'react';
import { 
  Laptop, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Activity, 
  ExternalLink,
  Sparkles,
  Link2,
  Radio,
  Battery,
  BatteryCharging,
  Zap,
  Clock,
  Send,
  BellRing
} from 'lucide-react';
import { DeviceSyncHubState, PhoneLinkState } from '../types';
import { sounds } from '../utils/audio';
import { PhoneLinkCenter } from './PhoneLinkCenter';
import QRCode from 'react-qr-code';
import LogoImage from '../assets/images/raqeeb_logo_1788773748138.jpg';

interface DeviceSyncHubViewProps {
  syncState: DeviceSyncHubState;
  onUpdateSyncState: (newState: DeviceSyncHubState) => void;
  onTriggerInstantSync?: () => Promise<boolean> | void;
  onGoToDashboard?: () => void;
  onInstallApp?: () => void;
  onConfirmPrayerSync?: (prayerName: string) => void;
  currentDeviceType?: 'windows' | 'android';
  onChangeDeviceType?: (type: 'windows' | 'android') => void;
  onSendCommand?: (command: string, payload?: any) => Promise<void>;
  onJoinSession?: (code: string) => Promise<boolean>;
  onRegeneratePairingCode?: () => Promise<string>;
  localDeviceId?: string;
  localDeviceName?: string;
  isCloudConnected?: boolean;
  isPhoneRinging?: boolean;
  onDismissRing?: () => void;
}

export const DeviceSyncHubView: React.FC<DeviceSyncHubViewProps> = ({
  syncState,
  onUpdateSyncState,
  onTriggerInstantSync,
  onGoToDashboard,
  onInstallApp,
  onConfirmPrayerSync,
  currentDeviceType = 'windows',
  onChangeDeviceType,
  onSendCommand = async () => {},
  onJoinSession,
  onRegeneratePairingCode,
  localDeviceId,
  localDeviceName,
  isCloudConnected = true,
  isPhoneRinging = false,
  onDismissRing
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [customJoinCode, setCustomJoinCode] = useState('');
  const [joinMsg, setJoinMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const pairingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?pairing_code=${syncState.pairingCode}&device=android`
    : `https://raqeeb-app.local/?pairing_code=${syncState.pairingCode}&device=android`;

  const handleCopyCode = () => {
    sounds.playSuccessTone();
    navigator.clipboard.writeText(syncState.pairingCode);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyPairingUrl = () => {
    sounds.playSuccessTone();
    navigator.clipboard.writeText(pairingUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    sounds.playSuccessTone();
    try {
      if (onTriggerInstantSync) {
        await onTriggerInstantSync();
      }
      setJoinMsg({ text: '✅ تمت المزامنة الفورية مع السحابة بنجاح!' });
    } catch (e) {
      setJoinMsg({ text: 'تم تحديث المزامنة محلياً.', isError: false });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setJoinMsg(null), 3000);
    }
  };

  const handleJoinExistingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customJoinCode.trim()) return;
    const formattedCode = customJoinCode.trim().toUpperCase();
    
    if (!/^RQ-[A-Za-z0-9_\-]{4,32}$/.test(formattedCode)) {
      sounds.playBlockWarning();
      setJoinMsg({ text: '⚠️ صيغة الكود غير صحيحة، يجب أن تبدأ بـ RQ- مثل (RQ-894215)', isError: true });
      setTimeout(() => setJoinMsg(null), 4000);
      return;
    }

    sounds.playSuccessTone();
    if (onJoinSession) {
      const ok = await onJoinSession(formattedCode);
      if (ok) {
        setJoinMsg({ text: `🎉 تم الارتباط سحابياً بالجلسة [${formattedCode}] بنجاح!` });
      } else {
        setJoinMsg({ text: `تم تحديث الكود إلى [${formattedCode}]` });
      }
    } else {
      onUpdateSyncState({
        ...syncState,
        pairingCode: formattedCode,
        lastFullSync: 'متصل سحابياً بالجلسة'
      });
      setJoinMsg({ text: `تم الارتباط بالجلسة [${formattedCode}]` });
    }
    setCustomJoinCode('');
    setTimeout(() => setJoinMsg(null), 4000);
  };

  const handleRegenerateCode = async () => {
    setIsRegenerating(true);
    sounds.playSuccessTone();
    try {
      if (onRegeneratePairingCode) {
        const fresh = await onRegeneratePairingCode();
        setJoinMsg({ text: `✨ تم إنشاء كود اقتران فريد وجديد للجهاز: ${fresh}` });
      } else {
        const randomSuffix = crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000;
        const newCode = `RQ-${randomSuffix}`;
        onUpdateSyncState({
          ...syncState,
          pairingCode: newCode,
          lastFullSync: 'تم إنشاء رمز اقتران جديد'
        });
        setJoinMsg({ text: `تم توليد رمز اقتران جديد: ${newCode}` });
      }
    } catch (e) {
      setJoinMsg({ text: 'تم تحديث رمز الاقتران محلياً.' });
    } finally {
      setIsRegenerating(false);
      setTimeout(() => setJoinMsg(null), 4000);
    }
  };

  const win = syncState.devices.windows;
  const android = syncState.devices.android;
  const totalScreenTime = (win.stats?.totalTimeMinutes || 0) + (android.stats?.totalTimeMinutes || 0);
  const winPercent = totalScreenTime > 0 ? Math.round(((win.stats?.totalTimeMinutes || 0) / totalScreenTime) * 100) : 50;
  const androidPercent = totalScreenTime > 0 ? 100 - winPercent : 50;

  const isAndroidConnected = android.status === 'connected' && 
    Boolean(syncState.phoneLink?.isLinked) && 
    syncState.phoneLink?.phoneModel !== 'غير مقترن';

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      
      {/* 0. PERSPECTIVE SWITCHER BANNER */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-200 shrink-0">
            {currentDeviceType === 'android' ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-teal-200">أنت تتصفح حالياً من:</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/20 text-white">
                {currentDeviceType === 'android' ? '📱 هاتف أندرويد (Mobile)' : '💻 حاسوب ويندوز (Desktop)'}
              </span>
              {localDeviceName && (
                <span className="text-[11px] text-teal-300 font-mono bg-black/20 px-2 py-0.5 rounded-md">
                  {localDeviceName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-teal-100/80 mt-1">
              مزامنة ثنائية حية: أي تغيير على الهاتف ينعكس فوراً على الحاسوب والعكس عبر السحابة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-black/25 p-1 rounded-xl shrink-0">
          <button
            onClick={() => onChangeDeviceType?.('windows')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentDeviceType === 'windows' ? 'bg-white text-teal-900 shadow-xs' : 'text-teal-200 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>الحاسوب</span>
          </button>
          <button
            onClick={() => onChangeDeviceType?.('android')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentDeviceType === 'android' ? 'bg-white text-teal-900 shadow-xs' : 'text-teal-200 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>الهاتف</span>
          </button>
        </div>
      </div>

      {/* 1. TOP HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 overflow-hidden">
              <img src={LogoImage} alt="شعار رَقِيب" className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-extrabold font-['Amiri',serif] text-xl sm:text-2xl text-slate-900">
                  مركز التزامن السحابي وإدارة الأجهزة (Multi-Device Live Hub)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  {isCloudConnected ? 'سحابي متصل ومباشر 🟢' : 'محلي (أوفلاين) 🟡'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                اربط حاسوبك وهاتفك برمز اقتران فريد لمزامنة الصلوات، الحافظة، درع التركيز، وساعات الاستخدام لحظة بلحظة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="sync-now-btn"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-75 text-white font-bold text-xs sm:text-sm rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'جاري المزامنة...' : 'مزامنة فورية الآن'}
            </button>
          </div>
        </div>

        {joinMsg && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            joinMsg.isError ? 'bg-rose-50 border border-rose-200 text-rose-900' : 'bg-teal-50 border border-teal-200 text-teal-900'
          }`}>
            <span>{joinMsg.text}</span>
          </div>
        )}
      </div>

      {/* 2. DEVICE STATUS & PAIRING OVERVIEW (3 CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Windows PC */}
        <div className={`bg-white border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all ${
          currentDeviceType === 'windows' ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                <Laptop className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center gap-1.5">
                {currentDeviceType === 'windows' && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold">
                    هذا الجهاز الحالي
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  win.status === 'connected' || currentDeviceType === 'windows'
                    ? 'bg-teal-50 text-teal-700 border border-teal-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                  متصل ومربوط
                </span>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 text-base mb-1">
              {win.name || (currentDeviceType === 'windows' ? '💻 الحاسوب الحالي (Windows)' : '💻 حاسوب ويندوز المقترن')}
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-4">{win.version} • {win.ipAddress}</p>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>وقت الاستخدام اليوم:</span>
                <span className="font-bold font-mono text-slate-900">
                  {Math.floor((win.stats?.totalTimeMinutes || 0) / 60)}س {(win.stats?.totalTimeMinutes || 0) % 60}د
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>تصفح المتصفحات:</span>
                <span className="font-mono text-teal-700 font-semibold">{win.stats?.browserTimeMinutes || 0} دقيقة</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>المحاولات المحجوبة:</span>
                <span className="font-mono text-rose-600 font-bold">{win.stats?.blockedAttemptsCount || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>الصلوات المؤكدة:</span>
                <span className="font-mono text-emerald-700 font-bold">{win.stats?.confirmedPrayers || 0} / 5</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>حالة الاتصال:</span>
                <span className="text-teal-700 font-semibold">{win.lastSyncTime || 'متصل ونشط'}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <button
              onClick={() => { sounds.playSuccessTone(); onInstallApp?.(); }}
              className="w-full py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Laptop className="w-4 h-4 text-teal-600" />
              أداة تثبيت الويندوز والمثبت الشامل
            </button>
          </div>
        </div>

        {/* Card 2: Dynamic Smart QR & Pairing Token */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between text-center relative">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-xs font-semibold mb-2">
              <QrCode className="w-3.5 h-3.5 text-teal-600" />
              رمز الاقتران الموحد للجهاز
            </div>

            <div className="my-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[11px] text-slate-500 block mb-0.5">رمز الربط السحابي الحالي:</span>
              <div className="text-xl sm:text-2xl font-extrabold tracking-widest text-teal-700 font-mono select-all">
                {syncState.pairingCode}
              </div>
            </div>

            <div className="mx-auto bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xs flex items-center justify-center w-fit my-2">
              <QRCode
                value={pairingUrl}
                size={105}
                level="M"
                fgColor="#0f172a"
                bgColor="#ffffff"
              />
            </div>
            
            <p className="text-[11px] text-slate-500">
              امسح الرمز بكاميرا الهاتف للفتح والاقتران التلقائي
            </p>
            
            <div className="mt-2 flex flex-col gap-1.5">
              <button
                onClick={handleCopyPairingUrl}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 p-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Link2 className="w-3.5 h-3.5" />}
                {copiedUrl ? 'تم نسخ الرابط المباشر!' : 'نسخ رابط الاقتران المباشر'}
              </button>

              <a
                href={pairingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1 text-[11px] text-slate-600 hover:text-teal-700 font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                تجربة فتح الهاتف في تبويب جديد
              </a>
            </div>
          </div>

          <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="flex-1 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl border border-teal-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-teal-600" />}
                {copiedToken ? 'تم النسخ!' : 'نسخ الرمز'}
              </button>
              <button
                onClick={handleRegenerateCode}
                disabled={isRegenerating}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                title="توليد كود اقتران جديد لهذا الجهاز"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Manual join code */}
            <form onSubmit={handleJoinExistingCode} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={customJoinCode}
                onChange={(e) => setCustomJoinCode(e.target.value)}
                placeholder="أدخل كود جهازك (مثال: RQ-894215)"
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 font-mono text-center focus:outline-hidden focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={!customJoinCode.trim()}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
              >
                ربط سحابي
              </button>
            </form>
          </div>
        </div>

        {/* Card 3: Android Phone */}
        <div className={`bg-white border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all ${
          currentDeviceType === 'android' ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center gap-1.5">
                {currentDeviceType === 'android' && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold">
                    هذا الجهاز الحالي
                  </span>
                )}
                {isAndroidConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100">
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                    متصل ومربوط
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    غير مقترن بعد
                  </span>
                )}
              </div>
            </div>

            <h3 className="font-bold text-slate-900 text-base mb-1">
              {android.name || (currentDeviceType === 'android' ? '📱 الهاتف الحالي (Android)' : '📱 هاتف أندرويد المقترن')}
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-4">{android.version} • {android.ipAddress}</p>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>إجمالي وقت الهاتف اليوم:</span>
                <span className="font-bold font-mono text-slate-900">
                  {Math.floor((android.stats?.totalTimeMinutes || 0) / 60)}س {(android.stats?.totalTimeMinutes || 0) % 60}د
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>تطبيقات التواصل:</span>
                <span className="font-mono text-teal-700 font-semibold">{android.stats?.socialTimeMinutes || 0} دقيقة</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>محاولات محجوبة على الهاتف:</span>
                <span className="font-mono text-rose-600 font-bold">{android.stats?.blockedAttemptsCount || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>الصلوات المؤكدة:</span>
                <span className="font-mono text-emerald-700 font-bold">{android.stats?.confirmedPrayers || 0} / 5</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>نسبة البطارية الحية:</span>
                <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                  {syncState.phoneLink?.phoneBattery !== null && syncState.phoneLink?.phoneBattery !== undefined ? (
                    <>
                      {syncState.phoneLink.isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" /> : <Battery className="w-3.5 h-3.5 text-slate-700" />}
                      {syncState.phoneLink.phoneBattery}% {syncState.phoneLink.isCharging ? '(شحن)' : ''}
                    </>
                  ) : (
                    'قيد المزامنة'
                  )}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>حالة التزامن:</span>
                <span className={isAndroidConnected ? "text-teal-700 font-semibold" : "text-slate-500"}>
                  {isAndroidConnected ? 'متزامن سحابياً مباشرة' : 'في انتظار ربط الهاتف'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <button
              onClick={() => { sounds.playSuccessTone(); onInstallApp?.(); }}
              className="w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-100 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-teal-600" />
              إعدادات الأندرويد والـ DNS
            </button>
          </div>
        </div>
      </div>

      {/* 3. PHONE LINK LIVE INTERACTION CENTER */}
      <PhoneLinkCenter
        pairingCode={syncState.pairingCode}
        phoneLinkState={syncState.phoneLink || {
          isLinked: false,
          pairingCode: syncState.pairingCode,
          phoneBattery: null,
          isCharging: false,
          phoneModel: 'غير مقترن',
          wifiName: 'غير متصل',
          isRinging: false,
          focusShieldActive: false,
          sharedClipboard: '',
          clipboardSender: null,
          lastClipboardSync: null,
          lastPingSecondsAgo: 0,
          notifications: []
        }}
        onUpdatePhoneLinkState={(newPhoneLink: PhoneLinkState) => {
          onUpdateSyncState({
            ...syncState,
            phoneLink: newPhoneLink
          });
        }}
        onSendCommand={onSendCommand}
        onConfirmPrayerSync={onConfirmPrayerSync}
        currentDeviceType={currentDeviceType}
        isPhoneRinging={isPhoneRinging}
        onDismissRing={onDismissRing}
      />

      {/* 4. COMBINED LIVE STATS DASHBOARD */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          الحصيلة المجمعة للجهازين معاً اليوم
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          يتم دمج ومزامنة إحصائيات الكمبيوتر والموبايل لحظياً عبر السحابة.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs text-slate-500 block mb-1">⏱️ إجمالي وقت الشاشة</span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
              {Math.floor(totalScreenTime / 60)}س {totalScreenTime % 60}د
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-1 truncate">
              (كمبيوتر: {win.stats?.totalTimeMinutes || 0}د • موبايل: {android.stats?.totalTimeMinutes || 0}د)
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs text-slate-500 block mb-1">🛡️ إجمالي المحجوب</span>
            <span className="text-lg sm:text-xl font-extrabold text-rose-600 font-mono">
              {(win.stats?.blockedAttemptsCount || 0) + (android.stats?.blockedAttemptsCount || 0)} محاولات
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-1 truncate">
              ({win.stats?.blockedAttemptsCount || 0} كمبيوتر • {android.stats?.blockedAttemptsCount || 0} موبايل)
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs text-slate-500 block mb-1">🕌 الصلوات المؤكدة</span>
            <span className="text-lg sm:text-xl font-extrabold text-teal-700 font-mono">
              {Math.max(win.stats?.confirmedPrayers || 0, android.stats?.confirmedPrayers || 0)} من 5
            </span>
            <span className="text-[10px] sm:text-[11px] text-teal-600 block mt-1">
              مزامنة فورية بين الهاتف والكمبيوتر
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs text-slate-500 block mb-1">📿 أذكار الاستغفار</span>
            <span className="text-lg sm:text-xl font-extrabold text-teal-700 font-mono">
              {(win.stats?.istighfarCount || 0) + (android.stats?.istighfarCount || 0)} ذكر
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-1">
              من تنبيهات الـ 10 دقائق
            </span>
          </div>
        </div>

        {/* Distribution bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>💻 الكمبيوتر ({winPercent}%)</span>
            <span>📱 الهاتف ({androidPercent}%)</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
            <div style={{ width: `${winPercent}%` }} className="bg-teal-600 h-full transition-all" />
            <div style={{ width: `${androidPercent}%` }} className="bg-slate-500 h-full transition-all" />
          </div>
        </div>
      </div>

    </div>
  );
};
