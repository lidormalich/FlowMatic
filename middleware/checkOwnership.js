const Event = require('../models/Event');

async function checkAppointmentOwnership(req, res, next) {
  try {
    const appointment = await Event.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'תור לא נמצא' });
    }

    if (appointment.businessOwnerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'אין הרשאה' });
    }

    req.appointment = appointment;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
}

module.exports = checkAppointmentOwnership;
