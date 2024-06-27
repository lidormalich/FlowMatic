const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    // title: {
    //     type: String,
    //     required: true,
    // },
    createdAt: {
    type: Date,
    default: Date.now,
    required: true,
},
    description: {
        type: String,
        required: true,
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
    location: {
        type: String,
        required: true,
    },
    customerName: {
        type: String,
        required: true,
    },
    customerPhone: {
        type: String,
        required: true,
    },
    services: {
        type: [String],
        required: true,
    },
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
