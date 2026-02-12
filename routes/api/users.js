const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const keys = require('../../config/keys');
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');
const validateUpdateUserInput = require('../../validation/updateUser');
const User = require('../../models/User');

// @route   GET api/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'אין לך הרשאה לצפות במשתמשים' });
        }

        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   GET api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});


// @route   GET api/users/:id
// @desc    Get single user
// @access  Private
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Check if user is admin or updating their own profile
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'אין לך הרשאה לעדכן משתמש זה' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }

        // Update basic fields
        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.username) user.username = req.body.username;
        if (req.body.businessName !== undefined) user.businessName = req.body.businessName;
        if (req.body.businessDescription !== undefined) user.businessDescription = req.body.businessDescription;
        if (req.body.phoneNumber !== undefined) user.phoneNumber = req.body.phoneNumber;
        
        // Update nested objects safely
        if (req.body.businessHours) {
            user.businessHours = {
                ...user.businessHours,
                ...req.body.businessHours
            };
        }

        if (req.body.preferences) {
            user.preferences = {
                ...user.preferences,
                ...req.body.preferences
            };
        }

        // Business Settings fields
        if (req.body.businessDescription !== undefined) user.businessDescription = req.body.businessDescription;
        if (req.body.businessAddress !== undefined) user.businessAddress = req.body.businessAddress;
        if (req.body.showHebrewDate !== undefined) user.showHebrewDate = req.body.showHebrewDate;

        // Business Hours (working hours per day)
        if (req.body.businessHours) {
            if (req.body.businessHours.startHour !== undefined) user.businessHours.startHour = req.body.businessHours.startHour;
            if (req.body.businessHours.endHour !== undefined) user.businessHours.endHour = req.body.businessHours.endHour;
            if (req.body.businessHours.workingDays !== undefined) user.businessHours.workingDays = req.body.businessHours.workingDays;
            if (req.body.businessHours.slotInterval !== undefined) user.businessHours.slotInterval = req.body.businessHours.slotInterval;
            if (req.body.businessHours.breakTime) {
                if (!user.businessHours.breakTime) user.businessHours.breakTime = {};
                if (req.body.businessHours.breakTime.enabled !== undefined) user.businessHours.breakTime.enabled = req.body.businessHours.breakTime.enabled;
                if (req.body.businessHours.breakTime.startHour !== undefined) user.businessHours.breakTime.startHour = req.body.businessHours.breakTime.startHour;
                if (req.body.businessHours.breakTime.startMinute !== undefined) user.businessHours.breakTime.startMinute = req.body.businessHours.breakTime.startMinute;
                if (req.body.businessHours.breakTime.endHour !== undefined) user.businessHours.breakTime.endHour = req.body.businessHours.breakTime.endHour;
                if (req.body.businessHours.breakTime.endMinute !== undefined) user.businessHours.breakTime.endMinute = req.body.businessHours.breakTime.endMinute;
            }
            if (req.body.businessHours.minGapMinutes !== undefined) user.businessHours.minGapMinutes = req.body.businessHours.minGapMinutes;
        }

        // SMS Notifications settings
        if (req.body.smsNotifications) {
            if (req.body.smsNotifications.enabled !== undefined) user.smsNotifications.enabled = req.body.smsNotifications.enabled;
            if (req.body.smsNotifications.reminderHoursBefore !== undefined) user.smsNotifications.reminderHoursBefore = req.body.smsNotifications.reminderHoursBefore;
        }

        // Cancellation Policy
        if (req.body.cancellationPolicy) {
            if (req.body.cancellationPolicy.enabled !== undefined) user.cancellationPolicy.enabled = req.body.cancellationPolicy.enabled;
            if (req.body.cancellationPolicy.hoursBefore !== undefined) user.cancellationPolicy.hoursBefore = req.body.cancellationPolicy.hoursBefore;
        }

        // Theme Settings (logo, colors)
        if (req.body.themeSettings) {
            if (req.body.themeSettings.primaryColor !== undefined) user.themeSettings.primaryColor = req.body.themeSettings.primaryColor;
            if (req.body.themeSettings.secondaryColor !== undefined) user.themeSettings.secondaryColor = req.body.themeSettings.secondaryColor;
            if (req.body.themeSettings.logoUrl !== undefined) user.themeSettings.logoUrl = req.body.themeSettings.logoUrl;
            if (req.body.themeSettings.coverImage !== undefined) user.themeSettings.coverImage = req.body.themeSettings.coverImage;
        }

        // Only admin can update role and credits
        if (req.user.role === 'admin') {
            if (req.body.role) user.role = req.body.role;
            if (req.body.credits !== undefined) user.credits = req.body.credits;
        }

        // Update password if provided
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        await user.save();

        const updatedUser = await User.findById(req.params.id).select('-password');
        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   DELETE api/users/:id
