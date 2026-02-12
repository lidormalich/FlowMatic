const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InventorySchema = new Schema({
    businessOwnerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        default: 'יחידות'
    },
    currentStock: {
        type: Number,
        default: 0
    },
    minStock: {
        type: Number,
        default: 0
    },
    costPerUnit: {
        type: Number,
        default: 0
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

module.exports = Inventory = mongoose.model("inventory", InventorySchema);
