import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import AppointmentModal from './AppointmentModal';
import { convertToHebrewDate } from '../global';
import Header from '../Header';
import Footer from '../Footer';
import { useParams } from 'react-router-dom/cjs/react-router-dom';

const AppointmentScheduler = () => {
    const { user } = useParams();
    console.log({ user });

    const today = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }, []);

    const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');

    // const [busySlots, setBusySlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(tomorrow || '');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        phone: '',
        services: [],
    });

    const services = ['Gel Nails', 'Nail Treatment', 'Manicure', 'Pedicure'];
    const convertToHebDate = useMemo(() => {
        return new Date(selectedDate);
    }, [selectedDate]);
    useEffect(() => {
        if (selectedDate) {
            fetchBusySlots(selectedDate);
        }
    }, [selectedDate]);

    const fetchBusySlots = async (date) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/appointments?date=${date}`, {
                method: 'GET', // Optional, since GET is the default method
                headers: {
                    'Content-Type': 'application/json',
                    'Username': user
                }
            });;
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            // setBusySlots(data);
            generateAvailableSlots(data);
        } catch (err) {
            console.log({ err });
            console.log("שגיאה בשליפת פנויות תורים");
            // setError('Failed to fetch busy slots');
            generateAvailableSlots(null);
        } finally {
            setLoading(false);
        }
    };

    const generateAvailableSlots = (busySlots) => {
        // const today = new Date();
        today.setHours(0, 0, 0, 0); // קביעת השעה לתחילת היום

        const userDate = new Date(selectedDate);
        userDate.setHours(0, 0, 0, 0); // קביעת השעה לתחילת היום

        // בדיקה אם התאריך שהמשתמש בחר הוא היום או בעבר
        if (userDate <= today) {
            return setAvailableSlots([]); // קביעת מערך ריק לחריצי הזמן הזמינים
        }
        setAvailableSlots(busySlots.availableSlots || []);
    };

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleSlotSelection = (slot) => {
        setSelectedSlot(slot);
        setShowModal(true);
    };

    // בקומפוננטה AppointmentScheduler
    const handleSaveAppointment = async () => {
        const appointmentData = {
            date: selectedDate,
            time: selectedSlot,
            services: customerDetails.services,
            customerName: customerDetails.name,
            customerPhone: customerDetails.phone,
            description: selectedSlot,
            startTime: moment(`${selectedDate} ${selectedSlot}`, 'YYYY-MM-DD HH:mm').toISOString(),
            endTime: moment(`${selectedDate} ${selectedSlot}`, 'YYYY-MM-DD HH:mm').add(30, 'minutes').toISOString(),
            location: 'רחוב בינמין מינץ 39, פתח תקווה',
            user
        };

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });
            if (!response.ok) throw new Error('שגיאה בשמירת התור');
            fetchBusySlots(selectedDate);
            alert('התור נשמר בהצלחה!');
        } catch (error) {
            alert('שגיאה בשמירת התור');
        }
    };


    const addToGoogleCalendar = () => {
        const eventDetails = {
            title: 'Appointment FUN',
            description: `Appointment on ${selectedDate} at ${selectedSlot}`,
            startTime: moment(`${selectedDate} ${selectedSlot}`, 'YYYY-MM-DD HH:mm').toISOString(),
            endTime: moment(`${selectedDate} ${selectedSlot}`, 'YYYY-MM-DD HH:mm').add(30, 'minutes').toISOString(),
            location: 'רחוב בינמין מינץ 39, פתח תקווה'
        };

        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&dates=${moment(eventDetails.startTime).format('YYYYMMDDTHHmmssZ')}/${moment(eventDetails.endTime).format('YYYYMMDDTHHmmssZ')}&details=${encodeURIComponent(eventDetails.description)}&location=${encodeURIComponent(eventDetails.location)}`;

        window.open(googleCalendarUrl, '_blank');
    };

    const createICalEvent = () => {
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//Your Product//EN
BEGIN:VEVENT
UID:${new Date().getTime()}@yourdomain.com
DTSTAMP:${moment().format('YYYYMMDDTHHmmss')}Z
DTSTART:${moment(`${selectedDate} ${selectedSlot}`, 'YYYY-MM-DD HH:mm').format('YYYYMMDDTHHmmss')}Z
DTEND:${moment(`${selectedDate} ${selectedSlot}`, 'YYYY-MM-DD HH:mm').add(30, 'minutes').format('YYYYMMDDTHHmmss')}Z
SUMMARY:Appointment
DESCRIPTION:Appointment on ${selectedDate} at ${selectedSlot}
LOCATION:רחוב בינמין מינץ 39, פתח תקווה
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'appointment.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <>
            <Header title="קביעת תור" />
            <div className="container mx-auto mt-8 text-right overflow-y-auto" dir="rtl">
                <div className="bg-white p-6 shadow-sm rounded-md">
                    <div className="mb-4">
                        <label htmlFor="appointment-date" className="block text-sm font-medium text-gray-700">
                            בחר תאריך
                        </label>
                        <div className="relative max-w-sm">
                            <input
                                type="date"
                                id="appointment-date"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={selectedDate}
                                onChange={handleDateChange}
                                min={tomorrow}
                                defaultValue={tomorrow}
                            />
                        </div>
                    </div>
                    {loading && (
                        <div className="flex justify-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">טוען...</span>
                            </div>
                        </div>
                    )}
                    {error && <div className="bg-red-500 text-white font-bold rounded p-2">{error}</div>}
                    {selectedDate && (
                        <div class="mt-2 py-3 px-2 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                            <span class="font-medium">                       התור שנבחר הוא בתאריך {moment(selectedDate).format('DD/MM/YYYY')} - {convertToHebrewDate(convertToHebDate)}</span>

                        </div>

                    )}
                    {!loading && availableSlots.length > 0 && (
                        <div className="flex flex-wrap justify-center">
                            {availableSlots.map((slot) => (
                                <button
                                    type="button"
                                    className="btn btn-outline-primary m-1"
                                    key={slot}
                                    onClick={() => handleSlotSelection(slot)}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {showModal && (
                    <AppointmentModal
                        showModal={showModal}
                        setShowModal={setShowModal}
                        selectedDate={selectedDate}
                        selectedSlot={selectedSlot}
                        handleSaveAppointment={handleSaveAppointment}
                        addToGoogleCalendar={addToGoogleCalendar}
                        createICalEvent={createICalEvent}
                        customerDetails={customerDetails}
                        setCustomerDetails={setCustomerDetails}
                        services={services}
                    />
                )}
            </div>
            <Footer />
        </>

    );
};

export default AppointmentScheduler;
