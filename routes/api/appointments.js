const express = require('express');
const router = express.Router();
const passport = require('passport');
const Joi = require('joi');
const moment = require('moment');
const Event = require('../../models/Event');
const User = require('../../models/User');
const AppointmentType = require('../../models/AppointmentType');
const Client = require('../../models/Client');
const { sendAppointmentConfirmationSMS, sendAppointmentCancellationSMS } = require('../../services/smsService');

const BUFFER_MINUTES = 5; // מרווח ביטחון בין תורים

// Joi Validation Schema
const appointmentValidation = Joi.object({
  appointmentTypeId: Joi.string().optional().allow(null, ''),
  customerName: Joi.string().min(2).max(100).required(),
  customerPhone: Joi.string().pattern(/^05\d{8}$/).optional().allow(''),
  customerEmail: Joi.string().email().optional().allow(''),
  date: Joi.date().min('2000-01-01').required(), // Relaxed date check
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'blocked').optional(),
  duration: Joi.number().optional(),
  service: Joi.string().required(),
  price: Joi.number().optional(),
  customerId: Joi.string().optional().allow(null, ''),
  businessOwnerId: Joi.string().optional().allow(null, '')
});

// Helper: Calculate Available Slots with Buffer
async function calculateAvailableSlots(businessOwnerId, date, duration) {
  try {
    const owner = await User.findById(businessOwnerId);
    if (!owner) {
      console.log(`[AVAILABILITY] Owner not found: ${businessOwnerId}`);
      return [];
    }

    // Harden business hours defaults
    const bh = owner.businessHours || {};
    const startHour = typeof bh.startHour === 'number' ? bh.startHour : 9;
    const endHour = typeof bh.endHour === 'number' ? bh.endHour : 17;
    const workingDays = Array.isArray(bh.workingDays) ? bh.workingDays : [0, 1, 2, 3, 4, 5];
    const slotInterval = typeof bh.slotInterval === 'number' && bh.slotInterval > 0 ? bh.slotInterval : 30;
    const breakTime = bh.breakTime || { enabled: false };

    // Ensure duration is valid
    const slotDuration = parseInt(duration) || 30;
    if (slotDuration <= 0) return [];

    console.log(`--- [AVAILABILITY] ${owner.username} | Date: ${date} | Dur: ${slotDuration} | Interval: ${slotInterval} ---`);
    console.log(`Config: ${startHour}:00 - ${endHour}:00 | Days: [${workingDays}]`);
    if (breakTime.enabled) {
      console.log(`Break: ${breakTime.startHour}:${String(breakTime.startMinute || 0).padStart(2, '0')} - ${breakTime.endHour}:${String(breakTime.endMinute || 0).padStart(2, '0')}`);
    }

    const requestedDate = moment(date).startOf('day');
    const dayOfWeek = requestedDate.day();
    
    // Convert to numbers for safety
    const numericWorkingDays = workingDays.map(d => parseInt(d));

    if (!numericWorkingDays.includes(dayOfWeek)) {
      console.log(`[AVAILABILITY] FAILED: Day ${dayOfWeek} is not a working day.`);
      return [];
    }

    // Get existing appointments for the SPECIFIC day
    // We use startOf/endOf day in UTC to avoid missing any appointments
    const appointments = await Event.find({
      businessOwnerId: owner._id,
      date: {
        $gte: requestedDate.clone().startOf('day').toDate(),
        $lte: requestedDate.clone().endOf('day').toDate()
      },
      status: { $in: ['pending', 'confirmed', 'blocked'] }
    }).sort('startTime');
    
    console.log(`[AVAILABILITY] Found ${appointments.length} existing events.`);

    const slots = [];
    const now = moment();
    const isToday = requestedDate.isSame(now, 'day');

    // Start iterating from startHour
    let currentTime = requestedDate.clone().hour(startHour).minute(0);
    const endTime = requestedDate.clone().hour(endHour).minute(0);

    // If it's today and we're starting before "now", we can skip ahead
    if (isToday && currentTime.isBefore(now)) {
      // Round up to the next slot interval after "now"
      const remainder = now.minute() % slotInterval;
      currentTime = now.clone().add(remainder === 0 ? 0 : slotInterval - remainder, 'minutes').startOf('minute');
    }

    // Prepare break time boundaries if enabled
    let breakStart = null;
    let breakEnd = null;
    if (breakTime.enabled) {
      breakStart = requestedDate.clone().hour(breakTime.startHour).minute(breakTime.startMinute || 0);
      breakEnd = requestedDate.clone().hour(breakTime.endHour).minute(breakTime.endMinute || 0);
    }

    console.log(`[AVAILABILITY] Loop Start: ${currentTime.format('HH:mm')} | End: ${endTime.format('HH:mm')}`);

    while (currentTime.clone().add(slotDuration, 'minutes').isSameOrBefore(endTime)) {
      const slotStartStr = currentTime.format('HH:mm');
      const slotEndMoment = currentTime.clone().add(slotDuration, 'minutes');

      // Skip slots that overlap with break time
      if (breakStart && breakEnd) {
        if (currentTime.isBefore(breakEnd) && slotEndMoment.isAfter(breakStart)) {
          currentTime.add(slotInterval, 'minutes');
          continue;
        }
      }

      // Check overlap with existing appointments
      const isAvailable = !appointments.some(apt => {
        const aptStartMoment = moment(slotStartStr, 'HH:mm');
        const aptEndMoment = moment(slotStartStr, 'HH:mm').add(slotDuration, 'minutes');

        const existingStart = moment(apt.startTime, 'HH:mm').subtract(BUFFER_MINUTES, 'minutes');
        const existingEnd = moment(apt.endTime, 'HH:mm').add(BUFFER_MINUTES, 'minutes');

        return (
          (aptStartMoment.isSameOrAfter(existingStart) && aptStartMoment.isBefore(existingEnd)) ||
          (aptEndMoment.isAfter(existingStart) && aptEndMoment.isSameOrBefore(existingEnd)) ||
          (aptStartMoment.isSameOrBefore(existingStart) && aptEndMoment.isSameOrAfter(existingEnd))
        );
      });

      if (isAvailable) {
        slots.push(slotStartStr);
      }

      currentTime.add(slotInterval, 'minutes');
    }

    console.log(`[AVAILABILITY] Result: ${slots.length} slots found. [${slots.join(', ')}]`);
    return slots;
  } catch (error) {
    console.error('[AVAILABILITY] Error:', error);
    return [];
  }
}

