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

// RTL day headers: Sunday first (right) → Saturday last (left)
const DAY_HEADERS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const PublicBooking = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [businessOwner, setBusinessOwner] = useState(null);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [additionalServices, setAdditionalServices] = useState([]);

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

  useEffect(() => {
    if (formData.date && businessOwner?.showHebrewDate) {
      setHebrewDate(formatHebrewDate(new Date(formData.date)));
    } else {
      setHebrewDate('');
    }
  }, [formData.date, businessOwner?.showHebrewDate]);

  useEffect(() => {
    if (formData.date && businessOwner && selectedType) {
      fetchAvailableTimes();
    }
  }, [formData.date, selectedType, businessOwner, additionalServices]);

  const fetchBusinessOwner = async () => {
    try {
      const userRes = await axios.get(`/api/users/public/${username}`);
      const owner = userRes.data;
      setBusinessOwner(owner);

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
          duration: getTotalDuration() || selectedType?.duration || 60,
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
    setAdditionalServices([]);
    if (type.relatedServices?.length > 0) {
      setShowUpsell(true);
    } else {
      setStep(2);
    }
  };

  const toggleAdditionalService = (service) => {
    setAdditionalServices(prev =>
      prev.find(s => s._id === service._id)
        ? prev.filter(s => s._id !== service._id)
        : [...prev, service]
    );
  };

  const confirmUpsell = () => {
    setShowUpsell(false);
    setStep(2);
  };

  const skipUpsell = () => {
    setAdditionalServices([]);
    setShowUpsell(false);
    setStep(2);
  };

  const getTotalDuration = () => {
    const base = selectedType?.duration || 0;
    const extra = additionalServices.reduce((sum, s) => sum + (s.duration || 0), 0);
    return base + extra;
  };

  const getTotalPrice = () => {
    const base = selectedType?.price || 0;
    const extra = additionalServices.reduce((sum, s) => sum + (s.price || 0), 0);
    return base + extra;
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
      const totalDuration = getTotalDuration();
      const totalPrice = getTotalPrice();
      const serviceNames = [selectedType.name, ...additionalServices.map(s => s.name)].join(' + ');

      const appointmentData = {
        businessOwnerId: businessOwner._id,
        appointmentTypeId: selectedType._id,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        customerId: user?.id || null,
        date: formData.date,
        startTime: formData.time,
        duration: totalDuration,
        service: serviceNames,
        price: totalPrice,
        additionalServices: additionalServices.map(s => ({ _id: s._id, name: s.name, duration: s.duration, price: s.price })),
      };

      await axios.post(`/api/appointments/public/${username}`, appointmentData);
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה בקביעת התור');
    } finally {
      setBookingLoading(false);
    }
  };

  // Calendar - RTL: Sunday (day 0) first on right
  const renderCalendar = () => {
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const days = [];

    // Padding: startOfMonth.day() gives 0=Sunday, 1=Monday, ...
    // In RTL grid, Sunday is first column (right), so padding = day index
    const startPadding = startOfMonth.day();
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: startOfMonth.clone().subtract(startPadding - i, 'days'), isPadding: true });
    }

    for (let i = 1; i <= endOfMonth.date(); i++) {
      days.push({ date: startOfMonth.clone().date(i), isPadding: false });
    }

    return days;
  };

  const isToday = (date) => date.isSame(moment(), 'day');
  const isSelected = (date) => date.format('YYYY-MM-DD') === formData.date;
  const isPast = (date) => date.isBefore(moment(), 'day');

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

  const getIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('תספורת') || n.includes('cut')) return '✂️';
    if (n.includes('צבע') || n.includes('color')) return '🎨';
    if (n.includes('זקן') || n.includes('beard')) return '🧔';
    if (n.includes('ציפורניים') || n.includes('nail')) return '💅';
    if (n.includes('פנים') || n.includes('face')) return '🧴';
    if (n.includes('עיסוי') || n.includes('massage')) return '💆';
    if (n.includes('ייעוץ') || n.includes('consult')) return '💬';
    return '✨';
  };

  if (loading) {
    return (
      <div className="public-booking-page">
        <div className="booking-card" style={{ opacity: 0.5 }}>
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="public-booking-page">
      {/* Decorative background blurs */}
      <div className="booking-bg-blur-1" />
      <div className="booking-bg-blur-2" />
      <div className="booking-bg-blur-3" />

      <div className="booking-card">
        {/* Header */}
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

        {/* Step Dots */}
        {step < 4 && (
          <div className="steps-wrapper">
            <div className="steps-bar">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`step-dot ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div>
            <h3 className="section-header">בחר שירות</h3>
            <div className="service-grid-new">
              {appointmentTypes.map((type) => (
                <div
                  key={type._id}
                  className={`service-box ${selectedType?._id === type._id ? 'selected' : ''}`}
                  onClick={() => handleServiceSelect(type)}
                >
                  {type.images?.length > 0 ? (
                    <img
                      src={type.images[0]}
                      alt={type.name}
                      style={{ width: '3.5rem', height: '3.5rem', objectFit: 'cover', borderRadius: '0.75rem', flexShrink: 0 }}
                    />
                  ) : (
                    <div className="service-box-icon">{getIcon(type.name)}</div>
                  )}
                  <div className="service-box-info">
                    <span className="service-box-name">{type.name}</span>
                    {type.description && (
                      <span className="service-box-desc">{type.description.substring(0, 50)}</span>
                    )}
                    <div className="service-box-meta">
                      {type.duration && <span>{type.duration} דק׳</span>}
                      {type.price > 0 && <span>₪{type.price}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upsell Popup */}
        {showUpsell && selectedType?.relatedServices?.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(4px)' }}>
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '1.5rem',
              maxWidth: '28rem',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
              direction: 'rtl'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                  שירותים משלימים
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  רוצה להוסיף עוד שירות לתור?
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {selectedType.relatedServices.map(rs => {
                  const isSelected = additionalServices.find(s => s._id === rs._id);
                  return (
                    <div
                      key={rs._id}
                      onClick={() => toggleAdditionalService(rs)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        borderRadius: '1rem',
                        border: isSelected ? '2px solid var(--primary-color, #6366f1)' : '2px solid #e2e8f0',
                        background: isSelected ? 'rgba(99,102,241,0.05)' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '0.5rem',
                        border: isSelected ? 'none' : '2px solid #cbd5e1',
                        background: isSelected ? 'var(--primary-color, #6366f1)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected && <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{rs.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                          {rs.duration} דק׳ {rs.price > 0 && `• ₪${rs.price}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {additionalServices.length > 0 && (
                <div style={{
                  background: 'rgba(99,102,241,0.05)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  color: '#4f46e5',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  סה״כ: {getTotalDuration()} דק׳ • ₪{getTotalPrice()}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={confirmUpsell}
                  className="btn-primary-glass"
                  style={{ width: '100%' }}
                >
                  {additionalServices.length > 0 ? `המשך עם ${additionalServices.length + 1} שירותים` : 'המשך'}
                </button>
                {additionalServices.length > 0 && (
                  <button
                    onClick={skipUpsell}
                    className="btn-secondary-glass"
                    style={{ width: '100%' }}
                  >
                    המשך בלי תוספות
                  </button>
                )}
                {additionalServices.length === 0 && (
                  <button
                    onClick={skipUpsell}
                    className="btn-secondary-glass"
                    style={{ width: '100%' }}
                  >
                    לא תודה, המשך
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div>
            <h3 className="section-header">בחר תאריך ושעה</h3>

            {/* Calendar */}
            <div className="calendar-card">
              <div className="calendar-top">
                <button
                  className="calendar-nav-btn"
                  onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, 'month'))}
                >‹

                </button>
                <span className="month-label">{currentMonth.format('MMMM YYYY')}</span>
                <button
                  className="calendar-nav-btn"
                  onClick={() => setCurrentMonth(currentMonth.clone().add(1, 'month'))}
                >
                  ›
                </button>
              </div>

              {/* Day headers - RTL: ראשון on right, שבת on left */}
              <div className="calendar-grid-header">
                {DAY_HEADERS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              {/* Calendar days grid - RTL direction */}
              <div className="calendar-grid">
                {renderCalendar().map((day, idx) => (
                  <div
                    key={idx}
                    className={`calendar-day ${day.isPadding ? 'padding' : ''} ${!day.isPadding && isSelected(day.date) ? 'selected' : ''} ${!day.isPadding && isToday(day.date) ? 'today' : ''} ${!day.isPadding && isPast(day.date) ? 'disabled' : ''}`}
                    onClick={() => !day.isPadding && !isPast(day.date) && setFormData({ ...formData, date: day.date.format('YYYY-MM-DD'), time: '' })}
                  >
                    {day.isPadding ? '' : day.date.date()}
                  </div>
                ))}
              </div>
            </div>

            {/* Hebrew Date */}
            {hebrewDate && (
              <div className="hebrew-date-badge">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{hebrewDate}</span>
              </div>
            )}

            {/* Time Selection */}
            <h3 className="section-header">בחר שעה</h3>
            {loadingTimes ? (
              <div className="loading-spinner"><div /></div>
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
              <div className="empty-times">
                <p>אין תורים פנויים לתאריך זה</p>
                <p>נסה לבחור תאריך אחר</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer Details */}
        {step === 3 && (
          <div>
            <h3 className="section-header">פרטים אחרונים</h3>
            <div className="glass-input-group">
              <div className="glass-field">
                <label className="glass-label">שם מלא</label>
                <input
                  type="text"
                  name="customerName"
                  className="glass-input"
                  placeholder="הכנס שם מלא"
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
                  style={{ textAlign: 'left' }}
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
                  style={{ textAlign: 'left' }}
                  placeholder="name@example.com"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Booking Summary */}
            <div className="summary-card">
              <p className="summary-card-title">{selectedType?.name}</p>
              {additionalServices.length > 0 && (
                <div style={{ fontSize: '0.85rem', color: '#6366f1', marginBottom: '0.25rem' }}>
                  + {additionalServices.map(s => s.name).join(', ')}
                </div>
              )}
              <div className="summary-card-detail">
                <p>{moment(formData.date).format('dddd, D בMMMM YYYY')} • {formData.time}</p>
                {hebrewDate && <p>{hebrewDate}</p>}
                <p>{getTotalDuration()} דקות • ₪{getTotalPrice()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="success-view-new">
            <div className="success-icon-wrapper">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.025em', color: '#0f172a' }}>
              התור נקבע בהצלחה!
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.6 }}>
              {selectedType?.name} • {moment(formData.date).format('dddd, D בMMMM')}
              <br />
              בשעה {formData.time}
            </p>
            {hebrewDate && (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                {hebrewDate}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '1.5rem' }}>
              <a
                href={generateGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary-glass"
              >
                <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                הוסף ליומן Google
              </a>
              <button
                className="btn-secondary-glass"
                onClick={() => window.location.reload()}
              >
                קבע תור נוסף
              </button>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        {step > 1 && step < 4 && (
          <div className="nav-footer">
            <button
              className="btn-primary-glass"
              disabled={
                (step === 2 && !formData.time) ||
                (step === 3 && (!formData.customerName || !formData.customerPhone || bookingLoading))
              }
              onClick={() => {
                if (step === 3) handleSubmit();
                else setStep(step + 1);
              }}
            >
              {bookingLoading ? (
                <>
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  שולח...
                </>
              ) : step === 3 ? 'אישור וקביעת תור' : 'המשך'}
            </button>
            <button className="btn-secondary-glass" onClick={() => setStep(step - 1)}>
              חזור
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBooking;
