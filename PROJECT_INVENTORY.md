# PROJECT INVENTORY — مشروع رَقِيب (Raqeeb)

تاريخ الفحص: 2026-09-08
الإصدار الحالي: 2.0.0
البيئة الأساسية: React 19 + TypeScript + Vite + Tailwind CSS v4 + Express Backend (Node.js) + Firebase Firestore.

---

| الملف (File) | الهدف والمسؤولية (Purpose) | الاعتماديات (Dependencies) | الحالة (Status) | ملاحظات تقنية (Notes) |
| :--- | :--- | :--- | :--- | :--- |
| `package.json` | تعريف الحزم وإعدادات البناء وأوامر التشغيل | npm / node | GREEN | يدعم Vite و esbuild لبناء خادم Express منفصل و singlefile |
| `tsconfig.json` | ضبط مترجم TypeScript وخيارات فحص الأنواع | typescript | GREEN | Target ES2020، فحص صارم للأنواع |
| `vite.config.ts` | ضبط Vite و Tailwind v4 و VitePWA | vite, tailwindcss, vite-plugin-pwa | GREEN | تمكين PWA مع Service Worker و webmanifest |
| `server.ts` | خادم Express للـ API والمزامنة و Gemini والـ Web Push | express, @google/genai, web-push, vite | GREEN | يدعم تشغيل الـ APIs في الخلفية، وسيط الذكاء الاصطناعي، ومزامنة Phone Link |
| `firestore.rules` | قواعد أمان قاعدة بيانات Firestore السحابية | firebase firestore | GREEN | حماية جلسات الاقتران ومنع التعديل غير المصرح به |
| `firebase-blueprint.json` | المخطط الهيكلي لمجموعات Firestore | firebase firestore | GREEN | توثيق مجموعة pairingSessions |
| `firebase-applet-config.json`| إعدادات تعريف مشروع Firebase | firebase client | GREEN | يحتوي على معرف المشروع والمفاتيح العامة |
| `metadata.json` | تعريف التطبيق والصلاحيات لمنصة AI Studio | AI Studio runtime | GREEN | اسم التطبيق، الوصف، وصلاحية Geolocation |
| `index.html` | نقطة دخول تطبيق الويب وتضمين الخطوط (Cairo, Amiri) | Browser / Google Fonts | GREEN | يحتوي على وسوم meta كاملة باللغة العربية |
| `src/main.tsx` | بدء تشغيل React في عنصر root | react, react-dom | GREEN | تركيب App.tsx |
| `src/App.tsx` | المكون الرئيسي للتطبيق، إدارة التبويبات والمودالات والمؤقتات | react, lucide-react, hooks, components | GREEN | يدير حالة التطبيق اليومية، مؤقت الـ 10 دقائق، ومؤقت الصلاة |
| `src/types.ts` | تعريف واجهات وأنواع TypeScript لكامل التطبيق | TypeScript | GREEN | يحتوي نماذج DailyStats, PrayerTime, Adhkar, DeviceState وغيرها |
| `src/index.css` | استيراد وتخصيص أنماط Tailwind CSS | tailwindcss | GREEN | يستخدم `@import "tailwindcss";` وفقاً للمعيار الجديد |
| `src/components/Navbar.tsx` | شريط التنقل العلوي وتحديد التبويب النشط | lucide-react | GREEN | يحتوي على أزرار الوصول السريع وتنبيه الحماية |
| `src/components/DashboardView.tsx` | لوحة التحكم الرئيسية وملخص اليوم والمؤشرات | lucide-react, types | GREEN | تم دمج الورد القرآني، ملخص الاستغفار، ومؤشرات الأجهزة |
| `src/components/PrayerTimesView.tsx` | واجهة مواقيت الصلاة والعد التنازلي وتأكيد الصلوات | prayerTimes utils, storage | GREEN | حساب فلكي محلي حسب إحداثيات GPS أو المدينة الافتراضية |
| `src/components/PrayerAlertModal.tsx` | المودال المنبثق عند دخول وقت الصلاة مع الأذان | audio utils | GREEN | تشغيل صوت الأذان، وتأكيد أداء الفريضة، ودعاء بعد الأذان |
| `src/components/QuranReaderView.tsx` | قارئ القرآن ومتابعة صفحات الورد اليومي | lucide-react, audio utils, types | GREEN | متابعة الصفحات وربطها بإحصائيات اليوم، مع مشغل التلاوة |
| `src/components/AdhkarView.tsx` | مكتبة أذكار حصن المسلم مع عداد تسبيح تفاعلي | data/adhkar.ts | GREEN | أذكار الصباح، المساء، بعد الصلاة، والنوم مع الاهتزاز والعد |
| `src/components/FocusModeView.tsx` | جلسات التركيز الموقوتة (Pomodoro / Focus Shield) | react, lucide-react | GREEN | بدء مؤقت التركيز وتفعيل الحظر المؤقت للتشتت |
| `src/components/AdultBlockScreen.tsx` | شاشة الحجب المهدئة عند محاولة دخول موقع غير لائق | audio utils | GREEN | رسالة وعظية هادئة وزر استماع آية قرآنية بديلة |
| `src/components/ProtectionSettingsView.tsx` | إعدادات درع الحماية، الكلمات المفتاحية، وقوائم الحظر | utils/blocklist | GREEN | تفعيل/تعطيل الحماية، إدارة النطاقات المحظورة، وإعدادات DNS |
| `src/components/PhoneLinkCenter.tsx` | مركز ربط الهاتف (Android) بالحاسوب (Windows) عبر الرمز | utils/cloudSync, useFirebaseSync | GREEN | مزامنة الحافظة، حالة البطارية، رنين الهاتف، وتأكيد الصلاة المشترك |
| `src/components/DeviceSyncHubView.tsx` | إدارة الأجهزة المتصلة وتحميل أدوات النظام | lucide-react, utils | GREEN | عرض الأجهزة المسجلة وتصدير سكربتات التثبيت |
| `src/components/AiCompanionView.tsx` | الرفيق الروحي للدردشة التوجيهية وتجديد النية | server API (/api/chat) | GREEN | يعتمد على Gemini 2.5 Flash عبر السيرفر بأمان تام |
| `src/components/IntentionOverlay.tsx` | نافذة تجديد النية التلقائية عند فتح التطبيقات أو المتصفح | react, types | GREEN | إدخال نية العمل وتحديد المدة المستهدفة |
| `src/components/PeriodicReminderModal.tsx` | نافذة تذكير الـ 10 دقائق الدورية بالذكر والاستغفار | audio utils, data/adhkar | GREEN | مؤقت حقيقي يظهر كل 10 دقائق لتنبيه المستخدم بالاستغفار |
| `src/components/MonitoredAppsView.tsx` | إدارة التطبيقات والمواقع المراقبة وحدود الاستخدام | react, types | GREEN | ضبط حدود دقائق الاستخدام لكل تطبيق وتصنيفه |
| `src/components/ChecklistView.tsx` | قائمة المهام اليومية والصلوات والأوراد | react, types | GREEN | تتبع الطاعات والمهام اليومية مع شريط التقدم |
| `src/components/SimulatorView.tsx` | محاكي اختبار سلوك التنبيهات والحجب والاقتران | components | GREEN | يتيح للمطور أو المستخدم فحص الشاشات المنبثقة مباشرة |
| `src/components/ExtensionExportView.tsx`| صفحة تحميل وتصدير إضافات المتصفح (Chrome/Edge/Firefox)| utils/downloadHelper | GREEN | تصدير حزم ملحقات المتصفح مع ملفات manifest.json و rules |
| `src/components/InstallGuideModal.tsx` | دليل تثبيت التطبيق الحقيقي كـ PWA وعلى المنصات | react, usePWAInstall | GREEN | إرشادات التثبيت الأصلية لـ PWA ويندوز وأندرويد و iOS |
| `src/components/PWAInstallButton.tsx` | زر تثبيت الـ PWA التفاعلي في شريط التنقل | usePWAInstall | GREEN | يستمع لحدث beforeinstallprompt ويطلق التثبيت |
| `src/data/adhkar.ts` | نصوص أذكار حصن المسلم الموثقة مع الفضل والتكرار | data source | GREEN | نصوص صحيحة ومدققة مع تخريج الفضل وعدد المرات |
| `src/hooks/useFirebaseSync.ts` | Hook المزامنة السحابية عبر Firestore Realtime Listener | firebase/firestore | GREEN | اشتراك لحظي onSnapshot لتبادل البيانات بين الأجهزة |
| `src/hooks/useCloudSync.ts` | Hook المزامنة عبر REST API للخادم المحلي | fetch /api/device | GREEN | مزامنة الحالات الدورية للأجهزة غير المعتمدة على Firebase |
| `src/hooks/usePWAInstall.ts` | Hook التحكم بتثبيت تطبيق الويب التقدمي (PWA) | Browser PWA API | GREEN | كشف حالة التثبيت وجاهزية المتصفح |
| `src/utils/audio.ts` | محرك التنبيهات الصوتية والأذان والترددات النقية | Web Audio API / HTML5 Audio | GREEN | تشغيل صوت أذان حقيقي، تلاوة قصيرة، وأصوات نقر هادئة |
| `src/utils/prayerTimes.ts` | خوارزمية حساب مواقيت الصلاة الفلكية بدقة | Astronomical Math | GREEN | حساب أوقات الفجر والشروق والظهر والعصر والمغرب والعشاء |
| `src/utils/blocklist.ts` | قائمة النطاقات والكلمات المفتاحية المحظورة وخوادم DNS | local rules | GREEN | تصنيف النطاقات وخوادم CleanBrowsing / Family DNS |
| `src/utils/cloudSync.ts` | وظائف التواصل مع REST endpoints للأجهزة | fetch | GREEN | إرسال النية، حجب المواقع، وإرسال أوامر Phone Link |
| `src/utils/firebase.ts` | تهيئة عميل Firebase و Firestore | firebase/app, firebase/firestore | GREEN | تهيئة آمنة باستخدام التكوين المعياري |
| `src/utils/storage.ts` | مستودع التخزين المحلي الآمن مع الترحيل والافتراضيات | localStorage / Safe JSON | GREEN | منع فقدان البيانات بعد التحديث، تهيئة إحصائيات اليوم |
| `src/utils/downloadHelper.ts` | إنشاء وتحميل ملفات السكربتات والإضافات للتحميل المحلي | Blob / URL.createObjectURL | GREEN | إنشاء ملفات bat, vbs, manifest وتنزيلها بأمان |
| `تثبيت_درع_رقيب_على_ويندوز.bat` | سكربت دفعي لتطبيق حماية DNS وملف hosts على ويندوز | Windows CMD / PowerShell | GREEN | يعدل إعدادات DNS لبطاقات الشبكة ويضيف نطاقات الحظر لـ hosts |
| `إلغاء_تثبيت_رقيب_واستعادة_الإعدادات.bat` | استعادة إعدادات ويندوز وحذف تعديلات رقيب بالكامل | Windows CMD | GREEN | يعيد تعيين DNS إلى DHCP ويحذف أسطر رقيب من hosts |
| `تجربة_تنبيه_رقيب_الآن.bat` | تجربة فورية لظهور تنبيه منبثق أصلي على ويندوز | PowerShell Forms | GREEN | يعرض MessageBox ويندوز للتأكد من عمل التنبيهات |
| `خادم_تنبيهات_رقيب_الصامت.vbs` | برنامج خلفية صامت لويندوز يطلق تنبيه كل 10 دقائق | VBScript / Windows Script Host | GREEN | حلقة تكرارية تعمل في الخلفية بدون نافذة سوداء لتذكير الذكر |
| `فحص_وتأكيد_الحجب_على_جهازك.bat` | أداة فحص سريعة للتأكد من فاعلية الحجب على ويندوز | Windows CMD | GREEN | يفحص ملف hosts وإعدادات الـ DNS المحلية |
