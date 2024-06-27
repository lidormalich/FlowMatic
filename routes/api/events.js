const express = require('express');
const router = express.Router();
const User = require('../../models/User');

const Event = require('../../models/Event');

const moment = require('moment'); 

router.get('/appointments', async (req, res) => {
    console.log("GET 15");
    const { date, duration = 30 } = req.query; 

    try {
        
        const appointments = await Event.find({ date });
        console.log({appointments});
        const occupiedSlots = appointments.map(appointment => ({
            startTime: moment(`${date} ${appointment.description}`, 'YYYY-MM-DD HH:mm'),
            endTime: moment(`${date} ${appointment.description}`, 'YYYY-MM-DD HH:mm').add(duration, 'minutes')
        }));
        console.log({appointments,occupiedSlots});
        
        const allSlots = [];
        let startTime = moment(`${date} 10:00`, 'YYYY-MM-DD HH:mm');
        const endTime = moment(`${date} 18:00`, 'YYYY-MM-DD HH:mm');

        while (startTime.isBefore(endTime)) {
            const slotEndTime = startTime.clone().add(duration, 'minutes');

            const isOccupied = occupiedSlots.some(slot => {
                return (
                    (startTime.isBetween(slot.startTime, slot.endTime, null, '[)')) ||
                    (slotEndTime.isBetween(slot.startTime, slot.endTime, null, '(]'))
                );
            });

            if (!isOccupied) {
                allSlots.push(startTime.format('HH:mm'));
            }

            startTime.add(duration, 'minutes');
        }
        res.status(200).send({ availableSlots: allSlots });
    } catch (error) {
        res.status(500).send({ message: 'שגיאה בשרת: לא ניתן לקרוא את הנתונים' });
    }
});
router.get('/events/month', async (req, res) => {
    const today = moment().startOf('day');
    const nextMonth = moment(today).add(1, 'month');

    try {
        const events = await Event.find({
            date: {
                $gte: today.toDate(),
                $lt: nextMonth.toDate()
            }
        }).sort({ date: 1,description:1 }); // ממיין את האירועים לפי תאריך
console.log({events});
        res.status(200).json(events);
    } catch (error) {
        res.status(500).send({ message: 'שגיאה בשרת: לא ניתן לקרוא את הנתונים' });
    }
});
router.post('/appointments', async (req, res) => {
    console.log("POST 51");
    const { date ,time,services,customerName,customerPhone,location,endTime,startTime,description} = req.body;

    try {
        
        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({ message: 'תאריך לא חוקי' });
        }

        
        const newEvent = new Event({
            date: moment(date).format('YYYY-MM-DD'),
            time,
            services,
            customerName,
            customerPhone,location,endTime,startTime,description
        });

        
        await newEvent.save();

        res.status(201).json({ message: 'האירוע נוצר בהצלחה' });
    } catch (error) {
        console.error('שגיאה ביצירת אירוע:', error.message);
        res.status(500).json({ message: 'שגיאה בשרת: לא ניתן ליצור אירוע' });
    }
});
module.exports = router;
