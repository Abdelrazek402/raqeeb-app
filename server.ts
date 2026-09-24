import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import webpush from "web-push";
import crypto from "crypto";
import { buildWindowsPeExe, buildAndroidApk, preGenerateStaticInstallers } from "./server/installerBuilder.ts";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());

// Set up VAPID for Web Push Notifications
let inMemoryVapidKeys: { publicKey: string; privateKey: string } | null = null;

function getPersistentVapidKeys() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY
    };
  }
  if (!inMemoryVapidKeys) {
    inMemoryVapidKeys = webpush.generateVAPIDKeys();
    console.log("Generated secure in-memory VAPID keypair for Web Push Notifications.");
  }
  return inMemoryVapidKeys;
}

const vapidKeys = getPersistentVapidKeys();
const VAPID_PUBLIC_KEY = vapidKeys.publicKey;
const VAPID_PRIVATE_KEY = vapidKeys.privateKey;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@raqeeb.app';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Lightweight sliding-window rate limiter
const rateLimitMap: Record<string, { count: number; resetTime: number }> = {};

function rateLimit(limitPerMinute: number = 20) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    const clientKey = `${req.path}:${ip}`;
    const now = Date.now();

    if (!rateLimitMap[clientKey] || now > rateLimitMap[clientKey].resetTime) {
      rateLimitMap[clientKey] = { count: 1, resetTime: now + 60000 };
      return next();
    }

    rateLimitMap[clientKey].count++;
    if (rateLimitMap[clientKey].count > limitPerMinute) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار دقيقة والمحاولة مجدداً."
      });
    }
    next();
  };
}

// Pairing code validator
function isValidPairingCode(code: any): boolean {
  return typeof code === 'string' && /^RQ-[A-Za-z0-9_\-]{4,32}$/.test(code.trim());
}

const pushSubscriptions: Record<string, any> = {};

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY environment variable is required");
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Persistent storage for devices, logs, phone link sessions, and push subscriptions
const DB_FILE = path.join(process.cwd(), '.raqeeb-server-store.json');

const activeDevices: Record<string, any> = {};
const blockedAttemptsLog: any[] = [];
const intentionsLog: any[] = [];
const phoneLinkSessions: Record<string, any> = {};
const athkarSchedules: Record<string, any> = {};

function loadServerStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (parsed.activeDevices) Object.assign(activeDevices, parsed.activeDevices);
      if (parsed.phoneLinkSessions) Object.assign(phoneLinkSessions, parsed.phoneLinkSessions);
      if (Array.isArray(parsed.blockedAttemptsLog)) blockedAttemptsLog.push(...parsed.blockedAttemptsLog);
      if (Array.isArray(parsed.intentionsLog)) intentionsLog.push(...parsed.intentionsLog);
      if (parsed.pushSubscriptions) Object.assign(pushSubscriptions, parsed.pushSubscriptions);
      if (parsed.athkarSchedules) Object.assign(athkarSchedules, parsed.athkarSchedules);
      console.log("Loaded persistent state from .raqeeb-server-store.json");
    }
  } catch (err) {
    console.warn("Could not load .raqeeb-server-store.json:", err);
  }
}

let saveTimer: any = null;
function persistServerStore() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const data = {
        activeDevices,
        phoneLinkSessions,
        blockedAttemptsLog: blockedAttemptsLog.slice(0, 200),
        intentionsLog: intentionsLog.slice(0, 200),
        pushSubscriptions,
        athkarSchedules
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.warn("Could not persist server store:", err);
    }
  }, 1000);
}

loadServerStore();

function checkClipboardTtl(session: any) {
  if (session.sharedClipboard && session.lastClipboardSync) {
    const elapsed = Date.now() - new Date(session.lastClipboardSync).getTime();
    if (elapsed > 5 * 60 * 1000) { // 5 minutes TTL
      session.sharedClipboard = '';
      session.clipboardSender = '';
      session.lastClipboardSync = null;
    }
  }
}

