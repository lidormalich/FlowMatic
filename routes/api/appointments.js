const express = require('express');
const router = express.Router();
const passport = require('passport');
const Joi = require('joi');
const moment = require('moment');
const Event = require('../../models/Event');
const User = require('../../models/User');
const AppointmentType = require('../../models/AppointmentType');
const { sendAppointmentConfirmationSMS, sendAppointmentCancellationSMS } = require('../../services/smsService');

const BUFFER_MINUTES = 5; // מרווח ביטחון בין תורים

// Joi Validation Schema
const appointmentValidation = Joi.object({
  appointmentTypeId: Joi.string().required(),
  customerName: Joi.string().min(2).max(100).required(),
  customerPhone: Joi.string().pattern(/^05\d{8}$/).required(),
  customerEmail: Joi.string().email().optional().allow(''),
  date: Joi.date().min('now').required(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  description: Joi.string().optional().allow('')
});

// Helper: Calculate Available Slots with Buffer
async function calculateAvailableSlots(businessOwnerId, date, duration) {
  const owner = await User.findById(businessOwnerId);
  if (!owner) throw new Error('Business owner not found');

  const { startHour, endHour, workingDays } = owner.businessHours;

  // Check if date is a working day
  const dayOfWeek = moment(date).day();
  if (!workingDays.includes(dayOfWeek)) {
    return []; // Not a working day
  }

  // Get all existing appointments for this date
  const appointments = await Event.find({
    businessOwnerId,
    date: {
      $gte: moment(date).startOf('day').toDate(),
      $lte: moment(date).endOf('day').toDate()
    },
    status: { $in: ['pending', 'confirmed'] }
  }).sort('startTime');

  // Generate time slots (30-minute intervals)
  const slots = [];
  let currentTime = moment(date).hour(startHour).minute(0);
  const endTime = moment(date).hour(endHour).minute(0);

  while (currentTime.clone().add(duration, 'minutes').isSameOrBefore(endTime)) {
    const slotStart = currentTime.format('HH:mm');
    const slotEnd = currentTime.clone().add(duration, 'minutes').format('HH:mm');

    // Check overlap with existing appointments (including Buffer)
    const isAvailable = !appointments.some(apt => {
      const aptStart = moment(apt.startTime, 'HH:mm').subtract(BUFFER_MINUTES, 'minutes');
      const aptEnd = moment(apt.endTime, 'HH:mm').add(BUFFER_MINUTES, 'minutes');
      const slotStartMoment = moment(slotStart, 'HH:mm');
      const slotEndMoment = moment(slotEnd, 'HH:mm');

      // Check if there's any overlap
      return (
        (slotStartMoment.isSameOrAfter(aptStart) && slotStartMoment.isBefore(aptEnd)) ||
        (slotEndMoment.isAfter(aptStart) && slotEndMoment.isSameOrBefore(aptEnd)) ||
        (slotStartMoment.isSameOrBefore(aptStart) && slotEndMoment.isSameOrAfter(aptEnd))
      );
    });

    if (isAvailable) {
      slots.push(slotStart);
    }

    currentTime.add(30, 'minutes');
  }

  return slots;
}

// GET /api/appointments - Get all appointments for authenticated user
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
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

    if (!date) {
      return res.status(400).json({ message: 'תאריך נדרש' });
    }

    // Find business owner
    const owner = await User.findOne({
      username: req.params.username,
      isActive: true,
      isSuspended: false,
      role: 'business_owner'
    });

    if (!owner) {
      return res.status(404).json({ message: 'עסק לא נמצא' });
    }

    const slots = await calculateAvailableSlots(owner._id, date, parseInt(duration));

    res.json({ times: slots });
  } catch (err) {
    console.error(err);
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

    const { appointmentTypeId, customerName, customerPhone, customerEmail, date, startTime, description } = value;

    // Find business owner
    const owner = await User.findOne({
      username: req.params.username,
      isActive: true,
      isSuspended: false,
      role: 'business_owner'
    });

    if (!owner) {
      return res.status(404).json({ message: 'עסק לא נמצא' });
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

// POST /api/appointments - Create appointment (business owner)
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { appointmentTypeId, customerName, customerPhone, customerEmail, date, startTime, description } = req.body;

    const appointmentType = await AppointmentType.findOne({
      _id: appointmentTypeId,
      userId: req.user.id
    });

    if (!appointmentType) {
      return res.status(404).json({ message: 'סוג תור לא נמצא' });
    }

    // Calculate end time
    const [hours, minutes] = startTime.split(':');
    const startDateTime = moment(date).hour(parseInt(hours)).minute(parseInt(minutes));
    const endDateTime = startDateTime.clone().add(appointmentType.duration, 'minutes');

    const newAppointment = new Event({
      businessOwnerId: req.user.id,
      appointmentTypeId,
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
      status: 'confirmed'
    });

    await newAppointment.save();

    // Send SMS confirmation if enabled and user has credits
    const owner = await User.findById(req.user.id);
    if (owner.smsNotifications?.enabled && owner.credits >= 2) {
      try {
        await sendAppointmentConfirmationSMS(newAppointment, owner);
      } catch (smsErr) {
        console.error('SMS Error:', smsErr.message);
        // Don't fail the appointment creation if SMS fails
      }
    }

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
