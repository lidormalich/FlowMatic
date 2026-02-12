import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../services/api';

// Convert VAPID key from base64 URL string to Uint8Array
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

export function usePushNotifications() {
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
            checkExistingSubscription();
        }
    }, []);

    // Auto-subscribe: if permission is already granted but no active subscription, subscribe silently
    useEffect(() => {
        if (isSupported && permission === 'granted' && !isSubscribed && !loading) {
            subscribe();
        }
    }, [isSupported, permission, isSubscribed]);

    const checkExistingSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            }
        } catch (err) {
            console.error('Error checking push subscription:', err);
        }
    };

    const subscribe = useCallback(async () => {
        if (!isSupported) return false;
        setLoading(true);

        try {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw-push.js');
            await navigator.serviceWorker.ready;

            // Get VAPID public key from server
            const { publicKey } = await notificationsApi.getVapidKey();
            if (!publicKey) {
                console.error('No VAPID public key available');
                setLoading(false);
                return false;
            }

            // Request permission
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                setLoading(false);
                return false;
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Send subscription to server
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
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                    await notificationsApi.pushUnsubscribe({ endpoint: subscription.endpoint });
                }
            }
            setIsSubscribed(false);
        } catch (err) {
            console.error('Push unsubscribe error:', err);
        }
    }, []);

    return {
        isSupported,
        permission,
        isSubscribed,
        loading,
        subscribe,
        unsubscribe
    };
}