function getOrCreatePhoneLinkSession(pairingCode: string) {
  if (!phoneLinkSessions[pairingCode]) {
    phoneLinkSessions[pairingCode] = {
      isLinked: false,
      pairingCode,
      phoneBattery: null,
      isCharging: false,
      phoneModel: 'غير مقترن',
      wifiName: 'غير متصل',
      isRinging: false,
      focusShieldActive: false,
      sharedClipboard: '',
      clipboardSender: '',
      lastClipboardSync: null,
      lastHeartbeat: Date.now(),
      notifications: []
    };
  }
  checkClipboardTtl(phoneLinkSessions[pairingCode]);
  return phoneLinkSessions[pairingCode];
}

// ==========================================
// REST APIs FOR NATIVE DESKTOP (.EXE) & ANDROID (.APK) & PHONE LINK
// ==========================================

// 1. Health check & Server Info
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Raqeeb Cloud Sync Engine",
    version: "2.0.0",
    timestamp: new Date().toISOString()
  });
});

// Helper: Intelligent Spiritual & Psychological Fallback Engine
function generateSpiritualFallback(userQuery: string, context?: any): string {
  const query = (userQuery || '').toLowerCase();
  const istighfar = context?.istighfarCount ?? 0;
  const streak = context?.streakDays ?? 1;
  const quranPages = context?.quranPagesRead ?? 0;

  if (query.includes('بصر') || query.includes('شهو') || query.includes('موقع') || query.includes('حرام') || query.includes('فتن')) {
    return `يا أخي الحبيب، ثباتك وجهادك لنفسك في زمن الفتن هو من أعظم القربات عند الله. تذكر قول الله تعالى: ﴿يَعْلَمُ خَائِنَةَ الْأَعْيُنِ وَمَا تُخْفِي الصُّدُورُ﴾. 
حين تهجم عليك الشهوة، اتبع الخطوات الثلاث فوراً:
1. **تغيير البيئة فوراً**: أغلق الشاشة وابتعد عن الغرفة أو غير وضعيتك (إن كنت جالساً فقم، وإن كنت وحدك فاخرج لمكان فيه أناس).
2. **الوضوء وصلاة ركعتين**: قال رسول الله ﷺ: «إن الشيطان يجري من ابن آدم مجرى الدم»، والماء يطفئ نار الشهوة.
3. **الدعاء المأثور**: «اللهم إني أسألك الهدى والتقى والعفاف والغنى، اللهم طهر قلبي وحصن فرجي».
أنت لست ضعيفاً، بل في ميدان جهاد، ونصر ساعة يصنع فرقاً في حياتك كلها.`;
  }

  if (query.includes('تشتت') || query.includes('ني') || query.includes('تركيز') || query.includes('وقت') || query.includes('تسويف')) {
    return `السلام عليكم ورحمة الله. التشتت الرقمي غالباً ما يبدأ من غياب النية الواضحة قبل فتح الجهاز. قال النبي ﷺ: «إنما الأعمال بالنيات وإنما لكل امرئ ما نوى».
إليك خطة الدقائق الخمس لاستعادة التركيز:
1. **حدد مهمة واحدة فقط**: لا تفتح أكثر من علامة تبويب واحدة للمهمة التي تريد إنجازها.
2. **جدد النية**: قل في سرك «اللهم إني أحتسب هذا العمل لوجهك، إما في طلب علم نافع أو رزق حلال أو كف أذى».
3. **فعّل وضع التركيز (Focus Shield)** في رقيب لمدة 25 دقيقة وابدأ بالبسملة.`;
  }

  if (query.includes('ذنب') || query.includes('انتكاس') || query.includes('وقعت') || query.includes('ضعف') || query.includes('توب')) {
    return `أبشر برحمة الله ومغفرته، ولا تدع الشيطان يقنعك بأنك منافق أو أنك لا أمل فيك! 
قال الله سبحانه: ﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا﴾.
الفرق بين المؤمن وغيره ليس في عدم الوقوع، بل في سرعة الإنابة. افعل الآن:
1. قل بقلب حاضر: «أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه».
2. أتبع السيئة بالحسنة: اقرأ صفحة من القرآن الآن، أو تصدق بشيء، فإن الحسنات يذهبن السيئات.
3. تذكر: الله يفرح بتوبة عبده أشد من فرح رجل ضلت دابته في أرض مهلكة ثم وجدها. قم وجدد عهدك الآن.`;
  }

  if (query.includes('صلا') || query.includes('فجر') || query.includes('كسل') || query.includes('خشوع')) {
    return `الصلاة هي الحبل الممدود بينك وبين السماء، فإذا انقطع الحبل اضطربت الحياة كلها.
قال رسول الله ﷺ: «أرحنا بها يا بلال».
إذا أحسست بثقل أو كسل:
- قم فتوضأ وضوءاً حسناً وسبغ الماء.
- استحضر أنك ستقف أمام ملك الملوك الذي بيده سعادتك ورزقك وتوفيقك.
- لا تؤخر الفريضة عن وقتها، فإن تأخيرها يجر وراءه ثقلاً وتشتتاً طوال اليوم.`;
  }

  if (query.includes('قرآن') || query.includes('ورد') || query.includes('ختم')) {
    return `القرآن هو ربيع القلب ونور الصدور. 
أنت مسجل في رقيب قراءة ${quranPages} صفحة اليوم${istighfar > 0 ? ` مع ${istighfar} استغفاراً` : ''}.
كل حرف تقرأه بعشر حسنات، وهو جلاء لهمومك وشفاء لما في صدرك. 
اجعل لك وقتاً ثابتاً لا تتنازل عنه لوِردك (أفضل الأوقات بعد الفجر أو قبل النوم)، ولا تقرأ بتعجل بل بتدبر تسكن به نفسك.`;
  }

  return `حياك الله وبارك فيك وسدد خطاك. أنا معك في كل خطوة لتقوية يقينك وحفظ بصرك ووقتك.
${istighfar > 0 ? `ما شاء الله، إجمالي استغفارك اليوم ${istighfar} مرة، ` : ''}${streak > 1 ? `وأنت في اليوم ${streak} من الثبات بفضل الله. ` : ''}
استعن بالله ولا تعجز، وأي خاطر أو وسواس يمر بك، اذكر الله فوراً وتذكر: ﴿وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا وَإِنَّ اللَّهَ لَمَعَ الْمُحْسِنِينَ﴾.
كيف أستطيع إعانتك الآن؟`;
}

