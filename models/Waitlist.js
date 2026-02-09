const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WaitlistSchema = new Schema({
    businessOwnerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    clientPhone: {
        type: String,
        required: true
    },
    clientEmail: {
        type: String
    },
    serviceId: {
        type: Schema.Types.ObjectId,
        ref: 'appointmentTypes'
    },
    preferredDate: {
        type: Date, // The specific date they want, or null for "any"
    },
    preferredTimeRange: {
        start: String, // "09:00"
        end: String    // "12:00"
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'notified', 'booked', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = Waitlist = mongoose.model("waitlist", WaitlistSchema);