// GET /api/appointments/stats - Get dashboard statistics
router.get('/stats', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const businessOwnerId = req.user.id;
    console.log(`[STATS] Fetching stats for Owner: ${businessOwnerId} (Name: ${req.user.name})`);

    // Get today's date range
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    // Get this month's date range
    const monthStart = moment().startOf('month').toDate();
    const monthEnd = moment().endOf('month').toDate();

    // Get this week's date range
    const weekStart = moment().startOf('week').toDate();
    const weekEnd = moment().endOf('week').toDate();

    // Today's appointments count
    const todayAppointments = await Event.countDocuments({
      businessOwnerId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Monthly revenue (completed appointments)
    const monthlyRevenueResult = await Event.aggregate([
      {
        $match: {
          businessOwnerId: req.user._id || new (require('mongoose').Types.ObjectId)(req.user.id),
          date: { $gte: monthStart, $lte: monthEnd },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' }
        }
      }
    ]);
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

    // New clients this month (unique phone numbers from this month's appointments)
    const newClientsResult = await Event.aggregate([
      {
        $match: {
          businessOwnerId: req.user._id || new (require('mongoose').Types.ObjectId)(req.user.id),
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: '$customerPhone'
        }
      },
      {
        $count: 'total'
      }
    ]);
    const newClients = newClientsResult[0]?.total || 0;

    // Upcoming appointments this week
    const upcomingAppointments = await Event.countDocuments({
      businessOwnerId,
      date: { $gte: todayStart, $lte: weekEnd },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Total completed this month
    const completedThisMonth = await Event.countDocuments({
      businessOwnerId,
      date: { $gte: monthStart, $lte: monthEnd },
      status: 'completed'
    });

    res.json({
      todayAppointments,
      monthlyRevenue,
      newClients,
      upcomingAppointments,
      completedThisMonth
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// GET /api/appointments - Get all appointments for authenticated user
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    console.log(`[LIST] Fetching appointments for Owner: ${req.user.id}`);
    const appointments = await Event.find({ businessOwnerId: req.user.id })
      .populate('appointmentTypeId')
      .sort({ date: -1, startTime: 1 });

    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// GET /api/appointments/available/:username - Public endpoint for availability
router.get('/available/:username', async (req, res) => {
  try {
    const { date, duration = 60 } = req.query;
    console.log(`[DEBUG] Availability Request: username="${req.params.username}", date="${date}"`);
    
    // Find business owner (case-insensitive) - Allow both business_owner    // Find business owner (case-insensitive)
    const owner = await User.findOne({
      username: { $regex: new RegExp(`^${req.params.username}$`, 'i') },
      isActive: true,
      role: { $in: ['business_owner', 'admin'] } // Allow admin role
    });

    if (!owner) {
      console.log(`[AVAILABILITY] FAILED for "${req.params.username}"`);
      // Diagnostic check: why did it fail?
      const diagnosticUser = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
      if (!diagnosticUser) {
        console.log(`[DEBUG] Reason: User NOT FOUND in database at all.`);
      } else {
        console.log(`[DEBUG] Reason: User found but check failed. isActive=${diagnosticUser.isActive}, role=${diagnosticUser.role}`);
      }
      return res.status(404).json({ message: 'עסק לא נמצא' });
    }

    console.log(`[AVAILABILITY] SUCCESS: Found user ${owner.username} (${owner._id})`);

    const slots = await calculateAvailableSlots(owner._id, date, parseInt(duration));

    res.json({ times: slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// GET /api/appointments/my-bookings - Get appointments where user is the customer
router.get('/my-bookings', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const bookings = await Event.find({ customerId: req.user.id })
      .populate('businessOwnerId', 'name businessName profileImage')
      .sort({ date: -1, startTime: 1 });

    res.json(bookings);
  } catch (err) {
    console.error('My bookings error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// POST /api/appointments/public/:username - Book appointment (public)
router.post('/public/:username', async (req, res) => {
  try {
    // Validate input
    const { error, value } = appointmentValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { appointmentTypeId, customerName, customerPhone, customerEmail, date, startTime, description, customerId } = value;

    // Find business owner (case-insensitive)
    const owner = await User.findOne({
      username: { $regex: new RegExp(`^${req.params.username}$`, 'i') },
      isActive: true,
      role: { $in: ['business_owner', 'admin'] }
    });

    if (!owner) {
      console.log(`[BOOKING] FAILED: Owner "${req.params.username}" not found.`);
      return res.status(404).json({ message: 'עסק לא נמצא' });
    }

    console.log(`[BOOKING] Found Owner: ${owner.username} (${owner._id})`);
    console.log(`[BOOKING] Customer Info: Name=${customerName}, ID=${customerId || 'guest'}`);

    // Check if client is blocked
    if (customerPhone) {
      const blockedClient = await Client.findOne({
        businessOwnerId: owner._id,
        phone: customerPhone,
        isBlocked: true
      });
      if (blockedClient) {
        console.log(`[BOOKING] BLOCKED: Client ${customerPhone} is blocked for owner ${owner._id}`);
        return res.status(403).json({ message: 'לא ניתן לקבוע תור. אנא צור קשר עם העסק.' });
      }
    }

    // Get appointment type
    const appointmentType = await AppointmentType.findOne({
      _id: appointmentTypeId,
      userId: owner._id,
      isActive: true
    });

    if (!appointmentType) {
      return res.status(404).json({ message: 'סוג תור לא נמצא' });
    }

    // Calculate end time
    const [hours, minutes] = startTime.split(':');
    const startDateTime = moment(date).hour(parseInt(hours)).minute(parseInt(minutes));
    const endDateTime = startDateTime.clone().add(appointmentType.duration, 'minutes');

    // Check if slot is still available
    const slots = await calculateAvailableSlots(owner._id, date, appointmentType.duration);
    if (!slots.includes(startTime)) {
      return res.status(400).json({ message: 'השעה שנבחרה כבר תפוסה' });
    }

    // Create appointment
    const newAppointment = new Event({
      businessOwnerId: owner._id,
      appointmentTypeId,
      customerId: customerId || null,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      date: moment(date).toDate(),
      startTime,
      endTime: endDateTime.format('HH:mm'),
      duration: appointmentType.duration,
      service: appointmentType.name,
      price: appointmentType.price,
      description: description || '',
      status: 'pending'
    });

    await newAppointment.save();
    console.log(`[BOOKING] SUCCESS: Saved appointment ${newAppointment._id} for Owner ${owner._id}`);

    // Send SMS confirmation if enabled and user has credits
    if (owner.smsNotifications?.enabled && owner.credits >= 2) {
      try {
        await sendAppointmentConfirmationSMS(newAppointment, owner);
      } catch (smsErr) {
        console.error('SMS Error:', smsErr.message);
        // Don't fail the appointment creation if SMS fails
      }
    }

    res.status(201).json({
      message: 'התור נקבע בהצלחה',
      appointment: newAppointment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// POST /api/appointments - Create new appointment (authed)
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { error, value } = appointmentValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { appointmentTypeId, customerName, customerPhone, customerEmail, date, startTime, description, status, duration, service, price } = value;

    // Calculate end time
    const [hours, minutes] = startTime.split(':');
    const startDateTime = moment(date).hour(parseInt(hours)).minute(parseInt(minutes));
    
    // Use provided duration or default to 60
    const finalDuration = duration || 60;
    const endDateTime = startDateTime.clone().add(finalDuration, 'minutes');

    const newAppointment = new Event({
      businessOwnerId: req.user.id,
      appointmentTypeId: appointmentTypeId || null,
      customerName,
      customerPhone: customerPhone || '0000000000',
      customerEmail: customerEmail || '',
      date: moment(date).toDate(),
      startTime,
      endTime: endDateTime.format('HH:mm'),
      duration: finalDuration,
      service,
      price: price || 0,
      description: description || '',
      status: status || 'confirmed'
    });

    await newAppointment.save();

    res.status(201).json({
      message: 'התור נוסף בהצלחה',
      appointment: newAppointment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// PUT /api/appointments/:id - Update appointment
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const appointment = await Event.findOne({
      _id: req.params.id,
      businessOwnerId: req.user.id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'תור לא נמצא' });
    }

    // Update allowed fields
    const { status, customerName, customerPhone, customerEmail, date, startTime, description } = req.body;

    if (status) appointment.status = status;
    if (customerName) appointment.customerName = customerName;
    if (customerPhone) appointment.customerPhone = customerPhone;
    if (customerEmail !== undefined) appointment.customerEmail = customerEmail;
    if (description !== undefined) appointment.description = description;

    if (date || startTime) {
      // Recalculate end time if time changes
      const appointmentType = await AppointmentType.findById(appointment.appointmentTypeId);

      if (date) appointment.date = moment(date).toDate();
      if (startTime) {
        appointment.startTime = startTime;
        const [hours, minutes] = startTime.split(':');
        const startDateTime = moment(appointment.date).hour(parseInt(hours)).minute(parseInt(minutes));
        appointment.endTime = startDateTime.clone().add(appointmentType.duration, 'minutes').format('HH:mm');
      }
    }

    await appointment.save();

    res.json({ message: 'התור עודכן בהצלחה', appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// DELETE /api/appointments/:id - Cancel appointment
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const appointment = await Event.findOne({
      _id: req.params.id,
      businessOwnerId: req.user.id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'תור לא נמצא' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: 'התור בוטל בהצלחה' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// POST /api/appointments/:id/cancel - Public cancellation with policy
router.post('/:id/cancel', async (req, res) => {
  try {
    const { customerPhone } = req.body;

    const appointment = await Event.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'תור לא נמצא' });
    }

    // Verify customer phone (simple security)
    if (appointment.customerPhone !== customerPhone) {
      return res.status(403).json({ message: 'אין הרשאה לבטל תור זה' });
    }

    // Check cancellation policy (24 hours before)
    const owner = await User.findById(appointment.businessOwnerId);
    const hoursBeforeLimit = owner.cancellationPolicy?.hoursBefore || 24;

    const [hours, minutes] = appointment.startTime.split(':');
    const appointmentDateTime = moment(appointment.date).hour(parseInt(hours)).minute(parseInt(minutes));
    const hoursUntilAppointment = appointmentDateTime.diff(moment(), 'hours');

    if (hoursUntilAppointment < hoursBeforeLimit) {
      return res.status(400).json({
        message: `לא ניתן לבטל תור פחות מ-${hoursBeforeLimit} שעות לפני המועד`
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Send cancellation SMS if enabled and user has credits
    if (owner.smsNotifications?.enabled && owner.credits >= 2) {
      try {
        await sendAppointmentCancellationSMS(appointment, owner);
      } catch (smsErr) {
        console.error('SMS Error:', smsErr.message);
        // Don't fail the cancellation if SMS fails
      }
    }

    res.json({ message: 'התור בוטל בהצלחה' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
