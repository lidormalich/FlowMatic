const nodemailer = require('nodemailer');
const moment = require('moment');

/**
 * Create email transporter with SMTP configuration
 */
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('SMTP configuration is missing in environment variables');
    throw new Error('שירות Email לא מוגדר כראוי');
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, // use SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send password reset email
 * @param {String} email - User's email address
 * @param {String} resetToken - Password reset token
 * @returns {Promise}
 */
async function sendPasswordResetEmail(email, resetToken) {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || `FlowMatic <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'איפוס סיסמה - FlowMatic',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f4f4;
              padding: 20px;
              direction: rtl;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 איפוס סיסמה</h1>
            </div>
            <div class="content">
              <p>שלום,</p>
              <p>קיבלנו בקשה לאיפוס הסיסמה של החשבון שלך ב-FlowMatic.</p>
              <p>לחץ על הכפתור למטה כדי לאפס את הסיסמה שלך:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">אפס סיסמה</a>
              </div>
              <p>או העתק והדבק את הקישור הבא בדפדפן:</p>
              <p style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; word-break: break-all;">
                ${resetUrl}
              </p>
              <p><strong>לתשומת ליבך:</strong> הקישור תקף ל-1 שעה בלבד.</p>
              <p>אם לא ביקשת לאפס את הסיסמה, התעלם מהודעה זו.</p>
            </div>
            <div class="footer">
              <p>הודעה זו נשלחה אוטומטית מ-FlowMatic</p>
              <p>© 2026 FlowMatic - מערכת ניהול תורים</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (err) {
    console.error('Email Error:', err.message);
    throw err;
  }
}

/**
 * Send appointment confirmation email
 * @param {Object} appointment - Appointment object
 * @param {Object} businessOwner - Business owner object
 * @returns {Promise}
 */
async function sendAppointmentConfirmationEmail(appointment, businessOwner) {
  if (!appointment.customerEmail) {
    return false; // No email provided
  }

  try {
    const transporter = createTransporter();
    const appointmentDate = moment(appointment.date).format('DD/MM/YYYY');
    const cancelUrl = `${process.env.FRONTEND_URL}/cancel/${appointment._id}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || `FlowMatic <${process.env.SMTP_USER}>`,
      to: appointment.customerEmail,
      subject: `אישור תור - ${businessOwner.businessName}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f4f4;
              padding: 20px;
              direction: rtl;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .info-box {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .button {
              display: inline-block;
              background-color: #dc3545;
              color: white;
              text-decoration: none;
              padding: 12px 25px;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ התור שלך אושר!</h1>
            </div>
            <div class="content">
              <p>שלום ${appointment.customerName},</p>
              <p>התור שלך ב-<strong>${businessOwner.businessName}</strong> אושר בהצלחה.</p>

              <div class="info-box">
                <h3 style="margin-top: 0;">פרטי התור:</h3>
                <div class="info-row">
                  <strong>שירות:</strong>
                  <span>${appointment.service}</span>
                </div>
                <div class="info-row">
                  <strong>תאריך:</strong>
                  <span>${appointmentDate}</span>
                </div>
                <div class="info-row">
                  <strong>שעה:</strong>
                  <span>${appointment.startTime}</span>
                </div>
                <div class="info-row">
                  <strong>משך זמן:</strong>
                  <span>${appointment.duration} דקות</span>
                </div>
                ${appointment.price > 0 ? `
                <div class="info-row">
                  <strong>מחיר:</strong>
                  <span>₪${appointment.price}</span>
                </div>
                ` : ''}
              </div>

              ${businessOwner.businessAddress ? `
              <p><strong>כתובת:</strong> ${businessOwner.businessAddress}</p>
              ` : ''}

              ${businessOwner.phoneNumber ? `
              <p><strong>טלפון:</strong> ${businessOwner.phoneNumber}</p>
              ` : ''}

              <p>מצפים לראותך!</p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

              <p style="font-size: 14px; color: #666;">צריך לבטל?</p>
              <div style="text-align: center;">
                <a href="${cancelUrl}" class="button">בטל תור</a>
              </div>
              <p style="font-size: 12px; color: #999;">
                * ביטול תור כפוף למדיניות הביטולים של בעל העסק
              </p>
            </div>
            <div class="footer">
              <p>הודעה זו נשלחה אוטומטית מ-FlowMatic</p>
              <p>© 2026 FlowMatic - מערכת ניהול תורים</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Appointment confirmation email sent:', info.messageId);
    return true;
  } catch (err) {
    console.error('Email Error:', err.message);
    return false;
  }
}

/**
 * Send appointment reminder email (24 hours before)
 * @param {Object} appointment - Appointment object
 * @param {Object} businessOwner - Business owner object
 * @returns {Promise}
 */
async function sendAppointmentReminderEmail(appointment, businessOwner) {
  if (!appointment.customerEmail) {
    return false;
  }

  try {
    const transporter = createTransporter();
    const appointmentDate = moment(appointment.date).format('DD/MM/YYYY');
    const cancelUrl = `${process.env.FRONTEND_URL}/cancel/${appointment._id}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || `FlowMatic <${process.env.SMTP_USER}>`,
      to: appointment.customerEmail,
      subject: `תזכורת תור מחר - ${businessOwner.businessName}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f4f4;
              padding: 20px;
              direction: rtl;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .reminder-box {
              background-color: #fef3c7;
              border-right: 4px solid #f59e0b;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ תזכורת לתור מחר!</h1>
            </div>
            <div class="content">
              <p>שלום ${appointment.customerName},</p>
              <p>זוהי תזכורת שיש לך תור מחר ב-<strong>${businessOwner.businessName}</strong>.</p>

              <div class="reminder-box">
                <h3 style="margin-top: 0; color: #92400e;">פרטי התור:</h3>
                <p><strong>שירות:</strong> ${appointment.service}</p>
                <p><strong>תאריך:</strong> ${appointmentDate}</p>
                <p><strong>שעה:</strong> ${appointment.startTime}</p>
                <p><strong>משך זמן:</strong> ${appointment.duration} דקות</p>
              </div>

              ${businessOwner.businessAddress ? `
              <p><strong>כתובת:</strong> ${businessOwner.businessAddress}</p>
              ` : ''}

              <p>מצפים לראותך מחר!</p>

              <p style="font-size: 12px; color: #666; margin-top: 30px;">
                צריך לבטל? <a href="${cancelUrl}">לחץ כאן</a>
              </p>
            </div>
            <div class="footer">
              <p>הודעה זו נשלחה אוטומטית מ-FlowMatic</p>
              <p>© 2026 FlowMatic - מערכת ניהול תורים</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Appointment reminder email sent:', info.messageId);
    return true;
  } catch (err) {
    console.error('Email Error:', err.message);
    return false;
  }
}

/**
 * Send appointment cancellation email
 * @param {Object} appointment - Appointment object
 * @param {Object} businessOwner - Business owner object
 * @returns {Promise}
 */
async function sendAppointmentCancellationEmail(appointment, businessOwner) {
  if (!appointment.customerEmail) {
    return false;
  }

  try {
    const transporter = createTransporter();
    const appointmentDate = moment(appointment.date).format('DD/MM/YYYY');

    const mailOptions = {
      from: process.env.SMTP_FROM || `FlowMatic <${process.env.SMTP_USER}>`,
      to: appointment.customerEmail,
      subject: `ביטול תור - ${businessOwner.businessName}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f4f4;
              padding: 20px;
              direction: rtl;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #dc3545;
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ התור בוטל</h1>
            </div>
            <div class="content">
              <p>שלום ${appointment.customerName},</p>
              <p>התור שלך ב-<strong>${businessOwner.businessName}</strong> בוטל בהצלחה.</p>

              <p><strong>פרטי התור שבוטל:</strong></p>
              <ul>
                <li>שירות: ${appointment.service}</li>
                <li>תאריך: ${appointmentDate}</li>
                <li>שעה: ${appointment.startTime}</li>
              </ul>

              <p>נשמח לראותך בפעם הבאה!</p>
            </div>
            <div class="footer">
              <p>הודעה זו נשלחה אוטומטית מ-FlowMatic</p>
              <p>© 2026 FlowMatic - מערכת ניהול תורים</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Appointment cancellation email sent:', info.messageId);
    return true;
  } catch (err) {
    console.error('Email Error:', err.message);
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendAppointmentConfirmationEmail,
  sendAppointmentReminderEmail,
  sendAppointmentCancellationEmail
};
