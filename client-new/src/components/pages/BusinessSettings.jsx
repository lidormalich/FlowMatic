import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const DAYS_OF_WEEK = [
    { value: 0, label: 'א׳', fullLabel: 'ראשון' },
    { value: 1, label: 'ב׳', fullLabel: 'שני' },
    { value: 2, label: 'ג׳', fullLabel: 'שלישי' },
    { value: 3, label: 'ד׳', fullLabel: 'רביעי' },
    { value: 4, label: 'ה׳', fullLabel: 'חמישי' },
    { value: 5, label: 'ו׳', fullLabel: 'שישי' },
    { value: 6, label: 'ש׳', fullLabel: 'שבת' },
];

const BusinessSettings = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('business');

    const [formData, setFormData] = useState({
        // Business Info
        businessName: '',
        businessDescription: '',
        businessAddress: '',
        phoneNumber: '',

        // Working Hours
        businessHours: {
            startHour: 9,
            endHour: 17,
            workingDays: [0, 1, 2, 3, 4],
            slotInterval: 30,
            breakTime: {
                enabled: false,
                startHour: 12,
                startMinute: 0,
                endHour: 13,
                endMinute: 0
            }
        },

        // Display Settings
        showHebrewDate: false,

        // Theme
        themeSettings: {
            primaryColor: '#667eea',
            secondaryColor: '#764ba2',
            logoUrl: ''
        },

        // SMS Settings
        smsNotifications: {
            enabled: true,
            reminderHoursBefore: 24
        },

        // Cancellation Policy
        cancellationPolicy: {
            enabled: true,
            hoursBefore: 24
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/users/profile');
            const userData = response.data;

            setFormData({
                businessName: userData.businessName || '',
                businessDescription: userData.businessDescription || '',
                businessAddress: userData.businessAddress || '',
                phoneNumber: userData.phoneNumber || '',
                businessHours: {
                    startHour: userData.businessHours?.startHour ?? 9,
                    endHour: userData.businessHours?.endHour ?? 17,
                    workingDays: userData.businessHours?.workingDays || [0, 1, 2, 3, 4],
                    slotInterval: userData.businessHours?.slotInterval ?? 30,
                    breakTime: {
                        enabled: userData.businessHours?.breakTime?.enabled ?? false,
                        startHour: userData.businessHours?.breakTime?.startHour ?? 12,
                        startMinute: userData.businessHours?.breakTime?.startMinute ?? 0,
                        endHour: userData.businessHours?.breakTime?.endHour ?? 13,
                        endMinute: userData.businessHours?.breakTime?.endMinute ?? 0
                    }
                },
                showHebrewDate: userData.showHebrewDate ?? false,
                themeSettings: {
                    primaryColor: userData.themeSettings?.primaryColor || '#667eea',
                    secondaryColor: userData.themeSettings?.secondaryColor || '#764ba2',
                    logoUrl: userData.themeSettings?.logoUrl || ''
                },
                smsNotifications: {
                    enabled: userData.smsNotifications?.enabled ?? true,
                    reminderHoursBefore: userData.smsNotifications?.reminderHoursBefore ?? 24
                },
                cancellationPolicy: {
                    enabled: userData.cancellationPolicy?.enabled ?? true,
                    hoursBefore: userData.cancellationPolicy?.hoursBefore ?? 24
                }
            });
            setLoading(false);
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('שגיאה בטעינת ההגדרות');
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/users/${user.id}`, formData);
            toast.success('ההגדרות נשמרו בהצלחה! ✓');
            if (refreshUser) refreshUser();
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('שגיאה בשמירת ההגדרות');
        }
        setSaving(false);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };

    const toggleWorkingDay = (day) => {
        const currentDays = formData.businessHours.workingDays;
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day].sort((a, b) => a - b);

        handleNestedChange('businessHours', 'workingDays', newDays);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('הקובץ גדול מדי. מקסימום 2MB');
            return;
        }

        // For now, we'll use base64 encoding (in production, use proper file upload)
        const reader = new FileReader();
        reader.onload = (event) => {
            handleNestedChange('themeSettings', 'logoUrl', event.target.result);
            toast.success('הלוגו הועלה בהצלחה');
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="animate-pulse">
                    <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-40 bg-gray-200 rounded"></div>
                        <div className="h-40 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'business', label: 'פרטי עסק', icon: '🏢' },
        { id: 'hours', label: 'שעות פעילות', icon: '🕐' },
        { id: 'display', label: 'תצוגה', icon: '🎨' },
        { id: 'notifications', label: 'התראות', icon: '📱' },
        { id: 'policy', label: 'מדיניות', icon: '📋' },
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">הגדרות העסק</h1>
                <p className="text-gray-600">נהל את פרטי העסק, שעות הפעילות וההגדרות</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-lg p-6">

                {/* Business Info Tab */}
                {activeTab === 'business' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">פרטי העסק</h2>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-right">שם העסק</label>
                            <input
                                type="text"
                                value={formData.businessName}
                                onChange={(e) => handleInputChange('businessName', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                                placeholder="שם העסק שלך"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-right">תיאור העסק</label>
                            <textarea
                                value={formData.businessDescription}
                                onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                                rows="4"
                                placeholder="תאר את העסק והשירותים שלך..."
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-right">כתובת</label>
                            <input
                                type="text"
                                value={formData.businessAddress}
                                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                                placeholder="כתובת העסק"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-right">טלפון</label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                dir="ltr"
                                placeholder="05X-XXXXXXX"
                            />
                        </div>
                    </div>
                )}

                {/* Working Hours Tab */}
                {activeTab === 'hours' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">שעות פעילות</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-right">שעת פתיחה</label>
                                <select
                                    value={formData.businessHours.startHour}
                                    onChange={(e) => handleNestedChange('businessHours', 'startHour', parseInt(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-right">שעת סגירה</label>
                                <select
                                    value={formData.businessHours.endHour}
                                    onChange={(e) => handleNestedChange('businessHours', 'endHour', parseInt(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Improved Working Days UI */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-4 text-right">ימי פעילות</label>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="grid grid-cols-7 gap-2">
                                    {DAYS_OF_WEEK.map(day => {
                                        const isActive = formData.businessHours.workingDays.includes(day.value);
                                        return (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => toggleWorkingDay(day.value)}
                                                className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${isActive
                                                        ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg transform scale-105'
                                                        : 'bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-gray-200'
                                                    }`}
                                            >
                                                <span className="text-2xl font-bold">{day.label}</span>
                                                <span className="text-xs mt-1 opacity-80">{day.fullLabel}</span>
                                                {isActive && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                                                        ✓
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-sm text-gray-500 mt-4 text-center">
                                    לחץ על יום כדי להפעיל/לבטל • נבחרו {formData.businessHours.workingDays.length} ימים
                                </p>
                            </div>
                        </div>

                        {/* Slot Interval */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-right">מרווח בין תורים (דקות)</label>
                            <p className="text-sm text-gray-500 mb-3 text-right">כל כמה דקות יוצג סלוט פנוי ללקוח</p>
                            <div className="flex flex-wrap gap-2">
                                {[10, 15, 20, 30, 45, 60].map(interval => (
                                    <button
                                        key={interval}
                                        type="button"
                                        onClick={() => handleNestedChange('businessHours', 'slotInterval', interval)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${formData.businessHours.slotInterval === interval
                                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        {interval} דק׳
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Break Time */}
                        <div>
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                                <div className="text-right">
                                    <h3 className="font-bold text-gray-800 text-lg">☕ הפסקה באמצע היום</h3>
                                    <p className="text-sm text-gray-600 mt-1">הגדר זמן הפסקה שבו לא ניתן לקבוע תורים</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.businessHours.breakTime.enabled}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            businessHours: {
                                                ...prev.businessHours,
                                                breakTime: { ...prev.businessHours.breakTime, enabled: e.target.checked }
                                            }
                                        }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>

                            {formData.businessHours.breakTime.enabled && (
                                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-orange-50 rounded-xl">
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-2 text-right">תחילת הפסקה</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.businessHours.breakTime.startHour}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    businessHours: {
                                                        ...prev.businessHours,
                                                        breakTime: { ...prev.businessHours.breakTime, startHour: parseInt(e.target.value) }
                                                    }
                                                }))}
                                                className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-right"
                                            >
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={formData.businessHours.breakTime.startMinute}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    businessHours: {
                                                        ...prev.businessHours,
                                                        breakTime: { ...prev.businessHours.breakTime, startMinute: parseInt(e.target.value) }
                                                    }
                                                }))}
                                                className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-right"
                                            >
                                                {[0, 15, 30, 45].map(m => (
                                                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-2 text-right">סוף הפסקה</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.businessHours.breakTime.endHour}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    businessHours: {
                                                        ...prev.businessHours,
                                                        breakTime: { ...prev.businessHours.breakTime, endHour: parseInt(e.target.value) }
                                                    }
                                                }))}
                                                className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-right"
                                            >
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={formData.businessHours.breakTime.endMinute}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    businessHours: {
                                                        ...prev.businessHours,
                                                        breakTime: { ...prev.businessHours.breakTime, endMinute: parseInt(e.target.value) }
                                                    }
                                                }))}
                                                className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-right"
                                            >
                                                {[0, 15, 30, 45].map(m => (
                                                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <p className="col-span-2 text-sm text-orange-700 text-center mt-2">
                                        הפסקה: {String(formData.businessHours.breakTime.startHour).padStart(2, '0')}:{String(formData.businessHours.breakTime.startMinute).padStart(2, '0')} - {String(formData.businessHours.breakTime.endHour).padStart(2, '0')}:{String(formData.businessHours.breakTime.endMinute).padStart(2, '0')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Display Tab */}
                {activeTab === 'display' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">הגדרות תצוגה</h2>

                        {/* Hebrew Date Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                            <div className="text-right">
                                <h3 className="font-bold text-gray-800 text-lg">📅 הצג תאריך עברי</h3>
                                <p className="text-sm text-gray-600 mt-1">הצג תאריכים עבריים בלוח השנה ובדף הזמנת התור</p>
                                {formData.showHebrewDate && (
                                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                        ✓ מופעל - התאריך העברי יוצג ביומן
                                    </span>
                                )}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.showHebrewDate}
                                    onChange={(e) => handleInputChange('showHebrewDate', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {/* Logo Upload */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-right">לוגו העסק</label>
                            <div className="flex items-center gap-4">
                                {formData.themeSettings.logoUrl ? (
                                    <div className="relative">
                                        <img
                                            src={formData.themeSettings.logoUrl}
                                            alt="לוגו"
                                            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                                        />
                                        <button
                                            onClick={() => handleNestedChange('themeSettings', 'logoUrl', '')}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                                        🏢
                                    </div>
                                )}
                                <label className="cursor-pointer bg-white border-2 border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all font-semibold">
                                    העלה לוגו
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 text-right">מומלץ: 200x200 פיקסלים, עד 2MB</p>
                        </div>

                        {/* Color Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-right">צבע ראשי</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={formData.themeSettings.primaryColor}
                                        onChange={(e) => handleNestedChange('themeSettings', 'primaryColor', e.target.value)}
                                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                                    />
                                    <input
                                        type="text"
                                        value={formData.themeSettings.primaryColor}
                                        onChange={(e) => handleNestedChange('themeSettings', 'primaryColor', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-right">צבע משני</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={formData.themeSettings.secondaryColor}
                                        onChange={(e) => handleNestedChange('themeSettings', 'secondaryColor', e.target.value)}
                                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                                    />
                                    <input
                                        type="text"
                                        value={formData.themeSettings.secondaryColor}
                                        onChange={(e) => handleNestedChange('themeSettings', 'secondaryColor', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">הגדרות התראות</h2>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="text-right">
                                <h3 className="font-semibold text-gray-800">שליחת SMS</h3>
                                <p className="text-sm text-gray-600">שלח הודעות SMS ללקוחות לגבי תורים</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.smsNotifications.enabled}
                                    onChange={(e) => handleNestedChange('smsNotifications', 'enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {formData.smsNotifications.enabled && (
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-right">תזכורת לפני התור (שעות)</label>
                                <select
                                    value={formData.smsNotifications.reminderHoursBefore}
                                    onChange={(e) => handleNestedChange('smsNotifications', 'reminderHoursBefore', parseInt(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                                >
                                    <option value={1}>שעה לפני</option>
                                    <option value={2}>שעתיים לפני</option>
                                    <option value={6}>6 שעות לפני</option>
                                    <option value={12}>12 שעות לפני</option>
                                    <option value={24}>24 שעות לפני</option>
                                    <option value={48}>48 שעות לפני</option>
                                </select>
                            </div>
                        )}

                        <div className="p-4 bg-blue-50 rounded-lg text-right">
                            <p className="text-sm text-blue-800">
                                💡 כל הודעת SMS עולה 2 קרדיטים. יתרת הקרדיטים שלך: <strong>{user?.credits || 0}</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* Policy Tab */}
                {activeTab === 'policy' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">מדיניות ביטולים</h2>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="text-right">
                                <h3 className="font-semibold text-gray-800">הפעל מדיניות ביטולים</h3>
                                <p className="text-sm text-gray-600">הגבל ביטולים לפי זמן מוקדם מהתור</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.cancellationPolicy.enabled}
                                    onChange={(e) => handleNestedChange('cancellationPolicy', 'enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {formData.cancellationPolicy.enabled && (
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-right">זמן מינימום לביטול (שעות)</label>
                                <select
                                    value={formData.cancellationPolicy.hoursBefore}
                                    onChange={(e) => handleNestedChange('cancellationPolicy', 'hoursBefore', parseInt(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                                >
                                    <option value={1}>שעה לפני</option>
                                    <option value={2}>שעתיים לפני</option>
                                    <option value={6}>6 שעות לפני</option>
                                    <option value={12}>12 שעות לפני</option>
                                    <option value={24}>24 שעות לפני</option>
                                    <option value={48}>48 שעות לפני</option>
                                </select>
                                <p className="text-sm text-gray-500 mt-2 text-right">
                                    לקוחות לא יוכלו לבטל תורים פחות מ-{formData.cancellationPolicy.hoursBefore} שעות לפני המועד
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                <span>שומר...</span>
                            </>
                        ) : (
                            <>
                                <span>💾</span>
                                <span>שמור הגדרות</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BusinessSettings;
