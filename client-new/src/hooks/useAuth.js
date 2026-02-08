import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      context.login(data.token);
      toast.success('התחברת בהצלחה!');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'שגיאה בהתחברות');
    }
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      console.log('✅ Registration successful, data:', data);

      if (!data.token) {
        console.error('❌ No token in response:', data);
        toast.error('שגיאה: לא התקבל token מהשרת');
        return;
      }

      try {
        context.login(data.token);
        toast.success('נרשמת בהצלחה!');
        navigate('/dashboard');
      } catch (err) {
        console.error('❌ Error during login:', err);
        toast.error('שגיאה בהתחברות אחרי רישום');
      }
    },
    onError: (error) => {
      console.error('❌ Registration error:', error);

      const errorData = error.response?.data || error;

      // Handle validation errors (multiple fields)
      if (errorData && typeof errorData === 'object' && !errorData.message) {
        // Show all validation errors
        Object.values(errorData).forEach(err => {
          if (typeof err === 'string') {
            toast.error(err);
          }
        });
      } else {
        // Show single error message
        toast.error(errorData?.message || errorData?.email || errorData?.username || 'שגיאה בהרשמה');
      }
    }
  });

  return {
    ...context,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending
  };
};
