const express = require('express');
const router = express.Router();
const passport = require('passport');
const Waitlist = require('../../models/Waitlist');
const AppointmentType = require('../../models/AppointmentType');

// GET /api/waitlist - Get all waitlist items for business owner
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const items = await Waitlist.find({ businessOwnerId: req.user.id })
            .populate('serviceId', 'name duration price color')
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching waitlist' });
    }
});

// POST /api/waitlist/public/:username - Add to waitlist (Public)
router.post('/public/:username', async (req, res) => {
    try {
        const User = require('../../models/User');
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'Business not found' });

        const { clientName, clientPhone, clientEmail, serviceId, preferredDate, notes } = req.body;

        const newItem = new Waitlist({
            businessOwnerId: user._id,
            clientName,
            clientPhone,
            clientEmail,
            serviceId,
            preferredDate,
            notes
        });

        await newItem.save();
        res.json(newItem);
    } catch (err) {
        console.error('Waitlist error:', err);
        res.status(500).json({ message: 'Error joining waitlist' });
    }
});

// PUT /api/waitlist/:id - Update status
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const item = await Waitlist.findOneAndUpdate(
            { _id: req.params.id, businessOwnerId: req.user.id },
            { $set: req.body },
            { new: true }
        );
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error updating waitlist' });
    }
});

// DELETE /api/waitlist/:id - Delete item
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        await Waitlist.findOneAndDelete({ _id: req.params.id, businessOwnerId: req.user.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting item' });
    }
});

module.exports = router;
