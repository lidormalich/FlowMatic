const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const multer = require('multer');
const { Readable } = require('stream');
const keys = require('../../config/keys');
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');
const validateUpdateUserInput = require('../../validation/updateUser');
const User = require('../../models/User');
const Event = require('../../models/Event');
const AuditLog = require('../../models/AuditLog');
const cloudinary = require('../../utils/cloudinary');
const logger = require('../../utils/logger');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('קובץ לא תקין — יש להעלות תמונה בלבד'));
  }
});

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


// @route   PUT api/users/onboarding
// @desc    Complete onboarding — saves business info + services, marks isOnboarded=true
// @access  Private
router.put('/onboarding', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const AppointmentType = require('../../models/AppointmentType');
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

        const { businessName, businessType, phoneNumber, businessHours, services } = req.body;

        if (businessName) user.businessName = businessName;
        if (businessType) user.businessType = businessType;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (businessHours) {
            user.businessHours = {
                ...user.businessHours.toObject ? user.businessHours.toObject() : user.businessHours,
                ...businessHours
            };
        }
        user.isOnboarded = true;
        await user.save();

        if (Array.isArray(services) && services.length > 0) {
            const validServices = services.filter(s => s.name && s.name.trim());
            if (validServices.length > 0) {
                await AppointmentType.insertMany(
                    validServices.map(s => ({
                        userId: user._id,
                        name: s.name.trim(),
                        duration: s.duration || 60,
                        price: s.price || 0,
                        color: '#667eea',
                        isActive: true
                    }))
                );
            }
        }

        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json(updatedUser);
    } catch (err) {
        console.error('Onboarding error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   PUT api/users/:id/subscription
// @desc    Update subscription status (admin only)
// @access  Private/Admin
router.put('/:id/subscription', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'אין הרשאה' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

        const { status, notes } = req.body;
        if (status) user.subscription.status = status;
        if (status === 'active' && !user.subscription.subscribedAt) {
            user.subscription.subscribedAt = new Date();
        }
        if (notes !== undefined) user.subscription.notes = notes;

        await user.save();
        const updated = await User.findById(req.params.id).select('-password');
        res.json(updated);
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
        if (req.body.showHebrewDateInBooking !== undefined) user.showHebrewDateInBooking = req.body.showHebrewDateInBooking;

        // Hebrew Calendar Settings
        if (req.body.hebrewCalendar) {
            if (!user.hebrewCalendar) user.hebrewCalendar = {};
            if (req.body.hebrewCalendar.showHolidays !== undefined) user.hebrewCalendar.showHolidays = req.body.hebrewCalendar.showHolidays;
            if (req.body.hebrewCalendar.showShabbat !== undefined) user.hebrewCalendar.showShabbat = req.body.hebrewCalendar.showShabbat;
            if (req.body.hebrewCalendar.showEvents !== undefined) user.hebrewCalendar.showEvents = req.body.hebrewCalendar.showEvents;
        }

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

        if (!req.body.agreedToTerms) {
            return res.status(400).json({ message: 'יש לאשר את תנאי השימוש כדי להירשם' });
        }

        const { errors, isValid } = validateRegisterInput(req.body);
        if (!isValid) {
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
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '';
        const newUser = new User({
            name: req.body.name,
            email: email,
            username: username,
            password: hashedPassword,
            role: req.body.role || 'client',
            businessName: req.body.businessName || '',
            phoneNumber: req.body.phoneNumber || '',
            credits: req.body.credits || 0,
            tos: {
                agreedAt: new Date(),
                version: req.body.tosVersion || '1.0',
                ip: clientIp
            }
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

router.post('/login', async (req, res) => {
    const { errors, isValid } = validateLoginInput(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }
    try {
        const email = req.body.email;
        const password = req.body.password;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ email: 'Email not found' });
        }
        if (!user.isActive || user.isSuspended) {
            return res.status(403).json({ message: 'המשתמש מושעה או לא פעיל' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ password: 'Password incorrect' });
        }

        // Track login stats
        user.lastLoginAt = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        // Audit log
        AuditLog.create({
            userId: user._id,
            action: 'login',
            resource: 'auth',
            details: { email: user.email },
            ip: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '',
            userAgent: req.headers['user-agent'] || ''
        }).catch(err => logger.error('AuditLog write failed:', err));

        const payload = {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            credits: user.credits
        };

        jwt.sign(payload, keys.secretOrKey, { expiresIn: 31556926 }, (err, token) => {
            if (err) throw err;
            res.json({ success: true, token: 'Bearer ' + token, user: user.name });
        });
    } catch (err) {
        logger.error('Login error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
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

// @route   POST api/users/upload-profile-image
// @desc    Upload business logo to Cloudinary
// @access  Private
router.post('/upload-profile-image', passport.authenticate('jwt', { session: false }), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'לא נבחר קובץ' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'flowmatic',
          public_id: `logo_${req.user.id}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [{ width: 400, height: 400, crop: 'limit' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      Readable.from(req.file.buffer).pipe(stream);
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'שגיאה בהעלאת התמונה' });
  }
});

// @route   GET api/users/admin/stats
// @desc    Super-admin dashboard stats across all businesses
// @access  Private/Admin
router.get('/admin/stats', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'אין הרשאה' });

    const mongoose = require('mongoose');
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // All business owners
    const businesses = await User.find({ role: 'business_owner' })
      .select('name email businessName createdAt isActive isSuspended credits themeSettings tos subscription lastLoginAt loginCount usageStats')
      .sort({ createdAt: -1 });

    const businessIds = businesses.map(b => b._id);

    // Appointment stats per business
    const appointmentStats = await Event.aggregate([
      { $match: { businessOwnerId: { $in: businessIds } } },
      {
        $group: {
          _id: '$businessOwnerId',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          noShow: { $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0] } },
          lastActivity: { $max: '$createdAt' },
          thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] } },
          lastMonth: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfLastMonth] }, { $lte: ['$createdAt', endOfLastMonth] }] }, 1, 0] } },
          uniqueClients: { $addToSet: '$customerPhone' }
        }
      }
    ]);

    const statsMap = {};
    appointmentStats.forEach(s => { statsMap[s._id.toString()] = s; });

    const businessesWithStats = businesses.map(b => {
      const stats = statsMap[b._id.toString()] || { total: 0, completed: 0, cancelled: 0, noShow: 0, revenue: 0, lastActivity: null, thisMonth: 0, lastMonth: 0, uniqueClients: [] };
      const isInactive = !stats.lastActivity || stats.lastActivity < thirtyDaysAgo;
      const engagementRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      return {
        ...b.toJSON(),
        totalAppointments: stats.total,
        completedAppointments: stats.completed,
        cancelledAppointments: stats.cancelled,
        noShowAppointments: stats.noShow,
        totalRevenue: stats.revenue,
        appointmentsThisMonth: stats.thisMonth,
        appointmentsLastMonth: stats.lastMonth,
        uniqueClientsCount: stats.uniqueClients.length,
        lastActivity: stats.lastActivity,
        isInactive,
        engagementRate,
        loginCount: b.loginCount || 0,
        lastLoginAt: b.lastLoginAt || null,
        usageStats: b.usageStats || {}
      };
    });

    // Global KPIs
    const globalStats = await Event.aggregate([
      { $group: {
        _id: null,
        totalAppointments: { $sum: 1 },
        totalCompleted: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        totalCancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalNoShow: { $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0] } },
        thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] } },
        lastMonth: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfLastMonth] }, { $lte: ['$createdAt', endOfLastMonth] }] }, 1, 0] } },
        uniqueClients: { $addToSet: '$customerPhone' }
      }}
    ]);

    const g = globalStats[0] || { totalAppointments: 0, totalCompleted: 0, totalCancelled: 0, totalNoShow: 0, totalRevenue: 0, thisMonth: 0, lastMonth: 0, uniqueClients: [] };

    // New businesses this month vs last month
    const newThisMonth = businesses.filter(b => b.createdAt >= startOfMonth).length;
    const newLastMonth = businesses.filter(b => b.createdAt >= startOfLastMonth && b.createdAt <= endOfLastMonth).length;
    const growthRate = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : null;

    // ToS compliance
    const tosCompliant = businesses.filter(b => b.tos?.agreedAt).length;

    // Engaged businesses (10+ appointments total)
    const engagedBusinesses = businessesWithStats.filter(b => b.totalAppointments >= 10).length;

    // Average appointments per active business
    const activeBusinesses = businessesWithStats.filter(b => !b.isInactive && !b.isSuspended);
    const avgAppointmentsPerBusiness = activeBusinesses.length > 0
      ? Math.round(activeBusinesses.reduce((s, b) => s + b.appointmentsThisMonth, 0) / activeBusinesses.length)
      : 0;

    // MoM appointment growth
    const appointmentGrowthRate = g.lastMonth > 0 ? Math.round(((g.thisMonth - g.lastMonth) / g.lastMonth) * 100) : null;

    // No-show rate
    const noShowRate = g.totalAppointments > 0 ? Math.round((g.totalNoShow / g.totalAppointments) * 100) : 0;
    const cancellationRate = g.totalAppointments > 0 ? Math.round((g.totalCancelled / g.totalAppointments) * 100) : 0;

    res.json({
      businesses: businessesWithStats,
      totals: {
        businesses: businesses.length,
        activeBusinesses: activeBusinesses.length,
        inactiveBusinesses: businessesWithStats.filter(b => b.isInactive && !b.isSuspended).length,
        suspendedBusinesses: businessesWithStats.filter(b => b.isSuspended).length,
        engagedBusinesses,
        totalAppointments: g.totalAppointments,
        totalRevenue: g.totalRevenue,
        appointmentsThisMonth: g.thisMonth,
        appointmentsLastMonth: g.lastMonth,
        totalUniqueClients: g.uniqueClients.length,
        newBusinessesThisMonth: newThisMonth,
        newBusinessesLastMonth: newLastMonth
      },
      kpis: {
        growthRate,
        appointmentGrowthRate,
        noShowRate,
        cancellationRate,
        avgAppointmentsPerBusiness,
        tosCompliantRate: businesses.length > 0 ? Math.round((tosCompliant / businesses.length) * 100) : 0,
        tosCompliantCount: tosCompliant,
        platformConversionRate: businesses.length > 0 ? Math.round((engagedBusinesses / businesses.length) * 100) : 0,
        avgRevenuePerBusiness: activeBusinesses.length > 0
          ? Math.round(activeBusinesses.reduce((s, b) => s + b.totalRevenue, 0) / activeBusinesses.length)
          : 0
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// @route   GET api/users/admin/business/:id
// @desc    Full business profile for admin — stats, recent appointments, audit trail, usage
// @access  Private/Admin
router.get('/admin/business/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'אין הרשאה' });

    const mongoose = require('mongoose');
    const businessId = mongoose.Types.ObjectId.isValid(req.params.id)
      ? new mongoose.Types.ObjectId(req.params.id)
      : null;
    if (!businessId) return res.status(400).json({ message: 'מזהה לא תקין' });

    const user = await User.findById(businessId).select('-password');
    if (!user) return res.status(404).json({ message: 'עסק לא נמצא' });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [appointmentStats, recentAppointments, auditLogs] = await Promise.all([
      Event.aggregate([
        { $match: { businessOwnerId: businessId } },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          noShow: { $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0] } },
          thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] } },
          lastMonth: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfLastMonth] }, { $lte: ['$createdAt', endOfLastMonth] }] }, 1, 0] } },
          uniqueClients: { $addToSet: '$customerPhone' },
          lastActivity: { $max: '$createdAt' }
        }}
      ]),
      Event.find({ businessOwnerId: businessId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('customerName customerPhone date startTime endTime status price createdAt'),
      AuditLog.find({ userId: businessId })
        .sort({ timestamp: -1 })
        .limit(50)
        .select('action resource details ip userAgent timestamp')
    ]);

    const stats = appointmentStats[0] || { total: 0, completed: 0, cancelled: 0, noShow: 0, revenue: 0, thisMonth: 0, lastMonth: 0, uniqueClients: [], lastActivity: null };

    res.json({
      user,
      stats: {
        totalAppointments: stats.total,
        completedAppointments: stats.completed,
        cancelledAppointments: stats.cancelled,
        noShowAppointments: stats.noShow,
        totalRevenue: stats.revenue,
        appointmentsThisMonth: stats.thisMonth,
        appointmentsLastMonth: stats.lastMonth,
        uniqueClientsCount: stats.uniqueClients.length,
        lastActivity: stats.lastActivity,
        loginCount: user.loginCount || 0,
        lastLoginAt: user.lastLoginAt,
        usageStats: user.usageStats
      },
      recentAppointments,
      auditLogs
    });
  } catch (err) {
    logger.error('Admin business detail error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// @route   POST api/users/admin/system-logs
// @desc    Query system logs from MongoDB
// @access  Private/Admin
router.get('/admin/system-logs', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'אין הרשאה' });

    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const collection = db.collection('system_logs');

    const { level, limit = 100, skip = 0 } = req.query;
    const filter = {};
    if (level) filter.level = level;

    const logs = await collection
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    const total = await collection.countDocuments(filter);
    res.json({ logs, total });
  } catch (err) {
    logger.error('System logs query error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
