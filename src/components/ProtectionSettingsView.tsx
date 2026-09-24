import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Globe, 
  Info,
  Server,
  Users,
  Mail,
  Send,
  Layers,
  Sparkles,
  Laptop
} from 'lucide-react';
import { ProtectionLevel } from '../types';
import { DEFAULT_BLOCKED_DOMAINS, RECOMMENDED_FAMILY_DNS } from '../utils/blocklist';

interface ProtectionSettingsViewProps {
  currentLevel: ProtectionLevel;
  onSetLevel: (level: ProtectionLevel) => void;
  customBlockedDomains: string[];
  onAddCustomDomain: (domain: string) => void;
  onRemoveCustomDomain: (domain: string) => void;
  isDevMode?: boolean;
  onToggleDevMode?: () => void;
  showFloatingBar?: boolean;
  onToggleFloatingBar?: (enabled?: boolean) => void;
  onOpenFloatingGuide?: () => void;
}

export const ProtectionSettingsView: React.FC<ProtectionSettingsViewProps> = ({
  currentLevel,
  onSetLevel,
  customBlockedDomains,
  onAddCustomDomain,
  onRemoveCustomDomain,
  isDevMode = false,
  onToggleDevMode,
  showFloatingBar = true,
  onToggleFloatingBar,
  onOpenFloatingGuide
}) => {
  const [newDomainInput, setNewDomainInput] = useState('');
  const [copiedDns, setCopiedDns] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState(() => localStorage.getItem('raqeeb_partner_email') || '');
  const [isEditingPartner, setIsEditingPartner] = useState(false);

  const savePartnerEmail = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('raqeeb_partner_email', partnerEmail);
    setIsEditingPartner(false);
  };

  const handleSendWeeklyReport = () => {
    if (!partnerEmail) return;
    const subject = encodeURIComponent('تقرير الثبات الأسبوعي - رقيب');
    const body = encodeURIComponent(`أخي/والدي الحبيب،

أشارك معك تقريري الأسبوعي من تطبيق "رقيب" من باب التواصي بالحق:
- أيام الثبات المتصلة: ${localStorage.getItem('raqeeb_stats') ? JSON.parse(localStorage.getItem('raqeeb_stats') as string).streakDays || 1 : 1} أيام
- تم بحمد الله الحفاظ على ورد الصلوات والأذكار هذا الأسبوع.
- نسبة الانضباط ممتازة بفضل الله.

أسألك الدعاء لي بالثبات.
`);
    window.open(`mailto:${partnerEmail}?subject=${subject}&body=${body}`);
  };

  const levelsInfo = [
    {
      level: 1 as ProtectionLevel,
      title: 'المستوى 1 — تذكير فقط',
      subtitle: 'تنبيهات واستغفار بدون أي حجب للمواقع',
      description: 'مناسب لمن يريد رقيباً نفسياً فقط؛ يظهر سؤال النية عند فتح التطبيق وتذكير الـ 10 دقائق دون منع أي موقع.',
      icon: Info,
      color: 'border-blue-200 text-blue-800 bg-blue-50'
    },
    {
      level: 2 as ProtectionLevel,
      title: 'المستوى 2 — حماية (الموصى به)',
      subtitle: 'حجب المواقع الإباحية + تذكيرات مستمرة',
      description: 'منع كامل لجميع المواقع الإباحية والكلمات المريبة + شاشة «مش خايف من ربك؟» + سؤال النية وتذكيرات الاستغفار.',
      icon: ShieldCheck,
      color: 'border-teal-200 text-teal-800 bg-teal-50'
    },
    {
      level: 3 as ProtectionLevel,
      title: 'المستوى 3 — انضباط',
      subtitle: 'حجب المواقع + حدود للسوشيال + وضع التركيز',
      description: 'حجب الإباحية + تحديد سقف زمني لتطبيقات السوشيال ميديا وإلزامية تقييد التشتت أثناء العمل والدراسة.',
      icon: ShieldAlert,
      color: 'border-amber-200 text-amber-800 bg-amber-50'
    },
    {
      level: 4 as ProtectionLevel,
      title: 'المستوى 4 — شديد وعازم',
      subtitle: 'حماية صارمة يصعب تعطيلها أثناء الجلسات',
      description: 'منع إغلاق التذكيرات إلا بعد كتابة الذكر كاملاً، وإغلاق صارم للسوشيال في أوقات الصلاة والتركيز.',
      icon: Lock,
      color: 'border-rose-200 text-rose-800 bg-rose-50'
    }
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;
    onAddCustomDomain(newDomainInput.trim().toLowerCase());
    setNewDomainInput('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDns(id);
    setTimeout(() => setCopiedDns(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-['Amiri',serif] text-slate-900">
              إعدادات ومستويات الحماية (Protection Engine)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              تحكم في درجة تدخل التطبيق، إعدادات حجب النطاقات، وضبط الحماية على مستوى الشبكة والنظام.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Levels Selector (Directly from User Prompt) */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          اختيار مستوى التدخل والحماية:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levelsInfo.map((info) => {
            const Icon = info.icon;
            const isSelected = currentLevel === info.level;
            return (
              <div
                key={info.level}
                id={`protection-level-card-${info.level}`}
                onClick={() => onSetLevel(info.level)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-teal-50/40 border-teal-500 shadow-sm ring-1 ring-teal-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${info.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {info.title}
                    </span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    {info.subtitle}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {info.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium">{isSelected ? 'المستوى المفعل حالياً' : 'اضغط للتفعيل'}</span>
                  <span className="font-mono text-slate-400">Level {info.level}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network & Family DNS Recommendations */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" />
              حماية على مستوى الشبكة والنظام (Family DNS)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تضمن منع المواقع الإباحية حتى لو استعمل المتصفح الخفي (Incognito) أو حاول الالتفاف عبر Redirect:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RECOMMENDED_FAMILY_DNS.map((dns) => (
            <div key={dns.name} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-teal-700 block mb-1">
                  {dns.nameAr}
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                  {dns.description}
                </p>
              </div>

              <div className="space-y-2 bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Primary:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-800 font-semibold">{dns.primaryIPv4}</span>
                    <button
                      id={`copy-dns-primary-${dns.name}`}
                      onClick={() => copyToClipboard(dns.primaryIPv4, `${dns.name}-p`)}
                      className="p-1 hover:text-teal-600 text-slate-400 transition-colors"
                      title="نسخ عنوان الـ DNS"
                    >
                      {copiedDns === `${dns.name}-p` ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Secondary:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-800 font-semibold">{dns.secondaryIPv4}</span>
                    <button
                      id={`copy-dns-secondary-${dns.name}`}
                      onClick={() => copyToClipboard(dns.secondaryIPv4, `${dns.name}-s`)}
                      className="p-1 hover:text-teal-600 text-slate-400 transition-colors"
                      title="نسخ عنوان الـ DNS الثاني"
                    >
                      {copiedDns === `${dns.name}-s` ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accountability Partner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              الرفيق الصالح والمساءلة المشتركة
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ﴿وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ﴾ أدخل بريد شخص تثق به لإرسال تقرير إنجاز أسبوعي مختصر يحفزك.
            </p>
          </div>
        </div>

        {isEditingPartner || !partnerEmail ? (
          <form onSubmit={savePartnerEmail} className="flex gap-2">
            <div className="flex-1 relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="بريد الرفيق الصالح (مثال: father@email.com)"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              حفظ
            </button>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-200/50 rounded-full flex items-center justify-center text-teal-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-900">الرفيق المتابع:</p>
                <p className="text-sm font-mono text-teal-700">{partnerEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleSendWeeklyReport}
                className="flex-1 sm:flex-none px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                إرسال تقرير الآن
              </button>
              <button
                onClick={() => setIsEditingPartner(true)}
                className="px-3 py-2 bg-white border border-teal-200 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-colors"
              >
                تعديل
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Blocked Domains Manager */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-rose-500" />
              إدارة النطاقات المحظورة (Blacklist)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              مدمج افتراضياً أكثر من {DEFAULT_BLOCKED_DOMAINS.length} نطاقاً إباحياً معروفاً، ويمكنك إضافة نطاقاتك الخاصة:
            </p>
          </div>
        </div>

        {/* Add custom domain form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            id="add-custom-domain-input"
            type="text"
            placeholder="أضف نطاقاً لحظره (مثال: example.com)..."
            value={newDomainInput}
            onChange={(e) => setNewDomainInput(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-2xs"
          />
          <button
            id="add-custom-domain-btn"
            type="submit"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            إضافة للحظر
          </button>
        </form>

        {/* Custom domains chips */}
        {customBlockedDomains.length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-semibold text-slate-700 block mb-2">النطاقات المضافة يدوياً:</span>
            <div className="flex flex-wrap gap-2">
              {customBlockedDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-mono font-medium"
                >
                  {domain}
                  <button
                    id={`remove-custom-domain-${domain}`}
                    onClick={() => onRemoveCustomDomain(domain)}
                    className="hover:text-rose-900 transition-colors"
                    title="حذف النطاق من القائمة المخصصة"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>يتم فحص الرابط ومسار البحث والكلمات الدلالية قبل تحميل أي صفحة.</span>
          <span className="font-mono text-slate-600 font-medium">Total Blocklist: {DEFAULT_BLOCKED_DOMAINS.length + customBlockedDomains.length} rules</span>
        </div>
      </div>

      {/* Floating Companion Bar & OS Widget Settings */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                الشريط العائم السريع (Floating Screen Companion)
              </span>
              {showFloatingBar ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                  مفعّل 🟢
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                  معطّل ⚪
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              شريط عائم شبه شفاف يظهر أسفل الشاشة على الكمبيوتر والموبايل والتابلت للوصول الفوري لزر غض البصر، مواقيت الصلاة، وعداد الاستغفار. يمكنك إظهاره أو إخفاؤه حسب رغبتك.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenFloatingGuide && (
              <button
                onClick={onOpenFloatingGuide}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="طريقة تشغيل الودجت العائم على شاشة الويندوز والأندرويد خارج البرنامج"
              >
                <Laptop className="w-3.5 h-3.5 text-teal-600" />
                <span>ودجت الأجهزة 💻📱</span>
              </button>
            )}

            {onToggleFloatingBar && (
              <button
                onClick={() => onToggleFloatingBar()}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                  showFloatingBar 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                <span>{showFloatingBar ? 'إخفاء الشريط العائم' : 'تفعيل الشريط العائم'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Developer Mode Toggle Card */}
      {onToggleDevMode && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 flex items-center gap-2">
                  🛠️ وضع المطور وأدوات الإنتاج (Developer Mode)
                </span>
                {isDevMode && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    مفعّل 🟢
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                إظهار قسمي «الأكواد وسكريبتات ويندوز وأندرويد» و«خطة الإنتاج والجاهزية» في القائمة الجانبية وشريط التنقل للمطورين والمهندسين.
              </p>
            </div>

            <button
              id="toggle-developer-mode-btn"
              onClick={onToggleDevMode}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs shrink-0 ${
                isDevMode 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20' 
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              <span>{isDevMode ? 'تعطيل وضع المطور 🛑' : 'تفعيل وضع المطور 🛠️'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
