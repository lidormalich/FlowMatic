import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useAppointmentTypes } from '../../hooks/useAppointmentTypes';

const AppointmentTypes = () => {
  const { user } = useContext(AuthContext);
  const {
    appointmentTypes,
    isLoading: loading,
    createAppointmentType,
    updateAppointmentType,
    deleteAppointmentType
  } = useAppointmentTypes();

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    color: '#667eea',
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentType(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      duration: 30,
      price: 0,
      color: '#667eea',
    });
    setShowModal(true);
  };

  const openEditModal = (type) => {
    setEditMode(true);
    setCurrentType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      category: type.category || '',
      duration: type.duration,
      price: type.price || 0,
      color: type.color || '#667eea',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('שם השירות הוא שדה חובה');
      return;
    }
    if (formData.duration < 1) {
      toast.error('משך הזמן חייב להיות לפחות דקה אחת');
      return;
    }

    if (editMode) {
      updateAppointmentType({ id: currentType._id, data: formData });
    } else {
      createAppointmentType(formData);
    }

    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק סוג תור זה?')) {
      return;
    }
    deleteAppointmentType(id);
  };

  const handleToggleActive = async (type) => {
    updateAppointmentType({
      id: type._id,
      data: {
        ...type,
        isActive: !type.isActive,
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600 text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">סוגי תורים</h1>
          <p className="text-gray-600">נהל את סוגי השירותים והתורים שלך</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-primary to-secondary text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          ➕ הוסף סוג תור חדש
        </button>
      </div>

      {/* Grid */}
      {appointmentTypes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">אין סוגי תורים עדיין</h3>
          <p className="text-gray-600 mb-6">התחל ביצירת סוג התור הראשון שלך</p>
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-primary to-secondary text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            ➕ צור סוג תור חדש
          </button>
          <div className="mt-4">
            <button
              onClick={() => {
                createAppointmentType({ name: 'פגישת היכרות', duration: 30, price: 0, color: '#667eea', description: 'פגישה ראשונית להכרות ותיאום ציפיות' });
                createAppointmentType({ name: 'טיפול רגיל', duration: 60, price: 150, color: '#ed64a6', description: 'טיפול סטנדרטי' });
              }}
              className="text-gray-500 hover:text-primary underline text-sm"
            >
              או צור סוגי תורים לדוגמה (אוטומטי)
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointmentTypes.map((type) => (
            <div
              key={type._id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-2xl transform hover:-translate-y-1 ${!type.isActive ? 'opacity-60' : ''
                }`}
            >
              {/* Color Bar */}
              <div
                className="h-3"
                style={{ backgroundColor: type.color }}
              ></div>

              <div className="p-6">
                {/* Name and Status */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-2xl font-bold text-gray-800">{type.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${type.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    {type.isActive ? 'פעיל' : 'מושבת'}
                  </span>
                </div>

                {/* Description */}
                {type.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{type.description}</p>
                )}

                {type.category && (
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mb-4">
                    {type.category}
                  </span>
                )}

                {/* Info */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-700">
                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>{type.duration} דקות</span>
                  </div>
                  {type.price > 0 && (
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      <span>₪{type.price}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => openEditModal(type)}
                    className="flex-1 bg-blue-50 text-blue-600 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    ✏️ עריכה
                  </button>
                  <button
                    onClick={() => handleToggleActive(type)}
                    className={`flex-1 font-semibold px-4 py-2 rounded-lg transition-colors ${type.isActive
                      ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                  >
                    {type.isActive ? '⏸️ השבת' : '▶️ הפעל'}
                  </button>
                  <button
                    onClick={() => handleDelete(type._id)}
                    className="flex-1 bg-red-50 text-red-600 font-semibold px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    🗑️ מחק
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <h2 className="text-3xl font-bold">
                {editMode ? 'עריכת סוג תור' : 'יצירת סוג תור חדש'}
              </h2>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Name */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2 text-right">
                  שם השירות <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  placeholder="לדוגמה: תספורת, עיסוי, ייעוץ"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2 text-right">
                  תיאור
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  placeholder="תיאור קצר של השירות"
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2 text-right">
                  קטגוריה
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  placeholder="לדוגמה: תספורות, צבע, טיפולים"
                />
              </div>

              {/* Duration and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    משך זמן (דקות) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">
                    מחיר (₪)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />
                </div>
              </div>

              {/* Color */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2 text-right">
                  צבע (ליומן)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="h-12 w-20 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-gray-600">{formData.color}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {editMode ? '💾 שמור שינויים' : '➕ צור סוג תור'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ❌ ביטול
                </button>
              </div>
            </form>
          </div >
        </div >
      )}
    </div >
  );
};

export default AppointmentTypes;
