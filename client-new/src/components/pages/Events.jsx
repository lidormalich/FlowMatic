import { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/he';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../hooks/useAppointments';
import { appointmentTypesApi } from '../../services/api';
import SkeletonLoader from '../common/SkeletonLoader';

moment.locale('he');
const localizer = momentLocalizer(moment);

const messages = {
  allDay: 'כל היום',
  previous: 'קודם',
  next: 'הבא',
  today: 'היום',
  month: 'חודש',
  week: 'שבוע',
  day: 'יום',
  agenda: 'סדר יום',
  date: 'תאריך',
  time: 'שעה',
  event: 'אירוע',
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

  const [view, setView] = useState('calendar'); // 'calendar' or 'list'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    appointmentTypeId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    date: '',
    startTime: '',
    notes: '',
  });

  const appointmentTypes = appointmentTypesData?.data || [];
  const loading = appointmentsLoading || typesLoading;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();

    if (!formData.appointmentTypeId || !formData.customerName || !formData.customerPhone || !formData.date || !formData.startTime) {
      toast.error('יש למלא את כל השדות החובה');
      return;
    }

    const selectedType = appointmentTypes.find(t => t._id === formData.appointmentTypeId);

    // Calculate end time based on duration
    const [hours, minutes] = formData.startTime.split(':');
    const startDateTime = new Date(formData.date);
    startDateTime.setHours(parseInt(hours), parseInt(minutes));

    const endDateTime = new Date(startDateTime.getTime() + selectedType.duration * 60000);
    const endTime = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;

    const appointmentData = {
      ...formData,
      endTime,
      duration: selectedType.duration,
      service: selectedType.name,
      price: selectedType.price,
      status: 'confirmed',
    };

    createAppointment(appointmentData);
    setShowAddModal(false);
    resetForm();
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('האם אתה בטוח שברצונך לבטל תור זה?')) return;

    cancelAppointment(appointmentId);
    setShowDetailModal(false);
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    updateAppointment({ id: appointmentId, data: { status: newStatus } });
    setShowDetailModal(false);
  };

  const resetForm = () => {
    setFormData({
      appointmentTypeId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      date: '',
      startTime: '',
      notes: '',
    });
  };

  // Convert appointments to calendar events
  const calendarEvents = (appointments || [])
    .filter(apt => {
      const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
      const matchesType = filterType === 'all' || apt.appointmentTypeId === filterType;
      return matchesStatus && matchesType;
    })
    .map((apt) => {
      const aptType = appointmentTypes.find(t => t._id === apt.appointmentTypeId);
      const [hours, minutes] = apt.startTime.split(':');
      const start = new Date(apt.date);
      start.setHours(parseInt(hours), parseInt(minutes));

      const end = new Date(start.getTime() + (apt.duration || 60) * 60000);

      return {
        ...apt,
        title: `${apt.customerName} - ${apt.service}`,
        start,
        end,
        resource: apt,
        style: {
          backgroundColor: aptType?.color || '#667eea',
        },
      };
    });

  // Filter appointments for list view
  const filteredAppointments = (appointments || []).filter((apt) => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesType = filterType === 'all' || apt.appointmentTypeId === filterType;
    const matchesSearch =
      apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.customerPhone.includes(searchQuery) ||
      (apt.customerEmail && apt.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleSelectEvent = (event) => {
    setSelectedAppointment(event.resource);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'ממתין', color: 'bg-yellow-100 text-yellow-700' },
      confirmed: { text: 'מאושר', color: 'bg-green-100 text-green-700' },
      cancelled: { text: 'בוטל', color: 'bg-red-100 text-red-700' },
      completed: { text: 'הושלם', color: 'bg-blue-100 text-blue-700' },
      no_show: { text: 'לא הגיע', color: 'bg-gray-100 text-gray-700' },
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">יומן תורים</h1>
          <p className="text-gray-600">טוען...</p>
        </div>
        <SkeletonLoader type="calendar" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">יומן תורים</h1>
          <p className="text-gray-600">צפה ונהל את כל התורים שלך</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setView(view === 'calendar' ? 'list' : 'calendar')}
            className="bg-white border-2 border-primary text-primary font-semibold px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-all"
          >
            {view === 'calendar' ? '📋 תצוגת רשימה' : '📅 תצוגת לוח'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-primary to-secondary text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            ➕ הוסף תור
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {view === 'list' && (
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-right">חיפוש</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לפי שם, טלפון או אימייל..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-right">סינון לפי סטטוס</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="pending">ממתין</option>
              <option value="confirmed">מאושר</option>
              <option value="completed">הושלם</option>
              <option value="cancelled">בוטל</option>
              <option value="no_show">לא הגיע</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-right">סינון לפי סוג תור</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
            >
              <option value="all">כל הסוגים</option>
              {appointmentTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 h-[700px]">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', minHeight: '600px' }}
            messages={messages}
            onSelectEvent={handleSelectEvent}
            rtl={true}
            eventPropGetter={(event) => ({
              style: event.style,
            })}
          />
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">אין תורים</h3>
              <p className="text-gray-600">נסה לשנות את הפילטרים או להוסיף תור חדש</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary to-secondary text-white">
                  <tr>
                    <th className="px-6 py-4 text-right font-semibold">תאריך</th>
                    <th className="px-6 py-4 text-right font-semibold">שעה</th>
                    <th className="px-6 py-4 text-right font-semibold">לקוח</th>
                    <th className="px-6 py-4 text-right font-semibold">טלפון</th>
                    <th className="px-6 py-4 text-right font-semibold">שירות</th>
                    <th className="px-6 py-4 text-right font-semibold">משך</th>
                    <th className="px-6 py-4 text-right font-semibold">סטטוס</th>
                    <th className="px-6 py-4 text-right font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((apt) => {
                      const statusBadge = getStatusBadge(apt.status);
                      const aptType = appointmentTypes.find(t => t._id === apt.appointmentTypeId);

                      return (
                        <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-right">
                            {moment(apt.date).format('DD/MM/YYYY')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {apt.startTime}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold">
                            {apt.customerName}
                          </td>
                          <td className="px-6 py-4 text-left" dir="ltr">
                            {apt.customerPhone}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <span>{apt.service}</span>
                              {aptType && (
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: aptType.color }}
                                ></span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {apt.duration} דקות
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                              {statusBadge.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setShowDetailModal(true);
                              }}
                              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                            >
                              👁️ צפה
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <h2 className="text-3xl font-bold">פרטי תור</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-right">
                  <label className="text-gray-600 text-sm font-semibold">שם לקוח</label>
                  <p className="text-gray-800 text-lg font-bold">{selectedAppointment.customerName}</p>
                </div>
                <div className="text-right">
                  <label className="text-gray-600 text-sm font-semibold">טלפון</label>
                  <p className="text-gray-800 text-lg" dir="ltr">{selectedAppointment.customerPhone}</p>
                </div>
                <div className="text-right">
                  <label className="text-gray-600 text-sm font-semibold">שירות</label>
                  <p className="text-gray-800 text-lg font-bold">{selectedAppointment.service}</p>
                </div>
                <div className="text-right">
                  <label className="text-gray-600 text-sm font-semibold">תאריך</label>
                  <p className="text-gray-800 text-lg">{moment(selectedAppointment.date).format('DD/MM/YYYY')}</p>
                </div>
                <div className="text-right">
                  <label className="text-gray-600 text-sm font-semibold">שעה</label>
                  <p className="text-gray-800 text-lg">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
                </div>
                <div className="text-right">
                  <label className="text-gray-600 text-sm font-semibold">משך זמן</label>
                  <p className="text-gray-800 text-lg">{selectedAppointment.duration} דקות</p>
                </div>
                {selectedAppointment.price > 0 && (
                  <div className="text-right">
                    <label className="text-gray-600 text-sm font-semibold">מחיר</label>
                    <p className="text-gray-800 text-lg font-bold">₪{selectedAppointment.price}</p>
                  </div>
                )}
                <div className="text-right">
                  <label className="text-gray-600 text-sm font-semibold">סטטוס</label>
                  <p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedAppointment.status).color}`}>
                      {getStatusBadge(selectedAppointment.status).text}
                    </span>
                  </p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="mb-6 text-right">
                  <label className="text-gray-600 text-sm font-semibold">הערות</label>
                  <p className="text-gray-800 mt-1">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Google Calendar Button */}
              <div className="mb-6">
                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedAppointment.service + ' - ' + selectedAppointment.customerName)}&dates=${moment(selectedAppointment.date).format('YYYYMMDD')}T${selectedAppointment.startTime.replace(':', '')}00/${moment(selectedAppointment.date).format('YYYYMMDD')}T${selectedAppointment.endTime.replace(':', '')}00&details=${encodeURIComponent(`לקוח: ${selectedAppointment.customerName}\nטלפון: ${selectedAppointment.customerPhone}\n${selectedAppointment.notes || ''}`)}&location=${encodeURIComponent('')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg transition-all"
                >
                  📅 הוסף ליומן Google
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleUpdateStatus(selectedAppointment._id, 'completed')}
                  className="flex-1 bg-green-50 text-green-600 font-semibold px-4 py-3 rounded-lg hover:bg-green-100 transition-colors"
                  disabled={selectedAppointment.status === 'completed'}
                >
                  ✓ סמן כהושלם
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedAppointment._id, 'no_show')}
                  className="flex-1 bg-gray-50 text-gray-600 font-semibold px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={selectedAppointment.status === 'no_show'}
                >
                  ✗ לא הגיע
                </button>
                <button
                  onClick={() => handleCancelAppointment(selectedAppointment._id)}
                  className="flex-1 bg-red-50 text-red-600 font-semibold px-4 py-3 rounded-lg hover:bg-red-100 transition-colors"
                  disabled={selectedAppointment.status === 'cancelled'}
                >
                  🗑️ בטל תור
                </button>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  סגור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <h2 className="text-3xl font-bold">הוספת תור חדש</h2>
            </div>

            <form onSubmit={handleAddAppointment} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    סוג תור <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="appointmentTypeId"
                    value={formData.appointmentTypeId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                    required
                  >
                    <option value="">בחר סוג תור</option>
                    {appointmentTypes.filter(t => t.isActive).map((type) => (
                      <option key={type._id} value={type._id}>
                        {type.name} ({type.duration} דקות)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    שם לקוח <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    טלפון <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    אימייל
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    תאריך <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    שעת התחלה <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2 text-right">
                  הערות
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  placeholder="הערות נוספות..."
                />
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  ➕ הוסף תור
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ❌ ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
