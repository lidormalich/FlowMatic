import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'ניהול תורים חכם',
    desc: 'קביעה, עריכה וביטול בקליק אחד. לוח שנה ברור עם תמיכה מלאה בעברית ותאריכים עבריים.',
    color: 'blue',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'ניהול לקוחות',
    desc: 'כרטסת לקוח מלאה עם היסטוריית ביקורים, פרטי קשר ומעקב הכנסות — הכל במקום אחד.',
    color: 'purple',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'דוחות ואנליטיקה',
    desc: 'הכנסות, תורים, לקוחות חדשים — כל הנתונים שלך בגרפים ברורים עם מפת חום שבועית.',
    color: 'emerald',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: 'התראות חכמות',
    desc: 'תזכורות SMS ו-Push אוטומטיות ללקוחות — פחות ביטולי הרגע האחרון, יותר הכנסות.',
    color: 'amber',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'עמוד הזמנה אישי',
    desc: 'כל עסק מקבל עמוד הזמנה ייחודי — לקוחות יכולים לקבוע תור בעצמם 24/7 מכל מכשיר.',
    color: 'blue',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'ניהול מלאי',
    desc: 'עקוב אחר מוצרים וחומרים, קבל התראות על מלאי נמוך ושמור על הסדר בעסק.',
    color: 'purple',
  },
];

const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const businesses = [
  'ספרות ועיצוב שיער', 'קוסמטיקה וטיפוח', 'עיצוב ציפורניים',
  'פיזיותרפיה', 'אימון כושר אישי', 'נטורופתיה',
  'רפואה אלטרנטיבית', 'פסיכולוגיה', 'ייעוץ עסקי',
];

const included = [
  'תורים ולוח שנה ללא הגבלה',
  'ניהול לקוחות ועובדים',
  'עמוד הזמנה אישי לעסק',
  'דוחות ואנליטיקה מלאים',
  'התראות SMS ו-Push',
  'ניהול מלאי',
  'ממשק עברי מלא — כיוון ימין-לשמאל',
  'גיבוי אוטומטי של כל הנתונים',
];

const LandingPage = () => {
  const { isDark } = useTheme();

  return (
    <div dir="rtl" className={isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-blue-100 dark:border-blue-500/20">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            מערכת ניהול תורים חכמה לעסק שלך          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 tracking-tight">
            ניהול העסק שלך,{' '}
            <span className="bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">
              בקליק אחד
            </span>
          </h1>

          <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            מערכת מקצועית לניהול תורים, לקוחות ועובדים —
            מותאמת במיוחד לעסקים ישראליים קטנים ובינוניים
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-200 active:scale-95"
            >
              התחל עכשיו — בחינם
            </Link>
            <Link
              to="/login"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-200 active:scale-95"
            >
              יש לי חשבון ←
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">
            ללא כרטיס אשראי · ביטול בכל עת · ניסיון חינמי ל-14 יום
          </p>
        </div>
      </section>

      {/* ─── For whom ─── */}
      <section className={`py-14 ${isDark ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">
            מושלם עבור
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {businesses.map(b => (
              <span
                key={b}
                className={`px-4 py-2 rounded-full text-sm font-medium border shadow-sm
                  ${isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700'
                  }`}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">הכל במקום אחד</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              כלים שכל עסק צריך — ממשק שכל אחד יכול להפעיל
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className={`p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group
                  ${isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-600'
                    : 'bg-white border-slate-100 hover:border-blue-100 hover:shadow-blue-50/80'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[f.color]}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <section className={`py-16 ${isDark ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { num: '500+', label: 'לקוחות בעסק ממוצע' },
              { num: '3,000+', label: 'תורים לחודש' },
              { num: '24/7', label: 'זמינות מערכת' },
              { num: '₪120', label: 'בלבד לחודש' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-black bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  {s.num}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-24 px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">מחיר פשוט. ללא הפתעות.</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-12">
            תשלום חודשי קבוע, ביטול בכל עת
          </p>

          <div className={`relative rounded-3xl p-8 border-2 border-blue-500 shadow-2xl shadow-blue-500/10
            ${isDark ? 'bg-slate-900' : 'bg-white'}`}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="bg-gradient-to-l from-blue-600 to-purple-600 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                כולל הכל — ללא הגבלות
              </span>
            </div>

            <div className="mb-8 mt-2">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-6xl font-black">₪120</span>
                <span className="text-slate-500 text-lg">/ חודש</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                14 ימי ניסיון חינמיים — ללא כרטיס אשראי
              </p>
            </div>

            <ul className="space-y-3 mb-8 text-right">
              {included.map(item => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="block w-full bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95 text-center"
            >
              התחל ניסיון חינם ל-14 יום
            </Link>

            <p className="mt-4 text-xs text-slate-400 text-center">
              ללא כרטיס אשראי · ביטול בכל עת
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className={`py-24 px-6 ${isDark ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">מוכן להתחיל?</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-10">
            הצטרף לעסקים שכבר מנהלים את התורים שלהם באמצעות FlowMatic
          </p>
          <Link
            to="/register"
            className="inline-block bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-200 active:scale-95"
          >
            הרשמה חינמית — מתחילים עכשיו
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className={`py-8 px-6 border-t ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>FlowMatic</span>
          <span>© {new Date().getFullYear()} כל הזכויות שמורות</span>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-blue-500 transition-colors">כניסה</Link>
            <Link to="/register" className="hover:text-blue-500 transition-colors">הרשמה</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
