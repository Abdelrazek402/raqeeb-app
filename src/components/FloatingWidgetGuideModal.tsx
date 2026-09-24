import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Laptop, 
  Smartphone, 
  Copy, 
  Check, 
  Download, 
  ShieldAlert, 
  Heart, 
  Clock, 
  Sparkles,
  ExternalLink,
  Zap,
  Monitor
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface FloatingWidgetGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleWebFloatingBar: () => void;
  isWebFloatingBarEnabled: boolean;
}

export const FloatingWidgetGuideModal: React.FC<FloatingWidgetGuideModalProps> = ({
  isOpen,
  onClose,
  onToggleWebFloatingBar,
  isWebFloatingBarEnabled
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'windows' | 'android'>('overview');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, id: string) => {
    sounds.playSuccessTone();
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  const windowsPythonFloatingScript = `# -*- coding: utf-8 -*-
"""
ودجت «رَقِيب» العائم لسطح مكتب ويندوز (Always-On-Top Desktop Widget)
يظهر كشريط عائم شبه شفاف في أسفل أو جانب الشاشة فوق جميع البرامج والألعاب.
يتضمن زر غض البصر اللحظي، ومواقيت الصلاة، وعداد الاستغفار.
"""
import sys
from datetime import datetime
import math
import webbrowser
from PyQt5.QtWidgets import (
    QApplication, QWidget, QLabel, QPushButton, QHBoxLayout,
    QSystemTrayIcon, QMenu, QAction, QGraphicsDropShadowEffect
)
from PyQt5.QtCore import Qt, QPoint, QTimer
from PyQt5.QtGui import QColor, QFont, QCursor

class FloatingRaqeebBar(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.drag_position = QPoint()

    def init_ui(self):
        # Always on top, frameless, translucent window
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.SubWindow)
        self.setAttribute(Qt.WA_TranslucentBackground)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 6, 12, 6)
        layout.setSpacing(10)

        # Style container
        self.container = QWidget(self)
        self.container.setStyleSheet("""
            QWidget {
                background-color: rgba(15, 23, 42, 235);
                border-radius: 20px;
                border: 1px solid rgba(51, 65, 85, 0.8);
            }
        """)
        c_layout = QHBoxLayout(self.container)
        c_layout.setContentsMargins(14, 6, 14, 6)
        c_layout.setSpacing(10)

        # 1. Panic Rescue Button
        self.btn_panic = QPushButton("🛡️ غض البصر", self.container)
        self.btn_panic.setStyleSheet("""
            QPushButton {
                background-color: #e11d48;
                color: white;
                font-weight: bold;
                border-radius: 12px;
                padding: 6px 12px;
                font-size: 11px;
            }
            QPushButton:hover { background-color: #be123c; }
        """)
        self.btn_panic.clicked.connect(self.on_panic)
        c_layout.addWidget(self.btn_panic)

        # 2. Next Prayer Countdown
        self.lbl_prayer = QLabel("🕌 المغرب: جارٍ الحساب...", self.container)
        self.lbl_prayer.setStyleSheet("color: #5eead4; font-size: 11px; font-weight: bold;")
        c_layout.addWidget(self.lbl_prayer)

        # 3. Quick Istighfar Button
        self.istighfar_count = 0
        self.btn_istighfar = QPushButton("💚 أستغفر الله (0)", self.container)
        self.btn_istighfar.setStyleSheet("""
            QPushButton {
                background-color: rgba(13, 148, 136, 0.25);
                color: #99f6e4;
                border: 1px solid rgba(20, 184, 166, 0.4);
                border-radius: 12px;
                padding: 6px 10px;
                font-size: 11px;
                font-weight: bold;
            }
            QPushButton:hover { background-color: rgba(13, 148, 136, 0.4); }
        """)
        self.btn_istighfar.clicked.connect(self.on_istighfar)
        c_layout.addWidget(self.btn_istighfar)

        layout.addWidget(self.container)

        # Position at bottom center of screen
        screen = QApplication.primaryScreen().geometry()
        self.setGeometry(
            (screen.width() - 420) // 2,
            screen.height() - 80,
            420, 50
        )

    def on_panic(self):
        webbrowser.open("https://raqeeb-companion.web.app")

    def on_istighfar(self):
        self.istighfar_count += 1
        self.btn_istighfar.setText(f"💚 أستغفر الله ({self.istighfar_count})")

    # Draggable logic
    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self.drag_position = event.globalPos() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.LeftButton:
            self.move(event.globalPos() - self.drag_position)
            event.accept()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    bar = FloatingRaqeebBar()
    bar.show()
    sys.exit(app.exec_())
`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg font-['Amiri',serif]">
                ودجت الشاشة العائم للأجهزة (Floating Screen Companion)
              </h3>
              <p className="text-xs text-slate-300">
                تشغيل الودجت العائم داخل التطبيق وعلى شاشة جهازك (ويندوز / أندرويد)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>التحكم في الشريط بالمتصفح</span>
          </button>

          <button
            onClick={() => setActiveTab('windows')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'windows'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>سطح مكتب ويندوز (Always-on-Top)</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'android'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>موبايل أندرويد (Floating Bubble)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700">
          
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-teal-950 flex items-center gap-2">
                    <span>الشريط العائم السريع في التطبيق</span>
                    {isWebFloatingBarEnabled ? (
                      <span className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-bold">مفعّل حالياً 🟢</span>
                    ) : (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">معطّل ⚪</span>
                    )}
                  </h4>
                  <p className="text-xs text-teal-800 leading-relaxed">
                    يظهر كشريط عائم في أسفل الشاشة على الكمبيوتر والتابلت والموبايل للوصول السريع لزر غض البصر، الصلاة القادمة، وعداد الاستغفار.
                  </p>
                </div>
                <button
                  onClick={onToggleWebFloatingBar}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all shrink-0 active:scale-95 shadow-xs ${
                    isWebFloatingBarEnabled
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  {isWebFloatingBarEnabled ? 'إخفاء الشريط' : 'تفعيل الشريط'}
                </button>
              </div>

              {/* Preview Box */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">معاينة شكل الشريط على شاشتك:</span>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center">
                  <div className="bg-slate-800/90 text-white border border-slate-600 rounded-full px-4 py-2 flex items-center gap-3 text-xs">
                    <span className="bg-rose-600 text-white font-bold px-3 py-1 rounded-full text-[10px] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-amber-300" />
                      غض البصر
                    </span>
                    <span className="text-teal-300 font-bold text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-400" />
                      الظهر بعد: 1س و 15د
                    </span>
                    <span className="bg-teal-500/20 text-teal-200 px-2.5 py-1 rounded-full text-[10px] font-bold border border-teal-500/30 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-teal-400 fill-teal-400" />
                      أستغفر الله
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-Device Support Info */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <h5 className="font-bold text-slate-800">💡 كيف تجعل هذا الشريط عائماً خارج المتصفح فوق جميع البرامج؟</h5>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600">
                  <li><strong>على الكمبيوتر (ويندوز):</strong> يمكنك تشغيل سكربت بايثون المكتبي الجاهز (في التبويب التالي) ليظل طافياً Always-On-Top فوق الألعاب والمتصفحات وبرامج العمل.</li>
                  <li><strong>على الموبايل والتابلت (أندرويد):</strong> تثبيت التطبيق كـ PWA مع تمكين إشعارات الشريط المباشرة (Live Lockscreen Widget).</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed">
                <strong>كود الودجت العائم لسطح مكتب ويندوز (Windows Floating Pill):</strong><br />
                يقوم بإنشاء نافذة شفافة عائمة بدون إطار تظل في المقدمة دوماً (Always-On-Top)، يمكنك سحبها وتحريكها لأي مكان بالماوس فوق جميع البرامج.
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-60 border border-slate-800 scrollbar-thin">
                  {windowsPythonFloatingScript}
                </pre>
                <button
                  onClick={() => copyText(windowsPythonFloatingScript, 'win_widget')}
                  className="absolute top-3 left-3 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {copiedScript === 'win_widget' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript === 'win_widget' ? 'تم النسخ!' : 'نسخ الكود'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">طريقة التشغيل في ثوانٍ:</span>
                <p className="text-slate-600">
                  1. انسخ الكود واحفظه في ملف باسم <code className="bg-slate-200 px-1 rounded font-mono">raqeeb_widget.py</code>.<br />
                  2. شغّله عبر الأمر: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">pip install PyQt5 && python raqeeb_widget.py</code>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 space-y-2">
                <h5 className="font-bold text-sm">📱 تشغيل الودجت على شاشة الهاتف الرئيسية وخارج المتصفح:</h5>
                <ol className="list-decimal list-inside space-y-2 text-teal-800">
                  <li>
                    <strong>تثبيت التطبيق على الشاشة الرئيسية (PWA Install):</strong> اضغط على زر «تثبيت التطبيق» في القائمة ليظهر كأيقونة تطبيق مستقل على هاتفك.
                  </li>
                  <li>
                    <strong>شريط الإشعار العائم المستمر (Persistent Live Bar):</strong> عند تفعيل الإشعارات، يُرسل التطبيق إشعاراً ثابتاً في مركز الإشعارات وشاشة القفل يضم أزرار الاستغفار وغض البصر ومواقيت الصلاة دون الحاجة لفتح المتصفح.
                  </li>
                  <li>
                    <strong>ميزة النوافذ العائمة (Picture-in-Picture / Pop-up View):</strong> في هواتف أندرويد (Samsung/Xiaomi/Oppo)، يمكنك الضغط على أيقونة التطبيق في شاشة المهام واختيار «فتح في عرض نافذة منبثقة» لتظل عائمة فوق التطبيقات الأخرى.
                  </li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            مشروع «رَقِيب» — الرفيق الرقمي الواعي
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            حسناً، فهمت
          </button>
        </div>

      </div>
    </div>
  );
};
