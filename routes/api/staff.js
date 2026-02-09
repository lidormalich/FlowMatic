const express = require('express');
const router = express.Router();
const passport = require('passport');
const Staff = require('../../models/Staff');

// GET /api/staff - Get all staff for user
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const staff = await Staff.find({ businessOwnerId: req.user.id });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching staff' });
    }
});

// POST /api/staff - Create staff
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { name, role, phone, email, color, services } = req.body;
        const newStaff = new Staff({
            businessOwnerId: req.user.id,
            name,
            role,
            phone,
            email,
            color,
            services
        });
        await newStaff.save();
        res.json(newStaff);
    } catch (err) {
        res.status(500).json({ message: 'Error creating staff' });
    }
});

// PUT /api/staff/:id - Update staff
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const staff = await Staff.findOneAndUpdate(
            { _id: req.params.id, businessOwnerId: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!staff) return res.status(404).json({ message: 'Staff not found' });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: 'Error updating staff' });
    }
});

// DELETE /api/staff/:id - Delete staff
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const staff = await Staff.findOneAndDelete({ _id: req.params.id, businessOwnerId: req.user.id });
        if (!staff) return res.status(404).json({ message: 'Staff not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting staff' });
    }
});

module.exports = router;
