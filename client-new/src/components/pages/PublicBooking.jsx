import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/he';
import SkeletonLoader from '../common/SkeletonLoader';
import { formatHebrewDate } from '../../utils/hebrewDate';
import { useAuth } from '../../hooks/useAuth';
import './PublicBooking.css';

moment.locale('he');

const PublicBooking = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Service, 2: Date/Time, 3: Details, 4: Success
  const [loading, setLoading] = useState(true);
  const [businessOwner, setBusinessOwner] = useState(null);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(moment());
  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerPhone: user?.phoneNumber || '',
    customerEmail: user?.email || '',
    date: moment().format('YYYY-MM-DD'),
    time: '',
  });

  const [hebrewDate, setHebrewDate] = useState('');

  useEffect(() => {
    fetchBusinessOwner();
  }, [username]);

  // Update Hebrew date whenever date changes
  useEffect(() => {
    if (formData.date && businessOwner?.showHebrewDate) {
      setHebrewDate(formatHebrewDate(new Date(formData.date)));
    } else {
      setHebrewDate('');
    }
  }, [formData.date, businessOwner?.showHebrewDate]);

  // Fetch available times when date and type are selected
  useEffect(() => {
    if (formData.date && businessOwner && selectedType) {
      fetchAvailableTimes();
    }
  }, [formData.date, selectedType, businessOwner]);

  const fetchBusinessOwner = async () => {
    try {
      const userRes = await axios.get(`/api/users/public/${username}`);
      const owner = userRes.data;
      setBusinessOwner(owner);

      // Inject theme colors
      if (owner.themeSettings) {
        document.documentElement.style.setProperty('--primary-color', owner.themeSettings.primaryColor || '#6366f1');
        document.documentElement.style.setProperty('--secondary-color', owner.themeSettings.secondaryColor || '#a855f7');
      }

      const typesRes = await axios.get(`/api/appointment-types/user/${username}`);
      setAppointmentTypes(typesRes.data);

      setLoading(false);
    } catch (err) {
      toast.error('העסק לא נמצא');
      setLoading(false);
    }
  };

  const fetchAvailableTimes = async () => {
    setLoadingTimes(true);
    try {
      const res = await axios.get(`/api/appointments/available/${username}`, {
        params: {
          date: formData.date,
          duration: selectedType?.duration || 60,
        },
      });
      setAvailableTimes(res.data.times || []);
    } catch (err) {
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleServiceSelect = (type) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleTimeSelect = (time) => {
    setFormData({ ...formData, time });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.time) {
      toast.error('נא לבחור שעה');
      return;
    }

    setBookingLoading(true);
    try {
      const appointmentData = {
        businessOwnerId: businessOwner._id,
        appointmentTypeId: selectedType._id,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        customerId: user?.id || null,
        date: formData.date,
        startTime: formData.time,
        duration: selectedType.duration,
        service: selectedType.name,
        price: selectedType.price,
      };

      await axios.post(`/api/appointments/public/${username}`, appointmentData);
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה בקביעת התור');
    } finally {
      setBookingLoading(false);
    }
  };

  // Calendar Helpers
  const renderCalendar = () => {
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const daysInMonth = [];

    // Fill previous month days
    const startPadding = startOfMonth.day();
    for (let i = startPadding - 1; i >= 0; i--) {
      daysInMonth.push({ date: startOfMonth.clone().subtract(i + 1, 'days'), isPadding: true });
    }

    // Current month days
    for (let i = 1; i <= endOfMonth.date(); i++) {
      daysInMonth.push({ date: startOfMonth.clone().date(i), isPadding: false });
    }

    return daysInMonth;
  };

  const isToday = (date) => date.isSame(moment(), 'day');
  const isSelected = (date) => date.format('YYYY-MM-DD') === formData.date;
  const isPast = (date) => date.isBefore(moment(), 'day');

  if (loading) {
    return (
      <div className="public-booking-page">
        <div className="booking-card" style={{ opacity: 0.5 }}>
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  // Generate Google Calendar URL
  const generateGoogleCalendarUrl = () => {
    if (!formData.date || !formData.time || !selectedType) return '';

    const startDate = moment(`${formData.date} ${formData.time}`, 'YYYY-MM-DD HH:mm');
    const endDate = startDate.clone().add(selectedType.duration, 'minutes');

    const formatForGoogle = (m) => m.utc().format('YYYYMMDDTHHmmss') + 'Z';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${selectedType.name} - ${businessOwner?.businessName || 'תור'}`,
      dates: `${formatForGoogle(startDate)}/${formatForGoogle(endDate)}`,
      details: `תור ל${selectedType.name}\nמחיר: ${selectedType.price} ש"ח\nטלפון: ${businessOwner?.phoneNumber || ''}`,
      location: businessOwner?.businessAddress || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Helper icon selector based on service name
  const getIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('תספורת') || n.includes('cut')) return '✂️';
    if (n.includes('צבע') || n.includes('color')) return '🎨';
    if (n.includes('זקן') || n.includes('beard')) return '🧔';
    if (n.includes('ציפורניים') || n.includes('nail')) return '💅';
    if (n.includes('פנים') || n.includes('face')) return '🧴';
    return '✨';
  };

  return (
    <div className="public-booking-page">
      <div className="booking-card">
        <div className="booking-header">
          {businessOwner?.themeSettings?.logoUrl ? (
            <img src={businessOwner.themeSettings.logoUrl} alt={businessOwner.businessName} className="business-logo-lg" />
          ) : (
            <h1 className="page-title">{businessOwner?.businessName || 'הזמנה פתוחה'}</h1>
          )}
          {businessOwner?.businessDescription && (
            <p className="business-desc-small">{businessOwner.businessDescription}</p>
          )}
        </div>

        {step < 4 && (
          <div className="steps-wrapper">
            <div className="steps-bar">
              <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
                <div className="step-circle-outer"><div className="step-circle-inner" /></div>
                <span className="step-label text-xs mt-2">אישור</span>
              </div>
              <div className="steps-line-new" />
              <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                <div className="step-circle-outer"><div className="step-circle-inner" /></div>
                <span className="step-label text-xs mt-2">בחר תאריך</span>
              </div>
              <div className="steps-line-new" />
              <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
                <div className="step-circle-outer"><div className="step-circle-inner" /></div>
                <span className="step-label text-xs mt-2">בחר שירות</span>
              </div>
            </div>
          </div>
        )}

        <div className="booking-body-new">
          {step === 1 && (
            <div className="view-container">
              <h3 className="section-header">בחר שירות</h3>
              <div className="service-grid-new">
                {appointmentTypes.map((type) => (
                  <div
                    key={type._id}
                    className={`service-box ${selectedType?._id === type._id ? 'selected' : ''}`}
                    onClick={() => handleServiceSelect(type)}
                  >
                    <span className="service-box-icon">{getIcon(type.name)}</span>
                    <span className="service-box-name">{type.name}</span>
                    <span className="service-box-desc">{type.description?.substring(0, 40)}...</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="view-container">
              <h3 className="section-header">בחר תאריך</h3>
              <div className="calendar-card">
                <div className="calendar-top">
                  <button className="opacity-50 hover:opacity-100" onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, 'month'))}>‹</button>
                  <span className="month-label text-right">{currentMonth.format('MMMM YYYY')}</span>
                  <button className="opacity-50 hover:opacity-100" onClick={() => setCurrentMonth(currentMonth.clone().add(1, 'month'))}>›</button>
                </div>
                <div className="calendar-grid-header">
                  <span>שבת</span><span>שישי</span><span>חמישי</span><span>רביעי</span><span>שלישי</span><span>שני</span><span>ראשון</span>
                </div>
                <div className="calendar-grid">
                  {renderCalendar().map((day, idx) => (
                    <div
                      key={idx}
                      className={`calendar-day ${day.isPadding ? 'disabled' : ''} ${isSelected(day.date) ? 'selected' : ''} ${isToday(day.date) ? 'today' : ''} ${isPast(day.date) ? 'disabled' : ''}`}
                      onClick={() => !day.isPadding && !isPast(day.date) && setFormData({ ...formData, date: day.date.format('YYYY-MM-DD'), time: '' })}
                    >
                      {day.date.date()}
                    </div>
                  ))}
                </div>
              </div>

              {hebrewDate && (
                <p className="text-right text-sm mb-6 opacity-80">📅 {hebrewDate}</p>
              )}

              <div className="time-section-new">
                <h3 className="section-header">בחר שעה</h3>
                {loadingTimes ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : availableTimes.length > 0 ? (
                  <div className="time-chips-grid">
                    {availableTimes.map((t) => (
                      <div
                        key={t}
                        className={`time-chip ${formData.time === t ? 'selected' : ''}`}
                        onClick={() => handleTimeSelect(t)}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white/5 rounded-2xl">
                    <p className="opacity-50">אין תורים פנויים לתאריך זה</p>
                    <p className="text-xs opacity-30 mt-2">בדקו שעות פעילות בהגדרות העסק</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="view-container">
              <h3 className="section-header">פרטים אחרונים</h3>
              <div className="glass-input-group">
                <div className="glass-field">
                  <label className="glass-label">שם מלא</label>
                  <input
                    type="text"
                    name="customerName"
                    className="glass-input text-right"
                    placeholder="הכנס שם"
                    value={formData.customerName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="glass-field">
                  <label className="glass-label">טלפון</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    className="glass-input"
                    dir="ltr"
                    placeholder="05X-XXXXXXX"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="glass-field">
                  <label className="glass-label">אימייל (אופציונלי)</label>
                  <input
                    type="email"
                    name="customerEmail"
                    className="glass-input"
                    dir="ltr"
                    placeholder="name@example.com"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl text-right">
                <p className="font-bold text-lg mb-1">{selectedType?.name}</p>
                <p className="opacity-60">
                  {moment(formData.date).format('DD/MM/YYYY')} בשעה {formData.time}
                </p>
                {hebrewDate && (
                  <p className="text-sm opacity-50 mt-1">📅 {hebrewDate}</p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="success-view-new">
              <div className="success-glow-icon">🎉</div>
              <h2 className="text-3xl font-bold mb-4">התור נקבע!</h2>
              <p className="text-lg opacity-70 mb-6">
                נתראה בתאריך {moment(formData.date).format('DD/MM/YYYY')} <br />
                בשעה {formData.time}
              </p>
              {hebrewDate && (
                <p className="text-sm opacity-60 mb-6">📅 {hebrewDate}</p>
              )}
              <div className="flex flex-col gap-3 w-full">
                <a
                  href={generateGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-crystal w-full justify-center flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 3h-15A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3zM12 17.25A5.25 5.25 0 1 1 17.25 12 5.26 5.26 0 0 1 12 17.25z"/>
                    <path d="M12 8.25v4.5l3 1.5"/>
                  </svg>
                  הוסף ליומן Google
                </a>
                <button
                  className="btn-crystal-outline w-full justify-center"
                  onClick={() => window.location.reload()}
                >
                  קבע תור נוסף
                </button>
              </div>
            </div>
          )}
        </div>

        {step < 4 && (
          <div className="nav-footer">
            {step > 1 ? (
              <button className="btn-crystal" onClick={() => setStep(step - 1)}>חזור</button>
            ) : <div />}

            <button
              className="btn-crystal"
              disabled={
                (step === 1 && !selectedType) ||
                (step === 2 && !formData.time) ||
                (step === 3 && (!formData.customerName || !formData.customerPhone || bookingLoading))
              }
              onClick={() => {
                if (step === 3) handleSubmit();
                else setStep(step + 1);
              }}
            >
              {bookingLoading ? 'מבצע...' : (step === 3 ? 'קבע פגישה' : 'המשך')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBooking;
