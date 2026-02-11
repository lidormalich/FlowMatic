import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { usersApi } from '../../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    password2: '',
    role: 'business_owner',
    businessName: '',
    phoneNumber: '',
  });

  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: ''
  });

  const navigate = useNavigate();
  const { isAuthenticated, register, isRegisterLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Check username availability with debounce
  useEffect(() => {
    const checkUsername = async () => {
      const username = formData.username.trim();

      // Reset if empty
      if (!username) {
        setUsernameStatus({ checking: false, available: null, message: '' });
        return;
      }

      // Check format first (client-side)
      if (!username.match(/^[a-z0-9-]+$/)) {
        setUsernameStatus({
          checking: false,
          available: false,
          message: 'שם המשתמש יכול להכיל רק אותיות אנגליות קטנות, מספרים ומקפים'
        });
        return;
      }

      // Check availability (server-side)
      setUsernameStatus({ checking: true, available: null, message: 'בודק...' });

      try {
        const response = await usersApi.checkUsername(username);
        setUsernameStatus({
          checking: false,
          available: response.data.available,
          message: response.data.message
        });
      } catch (error) {
        setUsernameStatus({
          checking: false,
          available: false,
          message: 'שגיאה בבדיקת שם משתמש'
        });
      }
    };

    // Debounce - wait 500ms after user stops typing
    const timeoutId = setTimeout(checkUsername, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (formData.password !== formData.password2) {
      toast.error('הסיסמאות אינן תואמות');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (!formData.username.match(/^[a-z0-9-]+$/)) {
      toast.error('שם המשתמש יכול להכיל רק אותיות אנגליות קטנות, מספרים ומקפים');
      return;
    }

    // Check if username is available
    if (usernameStatus.available !== true) {
      toast.error('שם המשתמש לא זמין או לא תקין');
      return;
    }

    register(formData);
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-slate-50 p-4 md:p-8 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl" />

      <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-sm p-6 md:p-8 w-full max-w-2xl animate-scale-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">הרשמה למערכת</h2>
          <p className="text-slate-500">צור חשבון עסקי חדש ב-FlowMatic</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-right text-sm font-semibold text-slate-700 mb-2">
              שם מלא <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="הכנס שם מלא"
              required
              className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right
                       placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                       transition-all duration-200 outline-none"
            />
          </div>

          {/* Business Name */}
          <div>
            <label htmlFor="businessName" className="block text-right text-sm font-semibold text-slate-700 mb-2">
              שם העסק <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="למשל: סלון יעל"
              required
              className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right
                       placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                       transition-all duration-200 outline-none"
            />
          </div>

          {/* Row: Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-right text-sm font-semibold text-slate-700 mb-2">
                אימייל <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                dir="ltr"
                className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-left
                         placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                         transition-all duration-200 outline-none"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-right text-sm font-semibold text-slate-700 mb-2">
                טלפון <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="050-1234567"
                required
                dir="ltr"
                className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-left
                         placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                         transition-all duration-200 outline-none"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-right text-sm font-semibold text-slate-700 mb-2">
              שם משתמש (לקישור הציבורי) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="למשל: salon-yael"
                required
                dir="ltr"
                pattern="[a-z0-9\-]+"
                title="רק אותיות אנגליות קטנות, מספרים ומקפים"
                className={`w-full h-12 border-0 rounded-2xl pl-12 pr-4 text-slate-900 text-left
                         placeholder:text-slate-400 focus:ring-2 transition-all duration-200 outline-none ${
                           usernameStatus.available === true
                             ? 'bg-green-50 focus:ring-green-500'
                             : usernameStatus.available === false
                               ? 'bg-red-50 focus:ring-red-500'
                               : 'bg-slate-100 focus:ring-blue-500 focus:bg-white'
                         }`}
              />
              {/* Status indicator */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                {usernameStatus.checking && (
                  <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                )}
                {!usernameStatus.checking && usernameStatus.available === true && (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {!usernameStatus.checking && usernameStatus.available === false && (
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
            {/* Status message */}
            {formData.username && usernameStatus.message && (
              <p className={`mt-2 text-sm font-medium text-center py-2 px-3 rounded-xl ${
                usernameStatus.available === true
                  ? 'text-green-700 bg-green-100'
                  : usernameStatus.available === false
                    ? 'text-red-700 bg-red-100'
                    : 'text-slate-600 bg-slate-100'
              }`}>
                {usernameStatus.message}
              </p>
            )}
            {formData.username && usernameStatus.available === true && (
              <p className="mt-2 text-sm text-blue-700 font-medium text-center bg-blue-50 py-2 px-3 rounded-xl flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>הקישור שלך: {window.location.origin}/book/{formData.username}</span>
              </p>
            )}
          </div>

          {/* Row: Password & Confirm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-right text-sm font-semibold text-slate-700 mb-2">
                סיסמה <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="לפחות 6 תווים"
                required
                dir="ltr"
                minLength="6"
                className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-left
                         placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                         transition-all duration-200 outline-none"
              />
            </div>

            <div>
              <label htmlFor="password2" className="block text-right text-sm font-semibold text-slate-700 mb-2">
                אימות סיסמה <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password2"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                placeholder="הכנס סיסמה שוב"
                required
                dir="ltr"
                minLength="6"
                className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-left
                         placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white
                         transition-all duration-200 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isRegisterLoading || usernameStatus.available !== true}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-full
                     shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 mt-6"
          >
            {isRegisterLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                נרשם...
              </span>
            ) : 'הירשם'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-500">
            יש לך חשבון?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-500 transition-colors">
              התחבר כאן
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
