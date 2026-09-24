import React from 'react';
import { 
  Laptop, 
  Volume2, 
  VolumeX, 
  Flame,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import { ActiveTab, ProtectionLevel, PrayerInfo, DeviceSyncHubState, DailyStats } from '../types';
import { getNextPrayer } from '../utils/prayerTimes';
import LogoImage from '../assets/images/raqeeb_logo_1788773748138.jpg';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  protectionLevel: ProtectionLevel;
  prayers: PrayerInfo[];
  syncState: DeviceSyncHubState;
  stats: DailyStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onRecordDailyWird?: () => void;
  onQuickSimulatePrayer?: () => void;
  onOpenNextPrayerInfo?: () => void;
  onInstallApp?: () => void;
  onOpenPanic?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  protectionLevel,
  prayers,
  syncState,
  stats,
  isMuted,
  onToggleMute,
  onRecordDailyWird,
  onQuickSimulatePrayer,
  onOpenNextPrayerInfo,
  onInstallApp,
  onOpenPanic,
  onToggleMobileMenu
}) => {
  const nextPrayerData = getNextPrayer(prayers);
  const hoursLeft = Math.floor(nextPrayerData.minutesLeft / 60);
  const minsLeft = nextPrayerData.minutesLeft % 60;

  const winTime = syncState.devices.windows.stats.totalTimeMinutes;
  const androidTime = syncState.devices.android.stats.totalTimeMinutes;
  const totalDeviceMinutes = winTime + androidTime;
  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? h + 'س ' : ''}${m}د`;
  };

  const levelBadge = {
    1: { label: 'مستوى 1: تذكير', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    2: { label: 'مستوى 2: حماية', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    3: { label: 'مستوى 3: انضباط', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    4: { label: 'مستوى 4: شديد', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  }[protectionLevel];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {/* Top brand & live status bar */}
        <div className="flex items-center justify-between lg:justify-center w-full h-16 gap-4">
          {/* Brand Logo & Tagline - Only visible on Mobile since Desktop has Sidebar */}
          <div className="flex lg:hidden items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-xs border border-teal-500 shrink-0">
              <img src={LogoImage} alt="شعار رقيب" className="w-6 h-6 rounded-md object-cover shrink-0" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold font-['Amiri',serif] text-xl text-slate-900 tracking-wide whitespace-nowrap">
                  رَقِيب
                </span>
              </div>
            </div>
          </div>

          {/* Quick info badges & Sound controls */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 overflow-x-auto scrollbar-hide pb-1 -mb-1 px-1 max-w-full">
            {/* Screen Time Counters */}
            <div className="hidden min-[400px]:flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 bg-slate-50 rounded-xl border border-slate-200 shrink-0" title="وقت الاستخدام المسجل للأجهزة">
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-teal-700 font-bold px-1.5 sm:px-2 border-l border-slate-200">
                <Laptop className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="font-mono">{winTime}د</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-blue-700 font-bold px-1.5 sm:px-2 border-l border-slate-200">
                <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="font-mono">{androidTime}د</span>
              </div>
              <div className="hidden lg:flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-700 font-bold px-2">
                <span>المجموع: </span>
                <span className="font-mono">{formatHoursMins(totalDeviceMinutes)}</span>
              </div>
            </div>

            {/* Device Sync Pill */}
            {(() => {
              const isAndroidConnected = syncState.devices.android.status === 'connected' && 
                                        Boolean(syncState.phoneLink?.isLinked) && 
                                        syncState.phoneLink?.phoneModel !== 'غير مقترن';
              return (
                <button
                  onClick={() => setActiveTab('sync')}
                  className={`hidden md:flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    isAndroidConnected
                      ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                  }`}
                  title={isAndroidConnected ? "الحاسوب والموبايل متزامنان - انقر للانتقال لمركز الربط" : "اضغط لربط الموبايل عبر رمز الاقتران أو QR Code"}
                >
                  <span className="relative flex h-2 w-2">
                    {isAndroidConnected && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isAndroidConnected ? 'bg-teal-600' : 'bg-slate-400'}`}></span>
                  </span>
                  <span>{isAndroidConnected ? 'متزامن' : 'ربط الموبايل'}</span>
                </button>
              );
            })()}

            {/* Next Prayer countdown pill - Display & Schedule Modal only */}
            <div 
              onClick={() => onOpenNextPrayerInfo?.()}
              className="cursor-pointer group flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200 transition-all text-xs"
              title="انقر لعرض تفاصيل الصلاة القادمة وسجل مواقيت الأسبوع وفضل الصلاة"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
              </span>
              <span className="text-slate-500 hidden md:inline">القادمة:</span>
              <span className="font-bold text-teal-700 group-hover:text-teal-800 text-[11px] sm:text-xs">
                {nextPrayerData.next.nameAr}
              </span>
              <span className="text-slate-600 text-[10px] sm:text-[11px] font-mono">
                {hoursLeft > 0 ? `${hoursLeft}س و ` : ''}{minsLeft}د
              </span>
            </div>

            {/* Current Level */}
            <span className={`hidden lg:inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-xl text-xs font-semibold border ${levelBadge.color}`}>
              <Flame className="w-3.5 h-3.5" />
              {levelBadge.label}
            </span>

            {/* Panic Button (Quick Rescue) */}
            {onOpenPanic && (
              <button
                id="navbar-panic-btn"
                onClick={onOpenPanic}
                className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer animate-pulse"
                title="زر الاستغاثة اللحظي لغض البصر ودرء الشهوة"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">غض البصر</span>
                <span className="sm:hidden">غض البصر</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              id="toggle-sound-btn"
              onClick={onToggleMute}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition-colors"
              title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-teal-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