// @desc    Delete user (admin only)
// @access  Private
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'אין לך הרשאה למחוק משתמשים' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }

        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'המשתמש נמחק בהצלחה' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   POST api/users/:id/suspend
// @desc    Suspend/unsuspend user (admin only)
// @access  Private
router.post('/:id/suspend', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'אין לך הרשאה להשעות משתמשים' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }

        user.isSuspended = req.body.suspend;
        await user.save();

        res.json({ message: user.isSuspended ? 'המשתמש הושעה' : 'המשתמש הופעל', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   POST api/users/:id/credits
// @desc    Add/remove credits (admin only)
// @access  Private
router.post('/:id/credits', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'אין לך הרשאה לנהל קרדיטים' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }

        const amount = parseInt(req.body.amount);
        user.credits = (user.credits || 0) + amount;

        // Ensure credits don't go negative
        if (user.credits < 0) user.credits = 0;

        await user.save();

        res.json({ message: 'הקרדיטים עודכנו בהצלחה', credits: user.credits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

router.post('/user-add', (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }
    User.findOne({ email: req.body.email }).then(user => {
        if (user) {
            return res.status(400).json({ email: 'Email already exists' });
        } else {
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            });
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser
                        .save()
                        .then(user => {
                            return res.status(200).json({message: 'User added successfully. Refreshing data...'})
                        }).catch(err => console.log(err));
                });
            });
        }
    });
});

router.post('/user-data', (req, res) => {
    User.find({}).select(['-password']).then(user => {
        if (user) {
            return res.status(200).send(user);
        }
    });
});

router.post('/user-delete', (req, res) => {
    User.deleteOne({ _id: req.body._id}).then(user => {
        if (user) {
            return res.status(200).json({message: 'User deleted successfully. Refreshing data...', success: true})
        }
    });
});

router.post('/user-update', (req, res) => {
    const { errors, isValid } = validateUpdateUserInput(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }
    const _id = req.body._id;
    User.findOne({ _id }).then(user => {
        if (user) {
            if (req.body.password !== '') {
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(req.body.password, salt, (err, hash) => {
                        if (err) throw err;
                        user.password = hash;
                    });
                });
            }
            let update = {'name': req.body.name, 'email': req.body.email, 'password': user.password};
            User.updateOne({ _id: _id}, {$set: update}, function(err, result) {
                if (err) {
                    console.log({err});
                    return res.status(400).json({ message: 'Unable to update user.' });
                } else {
                    return res.status(200).json({ message: 'User updated successfully. Refreshing data...', success: true });
                }
            });
        } else {
            return res.status(400).json({ message: 'Now user found to update.' });
        }
    });
});

// @route   GET api/users/check-username/:username
// @desc    Check if username is available
// @access  Public
router.get('/check-username/:username', async (req, res) => {
    try {
        const username = req.params.username.toLowerCase().trim();

        // Validate username format
        if (!username.match(/^[a-z0-9-]+$/)) {
            return res.status(400).json({
                available: false,
                message: 'שם המשתמש יכול להכיל רק אותיות אנגליות קטנות, מספרים ומקפים'
            });
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.json({
                available: false,
                message: 'שם המשתמש כבר תפוס'
            });
        }

        return res.json({
            available: true,
            message: 'שם המשתמש זמין!'
        });
    } catch (err) {
        console.error('Check username error:', err);
        return res.status(500).json({ message: 'שגיאת שרת' });
    }
});

