const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Joi = require('joi');
const User = require('../../models/User');
const PasswordReset = require('../../models/PasswordReset');
const { sendPasswordResetEmail } = require('../../services/emailService');

// Validation Schemas
const forgotPasswordValidation = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordValidation = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    // Validate input
    const { error, value } = forgotPasswordValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email } = value;

    // Find user by email
    const user = await User.findOne({ email });

    // Don't reveal if user exists (security best practice)
    if (!user) {
      return res.json({
        message: 'אם כתובת האימייל קיימת במערכת, נשלח אליך קישור לאיפוס סיסמה'
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before storing
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Create password reset record (expires in 1 hour)
    const passwordReset = new PasswordReset({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    });

    await passwordReset.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr.message);
      // Delete the reset token if email fails
      await PasswordReset.deleteOne({ _id: passwordReset._id });
      return res.status(500).json({
        message: 'שגיאה בשליחת מייל. אנא נסה שוב מאוחר יותר.'
      });
    }

    res.json({
      message: 'אם כתובת האימייל קיימת במערכת, נשלח אליך קישור לאיפוס סיסמה'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    // Validate input
    const { error, value } = resetPasswordValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { token, newPassword } = value;

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find reset token
    const passwordReset = await PasswordReset.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() } // Token not expired
    });

    if (!passwordReset) {
      return res.status(400).json({
        message: 'קישור לאיפוס סיסמה לא תקין או פג תוקף'
      });
    }

    // Find user
    const user = await User.findById(passwordReset.userId);
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Mark token as used
    passwordReset.used = true;
    await passwordReset.save();

    res.json({ message: 'הסיסמה שונתה בהצלחה' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

/**
 * GET /api/auth/verify-reset-token/:token
 * Verify if reset token is valid (for frontend validation)
 */
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token exists and is valid
    const passwordReset = await PasswordReset.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!passwordReset) {
      return res.status(400).json({
        valid: false,
        message: 'קישור לא תקין או פג תוקף'
      });
    }

    res.json({
      valid: true,
      message: 'הקישור תקף'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
