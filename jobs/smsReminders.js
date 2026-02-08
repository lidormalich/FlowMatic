const cron = require('node-cron');
const moment = require('moment');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendAppointmentReminderSMS } = require('../services/smsService');

/**
 * Cron job that runs every hour and sends SMS reminders
 * for appointments that are exactly 24 hours away
 */
function startSMSReminderJob() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('Running SMS reminder job...');

    try {
      // Calculate time range: 24 hours from now (±30 minutes window)
      const reminderTime = moment().add(24, 'hours');
      const reminderStart = reminderTime.clone().subtract(30, 'minutes').toDate();
      const reminderEnd = reminderTime.clone().add(30, 'minutes').toDate();

      // Find all appointments in the next 24 hours that haven't received reminder
      const appointments = await Event.find({
        date: {
          $gte: reminderStart,
          $lte: reminderEnd
        },
        status: { $in: ['pending', 'confirmed'] },
        smsReminderSent: false
      });

      console.log(`Found ${appointments.length} appointments needing reminders`);

      // Process each appointment
      for (const appointment of appointments) {
        try {
          // Get business owner details
          const owner = await User.findById(appointment.businessOwnerId);

          if (!owner) {
            console.error(`Business owner not found for appointment ${appointment._id}`);
            continue;
          }

          // Check if SMS notifications are enabled and user has credits
          if (!owner.smsNotifications?.enabled) {
            console.log(`SMS notifications disabled for ${owner.name}`);
            continue;
          }

          if (owner.credits < 2) {
            console.log(`Insufficient credits for ${owner.name} (${owner.credits} credits)`);
            continue;
          }

          // Send reminder SMS
          const success = await sendAppointmentReminderSMS(appointment, owner);

          if (success) {
            console.log(`SMS reminder sent for appointment ${appointment._id} to ${appointment.customerPhone}`);
          } else {
            console.error(`Failed to send SMS reminder for appointment ${appointment._id}`);
          }
        } catch (err) {
          console.error(`Error processing appointment ${appointment._id}:`, err.message);
          // Continue with next appointment
        }
      }

      console.log('SMS reminder job completed');
    } catch (err) {
      console.error('SMS reminder job error:', err);
    }
  });

  console.log('SMS reminder cron job started (runs every hour)');
}

module.exports = startSMSReminderJob;
