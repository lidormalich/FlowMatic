const express = require('express');
const router = express.Router();
const passport = require('passport');
const Inventory = require('../../models/Inventory');

// GET /api/inventory - Get all inventory items
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const items = await Inventory.find({ businessOwnerId: req.user.id, isActive: true }).sort({ name: 1 });
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// GET /api/inventory/low-stock - Get items below minimum stock
router.get('/low-stock', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const items = await Inventory.find({
            businessOwnerId: req.user.id,
            isActive: true,
            $expr: { $lt: ['$currentStock', '$minStock'] }
        }).sort({ name: 1 });
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// POST /api/inventory - Create inventory item
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { name, unit, currentStock, minStock, costPerUnit } = req.body;
        if (!name) return res.status(400).json({ message: 'שם המוצר הוא שדה חובה' });

        const item = new Inventory({
            businessOwnerId: req.user.id,
            name,
            unit: unit || 'יחידות',
            currentStock: currentStock || 0,
            minStock: minStock || 0,
            costPerUnit: costPerUnit || 0
        });
        await item.save();
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const item = await Inventory.findOneAndUpdate(
            { _id: req.params.id, businessOwnerId: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!item) return res.status(404).json({ message: 'פריט לא נמצא' });
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// PUT /api/inventory/:id/adjust - Adjust stock level
router.put('/:id/adjust', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { amount } = req.body;
        const item = await Inventory.findOne({ _id: req.params.id, businessOwnerId: req.user.id });
        if (!item) return res.status(404).json({ message: 'פריט לא נמצא' });

        item.currentStock = Math.max(0, item.currentStock + amount);
        await item.save();
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// DELETE /api/inventory/:id - Soft delete
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const item = await Inventory.findOneAndUpdate(
            { _id: req.params.id, businessOwnerId: req.user.id },
            { $set: { isActive: false } },
            { new: true }
        );
        if (!item) return res.status(404).json({ message: 'פריט לא נמצא' });
        res.json({ message: 'הפריט נמחק בהצלחה' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;
