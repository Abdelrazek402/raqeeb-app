import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, LogIn, Loader2 } from 'lucide-react';
import LogoImage from '../assets/images/raqeeb_logo_1788773748138.jpg';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      if (e.code === 'auth/internal-error') {
        alert('حدث خطأ داخلي في الخادم. قد يكون السبب أن النطاق (Domain) الحالي غير مصرح له في إعدادات Firebase Auth. يرجى التأكد من إضافة هذا النطاق إلى قائمة Authorized Domains في منصة Firebase.');
      }
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-teal-600 rounded-2xl shadow-lg border-2 border-teal-500 flex items-center justify-center overflow-hidden">
            <img src={LogoImage} alt="شعار رقيب" className="w-12 h-12 object-cover rounded-lg" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-['Amiri',serif] text-slate-900">
            مرحباً بك في «رَقِيب»
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            اللوحة السحابية لحماية نفسك وإدارة وقتك وأهدافك. يرجى تسجيل الدخول لمزامنة إعداداتك.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50"
          >
            {isSigningIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a5.95 5.95 5.95 0 0 1-5.95-5.95 5.95 5.95 5.95 0 0 1 5.95-5.95c1.539 0 2.91.597 3.96 1.572l2.846-2.846A9.92 9.92 0 0 0 12.545 2C7.021 2 2.545 6.477 2.545 12s4.476 10 10 10c5.522 0 10-4.477 10-10 0-.687-.104-1.35-.295-1.984h-9.705z" />
                </svg>
                <span>المتابعة باستخدام حساب Google</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4" />
          <span>بياناتك آمنة ومحمية بالتشفير السحابي</span>
        </div>
      </div>
    </div>
  );
};
