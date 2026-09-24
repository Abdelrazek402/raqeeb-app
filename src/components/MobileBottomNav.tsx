import React, { useState } from 'react';
import { 
  LayoutDashboard,
  Activity, 
  BookOpen, 
  Heart, 
  Bot, 
  Menu, 
  X, 
  Smartphone, 
  Clock, 
  Target, 
  Shield, 
  Sliders, 
  Code2, 
  CheckSquare, 
  ShieldAlert, 
  Share2, 
  Volume2, 
  VolumeX, 
  Download, 
  Sparkles,
  Check,
  Terminal,
  Layers
} from 'lucide-react';
import { ActiveTab, ProtectionLevel, DeviceSyncHubState } from '../types';
import LogoImage from '../assets/images/raqeeb_logo_1788773748138.jpg';
import { sounds } from '../utils/audio';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  onOpenPanic?: () => void;
  onOpenTawbah?: () => void;
  onInstallApp?: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  syncState: DeviceSyncHubState;
  protectionLevel: ProtectionLevel;
  nextPrayerName?: string;
  onQuickSimulatePrayer?: () => void;
  istighfarCount?: number;
  onIncrementIstighfar?: () => void;
  isDevMode?: boolean;
  onToggleDevMode?: () => void;
  showFloatingBar?: boolean;
  onToggleFloatingBar?: (enabled?: boolean) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  isMenuOpen,
  setIsMenuOpen,
  onOpenPanic,
  onOpenTawbah,
  onInstallApp,
  onToggleMute,
  isMuted,
  syncState,
  protectionLevel,
  nextPrayerName,
  istighfarCount = 0,
  onIncrementIstighfar,
  isDevMode = false,
  onToggleDevMode,
  showFloatingBar = true,
  onToggleFloatingBar
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const primaryTabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'analytics', label: 'التقارير', icon: Activity },
    { id: 'prayers', label: 'المواقيت', icon: Clock },
    { id: 'quran', label: 'المصحف', icon: BookOpen },
    { id: 'companion', label: 'الرفيق', icon: Bot },
  ];

  const standardSecondaryTabs: { id: ActiveTab; label: string; desc: string; icon: React.ElementType; badge?: string }[] = [
    { 
      id: 'adhkar', 
      label: 'أذكار الصباح والمساء والسبحة', 
      desc: 'الأذكار اليومية المأثورة مع عداد رقمي ونغمات هادئة',
      icon: Heart 
    },
    { 
      id: 'focus', 
      label: 'وضع التركيز العميق (Focus Mode)', 
      desc: 'حظر المشتتات والعمل بنية خالصة دون تشتيت',
      icon: Target 
    },
    { 
      id: 'sync', 
      label: 'مزامنة الهاتف (Phone Link Hub)', 
      desc: 'ربط لحظي بين الكمبيوتر والموبايل ورنين البحث عن الهاتف',
      icon: Smartphone,
      badge: syncState.devices.android.status === 'connected' ? 'متصل 🟢' : 'غير متصل'
    },
    { 
      id: 'protection', 
      label: 'درع الحماية ومستويات التدخل', 
      desc: 'تحديد مستوى الحصر من 1 إلى 4 وحجب المواقع المريبة',
      icon: Shield,
      badge: `مستوى ${protectionLevel}`
    },
    { 
      id: 'apps', 
      label: 'المتصفح وتطبيقات السوشيال', 
      desc: 'ضبط حدود الوقت وتذكيرات الـ 10 دقائق',
      icon: Sliders 
    },
  ];

  const devSecondaryTabs: { id: ActiveTab; label: string; desc: string; icon: React.ElementType; badge?: string }[] = [
    { 
      id: 'extension', 
      label: 'الأكواد وسكربتات ويندوز وأندرويد', 
      desc: 'سكربتات الحجب وملفات التثبيت التلقائي',
      icon: Code2,
      badge: 'مطور 🛠️'
    },
    { 
      id: 'checklist', 
      label: 'خطة الإنتاج والجاهزية', 
      desc: 'متابعة مراحل منظومة رقيب ومستوى اكتمالها',
      icon: CheckSquare,
      badge: 'مطور 🛠️'
    },
  ];

  const secondaryTabs = isDevMode 
    ? [...standardSecondaryTabs, ...devSecondaryTabs] 
    : standardSecondaryTabs;

  const handleShare = () => {
    const shareUrl = window.location.origin + window.location.pathname;
    if (navigator.share) {
      navigator.share({
        title: 'تطبيق رَقِيب — الرفيق الرقمي الواعي',
        text: 'تطبيق «رَقِيب» لحفظ الوقت وغض البصر ومواقيت الصلاة وإلزامية النية.',
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <>
      {/* 1. Mobile Bottom Bar (Pinned to Screen Bottom on Small Devices) */}
      <nav 
        aria-label="التنقل السريع في الموبايل"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around"
        dir="rtl"
      >
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !isMenuOpen;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative min-w-[52px] ${
                isActive 
                  ? 'text-teal-700 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-teal-50 text-teal-700' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 absolute -bottom-0.5" />
              )}
            </button>
          );
        })}

        {/* Menu / More Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative min-w-[52px] ${
            isMenuOpen 
              ? 'text-teal-700 font-bold scale-105' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${isMenuOpen ? 'bg-teal-50 text-teal-700' : ''}`}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">المزيد</span>
          {isMenuOpen && (
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 absolute -bottom-0.5" />
          )}
        </button>
      </nav>

      {/* 2. Full Mobile Drawer / Bottom Sheet */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200" dir="rtl">
          {/* Backdrop dismiss */}
          <div className="flex-1" onClick={() => setIsMenuOpen(false)} />

          {/* Drawer Sheet Container */}
          <div className="bg-white rounded-t-3xl max-h-[85vh] w-full max-w-sm mx-auto overflow-y-auto p-5 shadow-2xl border-t border-slate-200 space-y-4 animate-in slide-in-from-bottom duration-300">
            {/* Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                  <img src={LogoImage} alt="شعار رَقِيب" className="w-6 h-6 rounded-md object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 font-['Amiri',serif]">
                    قائمة أقسام «رَقِيب»
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    الرفيق الرقمي الواعي لحفظ وقتك وقلبك
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Pills in Drawer */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {onOpenPanic && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenPanic();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-300" />
                  <span>غض البصر 🛡️</span>
                </button>
              )}

              {onOpenTawbah && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTawbah();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>خطة التوبة 🌿</span>
                </button>
              )}

              {/* Quick Istighfar Tap in Drawer */}
              {onIncrementIstighfar && (
                <button
                  onClick={() => {
                    sounds.playIstighfarClick();
                    onIncrementIstighfar();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 text-teal-800 font-bold text-xs border border-teal-200 cursor-pointer active:scale-95 col-span-2"
                >
                  <Heart className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
                  <span>استغفار سريع: أستغفر الله ({istighfarCount})</span>
                </button>
              )}

              {onInstallApp && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onInstallApp();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تثبيت التطبيق</span>
                </button>
              )}

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer active:scale-95"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Share2 className="w-3.5 h-3.5 text-teal-600" />}
                <span>{copiedLink ? 'تم نسخ الرابط' : 'مشاركة الرابط'}</span>
              </button>

              <button
                onClick={onToggleMute}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer active:scale-95"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-teal-600" />}
                <span>{isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}</span>
              </button>

              {/* Floating Companion Bar Toggle */}
              {onToggleFloatingBar && (
                <button
                  onClick={() => onToggleFloatingBar()}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs border cursor-pointer active:scale-95 transition-all ${
                    showFloatingBar
                      ? 'bg-teal-50 border-teal-300 text-teal-800'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={showFloatingBar ? 'إخفاء الشريط العائم' : 'إظهار الشريط العائم'}
                >
                  <Layers className={`w-3.5 h-3.5 ${showFloatingBar ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{showFloatingBar ? 'الشريط العائم: مفعّل 🟢' : 'الشريط العائم: معطّل ⚪'}</span>
                </button>
              )}

              {/* Developer Mode Toggle in Mobile Drawer */}
              {onToggleDevMode && (
                <button
                  onClick={onToggleDevMode}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs border cursor-pointer active:scale-95 transition-all ${
                    isDevMode 
                      ? 'bg-amber-100 border-amber-300 text-amber-900' 
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Terminal className={`w-3.5 h-3.5 ${isDevMode ? 'text-amber-700' : 'text-slate-400'}`} />
                  <span>{isDevMode ? 'وضع المطور: مفعّل 🟢' : 'وضع المطور: معطّل'}</span>
                </button>
              )}
            </div>

            {/* List of Secondary Sections */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  جميع الأقسام والأدوات
                </span>
                {isDevMode && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    وضع المطور نشط
                  </span>
                )}
              </div>

              {secondaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isCurrent = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-right cursor-pointer ${
                      isCurrent
                        ? 'bg-teal-50/80 border-teal-300 text-teal-900 shadow-2xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isCurrent ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          {tab.label}
                          {tab.badge && (
                            <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-mono font-normal">
                              {tab.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {tab.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Dismiss */}
            <div className="pt-2">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                إغلاق القائمة
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
