import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../services/api';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      toast.success('אם כתובת האימייל קיימת במערכת, נשלח אליך קישור לאיפוס סיסמה');
      setEmail('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'שגיאה בשליחת הבקשה');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('נא להזין כתובת אימייל');
      return;
    }

    forgotPasswordMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">שכחת סיסמה?</h1>
          <p className="text-gray-600">הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס סיסמה</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 font-semibold mb-2 text-right">
              כתובת אימייל
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
              placeholder="your@email.com"
              dir="ltr"
              required
            />
          </div>

          <button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {forgotPasswordMutation.isPending ? 'שולח...' : 'שלח קישור לאיפוס סיסמה'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <Link
            to="/login"
            className="block text-primary hover:text-secondary font-semibold transition-colors"
          >
            ← חזרה להתחברות
          </Link>
          <div className="text-gray-600 text-sm">
            אין לך חשבון?{' '}
            <Link to="/register" className="text-primary hover:text-secondary font-semibold">
              הירשם עכשיו
            </Link>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border-r-4 border-blue-500 rounded">
          <p className="text-sm text-blue-800 text-right">
            <strong>טיפ:</strong> אם לא קיבלת את המייל, בדוק את תיקיית הספאם או נסה שוב
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
