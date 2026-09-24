import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Loader2, 
  ShieldCheck, 
  HeartHandshake,
  RotateCcw,
  Copy,
  Check,
  Compass,
  Volume2,
  BookOpen,
  Zap,
  Heart
} from 'lucide-react';
import { DailyStats, PrayerInfo, BlockedAttempt } from '../types';

interface AiCompanionViewProps {
  stats?: DailyStats;
  prayers?: PrayerInfo[];
  blockedAttempts?: BlockedAttempt[];
}

const QUICK_PROMPTS = [
  { text: 'كيف أغض بصري وأثبت أمام الشهوة العاجلة؟', icon: '🛡️' },
  { text: 'أشعر بتشتت وتسويف، كيف أجدد نيتي الآن؟', icon: '⚡' },
  { text: 'ضعفت نفسي وتعثرت، كيف أبدأ توبة نصوحاً صحيحة؟', icon: '🤲' },
  { text: 'نصيحة عملية للمداومة على وِرد القرآن الكريم', icon: '📖' },
  { text: 'كيف أستحضر الخشوع وأداوم على صلاة الفجر؟', icon: '🕌' },
];

export const AiCompanionView: React.FC<AiCompanionViewProps> = ({ stats, prayers, blockedAttempts = [] }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'السلام عليكم ورحمة الله وبركاته. أنا رفيقك الرقمي «رَقِيب»، هنا لأعينك على حفظ بصرك ووقتك، تجديد نيتك، وتثبيت قلبك أمام الفتن والتشتت. ما الذي يشغل بالك اليوم؟',
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;
    
    const newMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend
    };
    
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    if (!customText) setInput('');
    setIsTyping(true);

    const categories = { 'تواصل اجتماعي': 0, 'فيديو وترفيه': 0, 'ألعاب': 0, 'محتوى ضار': 0, 'أخرى': 0 };
    blockedAttempts.forEach(log => {
      const url = log.url.toLowerCase();
      if (url.includes('facebook') || url.includes('instagram') || url.includes('tiktok') || url.includes('twitter')) categories['تواصل اجتماعي']++;
      else if (url.includes('youtube') || url.includes('netflix') || url.includes('twitch')) categories['فيديو وترفيه']++;
      else if (url.includes('game') || url.includes('roblox') || url.includes('pubg')) categories['ألعاب']++;
      else if (log.reason.includes('إباحي') || url.includes('por') || url.includes('x')) categories['محتوى ضار']++;
      else categories['أخرى']++;
    });
    
    const userContext = {
      streakDays: stats?.streakDays ?? 1,
      istighfarCount: stats?.istighfarCount ?? 0,
      quranPagesRead: stats?.quranPagesRead ?? 0,
      blockedAttemptsCount: blockedAttempts.length,
      distractionTypes: Object.entries(categories).filter(([_, v]) => v > 0).map(([k, v]) => `${k}: ${v} مرة`).join('، '),
      confirmedPrayersCount: prayers?.filter(p => p.confirmed).length ?? 0
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: updatedMessages,
          userContext
        }),
      });
      
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text || 'بارك الله فيك، استعن بالله ولا تعجز وتذكر أن الله يبسط يده بالليل والنهار.'
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'استعن بالله واذكر ربك، وأنا هنا معك دوماً لشد أزرك وتثبيت فؤادك أمام ما تشعر به.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateDailyDua = () => {
    const streak = stats?.streakDays || 1;
    const istighfar = stats?.istighfarCount || 0;
    const text = `أنا بفضل الله في اليوم الـ ${streak} من الثبات، واستغفرت الله ${istighfar} مرة اليوم. اكتب لي دعاءً وتوجيهاً إيمانياً مركزاً يشد أزري ويجدد عزيمتي.`;
    handleSend(text);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: 'تم تجديد المحادثة. كيف أستطيع إعانتك الآن يا أخي الكريم؟',
      }
    ]);
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[550px] flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300 max-w-5xl mx-auto" dir="rtl">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white p-4 md:p-5 flex items-center justify-between z-10 relative border-b border-teal-700/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/10 border border-white/20 text-teal-200 rounded-2xl flex items-center justify-center relative shadow-xs shrink-0">
            <Bot className="w-6 h-6 text-teal-300" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-['Amiri',serif]">الرفيق الرقمي الواعي (AI Companion)</h2>
              <span className="text-[10px] bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 px-2 py-0.5 rounded-md font-bold">
                متصل ومباشر 🟢
              </span>
            </div>
            <p className="text-xs text-teal-200/90 flex items-center gap-2 mt-0.5">
              <span>أيام الثبات: <strong className="text-amber-300 font-extrabold">{stats?.streakDays || 1}</strong> يوم</span>
              <span>•</span>
              <span>استغفار اليوم: <strong className="text-amber-300 font-extrabold">{stats?.istighfarCount || 0}</strong></span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateDailyDua}
            disabled={isTyping}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer hidden sm:flex"
            title="توليد دعاء وتوجيه روحي يناسب إنجازك اليوم"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>دعاء الثبات اليومي</span>
          </button>

          <button
            onClick={clearChat}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="بدء محادثة جديدة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">محادثة جديدة</span>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/60">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-2xl ${isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
            >
              <div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                  isUser ? 'bg-slate-800 text-white' : 'bg-teal-700 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="group relative space-y-1">
                <div 
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-2xs select-text whitespace-pre-wrap ${
                    isUser 
                      ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-sm' 
                      : 'bg-teal-900 text-white border border-teal-800 rounded-tr-sm font-sans'
                  }`}
                >
                  {msg.text}
                </div>

                {!isUser && (
                  <div className="flex items-center gap-2 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs cursor-pointer transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>نسخ الإجابة</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 max-w-2xl ml-auto">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-teal-700 text-white shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-teal-900 text-white border border-teal-800 rounded-tr-sm flex items-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
              <span>الرفيق الرقمي يستحضر النصيحة والتوجيه المبارك...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Bar */}
      <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-500 shrink-0">أسئلة شائعة:</span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt.text)}
            disabled={isTyping}
            className="shrink-0 px-3 py-1.5 bg-white hover:bg-teal-50 hover:text-teal-900 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{prompt.icon}</span>
            <span>{prompt.text}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 md:p-4 bg-white border-t border-slate-200">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2 max-w-4xl mx-auto"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب استشارتك أو ما يشغل بالك... (مثال: أشعر بفتور، كيف أستعيد خشوعي؟)"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-sm text-slate-900 placeholder:text-slate-400"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs shrink-0 cursor-pointer"
            title="إرسال الرسالة"
          >
            <Send className="w-5 h-5 rtl:-scale-x-100" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default AiCompanionView;
