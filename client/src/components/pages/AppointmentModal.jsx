import React, { useState } from 'react';

const AppointmentModal = ({
    showModal,
    setShowModal,
    selectedDate,
    selectedSlot,
    handleSaveAppointment,
    addToGoogleCalendar,
    selectedServices,
    setSelectedServices,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    services
}) => {
    const [confirmAddToCalendar, setConfirmAddToCalendar] = useState(false);

    const handleServiceChange = (service) => {
        setSelectedServices((prev) =>
            prev.includes(service)
                ? prev.filter((item) => item !== service)
                : [...prev, service]
        );
    };

    const handleSaveAndAddToCalendar = async () => {
        await handleSaveAppointment();
        setConfirmAddToCalendar(true);
    };

    return (
        <div className={`fixed inset-0 z-10 overflow-hidden flex items-center justify-center ${showModal ? 'block' : 'hidden'}`}>
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <div className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
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
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Phone
                                </label>
                                <input
                                    type="text"
                                    id="customerPhone"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700">Select Services:</p>
                                {services.map((service) => (
                                    <div key={service} className="flex items-center mb-2">
                                        <input
                                            type="checkbox"
                                            id={service}
                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                            checked={selectedServices.includes(service)}
                                            onChange={() => handleServiceChange(service)}
                                        />
                                        <label htmlFor={service} className="ml-2 block text-sm text-gray-900">
                                            {service}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    {!confirmAddToCalendar ? (
                        <>
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={handleSaveAndAddToCalendar}
                            >
                                Save Appointment
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-100 text-base font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={addToGoogleCalendar}
                            >
                                Add to Google Calendar
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                onClick={() => {
                                    setShowModal(false);
                                    setConfirmAddToCalendar(false);
                                }}
                            >
                                Close
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentModal;
