import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Laptop, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck,
  Check,
  Copy,
  Zap,
  Apple,
  Info,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  QrCode,
  Globe,
  Terminal,
  MousePointerClick
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { sounds } from '../utils/audio';
import { downloadTextFile } from '../utils/downloadHelper';
import { 
  generateWindowsDnsProtectionScript,
  generateWindowsDesktopInstallerScript 
} from '../utils/realInstallers';
import { 
  downloadWindowsExe, 
  downloadAndroidApk 
} from '../utils/nativeInstallers';
import LogoImage from '../assets/images/raqeeb_logo_1788773748138.jpg';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onPromptTriggered?: () => void;
  pairingCode?: string;
  token?: string;
}

export function InstallGuideModal({ 
  isOpen, 
  onClose, 
  deferredPrompt,
  onPromptTriggered,
  pairingCode = `RQ-${crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000}`,
  token = `rq-tok-${crypto.randomUUID().split("-")[0]}`
}: InstallGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'windows' | 'android' | 'ios'>('windows');
  const [copiedDns, setCopiedDns] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [installStatusMessage, setInstallStatusMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  // Auto-detect user OS & check if inside iframe
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      try {
        setIsInIframe(window.self !== window.top);
      } catch {
        setIsInIframe(true);
      }

      const ua = window.navigator.userAgent.toLowerCase();
      let targetTab: 'windows' | 'android' | 'ios' = 'windows';
      if (/iphone|ipad|ipod/.test(ua)) {
        targetTab = 'ios';
      } else if (/android/.test(ua)) {
        targetTab = 'android';
      } else {
        targetTab = 'windows';
      }
      setActiveTab(targetTab);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://raqeeb.app';

  const handleCopyDns = () => {
    sounds.playSuccessTone();
    navigator.clipboard.writeText('adult-filter-dns.cleanbrowsing.org');
    setCopiedDns(true);
    setTimeout(() => setCopiedDns(false), 2000);
  };

  const handleCopyUrl = () => {
    sounds.playSuccessTone();
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleOpenInNewWindow = () => {
    sounds.playSuccessTone();
    window.open(appUrl, '_blank', 'noopener,noreferrer');
    setInstallStatusMessage('🚀 تم فتح التطبيق في نافذة مستقلة! ستظهر لك رسالة التثبيت (Install) مباشرة في شريط العنوان أو القائمة.');
  };

  // 1-Click Browser/System Native Installation (PWA / WebAPK)
  const handleNativeInstall = async () => {
    sounds.playSuccessTone();
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          onPromptTriggered?.();
          setInstallStatusMessage('✅ تم تثبيت التطبيق بنجاح كبرنامج رسمي على جهازك!');
          return;
        }
      } catch (err) {
        console.warn("Deferred prompt error:", err);
      }
    }
    
    // If running in an iframe or prompt not ready yet, open standalone window
    if (isInIframe) {
      window.open(appUrl, '_blank');
      setInstallStatusMessage('💡 تم فتح التطبيق في نافذة مستقلة حتى يتيح لك المتصفح تثبيته فوراً.');
    } else {
      if (activeTab === 'windows') {
        handleDownloadWindowsScript();
      } else {
        setInstallStatusMessage('💡 لتثبيته فوراً: اضغط على زر القائمة (⋮) في المتصفح ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».');
      }
    }
  };

  // Immediate Download for Windows Batch Installer
  const handleDownloadWindowsScript = () => {
    sounds.playSuccessTone();
    setIsDownloading(true);
    const script = generateWindowsDesktopInstallerScript(appUrl);
    downloadTextFile('Install-Raqeeb.bat', script, 'application/x-bat;charset=utf-8');
    setInstallStatusMessage('✅ تم تنزيل مُثبّت الويندوز السريع (Install-Raqeeb.bat)! اضغط عليه لتثبيت أيقونة التطبيق على سطح المكتب وتشغيله فوراً.');
    setTimeout(() => setIsDownloading(false), 1500);
  };

  // Immediate Download for Windows .EXE
  const handleDownloadWindowsExe = () => {
    sounds.playSuccessTone();
    setIsDownloading(true);
    setInstallStatusMessage('✅ جاري تنزيل (Raqeeb-Setup.exe)... قم بتشغيله ليبدأ التطبيق فوراً كبرنامج مستقل.');
    downloadWindowsExe(appUrl);
    setTimeout(() => setIsDownloading(false), 1500);
  };

  // Immediate Download for Android .APK
  const handleDownloadAndroidApk = async () => {
    sounds.playSuccessTone();
    setIsDownloading(true);
    setInstallStatusMessage('✅ جاري تنزيل حزمة (Raqeeb.apk)... يمكنك تثبيتها أو اتباع الخطوات لتثبيتها كـ WebAPK معتمد.');
    await downloadAndroidApk(appUrl);
    setTimeout(() => setIsDownloading(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-700 p-5 text-white text-right relative shrink-0">
          <button
            onClick={() => { sounds.playSuccessTone(); onClose(); }}
            className="absolute left-4 top-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-900/80 border border-teal-500/50 flex items-center justify-center shadow-inner overflow-hidden shrink-0">
              <img src={LogoImage} alt="شعار رَقِيب" className="w-9 h-9 rounded-lg object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-bold">تثبيت تطبيق «رَقِيب» الحقيقي</h3>
              <p className="text-xs text-teal-100 mt-0.5">تثبيت سلس وسريع 100% لأنظمة ويندوز وأندرويد وآيفون</p>
            </div>
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2.5 gap-2 shrink-0">
          <button
            onClick={() => { sounds.playSuccessTone(); setActiveTab('windows'); }}
            className={`flex-1 pb-2.5 pt-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'windows'
                ? 'border-teal-600 text-teal-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4 text-teal-600" />
            ويندوز (Windows)
          </button>

          <button
            onClick={() => { sounds.playSuccessTone(); setActiveTab('android'); }}
            className={`flex-1 pb-2.5 pt-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'android'
                ? 'border-teal-600 text-teal-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-teal-600" />
            أندرويد (Android)
          </button>

          <button
            onClick={() => { sounds.playSuccessTone(); setActiveTab('ios'); }}
            className={`flex-1 pb-2.5 pt-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'ios'
                ? 'border-teal-600 text-teal-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Apple className="w-4 h-4 text-teal-600" />
            آيفون (iOS)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700">
          
          {/* Notice if Inside Iframe (Explaining why browsers block install prompt in preview) */}
          {isInIframe && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 text-right">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>أنت تتصفح المعاينة داخل نافذة فرعية (Iframe):</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                متصفحات الويب (Chrome و Edge وأندرويد) تمنع تثبيت التطبيقات من داخل إطارات المعاينة لحماية خصوصيتك. للتثبيت الفوري بنقرة واحدة، افتح التطبيق في نافذة متصفح مستقلة:
              </p>
              <button
                onClick={handleOpenInNewWindow}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
              >
                <Globe className="w-4 h-4" />
                <span>فتح التطبيق في نافذة مستقلة للتثبيت الفوري</span>
              </button>
            </div>
          )}

          {/* Status Alert if Action Triggered */}
          {installStatusMessage && (
            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-2.5 text-xs text-teal-900 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{installStatusMessage}</span>
            </div>
          )}

          {/* TAB 1: WINDOWS INSTALLATION */}
          {activeTab === 'windows' && (
            <div className="space-y-4 text-right">
              
              {/* OPTION 1: 1-Click Fast Batch Desktop Installer (RECOMMENDED & 100% RELIABLE) */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl space-y-3 shadow-xs">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    الخيار الأسرع والمضمون 100%
                  </span>
                  <h4 className="text-sm font-extrabold text-teal-950">
                    أداة التثبيت التلقائي لويندوز (Install-Raqeeb.bat)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    تقوم الأداة بإنشاء اختصار رسمي لـ «رَقِيب» على سطح المكتب وقائمة ابدأ، وتشغيله فوراً كبرنامج مستقل (Standalone App) وبدون أي متطلبات إضافية.
                  </p>
                </div>

                <button
                  onClick={handleDownloadWindowsScript}
                  disabled={isDownloading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 text-xs sm:text-sm"
                >
                  <Download className="w-4 h-4 text-yellow-300" />
                  <span>تنزيل أداة التثبيت (Install-Raqeeb.bat)</span>
                </button>

                <div className="p-2.5 bg-white/80 border border-emerald-200 rounded-xl text-[11px] text-slate-700 leading-relaxed">
                  <strong>طريقة الاستخدام:</strong> بعد التنزيل، اضغط على الملف نقرتين بالماوس. سيتم إنشاء أيقونة البرنامج فوراً على الديسكتوب وقائمة البرامج وتشغيله.
                </div>
              </div>

              {/* OPTION 2: Browser Desktop Install */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-2.5">
                <div className="space-y-0.5">
                  <span className="inline-block px-2 py-0.5 bg-slate-700 text-white text-[10px] font-bold rounded-md">
                    تثبيت المتصفح الرسمي (Chrome / Edge)
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    تثبيت مباشر عبر متصفح مايكروسوفت إيدج أو كروم
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    إذا فتحت التطبيق في متصفح Edge أو Google Chrome على جهازك:
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <MousePointerClick className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>خطوات التثبيت في ثوانٍ:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 font-medium">
                    <li>في شريط العنوان بأعلى المتصفح، اضغط على أيقونة التثبيت (🖥️ أو ➕).</li>
                    <li>أو اضغط على القائمة (الثلاث نقاط ⋯) ➔ <strong>«التطبيقات (Apps)»</strong> ➔ <strong>«تثبيت هذا الموقع كتطبيق»</strong>.</li>
                    <li>اضغط <strong>«تثبيت (Install)»</strong> ليتحول البرنامج إلى تطبيق سطح مكتب مستقل.</li>
                  </ol>
                </div>

                <button
                  onClick={handleNativeInstall}
                  className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تثبيت فوري الآن من المتصفح</span>
                </button>
              </div>

              {/* OPTION 3: Direct PE32 EXE Executable */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="inline-block px-2 py-0.5 bg-slate-700 text-white text-[10px] font-bold rounded-md">
                      ملف تنفيذي (.EXE)
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      تحميل برنامج الويندوز (Raqeeb-Setup.exe)
                    </h4>
                  </div>
                </div>

                <button
                  onClick={handleDownloadWindowsExe}
                  disabled={isDownloading}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل ملف (Raqeeb-Setup.exe)</span>
                </button>
              </div>

              {/* Instant DNS Shield Tool */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    تفعيل درع حجب المواقع بنقرة واحدة (DNS Shield):
                  </div>
                  <button
                    onClick={() => {
                      sounds.playSuccessTone();
                      const script = generateWindowsDnsProtectionScript();
                      downloadTextFile('Enable-Raqeeb-DNS-Shield.bat', script, 'application/x-bat;charset=utf-8');
                      setInstallStatusMessage('✅ تم تنزيل أداة تفعيل درع الحجب (Enable-Raqeeb-DNS-Shield.bat)! قم بتشغيلها لتفعيل الحماية على كارت الشبكة.');
                    }}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    أداة الحجب (.bat)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANDROID INSTALLATION */}
          {activeTab === 'android' && (
            <div className="space-y-4 text-right">
              
              {/* METHOD 1: WebAPK Official Install (Zero Parsing Error, 0 Play Protect Blocks) */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl space-y-3 shadow-xs">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    تثبيت أندرويد الرسمي المعتمد من Google
                  </span>
                  <h4 className="text-sm font-extrabold text-teal-950">
                    تثبيت تطبيق أندرويد الحقيقي (حزمة WebAPK رسمية)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    لا حاجة لتحميل ملفات APK غير معتمدة قد تسبب خطأ «فشل تحليل الحزمة». نظام أندرويد ومتصفح Chrome يقومان تلقائياً بإنشاء حزمة أندرويد رسمية وتثبيتها في قائمة تطبيقات هاتفك فوراً!
                  </p>
                </div>

                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 text-xs sm:text-sm"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>تثبيت التطبيق على هاتف الأندرويد الآن</span>
                </button>

                {/* Step-by-Step for Android */}
                <div className="p-3 bg-white/90 border border-emerald-200 rounded-2xl text-xs space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-teal-600" />
                    <span>طريقة التثبيت على هاتف أندرويد في ثوانٍ:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 font-medium">
                    <li>افتح الرابط في متصفح <strong>Google Chrome</strong> على هاتفك.</li>
                    <li>اضغط على زر القائمة <strong>(الثلاث نقاط ⋮)</strong> في أعلى المتصفح.</li>
                    <li>اضغط على <strong>«تثبيت التطبيق (Install app)»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
                    <li>يتم تثبيت تطبيق «رَقِيب» فوراً في قائمة تطبيقات الهاتف بأيقونته الرسمية ويعمل حتى بدون إنترنت!</li>
                  </ol>
                </div>
              </div>

              {/* QR Code for Phone Access */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3 flex flex-col items-center text-center">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 text-slate-900 font-bold text-xs">
                    <QrCode className="w-4 h-4 text-teal-600" />
                    <span>امسح الرمز بكاميرا هاتفك للفتح والتثبيت الفوري</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    وجّه كاميرا هاتفك الأندرويد نحو الرمز أدناه ليفتح التطبيق في Chrome وتثبّته بنقرة واحدة:
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-200 inline-block">
                  <QRCode value={appUrl} size={140} />
                </div>

                <button
                  onClick={handleCopyUrl}
                  className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'تم نسخ الرابط!' : 'نسخ رابط التثبيت لمشاركته على الهاتف'}</span>
                </button>
              </div>

              {/* Direct APK Download with clear guidance */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="inline-block px-2 py-0.5 bg-slate-700 text-white text-[10px] font-bold rounded-md">
                      تنزيل يدوي (.APK)
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      تنزيل حزمة التطبيق (Raqeeb.apk)
                    </h4>
                  </div>
                </div>

                <button
                  onClick={handleDownloadAndroidApk}
                  disabled={isDownloading}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل حزمة (Raqeeb.apk)</span>
                </button>
              </div>

              {/* Private DNS tip */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Zap className="w-4 h-4 text-teal-600" />
                  حجب فوري على الهاتف بـ Private DNS:
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-teal-200">
                  <code className="text-xs font-mono text-teal-800 font-bold px-1 select-all flex-1 truncate">
                    adult-filter-dns.cleanbrowsing.org
                  </code>
                  <button
                    onClick={handleCopyDns}
                    className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                    title="نسخ عنوان DNS"
                  >
                    {copiedDns ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IOS DETAILS */}
          {activeTab === 'ios' && (
            <div className="space-y-4 text-right">
              <div className="space-y-3 bg-gradient-to-br from-slate-50 to-teal-50/30 border border-slate-200 rounded-3xl p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Apple className="w-4 h-4 text-teal-600" />
                  تثبيت «رَقِيب» على الآيفون والآيباد:
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  أنظمة آبل (iOS) تتيح تثبيت التطبيقات مباشرة كـ تطبيق حقيقي ومستقل دون الحاجة لمتجر App Store:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 font-semibold">
                  <li>افتح هذا الرابط في متصفح <strong>Safari</strong>.</li>
                  <li>اضغط على زر المشاركة <strong>(Share / السهم الخارج من مربع)</strong> بأسفل الشاشة.</li>
                  <li>اختر <strong>«إضافة إلى الشاشة الرئيسية (Add to Home Screen)»</strong>.</li>
                  <li>اضغط على <strong>«إضافة (Add)»</strong> وستظهر أيقونة رَقِيب فوراً على شاشتك.</li>
                </ol>
              </div>

              {/* Private DNS on iOS */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  حجب المواقع على الآيفون عبر DNS:
                </div>
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-teal-200">
                  <code className="text-xs font-mono text-teal-800 font-bold px-1 select-all flex-1 truncate">
                    adult-filter-dns.cleanbrowsing.org
                  </code>
                  <button
                    onClick={handleCopyDns}
                    className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                    title="نسخ عنوان DNS"
                  >
                    {copiedDns ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Dual Download Bar */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 mb-2 text-right">أدوات التثبيت السريع:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadWindowsScript}
                className="py-2 px-3 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Laptop className="w-4 h-4 text-teal-600" />
                <span>Install-Raqeeb.bat</span>
              </button>
              <button
                onClick={handleOpenInNewWindow}
                className="py-2 px-3 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-teal-600" />
                <span>فتح في نافذة مستقلة</span>
              </button>
            </div>
          </div>

          {/* Direct Link in new window */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <button
              onClick={handleOpenInNewWindow}
              className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900 font-bold cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              فتح التطبيق في نافذة مستقلة
            </button>

            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-teal-600" />}
              {copiedUrl ? 'تم نسخ الرابط!' : 'نسخ رابط التطبيق'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            مشروع «رَقِيب» — الرفيق الرقمي الواعي لحفظ الوقت وغض البصر
          </p>
          <button
            onClick={() => { sounds.playSuccessTone(); onClose(); }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