// AI Companion Chat Endpoint with Rate Limiting and Strict Input Validation
app.post("/api/chat", rateLimit(15), async (req, res) => {
  const { messages, userContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid payload: messages array is required" });
  }

  // Bound length of messages and payload size to prevent DoS/memory abuse
  const boundedMessages = messages.slice(-20).map((m: any) => ({
    sender: m?.sender === 'user' ? 'user' : 'model',
    text: String(m?.text || '').slice(0, 1500)
  }));

  const lastUserMessage = boundedMessages.length > 0 
    ? [...boundedMessages].reverse().find((m: any) => m.sender === 'user')?.text || '' 
    : '';

  if (!lastUserMessage.trim()) {
    return res.status(400).json({ error: "Empty user message" });
  }

  try {
    const ai = getAI();
    
    // Create prompt with deep spiritual context
    let systemInstruction = "أنت رفيق رقمي إسلامي اسمك «رَقِيب». دورك تقديم توجيهات روحية وإيمانية عميقة، عون على غض البصر، حفظ الوقت، التركيز، وتجديد النية. أسلوبك رقيق، ناصح كأخ مشفق، تستشهد بالقرآن الكريم والسنة النبوية الصحيحة وعلم النفس الإيماني، وتبتعد عن الجفاء.";
    
    if (userContext && typeof userContext === 'object') {
      systemInstruction += `\nبيانات المستخدم الروحية الحالية:
- أيام الثبات المتواصلة: ${Math.max(0, Number(userContext.streakDays) || 1)} يوماً.
- الاستغفار اليومي: ${Math.max(0, Number(userContext.istighfarCount) || 0)} مرة.
- صفحات القرآن المقروءة: ${Math.max(0, Number(userContext.quranPagesRead) || 0)} صفحة.
- محاولات التشتت التي صُدت: ${Math.max(0, Number(userContext.blockedAttemptsCount) || 0)}.\n- أنواع المشتتات التي يميل لها مؤخراً: ${userContext.distractionTypes || 'لا يوجد'}.
- الصلوات المؤكدة: ${Math.min(5, Math.max(0, Number(userContext.confirmedPrayersCount) || 0))} من 5.
راعِ هذه الإحصائيات في تشجيعه برفق ومخاطبته بحسب حالته.`;
    }

    // Map messages to Gemini format
    const contents = boundedMessages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    let responseText: string | undefined;

    // Primary attempt: gemini-3.8-flash
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });
      responseText = response.text;
    } catch (primaryErr: any) {
      // If overloaded (503 / UNAVAILABLE), gracefully fallback to gemini-3.1-flash-lite without polluting console
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
          }
        });
        responseText = fallbackResponse.text;
      } catch {
        // If external API is completely unavailable, use local spiritual engine
        responseText = generateSpiritualFallback(lastUserMessage, userContext);
      }
    }

    res.json({ success: true, text: responseText || generateSpiritualFallback(lastUserMessage, userContext) });
  } catch (error) {
    const fallbackReply = generateSpiritualFallback(lastUserMessage, userContext);
    res.json({ success: true, text: fallbackReply, isFallback: true });
  }
});

