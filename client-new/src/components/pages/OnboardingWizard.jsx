import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const DAYS = [
  { label: 'א׳', value: 0 },
  { label: 'ב׳', value: 1 },
  { label: 'ג׳', value: 2 },
  { label: 'ד׳', value: 3 },
  { label: 'ה׳', value: 4 },
  { label: 'ו׳', value: 5 },
  { label: 'ש׳', value: 6 },
];

const BUSINESS_TYPES = [
  { label: 'ספרות', icon: '✂️' },
  { label: 'קוסמטיקה', icon: '💄' },
  { label: 'ציפורניים', icon: '💅' },
  { label: 'פיזיותרפיה', icon: '🏃' },
  { label: 'אימון כושר', icon: '💪' },
  { label: 'נטורופתיה', icon: '🌿' },
  { label: 'פסיכולוגיה', icon: '🧠' },
  { label: 'ייעוץ עסקי', icon: '💼' },
  { label: 'אחר', icon: '⚡' },
];

const SYSTEM_FEATURES = [
  { icon: '📅', title: 'לוח תורים', desc: 'ניהול כל התורים בתצוגת יומן נוחה. קבע, ערוך ובטל בלחיצה.' },
  { icon: '👥', title: 'לקוחות', desc: 'כרטסת מלאה עם היסטוריה, פרטי קשר ומעקב הכנסות.' },
  { icon: '📊', title: 'דוחות', desc: 'הכנסות ותורים בגרפים. דע תמיד מה קורה בעסק שלך.' },
  { icon: '📱', title: 'התראות', desc: 'תזכורות אוטומטיות ללקוחות — פחות ביטולים, יותר הכנסות.' },
  { icon: '🔗', title: 'הזמנה עצמית', desc: 'לקוחות קובעים תור 24/7 דרך הלינק האישי שלך.' },
  { icon: '⚙️', title: 'הגדרות', desc: 'שעות פעילות, צבעי מותג ומדיניות ביטול — הכל שלך.' },
];

