import React, { useState } from 'react';
import { List, ListItem, ListItemText, Divider, Paper, makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
    position: 'relative',
    overflow: 'auto',
    maxHeight: '70vh', // גובה מקסימלי למחשבים
    [theme.breakpoints.down('sm')]: {
        maxHeight: '60vh', // גובה מקסימלי לניידים
    },
    modal: {
        transition: "all 0.5s ease-in-out",
    },
}));
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // ינואר הוא 0
    const year = date.getFullYear();
    return `${day}/${month}-${year}`;
};
const EventModal = ({ event, onClose }) => {
    const updateEventStatus = async (newStatus) => {
        try {
            const response = await fetch(`YOUR_ENDPOINT/${event.id}/status`, { // החלף את YOUR_ENDPOINT בכתובת המתאימה
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Network response was not ok.');

            // טיפול בתגובה מהשרת, לדוגמה עדכון מצב בממשק המשתמש
            alert('סטטוס התור עודכן בהצלחה');
        } catch (error) {
            console.error('Failed to update event status:', error);
            alert('שגיאה בעדכון סטטוס התור');
        }
    };

    // רכיב הבחירה של הסטטוס
    const StatusSelector = () => (
        <div className="mt-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">עדכן סטטוס:</label>
            <select
                id="status"
                name="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                defaultValue=""
                onChange={(e) => updateEventStatus(e.target.value)}
            >
                <option value="" disabled>בחר סטטוס...</option>
                <option value="מאושר">מאושר</option>
                <option value="מבוטל">מבוטל</option>
                <option value="בהמתנה">בהמתנה</option>
            </select>
        </div>
    );

    // הוספת הרכיב StatusSelector לתוך ה- return של הקומפוננטה EventModal
    if (!event) return null;

    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const getDateDifference = (eventDate) => {
        const today = new Date();
        const eDate = new Date(eventDate);
        const differenceInTime = eDate.getTime() - today.getTime();
        const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

        if (differenceInDays > 0) return `בעוד ${differenceInDays} ימים`;
        if (differenceInDays < 0) return `לפני ${Math.abs(differenceInDays)} ימים`;
        return 'היום';
    };

    const createWhatsAppLink = () => {
        const message = `שלום ${event.customerName}, הנה פרטי התור שלך:%0Aתיאור: ${event.description}%0Aתאריך: ${new Date(event.date).toLocaleDateString()}%0Aשעת התחלה: ${formatTime(event.startTime)}%0Aשעת סיום: ${formatTime(event.endTime)}%0Aמיקום: ${event.location}%0Aשירותים: ${event.services.join(', ')}`;
        return `https://wa.me/972${event.customerPhone}?text=${message}`;
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="my-modal">
            <div className="relative top-20 mx-auto pb-5 px-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mt-3 mb-2 text-center">{event.title}</h3>
                    <div className="mt-3 text-right">
                        <div className="mt-2 px-1 py-3">
                            <p className="text-sm text-gray-500"><strong>תיאור:</strong> {event.description}</p>
                            <p className="text-sm text-gray-500"><strong>תאריך:</strong> {new Date(event.date).toLocaleDateString()} ({getDateDifference(event.date)})</p>

                            <p className="text-sm text-gray-500"><strong>שעת התחלה:</strong> {formatTime(event.startTime)} </p>
                            <p className="text-sm text-gray-500"><strong>שעת סיום:</strong> {formatTime(event.endTime)}</p>
                            <p className="text-sm text-gray-500">
                                <strong>שם הלקוח:</strong> {event.customerName}
                            </p>
                            <p className="text-sm text-gray-500">
                                <strong>טלפון הלקוח:</strong>
                                <a href={`tel:${event.customerPhone}`} style={{ marginRight: '8px' }}>{event.customerPhone}</a>
                                <a href={`https://wa.me/${event.customerPhone}`} target="_blank" style={{ display: 'inline-block' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/256/174/174879.png" alt="WhatsApp" style={{ width: '24px', verticalAlign: 'middle' }} className='mx-2' />
                                </a>
                            </p>
                            <p className="text-sm text-gray-500">
                                <strong>מיקום:</strong>
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer">
                                    {event.location}
                                </a>
                            </p>
                            <p className="text-sm text-gray-500"><strong>שירותים:</strong> {event.services.join(', ')}</p>
                        </div>
                        <StatusSelector />

                        <div className="flex flex-col items-center px-4 py-3">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 mb-2">
                                סגור
                            </button>
                            <a href={createWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                                <button className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-300">
                                    שלח פרטי תור ב-WhatsApp
                                </button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
const EventsList = ({ events }) => {
    const classes = useStyles();
    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleListItemClick = (event) => {
        setSelectedEvent(event);
    };

    return (
        <div className="p-3">
            <Paper className={classes.listRoot} >
                <List component="nav" aria-label="events list">
                    {events.map((event, index) => (
                        <React.Fragment key={index}>
                            <ListItem button style={{ textAlign: 'right', }} onClick={() => handleListItemClick(event)}>
                                <ListItemText primary={event.title} secondary={`מתחיל: ${formatDate(event.startTime)} עד: ${formatDate(event.endTime)}`} />
                            </ListItem>
                            {index < events.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
            <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </div>
    );
};

export default EventsList;