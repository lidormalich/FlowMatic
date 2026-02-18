/**
 * Named constants to replace magic numbers
 * Usage: const { SMS_CREDITS_COST } = require('../constants');
 */

const SMS_CREDITS_COST = 2;
const ADMIN_ROLE = 'admin';
const BUSINESS_OWNER_ROLE = 'business_owner';
const CUSTOMER_ROLE = 'customer';

// Appointment statuses
const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled'
};

// Notification types
const NOTIFICATION_TYPE = {
  SMS: 'sms',
  EMAIL: 'email',
  PUSH: 'push',
  WHATSAPP: 'whatsapp'
};

module.exports = {
  SMS_CREDITS_COST,
  ADMIN_ROLE,
  BUSINESS_OWNER_ROLE,
  CUSTOMER_ROLE,
  APPOINTMENT_STATUS,
  NOTIFICATION_TYPE
};
