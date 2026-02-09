const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationTemplateSchema = new Schema({
    businessOwnerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    type: {
        type: String, // 'email' or 'sms'
        required: true,
        enum: ['email', 'sms']
    },
    name: {
        type: String, // 'confirmation', 'reminder', 'cancellation', 'reschedule'
        required: true
    },
    subject: {
        type: String, // Only for email
        default: ''
    },
    body: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique template per type/name for each user
NotificationTemplateSchema.index({ businessOwnerId: 1, type: 1, name: 1 }, { unique: true });

module.exports = NotificationTemplate = mongoose.model("notificationTemplates", NotificationTemplateSchema);