router.post('/register', async (req, res) => {
    try {
        console.log('📝 Registration attempt:', {
            name: req.body.name,
            email: req.body.email,
            username: req.body.username,
            role: req.body.role,
            businessName: req.body.businessName,
            phoneNumber: req.body.phoneNumber,
            hasPassword: !!req.body.password,
            hasPassword2: !!req.body.password2
        });

        const { errors, isValid } = validateRegisterInput(req.body);
        if (!isValid) {
            console.log('❌ Validation failed:', errors);
            return res.status(400).json(errors);
        }

        // Normalize username and email for case-insensitive check
        const email = req.body.email.toLowerCase().trim();
        const username = (req.body.username || req.body.email.split('@')[0]).toLowerCase().trim();

        // Check if email or username already exists (case-insensitive)
        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { username: username }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ email: 'האימייל כבר קיים במערכת' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ username: 'שם המשתמש כבר תפוס' });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Create new user
        const newUser = new User({
            name: req.body.name,
            email: email,
            username: username,
            password: hashedPassword,
            role: req.body.role || 'client',
            businessName: req.body.businessName || '',
            phoneNumber: req.body.phoneNumber || '',
            credits: req.body.credits || 0
        });

        const savedUser = await newUser.save();

        // Generate JWT token for auto-login
        const payload = {
            id: savedUser.id,
            name: savedUser.name,
            username: savedUser.username,
            email: savedUser.email,
            role: savedUser.role,
            credits: savedUser.credits
        };

        jwt.sign(
            payload,
            keys.secretOrKey,
            { expiresIn: 31556926 }, // 1 year
            (err, token) => {
                if (err) throw err;
                return res.status(200).json({
                    success: true,
                    token: 'Bearer ' + token,
                    message: 'נרשמת בהצלחה!'
                });
            }
        );

    } catch (err) {
        console.error('Registration error:', err);

        // Handle MongoDB duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            if (field === 'email') {
                return res.status(400).json({ email: 'האימייל כבר קיים במערכת' });
            }
            if (field === 'username') {
                return res.status(400).json({ username: 'שם המשתמש כבר תפוס' });
            }
        }

        return res.status(500).json({ message: 'שגיאה ביצירת משתמש' });
    }
});

router.post('/login', (req, res) => {
    const { errors, isValid } = validateLoginInput(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email }).then(user => {
        console.log({user});
        if (!user) {
            return res.status(404).json({ email: 'Email not found' });
        }
        // Check if user is active and not suspended
        if (!user.isActive || user.isSuspended) {
            return res.status(403).json({ message: 'המשתמש מושעה או לא פעיל' });
        }

        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                const payload = {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    credits: user.credits
                };
                jwt.sign(
                    payload,
                    keys.secretOrKey,
                    {
                        expiresIn: 31556926 // 1 year in seconds
                    },
                    (err, token) => {
                        res.json({
                            success: true,
                            token: 'Bearer ' + token,
                            user: user.name
                        });
                    }
                );
            } else {
                return res
                    .status(400)
                    .json({ password: 'Password incorrect' });
            }
        });
    });
});


// @route   GET api/users/public/:username
// @desc    Get public business owner details
// @access  Public
router.get('/public/:username', (req, res) => {
    User.findOne({
        username: req.params.username,
    })
    .select('-password')
    .then(user => {
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }
        // Check if active and business owner (unless it's just a check)
        if (!user.isActive || user.isSuspended) {
             return res.status(404).json({ message: 'משתמש לא זמין' });
        }
        res.json(user);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    });
});

module.exports = router;
