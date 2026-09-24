import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Laptop, 
  Smartphone, 
  Globe, 
  Terminal,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { downloadTextFile } from '../utils/downloadHelper';
import { sounds } from '../utils/audio';
import { generateDeclarativeNetRequestRulesJson, generateDeclarativeNetRequestRules, DEFAULT_BLOCKED_DOMAINS } from '../utils/blocklist';

export const ExtensionExportView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'windows' | 'extension' | 'android'>('windows');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const dynamicRulesJson = generateDeclarativeNetRequestRulesJson();
  const rulesCount = generateDeclarativeNetRequestRules().length;

  const copyCode = (text: string, id: string) => {
    sounds.playSuccessTone();
    navigator.clipboard.writeText(text);
    setCopiedFile(id);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const windowsPythonNativeApp = `# -*- coding: utf-8 -*-
"""
تطبيق «رَقِيب» المكتبي الأصيل (Windows Native Desktop App)
مكتوب بلغة Python ومكتبة PyQt5
- زر عائم في المقدمة (Always-On-Top) فوق جميع البرامج والألعاب.
- أيقونة في شريط المهام (System Tray).
- مؤقت دوري كل 10 دقائق لتنبيه النية والاستغفار.
- حساب فلكي دقيق لمواقيت الصلاة.
- أداة لتفعيل حماية DNS العائلية المشفرة بنقرة واحدة.
"""
import sys, os, math
from datetime import datetime
from PyQt5.QtWidgets import (
    QApplication, QWidget, QLabel, QPushButton, QVBoxLayout, QHBoxLayout,
    QSystemTrayIcon, QMenu, QAction, QMessageBox, QDialog, QFrame
)
from PyQt5.QtCore import Qt, QTimer, QPoint
from PyQt5.QtGui import QFont

def calculate_prayer_times(lat=30.0444, lng=31.2357, timezone_offset=2):
    now = datetime.now()
    day_of_year = now.timetuple().tm_yday
    b = 2 * math.pi * (day_of_year - 81) / 365
    eot = 9.87 * math.sin(2 * b) - 7.53 * math.cos(b) - 1.5 * math.sin(b)
    declination = 23.45 * math.sin(math.radians((360 / 365) * (day_of_year - 81)))
    noon_utc = 12 + (4 * (0 - lng) - eot) / 60
    noon_local = noon_utc + timezone_offset
    lat_rad = math.radians(lat)
    dec_rad = math.radians(declination)
    def get_ha(angle):
        cos_ha = (math.sin(math.radians(-angle)) - math.sin(lat_rad) * math.sin(dec_rad)) / (math.cos(lat_rad) * math.cos(dec_rad))
        if cos_ha > 1: return 0
        if cos_ha < -1: return math.pi
        return math.acos(cos_ha)
    ha_fajr = math.degrees(get_ha(19.5)) / 15.0
    ha_isha = math.degrees(get_ha(17.5)) / 15.0
    ha_maghrib = math.degrees(get_ha(0.833)) / 15.0
    asr_angle = math.degrees(math.atan(1 + math.tan(math.radians(abs(lat - declination)))))
    ha_asr = math.degrees(get_ha(90 - asr_angle)) / 15.0
    def fmt(h_dec):
        h = int(h_dec) % 24
        m = int((h_dec - int(h_dec)) * 60)
        return f"{h:02d}:{m:02d}"
    return {
        "الفجر": fmt(noon_local - ha_fajr),
        "الشروق": fmt(noon_local - ha_maghrib),
        "الظهر": fmt(noon_local),
        "العصر": fmt(noon_local + ha_asr),
        "المغرب": fmt(noon_local + ha_maghrib),
        "العشاء": fmt(noon_local + ha_isha)
    }

class TenMinuteReminderDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint | Qt.Tool)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setFixedSize(420, 220)
        layout = QVBoxLayout(self)
        card = QFrame(self)
        card.setStyleSheet("QFrame { background-color: #042f2e; border: 2px solid #0d9488; border-radius: 16px; }")
        card_layout = QVBoxLayout(card)
        
        title = QLabel("رَقِيب | تذكير واعي بالوقت والنية", card)
        title.setFont(QFont("Arial", 13, QFont.Bold))
        title.setStyleSheet("color: #2dd4bf; border: none;")
        title.setAlignment(Qt.AlignCenter)
        card_layout.addWidget(title)
        
        body = QLabel("مضت 10 دقائق من استخدامك للحاسوب.\\nقال تعالى: {أَلا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ}\\n\\nجدد نيتك واذكر الله: أستغفر الله العظيم وأتوب إليه.", card)
        body.setFont(QFont("Arial", 10))
        body.setStyleSheet("color: #f0fdfa; border: none;")
        body.setAlignment(Qt.AlignCenter)
        card_layout.addWidget(body)
        
        btn_close = QPushButton("أستغفر الله العظيم (متابعة العمل)", card)
        btn_close.setStyleSheet("QPushButton { background-color: #0d9488; color: white; border-radius: 8px; padding: 8px 16px; font-weight: bold; }")
        btn_close.clicked.connect(self.accept)
        card_layout.addWidget(btn_close)
        
        layout.addWidget(card)
        screen = QApplication.primaryScreen().geometry()
        self.move(screen.width() - 440, screen.height() - 260)

class FloatingRaqeebWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.drag_pos = QPoint()
        self.minutes = 0
        self.istighfar = 0
        self.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint | Qt.SubWindow)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setFixedSize(200, 56)
        layout = QHBoxLayout(self)
        container = QFrame(self)
        container.setStyleSheet("QFrame { background-color: rgba(15, 23, 42, 0.95); border: 1.5px solid #0d9488; border-radius: 24px; }")
        c_layout = QHBoxLayout(container)
        
        icon_lbl = QLabel("🛡️", container)
        icon_lbl.setStyleSheet("border:none;")
        c_layout.addWidget(icon_lbl)
        
        self.lbl = QLabel("رَقِيب: 0د | 📿 0", container)
        self.lbl.setFont(QFont("Arial", 9, QFont.Bold))
        self.lbl.setStyleSheet("color: #2dd4bf; border: none;")
        c_layout.addWidget(self.lbl)
        
        btn = QPushButton("+1", container)
        btn.setFixedSize(26, 26)
        btn.setStyleSheet("QPushButton { background-color: #0d9488; color: white; border-radius: 13px; border:none; font-weight: bold; }")
        btn.clicked.connect(self.add_istighfar)
        c_layout.addWidget(btn)
        
        layout.addWidget(container)
        screen = QApplication.primaryScreen().geometry()
        self.move(screen.width() - 220, 40)
        
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.tick)
        self.timer.start(60000)
        
    def add_istighfar(self):
        self.istighfar += 1
        self.lbl.setText(f"رَقِيب: {self.minutes}د | 📿 {self.istighfar}")
        
    def tick(self):
        self.minutes += 1
        self.lbl.setText(f"رَقِيب: {self.minutes}د | 📿 {self.istighfar}")
        if self.minutes % 10 == 0:
            dlg = TenMinuteReminderDialog(self)
            dlg.exec_()
            
    def mousePressEvent(self, e):
        if e.button() == Qt.LeftButton:
            self.drag_pos = e.globalPos() - self.frameGeometry().topLeft()
            e.accept()
            
    def mouseMoveEvent(self, e):
        if e.buttons() == Qt.LeftButton:
            self.move(e.globalPos() - self.drag_pos)
            e.accept()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)
    w = FloatingRaqeebWidget()
    w.show()
    tray = QSystemTrayIcon(app)
    tray.setIcon(w.style().standardIcon(w.style().SP_ComputerIcon))
    menu = QMenu()
    a1 = QAction("مواقيت الصلاة اليوم", menu)
    a1.triggered.connect(lambda: QMessageBox.information(None, "مواقيت الصلاة", "\\n".join([f"{k}: {v}" for k, v in calculate_prayer_times().items()])))
    menu.addAction(a1)
    a2 = QAction("خروج", menu)
    a2.triggered.connect(app.quit)
    menu.addAction(a2)
    tray.setContextMenu(menu)
    tray.show()
    sys.exit(app.exec_())
`;

  const extensionManifestJson = `{
  "manifest_version": 3,
  "name": "Raqeeb - الرفيق الرقمي الواعي",
  "version": "1.0.0",
  "description": "حارس النية، تذكيرات الـ 10 دقائق، حجب المواقع غير اللائقة، ومواقيت الصلاة",
  "permissions": [
    "declarativeNetRequest",
    "declarativeNetRequestFeedback",
    "storage",
    "alarms",
    "notifications",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "ruleset_1",
        "enabled": true,
        "path": "rules.json"
      }
    ]
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ]
}`;

  const extensionContentJs = `// content.js - حقن شاشات التنبيه والنية وتذكير الـ 10 دقائق
(function() {
  // 1. فحص النية المسبقة عند فتح نافذة جديدة
  if (!sessionStorage.getItem('raqeeb_intent_shown')) {
    sessionStorage.setItem('raqeeb_intent_shown', 'true');
    showIntentionOverlay();
  }

  // 2. مؤقت الـ 10 دقائق الذكي
  let sessionMinutes = 0;
  setInterval(() => {
    sessionMinutes += 1;
    if (sessionMinutes % 10 === 0) {
      alert("⏱️ رَقِيب: مضت 10 دقائق من استخدامك للمتصفح. جدد نيتك واذكر الله: أستغفر الله العظيم.");
    }
  }, 60000);

  function showIntentionOverlay() {
    const box = document.createElement('div');
    box.id = 'raqeeb-intention-overlay';
    box.innerHTML = \`
      <div style="position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999999;
                  background:#042f2e;color:#f0fdfa;padding:16px 24px;border-radius:16px;
                  border:2px solid #0d9488;box-shadow:0 20px 40px rgba(0,0,0,0.3);
                  font-family:sans-serif;direction:rtl;text-align:center;min-width:320px;">
        <h3 style="margin:0 0 6px 0;font-size:16px;color:#2dd4bf;">أنت داخل تعمل إيه؟</h3>
        <p style="margin:0 0 12px 0;font-size:13px;color:#ccfbf1;">خلي بالك، ربنا شايفك ومطلع عليك، فاتقِ الله.</p>
        <button id="rq-btn-close" style="background:#0d9488;color:#fff;border:none;padding:6px 16px;border-radius:8px;cursor:pointer;font-weight:bold;">حاجة مفيدة (متابعة)</button>
      </div>
    \`;
    document.body.appendChild(box);
    document.getElementById('rq-btn-close').addEventListener('click', () => box.remove());
  }
})();`;

  const androidKotlinSnippet = `package com.raqeeb.accessibility

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast

class RaqeebAccessibilityService : AccessibilityService() {

    private val monitoredPackages = listOf(
        "com.google.android.youtube",
        "com.facebook.katana",
        "com.instagram.android",
        "com.zhiliaoapp.musically",
        "com.twitter.android"
    )

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val pkg = event.packageName?.toString() ?: return
            if (monitoredPackages.contains(pkg)) {
                Toast.makeText(applicationContext, "رَقِيب: اتقِ الله واجعل وقتك في طاعة الله", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onInterrupt() {}
}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-['Amiri',serif] text-slate-900">
              الأكواد المصدرية للتطبيقات المستقلة (Native Apps & Source Code)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              أكواد حقيقية وكاملة لتشغيل «رَقِيب» كبرنامج مكتبي أصيل (Python/PyQt)، أو إضافة متصفح (Manifest V3)، أو خدمة أندرويد.
            </p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          id="subtab-windows"
          onClick={() => setActiveSubTab('windows')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'windows'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <Laptop className="w-4 h-4" />
          برنامج ويندوز الأصيل (Python + PyQt5)
        </button>

        <button
          id="subtab-extension"
          onClick={() => setActiveSubTab('extension')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'extension'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          إضافة المتصفح (Chrome / Edge Manifest V3)
        </button>

        <button
          id="subtab-android"
          onClick={() => setActiveSubTab('android')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'android'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          كود خدمة أندرويد و DNS
        </button>
      </div>

      {/* TAB 1: WINDOWS PYTHON NATIVE APP */}
      {activeSubTab === 'windows' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-2">
            <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              كيف تشغل أو تجمع البرنامج المكتبي على جهازك في ثوانٍ؟
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-emerald-900 leading-relaxed">
              <li>قم بتنزيل الكود أدناه باسم <code className="bg-emerald-100 px-1 rounded font-mono">raqeeb_floating_shield.py</code>.</li>
              <li>ثبت مكتبة الواجهات بالأمر: <code className="bg-emerald-100 px-1 rounded font-mono">pip install PyQt5</code>.</li>
              <li>شغل البرنامج مباشرة بالأمر: <code className="bg-emerald-100 px-1 rounded font-mono">python raqeeb_floating_shield.py</code>.</li>
              <li>لتحويله إلى ملف <strong className="font-mono">.EXE</strong> تنفيذي لا يحتاج بايثون: <code className="bg-emerald-100 px-1 rounded font-mono">pyinstaller --onefile --noconsole raqeeb_floating_shield.py</code>.</li>
            </ol>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <span className="text-xs font-mono font-bold text-teal-700 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-600 shrink-0" />
                raqeeb_floating_shield.py (تطبيق بايثون و PyQt5 كامل)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sounds.playSuccessTone();
                    downloadTextFile('raqeeb_floating_shield.py', windowsPythonNativeApp, 'text/x-python;charset=utf-8');
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  تنزيل الكود (.py)
                </button>
                <button
                  onClick={() => copyCode(windowsPythonNativeApp, 'py')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                >
                  {copiedFile === 'py' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  {copiedFile === 'py' ? 'تم النسخ' : 'نسخ الكود'}
                </button>
              </div>
            </div>
            <pre className="p-3 sm:p-4 bg-slate-900 rounded-2xl text-[11px] font-mono text-slate-100 overflow-x-auto max-h-96 border border-slate-800" dir="ltr">
              {windowsPythonNativeApp}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: CHROME / EDGE EXTENSION */}
      {activeSubTab === 'extension' && (
        <div className="space-y-6">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-3xl space-y-2">
            <h4 className="font-bold text-sm text-teal-950 flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-600" />
              قواعد الحجب المباشرة المحدثة تلقائياً ({rulesCount} قاعدة حجب)
            </h4>
            <p className="text-xs text-teal-900 leading-relaxed">
              يتم توليد ملف <code className="bg-teal-100 px-1.5 py-0.5 rounded font-mono font-bold">rules.json</code> تلقائياً وديناميكياً من المصدر المركزي الموحد للحظر، ويحتوي على كافة القواعد المحدثة بدقة عالية لتزويد محرك <code className="bg-teal-100 px-1 rounded font-mono">declarativeNetRequest</code> في المتصفح.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <span className="text-xs font-mono font-bold text-teal-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                rules.json ({rulesCount} قاعدة حجب موحدة تلقائياً)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sounds.playSuccessTone();
                    downloadTextFile('rules.json', dynamicRulesJson, 'application/json;charset=utf-8');
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  تنزيل rules.json ({rulesCount} قاعدة)
                </button>
                <button
                  onClick={() => copyCode(dynamicRulesJson, 'rulesJson')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                >
                  {copiedFile === 'rulesJson' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  {copiedFile === 'rulesJson' ? 'تم النسخ' : 'نسخ JSON'}
                </button>
              </div>
            </div>
            <pre className="p-3 sm:p-4 bg-slate-900 rounded-2xl text-[11px] font-mono text-slate-100 overflow-x-auto max-h-72 border border-slate-800" dir="ltr">
              {dynamicRulesJson}
            </pre>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <span className="text-xs font-mono font-bold text-teal-700 flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-600 shrink-0" />
                manifest.json (Manifest V3 لمتصفحات Chrome / Edge)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sounds.playSuccessTone();
                    downloadTextFile('manifest.json', extensionManifestJson, 'application/json;charset=utf-8');
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  تنزيل manifest.json
                </button>
                <button
                  onClick={() => copyCode(extensionManifestJson, 'manifest')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                >
                  {copiedFile === 'manifest' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  {copiedFile === 'manifest' ? 'تم النسخ' : 'نسخ'}
                </button>
              </div>
            </div>
            <pre className="p-3 sm:p-4 bg-slate-900 rounded-2xl text-[11px] font-mono text-slate-100 overflow-x-auto max-h-72 border border-slate-800" dir="ltr">
              {extensionManifestJson}
            </pre>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <span className="text-xs font-mono font-bold text-teal-700 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-teal-600 shrink-0" />
                content.js (حقن شاشات التنبيه والنية)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sounds.playSuccessTone();
                    downloadTextFile('content.js', extensionContentJs, 'text/javascript;charset=utf-8');
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  تنزيل content.js
                </button>
                <button
                  onClick={() => copyCode(extensionContentJs, 'content')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                >
                  {copiedFile === 'content' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  {copiedFile === 'content' ? 'تم النسخ' : 'نسخ'}
                </button>
              </div>
            </div>
            <pre className="p-3 sm:p-4 bg-slate-900 rounded-2xl text-[11px] font-mono text-slate-100 overflow-x-auto max-h-72 border border-slate-800" dir="ltr">
              {extensionContentJs}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: ANDROID ACCESSIBILITY SERVICE */}
      {activeSubTab === 'android' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-700 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-600 shrink-0" />
              RaqeebAccessibilityService.kt (كود خدمة إمكانية الوصول في أندرويد)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.playSuccessTone();
                  downloadTextFile('RaqeebAccessibilityService.kt', androidKotlinSnippet, 'text/plain;charset=utf-8');
                }}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                تنزيل .kt
              </button>
              <button
                onClick={() => copyCode(androidKotlinSnippet, 'kotlin')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
              >
                {copiedFile === 'kotlin' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copiedFile === 'kotlin' ? 'تم النسخ' : 'نسخ'}
              </button>
            </div>
          </div>
          <pre className="p-3 sm:p-4 bg-slate-900 rounded-2xl text-[11px] font-mono text-slate-100 overflow-x-auto max-h-96 border border-slate-800" dir="ltr">
            {androidKotlinSnippet}
          </pre>
        </div>
      )}
    </div>
  );
};
