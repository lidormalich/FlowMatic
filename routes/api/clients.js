const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const multer = require('multer');
const Client = require('../../models/Client');
const Event = require('../../models/Event');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

        // Top services
        const serviceCount = {};
        appointments.filter(a => a.status === 'completed').forEach(apt => {
            const name = apt.service || 'לא ידוע';
            serviceCount[name] = (serviceCount[name] || 0) + 1;
        });
        const topServices = Object.entries(serviceCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Average interval between visits (days)
        const completedDates = appointments
            .filter(a => a.status === 'completed' && a.date)
            .map(a => new Date(a.date).getTime())
            .sort((a, b) => a - b);
        let averageInterval = 0;
        if (completedDates.length >= 2) {
            let totalDays = 0;
            for (let i = 1; i < completedDates.length; i++) {
                totalDays += (completedDates[i] - completedDates[i - 1]) / (1000 * 60 * 60 * 24);
            }
            averageInterval = Math.round(totalDays / (completedDates.length - 1));
        }

        res.json({
            ...client.toJSON(),
            appointments,
            stats,
            topServices,
            averageInterval
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

// POST /api/clients/import - Import clients from CSV
router.post('/import', passport.authenticate('jwt', { session: false }), upload.single('file'), async (req, res) => {
    try {
        const businessOwnerId = req.user.id;

        let rows = [];

        if (req.file) {
            // Parse CSV file
            const content = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, ''); // strip BOM
            const lines = content.split(/\r?\n/).filter(line => line.trim());
            if (lines.length < 2) {
                return res.status(400).json({ message: 'הקובץ ריק או לא תקין' });
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

            // Map common Hebrew/English header names
            const headerMap = {};
            headers.forEach((h, i) => {
                const lower = h.toLowerCase();
                if (['שם', 'name', 'שם מלא', 'שם לקוח'].includes(lower)) headerMap.name = i;
                else if (['טלפון', 'phone', 'מספר טלפון', 'נייד', 'tel'].includes(lower)) headerMap.phone = i;
                else if (['אימייל', 'email', 'מייל', 'דואר אלקטרוני'].includes(lower)) headerMap.email = i;
                else if (['הערות', 'notes', 'הערה'].includes(lower)) headerMap.notes = i;
            });

            if (headerMap.name === undefined || headerMap.phone === undefined) {
                return res.status(400).json({ message: 'הקובץ חייב להכיל עמודות "שם" ו"טלפון" לפחות' });
            }

            for (let i = 1; i < lines.length; i++) {
                // Simple CSV parse (handles quoted fields)
                const cols = [];
                let current = '';
                let inQuotes = false;
                for (const char of lines[i]) {
                    if (char === '"') { inQuotes = !inQuotes; }
                    else if (char === ',' && !inQuotes) { cols.push(current.trim()); current = ''; }
                    else { current += char; }
                }
                cols.push(current.trim());

                const name = cols[headerMap.name]?.replace(/^"|"$/g, '').trim();
                const phone = cols[headerMap.phone]?.replace(/^"|"$/g, '').replace(/[\s\-()]/g, '').trim();
                const email = headerMap.email !== undefined ? cols[headerMap.email]?.replace(/^"|"$/g, '').trim() : '';
                const notes = headerMap.notes !== undefined ? cols[headerMap.notes]?.replace(/^"|"$/g, '').trim() : '';

                if (name && phone && phone.length >= 7) {
                    rows.push({ name, phone, email: email || '', notes: notes || '' });
                }
            }
        } else if (req.body.clients && Array.isArray(req.body.clients)) {
            // JSON array of clients
            rows = req.body.clients.filter(c => c.name && c.phone);
        } else {
            return res.status(400).json({ message: 'לא נמצא קובץ או נתונים לייבוא' });
        }

        if (rows.length === 0) {
            return res.status(400).json({ message: 'לא נמצאו לקוחות תקינים בקובץ' });
        }

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const row of rows) {
            const existing = await Client.findOne({ businessOwnerId, phone: row.phone });
            if (existing) {
                // Update name/email if they were empty
                let changed = false;
                if (!existing.name || existing.name === 'לקוח ללא שם') { existing.name = row.name; changed = true; }
                if (!existing.email && row.email) { existing.email = row.email; changed = true; }
                if (!existing.notes && row.notes) { existing.notes = row.notes; changed = true; }
                if (changed) { await existing.save(); updated++; }
                else { skipped++; }
            } else {
                await Client.create({
                    businessOwnerId,
                    name: row.name,
                    phone: row.phone,
                    email: row.email,
                    notes: row.notes
                });
                created++;
            }
        }

        res.json({
            message: `ייבוא הושלם: ${created} נוספו, ${updated} עודכנו, ${skipped} דולגו`,
            created,
            updated,
            skipped,
            total: rows.length
        });
    } catch (err) {
        console.error('Import clients error:', err);
        res.status(500).json({ message: 'שגיאה בייבוא לקוחות' });
    }
});

module.exports = router;
