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
