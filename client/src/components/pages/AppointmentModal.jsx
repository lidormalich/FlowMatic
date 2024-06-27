import React, { useState } from 'react';
import AppointmentSummary from '../AppointmentSummary';

const AppointmentModal = ({
    showModal,
    setShowModal,
    selectedDate,
    selectedSlot,
    handleSaveAppointment,
    addToGoogleCalendar,
    createICalEvent,
    customerDetails,
    setCustomerDetails,
    services
}) => {
    const [confirmAddToCalendar, setConfirmAddToCalendar] = useState(false);
    const [isInputValid, setIsInputValid] = useState(true);

    // const handlePhoneChange = (e) => {
    //     const input = e.target.value;
    //     // מאפשר רק קלט של ספרות ומוודא שהאורך לא יעלה על 9
    //     const formattedInput = input.replace(/[^\d]/g, '').slice(0, 9);
    //     setCustomerDetails((prev) => ({ ...prev, phone: formattedInput }));
    // };

    const handlePhoneChange = (e) => {
        const input = e.target.value;
        const isDigitsOnly = /^\d*$/.test(input);

        if (!isDigitsOnly) {
            setIsInputValid(false);
            return; // אל תעדכן את ה-state של הטלפון אם הקלט לא תקין
        }

        setIsInputValid(true); // הקלט תקין, אז מאפשר לעדכן את ה-state
        setCustomerDetails((prev) => ({ ...prev, phone: input.slice(0, 9) }));
    };

    const handleServiceChange = (service) => {
        setCustomerDetails((prev) => ({
            ...prev,
            services: prev.services.includes(service)
                ? prev.services.filter((item) => item !== service)
                : [...prev.services, service],
        }));
    };

    const handleSaveAndAddToCalendar = async () => {
        await handleSaveAppointment();
        setConfirmAddToCalendar(true);
    };

    return (
        <div className={`fixed inset-0 z-10 overflow-hidden flex items-center justify-center ${showModal ? 'block' : 'hidden'} `}>


            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <div className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">

                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative">
                    <button
                        type="button"
                        className="absolute top-0 left-0 m-2 p-2 text-gray-400 hover:text-gray-500"
                        onClick={() => setShowModal(false)}
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {!confirmAddToCalendar ? <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Select Services</h3>
                            <div className="mb-4">
                                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Name
                                </label>
                                <input
                                    type="text"
                                    id="customerName"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    value={customerDetails.name}
                                    onChange={(e) => setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Phone
                                </label>
                                <input
                                    type="tel"
                                    id="customerPhone"
                                    pattern="^\d{9}$"
                                    title="Phone number must be exactly 9 digits."
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    value={customerDetails.phone}
                                    onChange={handlePhoneChange}
                                />
                                <p className={`text-red-500 ${!isInputValid ? "block" : "hidden "}`}>נא להכניס מספר טלפון תקין</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {services.map((service) => (
                                    <div key={service} className="flex items-center">
                                        <input
                                            id={service}
                                            type="checkbox"
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            checked={customerDetails.services.includes(service)}
                                            onChange={() => handleServiceChange(service)}
                                        />
                                        <label htmlFor={service} className="ml-2 block text-sm text-gray-900">
                                            {service}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* </div> */}
                    </div> : <>
                        <AppointmentSummary customerDetails={customerDetails} selectedDate={selectedDate} selectedSlot={selectedSlot} />
                    </>}
                </div>
                {!confirmAddToCalendar ? (
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-indigo-600 shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-'white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm mx-1" onClick={handleSaveAndAddToCalendar}
                        >
                            Save Appointment
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm mx-1"
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-indigo-600 shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-'white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm mx-2"
                            onClick={addToGoogleCalendar}
                        >
                            Add to Google Calendar
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-indigo-600 shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-'white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm mx-2"
                            onClick={createICalEvent}
                        >
                            Download ICAL
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentModal;