// 2. Blocklist API: Native desktop & mobile apps fetch the real-time block rules categorized
app.get("/api/blocklist", (req, res) => {
  res.json({
    success: true,
    categories: {
      adult: [
        "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
        "youporn.com", "chaturbate.com", "onlyfans.com", "stripchat.com", "livejasmin.com",
        "cam4.com", "bonga.com"
      ],
      gambling: [
        "bet365.com", "1xbet.com", "stake.com", "pokerstars.com", "bwin.com"
      ],
      distraction: [
        "tiktok.com", "instagram.com/reels", "youtube.com/shorts"
      ]
    },
    domains: [
      "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
      "youporn.com", "chaturbate.com", "onlyfans.com", "stripchat.com", "livejasmin.com",
      "cam4.com", "bonga.com"
    ],
    keywords: [
      "porn", "xxx", "sex", "nude", "erotic", "hentai", "إباحي", "جنس", "سكس", "مترجم", "شيميل", "قمار", "مراهنات"
    ],
    dnsServers: {
      cleanBrowsingAdult: "adult-filter-dns.cleanbrowsing.org",
      cleanBrowsingIp1: "185.228.168.168",
      cleanBrowsingIp2: "185.228.169.168",
      adguardFamily: "family.adguard-dns.com",
      adguardFamilyIp: "94.140.14.15"
    },
    cleanDns: "adult-filter-dns.cleanbrowsing.org",
    lastUpdated: new Date().toISOString()
  });
});

// 3. Device Registration & Pairing API
app.post("/api/device/register", (req, res) => {
  const { deviceType, deviceName, pairingCode } = req.body;
  const code = pairingCode || `RQ-${crypto.randomInt(100000, 1000000)}`;
  
  activeDevices[code] = {
    pairingCode: code,
    deviceType: deviceType || 'unknown',
    deviceName: deviceName || 'New Device',
    status: 'connected',
    lastSync: new Date().toISOString(),
    stats: {
      totalTimeMinutes: 0,
      socialTimeMinutes: 0,
      browserTimeMinutes: 0,
      blockedAttemptsCount: 0
    }
  };
  persistServerStore();

  res.json({
    success: true,
    pairingCode: code,
    device: activeDevices[code]
  });
});

