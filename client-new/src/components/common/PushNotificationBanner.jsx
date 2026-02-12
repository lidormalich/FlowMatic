import { useState, useEffect } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const PushNotificationBanner = () => {
    const { isSupported, permission, isSubscribed, loading, subscribe } = usePushNotifications();
    const [dismissed, setDismissed] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Don't show if: not supported, already subscribed, already denied, or dismissed this session
        if (!isSupported || isSubscribed || permission === 'denied' || dismissed) {
            setShow(false);
            return;
        }

        // Check if user dismissed before (stored in localStorage)
        const lastDismissed = localStorage.getItem('pushBannerDismissed');
        if (lastDismissed) {
            // Show again after 7 days
            const daysSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) {
                setShow(false);
                return;
            }
        }

        // Delay showing by 3 seconds so it doesn't feel aggressive
        const timer = setTimeout(() => setShow(true), 3000);
        return () => clearTimeout(timer);
    }, [isSupported, isSubscribed, permission, dismissed]);

    const handleEnable = async () => {
        const success = await subscribe();
        if (success) {
            setShow(false);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        setShow(false);
        localStorage.setItem('pushBannerDismissed', Date.now().toString());
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm animate-slide-up">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/[0.08] p-5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">הפעל התראות</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-right">
                            קבל תזכורות לתורים, עדכוני סטטוס והודעות ישירות לדפדפן
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleEnable}
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-1">
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        מפעיל...
                                    </span>
                                ) : 'הפעל'}
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                            >
                                לא עכשיו
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PushNotificationBanner;
