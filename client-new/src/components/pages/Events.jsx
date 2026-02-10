import { useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/he';
import { formatHebrewDate } from '../../utils/hebrewDate';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../hooks/useAppointments';
import { appointmentTypesApi, clientsApi, reportsApi } from '../../services/api';
import SkeletonLoader from '../common/SkeletonLoader';

moment.locale('he');
const localizer = momentLocalizer(moment);

const messages = {
  allDay: 'כל היום', previous: 'קודם', next: 'הבא', today: 'היום',
  month: 'חודש', week: 'שבוע', day: 'יום', agenda: 'סדר יום',
  date: 'תאריך', time: 'שעה', event: 'אירוע',
  noEventsInRange: 'אין אירועים בטווח זה',
  showMore: (total) => `+ עוד ${total}`,
};

const Events = () => {
  const { user } = useAuth();
  const { appointments, isLoading: appointmentsLoading, createAppointment, updateAppointment, cancelAppointment } = useAppointments();
  const { data: appointmentTypesData, isLoading: typesLoading } = useQuery({
    queryKey: ['appointmentTypes'],
    queryFn: appointmentTypesApi.getAll
  });

  const showHebrewDate = user?.showHebrewDate || false;
  const [view, setView] = useState('calendar');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ customerPhone: '', date: '', startTime: '', description: '', duration: '', price: '' });
  const [clientNotes, setClientNotes] = useState('');

  const appointmentTypes = appointmentTypesData || [];
  const loading = appointmentsLoading || typesLoading;

  const handlePhoneBlur = async () => {
    if (formData.customerPhone?.length >= 9) {
      try {
        const clients = await clientsApi.search(formData.customerPhone);
        const client = clients.find(c => c.phone.replace(/\D/g, '').includes(formData.customerPhone.replace(/\D/g, '')));
        if (client) {
          if (client.notes) {
            setClientNotes(client.notes);
            toast.info(`נמצאו הערות ללקוח: ${client.notes}`);
          }
          if (!formData.customerName) {
            setFormData(prev => ({ ...prev, customerName: client.name }));
          }
          if (!formData.customerEmail && client.email) {
            setFormData(prev => ({ ...prev, customerEmail: client.email }));
          }
        } else setClientNotes('');
      } catch (e) { console.error('Error searching client:', e); }
    }
  };

  const handleExportAppointments = async () => {
    try {
      const response = await reportsApi.exportAppointments();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([response.data]));
      link.setAttribute('download', `appointments_${moment().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) { toast.error('שגיאה ביצוא תורים'); }
  };

  const formats = useMemo(() => ({
    dateFormat: showHebrewDate ? (date) => `${date.getDate()} (${formatHebrewDate(date)})` : 'DD',
    dayFormat: showHebrewDate ? (date) => `${['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'][date.getDay()]} ${date.getDate()} (${formatHebrewDate(date)})` : 'ddd DD',
    monthHeaderFormat: showHebrewDate ? (date) => `${moment(date).format('MMMM YYYY')} - ${formatHebrewDate(date)}` : 'MMMM YYYY',
  }), [showHebrewDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'appointmentTypeId') {
        const type = appointmentTypes.find(t => t._id === value);
        if (type) { newData.duration = type.duration; newData.price = type.price; }
      }
      return newData;
    });
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!formData.appointmentTypeId || !formData.customerName || !formData.customerPhone || !formData.date || !formData.startTime) {
      toast.error('יש למלא את כל השדות החובה'); return;
    }
    const type = appointmentTypes.find(t => t._id === formData.appointmentTypeId);
    const [h, m] = formData.startTime.split(':');
    const start = new Date(formData.date); start.setHours(+h, +m);
    const duration = +formData.duration || type.duration;
    const end = new Date(start.getTime() + duration * 60000);
    createAppointment({ ...formData, endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`, duration, service: type.name, price: formData.price !== '' ? +formData.price : type.price, status: 'confirmed' });
    setShowAddModal(false); resetForm();
  };

  const handleBlockTime = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.startTime) { toast.error('תאריך ושעה הם שדות חובה'); return; }
    createAppointment({ date: formData.date, startTime: formData.startTime, duration: +(formData.duration || 60), status: 'blocked', customerName: 'זמן חסום', customerPhone: '0000000000', service: formData.description || 'חסימה יזומה', description: formData.description });
    setShowBlockModal(false); resetForm();
  };

  const handleCancelAppointment = (id) => { if (window.confirm('האם אתה בטוח שברצונך לבטל תור זה?')) { cancelAppointment(id); setShowDetailModal(false); } };
  const handleUpdateStatus = (id, status) => { updateAppointment({ id, data: { status } }); setShowDetailModal(false); };
  const resetForm = () => { setFormData({ appointmentTypeId: '', customerName: '', customerEmail: '', customerPhone: '', date: '', startTime: '', description: '', duration: '', price: '' }); setClientNotes(''); };

  const calendarEvents = (appointments || []).filter(apt => (filterStatus === 'all' || apt.status === filterStatus) && (filterType === 'all' || apt.appointmentTypeId === filterType))
    .map(apt => { const type = appointmentTypes.find(t => t._id === apt.appointmentTypeId); const [h, m] = apt.startTime.split(':'); const start = new Date(apt.date); start.setHours(+h, +m); return { ...apt, title: `${apt.customerName} - ${apt.service}`, start, end: new Date(start.getTime() + (apt.duration || 60) * 60000), resource: apt, style: { backgroundColor: type?.color || '#3b82f6' } }; });

  const filteredAppointments = (appointments || []).filter(apt => (filterStatus === 'all' || apt.status === filterStatus) && (filterType === 'all' || apt.appointmentTypeId === filterType) && (apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || apt.customerPhone.includes(searchQuery) || apt.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())));

  const getStatusBadge = (s) => ({ pending: { text: 'ממתין', color: 'bg-yellow-100 text-yellow-700' }, confirmed: { text: 'מאושר', color: 'bg-green-100 text-green-700' }, cancelled: { text: 'בוטל', color: 'bg-red-100 text-red-700' }, completed: { text: 'הושלם', color: 'bg-blue-100 text-blue-700' }, no_show: { text: 'לא הגיע', color: 'bg-slate-100 text-slate-700' } }[s] || { text: 'ממתין', color: 'bg-yellow-100 text-yellow-700' });

  if (loading) return <div className="p-6 max-w-7xl mx-auto"><div className="mb-8"><h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">יומן תורים</h1><p className="text-slate-500">טוען...</p></div><SkeletonLoader type="calendar" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div><h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">יומן תורים</h1><p className="text-slate-500">צפה ונהל את כל התורים שלך</p></div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportAppointments} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-full font-semibold shadow-lg shadow-green-500/30 transition-all duration-200 active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>יצא נתונים
          </button>
          <button onClick={() => setView(view === 'calendar' ? 'list' : 'calendar')} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-full font-medium transition-all duration-200 active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{view === 'calendar' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}</svg>{view === 'calendar' ? 'תצוגת רשימה' : 'תצוגת לוח'}
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>הוסף תור
          </button>
          <button onClick={() => setShowBlockModal(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-full font-semibold transition-all duration-200 active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>חסום זמן
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {view === 'list' && <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">חיפוש</label><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="חפש לפי שם, טלפון או אימייל..." className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" /></div>}
          <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">סינון לפי סטטוס</label><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none"><option value="all">כל הסטטוסים</option><option value="pending">ממתין</option><option value="confirmed">מאושר</option><option value="completed">הושלם</option><option value="cancelled">בוטל</option><option value="no_show">לא הגיע</option></select></div>
          <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">סינון לפי סוג תור</label><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none"><option value="all">כל הסוגים</option>{appointmentTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select></div>
        </div>
      </div>

      {/* Calendar/List View */}
      {view === 'calendar' ? (
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-sm" style={{ minHeight: '700px' }}>
          {showHebrewDate && <div className="mb-4 p-3 bg-blue-50 rounded-2xl text-center"><span className="text-lg font-semibold text-blue-600">תאריך עברי: {formatHebrewDate(calendarDate)}</span></div>}
          <Calendar localizer={localizer} events={calendarEvents} startAccessor="start" endAccessor="end" style={{ height: showHebrewDate ? 'calc(100% - 60px)' : '100%', minHeight: '600px' }} messages={messages} onSelectEvent={(e) => { setSelectedAppointment(e.resource); setShowDetailModal(true); }} onNavigate={setCalendarDate} date={calendarDate} rtl={true} formats={formats} eventPropGetter={(e) => ({ style: e.style })} />
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center"><div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div><h3 className="text-xl font-bold text-slate-900 mb-2">אין תורים</h3><p className="text-slate-500">נסה לשנות את הפילטרים או להוסיף תור חדש</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-100"><tr><th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">תאריך</th><th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">שעה</th><th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">לקוח</th><th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">טלפון</th><th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">שירות</th><th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">סטטוס</th><th className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">פעולות</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.sort((a, b) => new Date(b.date) - new Date(a.date)).map(apt => {
                    const badge = getStatusBadge(apt.status);
                    return <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors"><td className="px-6 py-4 text-slate-900">{moment(apt.date).format('DD/MM/YYYY')}</td><td className="px-6 py-4 text-slate-900">{apt.startTime}</td><td className="px-6 py-4 font-semibold text-slate-900">{apt.customerName}</td><td className="px-6 py-4 text-slate-600" dir="ltr">{apt.customerPhone}</td><td className="px-6 py-4 text-slate-900">{apt.service}</td><td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.color}`}>{badge.text}</span></td><td className="px-6 py-4"><button onClick={() => { setSelectedAppointment(apt); setShowDetailModal(true); }} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium">צפה</button></td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white"><h2 className="text-2xl font-bold">פרטי תור</h2></div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-right"><label className="text-slate-500 text-sm font-medium">שם לקוח</label><p className="text-slate-900 text-lg font-bold">{selectedAppointment.customerName}</p></div>
                <div className="text-right"><label className="text-slate-500 text-sm font-medium">טלפון</label><p className="text-slate-900 text-lg" dir="ltr">{selectedAppointment.customerPhone}</p></div>
                <div className="text-right"><label className="text-slate-500 text-sm font-medium">שירות</label><p className="text-slate-900 text-lg font-bold">{selectedAppointment.service}</p></div>
                <div className="text-right"><label className="text-slate-500 text-sm font-medium">תאריך</label><p className="text-slate-900 text-lg">{moment(selectedAppointment.date).format('DD/MM/YYYY')}</p></div>
                <div className="text-right"><label className="text-slate-500 text-sm font-medium">שעה</label><p className="text-slate-900 text-lg">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p></div>
                <div className="text-right"><label className="text-slate-500 text-sm font-medium">סטטוס</label><p><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedAppointment.status).color}`}>{getStatusBadge(selectedAppointment.status).text}</span></p></div>
              </div>
              <div className="flex gap-3 mb-6">
                <a href={`https://wa.me/${selectedAppointment.customerPhone?.replace(/\D/g, '').replace(/^0/, '972')}?text=${encodeURIComponent(`שלום ${selectedAppointment.customerName}, `)}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-full transition-colors">WhatsApp</a>
                <a href={`tel:${selectedAppointment.customerPhone}`} className="flex-1 text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-3 rounded-full transition-colors">התקשר</a>
              </div>
              <div className="pt-6 border-t border-slate-100">
                {selectedAppointment.status === 'pending' && <div className="flex gap-3 mb-4"><button onClick={() => handleUpdateStatus(selectedAppointment._id, 'confirmed')} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-full">אשר</button><button onClick={() => handleCancelAppointment(selectedAppointment._id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-full">דחה</button></div>}
                {selectedAppointment.status === 'confirmed' && <div className="space-y-3 mb-4"><div className="flex gap-3"><button onClick={() => handleUpdateStatus(selectedAppointment._id, 'completed')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-full">הושלם</button><button onClick={() => handleUpdateStatus(selectedAppointment._id, 'no_show')} className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-semibold py-3 rounded-full">לא הגיע</button></div><button onClick={() => handleCancelAppointment(selectedAppointment._id)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-full">בטל תור</button></div>}
                {['completed', 'no_show', 'cancelled'].includes(selectedAppointment.status) && <div className="mb-4 p-4 bg-slate-50 rounded-2xl text-right text-sm text-slate-600">{selectedAppointment.status === 'completed' ? 'תור זה הושלם בהצלחה' : selectedAppointment.status === 'no_show' ? 'הלקוח לא הגיע' : 'תור זה בוטל'}</div>}
              </div>
              <button onClick={() => setShowDetailModal(false)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-full transition-colors">סגור</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white"><h2 className="text-2xl font-bold">הוספת תור חדש</h2></div>
            <form onSubmit={handleAddAppointment} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">סוג תור *</label><select name="appointmentTypeId" value={formData.appointmentTypeId || ''} onChange={handleInputChange} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none" required><option value="">בחר סוג תור</option>{appointmentTypes.filter(t => t.isActive).map(t => <option key={t._id} value={t._id}>{t.name} ({t.duration} דקות)</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">משך (דקות)</label><input type="number" name="duration" value={formData.duration || ''} onChange={handleInputChange} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none" /></div><div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">מחיר (₪)</label><input type="number" name="price" value={formData.price || ''} onChange={handleInputChange} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none" /></div></div>
                <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">שם לקוח *</label><input type="text" name="customerName" value={formData.customerName || ''} onChange={handleInputChange} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none" required /></div>
                <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">טלפון *</label><input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} onBlur={handlePhoneBlur} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none" dir="ltr" required />{clientNotes && <div className="mt-2 text-sm text-yellow-800 bg-yellow-50 p-3 rounded-xl border border-yellow-200"><strong>הערות:</strong> {clientNotes}</div>}</div>
                <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">תאריך *</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} min={new Date().toISOString().split('T')[0]} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none" required /></div>
                <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">שעה *</label><input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none" required /></div>
              </div>
              <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100"><button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-full shadow-lg shadow-blue-500/30 transition-all">הוסף תור</button><button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-full transition-all">ביטול</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white"><h2 className="text-2xl font-bold">חסימת זמן ביומן</h2></div>
            <form onSubmit={handleBlockTime} className="p-6">
              <div className="space-y-4">
                <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">תאריך *</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} min={new Date().toISOString().split('T')[0]} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none" required /></div>
                <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">שעה *</label><input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none" required /></div>
                <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">משך (דקות)</label><input type="number" name="duration" value={formData.duration || 60} onChange={handleInputChange} min="15" step="15" className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none" /></div>
                <div className="space-y-2"><label className="block text-sm font-semibold text-slate-700 text-right">סיבה</label><input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="הפסקה, חופשה..." className="w-full h-12 bg-slate-100 border-0 rounded-2xl px-4 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none" /></div>
              </div>
              <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100"><button type="submit" className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-full transition-all">חסום זמן</button><button type="button" onClick={() => { setShowBlockModal(false); resetForm(); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-full transition-all">ביטול</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
