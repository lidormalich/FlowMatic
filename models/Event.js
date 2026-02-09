const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
    businessOwnerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    appointmentTypeId: {
        type: Schema.Types.ObjectId,
        ref: 'appointmentTypes',
        required: false // Optional for blocked times
    },
    customerName: {
        type: String,
        required: true,
    },
    customerEmail: {
        type: String,
        default: ''
    },
    customerPhone: {
        type: String,
        required: true,
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    date: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'blocked'],
        default: 'pending'
    },
    description: {
        type: String,
        default: '',
    },
    location: {
        type: String,
        default: '',
    },
    service: {
        type: String,
        required: true,
    },
    services: {
        type: [String],
        default: []
    },
    price: {
        type: Number,
        default: 0
    },
    smsSent: {
        type: Boolean,
        default: false
    },
    smsReminderSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Update the updatedAt timestamp before saving
eventSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
