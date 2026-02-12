import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../../services/api';
import moment from 'moment';
import 'moment/locale/he';
import { toast } from 'react-toastify';

moment.locale('he');

const MyAppointments = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: appointmentsApi.getMyBookings
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => appointmentsApi.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-bookings']);
      toast.success('התור בוטל בהצלחה');
      setCancellingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'שגיאה בביטול התור');
      setCancellingId(null);
    }
  });

  const { upcoming, past } = useMemo(() => {
    const now = moment();
    const up = [];
    const pa = [];

    bookings.forEach(b => {
      const apptTime = moment(`${moment(b.date).format('YYYY-MM-DD')} ${b.startTime}`, 'YYYY-MM-DD HH:mm');
      if (apptTime.isAfter(now) && b.status !== 'cancelled' && b.status !== 'completed') {
        up.push(b);
      } else {
        pa.push(b);
      }
    });

    up.sort((a, b) => moment(a.date).diff(moment(b.date)) || a.startTime.localeCompare(b.startTime));
    pa.sort((a, b) => moment(b.date).diff(moment(a.date)) || b.startTime.localeCompare(a.startTime));

    return { upcoming: up, past: pa };
  }, [bookings]);

  const displayList = activeTab === 'upcoming' ? upcoming : past;

  const getStatusConfig = (status) => {
    const configs = {
      confirmed: { label: 'מאושר', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: '✓' },
      pending: { label: 'ממתין לאישור', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: '⏳' },
      cancelled: { label: 'בוטל', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: '✕' },
      completed: { label: 'הושלם', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: '✓' },
      no_show: { label: 'לא הגיע', bg: 'bg-slate-100 dark:bg-slate-700/30', text: 'text-slate-600 dark:text-slate-400', icon: '—' },
    };
    return configs[status] || { label: status, bg: 'bg-slate-100 dark:bg-slate-700/30', text: 'text-slate-600 dark:text-slate-400', icon: '?' };
  };

  const handleCancel = (id) => {
    if (cancellingId === id) {
      cancelMutation.mutate(id);
    } else {
      setCancellingId(id);
      setTimeout(() => setCancellingId(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">התורים שלי</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">התורים שלי</h1>
        <p className="text-slate-500 dark:text-slate-400">כל התורים שקבעת אצל נותני שירות</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'upcoming'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          קרובים ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'past'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          היסטוריה ({past.length})
        </button>
      </div>

      {/* Appointments List */}
      {displayList.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-white/[0.08] p-12 text-center">
          <div className="text-5xl mb-4">{activeTab === 'upcoming' ? '📅' : '📋'}</div>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
            {activeTab === 'upcoming' ? 'אין תורים קרובים' : 'אין היסטוריה'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {activeTab === 'upcoming'
              ? 'כשתיקבע תור אצל אחד העסקים, הוא יופיע כאן'
              : 'תורים שהושלמו או בוטלו יופיעו כאן'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map((booking) => {
            const status = getStatusConfig(booking.status);
            const apptDate = moment(booking.date);
            const isToday = apptDate.isSame(moment(), 'day');
            const isTomorrow = apptDate.isSame(moment().add(1, 'day'), 'day');
            const dateLabel = isToday ? 'היום' : isTomorrow ? 'מחר' : apptDate.format('DD/MM/YYYY');

            return (
              <div
                key={booking._id}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] p-5 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  {/* Left side - Info */}
                  <div className="flex items-start gap-4">
                    {/* Business avatar */}
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                      {booking.businessOwnerId?.profileImage ? (
                        <img src={booking.businessOwnerId.profileImage} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span>{booking.businessOwnerId?.businessName?.[0] || '🏢'}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                        {booking.businessOwnerId?.businessName || booking.businessOwnerId?.name || 'עסק'}
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                        {booking.service}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {dateLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {booking.startTime} - {booking.endTime}
                        </span>
                        {booking.duration && (
                          <span>{booking.duration} דק׳</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Status & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                      <span>{status.icon}</span>
                      {status.label}
                    </span>

                    {booking.price > 0 && (
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        ₪{booking.price}
                      </span>
                    )}

                    {/* Cancel button - only for upcoming */}
                    {activeTab === 'upcoming' && booking.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        disabled={cancelMutation.isPending && cancellingId === booking._id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-200 ${
                          cancellingId === booking._id
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                      >
                        {cancelMutation.isPending && cancellingId === booking._id
                          ? 'מבטל...'
                          : cancellingId === booking._id
                            ? 'לחץ שוב לאישור'
                            : 'בטל תור'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Note */}
                {booking.description && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-medium">הערה:</span> {booking.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
