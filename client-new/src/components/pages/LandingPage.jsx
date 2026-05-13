import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const FEATURES = [
  { icon: '📅', title: 'ניהול תורים', desc: 'לוח שנה חכם עם תמיכה בתאריכים עבריים, שעות עבודה ואירועים מרובים בו זמנית.' },
  { icon: '👥', title: 'ניהול לקוחות', desc: 'כרטסת לקוחות מלאה עם היסטוריית ביקורים, מידע ליצירת קשר ותגיות חכמות.' },
  { icon: '🧑‍💼', title: 'ניהול צוות', desc: 'הגדר עובדים, שעות עבודה וסוגי שירות לכל איש צוות בנפרד.' },
  { icon: '📊', title: 'דוחות ואנליטיקה', desc: 'מפות חום, גרפי הכנסות ומגמות עסקיות בזמן אמת — הכל בלוח בקרה אחד.' },
  { icon: '🔔', title: 'התראות SMS', desc: 'שלח תזכורות ועדכונים אוטומטיים ללקוחות שלך כדי להפחית ביטולים.' },
  { icon: '🌐', title: 'הזמנה עצמאית', desc: 'לקוחות יכולים לקבוע תור בעצמם 24/7 דרך לינק ייחודי לעסק שלך.' },
  { icon: '📦', title: 'ניהול מלאי', desc: 'עקוב אחרי מוצרים וציוד, קבל התראות מלאי נמוך ונהל הוצאות.' },
  { icon: '⏳', title: 'רשימת המתנה', desc: 'ניהול חכם של לקוחות הממתינים לתור — מלא ביטולים אוטומטית.' },
];

const STEPS = [
  { num: '01', title: 'צור חשבון', desc: 'הרשמה מהירה תוך דקות — ללא כרטיס אשראי.' },
  { num: '02', title: 'הגדר את העסק', desc: 'הזן שעות פעילות, שירותים, צוות ועיצוב העסק.' },
  { num: '03', title: 'התחל לקבל תורים', desc: 'שתף את הלינק שלך ולקוחות יזמינו ישירות.' },
];

const STATS = [
  { value: '500+', label: 'עסקים פעילים' },
  { value: '50K+', label: 'תורים שנוהלו' },
  { value: '98%', label: 'שביעות רצון' },
  { value: '24/7', label: 'זמינות' },
];

const TESTIMONIALS = [
  {
    name: 'שירה לוי',
    role: 'מעצבת שיער, תל אביב',
    text: 'מאז שעברתי ל-FlowMatic חסכתי לפחות שעתיים ביום. הלקוחות מזמינות לבד וקיבלתי שקט נפשי.',
    avatar: '💇‍♀️',
  },
  {
    name: 'דן כהן',
    role: 'פיזיותרפיסט, חיפה',
    text: 'הדוחות הם יתרון ענקי. אני רואה בדיוק מתי עמוס, מי לא מגיע ומה ההכנסה הצפויה.',
    avatar: '🧑‍⚕️',
  },
  {
    name: 'מיכל אברהם',
    role: 'קוסמטיקאית, ירושלים',
    text: 'ה-SMS האוטומטיים הורידו לי ביטולים ב-40%. שווה כל שקל.',
    avatar: '💅',
  },
];

const PLAN_FEATURES = [
  'ניהול תורים ולוח שנה',
  'עד 5 אנשי צוות',
  'ניהול לקוחות ללא הגבלה',
  'דף הזמנה עצמאי ייחודי',
  'התראות SMS ואימייל',
  'דוחות ואנליטיקה מלאה',
  'ניהול מלאי ורשימת המתנה',
  'תמיכה בעברית 7 ימים',
  'גיבוי נתונים אוטומטי',
];

const FAQ = [
  {
    q: 'האם יש תקופת ניסיון?',
    a: '14 ימי ניסיון חינמיים — ללא כרטיס אשראי ובלי התחייבות. אחרי זה ₪120 לחודש בלבד.',
  },
  {
    q: 'כמה זמן לוקחת ההגדרה הראשונית?',
    a: 'ויזרד ההגדרה המובנה מוביל אותך צעד אחר צעד. רוב העסקים מסיימים תוך 5 דקות.',
  },
  {
    q: 'האם אפשר לבטל בכל עת?',
    a: 'כן. אין חוזה ואין קנסות. מבטל — ומקבל את כל הנתונים שלך לייצוא.',
  },
  {
    q: 'האם המערכת עובדת על נייד?',
    a: 'בהחלט. הממשק מותאם מלא למובייל — גם לבעל העסק וגם ללקוחות שמזמינים.',
  },
  {
    q: 'מה קורה אם אני צריך יותר מ-5 עובדים?',
    a: 'פנה אלינו ונבנה עבורך הצעת מחיר מותאמת לעסקים גדולים יותר.',
  },
];

