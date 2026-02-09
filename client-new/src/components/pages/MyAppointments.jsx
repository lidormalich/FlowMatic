import { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/he';
import SkeletonLoader from '../common/SkeletonLoader';
import './PublicBooking.css'; // Reusing premium styles

const MyAppointments = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyBookings();
    }, []);

    const fetchMyBookings = async () => {
        try {
            const res = await axios.get('/api/appointments/my-bookings');
            setBookings(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">מאושר</span>;
            case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">ממתין</span>;
            case 'cancelled': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">בוטל</span>;
            case 'completed': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">הושלם</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-right">התורים שלי</h1>
                <SkeletonLoader type="card" count={3} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">התורים שלי</h1>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="text-5xl mb-4">📅</div>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">לא נמצאו תורים</h2>
                    <p className="text-gray-500">כשתיקבע תור אצל אחד העסקים, הוא יופיע כאן</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                                    {booking.businessOwnerId?.profileImage ? (
                                        <img src={booking.businessOwnerId.profileImage} alt="" className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <span>{booking.businessOwnerId?.businessName?.[0] || '🏢'}</span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <h3 className="font-bold text-lg text-gray-800">{booking.businessOwnerId?.businessName || booking.businessOwnerId?.name}</h3>
                                    <p className="text-primary font-semibold">{booking.service}</p>
                                    <p className="text-sm text-gray-500">{moment(booking.date).format('DD/MM/YYYY')} • {booking.startTime}</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(booking.status)}
                                <p className="font-bold text-gray-700">₪{booking.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAppointments;
