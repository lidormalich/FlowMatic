import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/he';
import SkeletonLoader from '../common/SkeletonLoader';
import { formatHebrewDate } from '../../utils/hebrewDate';
import { fetchHebcalData, getCachedMonth, setCachedMonth } from '../../services/hebcal';
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
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showTimesModal, setShowTimesModal] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(moment());
  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerPhone: user?.phoneNumber || '',
    customerEmail: user?.email || '',
    date: moment().format('YYYY-MM-DD'),
    time: '',
  });

  const [hebrewDate, setHebrewDate] = useState('');
  const [hebcalEvents, setHebcalEvents] = useState({});

  const showHebrewInBooking = businessOwner?.showHebrewDateInBooking || businessOwner?.showHebrewDate || false;
  const hebCalSettings = businessOwner?.hebrewCalendar || { showHolidays: true, showShabbat: true, showEvents: true };

  useEffect(() => {
    fetchBusinessOwner();
  }, [username]);

  useEffect(() => {
    if (formData.date && showHebrewInBooking) {
      setHebrewDate(formatHebrewDate(new Date(formData.date)));
    } else {
      setHebrewDate('');
    }
  }, [formData.date, showHebrewInBooking]);

  // Fetch Hebcal data for calendar
  useEffect(() => {
    if (!showHebrewInBooking) return;
    const loadHebcal = async () => {
      try {
        const y = currentMonth.year();
        const m = currentMonth.month();
        const cacheKey = `${y}-${m}`;
        let data = getCachedMonth(cacheKey);
        if (!data) {
          data = await fetchHebcalData(y, m);
          setCachedMonth(cacheKey, data);
        }
        const grouped = {};
        data.forEach(event => {
          const dateKey = event.date.split('T')[0];
          if (!grouped[dateKey]) grouped[dateKey] = { holidays: [], shabbat: null };
          if (event.category === 'holiday' && (hebCalSettings.showHolidays || hebCalSettings.showEvents)) {
            grouped[dateKey].holidays.push(event.hebrew);
          } else if ((event.category === 'candles' || event.category === 'havdalah') && hebCalSettings.showShabbat) {
            grouped[dateKey].shabbat = event.time || event.hebrew;
          }
        });
        setHebcalEvents(grouped);
      } catch (err) {
        console.error('Failed to load Hebcal data for booking:', err);
      }
    };
    loadHebcal();
  }, [currentMonth, showHebrewInBooking, hebCalSettings.showHolidays, hebCalSettings.showShabbat, hebCalSettings.showEvents]);

  useEffect(() => {
    if (formData.date && businessOwner && selectedType && showTimesModal) {
      fetchAvailableTimes();
    }
  }, [formData.date, selectedType, businessOwner, additionalServices, selectedStaff, showTimesModal]);

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

      try {
        const staffRes = await axios.get(`/api/staff/public/${username}`);
        setStaffMembers(staffRes.data || []);
      } catch (e) { /* Staff endpoint may not exist yet */ }

      setLoading(false);
    } catch (err) {
      toast.error('העסק לא נמצא');
      setLoading(false);
    }
  };

  const fetchAvailableTimes = async () => {
    setLoadingTimes(true);
    try {
      const params = {
        date: formData.date,
        duration: getTotalDuration() || selectedType?.duration || 60,
      };
      if (selectedStaff) params.staffId = selectedStaff._id;
      const res = await axios.get(`/api/appointments/available/${username}`, { params });
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
    setSelectedStaff(null);
    const serviceStaff = staffMembers.filter(s => s.services?.includes(type._id));
    if (type.relatedServices?.length > 0) {
      setShowUpsell(true);
    } else if (serviceStaff.length > 1) {
      setStep(1.5);
    } else {
      if (serviceStaff.length === 1) setSelectedStaff(serviceStaff[0]);
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

  const goAfterUpsell = () => {
    const serviceStaff = staffMembers.filter(s => s.services?.includes(selectedType?._id));
    if (serviceStaff.length > 1) {
      setStep(1.5);
    } else {
      if (serviceStaff.length === 1) setSelectedStaff(serviceStaff[0]);
      setStep(2);
    }
  };

  const confirmUpsell = () => {
    setShowUpsell(false);
    goAfterUpsell();
  };

  const skipUpsell = () => {
    setAdditionalServices([]);
    setShowUpsell(false);
    goAfterUpsell();
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

  const handleDateSelect = (date) => {
    setFormData({ ...formData, date: date.format('YYYY-MM-DD'), time: '' });
    setShowTimesModal(true);
  };

  const handleTimeSelect = (time) => {
    setFormData(prev => ({ ...prev, time }));
    setShowTimesModal(false);
    setStep(3);
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
        staffId: selectedStaff?._id || null,
      };

      await axios.post(`/api/appointments/public/${username}`, appointmentData);
      // Prompt push notifications after successful booking
      localStorage.removeItem('pushBannerDismissed');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה בקביעת התור');
    } finally {
      setBookingLoading(false);
    }
  };

  // Calendar
  const renderCalendar = () => {
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const days = [];

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
        <div className="booking-card" style={{ opacity: 0.5, justifyContent: 'center', alignItems: 'center' }}>
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
        {/* Header - Fixed top */}
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

        {/* Step Dots - Fixed */}
        {step < 4 && (
          <div className="steps-wrapper">
            <div className="steps-bar">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`step-dot ${s === Math.floor(step) ? 'active' : ''} ${s < Math.floor(step) ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="booking-content">
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

          {/* Step 1.5: Staff Selection */}
          {step === 1.5 && selectedType && (
            <div>
              <h3 className="section-header">בחר מטפל</h3>
              <div className="service-grid-new">
                {staffMembers.filter(s => s.services?.includes(selectedType._id)).map(staff => (
                  <div
                    key={staff._id}
                    className={`service-box ${selectedStaff?._id === staff._id ? 'selected' : ''}`}
                    onClick={() => { setSelectedStaff(staff); setStep(2); }}
                  >
                    <div className="service-box-icon" style={{ backgroundColor: staff.color || '#667eea', width: '3rem', height: '3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>
                      {staff.name.charAt(0)}
                    </div>
                    <div className="service-box-info">
                      <span className="service-box-name">{staff.name}</span>
                      <span className="service-box-desc">{staff.role}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button className="btn-secondary-glass" onClick={() => setStep(1)}>חזור</button>
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
                    const isChecked = additionalServices.find(s => s._id === rs._id);
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
                          border: isChecked ? '2px solid var(--primary-color, #6366f1)' : '2px solid #e2e8f0',
                          background: isChecked ? 'rgba(99,102,241,0.05)' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '0.5rem',
                          border: isChecked ? 'none' : '2px solid #cbd5e1',
                          background: isChecked ? 'var(--primary-color, #6366f1)' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isChecked && <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
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

          {/* Step 2: Date Selection (Calendar only - times in modal) */}
          {step === 2 && (
            <div>
              <h3 className="section-header">בחר תאריך</h3>

              {/* Calendar */}
              <div className="calendar-card">
                <div className="calendar-top">
                  <button
                    className="calendar-nav-btn"
                    onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, 'month'))}
                  >‹</button>
                  <span className="month-label">{currentMonth.format('MMMM YYYY')}</span>
                  <button
                    className="calendar-nav-btn"
                    onClick={() => setCurrentMonth(currentMonth.clone().add(1, 'month'))}
                  >›</button>
                </div>

                <div className="calendar-grid-header">
                  {DAY_HEADERS.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="calendar-grid">
                  {renderCalendar().map((day, idx) => {
                    const dateKey = !day.isPadding ? day.date.format('YYYY-MM-DD') : '';
                    const dayHebcal = dateKey ? hebcalEvents[dateKey] : null;
                    const hasHoliday = dayHebcal?.holidays?.length > 0;
                    return (
                      <div
                        key={idx}
                        className={`calendar-day ${day.isPadding ? 'padding' : ''} ${!day.isPadding && isSelected(day.date) ? 'selected' : ''} ${!day.isPadding && isToday(day.date) ? 'today' : ''} ${!day.isPadding && isPast(day.date) ? 'disabled' : ''}`}
                        onClick={() => !day.isPadding && !isPast(day.date) && handleDateSelect(day.date)}
                        title={hasHoliday ? dayHebcal.holidays.join(', ') : ''}
                      >
                        {!day.isPadding && (
                          <>
                            <span>{day.date.date()}</span>
                            {showHebrewInBooking && (
                              <span style={{ display: 'block', fontSize: '0.55rem', lineHeight: 1, color: hasHoliday ? '#ea580c' : '#94a3b8', marginTop: '1px', fontWeight: hasHoliday ? 600 : 400 }}>
                                {hasHoliday ? dayHebcal.holidays[0].substring(0, 8) : formatHebrewDate(day.date.toDate()).split(' ')[0]}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
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

              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                לחץ על תאריך לצפייה בשעות הפנויות
              </p>
            </div>
          )}

          {/* Step 3: Customer Details */}
          {step === 3 && (
            <div className="step3-container">
              {/* Booking Summary Card - Top */}
              <div className="step3-summary">
                <div className="step3-summary-header">
                  <div className="step3-summary-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="step3-summary-info">
                    <span className="step3-summary-service">{selectedType?.name}</span>
                    {additionalServices.length > 0 && (
                      <span className="step3-summary-extras">+ {additionalServices.map(s => s.name).join(', ')}</span>
                    )}
                  </div>
                </div>
                <div className="step3-summary-details">
                  <div className="step3-summary-row">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>{moment(formData.date).format('dddd, D בMMMM YYYY')}</span>
                  </div>
                  <div className="step3-summary-row">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{formData.time} • {getTotalDuration()} דקות</span>
                  </div>
                  {hebrewDate && (
                    <div className="step3-summary-row">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      <span>{hebrewDate}</span>
                    </div>
                  )}
                  <div className="step3-summary-price">
                    ₪{getTotalPrice()}
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="step3-form-section">
                <h3 className="step3-form-title">פרטי הלקוח</h3>
                <div className="step3-form-group">
                  <div className="step3-field">
                    <div className="step3-field-icon">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="step3-field-content">
                      <label className="step3-label">שם מלא</label>
                      <input
                        type="text"
                        name="customerName"
                        className="step3-input"
                        placeholder="הכנס שם מלא"
                        value={formData.customerName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="step3-divider" />
                  <div className="step3-field">
                    <div className="step3-field-icon">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <div className="step3-field-content">
                      <label className="step3-label">טלפון</label>
                      <input
                        type="tel"
                        name="customerPhone"
                        className="step3-input"
                        dir="ltr"
                        style={{ textAlign: 'left' }}
                        placeholder="05X-XXXXXXX"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="step3-divider" />
                  <div className="step3-field">
                    <div className="step3-field-icon">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="step3-field-content">
                      <label className="step3-label">אימייל <span className="step3-optional">(אופציונלי)</span></label>
                      <input
                        type="email"
                        name="customerEmail"
                        className="step3-input"
                        dir="ltr"
                        style={{ textAlign: 'left' }}
                        placeholder="name@example.com"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
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
        </div>

        {/* Navigation Footer - Fixed bottom */}
        {step >= 2 && step < 4 && (
          <div className="nav-footer" style={{ direction: 'ltr' }}>
            <button
              className="btn-primary-glass"
              disabled={
                (step === 2) ||
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
            <button className="btn-secondary-glass" onClick={() => setStep(step === 2 ? 1 : step - 1)}>
              חזור
            </button>
          </div>
        )}
      </div>

      {/* Times Modal - iOS style slide-up */}
      {showTimesModal && step === 2 && (
        <div className="times-modal-overlay" onClick={() => setShowTimesModal(false)}>
          <div className="times-modal" onClick={(e) => e.stopPropagation()}>
            <div className="times-modal-handle" />
            <div className="times-modal-header">
              <div className="times-modal-title">
                {moment(formData.date).format('dddd, D בMMMM YYYY')}
              </div>
              {hebrewDate && (
                <div className="times-modal-subtitle">{hebrewDate}</div>
              )}
              <div className="times-modal-subtitle" style={{ marginTop: '0.25rem' }}>
                {selectedType?.name} • {getTotalDuration()} דק׳
              </div>
            </div>
            <div className="times-modal-body">
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
            <button className="times-modal-close" onClick={() => setShowTimesModal(false)}>
              חזור ללוח שנה
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBooking;
