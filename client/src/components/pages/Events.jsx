import React, { useState } from 'react';
import { Paper, Button, makeStyles, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { HebrewCalendar, HDate } from 'hebcal';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Sidebar from '../partials/Sidebar';
import Navbar from '../partials/Navbar';
import EventsList from './EventsList';

moment.locale('he');
const localizer = momentLocalizer(moment);
const myMessages = {
    allDay: 'כל היום',
    previous: 'קודם',
    next: 'הבא',
    today: 'היום',
    month: 'חודש',
    week: 'שבוע',
    day: 'יום',
    agenda: 'סדר יום',
    date: 'תאריך',
    time: 'שעה',
    event: 'אירוע',
};

const useStyles = makeStyles((theme) => ({
    root: {
        margin: theme.spacing(3),
        padding: theme.spacing(3),
        direction: 'rtl',
    },
    button: {
        margin: theme.spacing(1),
    },
    textField: {
        margin: theme.spacing(1),
    },
    dialog: {
        direction: 'rtl',
    },
    dialogTitle: {
        textAlign: 'right',
    },
    dialogContent: {
        textAlign: 'right',
    },
}));

const convertToHebrewDate = (date) => {
    const hDate = new HDate(date);
    return hDate.toString('h');
};
const convertToHebrewDateWithHolidays = (date) => {
    const hDate = new HDate(date);
    const holidays = HebrewCalendar.getHolidaysOnDate(hDate);
    let holidayStr = '';
    if (holidays && holidays.length > 0) {
        holidayStr = ' - ' + holidays.map(holiday => holiday.getDesc('he')).join(', ');
    }
    return hDate.toString('h') + holidayStr;
};
const Events = () => {
    const classes = useStyles();
    const [events, setEvents] = useState([{
        title: "בדיקה 1",
        start: new Date("2023-06-25T00:00:00.000Z"),
        end: new Date("2023-06-30T00:00:00.000Z")
    }]);
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '' });

    const handleAddEvent = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = () => {
        setEvents([...events, { ...newEvent, start: new Date(newEvent.start), end: new Date(newEvent.end) }]);
        setOpen(false);
        setNewEvent({ title: '', start: '', end: '' }); // Reset form
    };
    console.log({ events });
    return (
        <>
            <Navbar />
            <div className="d-flex" id="wrapper">
                {/* <Sidebar /> */}
                <Paper className={classes.root}>
                    <Button variant="contained" color="primary" className={classes.button} onClick={handleAddEvent}>
                        הוסף אירוע
                    </Button>
                    <Dialog
                        open={open}
                        onClose={handleClose}
                        className={classes.dialog}
                        scroll='body' // שינוי ל-body כדי לאפשר גלילה רק אם יש צורך
                        maxWidth={false} // הסרת הגבלת maxWidth
                        fullWidth={true}
                        dir="rtl"
                        PaperProps={{
                            style: { // הוספת תכונות סגנון ל-Paper
                                maxWidth: '100%', // מקסימום רוחב
                                width: 'auto', // רוחב אוטומטי בהתאם לתוכן
                                maxHeight: 'calc(100% - 64px)', // גובה מקסימלי כדי למנוע גלילה
                                overflowY: 'auto', // גלילה אוטומטית בציר Y אם יש צורך
                            },
                        }}
                    >
                        <DialogTitle className={classes.dialogTitle}>הוסף אירוע חדש</DialogTitle>
                        <DialogContent className={classes.dialogContent}>
                            <TextField
                                autoFocus
                                margin="dense"
                                id="title"
                                label="כותרת אירוע"
                                type="text"
                                fullWidth
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                className={classes.textField}
                            />
                            <TextField
                                id="start"
                                label="תאריך התחלה"
                                type="date"
                                value={newEvent.start}
                                onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                                className={classes.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                            <TextField
                                id="end"
                                label="תאריך סיום"
                                type="date"
                                value={newEvent.end}
                                onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                                className={classes.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose} color="primary">
                                ביטול
                            </Button>
                            <Button onClick={handleSave} color="primary">
                                שמור
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <Calendar
                        localizer={localizer}
                        events={events.map(event => ({
                            ...event,
                            title: `${event.title} (${convertToHebrewDate(event.start)} - ${convertToHebrewDate(event.end)})`
                        }))}
                        messages={myMessages}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 500, margin: '20px 0' }}
                        rtl
                    />
                </Paper>
                <EventsList events={events} />
            </div>
        </>
    );
};

export default Events;
