import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useRef, useState, Fragment } from 'react';

const KEYFRAMES = `
  @keyframes float {
    0%,100%{transform:translateY(0) scale(1)}
    50%{transform:translateY(-28px) scale(1.04)}
  }
  @keyframes float2 {
    0%,100%{transform:translateY(0) scale(1)}
    50%{transform:translateY(22px) scale(0.96)}
  }
  @keyframes shimmer-text {
    0%{background-position:0% 50%}
    50%{background-position:100% 50%}
    100%{background-position:0% 50%}
  }
  @keyframes slide-up {
    from{opacity:0;transform:translateY(48px)}
    to{opacity:1;transform:translateY(0)}
  }
  @keyframes fade-scale {
    from{opacity:0;transform:scale(0.88)}
    to{opacity:1;transform:scale(1)}
  }
  @keyframes ticker {
    0%{transform:translateX(0)}
    100%{transform:translateX(-50%)}
  }
  @keyframes glow-pulse {
    0%,100%{box-shadow:0 0 24px rgba(59,130,246,.22),0 25px 50px rgba(59,130,246,.1)}
    50%{box-shadow:0 0 60px rgba(59,130,246,.55),0 30px 80px rgba(139,92,246,.18)}
  }
  @keyframes gradient-shift {
    0%,100%{background-position:0% 50%}
    50%{background-position:100% 50%}
  }
  @keyframes bounce-y {
    0%,100%{transform:translateX(-50%) translateY(0)}
    50%{transform:translateX(-50%) translateY(8px)}
  }
  @keyframes hero-in {
    from{opacity:0;transform:translateY(32px)}
    to{opacity:1;transform:translateY(0)}
  }
  @keyframes badge-in {
    from{opacity:0;transform:scale(.8) translateY(-8px)}
    to{opacity:1;transform:scale(1) translateY(0)}
  }
  @keyframes ring-expand {
    0%{transform:scale(1);opacity:.6}
    100%{transform:scale(2.2);opacity:0}
  }
  @keyframes step-icon-in {
    from{opacity:0;transform:scale(.6) rotate(-12deg)}
    to{opacity:1;transform:scale(1) rotate(0deg)}
  }
`;

const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

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

