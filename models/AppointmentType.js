const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AppointmentTypeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'General'
    },
    duration: {
        type: Number, // Duration in minutes
        required: true,
        default: 60
    },
    price: {
        type: Number,
        default: 0
    },
    color: {
        type: String,
        default: '#667eea'
    },
    images: {
        type: [String],
        default: [],
        validate: [arr => arr.length <= 3, 'ניתן להעלות עד 3 תמונות']
    },
    relatedServices: [{
        type: Schema.Types.ObjectId,
        ref: 'appointmentTypes'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = AppointmentType = mongoose.model("appointmentTypes", AppointmentTypeSchema);
