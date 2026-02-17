import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import api, { reportsApi, clientsApi } from '../../services/api';

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
    const [importing, setImporting] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);
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
            try {
                await api.post('/clients/sync');
            } catch (syncErr) {
                console.warn('Client sync skipped:', syncErr.message);
            }
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

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error('יש לבחור קובץ CSV בלבד');
            return;
        }

        try {
            setImporting(true);
            setImportResult(null);
            const result = await clientsApi.importCSV(file);
            setImportResult(result);
            if (result.created > 0) {
                toast.success(`יובאו ${result.created} לקוחות חדשים!`);
            } else {
                toast.info('כל הלקוחות כבר קיימים במערכת');
            }
            fetchClients();
        } catch (error) {
            console.error('Error importing clients:', error);
            toast.error(error.response?.data?.message || 'שגיאה בייבוא לקוחות');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">ניהול לקוחות</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{clients.length} לקוחות במאגר</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* Import */}
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-violet-600/20 transition-all active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span className="hidden sm:inline">ייבוא</span>
                        </button>
                        {/* Export */}
                        <button
                            onClick={handleExportClients}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span className="hidden sm:inline">יצוא</span>
                        </button>
                        {/* Sync */}
                        <button
                            onClick={handleSyncClients}
                            disabled={syncing}
                            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                        >
                            <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            <span className="hidden sm:inline">{syncing ? 'מסנכרן...' : 'סנכרן'}</span>
                        </button>
                        {/* Add */}
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            לקוח חדש
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 p-3 mb-5 shadow-sm">
                    <div className="relative">
                        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="חפש לפי שם, טלפון או אימייל..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 bg-slate-50 dark:bg-slate-700/50 border-0 rounded-xl pr-12 pl-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-right"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">טוען לקוחות...</p>
                        </div>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 p-12 text-center shadow-sm">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                            <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">לא נמצאו לקוחות</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xs mx-auto">הוסף לקוח חדש, ייבא מקובץ CSV או סנכרן מהיומן</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                                הוסף לקוח
                            </button>
                            <button onClick={() => setShowImportModal(true)} className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-2xl shadow-lg shadow-violet-600/20 transition-all active:scale-95">
                                ייבא מקובץ
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mobile: Cards */}
                        <div className="md:hidden space-y-3">
                            {filteredClients.map(client => (
                                <div key={client._id} className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm overflow-hidden transition-all ${client.isBlocked ? 'opacity-60' : ''}`}>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{client.name}</h3>
                                                    {client.isBlocked && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/20 text-red-600">חסום</span>
                                                    )}
                                                    {client.tags?.map(tag => {
                                                        const found = PREDEFINED_TAGS.find(t => t.label === tag);
                                                        return <span key={tag} className="text-xs" title={tag}>{found?.icon || ''}</span>;
                                                    })}
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5" dir="ltr">{client.phone}</p>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button onClick={() => openEditModal(client)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => openHistoryModal(client._id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg font-semibold">{client.totalAppointments || 0} תורים</span>
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">₪{client.totalSpend || 0}</span>
                                            {client.lastVisit && <span>{new Date(client.lastVisit).toLocaleDateString('he-IL')}</span>}
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <a href={`https://wa.me/${client.phone.replace(/\D/g, '').replace(/^0/, '972')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95">
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                                                WhatsApp
                                            </a>
                                            <a href={`tel:${client.phone}`} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                התקשר
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: Table */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-700/50">
                                            <th className="px-6 py-4 text-right font-semibold text-[11px] text-slate-400 uppercase tracking-wider">שם</th>
                                            <th className="px-6 py-4 text-right font-semibold text-[11px] text-slate-400 uppercase tracking-wider">טלפון</th>
                                            <th className="px-6 py-4 text-right font-semibold text-[11px] text-slate-400 uppercase tracking-wider">אימייל</th>
                                            <th className="px-4 py-4 text-center font-semibold text-[11px] text-slate-400 uppercase tracking-wider">תורים</th>
                                            <th className="px-4 py-4 text-center font-semibold text-[11px] text-slate-400 uppercase tracking-wider">הכנסות</th>
                                            <th className="px-6 py-4 text-right font-semibold text-[11px] text-slate-400 uppercase tracking-wider">ביקור אחרון</th>
                                            <th className="px-4 py-4 text-center font-semibold text-[11px] text-slate-400 uppercase tracking-wider">פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                                        {filteredClients.map(client => (
                                            <tr key={client._id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors ${client.isBlocked ? 'opacity-50' : ''}`}>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900 dark:text-white">{client.name}</span>
                                                        {client.isBlocked && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">חסום</span>
                                                        )}
                                                        {client.tags?.length > 0 && (
                                                            <div className="flex gap-0.5">
                                                                {client.tags.map(tag => {
                                                                    const found = PREDEFINED_TAGS.find(t => t.label === tag);
                                                                    return <span key={tag} className="text-xs" title={tag}>{found?.icon || ''}</span>;
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-slate-400" dir="ltr">{client.phone}</td>
                                                <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-slate-400">{client.email || '-'}</td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                        {client.totalAppointments || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                    ₪{client.totalSpend || 0}
                                                </td>
                                                <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                                                    {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('he-IL') : '-'}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex justify-center gap-1">
                                                        <a
                                                            href={`https://wa.me/${client.phone.replace(/\D/g, '').replace(/^0/, '972')}`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 transition-colors"
                                                            title="WhatsApp"
                                                        >
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                                                        </a>
                                                        <button onClick={() => openHistoryModal(client._id)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors" title="היסטוריה">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </button>
                                                        <button onClick={() => openEditModal(client)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors" title="ערוך">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        <button onClick={() => handleToggleBlock(client)} className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${client.isBlocked ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-amber-50 text-amber-500'}`} title={client.isBlocked ? 'שחרר' : 'חסום'}>
                                                            {client.isBlocked ? (
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                            )}
                                                        </button>
                                                        <button onClick={() => handleDelete(client._id)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="מחק">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => { setShowImportModal(false); setImportResult(null); }}>
                        <div
                            className="bg-white dark:bg-slate-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            style={{ animation: 'modalSlideUp 0.35s cubic-bezier(0.32,0.72,0,1)' }}
                        >
                            {/* Handle (mobile) */}
                            <div className="sm:hidden flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
                            </div>

                            <div className="px-6 pt-4 sm:pt-6 pb-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">ייבוא לקוחות</h2>
                                    <button onClick={() => { setShowImportModal(false); setImportResult(null); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {/* Instructions */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">פורמט הקובץ</p>
                                            <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed">קובץ CSV עם עמודות: <strong>שם</strong>, <strong>טלפון</strong> (חובה), אימייל, הערות</p>
                                            <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">לקוחות קיימים (לפי טלפון) יעודכנו אוטומטית</p>
                                        </div>
                                    </div>
                                </div>

                                {/* File Upload Area */}
                                <label className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${importing ? 'border-violet-300 bg-violet-50/50' : 'border-slate-200 dark:border-slate-600 hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/10'}`}>
                                    {importing ? (
                                        <div>
                                            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                                            <p className="text-sm font-semibold text-violet-700 dark:text-violet-400">מייבא לקוחות...</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="w-14 h-14 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">לחץ לבחירת קובץ CSV</p>
                                            <p className="text-xs text-slate-400">או גרור ושחרר כאן</p>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={handleImportCSV}
                                        disabled={importing}
                                    />
                                </label>

                                {/* Import Result */}
                                {importResult && (
                                    <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">ייבוא הושלם!</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-white dark:bg-slate-700/50 rounded-xl py-2">
                                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{importResult.created}</p>
                                                <p className="text-[10px] text-slate-500">נוספו</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-700/50 rounded-xl py-2">
                                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{importResult.updated}</p>
                                                <p className="text-[10px] text-slate-500">עודכנו</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-700/50 rounded-xl py-2">
                                                <p className="text-lg font-bold text-slate-500">{importResult.skipped}</p>
                                                <p className="text-[10px] text-slate-500">דולגו</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Sync from calendar option */}
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                    <button
                                        onClick={() => { handleSyncClients(); setShowImportModal(false); }}
                                        className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-2xl text-sm transition-all active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        סנכרן לקוחות מהיומן במקום
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Modal */}
                {showHistoryModal && selectedClientHistory && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4" onClick={() => setShowHistoryModal(false)}>
                        <div
                            className="bg-white dark:bg-slate-800 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                            style={{ animation: 'modalSlideUp 0.35s cubic-bezier(0.32,0.72,0,1)' }}
                        >
                            {/* Handle (mobile) */}
                            <div className="md:hidden flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="px-6 pt-4 md:pt-6 pb-4 flex justify-between items-center flex-shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedClientHistory.name}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">היסטוריית תורים</p>
                                </div>
                                <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="px-6 pb-6 overflow-y-auto flex-1">
                                {/* Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-center">
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedClientHistory.stats?.total || 0}</p>
                                        <p className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold mt-0.5">סה״כ תורים</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl text-center">
                                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedClientHistory.stats?.completed || 0}</p>
                                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">הושלמו</p>
                                    </div>
                                    <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-2xl text-center">
                                        <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">₪{selectedClientHistory.stats?.totalSpend || 0}</p>
                                        <p className="text-[11px] text-violet-700 dark:text-violet-300 font-semibold mt-0.5">הכנסות</p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl text-center">
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{(selectedClientHistory.stats?.cancelled || 0) + (selectedClientHistory.stats?.noShow || 0)}</p>
                                        <p className="text-[11px] text-red-700 dark:text-red-300 font-semibold mt-0.5">ביטולים</p>
                                    </div>
                                </div>

                                {/* Top Services + Average */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                                    {selectedClientHistory.topServices?.length > 0 && (
                                        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-4">
                                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-right">שירותים מובילים</h4>
                                            <div className="space-y-2.5">
                                                {selectedClientHistory.topServices.map((svc) => (
                                                    <div key={svc.name} className="flex items-center justify-between gap-3">
                                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{svc.name}</span>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <div className="w-20 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                                                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(svc.count / selectedClientHistory.topServices[0].count) * 100}%` }} />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-500 w-5 text-left">{svc.count}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-4 flex flex-col justify-center gap-4">
                                        <div className="text-center">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">ממוצע ימים בין ביקורים</p>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                                {selectedClientHistory.averageInterval ? selectedClientHistory.averageInterval : '-'}
                                                {selectedClientHistory.averageInterval && <span className="text-sm text-slate-400 mr-1">ימים</span>}
                                            </p>
                                        </div>
                                        <div className="border-t border-slate-200 dark:border-slate-600/50 pt-4 text-center">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">ערך חיים כולל</p>
                                            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">₪{selectedClientHistory.stats?.totalSpend || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Appointments List */}
                                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl overflow-hidden">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-4 pt-4 pb-2 text-right">היסטוריית תורים</h4>
                                    <div className="divide-y divide-slate-200/60 dark:divide-slate-600/30">
                                        {selectedClientHistory.appointments?.map((apt) => (
                                            <div key={apt._id} className="flex items-center gap-3 px-4 py-3">
                                                <div className="w-10 text-center flex-shrink-0">
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{new Date(apt.date).getDate()}</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(apt.date).toLocaleDateString('he-IL', { month: 'short' })}</p>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{apt.service}</p>
                                                    <p className="text-xs text-slate-400">{apt.startTime}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {apt.price > 0 && <span className="text-sm font-bold text-slate-700 dark:text-slate-300">₪{apt.price}</span>}
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        apt.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                                                        apt.status === 'confirmed' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                                                        apt.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                                                        apt.status === 'no_show' ? 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-400' :
                                                        'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                                    }`}>
                                                        {apt.status === 'completed' ? 'הושלם' :
                                                         apt.status === 'confirmed' ? 'מאושר' :
                                                         apt.status === 'cancelled' ? 'בוטל' :
                                                         apt.status === 'no_show' ? 'לא הגיע' : 'ממתין'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {(!selectedClientHistory.appointments || selectedClientHistory.appointments.length === 0) && (
                                            <div className="px-4 py-8 text-center text-slate-400 text-sm">אין היסטוריית תורים</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setShowModal(false)}>
                        <div
                            className="bg-white dark:bg-slate-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            style={{ animation: 'modalSlideUp 0.35s cubic-bezier(0.32,0.72,0,1)' }}
                        >
                            {/* Handle (mobile) */}
                            <div className="sm:hidden flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
                            </div>

                            <div className="px-6 pt-4 sm:pt-6 pb-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {modalMode === 'create' ? 'לקוח חדש' : 'עריכת לקוח'}
                                    </h2>
                                    <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl overflow-hidden">
                                        <div className="px-4 pt-3 pb-1">
                                            <label className="block text-[11px] font-semibold text-slate-400 text-right mb-0.5">שם מלא *</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-right text-base font-medium placeholder:text-slate-300 focus:ring-0 focus:outline-none p-0" placeholder="שם הלקוח" required />
                                        </div>
                                        <div className="mx-4 border-t border-slate-200/60 dark:border-slate-600/40" />
                                        <div className="px-4 py-3">
                                            <label className="block text-[11px] font-semibold text-slate-400 text-right mb-0.5">טלפון *</label>
                                            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-base font-medium placeholder:text-slate-300 focus:ring-0 focus:outline-none p-0" dir="ltr" placeholder="050-0000000" required />
                                        </div>
                                        <div className="mx-4 border-t border-slate-200/60 dark:border-slate-600/40" />
                                        <div className="px-4 py-3">
                                            <label className="block text-[11px] font-semibold text-slate-400 text-right mb-0.5">אימייל</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-sm placeholder:text-slate-300 focus:ring-0 focus:outline-none p-0" dir="ltr" placeholder="email@example.com" />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl px-4 py-3">
                                        <label className="block text-[11px] font-semibold text-slate-400 text-right mb-1">הערות</label>
                                        <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-right text-sm placeholder:text-slate-300 focus:ring-0 focus:outline-none p-0 resize-none" placeholder="הערות חופשיות..." />
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-400 text-right mb-2">תגיות</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PREDEFINED_TAGS.map(tag => (
                                                <button
                                                    key={tag.label}
                                                    type="button"
                                                    onClick={() => toggleTag(tag.label)}
                                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
                                                        formData.tags.includes(tag.label)
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                            : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <span>{tag.icon}</span>
                                                    <span>{tag.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2" style={{ direction: 'ltr' }}>
                                        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] text-base">
                                            {modalMode === 'create' ? 'הוסף לקוח' : 'שמור שינויים'}
                                        </button>
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-3.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-base">
                                            ביטול
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    @keyframes modalSlideUp {
                        from { transform: translateY(100%); opacity: 0.8; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @media (min-width: 640px) {
                        @keyframes modalSlideUp {
                            from { transform: scale(0.92) translateY(20px); opacity: 0; }
                            to { transform: scale(1) translateY(0); opacity: 1; }
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default Clients;
