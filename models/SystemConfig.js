const mongoose = require('mongoose');

// Singleton document — always has _id: 'singleton'
const SystemConfigSchema = new mongoose.Schema({
    _id: { type: String, default: 'singleton' },
    notifications: {
        reminders:     { type: Boolean, default: true },
        confirmations: { type: Boolean, default: true },
        cancellations: { type: Boolean, default: true },
        reschedules:   { type: Boolean, default: true }
    }
}, { _id: false });

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
