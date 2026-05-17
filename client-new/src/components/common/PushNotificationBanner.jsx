import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePushNotifications, isIOS, isPWA, getIOSVersion } from '../../hooks/usePushNotifications';

// Context-aware content based on where/when the prompt appears
function getPromptContent(pathname) {
    if (pathname.startsWith('/book/')) {
        return {
            title: 'לא לפספס את התור!',
            description: 'הפעל התראות וקבל תזכורת יום לפני ו-30 דקות לפני התור שלך — ככה אף פעם לא שוכחים.',
            benefits: [
                { icon: '⏰', text: 'תזכורת אוטומטית לפני התור' },
                { icon: '🔄', text: 'עדכון מיידי אם יש שינוי או ביטול' },
            ],
            cta: 'הפעל תזכורות',
        };
    }

    if (pathname === '/my-appointments') {
        return {
            title: 'קבל עדכונים על התורים שלך',
            description: 'הפעל התראות כדי לדעת בזמן אמת אם תור אושר, בוטל או שונה — ישירות לדפדפן שלך.',
            benefits: [
                { icon: '⏰', text: 'תזכורת יום לפני ו-30 דקות לפני התור' },
                { icon: '🔔', text: 'עדכון מיידי על ביטול או שינוי תור' },
            ],
            cta: 'הפעל עדכונים',
        };
    }

    return {
        title: 'הישאר מעודכן בזמן אמת',
        description: 'הפעל התראות כדי לקבל תזכורות לתורים, עדכוני סטטוס והודעות חשובות — ישירות לדפדפן, גם כשהאתר סגור.',
        benefits: [
            { icon: '⏰', text: 'תזכורת יום לפני + 30 דק\' לפני כל תור' },
            { icon: '📋', text: 'עדכון מיידי כשסטטוס תור משתנה' },
            { icon: '💬', text: 'הודעות ומבצעים מבעל העסק' },
        ],
        cta: 'הפעל התראות',
    };
}

const PushNotificationBanner = () => {
    const { isSupported, permission, isSubscribed, loading, subscribe } = usePushNotifications();
    const [dismissed, setDismissed] = useState(false);
    const [show, setShow] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const location = useLocation();

    const iosDevice = isIOS();
    const iosNoPWA = iosDevice && !isPWA();
    const iosVersion = getIOSVersion();

    useEffect(() => {
        const lastDismissed = localStorage.getItem('pushBannerDismissed');
        const cooldownPassed = !lastDismissed || (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24) >= 1;

        if (dismissed || !cooldownPassed) {
            setShow(false);
            setShowIOSGuide(false);
            return;
        }

        // iOS without PWA: show the "Add to Home Screen" guide instead (only on booking page)
        if (iosNoPWA && location.pathname.startsWith('/book/')) {
            const timer = setTimeout(() => {
                setShowIOSGuide(true);
                localStorage.setItem('pushBannerDismissed', Date.now().toString());
            }, 1500);
            return () => clearTimeout(timer);
        }

        if (!isSupported || isSubscribed || permission === 'denied') {
            setShow(false);
            return;
        }

        const timer = setTimeout(() => {
            setShow(true);
            localStorage.setItem('pushBannerDismissed', Date.now().toString());
        }, 1000);
        return () => clearTimeout(timer);
    }, [isSupported, isSubscribed, permission, dismissed, location.pathname, iosNoPWA]);

    const handleEnable = async () => {
        const success = await subscribe();
        if (success) {
            setShow(false);
        }
    };

    const handleDismissAll = () => {
        setDismissed(true);
        setShow(false);
        setShowIOSGuide(false);
        localStorage.setItem('pushBannerDismissed', Date.now().toString());
    };

    // iOS "Add to Home Screen" guide
    if (showIOSGuide) {
        return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" onClick={handleDismissAll} />
                <div className="relative w-full max-w-sm pointer-events-auto animate-slide-up">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-white/[0.08] overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
                        <div className="p-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">קבל תזכורות לתורים על ה-iPhone</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-5">
                                {iosVersion !== null && iosVersion < 16
                                    ? `גרסת iOS ${iosVersion} שלך אינה תומכת בהתראות Push. עדכן ל-iOS 16 ומעלה.`
                                    : 'הוסף את FlowMatic לדף הבית כדי לקבל התראות על iPhone:'}
                            </p>
                            {(iosVersion === null || iosVersion >= 16) && (
                                <ol className="space-y-2 mb-6 text-right">
                                    {[
                                        { num: '1', text: 'לחץ על כפתור השיתוף בתחתית Safari ⎙' },
                                        { num: '2', text: 'גלול ובחר "הוסף למסך הבית"' },
                                        { num: '3', text: 'פתח את האפליקציה מהמסך הבית' },
                                        { num: '4', text: 'לחץ "הפעל תזכורות" בתוך האפליקציה' },
                                    ].map(step => (
                                        <li key={step.num} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5">
                                            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{step.num}</span>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{step.text}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                            <button onClick={handleDismissAll} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 font-medium py-2 transition-colors">
                                הבנתי, תודה
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!show) return null;

    const content = getPromptContent(location.pathname);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto animate-fade-in"
                onClick={handleDismissAll}
            />

            {/* Card */}
            <div className="relative w-full max-w-sm pointer-events-auto animate-slide-up">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-white/[0.08] overflow-hidden">
                    {/* Top gradient accent */}
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />

                    <div className="p-6">
                        {/* Icon */}
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
                            {content.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-5 leading-relaxed">
                            {content.description}
                        </p>

                        {/* Benefits list */}
                        <div className="space-y-2.5 mb-6">
                            {content.benefits.map((benefit, i) => (
                                <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5">
                                    <span className="text-lg flex-shrink-0">{benefit.icon}</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 text-right">{benefit.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA button */}
                        <button
                            onClick={handleEnable}
                            disabled={loading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    מפעיל...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {content.cta}
                                </>
                            )}
                        </button>

                        {/* Dismiss */}
                        <button
                            onClick={handleDismissAll}
                            className="w-full text-center text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium mt-3 py-2 transition-colors"
                        >
                            אולי אחר כך
                        </button>

                        {/* Trust note */}
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-1">
                            ניתן לכבות בכל עת מהגדרות הדפדפן
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PushNotificationBanner;
