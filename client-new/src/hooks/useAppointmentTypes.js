import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentTypesApi } from '../services/api';
import { toast } from 'react-toastify';

export const useAppointmentTypes = () => {
  const queryClient = useQueryClient();

  // Fetch all appointment types
  const { data: appointmentTypes, isLoading, error } = useQuery({
    queryKey: ['appointmentTypes'],
    queryFn: appointmentTypesApi.getAll,
    onError: (error) => {
      console.error('Error fetching appointment types:', error);
      toast.error('שגיאה בטעינת סוגי התורים');
    }
  });

  // Create appointment type mutation
  const createMutation = useMutation({
    mutationFn: appointmentTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointmentTypes'] });
      toast.success('סוג תור חדש נוסף בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה ביצירת סוג התור');
    }
  });

  // Update appointment type mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointmentTypes'] });
      toast.success('סוג התור עודכן בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה בעדכון סוג התור');
    }
  });

  // Delete appointment type mutation
  const deleteMutation = useMutation({
    mutationFn: appointmentTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointmentTypes'] });
      toast.success('סוג התור נמחק בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה במחיקת סוג התור');
    }
  });

  return {
    appointmentTypes: appointmentTypes || [],
    isLoading,
    error,
    createAppointmentType: createMutation.mutate,
    updateAppointmentType: updateMutation.mutate,
    deleteAppointmentType: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
