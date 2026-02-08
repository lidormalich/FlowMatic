import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../services/api';
import { toast } from 'react-toastify';

export const useUsers = () => {
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    onError: (error) => {
      console.error('Error fetching users:', error);
      toast.error('שגיאה בטעינת משתמשים');
    }
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('המשתמש נוסף בהצלחה');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.email || error.response?.data?.message || 'שגיאה בהוספת משתמש';
      toast.error(errorMsg);
    }
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('המשתמש עודכן בהצלחה');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || 'שגיאה בעדכון משתמש';
      toast.error(errorMsg);
    }
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('המשתמש נמחק בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה במחיקת משתמש');
    }
  });

  // Suspend/Unsuspend user mutation
  const suspendMutation = useMutation({
    mutationFn: ({ id, suspend }) => usersApi.suspend(id, suspend),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'סטטוס המשתמש עודכן בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה בעדכון סטטוס המשתמש');
    }
  });

  // Update credits mutation
  const updateCreditsMutation = useMutation({
    mutationFn: ({ id, amount }) => usersApi.updateCredits(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('הקרדיטים עודכנו בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה בעדכון קרדיטים');
    }
  });

  return {
    users: users || [],
    isLoading,
    error,
    createUser: createMutation.mutate,
    updateUser: updateMutation.mutate,
    deleteUser: deleteMutation.mutate,
    suspendUser: suspendMutation.mutate,
    updateCredits: updateCreditsMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSuspending: suspendMutation.isPending,
    isUpdatingCredits: updateCreditsMutation.isPending
  };
};
