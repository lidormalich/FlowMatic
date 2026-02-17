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
        businessName: '',
        businessDescription: '',
        businessAddress: '',
        phoneNumber: '',
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
            },
            minGapMinutes: 0
        },
        showHebrewDate: false,
        showHebrewDateInBooking: false,
        hebrewCalendar: {
            showHolidays: true,
            showShabbat: true,
            showEvents: true
        },
        themeSettings: {
            primaryColor: '#667eea',
            secondaryColor: '#764ba2',
            logoUrl: ''
        },
        smsNotifications: {
            enabled: true,
            reminderHoursBefore: 24
        },
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
                    },
                    minGapMinutes: userData.businessHours?.minGapMinutes ?? 0
                },
                showHebrewDate: userData.showHebrewDate ?? false,
                showHebrewDateInBooking: userData.showHebrewDateInBooking ?? false,
                hebrewCalendar: {
                    showHolidays: userData.hebrewCalendar?.showHolidays ?? true,
                    showShabbat: userData.hebrewCalendar?.showShabbat ?? true,
                    showEvents: userData.hebrewCalendar?.showEvents ?? true
                },
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
            toast.success('ההגדרות נשמרו בהצלחה');
            if (refreshUser) refreshUser();
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('שגיאה בשמירת ההגדרות');
        }
        setSaving(false);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
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
        if (file.size > 2 * 1024 * 1024) {
            toast.error('הקובץ גדול מדי. מקסימום 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            handleNestedChange('themeSettings', 'logoUrl', event.target.result);
            toast.success('הלוגו הועלה בהצלחה');
        };
        reader.readAsDataURL(file);
    };

    // iOS Toggle component
    const Toggle = ({ checked, onChange, color = 'blue' }) => {
        const colors = {
            blue: 'peer-checked:bg-blue-500',
            green: 'peer-checked:bg-emerald-500',
            amber: 'peer-checked:bg-amber-500',
            orange: 'peer-checked:bg-orange-500',
            purple: 'peer-checked:bg-purple-500',
        };
        return (
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
                <div className={`w-[52px] h-[32px] bg-slate-200 dark:bg-slate-600 rounded-full peer ${colors[color]} after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-[28px] after:w-[28px] after:transition-all after:shadow-sm peer-checked:after:translate-x-[20px] rtl:peer-checked:after:-translate-x-[20px]`} />
            </label>
        );
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

    const tabs = [
        { id: 'business', label: 'פרטי עסק', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
        { id: 'hours', label: 'שעות', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'display', label: 'תצוגה', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
        { id: 'notifications', label: 'התראות', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
        { id: 'policy', label: 'מדיניות', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    ];

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-24">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">הגדרות העסק</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">נהל את פרטי העסק, שעות הפעילות וההגדרות</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 mb-6 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}

            {/* Business Info Tab */}
            {activeTab === 'business' && (
                <div className="space-y-4">
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] overflow-hidden">
                        <div className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">שם העסק</label>
                                <input type="text" value={formData.businessName} onChange={(e) => handleInputChange('businessName', e.target.value)} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all outline-none" placeholder="שם העסק שלך" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">תיאור העסק</label>
                                <textarea value={formData.businessDescription} onChange={(e) => handleInputChange('businessDescription', e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl p-4 text-slate-900 dark:text-white text-right placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all outline-none resize-none" rows="3" placeholder="תאר את העסק והשירותים שלך..." />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">כתובת</label>
                                <input type="text" value={formData.businessAddress} onChange={(e) => handleInputChange('businessAddress', e.target.value)} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all outline-none" placeholder="כתובת העסק" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">טלפון</label>
                                <input type="tel" value={formData.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all outline-none" dir="ltr" placeholder="05X-XXXXXXX" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Working Hours Tab */}
            {activeTab === 'hours' && (
                <div className="space-y-4">
                    {/* Open/Close Hours */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] p-5">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 text-right">שעות פעילות</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">שעת פתיחה</label>
                                <select value={formData.businessHours.startHour} onChange={(e) => handleNestedChange('businessHours', 'startHour', parseInt(e.target.value))} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none">
                                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">שעת סגירה</label>
                                <select value={formData.businessHours.endHour} onChange={(e) => handleNestedChange('businessHours', 'endHour', parseInt(e.target.value))} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none">
                                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Working Days */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] p-5">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 text-right">ימי פעילות</h3>
                        <div className="grid grid-cols-7 gap-2">
                            {DAYS_OF_WEEK.map(day => {
                                const isActive = formData.businessHours.workingDays.includes(day.value);
                                return (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleWorkingDay(day.value)}
                                        className={`relative flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-200 active:scale-95 ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <span className="text-lg font-bold">{day.label}</span>
                                        <span className="text-[9px] mt-0.5 opacity-70">{day.fullLabel}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-3 text-center">{formData.businessHours.workingDays.length} ימים נבחרו</p>
                    </div>

                    {/* Slot Interval */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] p-5">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 text-right">מרווח בין תורים</h3>
                        <p className="text-[10px] text-slate-400 mb-3 text-right">כל כמה דקות יוצג סלוט פנוי</p>
                        <div className="flex flex-wrap gap-2">
                            {[10, 15, 20, 30, 45, 60].map(interval => (
                                <button
                                    key={interval}
                                    type="button"
                                    onClick={() => handleNestedChange('businessHours', 'slotInterval', interval)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${formData.businessHours.slotInterval === interval
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                    }`}
                                >
                                    {interval} דק׳
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Break Time */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] overflow-hidden">
                        <div className="flex items-center justify-between p-5">
                            <Toggle checked={formData.businessHours.breakTime.enabled} onChange={(v) => setFormData(prev => ({ ...prev, businessHours: { ...prev.businessHours, breakTime: { ...prev.businessHours.breakTime, enabled: v } } }))} color="orange" />
                            <div className="text-right flex-1 mr-3">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">הפסקה באמצע היום</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">זמן שבו לא ניתן לקבוע תורים</p>
                            </div>
                        </div>
                        {formData.businessHours.breakTime.enabled && (
                            <div className="border-t border-slate-100 dark:border-slate-700/50 p-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-semibold text-slate-400 text-right">תחילת הפסקה</label>
                                        <div className="flex gap-1.5">
                                            <select value={formData.businessHours.breakTime.startHour} onChange={(e) => setFormData(prev => ({ ...prev, businessHours: { ...prev.businessHours, breakTime: { ...prev.businessHours.breakTime, startHour: parseInt(e.target.value) } } }))} className="flex-1 h-11 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl px-3 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-orange-400 outline-none appearance-none text-sm">
                                                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
                                            </select>
                                            <select value={formData.businessHours.breakTime.startMinute} onChange={(e) => setFormData(prev => ({ ...prev, businessHours: { ...prev.businessHours, breakTime: { ...prev.businessHours.breakTime, startMinute: parseInt(e.target.value) } } }))} className="flex-1 h-11 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl px-3 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-orange-400 outline-none appearance-none text-sm">
                                                {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-semibold text-slate-400 text-right">סוף הפסקה</label>
                                        <div className="flex gap-1.5">
                                            <select value={formData.businessHours.breakTime.endHour} onChange={(e) => setFormData(prev => ({ ...prev, businessHours: { ...prev.businessHours, breakTime: { ...prev.businessHours.breakTime, endHour: parseInt(e.target.value) } } }))} className="flex-1 h-11 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl px-3 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-orange-400 outline-none appearance-none text-sm">
                                                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
                                            </select>
                                            <select value={formData.businessHours.breakTime.endMinute} onChange={(e) => setFormData(prev => ({ ...prev, businessHours: { ...prev.businessHours, breakTime: { ...prev.businessHours.breakTime, endMinute: parseInt(e.target.value) } } }))} className="flex-1 h-11 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl px-3 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-orange-400 outline-none appearance-none text-sm">
                                                {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-orange-600 dark:text-orange-400 text-center mt-3 font-medium">
                                    {String(formData.businessHours.breakTime.startHour).padStart(2, '0')}:{String(formData.businessHours.breakTime.startMinute).padStart(2, '0')} - {String(formData.businessHours.breakTime.endHour).padStart(2, '0')}:{String(formData.businessHours.breakTime.endMinute).padStart(2, '0')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Smart Gap */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] p-5">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 text-right">Smart Gap</h3>
                        <p className="text-[10px] text-slate-400 mb-3 text-right">סלוטים שמשאירים חור קטן מדי בין תורים יוסתרו</p>
                        <div className="flex flex-wrap gap-2">
                            {[0, 10, 15, 20, 30].map(gap => (
                                <button
                                    key={gap}
                                    type="button"
                                    onClick={() => handleNestedChange('businessHours', 'minGapMinutes', gap)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${formData.businessHours.minGapMinutes === gap
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                    }`}
                                >
                                    {gap === 0 ? 'ללא' : `${gap} דקות`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Display Tab */}
            {activeTab === 'display' && (
                <div className="space-y-4">
                    {/* Hebrew Date Toggles */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50">
                            <Toggle checked={formData.showHebrewDate} onChange={(v) => handleInputChange('showHebrewDate', v)} color="blue" />
                            <div className="text-right flex-1 mr-3">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">הצג תאריך עברי</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">הצג תאריכים עבריים בלוח השנה</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-5">
                            <Toggle checked={formData.showHebrewDateInBooking} onChange={(v) => handleInputChange('showHebrewDateInBooking', v)} color="green" />
                            <div className="text-right flex-1 mr-3">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">תאריך עברי בדף הזמנה</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">הצג תאריכים עבריים בדף קביעת תורים</p>
                            </div>
                        </div>
                    </div>

                    {/* Hebrew Calendar Settings */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] overflow-hidden">
                        <div className="p-5 pb-3">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">לוח שנה עברי</h3>
                            <p className="text-[10px] text-slate-400 text-right mt-0.5">בחר אילו אירועים יוצגו</p>
                        </div>
                        <div className="px-5 pb-2">
                            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                                <Toggle checked={formData.hebrewCalendar.showHolidays} onChange={(v) => handleNestedChange('hebrewCalendar', 'showHolidays', v)} color="amber" />
                                <div className="text-right flex-1 mr-3">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">חגים ומועדים</span>
                                    <p className="text-[10px] text-slate-400">ראש השנה, יום כיפור, סוכות, פסח</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                                <Toggle checked={formData.hebrewCalendar.showShabbat} onChange={(v) => handleNestedChange('hebrewCalendar', 'showShabbat', v)} color="amber" />
                                <div className="text-right flex-1 mr-3">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">שבתות</span>
                                    <p className="text-[10px] text-slate-400">זמני כניסה ויציאה, פרשת השבוע</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <Toggle checked={formData.hebrewCalendar.showEvents} onChange={(v) => handleNestedChange('hebrewCalendar', 'showEvents', v)} color="amber" />
                                <div className="text-right flex-1 mr-3">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">מועדי ישראל</span>
                                    <p className="text-[10px] text-slate-400">יום העצמאות, יום הזיכרון, יום ירושלים</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logo */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] p-5">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 text-right">לוגו העסק</h3>
                        <div className="flex items-center gap-4">
                            {formData.themeSettings.logoUrl ? (
                                <div className="relative">
                                    <img src={formData.themeSettings.logoUrl} alt="לוגו" className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-600" />
                                    <button onClick={() => handleNestedChange('themeSettings', 'logoUrl', '')} className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-lg">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            )}
                            <label className="cursor-pointer bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors active:scale-95">
                                העלה לוגו
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-right">מומלץ: 200x200, עד 2MB</p>
                    </div>

                    {/* Colors */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] p-5">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 text-right">צבעים</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">ראשי</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={formData.themeSettings.primaryColor} onChange={(e) => handleNestedChange('themeSettings', 'primaryColor', e.target.value)} className="h-10 w-14 border-0 rounded-xl cursor-pointer bg-transparent" />
                                    <input type="text" value={formData.themeSettings.primaryColor} onChange={(e) => handleNestedChange('themeSettings', 'primaryColor', e.target.value)} className="flex-1 h-10 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl px-3 text-sm font-mono text-slate-600 dark:text-slate-300 outline-none" dir="ltr" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">משני</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={formData.themeSettings.secondaryColor} onChange={(e) => handleNestedChange('themeSettings', 'secondaryColor', e.target.value)} className="h-10 w-14 border-0 rounded-xl cursor-pointer bg-transparent" />
                                    <input type="text" value={formData.themeSettings.secondaryColor} onChange={(e) => handleNestedChange('themeSettings', 'secondaryColor', e.target.value)} className="flex-1 h-10 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl px-3 text-sm font-mono text-slate-600 dark:text-slate-300 outline-none" dir="ltr" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="space-y-4">
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] overflow-hidden">
                        <div className="flex items-center justify-between p-5">
                            <Toggle checked={formData.smsNotifications.enabled} onChange={(v) => handleNestedChange('smsNotifications', 'enabled', v)} color="blue" />
                            <div className="text-right flex-1 mr-3">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">שליחת SMS</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">שלח הודעות SMS ללקוחות לגבי תורים</p>
                            </div>
                        </div>
                        {formData.smsNotifications.enabled && (
                            <div className="border-t border-slate-100 dark:border-slate-700/50 p-5">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-right">תזכורת לפני התור</label>
                                <select value={formData.smsNotifications.reminderHoursBefore} onChange={(e) => handleNestedChange('smsNotifications', 'reminderHoursBefore', parseInt(e.target.value))} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none">
                                    <option value={1}>שעה לפני</option>
                                    <option value={2}>שעתיים לפני</option>
                                    <option value={6}>6 שעות לפני</option>
                                    <option value={12}>12 שעות לפני</option>
                                    <option value={24}>24 שעות לפני</option>
                                    <option value={48}>48 שעות לפני</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/30 rounded-2xl p-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 text-right">כל SMS עולה 2 קרדיטים. יתרה: <strong>{user?.credits || 0}</strong></p>
                        </div>
                    </div>
                </div>
            )}

            {/* Policy Tab */}
            {activeTab === 'policy' && (
                <div className="space-y-4">
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] overflow-hidden">
                        <div className="flex items-center justify-between p-5">
                            <Toggle checked={formData.cancellationPolicy.enabled} onChange={(v) => handleNestedChange('cancellationPolicy', 'enabled', v)} color="blue" />
                            <div className="text-right flex-1 mr-3">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">מדיניות ביטולים</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">הגבל ביטולים לפי זמן מוקדם מהתור</p>
                            </div>
                        </div>
                        {formData.cancellationPolicy.enabled && (
                            <div className="border-t border-slate-100 dark:border-slate-700/50 p-5 space-y-3">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">זמן מינימום לביטול</label>
                                <select value={formData.cancellationPolicy.hoursBefore} onChange={(e) => handleNestedChange('cancellationPolicy', 'hoursBefore', parseInt(e.target.value))} className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none">
                                    <option value={1}>שעה לפני</option>
                                    <option value={2}>שעתיים לפני</option>
                                    <option value={6}>6 שעות לפני</option>
                                    <option value={12}>12 שעות לפני</option>
                                    <option value={24}>24 שעות לפני</option>
                                    <option value={48}>48 שעות לפני</option>
                                </select>
                                <p className="text-[10px] text-slate-400 text-right">
                                    לקוחות לא יוכלו לבטל פחות מ-{formData.cancellationPolicy.hoursBefore} שעות לפני
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/[0.08] z-40">
                <div className="max-w-4xl mx-auto" style={{ direction: 'ltr' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>שומר...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
