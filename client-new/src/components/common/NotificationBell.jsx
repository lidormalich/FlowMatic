import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import moment from 'moment';
import 'moment/locale/he';

moment.locale('he');

const typeConfig = {
  reminder: { label: 'תזכורת', icon: '⏰', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  status_change: { label: 'שינוי סטטוס', icon: '🔄', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
  message: { label: 'הודעה', icon: '💬', gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200' },
  update: { label: 'עדכון', icon: '📢', gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
    staleTime: 15000
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    enabled: isOpen,
    staleTime: 10000
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread']);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread']);
    }
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen && !selectedNotification) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectedNotification]);

  const unreadCount = unreadData?.count || 0;

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markReadMutation.mutate(notif._id);
    setSelectedNotification(notif);
  };

  const closeDetail = () => {
    setSelectedNotification(null);
  };

  // Group notifications by date
  const groupByDate = (items) => {
    const groups = {};
    items.forEach(n => {
      const date = moment(n.createdAt);
      const today = moment().startOf('day');
      const yesterday = moment().subtract(1, 'day').startOf('day');
      let key;
      if (date.isSameOrAfter(today)) key = 'היום';
      else if (date.isSameOrAfter(yesterday)) key = 'אתמול';
      else key = date.format('D בMMMM');
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    return groups;
  };

  const grouped = groupByDate(notifications);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 active:scale-95"
          title="התראות"
        >
          <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && !selectedNotification && (
          <div
            className="absolute left-0 top-full mt-2 w-[340px] max-h-[480px] bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/30 overflow-hidden z-50"
            style={{ direction: 'rtl', animation: 'notifDropIn 0.2s cubic-bezier(0.22,1,0.36,1)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">התראות</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-[13px] text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  סמן הכל כנקרא
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[420px] overscroll-contain" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-7 h-7 border-[2.5px] border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-400 text-xs mt-3">טוען התראות...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">אין התראות חדשות</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">כשתקבל התראה, היא תופיע כאן</p>
                </div>
              ) : (
                Object.entries(grouped).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    {/* Date Separator */}
                    <div className="px-5 py-2 bg-slate-50/80 dark:bg-slate-750 sticky top-0 z-10">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        {dateLabel}
                      </span>
                    </div>
                    {items.map(notif => {
                      const config = typeConfig[notif.type] || typeConfig.update;
                      return (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`
                            px-5 py-3.5 cursor-pointer transition-all duration-150
                            hover:bg-slate-50 dark:hover:bg-slate-700/50
                            active:bg-slate-100 dark:active:bg-slate-700
                            ${!notif.isRead ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}
                          `}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                              <span className="text-base">{config.icon}</span>
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-[13px] font-semibold leading-snug ${!notif.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {notif.title}
                                </p>
                                {!notif.isRead && (
                                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 shadow-sm shadow-blue-500/40"></div>
                                )}
                              </div>
                              {notif.body && (
                                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {notif.body}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${config.bg} ${config.text}`}>
                                  {config.label}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {moment(notif.createdAt).fromNow()}
                                </span>
                              </div>
                            </div>
                            {/* Chevron */}
                            <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal - iOS Style */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          onClick={closeDetail}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ animation: 'notifFadeIn 0.2s ease' }} />

          {/* Modal */}
          <div
            className="relative w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'notifSlideUp 0.35s cubic-bezier(0.22,1,0.36,1)', direction: 'rtl' }}
          >
            {/* iOS Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
            </div>

            {/* Header with gradient based on type */}
            {(() => {
              const config = typeConfig[selectedNotification.type] || typeConfig.update;
              return (
                <div className={`bg-gradient-to-br ${config.gradient} p-6 sm:p-7 relative overflow-hidden`}>
                  {/* Decorative circles */}
                  <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />

                  <div className="relative">
                    {/* Close button */}
                    <button
                      onClick={closeDetail}
                      className="absolute top-0 left-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Type Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
                      <span className="text-2xl">{config.icon}</span>
                    </div>

                    {/* Type Badge */}
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-sm mb-3">
                      {config.label}
                    </span>

                    {/* Title */}
                    <h2 className="text-xl sm:text-[22px] font-bold text-white leading-snug">
                      {selectedNotification.title}
                    </h2>

                    {/* Time */}
                    <div className="flex items-center gap-2 mt-3">
                      <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[13px] text-white/70 font-medium">
                        {moment(selectedNotification.createdAt).format('dddd, D בMMMM YYYY')} | {moment(selectedNotification.createdAt).format('HH:mm')}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">
                      {moment(selectedNotification.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7">
              {selectedNotification.body ? (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">תוכן ההודעה</h4>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 sm:p-5">
                    <p className="text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {selectedNotification.body}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400 dark:text-slate-500">אין תוכן נוסף להודעה זו</p>
                </div>
              )}

              {/* Metadata */}
              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700/50">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">סוג</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {(typeConfig[selectedNotification.type] || typeConfig.update).label}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">סטטוס</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {selectedNotification.isRead ? 'נקרא' : 'חדש'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex gap-3" style={{ direction: 'ltr' }}>
                {/* Cancel/Back on the RIGHT (in RTL = start) */}
                <button
                  onClick={closeDetail}
                  className="flex-1 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-[15px] transition-all duration-200 active:scale-[0.97]"
                >
                  סגור
                </button>
                {/* Primary action on the LEFT (in RTL = end) */}
                <button
                  onClick={() => {
                    setSelectedNotification(null);
                    setIsOpen(false);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[15px] shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-[0.97]"
                >
                  אישור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes notifDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notifSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes notifFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (min-width: 640px) {
          @keyframes notifSlideUp {
            from { opacity: 0; transform: scale(0.92) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        }
      `}</style>
    </>
  );
};

export default NotificationBell;
