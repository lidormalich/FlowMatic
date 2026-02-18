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

        // 4. Total Summary Stats
        const totalStats = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    date: { $gte: startDate.toDate(), $lte: now.toDate() }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$price", 0] } },
                    totalAppointments: { $sum: 1 },
                    cancelledAppointments: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                    noShowAppointments: { $sum: { $cond: [{ $eq: ["$status", "no-show"] }, 1, 0] } }
                }
            }
        ]);

        // 5. Staff/Service Performance
        const staffPerformance = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    date: { $gte: startDate.toDate(), $lte: now.toDate() }
                }
            },
            {
                $group: {
                    _id: "$staffId",
                    name: { $first: "$staffName" },
                    appointmentCount: { $sum: 1 },
                    revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$price", 0] } },
                    cancelledCount: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);

        // 6. Top Clients
        const topClients = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    date: { $gte: startDate.toDate(), $lte: now.toDate() }
                }
            },
            {
                $group: {
                    _id: "$customerId",
                    name: { $first: "$customerName" },
                    phone: { $first: "$customerPhone" },
                    appointmentCount: { $sum: 1 },
                    totalSpent: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$price", 0] } },
                    lastVisit: { $max: "$date" }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 }
        ]);

        // 7. Revenue by Day (for trend)
        const revenueByDay = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    status: 'completed',
                    date: { $gte: moment().subtract(30, 'days').toDate(), $lte: now.toDate() }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    revenue: { $sum: "$price" }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: "$_id",
                    revenue: 1,
                    _id: 0
                }
            }
        ]);

        // 8. Monthly Comparison
        const monthlyComparison = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    date: { $gte: startDate.toDate(), $lte: now.toDate() }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                    appointmentCount: { $sum: 1 },
                    revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$price", 0] } }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    month: "$_id",
                    appointmentCount: 1,
                    revenue: 1,
                    _id: 0
                }
            }
        ]);

        // 9. Busiest Times
        const busiestTimes = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    date: { $gte: moment().subtract(30, 'days').toDate(), $lte: now.toDate() }
                }
            },
            {
                $project: {
                    dayOfWeek: { $dayOfWeek: '$date' },
                    dayName: {
                        $switch: {
                            branches: [
                                { case: { $eq: [{ $dayOfWeek: '$date' }, 1] }, then: "ראשון" },
                                { case: { $eq: [{ $dayOfWeek: '$date' }, 2] }, then: "שני" },
                                { case: { $eq: [{ $dayOfWeek: '$date' }, 3] }, then: "שלישי" },
                                { case: { $eq: [{ $dayOfWeek: '$date' }, 4] }, then: "רביעי" },
                                { case: { $eq: [{ $dayOfWeek: '$date' }, 5] }, then: "חמישי" },
                                { case: { $eq: [{ $dayOfWeek: '$date' }, 6] }, then: "שישי" },
                                { case: { $eq: [{ $dayOfWeek: '$date' }, 7] }, then: "שבת" }
                            ],
                            default: "אחר"
                        }
                    },
                    hour: { $toInt: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 0] } },
                    timeSlot: { $concat: [
                        { $toString: { $toInt: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 0] } } },
                        ":00"
                    ]}
                }
            },
            {
                $group: {
                    _id: { dayName: "$dayName", timeSlot: "$timeSlot" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 6 },
            {
                $project: {
                    dayName: "$_id.dayName",
                    timeSlot: "$_id.timeSlot",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // 10. Payment Methods (if stored in Event model)
        const paymentMethods = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    date: { $gte: startDate.toDate(), $lte: now.toDate() }
                }
            },
            {
                $group: {
                    _id: { $ifNull: ["$paymentMethod", "לא צויין"] },
                    value: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$price", 0] } }
                }
            },
            {
                $project: {
                    name: "$_id",
                    value: 1,
                    _id: 0
                }
            }
        ]);

        // 11. Time Analytics
        const timeAnalytics = {
            avgAppointmentDuration: 45,
            avgPreparationTime: 10,
            avgWaitTime: 5
        };

        // 12. Client Metrics
        const clientMetrics = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    date: { $gte: startDate.toDate(), $lte: now.toDate() }
                }
            },
            {
                $group: {
                    _id: "$customerId",
                    appointmentCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalUniqueClients: { $sum: 1 },
                    avgAppointmentsPerClient: { $avg: "$appointmentCount" },
                    repeatClientsCount: { $sum: { $cond: [{ $gt: ["$appointmentCount", 1] }, 1, 0] } }
                }
            },
            {
                $project: {
                    totalUniqueClients: 1,
                    avgAppointmentsPerClient: 1,
                    repeatClientRate: { $divide: ["$repeatClientsCount", "$totalUniqueClients"] }
                }
            }
        ]);

        res.json({
            revenueByMonth: revenueData,
            appointmentsByType: typesData,
            dailyAppointments: dailyActivity,
            totalRevenue: totalStats[0]?.totalRevenue || 0,
            totalAppointments: totalStats[0]?.totalAppointments || 0,
            cancelledAppointments: totalStats[0]?.cancelledAppointments || 0,
            noShowAppointments: totalStats[0]?.noShowAppointments || 0,
            appointmentsByStaff: staffPerformance,
            topClients: topClients,
            revenueByDay: revenueByDay,
            monthlyComparison: monthlyComparison,
            busiestTimes: busiestTimes,
            paymentMethods: paymentMethods,
            timeAnalytics: timeAnalytics,
            clientMetrics: clientMetrics[0] || { totalUniqueClients: 0, avgAppointmentsPerClient: 0, repeatClientRate: 0 }
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

// GET /api/reports/heatmap - Hot hours heatmap data
router.get('/heatmap', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const businessOwnerId = req.user.id;
        const { months = 3 } = req.query;
        const startDate = moment().subtract(parseInt(months), 'months').startOf('day');

        const data = await Event.aggregate([
            {
                $match: {
                    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
                    status: { $in: ['completed', 'confirmed', 'pending'] },
                    date: { $gte: startDate.toDate() }
                }
            },
            {
                $project: {
                    dayOfWeek: { $dayOfWeek: '$date' }, // 1=Sun, 7=Sat
                    hour: {
                        $toInt: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 0] }
                    }
                }
            },
            {
                $group: {
                    _id: { day: '$dayOfWeek', hour: '$hour' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.day': 1, '_id.hour': 1 } }
        ]);

        // Transform to matrix format: { day, hour, count }
        const heatmap = data.map(d => ({
            day: d._id.day, // 1=Sun ... 7=Sat
            hour: d._id.hour,
            count: d.count
        }));

        res.json(heatmap);
    } catch (err) {
        console.error('Heatmap report error:', err);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;
