const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ClientSchema = new Schema({
    businessOwnerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    tags: {
        type: [String],
        default: []
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockedReason: {
        type: String,
        default: ''
    },
    totalAppointments: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    lastAppointmentDate: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for unique client per business
ClientSchema.index({ businessOwnerId: 1, phone: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
ClientSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

ClientSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

ClientSchema.set('toJSON', {
    virtuals: true
});

module.exports = Client = mongoose.model("clients", ClientSchema);
