const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const Client = require('../../models/Client');
const Event = require('../../models/Event');

// GET /api/clients - Get all clients for authenticated user
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { search, sort = 'name' } = req.query;
        const businessOwnerId = req.user.id;

        // Build query
        let query = { businessOwnerId };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Get clients from Client collection
        const clients = await Client.find(query).sort({ [sort]: 1 });

        // Get appointment stats for each client
        const clientsWithStats = await Promise.all(clients.map(async (client) => {
            const appointmentStats = await Event.aggregate([
                {
                    $match: {
                        businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                        customerPhone: client.phone
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAppointments: { $sum: 1 },
                        completedAppointments: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        totalSpend: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0] }
                        },
                        lastVisit: { $max: '$date' }
                    }
                }
            ]);

            const stats = appointmentStats[0] || {
                totalAppointments: 0,
                completedAppointments: 0,
                totalSpend: 0,
                lastVisit: null
            };

            return {
                ...client.toJSON(),
                totalAppointments: stats.totalAppointments,
                completedAppointments: stats.completedAppointments,
                totalSpend: stats.totalSpend,
                lastVisit: stats.lastVisit
            };
        }));

        res.json(clientsWithStats);
    } catch (err) {
        console.error('Get clients error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// GET /api/clients/sync - Sync clients from appointments (create missing clients)
router.post('/sync', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const businessOwnerId = req.user.id;

        // Get all unique customers from appointments
        const uniqueCustomers = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId)
                }
            },
            {
                $group: {
                    _id: '$customerPhone',
                    name: { $last: '$customerName' },
                    email: { $last: '$customerEmail' },
                    phone: { $last: '$customerPhone' }
                }
            }
        ]);

        let created = 0;
        let existing = 0;

        for (const customer of uniqueCustomers) {
            if (!customer.phone) continue;

            const exists = await Client.findOne({
                businessOwnerId,
                phone: customer.phone
            });

            if (!exists) {
                await Client.create({
                    businessOwnerId,
                    name: customer.name || 'לקוח ללא שם',
                    phone: customer.phone,
                    email: customer.email || ''
                });
                created++;
            } else {
                existing++;
            }
        }

        res.json({
            message: `סנכרון הושלם. נוספו ${created} לקוחות חדשים.`,
            created,
            existing
        });
    } catch (err) {
        console.error('Sync clients error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// GET /api/clients/:id - Get single client with history
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const client = await Client.findOne({
            _id: req.params.id,
            businessOwnerId: req.user.id
        });

        if (!client) {
            return res.status(404).json({ message: 'לקוח לא נמצא' });
        }

        // Get appointment history
        const appointments = await Event.find({
            businessOwnerId: req.user.id,
            customerPhone: client.phone
        })
        .populate('appointmentTypeId')
        .sort({ date: -1 })
        .limit(50);

        // Calculate stats
        const stats = appointments.reduce((acc, apt) => {
            acc.total++;
            if (apt.status === 'completed') {
                acc.completed++;
                acc.totalSpend += apt.price || 0;
            } else if (apt.status === 'cancelled') {
                acc.cancelled++;
            } else if (apt.status === 'no_show') {
                acc.noShow++;
            }
            return acc;
        }, { total: 0, completed: 0, cancelled: 0, noShow: 0, totalSpend: 0 });

        res.json({
            ...client.toJSON(),
            appointments,
            stats
        });
    } catch (err) {
        console.error('Get client error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// POST /api/clients - Create new client
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { name, phone, email, notes, tags } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: 'שם וטלפון הם שדות חובה' });
        }

        // Check if client already exists
        const existing = await Client.findOne({
            businessOwnerId: req.user.id,
            phone
        });

        if (existing) {
            return res.status(400).json({ message: 'לקוח עם מספר טלפון זה כבר קיים' });
        }

        const client = new Client({
            businessOwnerId: req.user.id,
            name,
            phone,
            email: email || '',
            notes: notes || '',
            tags: tags || []
        });

        await client.save();
        res.status(201).json(client);
    } catch (err) {
        console.error('Create client error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'לקוח עם מספר טלפון זה כבר קיים' });
        }
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// PUT /api/clients/:id - Update client
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const client = await Client.findOne({
            _id: req.params.id,
            businessOwnerId: req.user.id
        });

        if (!client) {
            return res.status(404).json({ message: 'לקוח לא נמצא' });
        }

        const { name, email, notes, tags, isBlocked, blockedReason } = req.body;

        if (name) client.name = name;
        if (email !== undefined) client.email = email;
        if (notes !== undefined) client.notes = notes;
        if (tags !== undefined) client.tags = tags;
        if (isBlocked !== undefined) client.isBlocked = isBlocked;
        if (blockedReason !== undefined) client.blockedReason = blockedReason;

        await client.save();
        res.json(client);
    } catch (err) {
        console.error('Update client error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const result = await Client.deleteOne({
            _id: req.params.id,
            businessOwnerId: req.user.id
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'לקוח לא נמצא' });
        }

        res.json({ message: 'הלקוח נמחק בהצלחה' });
    } catch (err) {
        console.error('Delete client error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;
