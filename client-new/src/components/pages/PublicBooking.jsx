import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/he';
import SkeletonLoader from '../common/SkeletonLoader';
import { formatHebrewDate } from '../../utils/hebrewDate';
import './PublicBooking.css';

moment.locale('he');

const PublicBooking = () => {
  const { username } = useParams();
  const [step, setStep] = useState(1); // 1: Service, 2: Date/Time, 3: Details, 4: Success
  const [loading, setLoading] = useState(true);
  const [businessOwner, setBusinessOwner] = useState(null);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
  });

  const [hebrewDate, setHebrewDate] = useState('');

  useEffect(() => {
    fetchBusinessOwner();
  }, [username]);

  useEffect(() => {
    if (formData.date && businessOwner && selectedType) {
      fetchAvailableTimes();
      if (businessOwner.showHebrewDate) {
        setHebrewDate(formatHebrewDate(new Date(formData.date)));
      }
    }
  }, [formData.date, selectedType, businessOwner]);

  const fetchBusinessOwner = async () => {
    try {
      const userRes = await axios.get(`/api/users/public/${username}`);
      setBusinessOwner(userRes.data);

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

  const handleDateChange = (e) => {
    setFormData({ ...formData, date: e.target.value, time: '' });
  };

  const handleTimeSelect = (time) => {
    setFormData({ ...formData, time });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  if (loading) {
    return (
      <div className="public-booking-page">
        <div className="booking-card p-12">
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  if (!businessOwner) {
    return (
      <div className="public-booking-page">
        <div className="booking-card p-12 text-center">
          <h2 className="text-2xl font-bold text-red-500">העסק לא נמצא</h2>
          <p className="text-gray-600">בדוק את הקישור ונסה שוב</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-booking-page">
      <div className="booking-card">
        {step < 4 && (
          <>
            <div className="booking-header">
              <h1>{businessOwner.businessName || businessOwner.name}</h1>
              <p>{businessOwner.businessDescription || 'קביעת תור בקלות ובמהירות'}</p>
            </div>

            <div className="booking-steps">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`step-dot ${step === s ? 'active' : ''}`} />
              ))}
            </div>
          </>
        )}

        <div className="booking-body">
          {step === 1 && (
            <div className="service-selection">
              <h2 className="text-xl font-bold mb-6 text-center">איזה שירות תרצה לקבל?</h2>
              <div className="service-grid">
                {appointmentTypes.map((type) => (
                  <div
                    key={type._id}
                    className="service-card"
                    onClick={() => handleServiceSelect(type)}
                  >
                    <div className="service-info text-right">
                      <h3>{type.name}</h3>
                      {type.description && <p>{type.description}</p>}
                    </div>
                    <div className="service-meta">
                      <span className="service-price">₪{type.price}</span>
                      <span className="service-duration">{type.duration} דק׳</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="time-selection">
              <h2 className="text-xl font-bold mb-6 text-center">מתי תרצה להגיע?</h2>
              <div className="calendar-container">
                <div>
                  <label className="form-label-custom text-right">בחר תאריך</label>
                  <input
                    type="date"
                    className="date-input-custom"
                    value={formData.date}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {hebrewDate && (
                    <p className="text-sm text-primary mt-2 text-right font-medium">
                      🇮🇱 {hebrewDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label-custom text-right">בחר שעה פנויה</label>
                  {loadingTimes ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">מחפש תורים פנויים...</p>
                    </div>
                  ) : availableTimes.length > 0 ? (
                    <div className="slots-grid" dir="ltr">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          className={`slot-button ${formData.time === time ? 'selected' : ''}`}
                          onClick={() => handleTimeSelect(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl">
                      <p className="text-gray-500 font-medium">אין תורים פנויים לתאריך זה</p>
                      <p className="text-sm text-gray-400">נסו לבחור תאריך אחר או שירות אחר</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="details-form">
              <h2 className="text-xl font-bold mb-6 text-center">פרטים אחרונים וסיימנו</h2>
              <div className="form-group-custom">
                <label className="form-label-custom text-right">שם מלא *</label>
                <input
                  type="text"
                  name="customerName"
                  required
                  className="form-input-custom text-right"
                  placeholder="הכניסו את שמכם"
                  value={formData.customerName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group-custom">
                <label className="form-label-custom text-right">טלפון *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  required
                  className="form-input-custom"
                  dir="ltr"
                  placeholder="05X-XXXXXXX"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group-custom">
                <label className="form-label-custom text-right">אימייל (אופציונלי)</label>
                <input
                  type="email"
                  name="customerEmail"
                  className="form-input-custom"
                  dir="ltr"
                  placeholder="name@example.com"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                />
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-6 text-right">
                <p className="font-bold text-primary mb-1">סיכום התור:</p>
                <p className="text-sm text-gray-700">
                  {selectedType?.name} עם {businessOwner.name}
                </p>
                <p className="text-sm text-gray-700">
                  בתאריך {moment(formData.date).format('DD/MM/YYYY')} בשעה {formData.time}
                </p>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="success-screen">
              <span className="success-icon">🎉</span>
              <h2>התור נקבע בהצלחה!</h2>
              <p>
                שלחנו לך אישור לטלפון {formData.customerPhone}.<br />
                נשמח לראות אותך בתאריך {moment(formData.date).format('DD/MM/YYYY')} בשעה {formData.time}.
              </p>
              <button
                className="btn-primary-custom w-full"
                onClick={() => window.location.reload()}
              >
                קביעת תור נוסף
              </button>
            </div>
          )}
        </div>

        {step > 1 && step < 4 && (
          <div className="booking-footer">
            {step === 2 && (
              <button
                className="btn-primary-custom"
                disabled={!formData.time}
                onClick={() => setStep(3)}
              >
                המשך לפרטים
              </button>
            )}
            {step === 3 && (
              <button
                className="btn-primary-custom"
                onClick={handleSubmit}
                disabled={bookingLoading || !formData.customerName || !formData.customerPhone}
              >
                {bookingLoading ? 'מעבד...' : 'אשר וקבע תור'}
              </button>
            )}
            <button
              className="btn-secondary-custom"
              onClick={() => setStep(step - 1)}
            >
              חזור
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBooking;
