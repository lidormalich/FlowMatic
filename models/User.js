const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['client', 'business_owner', 'admin'],
        default: 'client'
    },
    credits: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    businessName: {
        type: String,
        default: ''
    },
    businessDescription: {
        type: String,
        default: ''
    },
    businessHours: {
        startHour: { type: Number, default: 9 },
        endHour: { type: Number, default: 17 },
        workingDays: { type: [Number], default: [0, 1, 2, 3, 4] }, // 0 = Sunday, 6 = Saturday
        slotInterval: { type: Number, default: 30 }, // minutes between slots
        breakTime: {
            enabled: { type: Boolean, default: false },
            startHour: { type: Number, default: 12 },
            startMinute: { type: Number, default: 0 },
            endHour: { type: Number, default: 13 },
            endMinute: { type: Number, default: 0 }
        },
        minGapMinutes: { type: Number, default: 0 },
        daySchedules: { type: mongoose.Schema.Types.Mixed, default: null } // Per-day hours: { 0: {enabled, startHour, endHour}, ..., 6: {...} }
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    smsNotifications: {
        enabled: { type: Boolean, default: true },
        reminderHoursBefore: { type: Number, default: 24 }
    },
    profileImage: {
        type: String,
        default: ''
    },
    cancellationPolicy: {
        enabled: { type: Boolean, default: true },
        hoursBefore: { type: Number, default: 24 }
    },
    themeSettings: {
        primaryColor: { type: String, default: '#667eea' },
        secondaryColor: { type: String, default: '#764ba2' },
        logoUrl: { type: String, default: '' },
        coverImage: { type: String, default: '' }
    },
    showHebrewDate: {
        type: Boolean,
        default: false
    },
    showHebrewDateInBooking: {
        type: Boolean,
        default: false
    },
    hebrewCalendar: {
        showHolidays: { type: Boolean, default: true },
        showShabbat: { type: Boolean, default: true },
        showEvents: { type: Boolean, default: true }
    },
    businessAddress: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now
    }
});

UserSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

UserSchema.set('toJSON', {
    virtuals: true
});

module.exports = User = mongoose.model("users", UserSchema);
