const axios = require('axios');
const moment = require('moment');
const User = require('../models/User');
const Event = require('../models/Event');

const SMS4FREE_API_URL = 'https://www.sms4free.co.il/ApiSMS/v2/SendSMS';
const SMS_COST = 2; // כל SMS עולה 2 credits

/**
 * שולח SMS באמצעות SMS4FREE API
 * @param {String} userId - ID של בעל העסק (למשיכת credits)
 * @param {String} phoneNumber - מספר טלפון של הנמען
 * @param {String} message - תוכן ההודעה
 * @returns {Promise} Response מה-API
 */
async function sendSMS(userId, phoneNumber, message) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('משתמש לא נמצא');
    }

    if (user.credits < SMS_COST) {
      throw new Error('אין מספיק קרדיטים לשליחת SMS');
    }

    // בדיקה שמשתני הסביבה קיימים
    if (!process.env.SMS4FREE_API_KEY || !process.env.SMS4FREE_USERNAME || !process.env.SMS4FREE_PASSWORD) {
      console.error('SMS4FREE credentials are not configured');
      throw new Error('שירות SMS לא מוגדר כראוי');
    }

    // ניקוי מספר טלפון (הסרת מקפים ורווחים)
    const cleanPhone = phoneNumber.replace(/[-\s]/g, '');

    const params = {
      key: process.env.SMS4FREE_API_KEY,
      user: process.env.SMS4FREE_USERNAME,
      pass: process.env.SMS4FREE_PASSWORD,
      sender: process.env.SMS4FREE_SENDER || 'FlowMatic',
      recipient: cleanPhone,
      msg: message
    };

    const response = await axios.get(SMS4FREE_API_URL, { params });

    // בדיקת תגובה מהשרת
    if (response.data && response.data.status === 'success') {
      // משיכת credits מהמשתמש
      user.credits -= SMS_COST;
      await user.save();

      console.log(`SMS sent successfully to ${cleanPhone}. User ${user.name} has ${user.credits} credits left.`);
      return response.data;
    } else {
      throw new Error(response.data?.message || 'שליחת SMS נכשלה');
    }
  } catch (err) {
    console.error('SMS Error:', err.message);
    throw err;
  }
}

/**
 * שולח אישור תור ללקוח
 * @param {Object} appointment - אובייקט התור
 * @param {Object} businessOwner - בעל העסק
 * @returns {Promise}
 */
async function sendAppointmentConfirmationSMS(appointment, businessOwner) {
  const appointmentDate = moment(appointment.date).format('DD/MM/YYYY');
  const cancelUrl = `${process.env.FRONTEND_URL}/cancel/${appointment._id}`;

  const message = `שלום ${appointment.customerName}, התור שלך ב-${businessOwner.businessName} אושר לתאריך ${appointmentDate} בשעה ${appointment.startTime}. לביטול: ${cancelUrl}`;

  try {
    await sendSMS(businessOwner._id, appointment.customerPhone, message);

    // עדכון שה-SMS נשלח
    appointment.smsSent = true;
    await appointment.save();

    return true;
  } catch (err) {
    console.error('Failed to send confirmation SMS:', err.message);
    return false;
  }
}

/**
 * שולח תזכורת תור ללקוח (24 שעות לפני)
 * @param {Object} appointment - אובייקט התור
 * @param {Object} businessOwner - בעל העסק
 * @returns {Promise}
 */
async function sendAppointmentReminderSMS(appointment, businessOwner) {
  const appointmentDate = moment(appointment.date).format('DD/MM/YYYY');
  const cancelUrl = `${process.env.FRONTEND_URL}/cancel/${appointment._id}`;

  const message = `תזכורת! יש לך תור מחר ב-${businessOwner.businessName} בתאריך ${appointmentDate} בשעה ${appointment.startTime}. לביטול: ${cancelUrl}`;

  try {
    await sendSMS(businessOwner._id, appointment.customerPhone, message);

    // עדכון שתזכורת נשלחה
    appointment.smsReminderSent = true;
    await appointment.save();

    return true;
  } catch (err) {
    console.error('Failed to send reminder SMS:', err.message);
    return false;
  }
}

/**
 * שולח הודעת ביטול תור ללקוח
 * @param {Object} appointment - אובייקט התור
 * @param {Object} businessOwner - בעל העסק
 * @returns {Promise}
 */
async function sendAppointmentCancellationSMS(appointment, businessOwner) {
  const appointmentDate = moment(appointment.date).format('DD/MM/YYYY');

  const message = `שלום ${appointment.customerName}, התור שלך ב-${businessOwner.businessName} לתאריך ${appointmentDate} בשעה ${appointment.startTime} בוטל בהצלחה.`;

  try {
    await sendSMS(businessOwner._id, appointment.customerPhone, message);
    return true;
  } catch (err) {
    console.error('Failed to send cancellation SMS:', err.message);
    return false;
  }
}

module.exports = {
  sendSMS,
  sendAppointmentConfirmationSMS,
  sendAppointmentReminderSMS,
  sendAppointmentCancellationSMS,
  SMS_COST
};