// 4. Device Telemetry & Sync API (Used by Windows .exe background daemon and Android .apk background worker)
app.post("/api/device/sync", (req, res) => {
  const { pairingCode, stats, deviceType, intention, blockedAttempt } = req.body;
  
  if (pairingCode && activeDevices[pairingCode]) {
    activeDevices[pairingCode].lastSync = new Date().toISOString();
    if (stats) {
      activeDevices[pairingCode].stats = {
        ...activeDevices[pairingCode].stats,
        ...stats
      };
    }
  }

  if (intention) {
    intentionsLog.unshift({
      ...intention,
      id: `int-${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    if (intentionsLog.length > 100) intentionsLog.pop();
  }

  if (blockedAttempt) {
    blockedAttemptsLog.unshift({
      ...blockedAttempt,
      id: `blk-${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    if (blockedAttemptsLog.length > 100) blockedAttemptsLog.pop();
  }

  persistServerStore();

  res.json({
    success: true,
    status: "synced",
    serverTime: new Date().toISOString(),
    device: pairingCode ? activeDevices[pairingCode] : null
  });
});

// 5. Get Device Status by Pairing Code
app.get("/api/device/status/:pairingCode", (req, res) => {
  const { pairingCode } = req.params;
  const device = activeDevices[pairingCode];
  if (device) {
    res.json({ success: true, exists: true, device });
  } else {
    res.json({ success: true, exists: false, message: "Device not found or not yet paired" });
  }
});

// 6. Log Intention API
app.post("/api/intention", (req, res) => {
  const { appName, reason, durationMinutes } = req.body;
  const entry = {
    id: `int-${Date.now()}`,
    appName: appName || 'متصفح الإنترنت',
    reason: reason || 'تصفح عام',
    durationMinutes: durationMinutes || 15,
    timestamp: new Date().toISOString()
  };
  intentionsLog.unshift(entry);
  persistServerStore();
  res.json({ success: true, entry });
});

// 7. Log Blocked Attempt API
app.post("/api/blocked-attempt", (req, res) => {
  const { url, reason, deviceType } = req.body;
  const entry = {
    id: `blk-${Date.now()}`,
    url: url || 'موقع محظور',
    reason: reason || 'محتوى غير لائق',
    deviceType: deviceType || 'windows',
    timestamp: new Date().toISOString()
  };
  blockedAttemptsLog.unshift(entry);
  persistServerStore();
  res.json({ success: true, entry });
});

// ==========================================
// 8. PHONE LINK REAL-TIME APIS (MICROSOFT PHONE LINK STYLE)
// ==========================================

// Get Phone Link live state
app.get("/api/phonelink/state/:pairingCode", (req, res) => {
  const { pairingCode } = req.params;
  if (!isValidPairingCode(pairingCode)) {
    return res.status(400).json({ error: "Invalid or missing pairingCode format (expected RQ-XXXXXX)" });
  }
  const session = getOrCreatePhoneLinkSession(pairingCode);
  const secondsAgo = Math.floor((Date.now() - session.lastHeartbeat) / 1000);
  
  res.json({
    success: true,
    state: {
      ...session,
      lastPingSecondsAgo: secondsAgo
    }
  });
});

// Dispatch Phone Link Commands (Ring Phone, Focus Lock Shield, Send Clipboard, Prayer Sync)
app.post("/api/phonelink/command", rateLimit(40), (req, res) => {
  const { pairingCode, command, payload } = req.body;
  if (!isValidPairingCode(pairingCode)) {
    return res.status(400).json({ error: "Invalid or missing pairingCode (expected RQ-XXXXXX)" });
  }
  const session = getOrCreatePhoneLinkSession(pairingCode);

  session.lastHeartbeat = Date.now();

  if (command === 'ring_phone') {
    session.isRinging = true;
    session.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: '🔔 رنين البحث عن الهاتف (Find My Phone)',
      body: 'تم تشغيل جرس الرنين من حاسوب الويندوز للعثور على مكان الهاتف.',
      source: 'windows',
      type: 'ring',
      timestamp: new Date().toISOString(),
      read: false
    });
  } else if (command === 'stop_ring') {
    session.isRinging = false;
  } else if (command === 'toggle_focus_shield') {
    session.focusShieldActive = payload?.active !== undefined ? payload.active : !session.focusShieldActive;
    session.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: session.focusShieldActive ? '🛡️ درع التركيز المشدد مُفعّل' : '🔓 تم إيقاف درع التركيز',
      body: session.focusShieldActive 
        ? 'تم قفل تطبيقات التواصل والسوشيال ميديا على الهاتف من الحاسوب.' 
        : 'تمت استعادة الوضع الطبيعي للتطبيقات.',
      source: 'windows',
      type: 'focus',
      timestamp: new Date().toISOString(),
      read: false
    });
  } else if (command === 'send_clipboard') {
    session.sharedClipboard = String(payload?.text || '').slice(0, 5000);
    session.clipboardSender = payload?.sender || 'windows';
    session.lastClipboardSync = new Date().toISOString();
    session.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: '📋 تم نسخ نص في الحافظة المشتركة',
      body: `نص جديد من ${payload?.sender === 'windows' ? 'الحاسوب' : 'الهاتف'}: "${session.sharedClipboard.slice(0, 35)}..."`,
      source: payload?.sender || 'windows',
      type: 'clipboard',
      timestamp: new Date().toISOString(),
      read: false
    });
  } else if (command === 'confirm_prayer') {
    session.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: '🕌 تم تأكيد الصلاة بمزامنة سحابية',
      body: `تم تأكيد أداء صلاة (${payload?.prayerName || 'الفريضة'}) بنجاح وتحديث كافة الأجهزة.`,
      source: payload?.sender || 'android',
      type: 'prayer',
      timestamp: new Date().toISOString(),
      read: false
    });
  } else if (command === 'push_notification') {
    session.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: payload?.title || 'إشعار جديد',
      body: payload?.body || '',
      source: payload?.source || 'android',
      type: payload?.type || 'reminder',
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  // Keep max 20 notifications
  if (session.notifications.length > 20) {
    session.notifications = session.notifications.slice(0, 20);
  }
  persistServerStore();

  res.json({
    success: true,
    message: `Command ${command} processed`,
    state: session
  });
});

