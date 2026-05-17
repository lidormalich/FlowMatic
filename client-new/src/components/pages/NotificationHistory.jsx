import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { notificationsApi } from '../../services/api';
import { usePushNotifications, isIOS, isPWA, getIOSVersion } from '../../hooks/usePushNotifications';

function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'עכשיו';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `לפני ${minutes} דק'`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `לפני ${hours} שע'`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'אתמול';
    if (days < 7) return `לפני ${days} ימים`;
    return new Date(date).toLocaleDateString('he-IL');
}

const TYPE_CONFIG = {
    reminder: {
        label: 'תזכורת',
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        text: 'text-blue-600 dark:text-blue-400',
        dot: 'bg-blue-500',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    status_change: {
        label: 'שינוי סטטוס',
        bg: 'bg-red-100 dark:bg-red-900/40',
        text: 'text-red-600 dark:text-red-400',
        dot: 'bg-red-500',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
    },
    update: {
        label: 'עדכון',
        bg: 'bg-amber-100 dark:bg-amber-900/40',
        text: 'text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-500',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    message: {
        label: 'הודעה',
        bg: 'bg-purple-100 dark:bg-purple-900/40',
        text: 'text-purple-600 dark:text-purple-400',
        dot: 'bg-purple-500',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        ),
    },
};

const FILTERS = [
    { key: 'all', label: 'הכל' },
    { key: 'reminder', label: 'תזכורות' },
    { key: 'update', label: 'קביעות' },
    { key: 'status_change', label: 'ביטולים/שינויים' },
    { key: 'message', label: 'הודעות' },
];

function PushEnableCard({ isSubscribed, permission, subscribe, pushLoading }) {
    const iosDevice = isIOS();
    const iosNoPWA = iosDevice && !isPWA();
    const iosVer = getIOSVersion();
    const iosOld = iosDevice && isPWA() && iosVer !== null && iosVer < 16;

    if (isSubscribed) return null;

    if (iosNoPWA) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl p-4 mb-4">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="text-right flex-1">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">קבל התראות ל-iPhone</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                            הוסף את FlowMatic לדף הבית: Safari → שיתוף ⎙ → "הוסף למסך הבית" → פתח מהמסך הבית
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (iosOld) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/40 rounded-2xl p-4 mb-4">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 text-right">נדרש iOS 16 ומעלה לקבלת התראות</p>
            </div>
        );
    }

    if (permission === 'denied') {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/40 rounded-2xl p-4 mb-4">
                <p className="text-sm text-red-600 dark:text-red-400 text-right">
                    ההרשאה נחסמה. אפשר התראות בהגדרות הדפדפן כדי לקבל עדכונים.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-l from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200/60 dark:border-purple-700/40 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3">
            <button
                onClick={subscribe}
                disabled={pushLoading}
                className="flex-shrink-0 h-9 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
                {pushLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                }
                הפעל התראות
            </button>
            <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">התראות Push כבויות במכשיר זה</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">הפעל כדי לקבל עדכונים בזמן אמת</p>
            </div>
        </div>
    );
}

function NotificationCard({ notification, onMarkRead }) {
    const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.update;

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                notification.isRead
                    ? 'bg-white/40 dark:bg-slate-800/40 border-slate-200/40 dark:border-white/[0.05]'
                    : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/60 dark:border-white/[0.08] shadow-sm cursor-pointer hover:shadow-md'
            }`}
            onClick={() => !notification.isRead && onMarkRead(notification._id)}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                {cfg.icon}
            </div>
            <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-end gap-2">
                    {!notification.isRead && (
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    )}
                    <p className={`text-sm font-semibold truncate ${notification.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {notification.title}
                    </p>
                </div>
                {notification.body && (
                    <p className={`text-xs mt-0.5 leading-relaxed ${notification.isRead ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        {notification.body}
                    </p>
                )}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                    {timeAgo(notification.createdAt)}
                </p>
            </div>
        </div>
    );
}

const NotificationHistory = () => {
    const [allNotifications, setAllNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const { isSubscribed, permission, subscribe, loading: pushLoading } = usePushNotifications();

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const data = await notificationsApi.getAll();
            setAllNotifications(Array.isArray(data) ? data : []);
        } catch {
            toast.error('שגיאה בטעינת ההתראות');
        }
        setLoading(false);
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationsApi.markRead(id);
            setAllNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch {
            // silent
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllRead();
            setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('כל ההתראות סומנו כנקראו');
        } catch {
            toast.error('שגיאה');
        }
    };

    const filtered = activeFilter === 'all'
        ? allNotifications
        : allNotifications.filter(n => n.type === activeFilter);

    const unreadCount = allNotifications.filter(n => !n.isRead).length;

    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            סמן הכל כנקרא
                        </button>
                    )}
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">היסטוריית התראות</h1>
                    {unreadCount > 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{unreadCount} לא נקראו</p>
                    )}
                </div>
            </div>

            {/* Push enable card */}
            <PushEnableCard
                isSubscribed={isSubscribed}
                permission={permission}
                subscribe={subscribe}
                pushLoading={pushLoading}
            />

            {/* Filter tabs */}
            <div className="flex gap-1.5 mb-5 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 overflow-x-auto">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setActiveFilter(f.key)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                            activeFilter === f.key
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {f.label}
                        {f.key === 'all' && unreadCount > 0 && (
                            <span className="mr-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">אין התראות</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">ההתראות יופיעו כאן כשתקבל עדכונים</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(n => (
                        <NotificationCard key={n._id} notification={n} onMarkRead={handleMarkRead} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationHistory;
