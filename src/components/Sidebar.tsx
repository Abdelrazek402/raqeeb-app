import React, { useMemo } from 'react';
import { 
  LayoutDashboard,
  Activity, 
  BookOpen, 
  Heart, 
  Bot, 
  Smartphone, 
  Clock, 
  Target, 
  Shield, 
  Sliders, 
  Code2, 
  CheckSquare,
  Sparkles,
  Download,
  Terminal,
  LogOut
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../contexts/AuthContext';
import LogoImage from '../assets/images/raqeeb_logo_1788773748138.jpg';
import { getTodaySpiritualQuote } from '../data/dailyQuotes';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onInstallApp?: () => void;
  isDevMode?: boolean;
  onToggleDevMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onInstallApp,
  isDevMode = false,
  onToggleDevMode
}) => {
  const { logout } = useAuth();
  const dailyQuote = useMemo(() => getTodaySpiritualQuote(), []);

  const baseTabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'analytics', label: 'التقارير والإحصائيات', icon: Activity },
    { id: 'companion', label: 'الرفيق الرقمي (AI)', icon: Bot },
    { id: 'quran', label: 'الورد القرآني', icon: BookOpen },
    { id: 'adhkar', label: 'الأذكار اليومية', icon: Heart },
    { id: 'sync', label: 'مزامنة الهاتف', icon: Smartphone },
    { id: 'focus', label: 'وضع التركيز', icon: Target },
    { id: 'prayers', label: 'مواقيت الصلاة', icon: Clock },
    { id: 'protection', label: 'درع الحماية', icon: Shield },
    { id: 'apps', label: 'المتصفح والتطبيقات', icon: Sliders },
  ];

  const devTabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'extension', label: 'تطبيق الويندوز والأكواد 🛠️', icon: Code2 },
    { id: 'checklist', label: 'خطة الإنتاج والجاهزية 🛠️', icon: CheckSquare },
  ];

  const tabs = isDevMode ? [...baseTabs, ...devTabs] : baseTabs;

  return (
    <aside className="hidden lg:flex flex-col group relative w-20 h-screen sticky top-0 shrink-0 z-50">
      <div className="absolute top-0 right-0 h-full w-20 group-hover:w-64 bg-white border-l border-slate-200 transition-all duration-300 ease-in-out z-50 flex flex-col overflow-hidden shadow-none group-hover:shadow-2xl">
      <div className="flex flex-col px-[20px] py-4 border-b border-slate-100 whitespace-nowrap overflow-hidden transition-all duration-300">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex flex-col justify-center items-center shadow-xs border border-teal-500 shrink-0 transition-all duration-300 relative">
            <img src={LogoImage} alt="شعار رقيب" className="w-6 h-6 rounded-md object-cover shrink-0" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 mr-3.5 transition-opacity duration-300 delay-100 flex flex-col justify-center">
            <h2 className="font-extrabold font-['Amiri',serif] text-xl text-slate-900 tracking-wide leading-tight">
              رَقِيب
            </h2>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200 font-bold whitespace-nowrap mt-0.5">
              الرفيق الرقمي الواعي
            </span>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 mt-2.5 pt-2 border-t border-slate-100/70 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200/80 text-[10px] font-bold text-teal-800 mb-1">
            <Sparkles className="w-2.5 h-2.5 text-teal-600" />
            <span>جِد قلبك ✨</span>
          </div>
          <p className="font-['Amiri',serif] text-[12.5px] text-teal-900 font-semibold leading-relaxed" title={dailyQuote.source}>
            {dailyQuote.quote}
          </p>
          <span className="text-[9.5px] text-slate-600 font-medium mt-0.5">
            {dailyQuote.source}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 group-hover:px-4 pb-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative w-full flex items-center justify-center group-hover:justify-start py-2 px-2 group-hover:px-3 group-hover:py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap overflow-hidden ${isActive ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 group-hover:bg-transparent'}`}
            >
              <div className="w-9 h-9 flex items-center justify-center shrink-0 rounded-lg group-hover:bg-transparent transition-all">
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-100' : 'text-slate-400'}`} />
              </div>
              <span className="opacity-0 group-hover:opacity-100 mr-0 group-hover:mr-3 max-w-0 group-hover:max-w-xs transition-all duration-300 ease-in-out">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-1">
        {onToggleDevMode && (
          <button
            onClick={onToggleDevMode}
            className={`relative w-full flex items-center justify-center group-hover:justify-start py-2 px-2 group-hover:px-3 group-hover:py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap overflow-hidden ${
              isDevMode 
                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title={isDevMode ? 'إيقاف وضع المطور' : 'تفعيل وضع المطور لإظهار الأكواد وخطة الإنتاج'}
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-lg group-hover:bg-transparent transition-all">
              <Terminal className={`w-4 h-4 ${isDevMode ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
            <span className="opacity-0 group-hover:opacity-100 mr-0 group-hover:mr-2 max-w-0 group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold">
              {isDevMode ? 'وضع المطور (مفعّل 🟢)' : 'وضع المطور (معطّل)'}
            </span>
          </button>
        )}

        {onInstallApp && (
          <button
            onClick={onInstallApp}
            className="relative w-full flex items-center justify-center group-hover:justify-start py-2 px-2 group-hover:px-3 group-hover:py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap overflow-hidden text-teal-700 bg-teal-50/70 hover:bg-teal-100"
            title="تثبيت تطبيق رَقِيب على جهازك"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-lg group-hover:bg-transparent transition-all">
              <Download className="w-4 h-4 text-teal-600" />
            </div>
            <span className="opacity-0 group-hover:opacity-100 mr-0 group-hover:mr-2 max-w-0 group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold">
              تثبيت التطبيق
            </span>
          </button>
        )}

        <button
          onClick={logout}
          className="relative w-full flex items-center justify-center group-hover:justify-start py-2 px-2 group-hover:px-3 group-hover:py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap overflow-hidden text-rose-600 hover:bg-rose-50"
          title="تسجيل الخروج"
        >
          <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-lg group-hover:bg-transparent transition-all">
            <LogOut className="w-4 h-4 text-rose-500" />
          </div>
          <span className="opacity-0 group-hover:opacity-100 mr-0 group-hover:mr-2 max-w-0 group-hover:max-w-xs transition-all duration-300 ease-in-out">
            خروج
          </span>
        </button>
      </div>
      </div>
    </aside>
  );
};