const STEP_LABELS = ['פרטי העסק', 'שעות פעילות', 'שירותים', 'סיור במערכת'];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const OnboardingWizard = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Step 0
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessType, setBusinessType] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  // Step 1
  const [workingDays, setWorkingDays] = useState([0, 1, 2, 3, 4]);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);

  // Step 2
  const [services, setServices] = useState([{ id: 1, name: '', duration: 60, price: '' }]);

  const toggleDay = (val) =>
    setWorkingDays(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val].sort());

  const addService = () =>
    setServices(prev => [...prev, { id: Date.now(), name: '', duration: 60, price: '' }]);

  const removeService = (id) =>
    setServices(prev => prev.filter(s => s.id !== id));

  const updateService = (id, field, value) =>
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const canNext = () => {
    if (step === 0) return businessName.trim().length >= 2;
    if (step === 1) return workingDays.length > 0 && endHour > startHour;
    if (step === 2) return services.some(s => s.name.trim().length > 0);
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.put('/users/onboarding', {
        businessName: businessName.trim(),
        businessType,
        phoneNumber: phoneNumber.trim(),
        businessHours: { startHour, endHour, workingDays },
        services: services
          .filter(s => s.name.trim())
          .map(s => ({ name: s.name.trim(), duration: s.duration, price: Number(s.price) || 0 })),
      });
      await refreshUser();
      setDone(true);
    } catch {
      toast.error('שגיאה בשמירת הנתונים, נסה שנית');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all duration-200
    ${isDark
      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
    }`;

  const cardCls = `rounded-2xl border p-4
    ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`;

  if (done) {
    return (
      <div
        dir="rtl"
        className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className={`relative w-full max-w-sm rounded-3xl shadow-2xl p-10 border text-center
          ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-5xl mx-auto mb-6 shadow-xl shadow-blue-500/30 animate-bounce">
            🎉
          </div>
          <h2 className="text-3xl font-black mb-3">הכל מוכן!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            העסק שלך מוגדר ומוכן לפעולה.<br />
            בוא נתחיל לנהל תורים!
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full h-14 bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-200 active:scale-95"
          >
            כניסה לדאשבורד ←
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">

        {/* ── Step indicator ── */}
        <div className="mb-6 px-1">
          <div className="relative flex items-start justify-between">
            {/* connecting line bg */}
            <div className={`absolute top-4 right-4 left-4 h-0.5 -z-10 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            {/* progress fill */}
            <div
              className="absolute top-4 right-4 h-0.5 -z-10 bg-gradient-to-l from-blue-500 to-purple-600 transition-all duration-500"
              style={{ width: `calc(${(step / (STEP_LABELS.length - 1)) * 100}% - 2rem)` }}
            />
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${i < step
                    ? 'bg-blue-500 text-white'
                    : i === step
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                      : isDark ? 'bg-slate-900 border-2 border-slate-700 text-slate-500' : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block whitespace-nowrap
                  ${i === step ? 'text-blue-500' : 'text-slate-400'}`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Card ── */}
        <div className={`rounded-3xl shadow-2xl p-8 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>

          {/* ── STEP 0 — Business Info ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <div className="text-4xl mb-3">👋</div>
                <h2 className="text-2xl font-black mb-1">ברוכים הבאים ל-FlowMatic!</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  בואו נגדיר את העסק שלך — ייקח 2 דקות
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">שם העסק *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="לדוגמה: ספרות מושיקו"
                  className={inputCls}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">תחום העסק</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map(bt => (
                    <button
                      key={bt.label}
                      type="button"
                      onClick={() => setBusinessType(bt.label)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all duration-200 active:scale-95
                        ${businessType === bt.label
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : isDark
                            ? 'border-slate-700 text-slate-400 hover:border-slate-600'
                            : 'border-slate-200 text-slate-600 hover:border-blue-200'
                        }`}
                    >
                      <span className="text-xl">{bt.icon}</span>
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">טלפון העסק</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="050-0000000"
                  dir="ltr"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* ── STEP 1 — Business Hours ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="text-4xl mb-3">🕐</div>
                <h2 className="text-2xl font-black mb-1">שעות פעילות</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">מתי העסק שלך פתוח?</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3">ימי עבודה</label>
                <div className="flex gap-2 justify-between">
                  {DAYS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`w-11 h-11 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95
                        ${workingDays.includes(d.value)
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                          : isDark
                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">שעת פתיחה</label>
                  <select value={startHour} onChange={e => setStartHour(+e.target.value)} className={inputCls}>
                    {HOURS.map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">שעת סגירה</label>
                  <select value={endHour} onChange={e => setEndHour(+e.target.value)} className={inputCls}>
                    {HOURS.map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              </div>

              {endHour <= startHour && (
                <p className="text-red-500 text-xs">שעת הסגירה חייבת להיות אחרי שעת הפתיחה</p>
              )}
            </div>
          )}

          {/* ── STEP 2 — Services ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="text-4xl mb-3">✂️</div>
                <h2 className="text-2xl font-black mb-1">השירותים שלך</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  הוסף את השירותים שאתה מציע — כמה שתרצה
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pl-1 -mr-1 pr-1">
                {services.map((s, idx) => (
                  <div key={s.id} className={cardCls}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        שירות {idx + 1}
                      </span>
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeService(s.id)}
                          className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/10 text-red-500 flex items-center justify-center text-xs hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
                          aria-label="הסר שירות"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={s.name}
                        onChange={e => updateService(s.id, 'name', e.target.value)}
                        placeholder="שם השירות (לדוגמה: תספורת גברים)"
                        className={inputCls}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">משך (דקות)</label>
                          <select
                            value={s.duration}
                            onChange={e => updateService(s.id, 'duration', +e.target.value)}
                            className={inputCls + ' h-10 text-xs'}
                          >
                            {[15, 20, 30, 45, 60, 75, 90, 120].map(d => (
                              <option key={d} value={d}>{d} דק׳</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">מחיר (₪)</label>
                          <input
                            type="number"
                            value={s.price}
                            onChange={e => updateService(s.id, 'price', e.target.value)}
                            placeholder="0"
                            min="0"
                            className={inputCls + ' h-10 text-xs'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addService}
                className={`w-full h-11 rounded-xl border-2 border-dashed text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95
                  ${isDark
                    ? 'border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/5'
                    : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50'
                  }`}
              >
                <span className="text-lg leading-none">+</span>
                הוסף שירות נוסף
              </button>
            </div>
          )}

          {/* ── STEP 3 — System Tour ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="text-4xl mb-3">🗺️</div>
                <h2 className="text-2xl font-black mb-1">מה תוכל לעשות עם FlowMatic?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  סיור קצר לפני שנצא לדרך
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SYSTEM_FEATURES.map(f => (
                  <div
                    key={f.title}
                    className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5
                      ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="font-bold text-sm mb-1">{f.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</div>
                  </div>
                ))}
              </div>

              <div className={`rounded-xl p-4 text-sm border ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                💡 אפשר לשנות הכל אחר כך — שעות פעילות, שירותים, צבעי המותג ועוד, הכל בהגדרות.
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className={`flex gap-3 mt-8 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95
                  ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                ← חזרה
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex-1 h-11 bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                המשך →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 h-11 bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    שומר...
                  </>
                ) : (
                  'סיים והתחל! 🚀'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
