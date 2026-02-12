const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    type: {
        type: String,
        enum: ['reminder', 'status_change', 'message', 'update'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        default: ''
    },
    relatedAppointmentId: {
        type: Schema.Types.ObjectId,
        ref: 'events',
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

module.exports = Notification = mongoose.model('notification', NotificationSchema);
