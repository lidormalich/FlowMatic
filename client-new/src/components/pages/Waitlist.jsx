import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { waitlistApi } from '../../services/api';
import SkeletonLoader from '../common/SkeletonLoader';
import moment from 'moment';

const ScoreBadge = ({ score, noShows }) => {
    if (score == null) return <span className="text-xs text-slate-400">-</span>;
    const s = Math.round(score);
    if (s >= 75) return (
        <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700" title="לקוח מצוין – עדיפות גבוהה">
            ★ {s}
        </span>
    );
    if (s >= 40) return (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700" title="לקוח רגיל">
            {s}
        </span>
    );
    return (
        <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700" title={`לקוח בעייתי${noShows ? ` – ${noShows} אי-הגעות` : ''}`}>
            ⚠ {s}
        </span>
    );
};

const Waitlist = () => {
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWaitlist();
    }, []);

    const fetchWaitlist = async () => {
        try {
            setLoading(true);
            const data = await waitlistApi.getAll();
            setWaitlist(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching waitlist:', error);
            toast.error('שגיאה בטעינת רשימת ההמתנה');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await waitlistApi.updateStatus(id, newStatus);
            toast.success('סטטוס עודכן בהצלחה');
            setWaitlist(prev => prev.map(item =>
                item._id === id ? { ...item, status: newStatus } : item
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('שגיאה בעדכון סטטוס');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק בקשה זו?')) return;
        try {
            await waitlistApi.delete(id);
            toast.success('בקשה נמחקה בהצלחה');
            setWaitlist(prev => prev.filter(item => item._id !== id));
        } catch (error) {
            console.error('Error deleting request:', error);
            toast.error('שגיאה במחיקת בקשה');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            notified: 'bg-blue-100 text-blue-800',
            booked: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        const labels = {
            pending: 'ממתין',
            notified: 'קיבל הודעה',
            booked: 'נקבע תור',
            cancelled: 'בוטל'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) return <SkeletonLoader />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">רשימת המתנה</h1>
                <p className="text-gray-600">נהל בקשות של לקוחות לרשימת המתנה</p>
            </div>

            {waitlist.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <div className="text-6xl mb-4">⏳</div>
                    <h3 className="text-xl font-medium text-gray-900">אין בקשות ממתינות</h3>
                    <p className="text-gray-500">רשימת ההמתנה ריקה כרגע</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">לקוח</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider" title="ציון איכות לקוח – ממוין מגבוה לנמוך">ציון ↓</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">שירות מבוקש</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">תאריך מבוקש</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">הערות</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">סטטוס</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {waitlist.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{item.clientName}</div>
                                            <div className="text-sm text-gray-500">{item.clientPhone}</div>
                                            {item.clientEmail && <div className="text-xs text-gray-400">{item.clientEmail}</div>}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <ScoreBadge score={item.clientScore} noShows={item.clientNoShows} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{item.serviceId?.name || 'לא צוין'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {item.preferredDate ? new Date(item.preferredDate).toLocaleDateString('he-IL') : 'גמיש'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                נוצר: {moment(item.createdAt).fromNow()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate" title={item.notes}>{item.notes || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item._id, e.target.value)}
                                                className="ml-2 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-xs py-1"
                                            >
                                                <option value="pending">ממתין</option>
                                                <option value="notified">הודעה נשלחה</option>
                                                <option value="booked">נקבע תור</option>
                                                <option value="cancelled">בוטל</option>
                                            </select>
                                            <button
                                                onClick={() => handleDelete(item._id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Waitlist;
