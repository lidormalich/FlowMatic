import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import api, { reportsApi } from '../../services/api'; // Use configured api instance

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedClientHistory, setSelectedClientHistory] = useState(null);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [selectedClient, setSelectedClient] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        notes: ''
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error('שגיאה בטעינת לקוחות');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncClients = async () => {
        try {
            setSyncing(true);
            const response = await api.post('/clients/sync');
            toast.success(response.data.message);
            fetchClients();
        } catch (error) {
            console.error('Error syncing clients:', error);
            toast.error('שגיאה בסנכרון לקוחות');
        } finally {
            setSyncing(false);
        }
    };

    const handleExportClients = async () => {
        try {
            const response = await reportsApi.exportClients();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting clients:', error);
            toast.error('שגיאה ביצוא לקוחות');
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openHistoryModal = async (clientId) => {
        try {
            const response = await api.get(`/clients/${clientId}`);
            setSelectedClientHistory(response.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error('Error fetching client history:', error);
            toast.error('שגיאה בטעינת היסטוריה');
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({ name: '', phone: '', email: '', notes: '' });
        setShowModal(true);
    };

    const openEditModal = (client) => {
        setModalMode('edit');
        setSelectedClient(client);
        setFormData({
            name: client.name,
            phone: client.phone,
            email: client.email || '',
            notes: client.notes || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await api.post('/api/clients', formData); // Corrected endpoint if needed, but api instance usually has base url
                // actually api instance usually has /api base so just /clients
                await api.post('/clients', formData);
                toast.success('לקוח נוסף בהצלחה');
            } else {
                await api.put(`/clients/${selectedClient._id}`, formData);
                toast.success('פרטי לקוח עודכנו בהצלחה');
            }
            setShowModal(false);
            fetchClients();
        } catch (error) {
            console.error('Error saving client:', error);
            toast.error(error.response?.data?.message || 'שגיאה בשמירת לקוח');
        }
    };

    const handleDelete = async (clientId) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return;
        try {
            await api.delete(`/clients/${clientId}`);
            toast.success('לקוח נמחק בהצלחה');
            fetchClients();
        } catch (error) {
            console.error('Error deleting client:', error);
            toast.error('שגיאה במחיקת לקוח');
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">ניהול לקוחות</h1>
                    <p className="text-gray-600">צפה ונהל את מאגר הלקוחות שלך ({clients.length} לקוחות)</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportClients}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        📊 יצא לאקסל
                    </button>
                    <button
                        onClick={handleSyncClients}
                        disabled={syncing}
                        className="bg-white border text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        {syncing ? 'מסנכרן...' : '🔄 סנכרן מהיומן'}
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                        ➕ לקוח חדש
                    </button>
                </div>
            </div>

            {/* Search and Stats */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
                <input
                    type="text"
                    placeholder="חפש לפי שם, טלפון או אימייל..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
            </div>

            {loading ? (
                <div className="text-center py-12">טוען לקוחות...</div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-bold text-gray-800">לא נמצאו לקוחות</h3>
                    <p className="text-gray-500">הוסף לקוח חדש או סנכרן מהיומן</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">שם</th>
                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">טלפון</th>
                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">אימייל</th>
                                    <th className="px-6 py-4 text-center font-semibold text-gray-700">תורים</th>
                                    <th className="px-6 py-4 text-center font-semibold text-gray-700">הכנסות</th>
                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">ביקור אחרון</th>
                                    <th className="px-6 py-4 text-center font-semibold text-gray-700">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredClients.map(client => (
                                    <tr key={client._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                                        <td className="px-6 py-4 text-gray-600" dir="ltr">{client.phone}</td>
                                        <td className="px-6 py-4 text-gray-600">{client.email || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                                                {client.totalAppointments || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-green-600 font-semibold">
                                            ₪{client.totalSpend || 0}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('he-IL') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <a
                                                    href={`https://wa.me/${client.phone.replace(/\D/g, '').replace(/^0/, '972')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                                    title="WhatsApp"
                                                >
                                                    💬
                                                </a>
                                                <button
                                                    onClick={() => openHistoryModal(client._id)}
                                                    className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition-colors"
                                                    title="היסטוריה"
                                                >
                                                    🕒
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(client)}
                                                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                    title="ערוך"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client._id)}
                                                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    title="מחק"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && selectedClientHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center shrink-0">
                            <h2 className="text-2xl font-bold">היסטוריית תורים - {selectedClientHistory.name}</h2>
                            <button onClick={() => setShowHistoryModal(false)} className="text-white hover:bg-white/20 p-2 rounded-full">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="text-blue-600 text-sm font-semibold mb-1">סה״כ תורים</div>
                                    <div className="text-2xl font-bold text-gray-800">{selectedClientHistory.stats?.total || 0}</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <div className="text-green-600 text-sm font-semibold mb-1">הושלמו</div>
                                    <div className="text-2xl font-bold text-gray-800">{selectedClientHistory.stats?.completed || 0}</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <div className="text-purple-600 text-sm font-semibold mb-1">סה״כ הכנסות</div>
                                    <div className="text-2xl font-bold text-gray-800">₪{selectedClientHistory.stats?.totalSpend || 0}</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <div className="text-red-600 text-sm font-semibold mb-1">ביטולים/לא הגיע</div>
                                    <div className="text-2xl font-bold text-gray-800">
                                        {(selectedClientHistory.stats?.cancelled || 0) + (selectedClientHistory.stats?.noShow || 0)}
                                    </div>
                                </div>
                            </div>

                            {/* Appointments Table */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">תאריך</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">שירות</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">מחיר</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">סטטוס</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedClientHistory.appointments?.map((apt) => (
                                            <tr key={apt._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-800">
                                                    {new Date(apt.date).toLocaleDateString('he-IL')} {apt.startTime}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800">{apt.service}</td>
                                                <td className="px-4 py-3 text-sm text-gray-800">₪{apt.price}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                        ${apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                                apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                    apt.status === 'no_show' ? 'bg-gray-100 text-gray-700' :
                                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                        {apt.status === 'completed' ? 'הושלם' :
                                                            apt.status === 'confirmed' ? 'מאושר' :
                                                                apt.status === 'cancelled' ? 'בוטל' :
                                                                    apt.status === 'no_show' ? 'לא הגיע' : 'ממתין'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!selectedClientHistory.appointments || selectedClientHistory.appointments.length === 0) && (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                                    אין היסטוריית תורים ללקוח זה
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                סגור
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            {modalMode === 'create' ? 'הוספת לקוח חדש' : 'עריכת פרטי לקוח'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">טלפון *</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                    dir="ltr"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
                                >
                                    {modalMode === 'create' ? 'הוסף' : 'שמור'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
