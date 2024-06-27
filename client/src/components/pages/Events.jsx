import React, { useEffect, useState } from 'react';
import { Paper, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Navbar from '../partials/Navbar';
import EventsList from './EventsList';
require('moment/locale/he.js')

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

const Events = () => {
    const [events, setEvents] = useState([]);
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '' });

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events/month');
            const data = await response.json();
            const updatedEvents = data.map(event => ({
                ...event,
                title: `טיפול של ${event.customerName}`
            }));
            setEvents(updatedEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleAddEvent = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = () => {
        setEvents([...events, { ...newEvent, start: new Date(newEvent.start), end: new Date(newEvent.end) }]);
        setOpen(false);
        setNewEvent({ title: '', start: '', end: '' });
        fetchEvents();
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <>
            <Navbar />
            <div className="block md:hidden">
                <Button
                    variant="contained"
                    color="primary"
                    className='m-4'
                    onClick={handleAddEvent}
                >
                    הוסף אירוע
                </Button>
            </div>
            <div className="flex flex-col sm:flex-row-reverse p-3">
                <div className="md:w-1/3 w-full p-3">
                    <EventsList events={events} />
                </div>
                <Paper className="md:w-2/3 w-full p-3 mt-4 md:mt-0">
                    <div className="hidden md:block">
                        <Button
                            variant="contained"
                            color="primary"
                            className='m-4'
                            onClick={handleAddEvent}
                        >
                            הוסף אירוע
                        </Button>
                    </div>
                    <Calendar
                        localizer={localizer}
                        events={events.map(event => ({
                            ...event,
                            title: event.title,
                            start: new Date(event.startTime),
                            end: new Date(event.endTime)
                        }))}
                        messages={myMessages}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 500 }}
                        rtl
                        onShowMore={(events, date) => {
                            console.log("אירועים נוספים:", events);
                            console.log("תאריך:", date);
                        }}
                    />
                </Paper>
            </div>
            <Dialog
                open={open}
                onClose={handleClose}
                scroll='body'
                maxWidth={false}
                fullWidth={true}
                dir="rtl"
                PaperProps={{
                    style: {
                        maxWidth: '100%',
                        width: 'auto',
                        maxHeight: 'calc(100% - 64px)',
                        overflowY: 'auto',
                    },
                }}
            >
                <DialogTitle className="text-right">הוסף אירוע חדש</DialogTitle>
                <DialogContent className="text-right">
                    <TextField
                        autoFocus
                        margin="dense"
                        id="title"
                        label="כותרת אירוע"
                        type="text"
                        fullWidth
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className="my-2"
                    />
                    <TextField
                        id="start"
                        label="תאריך התחלה"
                        type="date"
                        value={newEvent.start}
                        onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                        className="my-2"
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
                        className="my-2"
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
        </>
    );
};

export default Events;
