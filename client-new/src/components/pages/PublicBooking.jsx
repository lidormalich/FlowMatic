import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { HDate } from '@hebcal/core';
import SkeletonLoader from '../common/SkeletonLoader';

const PublicBooking = () => {
  const { username } = useParams();
  const [businessOwner, setBusinessOwner] = useState(null);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: '',
    time: '',
  });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [hebrewDate, setHebrewDate] = useState('');

  useEffect(() => {
    fetchBusinessOwner();
  }, [username]);

  useEffect(() => {
    if (formData.date && selectedType) {
      fetchAvailableTimes();
      const date = new Date(formData.date);
      const hDate = new HDate(date);
      setHebrewDate(hDate.renderGematriya());
    }
  }, [formData.date, selectedType]);

  const fetchBusinessOwner = async () => {
    try {
      // Fetch business owner details
      const userRes = await axios.get(`/api/users/public/${username}`);
      setBusinessOwner(userRes.data);

      // Fetch appointment types
      const typesRes = await axios.get(`/api/appointment-types/user/${username}`);
      setAppointmentTypes(typesRes.data);

      setLoading(false);
    } catch (err) {
      toast.error('לא נמצא עסק עם שם משתמש זה');
      setLoading(false);
    }
  };

  const fetchAvailableTimes = async () => {
    try {
      const res = await axios.get(`/api/appointments/available/${username}`, {
        params: {
          date: formData.date,
          duration: selectedType?.duration || 60,
        },
      });
      setAvailableTimes(res.data.times || generateDefaultTimes());
    } catch (err) {
      setAvailableTimes(generateDefaultTimes());
    }
  };

  const generateDefaultTimes = () => {
    if (!businessOwner) return [];

    const times = [];
    const startHour = businessOwner.businessHours?.startHour || 9;
    const endHour = businessOwner.businessHours?.endHour || 17;

    for (let hour = startHour; hour < endHour; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return times;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setFormData({ ...formData, time: '' }); // Reset time when type changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedType) {
      toast.error('נא לבחור סוג תור');
      return;
    }

    setBookingLoading(true);

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const appointmentData = {
        businessOwnerId: businessOwner._id,
        appointmentTypeId: selectedType._id,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        date: dateTime,
        startTime: formData.time,
        duration: selectedType.duration,
        service: selectedType.name,
        price: selectedType.price,
      };

      await axios.post(`/api/appointments/public/${username}`, appointmentData);

      toast.success('התור נקבע בהצלחה! 🎉');

      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        date: '',
        time: '',
      });
      setSelectedType(null);
      setHebrewDate('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה בקביעת התור');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="public-booking-container p-4">
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (!businessOwner) {
    return (
      <div className="public-booking-container">
        <div className="error-message">העסק לא נמצא</div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="public-booking-container">
      <div className="public-booking-header">
        <h1>{businessOwner.businessName || businessOwner.name}</h1>
        {businessOwner.businessDescription && (
          <p className="business-description">{businessOwner.businessDescription}</p>
        )}
        {businessOwner.phoneNumber && (
          <p className="business-contact">📞 {businessOwner.phoneNumber}</p>
        )}
      </div>

      <div className="booking-content">
        {/* Appointment Types Selection */}
        <div className="appointment-types-section">
          <h2>בחר סוג תור</h2>
          <div className="appointment-types-grid">
            {appointmentTypes.map((type) => (
              <div
                key={type._id}
                className={`appointment-type-card ${selectedType?._id === type._id ? 'selected' : ''}`}
                onClick={() => handleTypeSelect(type)}
                style={{ '--type-color': type.color }}
              >
                <h3>{type.name}</h3>
                {type.description && <p className="type-description">{type.description}</p>}
                <div className="type-details">
                  <span className="type-duration">⏱️ {type.duration} דקות</span>
                  {type.price > 0 && <span className="type-price">💰 ₪{type.price}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        {selectedType && (
          <div className="booking-form-section">
            <h2>פרטים לקביעת תור</h2>
            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="customerName">שם מלא *</label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="הכנס את שמך המלא"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customerPhone">טלפון *</label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="050-1234567"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="customerEmail">אימייל (אופציונלי)</label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  dir="ltr"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">תאריך *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={today}
                    required
                  />
                  {hebrewDate && (
                    <div className="hebrew-date">תאריך עברי: {hebrewDate}</div>
                  )}
                </div>

                {formData.date && availableTimes.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="time">שעה *</label>
                    <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                    >
                      <option value="">בחר שעה</option>
                      {availableTimes.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" className="submit-button" disabled={bookingLoading}>
                {bookingLoading ? 'קובע תור...' : 'קבע תור'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBooking;