const steps = [
  {
    num: '01',
    title: 'נרשמים ב-30 שניות',
    desc: 'פותחים חשבון, מגדירים שם עסק ושעות פעילות. אין צורך בכרטיס אשראי.',
    icon: (
      <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'מגדירים את השירותים',
    desc: 'מוסיפים סוגי טיפול, עובדים ומחירים. מקבלים עמוד הזמנה אישי מוכן.',
    icon: (
      <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'לקוחות קובעים לבד',
    desc: 'שולחים ללקוחות לינק אחד — הם בוחרים שירות, תאריך ושעה בלי לטלפן.',
    icon: (
      <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const testimonials = [
  {
    name: 'שירה כהן',
    role: 'מעצבת שיער, תל אביב',
    text: 'FlowMatic חסך לי שעות של ניהול ידני. הלקוחות שלי קובעות תורים בעצמן בלילה ואני מקבלת התראה בבוקר.',
    avatar: 'ש',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    name: 'מיכל לוי',
    role: 'נטורופתית, ירושלים',
    text: 'הדוחות החודשיים נותנים לי תמונה ברורה על ההכנסות והשעות העמוסות. שינה לי את האופן שבו אני מנהלת את הקליניקה.',
    avatar: 'מ',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    name: 'יוסי אברהם',
    role: 'מאמן כושר אישי, חיפה',
    text: 'ביטולי הרגע האחרון ירדו ב-70% מאז שהפעלתי תזכורות SMS אוטומטיות. השקעה שמחזירה את עצמה בחודש הראשון.',
    avatar: 'י',
    gradient: 'from-emerald-500 to-emerald-600',
  },
];

const statsData = [
  { target: 500, display: n => `${n}+`, label: 'לקוחות בעסק ממוצע' },
  {
    target: 3000,
    display: n => n < 1000 ? `${n}` : `${Math.floor(n / 1000)},${String(n % 1000).padStart(3, '0')}+`,
    label: 'תורים לחודש',
  },
  { target: null, staticDisplay: '24/7', label: 'זמינות מערכת' },
  { target: 120, display: n => `₪${n}`, label: 'בלבד לחודש' },
];

const StatCounter = ({ stat, inView }) => {
  const [val, setVal] = useState(() =>
    stat.target == null ? stat.staticDisplay : stat.display(0)
  );

  useEffect(() => {
    if (!inView || stat.target == null) return;
    const dur = 1800;
    const t0 = Date.now();
    const frame = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(stat.display(Math.floor(eased * stat.target)));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [inView]); // eslint-disable-line

  return (
    <div className="text-4xl font-black bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
      {val}
    </div>
  );
};

const LandingPage = () => {
  const { isDark } = useTheme();
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [scrollY, setScrollY] = useState(0);

  const [howRef, howInView] = useInView(0.1);
  const [featRef, featInView] = useInView(0.05);
  const [statsRef, statsInView] = useInView(0.2);
  const [testiRef, testiInView] = useInView(0.1);
  const [pricingRef, pricingInView] = useInView(0.15);
  const [ctaRef, ctaInView] = useInView(0.2);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMouseMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <div dir="rtl" className={isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}>
      <style>{KEYFRAMES}</style>

      {/* ─── Hero ─── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden pt-20 pb-36 px-6"
        onMouseMove={handleMouseMove}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(148,163,184,0.07)' : 'rgba(100,116,139,0.09)'} 1.5px, transparent 1.5px)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Floating blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-[700px] h-[700px]"
            style={{ animation: 'float 9s ease-in-out infinite' }}
          >
            <div
              className="w-full h-full bg-blue-500/10 rounded-full blur-3xl"
              style={{
                transform: `translate(${mousePos.x * 38 - 19}px, ${mousePos.y * 38 - 19}px)`,
                transition: 'transform 0.7s ease',
              }}
            />
          </div>
          <div
            className="absolute top-60 -left-40 w-[520px] h-[520px]"
            style={{ animation: 'float2 11s ease-in-out infinite' }}
          >
            <div
              className="w-full h-full bg-purple-500/10 rounded-full blur-3xl"
              style={{
                transform: `translate(${-mousePos.x * 24 + 12}px, ${mousePos.y * 24 - 12}px)`,
                transition: 'transform 0.7s ease',
              }}
            />
          </div>
          <div
            className="absolute -bottom-20 right-1/3 w-[280px] h-[280px]"
            style={{ animation: 'float 13s ease-in-out infinite 3s' }}
          >
            <div className="w-full h-full bg-cyan-400/5 rounded-full blur-3xl" />
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-blue-100 dark:border-blue-500/20"
            style={{ animation: 'badge-in 0.6s cubic-bezier(.34,1.56,.64,1) forwards' }}
          >
            <span className="relative flex">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span
                className="absolute inset-0 w-2 h-2 bg-blue-400 rounded-full"
                style={{ animation: 'ring-expand 1.5s ease-out infinite' }}
              />
            </span>
            מערכת ניהול תורים חכמה לעסק שלך
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 tracking-tight"
            style={{ animation: 'hero-in 0.7s ease 0.1s both' }}
          >
            ניהול העסק שלך,{' '}
            <span
              style={{
                background: 'linear-gradient(270deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)',
                backgroundSize: '300% 300%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer-text 5s ease infinite',
              }}
            >
              בקליק אחד
            </span>
          </h1>

          <p
            className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ animation: 'hero-in 0.7s ease 0.2s both' }}
          >
            מערכת מקצועית לניהול תורים, לקוחות ועובדים —
            מותאמת במיוחד לעסקים ישראליים קטנים ובינוניים
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ animation: 'hero-in 0.7s ease 0.3s both' }}
          >
            <Link
              to="/register"
              className="relative overflow-hidden bg-gradient-to-l from-blue-600 to-blue-500 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-200 active:scale-95 hover:shadow-blue-500/50 hover:scale-[1.04]"
            >
              התחל עכשיו — בחינם
            </Link>
            <Link
              to="/login"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-200 active:scale-95 hover:scale-[1.04]"
            >
              יש לי חשבון ←
            </Link>
          </div>

          <p
            className="mt-6 text-sm text-slate-400 dark:text-slate-500"
            style={{ animation: 'hero-in 0.7s ease 0.4s both' }}
          >
            ללא כרטיס אשראי · ביטול בכל עת · ניסיון חינמי ל-14 יום
          </p>

          {scrollY < 80 && (
            <div
              className="absolute bottom-[-48px] left-1/2 text-slate-400 dark:text-slate-600"
              style={{ animation: 'bounce-y 1.6s ease-in-out infinite' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      </section>

      {/* ─── Ticker ─── */}
      <section className={`py-14 overflow-hidden ${isDark ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest text-center mb-6">
          מושלם עבור
        </p>
        <div className="relative">
          <div
            className="absolute right-0 top-0 bottom-0 w-28 z-10 pointer-events-none"
            style={{
              background: isDark
                ? 'linear-gradient(to left, rgb(15,23,42), transparent)'
                : 'linear-gradient(to left, rgb(248,250,252), transparent)',
            }}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-28 z-10 pointer-events-none"
            style={{
              background: isDark
                ? 'linear-gradient(to right, rgb(15,23,42), transparent)'
                : 'linear-gradient(to right, rgb(248,250,252), transparent)',
            }}
          />
          <div
            className="flex gap-3 whitespace-nowrap"
            style={{
              width: 'max-content',
              direction: 'ltr',
              animation: 'ticker 22s linear infinite',
            }}
          >
            {[...businesses, ...businesses].map((b, i) => (
              <span
                key={i}
                className={`px-4 py-2 rounded-full text-sm font-medium border shadow-sm shrink-0
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

      {/* ─── How it works ─── */}
      <section ref={howRef} className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-black mb-4"
              style={{ opacity: 0, animation: howInView ? 'slide-up 0.6s ease forwards' : 'none' }}
            >
              שלושה צעדים להתחלה
            </h2>
            <p
              className="text-slate-500 dark:text-slate-400 text-lg"
              style={{ opacity: 0, animation: howInView ? 'slide-up 0.6s ease 0.1s forwards' : 'none' }}
            >
              מהרשמה לתור ראשון — פחות מ-5 דקות
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-start gap-2">
            {steps.map((step, i) => (
              <Fragment key={step.num}>
                <div
                  className="flex-1 text-center px-4"
                  style={{
                    opacity: 0,
                    animation: howInView ? `slide-up 0.65s ease ${0.1 + i * 0.18}s forwards` : 'none',
                  }}
                >
                  <div className="relative inline-flex mb-5">
                    <div
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
                      style={{
                        animation: howInView ? `step-icon-in 0.5s cubic-bezier(.34,1.56,.64,1) ${0.25 + i * 0.18}s both` : 'none',
                      }}
                    >
                      {step.icon}
                    </div>
                    <span className={`absolute -top-2 -right-2 w-7 h-7 text-xs font-black rounded-full flex items-center justify-center
                      ${isDark ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-white'}`}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-48 mx-auto">{step.desc}</p>
                </div>

                {i < steps.length - 1 && (
                  <div
                    className="hidden md:flex items-center justify-center mt-10 shrink-0 text-slate-300 dark:text-slate-700"
                    style={{
                      opacity: 0,
                      animation: howInView ? `slide-up 0.4s ease ${0.3 + i * 0.18}s forwards` : 'none',
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          <div
            className="mt-12 text-center"
            style={{
              opacity: 0,
              animation: howInView ? 'slide-up 0.6s ease 0.65s forwards' : 'none',
            }}
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline text-sm"
            >
              התחל עכשיו בחינם
              <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section ref={featRef} className={`py-24 px-6 ${isDark ? 'bg-slate-900/40' : 'bg-slate-50'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-black mb-4"
              style={{ opacity: 0, animation: featInView ? 'slide-up 0.6s ease forwards' : 'none' }}
            >
              הכל במקום אחד
            </h2>
            <p
              className="text-slate-500 dark:text-slate-400 text-lg"
              style={{ opacity: 0, animation: featInView ? 'slide-up 0.6s ease 0.1s forwards' : 'none' }}
            >
              כלים שכל עסק צריך — ממשק שכל אחד יכול להפעיל
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                style={{
                  opacity: 0,
                  animation: featInView ? `slide-up 0.65s ease ${0.18 + i * 0.09}s forwards` : 'none',
                }}
                className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group cursor-default
                  ${isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-blue-500/30 hover:shadow-blue-900/20'
                    : 'bg-white border-slate-100 hover:border-blue-100 hover:shadow-blue-50/80'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${colorMap[f.color]}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section ref={statsRef} className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {statsData.map((s, i) => (
              <div
                key={s.label}
                style={{
                  opacity: 0,
                  animation: statsInView ? `slide-up 0.6s ease ${i * 0.1}s forwards` : 'none',
                }}
              >
                <StatCounter stat={s} inView={statsInView} />
                <div className="text-sm text-slate-500 dark:text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section ref={testiRef} className={`py-24 px-6 ${isDark ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-black mb-4"
              style={{ opacity: 0, animation: testiInView ? 'slide-up 0.6s ease forwards' : 'none' }}
            >
              מה אומרים עלינו
            </h2>
            <p
              className="text-slate-500 dark:text-slate-400 text-lg"
              style={{ opacity: 0, animation: testiInView ? 'slide-up 0.6s ease 0.1s forwards' : 'none' }}
            >
              עסקים שכבר מנהלים את התורים שלהם עם FlowMatic
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                style={{
                  opacity: 0,
                  animation: testiInView ? `slide-up 0.65s ease ${i * 0.12}s forwards` : 'none',
                }}
                className={`p-6 rounded-2xl border flex flex-col gap-4
                  ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${t.gradient} shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section ref={pricingRef} className="py-24 px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2
            className="text-4xl font-black mb-4"
            style={{ opacity: 0, animation: pricingInView ? 'slide-up 0.6s ease forwards' : 'none' }}
          >
            מחיר פשוט. ללא הפתעות.
          </h2>
          <p
            className="text-slate-500 dark:text-slate-400 text-lg mb-12"
            style={{ opacity: 0, animation: pricingInView ? 'slide-up 0.6s ease 0.1s forwards' : 'none' }}
          >
            תשלום חודשי קבוע, ביטול בכל עת
          </p>

          <div
            style={{
              opacity: 0,
              animation: pricingInView
                ? 'fade-scale 0.7s ease 0.2s forwards, glow-pulse 3.5s ease-in-out 1.2s infinite'
                : 'none',
            }}
            className={`relative rounded-3xl p-8 border-2 border-blue-500
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
              {included.map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-3"
                  style={{
                    opacity: 0,
                    animation: pricingInView ? `slide-up 0.4s ease ${0.35 + i * 0.06}s forwards` : 'none',
                  }}
                >
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
              className="block w-full bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95 hover:scale-[1.02] text-center"
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
      <section
        ref={ctaRef}
        className="py-24 px-6 relative overflow-hidden"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 50%, #ecfdf5 100%)',
          backgroundSize: '300% 300%',
          animation: ctaInView ? 'gradient-shift 7s ease infinite' : 'none',
        }}
      >
        <div
          className="absolute top-8 right-12 w-28 h-28 border border-blue-500/15 rounded-full pointer-events-none"
          style={{ animation: 'float 7s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-8 left-12 w-20 h-20 border border-purple-500/15 rounded-full pointer-events-none"
          style={{ animation: 'float2 9s ease-in-out infinite' }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2
            className="text-4xl font-black mb-4"
            style={{ opacity: 0, animation: ctaInView ? 'slide-up 0.6s ease forwards' : 'none' }}
          >
            מוכן להתחיל?
          </h2>
          <p
            className="text-slate-500 dark:text-slate-400 text-lg mb-10"
            style={{ opacity: 0, animation: ctaInView ? 'slide-up 0.6s ease 0.1s forwards' : 'none' }}
          >
            הצטרף לעסקים שכבר מנהלים את התורים שלהם באמצעות FlowMatic
          </p>
          <Link
            to="/register"
            style={{ opacity: 0, animation: ctaInView ? 'slide-up 0.6s ease 0.2s forwards' : 'none' }}
            className="inline-block bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-200 active:scale-95 hover:scale-105"
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