// Update Phone Link Telemetry / Heartbeat from Android device
app.post("/api/phonelink/heartbeat", rateLimit(60), (req, res) => {
  const { pairingCode, phoneBattery, isCharging, wifiName, phoneModel } = req.body;
  if (!isValidPairingCode(pairingCode)) {
    return res.status(400).json({ error: "Invalid or missing pairingCode (expected RQ-XXXXXX)" });
  }
  const session = getOrCreatePhoneLinkSession(pairingCode);

  session.lastHeartbeat = Date.now();
  if (phoneBattery !== undefined) session.phoneBattery = Number(phoneBattery);
  if (isCharging !== undefined) session.isCharging = Boolean(isCharging);
  if (wifiName) session.wifiName = String(wifiName).slice(0, 60);
  if (phoneModel) session.phoneModel = String(phoneModel).slice(0, 60);
  persistServerStore();

  res.json({
    success: true,
    state: session
  });
});

// Clear a specific notification
app.post("/api/phonelink/notifications/dismiss", (req, res) => {
  const { pairingCode, notifId } = req.body;
  if (!isValidPairingCode(pairingCode)) {
    return res.status(400).json({ error: "Invalid or missing pairingCode (expected RQ-XXXXXX)" });
  }
  const session = getOrCreatePhoneLinkSession(pairingCode);
  session.notifications = session.notifications.filter((n: any) => n.id !== notifId);
  persistServerStore();
  res.json({ success: true, notifications: session.notifications });
});

