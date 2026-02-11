import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import api, { reportsApi } from '../../services/api';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedClientHistory, setSelectedClientHistory] = useState(null);
    const [modalMode, setModalMode] = useState('create');
    const [selectedClient, setSelectedClient] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        notes: '',
        tags: []
    });

    const PREDEFINED_TAGS = [
        { label: 'VIP', icon: '👑' },
        { label: 'מאחר כרוני', icon: '⏰' },
        { label: 'חייב כסף', icon: '💰' },
        { label: 'חדש', icon: '⭐' },
        { label: 'קבוע', icon: '💙' },
    ];

    useEffect(() => {
        syncAndFetch();
    }, []);

    const syncAndFetch = async () => {
        try {
            setLoading(true);
            // Sync silently - don't block on failure
            try {
                await api.post('/clients/sync');
            } catch (syncErr) {
                console.warn('Client sync skipped:', syncErr.message);
            }
            // Always fetch clients
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Error loading clients:', error);
            toast.error('שגיאה בטעינת לקוחות');
        } finally {
            setLoading(false);
        }
    };

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
            if (response.data.created > 0) {
                toast.success(`נוספו ${response.data.created} לקוחות חדשים`);
            } else {
                toast.info('כל הלקוחות כבר מסונכרנים');
            }
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

    const toggleTag = (tagLabel) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tagLabel)
                ? prev.tags.filter(t => t !== tagLabel)
                : [...prev.tags, tagLabel]
        }));
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
        setFormData({ name: '', phone: '', email: '', notes: '', tags: [] });
        setShowModal(true);
    };

    const openEditModal = (client) => {
        setModalMode('edit');
        setSelectedClient(client);
        setFormData({
            name: client.name,
            phone: client.phone,
            email: client.email || '',
            notes: client.notes || '',
            tags: client.tags || []
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
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

    const handleToggleBlock = async (client) => {
        const newBlocked = !client.isBlocked;
        const action = newBlocked ? 'לחסום' : 'לשחרר';
        if (!window.confirm(`האם אתה בטוח שברצונך ${action} את ${client.name}?`)) return;

        try {
            await api.put(`/clients/${client._id}`, {
                isBlocked: newBlocked,
                blockedReason: newBlocked ? 'חסום ידנית' : ''
            });
            toast.success(newBlocked ? 'הלקוח נחסם בהצלחה' : 'הלקוח שוחרר בהצלחה');
            fetchClients();
        } catch (error) {
            console.error('Error toggling block:', error);
            toast.error('שגיאה בעדכון סטטוס חסימה');
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">ניהול לקוחות</h1>
                    <p className="text-slate-500 dark:text-slate-400">צפה ונהל את מאגר הלקוחות שלך ({clients.length} לקוחות)</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExportClients}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-full font-semibold shadow-lg shadow-green-500/30 transition-all duration-200 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        יצא לאקסל
                    </button>
                    <button
                        onClick={handleSyncClients}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-full font-medium transition-all duration-200 active:scale-95 disabled:opacity-50"
                    >
                        <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {syncing ? 'מסנכרן...' : 'סנכרן מהיומן'}
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        לקוח חדש
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="relative">
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="חפש לפי שם, טלפון או אימייל..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 bg-slate-100 border-0 rounded-2xl pr-12 pl-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 outline-none text-right"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500">טוען לקוחות...</p>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">לא נמצאו לקוחות</h3>
                    <p className="text-slate-500">הוסף לקוח חדש או סנכרן מהיומן</p>
                </div>
            ) : (
                <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">שם</th>
                                    <th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">טלפון</th>
                                    <th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">אימייל</th>
                                    <th className="px-6 py-4 text-center font-semibold text-slate-600 text-sm">תורים</th>
                                    <th className="px-6 py-4 text-center font-semibold text-slate-600 text-sm">הכנסות</th>
                                    <th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">ביקור אחרון</th>
                                    <th className="px-6 py-4 text-center font-semibold text-slate-600 text-sm">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredClients.map(client => (
                                    <tr key={client._id} className={`hover:bg-slate-50/50 transition-colors ${client.isBlocked ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900 dark:text-slate-100">{client.name}</span>
                                                {client.isBlocked && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                        חסום
                                                    </span>
                                                )}
                                                {client.tags?.length > 0 && (
                                                    <div className="flex gap-1">
                                                        {client.tags.map(tag => {
                                                            const found = PREDEFINED_TAGS.find(t => t.label === tag);
                                                            return (
                                                                <span key={tag} className="text-xs" title={tag}>
                                                                    {found?.icon || '🏷️'}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600" dir="ltr">{client.phone}</td>
                                        <td className="px-6 py-4 text-slate-600">{client.email || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                {client.totalAppointments || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold text-green-600">
                                            ₪{client.totalSpend || 0}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('he-IL') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-1">
                                                <a
                                                    href={`https://wa.me/${client.phone.replace(/\D/g, '').replace(/^0/, '972')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-xl hover:bg-green-50 text-green-600 transition-colors"
                                                    title="WhatsApp"
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                    </svg>
                                                </a>
                                                <button
                                                    onClick={() => openHistoryModal(client._id)}
                                                    className="p-2 rounded-xl hover:bg-purple-50 text-purple-600 transition-colors"
                                                    title="היסטוריה"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(client)}
                                                    className="p-2 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors"
                                                    title="ערוך"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleToggleBlock(client)}
                                                    className={`p-2 rounded-xl transition-colors ${client.isBlocked ? 'hover:bg-green-50 text-green-600' : 'hover:bg-orange-50 text-orange-500'}`}
                                                    title={client.isBlocked ? 'שחרר חסימה' : 'חסום לקוח'}
                                                >
                                                    {client.isBlocked ? (
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client._id)}
                                                    className="p-2 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                                                    title="מחק"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white flex justify-between items-center shrink-0">
                            <h2 className="text-2xl font-bold">היסטוריית תורים - {selectedClientHistory.name}</h2>
                            <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-2xl">
                                    <div className="text-blue-600 text-sm font-semibold mb-1">סה״כ תורים</div>
                                    <div className="text-2xl font-bold text-slate-900">{selectedClientHistory.stats?.total || 0}</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-2xl">
                                    <div className="text-green-600 text-sm font-semibold mb-1">הושלמו</div>
                                    <div className="text-2xl font-bold text-slate-900">{selectedClientHistory.stats?.completed || 0}</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-2xl">
                                    <div className="text-purple-600 text-sm font-semibold mb-1">סה״כ הכנסות</div>
                                    <div className="text-2xl font-bold text-slate-900">₪{selectedClientHistory.stats?.totalSpend || 0}</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-2xl">
                                    <div className="text-red-600 text-sm font-semibold mb-1">ביטולים/לא הגיע</div>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {(selectedClientHistory.stats?.cancelled || 0) + (selectedClientHistory.stats?.noShow || 0)}
                                    </div>
                                </div>
                            </div>

                            {/* Appointments Table */}
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">תאריך</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">שירות</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">מחיר</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">סטטוס</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedClientHistory.appointments?.map((apt) => (
                                            <tr key={apt._id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-800">
                                                    {new Date(apt.date).toLocaleDateString('he-IL')} {apt.startTime}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-800">{apt.service}</td>
                                                <td className="px-4 py-3 text-sm text-slate-800">₪{apt.price}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                                        ${apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                                apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                    apt.status === 'no_show' ? 'bg-slate-100 text-slate-700' :
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
                                                <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                                                    אין היסטוריית תורים ללקוח זה
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium transition-all duration-200"
                            >
                                סגור
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full animate-scale-in">
                        {/* Handle bar */}
                        <div className="pt-3">
                            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto" />
                        </div>

                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
                                {modalMode === 'create' ? 'הוספת לקוח חדש' : 'עריכת פרטי לקוח'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 text-right">שם מלא *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 text-right">טלפון *</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 outline-none"
                                        dir="ltr"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 text-right">אימייל</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 outline-none"
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 text-right">הערות</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full bg-slate-100 border-0 rounded-2xl px-4 py-3 text-slate-900 text-right placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 outline-none resize-none"
                                    />
                                </div>
                                {/* Tags */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-right">תגיות</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PREDEFINED_TAGS.map(tag => (
                                            <button
                                                key={tag.label}
                                                type="button"
                                                onClick={() => toggleTag(tag.label)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
                                                    formData.tags.includes(tag.label)
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                            >
                                                <span>{tag.icon}</span>
                                                <span>{tag.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium transition-all duration-200"
                                    >
                                        ביטול
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200"
                                    >
                                        {modalMode === 'create' ? 'הוסף' : 'שמור'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
