import React, { useState, useEffect } from 'react';
import moment from 'moment';
import AppointmentModal from './AppointmentModal';

const AppointmentScheduler = () => {
    const [busySlots, setBusySlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedServices, setSelectedServices] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const services = ['Gel Nails', 'Nail Treatment', 'Manicure', 'Pedicure'];

    useEffect(() => {
        if (selectedDate) {
            fetchBusySlots(selectedDate);
        }
    }, [selectedDate]);

    const fetchBusySlots = async (date) => {
        setLoading(true);
        try {
            const response = await fetch(`http://yourapi.com/appointments?date=${date}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setBusySlots(data);
            generateAvailableSlots(data);
        } catch (err) {
            setError('Failed to fetch busy slots');
            generateAvailableSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const generateAvailableSlots = (busySlots) => {
        const slots = [];
        let startTime = moment('10:00', 'HH:mm');
        const endTime = moment('18:00', 'HH:mm');

        while (startTime.isBefore(endTime)) {
            if (!busySlots.includes(startTime.format('HH:mm'))) {
                slots.push(startTime.format('HH:mm'));
            }
            startTime = startTime.add(30, 'minutes');
        }

        setAvailableSlots(slots);
    };

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleSlotSelection = (slot) => {
        setSelectedSlot(slot);
        setShowModal(true);
    };

    const handleSaveAppointment = async () => {
        const appointmentData = {
            date: selectedDate,
            time: selectedSlot,
            services: selectedServices,
            customerName: customerName,
            customerPhone: customerPhone
        };

        try {
            const response = await fetch('http://yourapi.com/saveAppointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            alert('Appointment saved successfully!');
        } catch (error) {
            alert('Failed to save appointment');
        } finally {
            setShowModal(false);
        }
    };

    const addToGoogleCalendar = () => {
        const eventDetails = {
            title: 'Appointment',
            description: `Appointment on ${selectedDate} at ${selectedSlot}`,
            startTime: moment(`${selectedDate} ${selectedSlot}`, 'YYYY-MM-DD HH:mm').toISOString(),
            endTime: moment(`${selectedDate} ${selectedSlot}`, 'YYYY-MM-DD HH:mm').add(1, 'hour').toISOString()
        };

        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&dates=${encodeURIComponent(eventDetails.startTime)}/${encodeURIComponent(eventDetails.endTime)}&details=${encodeURIComponent(eventDetails.description)}`;

        window.open(googleCalendarUrl, '_blank');
    };

    return (
        <div className="container mx-auto mt-8">
            <div className="bg-white p-6 shadow-sm rounded-md">
                <div className="mb-4">
                    <label htmlFor="appointment-date" className="block text-sm font-medium text-gray-700">
                        Select a date
                    </label>
                    <input
                        type="date"
                        id="appointment-date"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={selectedDate}
                        onChange={handleDateChange}
                    />
                </div>
                {loading && (
                    <div className="flex justify-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                )}
                {error && <div className="alert alert-danger">{error}</div>}
                {availableSlots.length > 0 && (
                    <div className="flex flex-wrap">
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
                    selectedServices={selectedServices}
                    setSelectedServices={setSelectedServices}
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    customerPhone={customerPhone}
                    setCustomerPhone={setCustomerPhone}
                    services={services}
                />
            )}
        </div>
    );
};

export default AppointmentScheduler;
