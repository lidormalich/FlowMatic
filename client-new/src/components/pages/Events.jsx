import { useState, useMemo, useCallback, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/he';
import { formatHebrewDate } from '../../utils/hebrewDate';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../hooks/useAppointments';
import { appointmentTypesApi, appointmentsApi, clientsApi, staffApi, reportsApi } from '../../services/api';
import { fetchHebcalData, getCachedMonth, setCachedMonth } from '../../services/hebcal';
import SkeletonLoader from '../common/SkeletonLoader';

const TAG_ICONS = {
  'VIP': '👑',
  'מאחר כרוני': '⏰',
  'חייב כסף': '💰',
  'חדש': '⭐',
  'קבוע': '💙',
};

moment.locale('he');

const DAY_HEADERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const Events = () => {
  const { user } = useAuth();
  const { appointments, isLoading: appointmentsLoading, createAppointment, updateAppointment, cancelAppointment, blockRange } = useAppointments();
  const { data: appointmentTypesData, isLoading: typesLoading } = useQuery({
    queryKey: ['appointmentTypes'],
    queryFn: appointmentTypesApi.getAll
  });
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll
  });
  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: staffApi.getAll
  });

  const clientTagsMap = useMemo(() => {
    const map = {};
    (clientsData || []).forEach(c => {
      if (c.tags?.length > 0) {
        map[c.phone?.replace(/\D/g, '')] = c.tags;
      }
    });
    return map;
  }, [clientsData]);

  const showHebrewDate = user?.showHebrewDate || false;
  const hebrewCalSettings = user?.hebrewCalendar || { showHolidays: true, showShabbat: true, showEvents: true };
  const [view, setView] = useState(() => localStorage.getItem('calendarViewMode') || 'calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockMode, setBlockMode] = useState('hours'); // 'hours' | 'dates'
  const [blockEndDate, setBlockEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ customerPhone: '', date: '', startTime: '', description: '', duration: '', price: '', staffId: '' });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurFrequency, setRecurFrequency] = useState('weekly');
  const [recurEndDate, setRecurEndDate] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [detailClientNotes, setDetailClientNotes] = useState('');
  const [detailClientId, setDetailClientId] = useState(null);
  const [editingNote, setEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  // Hebcal data
  const [hebcalEvents, setHebcalEvents] = useState({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const appointmentTypes = appointmentTypesData || [];
  const staffList = staffData || [];
  const loading = appointmentsLoading || typesLoading;

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('calendarViewMode', view);
  }, [view]);

  // Fetch Hebcal data
  useEffect(() => {
    const loadHebcal = async () => {
      try {
        const cacheKey = `${year}-${month}`;
        let data = getCachedMonth(cacheKey);
        if (!data) {
          data = await fetchHebcalData(year, month);
          setCachedMonth(cacheKey, data);
        }
        // Group by date, respecting user toggle settings
        const grouped = {};
        data.forEach(event => {
          const dateKey = event.date.split('T')[0];
          if (!grouped[dateKey]) grouped[dateKey] = { holidays: [], shabbat: null, parasha: null };
          if (event.category === 'holiday' && (hebrewCalSettings.showHolidays || hebrewCalSettings.showEvents)) {
            grouped[dateKey].holidays.push({ text: event.hebrew, category: event.category });
          } else if (event.category === 'parashat' && hebrewCalSettings.showShabbat) {
            grouped[dateKey].parasha = { text: event.hebrew, category: event.category };
          } else if ((event.category === 'candles' || event.category === 'havdalah') && hebrewCalSettings.showShabbat) {
            grouped[dateKey].shabbat = { text: event.hebrew, time: event.time };
          }
        });
        setHebcalEvents(grouped);
      } catch (err) {
        console.error('Failed to load Hebcal data:', err);
      }
    };
    loadHebcal();
  }, [year, month, hebrewCalSettings.showHolidays, hebrewCalSettings.showShabbat, hebrewCalSettings.showEvents]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isPadding: true });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isPadding: false });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isPadding: true });
    }

    return days;
  }, [year, month]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped = {};
    (appointments || []).forEach(apt => {
      if ((filterStatus !== 'all' && apt.status !== filterStatus) ||
          (filterType !== 'all' && apt.appointmentTypeId !== filterType) ||
          (filterStaff !== 'all' && apt.staffId !== filterStaff)) return;
      const dateKey = moment(apt.date).format('YYYY-MM-DD');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(apt);
    });
    return grouped;
  }, [appointments, filterStatus, filterType, filterStaff]);

  const monthName = new Date(year, month).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setSelectedDate(null);
    setSelectedDayData(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setSelectedDate(null);
    setSelectedDayData(null);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
    setSelectedDayData(null);
  };

  const handleDayClick = (dateKey) => {
    const dayAppointments = appointmentsByDate[dateKey] || [];
    const dayHebcal = hebcalEvents[dateKey] || { holidays: [], shabbat: null, parasha: null };
    setSelectedDate(dateKey);
    setSelectedDayData({
      date: dateKey,
      appointments: dayAppointments,
      ...dayHebcal,
    });
  };

  const toggleView = () => {
    setView(prev => prev === 'calendar' ? 'list' : 'calendar');
  };

  // --- Existing logic (kept intact) ---
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
          if (!formData.customerName) setFormData(prev => ({ ...prev, customerName: client.name }));
          if (!formData.customerEmail && client.email) setFormData(prev => ({ ...prev, customerEmail: client.email }));
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
    const duration = +formData.duration || type.duration;
    const price = formData.price !== '' ? +formData.price : type.price;

    if (isRecurring) {
      if (!recurEndDate) { toast.error('נא לבחור תאריך סיום לתורים חוזרים'); return; }
      try {
        const result = await appointmentsApi.createRecurring({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || '',
          date: formData.date,
          startTime: formData.startTime,
          duration,
          service: type.name,
          price,
          frequency: recurFrequency,
          endDate: recurEndDate,
          description: formData.description || ''
        });
        toast.success(`נוצרו ${result.count} תורים חוזרים!`);
      } catch (err) {
        toast.error(err.response?.data?.message || 'שגיאה ביצירת תורים חוזרים');
      }
    } else {
      const [h, m] = formData.startTime.split(':');
      const start = new Date(formData.date); start.setHours(+h, +m);
      const end = new Date(start.getTime() + duration * 60000);
      createAppointment({ ...formData, staffId: formData.staffId || null, endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`, duration, service: type.name, price, status: 'confirmed' });
    }
    setShowAddModal(false); resetForm();
  };

  const handleBlockTime = async (e) => {
    e.preventDefault();
    if (blockMode === 'dates') {
      if (!formData.date || !blockEndDate) { toast.error('תאריך התחלה וסיום הם שדות חובה'); return; }
      blockRange({ startDate: formData.date, endDate: blockEndDate, description: formData.description, staffId: formData.staffId || null });
    } else {
      if (!formData.date || !formData.startTime) { toast.error('תאריך ושעה הם שדות חובה'); return; }
      createAppointment({ date: formData.date, startTime: formData.startTime, duration: +(formData.duration || 60), status: 'blocked', customerName: 'זמן חסום', customerPhone: '0000000000', service: formData.description || 'חסימה יזומה', description: formData.description });
    }
    setShowBlockModal(false); setBlockMode('hours'); setBlockEndDate(''); resetForm();
  };

  const handleCancelAppointment = (id) => { if (window.confirm('האם אתה בטוח שברצונך לבטל תור זה?')) { cancelAppointment(id); setShowDetailModal(false); } };

  const openDetailModal = async (apt) => {
    setSelectedAppointment(apt);
    setShowDetailModal(true);
    setDetailClientNotes('');
    setDetailClientId(null);
    setEditingNote(false);
    try {
      const clients = await clientsApi.search(apt.customerPhone);
      const client = clients.find(c => c.phone.replace(/\D/g, '').includes(apt.customerPhone.replace(/\D/g, '')));
      if (client) {
        setDetailClientNotes(client.notes || '');
        setDetailClientId(client._id);
        setNoteInput(client.notes || '');
      }
    } catch (e) { console.warn('Could not fetch client notes'); }
  };

  const handleSaveClientNote = async () => {
    if (!detailClientId) return;
    try {
      await clientsApi.update(detailClientId, { notes: noteInput });
      setDetailClientNotes(noteInput);
      setEditingNote(false);
      toast.success('הערה עודכנה בהצלחה');
    } catch (e) { toast.error('שגיאה בשמירת הערה'); }
  };

  const handleUpdateStatus = (id, status) => { updateAppointment({ id, data: { status } }); setShowDetailModal(false); };
  const resetForm = () => { setFormData({ appointmentTypeId: '', customerName: '', customerEmail: '', customerPhone: '', date: '', startTime: '', description: '', duration: '', price: '', staffId: '' }); setClientNotes(''); setIsRecurring(false); setRecurFrequency('weekly'); setRecurEndDate(''); };

  const getStatusBadge = (s) => ({ pending: { text: 'ממתין', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' }, confirmed: { text: 'מאושר', color: 'bg-green-100 text-green-700', dot: 'bg-green-400' }, cancelled: { text: 'בוטל', color: 'bg-red-100 text-red-700', dot: 'bg-red-400' }, completed: { text: 'הושלם', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' }, no_show: { text: 'לא הגיע', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' }, blocked: { text: 'חסום', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' } }[s] || { text: 'ממתין', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' });

  const filteredAppointments = (appointments || []).filter(apt => (filterStatus === 'all' || apt.status === filterStatus) && (filterType === 'all' || apt.appointmentTypeId === filterType) && (filterStaff === 'all' || apt.staffId === filterStaff) && (apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || apt.customerPhone.includes(searchQuery) || apt.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())));

  // List view: group by date
  const listViewDates = useMemo(() => {
    const grouped = {};
    filteredAppointments.forEach(apt => {
      const dateKey = moment(apt.date).format('YYYY-MM-DD');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(apt);
    });
    return Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b)).map(dateKey => ({
      dateKey,
      appointments: grouped[dateKey],
      hebcal: hebcalEvents[dateKey] || { holidays: [], shabbat: null, parasha: null },
    }));
  }, [filteredAppointments, hebcalEvents]);

  if (loading) return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">יומן תורים</h1>
        <p className="text-slate-500">טוען...</p>
      </div>
      <SkeletonLoader type="calendar" />
    </div>
  );

  const todayKey = moment().format('YYYY-MM-DD');

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-0.5">יומן תורים</h1>
          <p className="text-slate-500 text-sm">צפה ונהל את כל התורים שלך</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportAppointments} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 md:px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="hidden sm:inline">יצא נתונים</span>
          </button>
          <button onClick={() => setShowBlockModal(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 md:px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            <span className="hidden sm:inline">חסום זמן</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            הוסף תור
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-3 md:p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {/* Month Nav */}
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={handleNextMonth} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-lg transition-all active:scale-95">
              ›
            </button>
            <div className="text-center min-w-[120px] md:min-w-[160px]">
              <h2 className="text-base md:text-xl font-bold text-slate-900">{monthName}</h2>
              {showHebrewDate && (
                <p className="text-xs text-blue-600 font-medium">{formatHebrewDate(currentDate)}</p>
              )}
            </div>
            <button onClick={handlePrevMonth} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-lg transition-all active:scale-95">
              ‹
            </button>
          </div>

          {/* Today + View Toggle */}
          <div className="flex items-center gap-2">
            <button onClick={handleGoToToday} className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all active:scale-95">
              היום
            </button>
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => view !== 'calendar' && toggleView()}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="hidden sm:inline">לוח</span>
                <span className="sm:hidden">📅</span>
              </button>
              <button
                onClick={() => view !== 'list' && toggleView()}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="hidden sm:inline">רשימה</span>
                <span className="sm:hidden">📋</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-3 md:p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {view === 'list' && (
            <div className="col-span-2 md:col-span-1">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="חפש שם / טלפון..." className="w-full h-10 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 text-right placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" />
            </div>
          )}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 text-right focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none">
            <option value="all">כל הסטטוסים</option>
            <option value="pending">ממתין</option>
            <option value="confirmed">מאושר</option>
            <option value="completed">הושלם</option>
            <option value="cancelled">בוטל</option>
            <option value="no_show">לא הגיע</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 text-right focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none">
            <option value="all">כל הסוגים</option>
            {appointmentTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          {staffList.length > 0 && (
            <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} className="h-10 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 text-right focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none">
              <option value="all">כל העובדים</option>
              {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' ? (
        <>
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAY_HEADERS.map((day, i) => (
                <div key={day} className={`text-center py-2.5 md:py-3 text-xs md:text-sm font-semibold ${i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((item, index) => {
                if (item.isPadding) {
                  return (
                    <div key={`pad-${index}`} className="min-h-[60px] md:min-h-[100px] border-b border-r border-slate-50 bg-slate-50/30 p-1">
                      <span className="text-xs text-slate-300 font-medium">{item.day}</span>
                    </div>
                  );
                }

                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
                const dayAppointments = appointmentsByDate[dateKey] || [];
                const dayHebcal = hebcalEvents[dateKey] || { holidays: [], shabbat: null, parasha: null };
                const isToday = dateKey === todayKey;
                const isSelected = selectedDate === dateKey;
                const hasAppointments = dayAppointments.length > 0;
                const hasHoliday = dayHebcal.holidays.length > 0;
                const isSaturday = new Date(dateKey).getDay() === 6;

                return (
                  <div
                    key={`day-${item.day}`}
                    onClick={() => handleDayClick(dateKey)}
                    className={`
                      min-h-[60px] md:min-h-[100px] border-b border-r border-slate-100/80
                      p-1 md:p-1.5 cursor-pointer transition-all duration-200
                      hover:bg-blue-50/50
                      ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-400/50' : ''}
                      ${isToday ? 'bg-amber-50/50' : ''}
                      ${hasHoliday ? 'bg-orange-50/30' : ''}
                    `}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`
                        text-xs md:text-sm font-bold leading-none
                        ${isToday ? 'bg-blue-600 text-white w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center' : ''}
                        ${isSaturday && !isToday ? 'text-blue-500' : ''}
                        ${!isToday && !isSaturday ? 'text-slate-700' : ''}
                      `}>
                        {item.day}
                      </span>
                      {hasAppointments && (
                        <span className="bg-blue-500 text-white text-[9px] md:text-[10px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center leading-none">
                          {dayAppointments.length}
                        </span>
                      )}
                    </div>

                    {/* Hebrew Date */}
                    {showHebrewDate && (
                      <div className="text-[8px] md:text-[10px] text-slate-400 font-medium mb-0.5 truncate">
                        {formatHebrewDate(new Date(dateKey))}
                      </div>
                    )}

                    {/* Appointments (max 2 visible on desktop, 1 on mobile) */}
                    <div className="hidden md:block space-y-0.5">
                      {dayAppointments.slice(0, 2).map((apt, i) => {
                        const phoneClean = apt.customerPhone?.replace(/\D/g, '');
                        const clientTags = clientTagsMap[phoneClean] || [];
                        const tagIcons = clientTags.map(t => TAG_ICONS[t] || '').join('');
                        const staff = staffList.find(s => s._id === apt.staffId);
                        return (
                          <div
                            key={apt._id}
                            className="text-[10px] rounded px-1 py-0.5 truncate font-medium text-white leading-tight"
                            style={{ backgroundColor: staff?.color || '#3b82f6' }}
                            title={`${apt.customerName} - ${apt.startTime}`}
                          >
                            {apt.isRecurring && '🔄'}{tagIcons}{apt.startTime} {apt.customerName}
                          </div>
                        );
                      })}
                      {dayAppointments.length > 2 && (
                        <div className="text-[9px] text-blue-500 font-semibold">+ {dayAppointments.length - 2} נוספים</div>
                      )}
                    </div>

                    {/* Mobile: just dots */}
                    <div className="md:hidden flex gap-0.5 flex-wrap">
                      {dayAppointments.slice(0, 3).map((apt, i) => {
                        const staff = staffList.find(s => s._id === apt.staffId);
                        return (
                          <div key={apt._id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: staff?.color || '#3b82f6' }} />
                        );
                      })}
                    </div>

                    {/* Holiday / Parasha / Shabbat */}
                    {dayHebcal.parasha && (
                      <div className="text-[8px] md:text-[9px] text-purple-600 font-semibold truncate mt-0.5" title={dayHebcal.parasha.text}>
                        <span className="hidden md:inline">📖 </span>{dayHebcal.parasha.text}
                      </div>
                    )}
                    {dayHebcal.holidays.map((h, i) => (
                      <div key={i} className="text-[8px] md:text-[9px] text-orange-600 font-semibold truncate" title={h.text}>
                        {h.text}
                      </div>
                    ))}
                    {dayHebcal.shabbat && (
                      <div className="hidden md:block text-[8px] text-slate-400 truncate" title={dayHebcal.shabbat.text}>
                        🕯️ {dayHebcal.shabbat.time || dayHebcal.shabbat.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inline Day Details (Mobile) */}
          {selectedDayData && (
            <div className="md:hidden mt-4">
              <InlineDayDetails
                data={selectedDayData}
                staffList={staffList}
                appointmentTypes={appointmentTypes}
                clientTagsMap={clientTagsMap}
                getStatusBadge={getStatusBadge}
                showHebrewDate={showHebrewDate}
                onAppointmentClick={openDetailModal}
                onClose={() => { setSelectedDate(null); setSelectedDayData(null); }}
                onAddClick={() => {
                  setFormData(prev => ({ ...prev, date: selectedDayData.date }));
                  setShowAddModal(true);
                }}
              />
            </div>
          )}

          {/* Desktop Day Details Modal */}
          {selectedDayData && (
            <div className="hidden md:block">
              <DayDetailsModal
                data={selectedDayData}
                staffList={staffList}
                appointmentTypes={appointmentTypes}
                clientTagsMap={clientTagsMap}
                getStatusBadge={getStatusBadge}
                showHebrewDate={showHebrewDate}
                onAppointmentClick={openDetailModal}
                onClose={() => { setSelectedDate(null); setSelectedDayData(null); }}
                onAddClick={() => {
                  setFormData(prev => ({ ...prev, date: selectedDayData.date }));
                  setShowAddModal(true);
                }}
              />
            </div>
          )}
        </>
      ) : (
        /* List View */
        <div className="space-y-4">
          {listViewDates.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">אין תורים</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">נסה לשנות את הפילטרים או להוסיף תור חדש</p>
            </div>
          ) : (
            listViewDates.map(({ dateKey, appointments: dayApts, hebcal: dayHebcal }) => {
              const hasHebcal = dayHebcal.holidays.length > 0 || dayHebcal.shabbat || dayHebcal.parasha;
              const formattedDate = moment(dateKey).format('dddd, D בMMMM YYYY');
              const dayNum = new Date(dateKey).getDate();
              const isDateToday = dateKey === todayKey;

              return (
                <div key={dateKey} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm overflow-hidden transition-all hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50">
                  {/* Date Header */}
                  <div className="px-5 md:px-6 py-4 flex items-center gap-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${isDateToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white'}`}>
                      <span className="text-lg md:text-xl font-bold leading-none">{dayNum}</span>
                      <span className={`text-[10px] font-semibold ${isDateToday ? 'text-blue-100' : 'text-slate-400'}`}>{moment(dateKey).format('MMM')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base truncate">{formattedDate}</h3>
                        {isDateToday && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">היום</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {dayApts.length} תור{dayApts.length > 1 ? 'ים' : ''}
                        {showHebrewDate && <span className="text-blue-500 mr-2">{formatHebrewDate(new Date(dateKey))}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Hebrew Calendar Info */}
                  {hasHebcal && (
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 px-5 md:px-6 py-2.5 border-b border-amber-100/50 dark:border-amber-900/20 flex flex-wrap gap-x-4 gap-y-1">
                      {dayHebcal.parasha && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 font-semibold">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          {dayHebcal.parasha.text}
                        </span>
                      )}
                      {dayHebcal.holidays.map((holiday, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 text-xs text-orange-800 dark:text-orange-400 font-semibold">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                          {holiday.text}
                        </span>
                      ))}
                      {dayHebcal.shabbat && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
                          {dayHebcal.shabbat.text}
                          {dayHebcal.shabbat.time && <span className="text-slate-400">({dayHebcal.shabbat.time})</span>}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Appointments List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
                    {dayApts.map(apt => {
                      const badge = getStatusBadge(apt.status);
                      const staff = staffList.find(s => s._id === apt.staffId);
                      const phoneClean = apt.customerPhone?.replace(/\D/g, '');
                      const clientTags = clientTagsMap[phoneClean] || [];
                      const tagIcons = clientTags.map(t => TAG_ICONS[t] || '').join(' ');

                      return (
                        <div
                          key={apt._id}
                          onClick={() => openDetailModal(apt)}
                          className="flex items-center gap-3 px-5 md:px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer transition-all active:bg-slate-100 dark:active:bg-slate-700/40 group"
                        >
                          {/* Time Column */}
                          <div className="w-14 md:w-16 flex-shrink-0 text-center">
                            <span className="text-sm md:text-base font-bold text-slate-900 dark:text-white">{apt.startTime}</span>
                            {apt.endTime && <p className="text-[10px] text-slate-400">{apt.endTime}</p>}
                          </div>

                          {/* Color indicator */}
                          <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: staff?.color || '#3b82f6' }} />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900 dark:text-white text-sm">{apt.customerName}</span>
                              {apt.isRecurring && (
                                <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              )}
                              {tagIcons && <span className="text-xs">{tagIcons}</span>}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>{apt.service}</span>
                              {apt.duration && <span>{apt.duration} דק׳</span>}
                              {staff && <span>| {staff.name}</span>}
                            </div>
                          </div>

                          {/* Status + Arrow */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.text}
                            </span>
                            <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating Add Button (Mobile) */}
      <button
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-6 left-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center text-3xl font-light active:scale-95 transition-transform z-40 hover:bg-blue-500"
      >
        +
      </button>

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4" onClick={() => setShowDetailModal(false)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[92vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalSlideUp 0.35s cubic-bezier(0.32,0.72,0,1)' }}
          >
            {/* Handle (mobile) */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pt-4 md:pt-6 pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedAppointment.customerName}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{selectedAppointment.service}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors mr-3">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {/* Status Badge */}
              <div className="flex items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(selectedAppointment.status).color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(selectedAppointment.status).dot}`} />
                  {getStatusBadge(selectedAppointment.status).text}
                </span>
                {selectedAppointment.isRecurring && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    חוזר
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(92vh-120px)] px-6 pb-6 space-y-4">
              {/* Details - iOS grouped list */}
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl overflow-hidden">
                {/* Date & Time */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[11px] text-slate-400 font-semibold">תאריך ושעה</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{moment(selectedAppointment.date).format('DD/MM/YYYY')} | {selectedAppointment.startTime}{selectedAppointment.endTime ? ` - ${selectedAppointment.endTime}` : ''}</p>
                  </div>
                </div>
                <div className="mx-4 border-t border-slate-200/60 dark:border-slate-600/30" />
                {/* Phone */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[11px] text-slate-400 font-semibold">טלפון</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white" dir="ltr">{selectedAppointment.customerPhone}</p>
                  </div>
                </div>
                {selectedAppointment.customerEmail && (
                  <>
                    <div className="mx-4 border-t border-slate-200/60 dark:border-slate-600/30" />
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-[11px] text-slate-400 font-semibold">אימייל</p>
                        <p className="text-sm text-slate-900 dark:text-white truncate">{selectedAppointment.customerEmail}</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="mx-4 border-t border-slate-200/60 dark:border-slate-600/30" />
                {/* Duration & Price */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[11px] text-slate-400 font-semibold">משך ומחיר</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedAppointment.duration} דקות
                      {selectedAppointment.price > 0 && <span className="text-amber-600 dark:text-amber-400 mr-2">₪{selectedAppointment.price}</span>}
                    </p>
                  </div>
                </div>
                {selectedAppointment.staffId && (
                  <>
                    <div className="mx-4 border-t border-slate-200/60 dark:border-slate-600/30" />
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-[11px] text-slate-400 font-semibold">עובד מטפל</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{staffList.find(s => s._id === selectedAppointment.staffId)?.name || 'לא ידוע'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <a href={`https://wa.me/${selectedAppointment.customerPhone?.replace(/\D/g, '').replace(/^0/, '972')}?text=${encodeURIComponent(`שלום ${selectedAppointment.customerName}, `)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-3 rounded-2xl text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.76-1.268A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.7-6.42-1.9l-.145-.09-3.118.83.876-3.006-.105-.157A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  WhatsApp
                </a>
                <a href={`tel:${selectedAppointment.customerPhone}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-4 py-3 rounded-2xl text-sm transition-all active:scale-95">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  התקשר
                </a>
              </div>

              {/* Client Notes */}
              {detailClientId && (
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={() => { setEditingNote(!editingNote); setNoteInput(detailClientNotes); }} className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 font-semibold">{editingNote ? 'ביטול' : 'ערוך'}</button>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">הערות לקוח</h4>
                      <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                  </div>
                  {editingNote ? (
                    <div className="px-4 pb-4 space-y-2">
                      <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} rows={2} className="w-full bg-white dark:bg-slate-700 border-0 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-right text-sm focus:ring-2 focus:ring-amber-400 outline-none resize-none" placeholder="הוסף הערה..." />
                      <button onClick={handleSaveClientNote} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors active:scale-95">שמור הערה</button>
                    </div>
                  ) : (
                    <div className="px-4 pb-3">
                      <p className="text-sm text-amber-900 dark:text-amber-200">{detailClientNotes || 'אין הערות'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Actions */}
              <div className="space-y-2 pt-2">
                {selectedAppointment.status === 'pending' && (
                  <div className="flex gap-2" style={{ direction: 'ltr' }}>
                    <button onClick={() => handleUpdateStatus(selectedAppointment._id, 'confirmed')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                      <svg className="w-4 h-4 inline ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      אשר תור
                    </button>
                    <button onClick={() => handleCancelAppointment(selectedAppointment._id)} className="flex-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 font-bold py-3 rounded-2xl text-sm transition-all active:scale-95">דחה</button>
                  </div>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <>
                    <div className="flex gap-2" style={{ direction: 'ltr' }}>
                      <button onClick={() => handleUpdateStatus(selectedAppointment._id, 'completed')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/20">הושלם</button>
                      <button onClick={() => handleUpdateStatus(selectedAppointment._id, 'no_show')} className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-2xl text-sm transition-all active:scale-95">לא הגיע</button>
                    </div>
                    <button onClick={() => handleCancelAppointment(selectedAppointment._id)} className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 font-semibold py-3 rounded-2xl text-sm transition-all active:scale-95">בטל תור</button>
                  </>
                )}
                {['completed', 'no_show', 'cancelled'].includes(selectedAppointment.status) && (
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-4 text-center">
                    <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-slate-500 font-medium">
                      {selectedAppointment.status === 'completed' ? 'תור זה הושלם בהצלחה' : selectedAppointment.status === 'no_show' ? 'הלקוח לא הגיע' : 'תור זה בוטל'}
                    </p>
                  </div>
                )}
                {selectedAppointment.isRecurring && selectedAppointment.recurrenceGroupId && (
                  <button
                    onClick={async () => {
                      if (!window.confirm('לבטל את כל התורים החוזרים העתידיים בסדרה זו?')) return;
                      try {
                        const result = await appointmentsApi.cancelRecurring(selectedAppointment.recurrenceGroupId);
                        toast.success(`בוטלו ${result.cancelled} תורים עתידיים`);
                        setShowDetailModal(false);
                      } catch (err) { toast.error('שגיאה בביטול תורים חוזרים'); }
                    }}
                    className="w-full bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 text-orange-600 dark:text-orange-400 font-semibold py-3 rounded-2xl text-sm transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4 inline ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    בטל את כל התורים החוזרים העתידיים
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 md:p-6 text-white flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold">הוספת תור חדש</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddAppointment} className="overflow-y-auto max-h-[calc(90vh-80px)] p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="block text-xs font-semibold text-slate-600 text-right">סוג תור *</label><select name="appointmentTypeId" value={formData.appointmentTypeId || ''} onChange={handleInputChange} className="w-full h-11 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none" required><option value="">בחר סוג תור</option>{appointmentTypes.filter(t => t.isActive).map(t => <option key={t._id} value={t._id}>{t.name} ({t.duration} דקות)</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5"><label className="block text-xs font-semibold text-slate-600 text-right">משך (דקות)</label><input type="number" name="duration" value={formData.duration || ''} onChange={handleInputChange} className="w-full h-11 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none" /></div>
                  <div className="space-y-1.5"><label className="block text-xs font-semibold text-slate-600 text-right">מחיר (₪)</label><input type="number" name="price" value={formData.price || ''} onChange={handleInputChange} className="w-full h-11 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none" /></div>
                </div>
                <div className="space-y-1.5"><label className="block text-xs font-semibold text-slate-600 text-right">שם לקוח *</label><input type="text" name="customerName" value={formData.customerName || ''} onChange={handleInputChange} className="w-full h-11 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none" required /></div>
                <div className="space-y-1.5"><label className="block text-xs font-semibold text-slate-600 text-right">טלפון *</label><input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} onBlur={handlePhoneBlur} className="w-full h-11 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none" dir="ltr" required />{clientNotes && <div className="mt-1 text-xs text-yellow-800 bg-yellow-50 p-2 rounded-lg border border-yellow-200"><strong>הערות:</strong> {clientNotes}</div>}</div>
                <div className="space-y-1.5"><label className="block text-xs font-semibold text-slate-600 text-right">אימייל</label><input type="email" name="customerEmail" value={formData.customerEmail || ''} onChange={handleInputChange} className="w-full h-11 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none" dir="ltr" /></div>
                <div className="space-y-1.5"><label className="block text-xs font-semibold text-slate-600 text-right">תאריך *</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full h-11 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none" required /></div>
                <div className="space-y-1.5"><label className="block text-xs font-semibold text-slate-600 text-right">שעה *</label><input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full h-11 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none" required /></div>
                {staffList.length > 0 && (
                  <div className="space-y-1.5 md:col-span-2"><label className="block text-xs font-semibold text-slate-600 text-right">עובד מטפל</label><select name="staffId" value={formData.staffId || ''} onChange={handleInputChange} className="w-full h-11 bg-slate-100 border-0 rounded-xl px-3 text-sm text-slate-900 text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"><option value="">ללא שיוך</option>{staffList.filter(s => s.isActive !== false).map(s => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}</select></div>
                )}
              </div>
              {/* Recurring */}
              <div className="mt-4 p-3 bg-indigo-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-700">🔄 תור חוזר</span>
                </label>
                {isRecurring && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="space-y-1"><label className="block text-[10px] font-medium text-indigo-600 text-right">תדירות</label><select value={recurFrequency} onChange={(e) => setRecurFrequency(e.target.value)} className="w-full h-9 bg-white border-0 rounded-lg px-2 text-xs text-slate-900 text-right focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"><option value="weekly">כל שבוע</option><option value="biweekly">כל שבועיים</option><option value="monthly">כל חודש</option></select></div>
                    <div className="space-y-1"><label className="block text-[10px] font-medium text-indigo-600 text-right">עד תאריך</label><input type="date" value={recurEndDate} onChange={(e) => setRecurEndDate(e.target.value)} min={formData.date || new Date().toISOString().split('T')[0]} className="w-full h-9 bg-white border-0 rounded-lg px-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-5 mt-5 border-t border-slate-100 dark:border-slate-700" style={{ direction: 'ltr' }}>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm active:scale-95">{isRecurring ? 'צור תורים חוזרים' : 'הוסף תור'}</button>
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-semibold py-2.5 rounded-xl transition-all text-sm">ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4" onClick={() => { setShowBlockModal(false); setBlockMode('hours'); setBlockEndDate(''); resetForm(); }}>
          <div
            className="bg-white dark:bg-slate-800 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalSlideUp 0.35s cubic-bezier(0.32,0.72,0,1)' }}
          >
            {/* Handle (mobile) */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
            </div>

            <div className="px-6 pt-4 md:pt-6 pb-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">חסימת זמן</h2>
                <button onClick={() => { setShowBlockModal(false); setBlockMode('hours'); setBlockEndDate(''); resetForm(); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="bg-slate-100 dark:bg-slate-700/50 rounded-2xl p-1 flex mb-5">
                <button
                  type="button"
                  onClick={() => setBlockMode('hours')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${blockMode === 'hours' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    חסימת שעות
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setBlockMode('dates')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${blockMode === 'dates' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    חסימת ימים
                  </div>
                </button>
              </div>

              <form onSubmit={handleBlockTime} className="space-y-4">
                {blockMode === 'hours' ? (
                  <>
                    {/* Hours mode */}
                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl overflow-hidden">
                      <div className="px-4 pt-3 pb-1">
                        <label className="block text-[11px] font-semibold text-slate-400 text-right mb-0.5">תאריך *</label>
                        <input type="date" name="date" value={formData.date} onChange={handleInputChange} min={new Date().toISOString().split('T')[0]} className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-base font-medium focus:ring-0 focus:outline-none p-0" required />
                      </div>
                      <div className="mx-4 border-t border-slate-200/60 dark:border-slate-600/40" />
                      <div className="px-4 py-3">
                        <label className="block text-[11px] font-semibold text-slate-400 text-right mb-0.5">שעה *</label>
                        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-base font-medium focus:ring-0 focus:outline-none p-0" required />
                      </div>
                      <div className="mx-4 border-t border-slate-200/60 dark:border-slate-600/40" />
                      <div className="px-4 py-3">
                        <label className="block text-[11px] font-semibold text-slate-400 text-right mb-0.5">משך (דקות)</label>
                        <input type="number" name="duration" value={formData.duration || 60} onChange={handleInputChange} min="15" step="15" className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-base font-medium text-right focus:ring-0 focus:outline-none p-0" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Dates mode */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-3.5 mb-1">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed text-right">חסימת ימים מלאים - כל הימים בטווח שנבחר ייחסמו לתורים חדשים</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl overflow-hidden">
                      <div className="px-4 pt-3 pb-1">
                        <label className="block text-[11px] font-semibold text-slate-400 text-right mb-0.5">מתאריך *</label>
                        <input type="date" name="date" value={formData.date} onChange={handleInputChange} min={new Date().toISOString().split('T')[0]} className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-base font-medium focus:ring-0 focus:outline-none p-0" required />
                      </div>
                      <div className="mx-4 border-t border-slate-200/60 dark:border-slate-600/40" />
                      <div className="px-4 py-3">
                        <label className="block text-[11px] font-semibold text-slate-400 text-right mb-0.5">עד תאריך *</label>
                        <input type="date" value={blockEndDate} onChange={(e) => setBlockEndDate(e.target.value)} min={formData.date || new Date().toISOString().split('T')[0]} className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-base font-medium focus:ring-0 focus:outline-none p-0" required />
                      </div>
                    </div>
                    {formData.date && blockEndDate && blockEndDate >= formData.date && (
                      <div className="text-center">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm font-semibold px-4 py-2 rounded-xl">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {Math.round((new Date(blockEndDate) - new Date(formData.date)) / 86400000) + 1} ימים ייחסמו
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Description - shared */}
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl px-4 py-3">
                  <label className="block text-[11px] font-semibold text-slate-400 text-right mb-0.5">סיבה</label>
                  <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="הפסקה, חופשה, מילואים..." className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-base font-medium text-right placeholder:text-slate-300 focus:ring-0 focus:outline-none p-0" />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2" style={{ direction: 'ltr' }}>
                  <button type="submit" className="flex-1 bg-slate-800 hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-slate-800/20 transition-all active:scale-[0.98] text-base">
                    {blockMode === 'dates' ? 'חסום ימים' : 'חסום זמן'}
                  </button>
                  <button type="button" onClick={() => { setShowBlockModal(false); setBlockMode('hours'); setBlockEndDate(''); resetForm(); }} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-3.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-base">
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(100%); opacity: 0.8; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 768px) {
          @keyframes modalSlideUp {
            from { transform: scale(0.92) translateY(20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
};

// Inline Day Details for Mobile
function InlineDayDetails({ data, staffList, appointmentTypes, clientTagsMap, getStatusBadge, showHebrewDate, onAppointmentClick, onClose, onAddClick }) {
  const formattedDate = moment(data.date).format('dddd, D בMMMM YYYY');

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden" style={{ animation: 'slideUp 0.3s ease-out' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold">{formattedDate}</h3>
          {showHebrewDate && <p className="text-blue-100 text-xs">{formatHebrewDate(new Date(data.date))}</p>}
          <p className="text-blue-200 text-xs mt-0.5">
            {data.appointments.length > 0 ? `${data.appointments.length} תור${data.appointments.length > 1 ? 'ים' : ''}` : 'אין תורים'}
          </p>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Hebrew Calendar Info */}
        {(data.holidays?.length > 0 || data.shabbat || data.parasha) && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-2.5 space-y-1">
            {data.parasha && <div className="flex items-center gap-1.5 text-xs"><span>📖</span><span className="text-purple-700 font-semibold">{data.parasha.text}</span></div>}
            {data.holidays?.map((h, i) => <div key={i} className="flex items-center gap-1.5 text-xs"><span>🕎</span><span className="text-orange-800 font-semibold">{h.text}</span></div>)}
            {data.shabbat && <div className="flex items-center gap-1.5 text-xs"><span>🕯️</span><span className="text-slate-600">{data.shabbat.text}</span>{data.shabbat.time && <span className="text-slate-400 text-[10px]">({data.shabbat.time})</span>}</div>}
          </div>
        )}

        {/* Add appointment button */}
        <button onClick={onAddClick} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2 rounded-xl text-xs transition-colors active:scale-95">
          + הוסף תור ליום זה
        </button>

        {/* Appointments */}
        {data.appointments.length > 0 ? (
          data.appointments.map(apt => {
            const badge = getStatusBadge(apt.status);
            const staff = staffList.find(s => s._id === apt.staffId);
            return (
              <div
                key={apt._id}
                onClick={() => onAppointmentClick(apt)}
                className="bg-slate-50 rounded-xl p-3 active:bg-slate-100 cursor-pointer transition-all"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: staff?.color || '#3b82f6' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-slate-900 text-sm">{apt.customerName}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${badge.color}`}>{badge.text}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      🕐 {apt.startTime}{apt.endTime ? ` - ${apt.endTime}` : ''} | {apt.service}
                      {staff && ` | ${staff.name}`}
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      {apt.customerPhone && apt.customerPhone !== '0000000000' && (
                        <a href={`https://wa.me/${apt.customerPhone.replace(/\D/g, '').replace(/^0/, '972')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-green-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-medium active:scale-95">💬 WhatsApp</a>
                      )}
                      {apt.customerPhone && apt.customerPhone !== '0000000000' && (
                        <a href={`tel:${apt.customerPhone}`} onClick={(e) => e.stopPropagation()} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg text-[10px] font-medium active:scale-95">📞</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-slate-400 py-3 text-sm">אין תורים ביום זה</p>
        )}
      </div>
    </div>
  );
}

// Desktop Day Details Modal
function DayDetailsModal({ data, staffList, appointmentTypes, clientTagsMap, getStatusBadge, showHebrewDate, onAppointmentClick, onClose, onAddClick }) {
  const formattedDate = moment(data.date).format('dddd, D בMMMM YYYY');

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ animation: 'slideUp 0.25s ease-out' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{formattedDate}</h2>
            {showHebrewDate && <p className="text-blue-100 text-sm mt-0.5">{formatHebrewDate(new Date(data.date))}</p>}
            <p className="text-blue-200 text-xs mt-0.5">
              {data.appointments.length > 0 ? `${data.appointments.length} תור${data.appointments.length > 1 ? 'ים' : ''}` : 'אין תורים'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-5 space-y-3">
          {/* Hebrew Calendar Info */}
          {(data.holidays?.length > 0 || data.shabbat || data.parasha) && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 space-y-1.5">
              {data.parasha && <div className="flex items-center gap-2 text-sm"><span>📖</span><span className="text-purple-700 font-semibold">{data.parasha.text}</span></div>}
              {data.holidays?.map((h, i) => <div key={i} className="flex items-center gap-2 text-sm"><span>🕎</span><span className="text-orange-800 font-semibold">{h.text}</span></div>)}
              {data.shabbat && <div className="flex items-center gap-2 text-sm"><span>🕯️</span><span className="text-slate-600">{data.shabbat.text}</span>{data.shabbat.time && <span className="text-slate-400 text-xs">({data.shabbat.time})</span>}</div>}
            </div>
          )}

          {/* Add button */}
          <button onClick={onAddClick} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2.5 rounded-xl text-sm transition-colors active:scale-95">
            + הוסף תור ליום זה
          </button>

          {/* Appointments */}
          {data.appointments.length > 0 ? (
            data.appointments.map(apt => {
              const badge = getStatusBadge(apt.status);
              const staff = staffList.find(s => s._id === apt.staffId);
              const phoneClean = apt.customerPhone?.replace(/\D/g, '');
              const clientTags = clientTagsMap[phoneClean] || [];
              const tagIcons = clientTags.map(t => TAG_ICONS[t] || '🏷️').join(' ');

              return (
                <div
                  key={apt._id}
                  onClick={() => onAppointmentClick(apt)}
                  className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 cursor-pointer transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: staff?.color || '#3b82f6' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">{apt.customerName}</span>
                        {apt.isRecurring && <span className="text-xs">🔄</span>}
                        {tagIcons && <span className="text-xs">{tagIcons}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.color}`}>{badge.text}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">🕐 {apt.startTime}{apt.endTime ? ` - ${apt.endTime}` : ''}</span>
                        <span>{apt.service}</span>
                        {staff && <span className="text-slate-400">| {staff.name}</span>}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {apt.customerPhone && apt.customerPhone !== '0000000000' && (
                          <a href={`https://wa.me/${apt.customerPhone.replace(/\D/g, '').replace(/^0/, '972')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-green-600 active:scale-95 transition-all">💬 WhatsApp</a>
                        )}
                        {apt.customerPhone && apt.customerPhone !== '0000000000' && (
                          <a href={`tel:${apt.customerPhone}`} onClick={(e) => e.stopPropagation()} className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-blue-100 active:scale-95 transition-all">📞 התקשר</a>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm">אין תורים ביום זה</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Events;
