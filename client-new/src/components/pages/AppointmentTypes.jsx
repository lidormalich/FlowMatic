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
    relatedServices: [],
    images: [],
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleRelatedService = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      relatedServices: prev.relatedServices.includes(serviceId)
        ? prev.relatedServices.filter(id => id !== serviceId)
        : [...prev.relatedServices, serviceId]
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 3 - formData.images.length;
    if (remaining <= 0) {
      toast.error('ניתן להעלות עד 3 תמונות');
      return;
    }
    files.slice(0, remaining).forEach(file => {
      if (file.size > 500 * 1024) {
        toast.error(`הקובץ ${file.name} גדול מדי (מקסימום 500KB)`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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
      relatedServices: [],
      images: [],
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
      relatedServices: type.relatedServices?.map(s => typeof s === 'object' ? s._id : s) || [],
      images: type.images || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">סוגי תורים</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">נהל את סוגי השירותים והתורים שלך</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-600/20 transition-all duration-200 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">הוסף סוג תור</span>
            <span className="sm:hidden">הוסף</span>
          </button>
        </div>

        {/* Grid */}
        {appointmentTypes.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/50 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">אין סוגי תורים עדיין</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm max-w-xs mx-auto">התחל ביצירת סוג התור הראשון שלך כדי שלקוחות יוכלו לקבוע תורים</p>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              צור סוג תור חדש
            </button>
            <div className="mt-4">
              <button
                onClick={() => {
                  createAppointmentType({ name: 'פגישת היכרות', duration: 30, price: 0, color: '#667eea', description: 'פגישה ראשונית להכרות ותיאום ציפיות' });
                  createAppointmentType({ name: 'טיפול רגיל', duration: 60, price: 150, color: '#ed64a6', description: 'טיפול סטנדרטי' });
                }}
                className="text-slate-400 dark:text-slate-500 hover:text-blue-500 text-sm transition-colors"
              >
                או צור סוגי תורים לדוגמה
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointmentTypes.map((type) => (
              <div
                key={type._id}
                className={`group bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 ${!type.isActive ? 'opacity-50 grayscale' : ''}`}
              >
                {/* Color Bar */}
                <div className="h-2" style={{ background: `linear-gradient(135deg, ${type.color}, ${type.color}99)` }} />

                <div className="p-5">
                  {/* Top: Name + Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{type.name}</h3>
                      {type.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{type.description}</p>
                      )}
                    </div>
                    <div className={`flex-shrink-0 mr-3 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${type.isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      {type.isActive ? 'פעיל' : 'מושבת'}
                    </div>
                  </div>

                  {/* Category */}
                  {type.category && (
                    <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-semibold px-3 py-1 rounded-full mb-3">
                      {type.category}
                    </span>
                  )}

                  {/* Info Row */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-xl">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{type.duration} דק׳</span>
                    </div>
                    {type.price > 0 && (
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">₪{type.price}</span>
                      </div>
                    )}
                    {type.price === 0 && (
                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">חינם</span>
                      </div>
                    )}
                  </div>

                  {/* Related Services */}
                  {type.relatedServices?.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">שירותים משלימים</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {type.relatedServices.map((rs) => (
                          <span key={typeof rs === 'object' ? rs._id : rs} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg">
                            {typeof rs === 'object' ? rs.name : appointmentTypes.find(t => t._id === rs)?.name || ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {type.images?.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {type.images.map((img, idx) => (
                        <img key={idx} src={img} alt="" className="w-14 h-14 object-cover rounded-2xl border-2 border-slate-100 dark:border-slate-700" />
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                      onClick={() => openEditModal(type)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold px-3 py-2.5 rounded-2xl text-sm transition-all active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      עריכה
                    </button>
                    <button
                      onClick={() => handleToggleActive(type)}
                      className={`flex-1 flex items-center justify-center gap-1.5 font-semibold px-3 py-2.5 rounded-2xl text-sm transition-all active:scale-95 ${type.isActive
                        ? 'bg-slate-50 dark:bg-slate-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-600 dark:text-slate-400 hover:text-amber-600'
                        : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      {type.isActive ? (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>השבת</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>הפעל</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(type._id)}
                      className="flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 p-2.5 rounded-2xl transition-all active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setShowModal(false)}>
            <div
              className="bg-white dark:bg-slate-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: 'modalSlideUp 0.35s cubic-bezier(0.32,0.72,0,1)' }}
            >
              {/* Handle (mobile) */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pt-4 sm:pt-6 pb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editMode ? 'עריכת סוג תור' : 'סוג תור חדש'}</h2>
                  <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(92vh-100px)] px-6 pb-6 space-y-5">
                {/* Name & Description Group */}
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl overflow-hidden">
                  <div className="px-4 pt-4 pb-1">
                    <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-right mb-1">שם השירות *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-right text-base font-medium placeholder:text-slate-300 focus:ring-0 focus:outline-none p-0"
                      placeholder="לדוגמה: תספורת, עיסוי, ייעוץ"
                      required
                    />
                  </div>
                  <div className="mx-4 border-t border-slate-200/60 dark:border-slate-600/40" />
                  <div className="px-4 pt-3 pb-4">
                    <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-right mb-1">תיאור</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-right text-sm placeholder:text-slate-300 focus:ring-0 focus:outline-none p-0 resize-none"
                      placeholder="תיאור קצר של השירות"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl px-4 py-3">
                  <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-right mb-1">קטגוריה</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-right text-sm font-medium placeholder:text-slate-300 focus:ring-0 focus:outline-none p-0"
                    placeholder="לדוגמה: תספורות, צבע, טיפולים"
                  />
                </div>

                {/* Duration and Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl px-4 py-3">
                    <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-right mb-1">משך זמן (דקות) *</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-right text-lg font-bold placeholder:text-slate-300 focus:ring-0 focus:outline-none p-0"
                      required
                    />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl px-4 py-3">
                    <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-right mb-1">מחיר (₪)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full bg-transparent border-0 text-slate-900 dark:text-white text-right text-lg font-bold placeholder:text-slate-300 focus:ring-0 focus:outline-none p-0"
                    />
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-right mb-2">תמונות שירות (עד 3)</label>
                  <div className="flex gap-3 flex-wrap">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt={`תמונה ${idx + 1}`} className="w-20 h-20 object-cover rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    {formData.images.length < 3 && (
                      <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all">
                        <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] text-slate-400 mt-0.5">הוסף</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Related Services */}
                {appointmentTypes.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-right mb-1">שירותים משלימים (Upsell)</label>
                    <p className="text-[11px] text-slate-400 text-right mb-2">בחר שירותים שיוצעו ללקוח בעת ההזמנה</p>
                    <div className="flex flex-wrap gap-2">
                      {appointmentTypes
                        .filter(t => t._id !== currentType?._id)
                        .map(t => (
                          <button
                            key={t._id}
                            type="button"
                            onClick={() => toggleRelatedService(t._id)}
                            className={`px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
                              formData.relatedServices.includes(t._id)
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {formData.relatedServices.includes(t._id) && (
                              <svg className="w-3.5 h-3.5 inline ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            )}
                            {t.name}
                            {t.price > 0 && <span className="opacity-60 mr-1">(₪{t.price})</span>}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Color */}
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl px-4 py-3">
                  <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-right mb-2">צבע (ליומן)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="h-10 w-14 border-0 rounded-xl cursor-pointer bg-transparent"
                    />
                    <div className="h-8 flex-1 rounded-xl" style={{ background: `linear-gradient(135deg, ${formData.color}, ${formData.color}44)` }} />
                    <span className="text-xs text-slate-400 font-mono" dir="ltr">{formData.color}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-3" style={{ direction: 'ltr' }}>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] text-base"
                  >
                    {editMode ? 'שמור שינויים' : 'צור סוג תור'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-3.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-base"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          @keyframes modalSlideUp {
            from { transform: translateY(100%); opacity: 0.8; }
            to { transform: translateY(0); opacity: 1; }
          }
          @media (min-width: 640px) {
            @keyframes modalSlideUp {
              from { transform: scale(0.92) translateY(20px); opacity: 0; }
              to { transform: scale(1) translateY(0); opacity: 1; }
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AppointmentTypes;
