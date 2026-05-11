import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/he';
import { toast } from 'react-toastify';

moment.locale('he');

const ManageBooking = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  // reschedule flow
  const [mode, setMode] = useState('view'); // 'view' | 'reschedule'
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`/api/appointments/manage/${token}`);
        setAppointment(res.data.appointment);
        setBusiness(res.data.business);
      } catch (err) {
        setError(err.response?.data?.message || 'תור לא נמצא');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  useEffect(() => {
    if (!selectedDate || !business) return;
    const fetch = async () => {
      setLoadingTimes(true);
      setSelectedTime('');
      try {
        const res = await axios.get(`/api/appointments/available/${business.username}`, {
          params: { date: selectedDate, duration: appointment.duration }
        });
        setAvailableTimes(res.data.slots || []);
      } catch {
        setAvailableTimes([]);
      } finally {
        setLoadingTimes(false);
      }
    };
    fetch();
  }, [selectedDate, business, appointment]);

  const handleCancel = async () => {
    if (!window.confirm('האם לבטל את התור?')) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/appointments/manage/${token}/cancel`);
      setDone('התור בוטל בהצלחה.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה בביטול התור');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/appointments/manage/${token}/reschedule`, {
        date: selectedDate,
        startTime: selectedTime
      });
      setDone(`התור עודכן בהצלחה ל-${moment(selectedDate).format('DD/MM/YYYY')} בשעה ${selectedTime}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה בעדכון התור');
    } finally {
      setSubmitting(false);
    }
  };

  const today = moment().format('YYYY-MM-DD');
  const primaryColor = business?.themeSettings?.primaryColor || '#6366f1';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">אופס</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">בוצע!</h2>
        <p className="text-gray-600">{done}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full overflow-hidden">

        {/* Header */}
        <div className="p-6 text-white text-center" style={{ background: primaryColor }}>
          {business?.themeSettings?.logoUrl ? (
            <img src={business.themeSettings.logoUrl} alt={business.businessName} className="w-16 h-16 object-cover rounded-full mx-auto mb-3 border-2 border-white/40" />
          ) : (
            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
              {business?.businessName?.[0] || '?'}
            </div>
          )}
          <h1 className="text-lg font-bold">{business?.businessName}</h1>
          <p className="text-white/70 text-sm mt-1">ניהול התור שלך</p>
        </div>

        {/* Appointment details */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-800">{appointment.customerName}</span>
              <span className="text-gray-400">שם</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-800">{appointment.service}</span>
              <span className="text-gray-400">שירות</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-800">{moment(appointment.date).format('dddd, DD/MM/YYYY')}</span>
              <span className="text-gray-400">תאריך</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-800">{appointment.startTime} – {appointment.endTime}</span>
              <span className="text-gray-400">שעה</span>
            </div>
            {appointment.price > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-800">₪{appointment.price}</span>
                <span className="text-gray-400">מחיר</span>
              </div>
            )}
          </div>

          {mode === 'view' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('reschedule')}
                className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: primaryColor }}
              >
                שנה מועד
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="w-full py-3 rounded-xl font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {submitting ? 'מבטל...' : 'בטל תור'}
              </button>
            </div>
          )}

          {mode === 'reschedule' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-center">בחר מועד חדש</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">תאריך</label>
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  dir="ltr"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">שעה</label>
                  {loadingTimes ? (
                    <p className="text-sm text-gray-400 text-center py-2">טוען שעות...</p>
                  ) : availableTimes.length === 0 ? (
                    <p className="text-sm text-red-400 text-center py-2">אין שעות פנויות בתאריך זה</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimes.map(t => (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                            selectedTime === t
                              ? 'text-white border-transparent'
                              : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                          }`}
                          style={selectedTime === t ? { background: primaryColor } : {}}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setMode('view'); setSelectedDate(''); setSelectedTime(''); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  חזור
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!selectedDate || !selectedTime || submitting}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: primaryColor }}
                >
                  {submitting ? 'שומר...' : 'אשר שינוי'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageBooking;
