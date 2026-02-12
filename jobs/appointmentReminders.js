const cron = require('node-cron');
const moment = require('moment');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { sendPushToUser } = require('../utils/pushNotify');

/**
 * Send in-app notification + browser push to a user
 */
async function notifyUser(userId, { type, title, body, url, appointmentId }) {
    // In-app notification
    await Notification.create({
        userId,
        type: type || 'reminder',
        title,
        body,
        relatedAppointmentId: appointmentId
    });

    // Browser push
    await sendPushToUser(userId, { title, body, url: url || '/' });
}

/**
 * Cron job that runs every 5 minutes and sends reminders:
 * - 24 hours before (22-26 hour window)
 * - 30 minutes before (25-35 minute window)
 */
function startAppointmentReminderJob() {
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = moment();

            // Find upcoming appointments that still need reminders
            const appointments = await Event.find({
                status: { $in: ['pending', 'confirmed'] },
                $or: [
                    { reminderDayBeforeSent: { $ne: true } },
                    { reminderNotificationSent: { $ne: true } }
                ]
            });

            let dayBeforeCount = 0;
            let halfHourCount = 0;

            for (const appt of appointments) {
                const apptDate = moment(appt.date).format('YYYY-MM-DD');
                const apptDateTime = moment(`${apptDate} ${appt.startTime}`, 'YYYY-MM-DD HH:mm');
                const hoursUntil = apptDateTime.diff(now, 'hours', true);
                const minutesUntil = apptDateTime.diff(now, 'minutes');

                let updated = false;

                // === 24 hours before reminder (22-26 hour window) ===
                if (!appt.reminderDayBeforeSent && hoursUntil >= 22 && hoursUntil <= 26) {
                    const dateStr = moment(appt.date).format('DD/MM');

                    if (appt.customerId) {
                        await notifyUser(appt.customerId, {
                            title: 'תזכורת: תור מחר',
                            body: `יש לך תור ל${appt.service || 'שירות'} מחר (${dateStr}) בשעה ${appt.startTime}`,
                            url: '/my-appointments',
                            appointmentId: appt._id
                        });
                        dayBeforeCount++;
                    }

                    if (appt.businessOwnerId) {
                        await notifyUser(appt.businessOwnerId, {
                            title: 'תור מחר',
                            body: `${appt.customerName} - ${appt.service || 'תור'} מחר (${dateStr}) בשעה ${appt.startTime}`,
                            url: '/events',
                            appointmentId: appt._id
                        });
                    }

                    appt.reminderDayBeforeSent = true;
                    updated = true;
                }

                // === 30 minutes before reminder (25-35 minute window) ===
                if (!appt.reminderNotificationSent && minutesUntil >= 25 && minutesUntil <= 35) {
                    if (appt.customerId) {
                        await notifyUser(appt.customerId, {
                            title: 'התור שלך בעוד 30 דקות',
                            body: `התור ל${appt.service || 'שירות'} מתחיל בשעה ${appt.startTime}`,
                            url: '/my-appointments',
                            appointmentId: appt._id
                        });
                        halfHourCount++;
                    }

                    if (appt.businessOwnerId) {
                        await notifyUser(appt.businessOwnerId, {
                            title: 'תור בעוד 30 דקות',
                            body: `${appt.customerName} - ${appt.service || 'תור'} בשעה ${appt.startTime}`,
                            url: '/events',
                            appointmentId: appt._id
                        });
                    }

                    appt.reminderNotificationSent = true;
                    updated = true;
                }

                if (updated) {
                    await appt.save();
                }
            }

            if (dayBeforeCount > 0 || halfHourCount > 0) {
                console.log(`[Reminder Job] Sent: ${dayBeforeCount} day-before, ${halfHourCount} 30-min reminders`);
            }
        } catch (err) {
            console.error('[Reminder Job] Error:', err.message);
        }
    });

    console.log('Appointment reminder cron job started (runs every 5 minutes) — 24h + 30min reminders');
}

module.exports = startAppointmentReminderJob;
