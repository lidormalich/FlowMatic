const express = require('express');
const router = express.Router();
const passport = require('passport');
const Notification = require('../../models/Notification');
const Client = require('../../models/Client');
const Event = require('../../models/Event');
const User = require('../../models/User');
const PushSubscription = require('../../models/PushSubscription');
const { sendPushToUser, sendPushToUsers } = require('../../utils/pushNotify');

// GET /api/notifications/vapid-key - Get public VAPID key (public)
router.get('/vapid-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// POST /api/notifications/push-subscribe - Subscribe to push notifications
router.post('/push-subscribe', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ message: 'נתוני הרשמה לא תקינים' });
        }

        // Upsert - update if exists, create if not
        await PushSubscription.findOneAndUpdate(
            { userId: req.user.id, 'subscription.endpoint': subscription.endpoint },
            { userId: req.user.id, subscription },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Push subscribe error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// POST /api/notifications/push-unsubscribe - Unsubscribe from push notifications
router.post('/push-unsubscribe', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (endpoint) {
            await PushSubscription.deleteOne({ userId: req.user.id, 'subscription.endpoint': endpoint });
        } else {
            // Remove all subscriptions for this user
            await PushSubscription.deleteMany({ userId: req.user.id });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// GET /api/notifications - Get all notifications for user
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
        res.json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: { isRead: true } },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'התראה לא נמצאה' });
        res.json(notification);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// POST /api/notifications/send - Send notification to a client (business_owner → client)
router.post('/send', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { clientId, title, body } = req.body;
        if (!clientId || !title) return res.status(400).json({ message: 'חסרים שדות חובה' });

        const client = await Client.findOne({ _id: clientId, businessOwnerId: req.user.id });
        if (!client) return res.status(404).json({ message: 'לקוח לא נמצא' });
        if (!client.userId) return res.status(400).json({ message: 'ללקוח אין חשבון במערכת' });

        const notification = new Notification({
            userId: client.userId,
            type: 'message',
            title,
            body: body || ''
        });
        await notification.save();

        // Send browser push notification
        await sendPushToUser(client.userId, { title, body });

        res.json(notification);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// POST /api/notifications/broadcast - Send to clients by criteria
router.post('/broadcast', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { title, body, filter } = req.body;
        if (!title) return res.status(400).json({ message: 'כותרת היא שדה חובה' });

        const clientQuery = { businessOwnerId: req.user.id };
        if (filter?.tags?.length > 0) {
            clientQuery.tags = { $in: filter.tags };
        }

        const clients = await Client.find(clientQuery);
        const clientsWithAccounts = clients.filter(c => c.userId);

        if (clientsWithAccounts.length === 0) {
            return res.json({ sent: 0, message: 'אין לקוחות עם חשבון במערכת' });
        }

        const notifications = clientsWithAccounts.map(client => ({
            userId: client.userId,
            type: 'update',
            title,
            body: body || ''
        }));

        await Notification.insertMany(notifications);

        // Send browser push to all
        const userIds = clientsWithAccounts.map(c => c.userId);
        await sendPushToUsers(userIds, { title, body });

        res.json({ sent: notifications.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// POST /api/notifications/admin-broadcast - Admin sends notification by role
router.post('/admin-broadcast', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'אין הרשאה' });
        }

        const { title, body, roles } = req.body;
        if (!title) return res.status(400).json({ message: 'כותרת היא שדה חובה' });
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ message: 'יש לבחור לפחות סוג משתמש אחד' });
        }

        const validRoles = ['admin', 'business_owner', 'client'];
        const filteredRoles = roles.filter(r => validRoles.includes(r));
        if (filteredRoles.length === 0) {
            return res.status(400).json({ message: 'סוגי משתמשים לא תקינים' });
        }

        const users = await User.find({
            role: { $in: filteredRoles },
            isActive: { $ne: false }
        }).select('_id');

        if (users.length === 0) {
            return res.json({ sent: 0, message: 'לא נמצאו משתמשים מתאימים' });
        }

        const notifications = users.map(u => ({
            userId: u._id,
            type: 'update',
            title,
            body: body || ''
        }));

        await Notification.insertMany(notifications);

        // Send browser push to all target users
        const userIds = users.map(u => u._id);
        const pushSent = await sendPushToUsers(userIds, { title, body });

        res.json({
            sent: notifications.length,
            pushSent,
            message: `נשלחו ${notifications.length} התראות (${pushSent} push)`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// GET /api/notifications/admin-history - Admin view sent broadcasts
router.get('/admin-history', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'אין הרשאה' });
        }

        const broadcasts = await Notification.aggregate([
            { $match: { type: 'update' } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: { title: '$title', body: '$body', date: { $dateToString: { format: '%Y-%m-%d %H:%M', date: '$createdAt' } } },
                    count: { $sum: 1 },
                    readCount: { $sum: { $cond: ['$isRead', 1, 0] } },
                    createdAt: { $first: '$createdAt' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 50 }
        ]);

        res.json(broadcasts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// GET /api/notifications/admin-all - All notifications grouped by type+title (admin)
router.get('/admin-all', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'אין הרשאה' });
        }

        const notifications = await Notification.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        type: '$type',
                        title: '$title',
                        body: '$body',
                        date: { $dateToString: { format: '%Y-%m-%d %H:%M', date: '$createdAt' } }
                    },
                    count: { $sum: 1 },
                    readCount: { $sum: { $cond: ['$isRead', 1, 0] } },
                    createdAt: { $first: '$createdAt' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 100 }
        ]);

        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;
