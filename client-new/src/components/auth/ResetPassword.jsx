import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../services/api';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Verify token validity
  const { data: tokenValidation, isLoading: isValidating } = useQuery({
    queryKey: ['verifyResetToken', token],
    queryFn: () => authApi.verifyResetToken(token),
    retry: false
  });

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success('הסיסמה שונתה בהצלחה! מעביר להתחברות...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'שגיאה באיפוס הסיסמה');
    }
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error('נא למלא את כל השדות');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('הסיסמאות אינן תואמות');
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: formData.newPassword
    });
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600 text-lg">מאמת קישור...</p>
        </div>
      </div>
    );
  }

  if (!tokenValidation?.data?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">קישור לא תקין</h1>
          <p className="text-gray-600 mb-6">
            הקישור לאיפוס סיסמה אינו תקין או שפג תוקפו
          </p>
          <Link
            to="/forgot-password"
            className="inline-block bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            בקש קישור חדש
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔑</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">איפוס סיסמה</h1>
          <p className="text-gray-600">הזן את הסיסמה החדשה שלך</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-gray-700 font-semibold mb-2 text-right">
              סיסמה חדשה
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
              placeholder="לפחות 6 תווים"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-2 text-right">
              אימות סיסמה
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
              placeholder="הזן את הסיסמה שוב"
              required
              minLength={6}
            />
          </div>

          {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <div className="p-3 bg-red-50 border-r-4 border-red-500 rounded text-right">
              <p className="text-sm text-red-700">הסיסמאות אינן תואמות</p>
            </div>
          )}

          <button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {resetPasswordMutation.isPending ? 'מאפס סיסמה...' : 'אפס סיסמה'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-primary hover:text-secondary font-semibold transition-colors"
          >
            ← חזרה להתחברות
          </Link>
        </div>

        <div className="mt-8 p-4 bg-green-50 border-r-4 border-green-500 rounded">
          <p className="text-sm text-green-800 text-right">
            <strong>טיפ אבטחה:</strong> השתמש בסיסמה חזקה המכילה אותיות, מספרים ותווים מיוחדים
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
