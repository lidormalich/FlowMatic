import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const SubscriptionExpired = ({ isSuspended }) => {
  const { logout, user } = useContext(AuthContext);
  const { isDark } = useTheme();

  const daysLeft = user?.subscription?.trialEndsAt
    ? Math.ceil((new Date(user.subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const isTrialExpired = !isSuspended && user?.subscription?.status === 'trial' && daysLeft !== null && daysLeft <= 0;

  return (
    <div
      dir="rtl"
      className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
      </div>

      <div className={`relative w-full max-w-md rounded-3xl shadow-2xl p-10 border text-center
        ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
      >
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-4xl mx-auto mb-6">
          {isSuspended ? '🚫' : '⏰'}
        </div>

        <h1 className="text-2xl font-black mb-3">
          {isSuspended ? 'החשבון מושעה' : 'תקופת הניסיון הסתיימה'}
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          {isSuspended
            ? 'החשבון שלך הושעה זמנית. לפרטים נוספים ולהסדרת המנוי, אנא צור קשר עם התמיכה.'
            : 'תקופת הניסיון החינמית שלך ל-14 ימים הסתיימה. כדי להמשיך להשתמש במערכת, אנא צור קשר עם התמיכה להסדרת התשלום.'
          }
        </p>

        <div className={`rounded-2xl p-5 mb-8 border text-right space-y-3
          ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
        >
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">פרטי יצירת קשר:</p>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span className="text-lg">📧</span>
            <span dir="ltr">support@flowmatic.co.il</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span className="text-lg">📱</span>
            <span dir="ltr">050-000-0000</span>
          </div>
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <p className="text-xs text-slate-500">
              מנוי חודשי: <strong className="text-blue-500">₪120 בלבד</strong> — כולל הכל, ללא הגבלות
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href="mailto:support@flowmatic.co.il"
            className="block w-full h-12 bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>📧</span>
            שלח מייל לתמיכה
          </a>
          <button
            onClick={logout}
            className={`w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95
              ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            התנתק
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
