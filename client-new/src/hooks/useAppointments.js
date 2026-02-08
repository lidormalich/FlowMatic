import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../services/api';
import { toast } from 'react-toastify';

export const useAppointments = () => {
  const queryClient = useQueryClient();

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentsApi.getAll
  });

  const createMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('התור נוצר בהצלחה!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'שגיאה ביצירת תור');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('התור עודכן בהצלחה!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'שגיאה בעדכון תור');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: appointmentsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('התור בוטל בהצלחה!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'שגיאה בביטול תור');
    }
  });

  return {
    appointments: appointments?.data || [],
    isLoading,
    error,
    createAppointment: createMutation.mutate,
    updateAppointment: updateMutation.mutate,
    cancelAppointment: cancelMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCancelling: cancelMutation.isPending
  };
};
