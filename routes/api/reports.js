const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const Event = require('../../models/Event');
const Client = require('../../models/Client');
const moment = require('moment');
const { Parser } = require('json2csv');

// GET /api/reports/revenue - Get unified dashboard reports
router.get('/revenue', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const businessOwnerId = req.user.id;
        const { range = 'year' } = req.query;

        // Calculate date ranges
        const now = moment().endOf('day');
        const startDate = range === 'month' 
            ? moment().subtract(30, 'days').startOf('day') 
            : moment().subtract(12, 'months').startOf('month');

        // 1. Revenue by Month/Day
        const revenueData = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    status: 'completed',
                    date: { $gte: startDate.toDate(), $lte: now.toDate() }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { 
                            format: range === 'month' ? "%Y-%m-%d" : "%Y-%m", 
                            date: "$date" 
                        }
                    },
                    revenue: { $sum: "$price" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    name: "$_id",
                    revenue: 1,
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // 2. Appointment Types Distribution
        const typesData = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    status: { $ne: 'cancelled' },
                    date: { $gte: startDate.toDate(), $lte: now.toDate() }
                }
            },
            {
                $group: {
                    _id: "$service",
                    value: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: { $ifNull: ["$_id", "כללי"] },
                    value: 1,
                    _id: 0
                }
            },
            { $sort: { value: -1 } }
        ]);

        // 3. Daily Activity (last 30 days always for the line chart)
        const dailyActivity = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    date: { $gte: moment().subtract(30, 'days').toDate(), $lte: now.toDate() }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.json({
            revenueByMonth: revenueData,
            appointmentsByType: typesData,
            dailyAppointments: dailyActivity
        });

    } catch (err) {
        console.error('Reports error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// GET /api/reports/export/appointments - Export appointments to CSV
router.get('/export/appointments', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const businessOwnerId = req.user.id;
        // Default to last 30 days if not specified, or all? Let's do all for now or query based
        // Better to allow date range. If no date range, maybe all?
        // Let's implement getting ALL for backup purposes usually.
        
        const appointments = await Event.find({ businessOwnerId }).sort({ date: -1 });

        const fields = [
            { label: 'תאריך', value: (row) => moment(row.date).format('DD/MM/YYYY') },
            { label: 'שעה', value: 'startTime' },
            { label: 'שם לקוח', value: 'customerName' },
            { label: 'טלפון', value: 'customerPhone' },
            { label: 'שירות', value: 'service' },
            { label: 'מחיר', value: 'price' },
            { label: 'סטטוס', value: 'status' },
            { label: 'הערות', value: 'description' }
        ];

        const json2csvParser = new Parser({ fields, withBOM: true });
        const csv = json2csvParser.parse(appointments);

        res.header('Content-Type', 'text/csv');
        res.attachment('appointments.csv');
        return res.send(csv);

    } catch (err) {
        console.error('Export appointments error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// GET /api/reports/export/clients - Export clients to CSV
router.get('/export/clients', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const businessOwnerId = req.user.id;
        const clients = await Client.find({ businessOwnerId }).sort({ name: 1 });

        const fields = [
            { label: 'שם', value: 'name' },
            { label: 'טלפון', value: 'phone' },
            { label: 'אימייל', value: 'email' },
            { label: 'הערות', value: 'notes' },
            { label: 'כמות תורים', value: 'totalAppointments' },
            { label: 'סה״כ הכנסות', value: 'totalRevenue' } // totalSpend in aggregation, totalRevenue in Client schema? Schema has totalRevenue.
        ];

        const json2csvParser = new Parser({ fields, withBOM: true });
        const csv = json2csvParser.parse(clients);

        res.header('Content-Type', 'text/csv');
        res.attachment('clients.csv');
        return res.send(csv);

    } catch (err) {
        console.error('Export clients error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;
