import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '../services/api';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isPWA() {
    return window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;
}

export function getIOSVersion() {
    const match = navigator.userAgent.match(/OS (\d+)_/);
    return match ? parseInt(match[1], 10) : null;
}

export function isPushCapable() {
    if (isIOS()) {
        if (!isPWA()) return false;
        const version = getIOSVersion();
        return version !== null && version >= 16;
    }
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function usePushNotifications() {
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [loading, setLoading] = useState(false);

    // Prevent the auto-subscribe from firing more than once per mount
    const autoAttempted = useRef(false);

    const subscribe = useCallback(async () => {
        if (!isSupported) return false;
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.register('/sw-push.js');
            await navigator.serviceWorker.ready;

            const { publicKey } = await notificationsApi.getVapidKey();
            if (!publicKey) { setLoading(false); return false; }

            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== 'granted') { setLoading(false); return false; }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
            await notificationsApi.pushSubscribe({ subscription: subscription.toJSON() });
            setIsSubscribed(true);
            setLoading(false);
            return true;
        } catch (err) {
            console.error('Push subscription error:', err);
            setLoading(false);
            return false;
        }
    }, [isSupported]);

    const unsubscribe = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
            if (registration) {
                const sub = await registration.pushManager.getSubscription();
                if (sub) {
                    await sub.unsubscribe();
                    await notificationsApi.pushUnsubscribe({ endpoint: sub.endpoint });
                }
            }
            setIsSubscribed(false);
        } catch (err) {
            console.error('Push unsubscribe error:', err);
        }
    }, []);

    // Init once on mount
    useEffect(() => {
        const supported = isPushCapable();
        setIsSupported(supported);
        if (!supported) return;

        setPermission(Notification.permission);
        navigator.serviceWorker.getRegistration('/sw-push.js')
            .then(reg => reg?.pushManager.getSubscription())
            .then(sub => setIsSubscribed(!!sub))
            .catch(() => {});
    }, []); // runs once — no external deps needed

    // Auto-subscribe if permission was already granted (returning user)
    // Guard with ref so it never loops even if subscribe fails
    const subscribeRef = useRef(subscribe);
    subscribeRef.current = subscribe;

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (isSupported && permission === 'granted' && !isSubscribed && !autoAttempted.current && token) {
            autoAttempted.current = true;
            subscribeRef.current();
        }
    }, [isSupported, permission, isSubscribed]);

    return { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe };
}
