const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@flowmatic.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

/**
 * Send push notification to a specific user
 * @param {string} userId - The user's MongoDB ID
 * @param {object} payload - { title, body, icon?, url? }
 */
async function sendPushToUser(userId, payload) {
    try {
        const subscriptions = await PushSubscription.find({ userId });
        if (subscriptions.length === 0) return 0;

        const pushPayload = JSON.stringify({
            title: payload.title,
            body: payload.body || '',
            icon: payload.icon || '/FlowMatic.png',
            badge: '/FlowMatic.png',
            url: payload.url || '/',
            timestamp: Date.now()
        });

        let sent = 0;
        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(sub.subscription, pushPayload);
                sent++;
            } catch (err) {
                // If subscription is expired/invalid (410 Gone or 404), remove it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                }
            }
        }
        return sent;
    } catch (err) {
        console.error('[Push] Error sending to user:', err.message);
        return 0;
    }
}

/**
 * Send push notification to multiple users
 * @param {string[]} userIds - Array of user MongoDB IDs
 * @param {object} payload - { title, body, icon?, url? }
 */
async function sendPushToUsers(userIds, payload) {
    try {
        const subscriptions = await PushSubscription.find({ userId: { $in: userIds } });
        if (subscriptions.length === 0) return 0;

        const pushPayload = JSON.stringify({
            title: payload.title,
            body: payload.body || '',
            icon: payload.icon || '/FlowMatic.png',
            badge: '/FlowMatic.png',
            url: payload.url || '/',
            timestamp: Date.now()
        });

        let sent = 0;
        const expiredIds = [];

        await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(sub.subscription, pushPayload);
                    sent++;
                } catch (err) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        expiredIds.push(sub._id);
                    }
                }
            })
        );

        // Clean up expired subscriptions
        if (expiredIds.length > 0) {
            await PushSubscription.deleteMany({ _id: { $in: expiredIds } });
        }

        return sent;
    } catch (err) {
        console.error('[Push] Error sending to users:', err.message);
        return 0;
    }
}

module.exports = { sendPushToUser, sendPushToUsers };
