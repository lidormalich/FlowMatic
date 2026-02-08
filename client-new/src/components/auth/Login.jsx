import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const navigate = useNavigate();
  const { isAuthenticated, login, isLoginLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">התחברות למערכת</h2>
          <p className="text-gray-600">ברוכים הבאים ל-FlowMatic</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-right font-semibold text-gray-700 mb-2">
              אימייל
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="הכנס אימייל"
              required
              dir="ltr"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-right font-semibold text-gray-700 mb-2">
              סיסמה
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="הכנס סיסמה"
              required
              dir="ltr"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-primary hover:text-secondary text-sm font-semibold">
              שכחת סיסמה?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoginLoading}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoginLoading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            אין לך חשבון?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              הירשם כאן
            </Link>
          </p>
        </div>

        {/* Built-in admin credentials hint */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 text-center">
            <strong>משתמש ברירת מחדל:</strong><br />
            admin@flowmatic.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
