import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { HDate } from '@hebcal/core';

const services = [
  { value: 'gel_nails', label: 'ציפורניים ג׳ל' },
  { value: 'nail_treatment', label: 'טיפול בציפורניים' },
  { value: 'manicure', label: 'מניקור' },
  { value: 'pedicure', label: 'פדיקור' },
];

const AppointmentScheduler = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    service: '',
    date: '',
    time: '',
  });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hebrewDate, setHebrewDate] = useState('');

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      try {
        const res = await axios.get(`/api/available-times`, {
          params: { date: formData.date },
        });
        setAvailableTimes(res.data.times || generateDefaultTimes());
      } catch (err) {
        setAvailableTimes(generateDefaultTimes());
      }
    };

    if (formData.date) {
      const date = new Date(formData.date);
      const hDate = new HDate(date);
      setHebrewDate(hDate.renderGematriya());
      fetchAvailableTimes();
    }
  }, [formData.date]);

  const generateDefaultTimes = () => {
    const times = [];
    for (let hour = 9; hour <= 17; hour++) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const appointmentData = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        service: services.find((s) => s.value === formData.service)?.label,
        date: dateTime,
      };

      await axios.post('/api/events', appointmentData);
      toast.success('התור נקבע בהצלחה! 🎉');
      setFormData({
        customerName: '',
        phoneNumber: '',
        service: '',
        date: '',
        time: '',
      });
      setHebrewDate('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה בקביעת התור');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="appointment-container">
      <div className="appointment-card">
        <div className="appointment-header">
          <h1>קביעת תור</h1>
          <p>מלא את הפרטים הבאים לקביעת תור</p>
        </div>

        <form onSubmit={handleSubmit} className="appointment-form">
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
            <label htmlFor="phoneNumber">טלפון *</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="הכנס מספר טלפון"
              required
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label htmlFor="service">סוג שירות *</label>
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={handleChange}
              required
            >
              <option value="">בחר שירות</option>
              {services.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </select>
          </div>

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

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'קובע תור...' : 'קבע תור'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
