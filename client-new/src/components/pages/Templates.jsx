import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { templatesApi } from '../../services/api';
import SkeletonLoader from '../common/SkeletonLoader';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('email'); // 'email' or 'sms'

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await templatesApi.getAll();
            setTemplates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('שגיאה בטעינת תבניות');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id, field, value) => {
        // Optimistic update
        setTemplates(prev => prev.map(t => t._id === id ? { ...t, [field]: value } : t));

        try {
            await templatesApi.update(id, { [field]: value });
            toast.success('תבנית עודכנה', { autoClose: 1000, hideProgressBar: true });
        } catch (error) {
            console.error('Error updating template:', error);
            toast.error('שגיאה בעדכון תבנית');
            fetchTemplates(); // Revert
        }
    };

    const filteredTemplates = templates.filter(t => t.type === selectedType);

    const getTemplateLabel = (name) => {
        const labels = {
            confirmation: 'אישור תור',
            reminder: 'תזכורת לתור',
            cancellation: 'ביטול תור',
            reschedule: 'שינוי תור'
        };
        return labels[name] || name;
    };

    if (loading) return <SkeletonLoader />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">תבניות הודעות</h1>
                <p className="text-gray-600">ערוך את הודעות האימייל וה-SMS שנשלחות ללקוחות</p>
            </div>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setSelectedType('email')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${selectedType === 'email' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    📧 אימייל
                </button>
                <button
                    onClick={() => setSelectedType('sms')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${selectedType === 'sms' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    📱 SMS
                </button>
            </div>

            <div className="grid gap-6">
                {filteredTemplates.map(template => (
                    <div key={template._id} className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-800">{getTemplateLabel(template.name)}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">פעיל?</span>
                                <input
                                    type="checkbox"
                                    checked={template.isActive}
                                    onChange={(e) => handleUpdate(template._id, 'isActive', e.target.checked)}
                                    className="w-5 h-5 text-primary rounded focus:ring-primary"
                                />
                            </div>
                        </div>

                        {template.type === 'email' && (
                            <div className="mb-4">
                                <label className="block text-gray-700 font-semibold mb-2 text-right">נושא</label>
                                <input
                                    type="text"
                                    value={template.subject}
                                    onChange={(e) => handleUpdate(template._id, 'subject', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg text-right"
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2 text-right">תוכן ההודעה</label>
                            <textarea
                                value={template.body}
                                onChange={(e) => handleUpdate(template._id, 'body', e.target.value)}
                                rows="5"
                                className="w-full px-4 py-2 border rounded-lg text-right font-mono text-sm leading-relaxed"
                            />
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                            <p className="font-semibold mb-2">משתנים זמינים:</p>
                            <div className="flex flex-wrap gap-2 dir-ltr">
                                <span className="bg-white px-2 py-1 rounded border border-blue-200">{'{clientName}'}</span>
                                <span className="bg-white px-2 py-1 rounded border-blue-200">{'{serviceName}'}</span>
                                <span className="bg-white px-2 py-1 rounded border-blue-200">{'{date}'}</span>
                                <span className="bg-white px-2 py-1 rounded border-blue-200">{'{time}'}</span>
                                <span className="bg-white px-2 py-1 rounded border-blue-200">{'{businessName}'}</span>
                                {template.type === 'email' && <span className="bg-white px-2 py-1 rounded border-blue-200">{'{address}'}</span>}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredTemplates.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        לא נמצאו תבניות להצגה
                    </div>
                )}
            </div>
        </div>
    );
};

export default Templates;
