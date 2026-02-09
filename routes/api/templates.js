const express = require('express');
const router = express.Router();
const passport = require('passport');
const NotificationTemplate = require('../../models/NotificationTemplate');

// Default templates content
const DEFAULTS = {
    email: {
        confirmation: {
            subject: 'אישור תור - {businessName}',
            body: 'היי {clientName},\n\nהתור שלך ל{serviceName} נקבע בהצלחה לתאריך {date} בשעה {time}.\n\nכתובת: {address}\n\nלהתראות,\n{businessName}'
        },
        reminder: {
            subject: 'תזכורת לתור - {businessName}',
            body: 'היי {clientName},\n\nתזכורת לתור שלך מחר בשעה {time} עבור {serviceName}.\n\nנתראה,\n{businessName}'
        }
    },
    sms: {
        confirmation: {
            body: 'היי {clientName}, תורך ל{serviceName} ב{businessName} נקבע ל{date} ב{time}.'
        },
        reminder: {
            body: 'תזכורת: תור ל{serviceName} ב{businessName} מחר ב{time}.'
        }
    }
};

// GET /api/templates - Get all templates (create defaults if missing)
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        let templates = await NotificationTemplate.find({ businessOwnerId: req.user.id });

        // Check for missing defaults and create them
        const missing = [];
        ['email', 'sms'].forEach(type => {
            ['confirmation', 'reminder'].forEach(name => {
                if (!templates.find(t => t.type === type && t.name === name)) {
                    missing.push({
                        businessOwnerId: req.user.id,
                        type,
                        name,
                        subject: DEFAULTS[type][name].subject || '',
                        body: DEFAULTS[type][name].body
                    });
                }
            });
        });

        if (missing.length > 0) {
            await NotificationTemplate.insertMany(missing);
            templates = await NotificationTemplate.find({ businessOwnerId: req.user.id });
        }

        res.json(templates);
    } catch (err) {
        console.error('Templates error:', err);
        res.status(500).json({ message: 'Error fetching templates' });
    }
});

// PUT /api/templates/:id - Update template
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const template = await NotificationTemplate.findOneAndUpdate(
            { _id: req.params.id, businessOwnerId: req.user.id },
            { $set: req.body },
            { new: true }
        );
        res.json(template);
    } catch (err) {
        res.status(500).json({ message: 'Error updating template' });
    }
});

module.exports = router;
