import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Globe, 
  Check, 
  ShieldCheck, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { MonitoredApp } from '../types';

interface MonitoredAppsViewProps {
  apps: MonitoredApp[];
  onToggleApp: (appId: string) => void;
  onAddApp: (name: string, category: 'browser' | 'social' | 'entertainment') => void;
}

export const MonitoredAppsView: React.FC<MonitoredAppsViewProps> = ({
  apps,
  onToggleApp,
  onAddApp
}) => {
  const [newAppName, setNewAppName] = useState('');
  const [newAppCategory, setNewAppCategory] = useState<'browser' | 'social' | 'entertainment'>('social');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    onAddApp(newAppName.trim(), newAppCategory);
    setNewAppName('');
  };

  const browserApps = apps.filter(a => a.category === 'browser');
  const socialApps = apps.filter(a => a.category === 'social');
  const entertainmentApps = apps.filter(a => a.category === 'entertainment');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-['Amiri',serif] text-slate-900">
              إدارة المتصفح وتطبيقات السوشيال ميديا
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              قائمة المحاسبة الذاتية وتتبع الوقت والتذكيرات. التطبيقات المفعلة يتم تتبع استهلاك الوقت عليها وعرض تنبيهات الـ 10 دقائق وتوجيهك لغض البصر والطاعة.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-2.5 text-xs text-teal-900">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>ملاحظة التتبع والمحاسبة:</strong> هذه القائمة تعمل كنظام محاسبة وتنبيهات لضبط الوقت على الويب وPWA. للحظر الجبري التام على مستوى نظام الأندرويد، يرجى تفعيل خدمة سهولة الوصول (Accessibility Service) من حزمة تثبيت الأندرويد الخاصة بـ «رَقِيب».
          </p>
        </div>
      </div>

      {/* Add New App Form */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-600" />
          إضافة تطبيق أو موقع جديد للمراقبة (ديناميكياً)
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            id="new-monitored-app-name"
            type="text"
            placeholder="اسم التطبيق أو النطاق (مثال: Threads أو Pinterest أو Discord)..."
            value={newAppName}
            onChange={(e) => setNewAppName(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
          />

          <label htmlFor="new-monitored-app-category" className="sr-only">تصنيف التطبيق</label>
          <select
            id="new-monitored-app-category"
            value={newAppCategory}
            onChange={(e) => setNewAppCategory(e.target.value as 'browser' | 'social' | 'entertainment')}
            className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="social">تواصل اجتماعي (Social)</option>
            <option value="browser">متصفح ويب (Browser)</option>
            <option value="entertainment">ترفيه وفيديو (Entertainment)</option>
          </select>

          <button
            id="submit-new-app-btn"
            type="submit"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            إضافة للقائمة
          </button>
        </form>
      </div>

      {/* Categorized Apps Grid */}
      <div className="space-y-6">
        {/* Browsers */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-600" />
              متصفحات الويب (المراقبة وحجب الإباحية)
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {browserApps.filter(a => a.enabled).length} مفعّلة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {browserApps.map((app) => (
              <div
                key={app.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  app.enabled
                    ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                }`}
              >
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {app.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {app.nameEn}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-600" />
                    استخدام اليوم: {app.timeSpentMinutes} دقيقة
                  </div>
                </div>

                <button
                  id={`toggle-app-${app.id}`}
                  onClick={() => onToggleApp(app.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    app.enabled ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                  title={app.enabled ? 'إيقاف المراقبة' : 'تفعيل المراقبة'}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      app.enabled ? 'translate-x-0' : '-translate-x-6'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media Apps */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              تطبيقات السوشيال ميديا المشمولة بتنبيهات الـ 10 دقائق
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {socialApps.filter(a => a.enabled).length} مفعّلة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {socialApps.map((app) => (
              <div
                key={app.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  app.enabled
                    ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                }`}
              >
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {app.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {app.nameEn}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    استخدام اليوم: {app.timeSpentMinutes} دقيقة
                  </div>
                </div>

                <button
                  id={`toggle-app-${app.id}`}
                  onClick={() => onToggleApp(app.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    app.enabled ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                  title={app.enabled ? 'إيقاف المراقبة' : 'تفعيل المراقبة'}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      app.enabled ? 'translate-x-0' : '-translate-x-6'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Entertainment & Video Apps */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              منصات الفيديو والترفيه (يوتيوب وغيرها)
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {entertainmentApps.filter(a => a.enabled).length} مفعّلة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {entertainmentApps.map((app) => (
              <div
                key={app.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  app.enabled
                    ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                }`}
              >
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {app.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {app.nameEn}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-red-500" />
                    استخدام اليوم: {app.timeSpentMinutes} دقيقة
                  </div>
                </div>

                <button
                  id={`toggle-app-${app.id}`}
                  onClick={() => onToggleApp(app.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    app.enabled ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                  title={app.enabled ? 'إيقاف المراقبة' : 'تفعيل المراقبة'}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      app.enabled ? 'translate-x-0' : '-translate-x-6'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
