const express = require('express');
const router = express.Router();
const passport = require('passport');
const AppointmentType = require('../../models/AppointmentType');

// @route   GET api/appointment-types
// @desc    Get all appointment types for the authenticated user
// @access  Private
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const appointmentTypes = await AppointmentType.find({
            userId: req.user.id,
            isActive: true
        }).populate('relatedServices', 'name price duration').sort({ createdAt: -1 });

        res.json(appointmentTypes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   GET api/appointment-types/user/:username
// @desc    Get all active appointment types for a specific user (public)
// @access  Public
router.get('/user/:username', async (req, res) => {
    try {
        const User = require('../../models/User');
        const user = await User.findOne({
            username: req.params.username,
            isActive: true,
            isSuspended: false
        });

        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }

        const appointmentTypes = await AppointmentType.find({
            userId: user._id,
            isActive: true
        }).populate('relatedServices', 'name price duration description').sort({ name: 1 });

        res.json(appointmentTypes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   POST api/appointment-types
// @desc    Create a new appointment type
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { name, description, duration, price, color, relatedServices, images } = req.body;

        // Validation
        if (!name || !duration) {
            return res.status(400).json({ message: 'נא למלא את כל השדות הנדרשים' });
        }

        const newAppointmentType = new AppointmentType({
            userId: req.user.id,
            name,
            description,
            duration,
            price,
            color: color || '#667eea',
            relatedServices: relatedServices || [],
            images: images || []
        });

        const savedAppointmentType = await newAppointmentType.save();
        res.json(savedAppointmentType);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   PUT api/appointment-types/:id
// @desc    Update an appointment type
// @access  Private
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const appointmentType = await AppointmentType.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!appointmentType) {
            return res.status(404).json({ message: 'סוג תור לא נמצא' });
        }

        const { name, description, duration, price, color, isActive, relatedServices, images } = req.body;

        if (name) appointmentType.name = name;
        if (description !== undefined) appointmentType.description = description;
        if (duration) appointmentType.duration = duration;
        if (price !== undefined) appointmentType.price = price;
        if (color) appointmentType.color = color;
        if (isActive !== undefined) appointmentType.isActive = isActive;
        if (relatedServices !== undefined) appointmentType.relatedServices = relatedServices;
        if (images !== undefined) appointmentType.images = images;

        const updatedAppointmentType = await appointmentType.save();
        res.json(updatedAppointmentType);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   DELETE api/appointment-types/:id
// @desc    Delete (soft delete) an appointment type
// @access  Private
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const appointmentType = await AppointmentType.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!appointmentType) {
            return res.status(404).json({ message: 'סוג תור לא נמצא' });
        }

        appointmentType.isActive = false;
        await appointmentType.save();

        res.json({ message: 'סוג התור נמחק בהצלחה' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;