function LandingPage() {
  const { isDark } = useTheme();
  const base = isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const card = isDark
    ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
    : 'bg-white border-slate-100 hover:bg-blue-50/40';
  const surface = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const border = isDark ? 'border-slate-800' : 'border-slate-100';

  return (
    <div className={base} dir="rtl">

      {/* ── Hero (ללא רקע) ────────────────────────────────────── */}
      <section className="min-h-[calc(100vh-64px)] flex items-center">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 border ${border} rounded-full px-4 py-2 text-sm font-medium mb-8 ${muted}`}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            מערכת ניהול עסקים חכמה לישראל
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
            נהל את העסק שלך
            <br />
            <span className="text-blue-600 dark:text-blue-400">בחכמה יותר</span>
          </h1>

          <p className={`text-xl md:text-2xl ${muted} max-w-2xl mx-auto mb-12 leading-relaxed`}>
            FlowMatic היא מערכת ניהול תורים ולקוחות לעסקים ישראלים —
            <br className="hidden sm:block" />
            סלונים, מרפאות, מטפלים ויועצים.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-200"
            >
              14 יום ניסיון חינמי →
            </Link>
            <Link
              to="/login"
              className={`border ${border} font-bold px-8 py-4 rounded-xl text-lg hover:border-blue-500 hover:text-blue-500 transition-all duration-200`}
            >
              כניסה למערכת
            </Link>
          </div>

          <p className={`mt-8 text-sm ${muted}`}>
            ₪120 לחודש · 14 יום ניסיון חינמי · ללא כרטיס אשראי
          </p>

          {/* Logos strip */}
          <div className={`mt-16 pt-10 border-t ${border}`}>
            <p className={`text-xs font-semibold uppercase tracking-widest ${muted} mb-6`}>מתאים לכל עסק שירות</p>
            <div className={`flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium ${muted}`}>
              {['💇 סלון יופי', '🧖 ספא ורפואה', '🦷 קליניקות', '🏋️ כושר ואימון', '📚 שיעורים פרטיים', '🐾 וטרינרים'].map((b) => (
                <span key={b}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className={`${surface} py-14 border-y ${border}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-blue-500 mb-1">{s.value}</div>
              <div className={`text-sm font-medium ${muted}`}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full mb-4">
              פיצ׳רים
            </span>
            <h2 className="text-4xl font-black mb-4">כל מה שהעסק שלך צריך</h2>
            <p className={`text-lg ${muted} max-w-xl mx-auto`}>
              כלים חכמים שחוסכים זמן ומייעלים את הניהול היומיומי
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`${card} rounded-2xl p-6 border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200`}
              >
                <div className="text-4xl mb-4 leading-none">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className={`text-sm leading-relaxed ${muted}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className={`${surface} py-24 border-y ${border}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-3 py-1.5 rounded-full mb-4">
              פשוט להתחיל
            </span>
            <h2 className="text-4xl font-black mb-4">איך מתחילים?</h2>
            <p className={`text-lg ${muted}`}>3 שלבים פשוטים ואתה מוכן לניהול עסק חכם</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 right-[16.6%] left-[16.6%] h-0.5 bg-gradient-to-l from-indigo-400/30 via-blue-300/20 to-indigo-400/30" />
            {STEPS.map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl mb-6 shadow-lg shadow-blue-500/25 relative z-10">
                  {step.num}
                </div>
                <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                <p className={`text-sm leading-relaxed ${muted} max-w-[200px]`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full mb-4">
              תמחור
            </span>
            <h2 className="text-4xl font-black mb-4">מחיר אחד, הכל כלול</h2>
            <p className={`text-lg ${muted}`}>ללא הפתעות, ללא תוספות, ללא דמי הקמה</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Price card */}
            <div className={`relative rounded-3xl border-2 border-blue-500 p-8 shadow-xl shadow-blue-500/10 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="absolute -top-4 right-8">
                <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  הכי פופולרי
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-6xl font-black">120</span>
                  <span className="text-2xl font-bold mb-2">₪</span>
                  <span className={`text-lg mb-2 ${muted}`}> / חודש</span>
                </div>
                <p className={`text-sm ${muted}`}>חיוב חודשי · ביטול בכל עת</p>
              </div>

              <div className="space-y-3 mb-8">
                {PLAN_FEATURES.map((feat) => (
                  <div key={feat} className="flex items-center gap-3">
                    <span className="text-emerald-500 font-bold text-lg shrink-0">✓</span>
                    <span className="text-sm font-medium">{feat}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors duration-200 shadow-lg shadow-blue-500/20"
              >
                התחל 14 יום בחינם
              </Link>
              <p className={`text-xs text-center mt-3 ${muted}`}>ללא כרטיס אשראי</p>
            </div>

            {/* Value props */}
            <div className="space-y-6">
              {[
                {
                  icon: '💰',
                  title: 'ROI מיידי',
                  desc: '₪120 לחודש = פחות מעלות תור בודד שנחסך. בממוצע, עסקים מדווחים על חיסכון של 8–10 שעות בשבוע.',
                },
                {
                  icon: '🔒',
                  title: 'ללא נעילה',
                  desc: 'הנתונים שלך שייכים לך. אפשר לייצא הכל בכל עת — CSV, Excel, גיבוי מלא.',
                },
                {
                  icon: '🇮🇱',
                  title: 'בנוי לישראל',
                  desc: 'ממשק בעברית, תמיכה בתאריכים עבריים, חגים ושבתות, ותשלומים בשקלים.',
                },
                {
                  icon: '🤝',
                  title: 'תמיכה אנושית',
                  desc: 'לא בוטים — תמיכה אמיתית בעברית, 7 ימים בשבוע. שאלה? תקבל תשובה תוך שעה.',
                },
              ].map((v) => (
                <div key={v.title} className="flex gap-4">
                  <span className="text-3xl shrink-0">{v.icon}</span>
                  <div>
                    <h4 className="font-bold mb-1">{v.title}</h4>
                    <p className={`text-sm leading-relaxed ${muted}`}>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className={`${surface} py-24 border-y ${border}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1.5 rounded-full mb-4">
              לקוחות מרוצים
            </span>
            <h2 className="text-4xl font-black mb-4">מה אומרים עלינו</h2>
            <p className={`text-lg ${muted}`}>עסקים שכבר עובדים עם FlowMatic</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className={`${card} rounded-2xl p-7 border shadow-sm`}>
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-lg">★</span>
                  ))}
                </div>
                <p className={`text-sm leading-relaxed mb-6 ${muted}`}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className={`text-xs ${muted}`}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full mb-4">
              שאלות נפוצות
            </span>
            <h2 className="text-4xl font-black mb-4">יש לך שאלה?</h2>
            <p className={`text-lg ${muted}`}>התשובות לשאלות הנפוצות ביותר</p>
          </div>

          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className={`${card} rounded-2xl p-6 border`}>
                <h4 className="font-bold text-base mb-2">{item.q}</h4>
                <p className={`text-sm leading-relaxed ${muted}`}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className={`${surface} border-y ${border} py-24`}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-5">מוכן לשדרג את העסק?</h2>
          <p className={`text-xl ${muted} mb-10 max-w-xl mx-auto leading-relaxed`}>
            הצטרף לאלפי בעלי עסקים שכבר מנהלים את הזמן שלהם עם FlowMatic
          </p>
          <Link
            to="/register"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-xl text-xl shadow-lg shadow-blue-500/20 hover:-translate-y-1 transition-all duration-200"
          >
            התחל עכשיו — 14 יום חינם
          </Link>
          <p className={`mt-5 text-sm ${muted}`}>לאחר מכן ₪120 לחודש · ביטול בכל עת</p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} border-t py-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/FlowMatic.png"
                alt="FlowMatic"
                className="h-8 w-auto"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="font-black text-xl">FlowMatic</span>
            </div>

            <div className="flex gap-6 text-sm">
              {[
                { to: '/terms', label: 'תנאי שימוש' },
                { to: '/login', label: 'כניסה' },
                { to: '/register', label: 'הרשמה' },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`${muted} hover:text-blue-500 transition-colors font-medium`}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <p className={`text-sm ${muted}`}>© 2025 FlowMatic. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
