const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StaffSchema = new Schema({
    businessOwnerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String, // e.g., 'Stylist', 'Barber'
        default: 'Employee'
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: '#667eea'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    services: [{
        type: Schema.Types.ObjectId,
        ref: 'appointmentTypes'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = Staff = mongoose.model("staff", StaffSchema);
