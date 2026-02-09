import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { staffApi, appointmentTypesApi } from '../../services/api';
import SkeletonLoader from '../common/SkeletonLoader';

const Staff = () => {
    const [staff, setStaff] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        color: '#667eea',
        services: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [staffData, servicesData] = await Promise.all([
                staffApi.getAll(),
                appointmentTypesApi.getAll()
            ]);
            setStaff(Array.isArray(staffData) ? staffData : []);
            setServices(Array.isArray(servicesData) ? servicesData : []);
        } catch (error) {
            console.error('Error fetching staff data:', error);
            toast.error('שגיאה בטעינת נתונים');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceToggle = (serviceId) => {
        setFormData(prev => {
            const currentServices = prev.services || [];
            if (currentServices.includes(serviceId)) {
                return { ...prev, services: currentServices.filter(id => id !== serviceId) };
            } else {
                return { ...prev, services: [...currentServices, serviceId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            toast.error('שם וטלפון הם שדות חובה');
            return;
        }

        try {
            if (editingStaff) {
                await staffApi.update(editingStaff._id, formData);
                toast.success('פרטי איש צוות עודכנו בהצלחה');
            } else {
                await staffApi.create(formData);
                toast.success('איש צוות נוסף בהצלחה');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving staff:', error);
            toast.error('שגיאה בשמירת נתונים');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק איש צוות זה?')) return;
        try {
            await staffApi.delete(id);
            toast.success('איש צוות נמחק בהצלחה');
            setStaff(prev => prev.filter(s => s._id !== id));
        } catch (error) {
            console.error('Error deleting staff:', error);
            toast.error('שגיאה במחיקת איש צוות');
        }
    };

    const openModal = (staffMember = null) => {
        if (staffMember) {
            setEditingStaff(staffMember);
            setFormData({
                name: staffMember.name,
                role: staffMember.role || '',
                phone: staffMember.phone,
                email: staffMember.email || '',
                color: staffMember.color || '#667eea',
                services: staffMember.services || []
            });
        } else {
            setEditingStaff(null);
            setFormData({
                name: '',
                role: '',
                phone: '',
                email: '',
                color: '#667eea',
                services: []
            });
        }
        setShowModal(true);
    };

    if (loading) return <SkeletonLoader />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">ניהול צוות</h1>
                    <p className="text-gray-600">נהל את אנשי הצוות וההרשאות שלהם</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-lg"
                >
                    ➕ הוסף איש צוות
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map(member => (
                    <div key={member._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-2" style={{ backgroundColor: member.color }}></div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
                                    <p className="text-sm text-gray-500">{member.role || 'איש צוות'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(member)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full">✏️</button>
                                    <button onClick={() => handleDelete(member._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full">🗑️</button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <span>📱</span>
                                    <span>{member.phone}</span>
                                </div>
                                {member.email && (
                                    <div className="flex items-center gap-2">
                                        <span>📧</span>
                                        <span>{member.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-xs font-semibold text-gray-500 mb-2">תחומי התמחות:</p>
                                <div className="flex flex-wrap gap-2">
                                    {member.services && member.services.length > 0 ? (
                                        member.services.map(serviceId => {
                                            const service = services.find(s => s._id === serviceId);
                                            return service ? (
                                                <span key={serviceId} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                                    {service.name}
                                                </span>
                                            ) : null;
                                        })
                                    ) : (
                                        <span className="text-gray-400 text-xs">אין התמחויות מוגדרות</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {staff.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
                        <p className="text-gray-500 text-lg">עדיין לא הוגדרו אנשי צוות</p>
                        <button onClick={() => openModal()} className="text-primary mt-2 hover:underline">הוסף את הראשון</button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-primary p-6 text-white flex justify-between items-center">
                            <h2 className="text-2xl font-bold">{editingStaff ? 'עריכת איש צוות' : 'הוספת איש צוות'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-white hover:bg-white/20 p-2 rounded-full">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-right mb-2 font-medium">שם מלא *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg text-right"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-right mb-2 font-medium">תפקיד</label>
                                    <input
                                        type="text"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg text-right"
                                        placeholder="לדוגמה: ספר, קוסמטיקאית"
                                    />
                                </div>
                                <div>
                                    <label className="block text-right mb-2 font-medium">טלפון *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg text-right"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-right mb-2 font-medium">אימייל</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-right mb-2 font-medium">צבע זיהוי</label>
                                    <input
                                        type="color"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleInputChange}
                                        className="w-full h-10 border rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-right mb-2 font-medium">טיפולים מורשים</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {services.map(service => (
                                        <div
                                            key={service._id}
                                            onClick={() => handleServiceToggle(service._id)}
                                            className={`cursor-pointer p-2 rounded-lg border text-right transition-colors ${formData.services.includes(service._id)
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.services.includes(service._id) ? 'bg-primary border-primary' : 'border-gray-300'
                                                    }`}>
                                                    {formData.services.includes(service._id) && <span className="text-white text-xs">✓</span>}
                                                </div>
                                                <span className="text-sm">{service.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-white bg-primary rounded-lg hover:bg-primary-dark"
                                >
                                    {editingStaff ? 'שמור שינויים' : 'צור איש צוות'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;