// ==========================================
// 9. WEB PUSH NOTIFICATIONS
// ==========================================
app.get("/api/push/public-key", (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post("/api/push/subscribe", (req, res) => {
  const { pairingCode, subscription } = req.body;
  if (!pairingCode) return res.status(400).json({ error: "No pairing code" });
  pushSubscriptions[pairingCode] = subscription;
  persistServerStore();
  res.json({ success: true });
});

app.post("/api/push/send", async (req, res) => {
  const { pairingCode, title, body } = req.body;
  const sub = pushSubscriptions[pairingCode];
  if (!sub) return res.status(404).json({ error: "Not subscribed" });
  
  try {
    await webpush.sendNotification(sub, JSON.stringify({ title, body }));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Athkar Daily Reminder Settings for Background Delivery
app.post("/api/push/athkar-settings", (req, res) => {
  const { pairingCode, subscription, settings, timezone } = req.body;
  if (!pairingCode) return res.status(400).json({ error: "Missing pairingCode" });

  const currentSub = subscription || pushSubscriptions[pairingCode] || athkarSchedules[pairingCode]?.subscription;
  if (subscription) {
    pushSubscriptions[pairingCode] = subscription;
  }

  athkarSchedules[pairingCode] = {
    pairingCode,
    subscription: currentSub || null,
    morningEnabled: settings?.morningEnabled !== false,
    morningTime: settings?.morningTime || "06:30",
    eveningEnabled: settings?.eveningEnabled !== false,
    eveningTime: settings?.eveningTime || "17:30",
    soundEnabled: settings?.soundEnabled !== false,
    vibrateEnabled: settings?.vibrateEnabled !== false,
    spiritualQuoteEnabled: settings?.spiritualQuoteEnabled !== false,
    timezone: timezone || "Asia/Riyadh",
    lastMorningAlertDate: athkarSchedules[pairingCode]?.lastMorningAlertDate,
    lastEveningAlertDate: athkarSchedules[pairingCode]?.lastEveningAlertDate,
    updatedAt: new Date().toISOString()
  };

  persistServerStore();
  console.log(`[Raqeeb] Updated background Athkar schedule for ${pairingCode}: Morning=${athkarSchedules[pairingCode].morningTime}, Evening=${athkarSchedules[pairingCode].eveningTime}`);

  res.json({
    success: true,
    message: "تم حفظ وتفعيل جدول تنبيهات الأذكار في الخلفية بنجاح",
    schedule: athkarSchedules[pairingCode]
  });
});

// Get Athkar Schedule Status
app.get("/api/push/athkar-status/:pairingCode", (req, res) => {
  const { pairingCode } = req.params;
  const schedule = athkarSchedules[pairingCode] || null;
  const hasSub = !!(pushSubscriptions[pairingCode] || schedule?.subscription);

  res.json({
    success: true,
    schedule,
    hasSubscription: hasSub
  });
});

// Test Real Athkar Background Notification
app.post("/api/push/test-athkar", async (req, res) => {
  const { pairingCode, type } = req.body;
  if (!pairingCode) return res.status(400).json({ error: "Missing pairingCode" });

  const sub = pushSubscriptions[pairingCode] || athkarSchedules[pairingCode]?.subscription;
  if (!sub) {
    return res.status(404).json({
      success: false,
      error: "لم يتم تفعيل إشعارات الدفع على هذا المتصفح بعد. يرجى الضغط على زر تفعيل الإشعارات أولاً."
    });
  }

  const isMorning = type === 'morning';
  const title = isMorning ? "☀️ تجربة تنبيه: حان وقت أذكار الصباح" : "🌙 تجربة تنبيه: حان وقت أذكار المساء";
  const body = isMorning 
    ? "«أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ» .. هكذا سيصلك التنبيه يومياً حتى لو كان المتصفح والتطبيق مغلقاً."
    : "«أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ» .. هكذا سيصلك التنبيه يومياً حتى لو كان المتصفح والتطبيق مغلقاً.";

  try {
    await webpush.sendNotification(sub, JSON.stringify({
      title,
      body,
      icon: "/pwa-192x192.png",
      tag: `raqeeb-athkar-test-${Date.now()}`,
      data: {
        url: `/?tab=adhkar&category=${isMorning ? 'morning' : 'evening'}`,
        category: isMorning ? 'morning' : 'evening',
        timestamp: Date.now()
      }
    }));

    res.json({
      success: true,
      message: `تم إرسال إشعار تجريبي لـ (${isMorning ? 'أذكار الصباح' : 'أذكار المساء'}) إلى جهازك بنجاح.`
    });
  } catch (err: any) {
    console.warn("Failed to send test athkar push:", err);
    res.status(500).json({
      success: false,
      error: `تعذر إرسال الإشعار: ${err?.message || 'خطأ غير متوقع'}`
    });
  }
});

// -------------------------------------------------------------
// BACKGROUND ATHKAR SCHEDULER DAEMON (RUNS INDEPENDENTLY OF BROWSER)
// -------------------------------------------------------------
const MORNING_ATHKAR_QUOTES = [
  "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ.. رطّب لسانك الآن وحصّن يومك بحفظ الله.",
  "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا.. ابدأ نهارك بذكر الله وتوكل عليه.",
  "سيد الاستغفار: «اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ..»",
  "«اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ..» حصنك المنيع اليوم.",
  "«حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ عَلَيهِ تَوَكَّلتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ»"
];

const EVENING_ATHKAR_QUOTES = [
  "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ.. حصّن نفسك وأهلك واختم نهارك بذكر الله.",
  "«اللَّهُمَّ عَالِمَ الغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالأَرْضِ..» حصن نفسك من وساوس الليل.",
  "«أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ» لم يضرك شيء حتى تصبح.",
  "«بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ»",
  "«يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ»"
];

setInterval(async () => {
  const nowUtc = new Date();

  for (const pairingCode of Object.keys(athkarSchedules)) {
    const sched = athkarSchedules[pairingCode];
    if (!sched || (!sched.morningEnabled && !sched.eveningEnabled)) continue;

    const sub = sched.subscription || pushSubscriptions[pairingCode];
    if (!sub) continue;

    let localTimeStr = "";
    let localDateStr = "";

    try {
      const tz = sched.timezone || "Asia/Riyadh";
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour12: false
      });
      const parts = formatter.formatToParts(nowUtc);
      const hour = parts.find(p => p.type === 'hour')?.value || "00";
      const min = parts.find(p => p.type === 'minute')?.value || "00";
      const day = parts.find(p => p.type === 'day')?.value || "01";
      const month = parts.find(p => p.type === 'month')?.value || "01";
      const year = parts.find(p => p.type === 'year')?.value || "2026";
      localTimeStr = `${hour}:${min}`;
      localDateStr = `${year}-${month}-${day}`;
    } catch {
      localTimeStr = `${String(nowUtc.getUTCHours()).padStart(2, '0')}:${String(nowUtc.getUTCMinutes()).padStart(2, '0')}`;
      localDateStr = nowUtc.toISOString().split('T')[0];
    }

    // 1. Morning Athkar Delivery Check
    if (sched.morningEnabled && sched.morningTime === localTimeStr && sched.lastMorningAlertDate !== localDateStr) {
      sched.lastMorningAlertDate = localDateStr;
      persistServerStore();

      const quote = MORNING_ATHKAR_QUOTES[Math.floor(Math.random() * MORNING_ATHKAR_QUOTES.length)];
      try {
        await webpush.sendNotification(sub, JSON.stringify({
          title: "☀️ حان وقت أذكار الصباح",
          body: quote,
          icon: "/pwa-192x192.png",
          tag: `raqeeb-athkar-morning-${localDateStr}`,
          data: {
            url: "/?tab=adhkar&category=morning",
            category: "morning",
            timestamp: Date.now()
          }
        }));
        console.log(`[Raqeeb Scheduler] Morning Athkar Push sent successfully to ${pairingCode}`);
      } catch (err: any) {
        console.warn(`[Raqeeb Scheduler] Push failed for ${pairingCode}:`, err?.message);
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          delete pushSubscriptions[pairingCode];
          if (athkarSchedules[pairingCode]) athkarSchedules[pairingCode].subscription = null;
          persistServerStore();
        }
      }
    }

    // 2. Evening Athkar Delivery Check
    if (sched.eveningEnabled && sched.eveningTime === localTimeStr && sched.lastEveningAlertDate !== localDateStr) {
      sched.lastEveningAlertDate = localDateStr;
      persistServerStore();

      const quote = EVENING_ATHKAR_QUOTES[Math.floor(Math.random() * EVENING_ATHKAR_QUOTES.length)];
      try {
        await webpush.sendNotification(sub, JSON.stringify({
          title: "🌙 حان وقت أذكار المساء",
          body: quote,
          icon: "/pwa-192x192.png",
          tag: `raqeeb-athkar-evening-${localDateStr}`,
          data: {
            url: "/?tab=adhkar&category=evening",
            category: "evening",
            timestamp: Date.now()
          }
        }));
        console.log(`[Raqeeb Scheduler] Evening Athkar Push sent successfully to ${pairingCode}`);
      } catch (err: any) {
        console.warn(`[Raqeeb Scheduler] Push failed for ${pairingCode}:`, err?.message);
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          delete pushSubscriptions[pairingCode];
          if (athkarSchedules[pairingCode]) athkarSchedules[pairingCode].subscription = null;
          persistServerStore();
        }
      }
    }
  }
}, 30000); // Check every 30 seconds

// ==========================================
// 10. REAL SYSTEM INSTALLER DOWNLOADS (.EXE & .APK)
// ==========================================
app.get("/api/download/windows-exe", (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'raqeeb.app';
  const appUrl = `${protocol}://${host}`;
  const exeBuffer = buildWindowsPeExe(appUrl);
  
  res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
  res.setHeader('Content-Disposition', 'attachment; filename="Raqeeb-Setup.exe"');
  res.setHeader('Content-Length', exeBuffer.length);
  res.send(exeBuffer);
});

app.get("/api/download/android-apk", async (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'raqeeb.app';
  const appUrl = `${protocol}://${host}`;
  const apkBuffer = await buildAndroidApk(appUrl);
  
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="Raqeeb.apk"');
  res.setHeader('Content-Length', apkBuffer.length);
  res.send(apkBuffer);
});

// ==========================================
// VITE MIDDLEWARE & STATIC ASSETS SERVING
// ==========================================
async function startServer() {
  // Pre-generate static installers for direct downloading
  await preGenerateStaticInstallers();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Raqeeb Full-Stack Cloud Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
