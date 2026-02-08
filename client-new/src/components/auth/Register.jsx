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
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">הרשמה למערכת</h2>
          <p className="text-gray-600">צור חשבון עסקי חדש ב-FlowMatic</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-right font-semibold text-gray-700 mb-2">
              שם מלא *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="הכנס שם מלא"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-right focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Business Name */}
          <div>
            <label htmlFor="businessName" className="block text-right font-semibold text-gray-700 mb-2">
              שם העסק *
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="למשל: סלון יעל"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-right focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Row: Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-right font-semibold text-gray-700 mb-2">
                אימייל *
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-right font-semibold text-gray-700 mb-2">
                טלפון *
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-right font-semibold text-gray-700 mb-2">
              שם משתמש (לקישור הציבורי) *
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
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg text-left focus:outline-none focus:ring-2 transition-all ${
                  usernameStatus.available === true
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                    : usernameStatus.available === false
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                }`}
              />
              {/* Status indicator */}
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {usernameStatus.checking && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                )}
                {!usernameStatus.checking && usernameStatus.available === true && (
                  <span className="text-green-500 text-xl">✓</span>
                )}
                {!usernameStatus.checking && usernameStatus.available === false && (
                  <span className="text-red-500 text-xl">✗</span>
                )}
              </div>
            </div>
            {/* Status message */}
            {formData.username && usernameStatus.message && (
              <p className={`mt-2 text-sm font-medium text-center py-2 px-3 rounded-lg ${
                usernameStatus.available === true
                  ? 'text-green-700 bg-green-100'
                  : usernameStatus.available === false
                  ? 'text-red-700 bg-red-100'
                  : 'text-gray-700 bg-gray-100'
              }`}>
                {usernameStatus.message}
              </p>
            )}
            {formData.username && usernameStatus.available === true && (
              <p className="mt-2 text-sm text-primary font-medium text-center bg-primary/10 py-2 px-3 rounded-lg">
                🔗 הקישור שלך: {window.location.origin}/{formData.username}
              </p>
            )}
          </div>

          {/* Row: Password & Confirm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-right font-semibold text-gray-700 mb-2">
                סיסמה *
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password2" className="block text-right font-semibold text-gray-700 mb-2">
                אימות סיסמה *
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isRegisterLoading || usernameStatus.available !== true}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-6"
          >
            {isRegisterLoading ? 'נרשם...' : 'הירשם'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            יש לך חשבון?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              התחבר כאן
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
