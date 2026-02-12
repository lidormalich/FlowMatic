import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/he';

moment.locale('he');

const roleOptions = [
  { value: 'business_owner', label: 'בעלי עסקים', icon: '🏢' },
  { value: 'client', label: 'לקוחות', icon: '👤' },
  { value: 'admin', label: 'מנהלים', icon: '🛡️' },
];

const typeConfig = {
  reminder: { label: 'תזכורת', icon: '⏰', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  status_change: { label: 'שינוי סטטוס', icon: '🔄', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  message: { label: 'הודעה', icon: '💬', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  update: { label: 'עדכון/מבצע', icon: '📢', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
};

const NotificationCenter = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [historyTab, setHistoryTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['admin-notification-history'],
    queryFn: notificationsApi.adminHistory
  });

  const { data: allNotifications = [], isLoading: allLoading } = useQuery({
    queryKey: ['admin-all-notifications'],
    queryFn: notificationsApi.adminAllNotifications
  });

  const broadcastMutation = useMutation({
    mutationFn: notificationsApi.adminBroadcast,
    onSuccess: (data) => {
      toast.success(data.message || `נשלחו ${data.sent} התראות`);
      setTitle('');
      setBody('');
      setSelectedRoles([]);
      queryClient.invalidateQueries(['admin-notification-history']);
      queryClient.invalidateQueries(['admin-all-notifications']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'שגיאה בשליחת ההתראות');
    }
  });

  const toggleRole = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSend = () => {
    if (!title.trim()) {
      toast.error('יש להזין כותרת');
      return;
    }
    if (selectedRoles.length === 0) {
      toast.error('יש לבחור לפחות סוג משתמש אחד');
      return;
    }
    broadcastMutation.mutate({ title: title.trim(), body: body.trim(), roles: selectedRoles });
  };

  // Stats from allNotifications
  const stats = allNotifications.reduce((acc, n) => {
    acc.total += n.count;
    acc[n._id.type] = (acc[n._id.type] || 0) + n.count;
    return acc;
  }, { total: 0 });

  // Filter notifications by tab
  const filteredNotifications = historyTab === 'all'
    ? allNotifications
    : allNotifications.filter(n => n._id.type === historyTab);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">מרכז התראות</h1>
        <p className="text-slate-500 dark:text-slate-400">שלח התראות, צפה בתזכורות אוטומטיות ובכל ההתראות במערכת</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(typeConfig).map(([type, config]) => (
          <div key={type} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] p-4 text-center">
            <div className="text-2xl mb-1">{config.icon}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats[type] || 0}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{config.label}</div>
          </div>
        ))}
      </div>

      {/* Send Notification Card */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-white/[0.08] p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          שליחת התראה חדשה (Push + In-App)
        </h2>

        {/* Role Selection */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 text-right">
            למי לשלוח? <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {roleOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleRole(opt.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 border-2 ${
                  selectedRoles.includes(opt.value)
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                <span>{opt.label}</span>
                {selectedRoles.includes(opt.value) && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 text-right">
            כותרת <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="למשל: מבצע חדש! 20% הנחה השבוע"
            className="w-full h-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl px-4 text-slate-900 dark:text-white text-right placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-200 outline-none"
          />
        </div>

        {/* Body */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 text-right">
            תוכן ההודעה
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="פרטים נוספים (אופציונלי)"
            rows={3}
            className="w-full bg-slate-100 dark:bg-slate-700 border-0 rounded-2xl p-4 text-slate-900 dark:text-white text-right placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-200 outline-none resize-none"
          />
        </div>

        {/* Info + Send */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {selectedRoles.length > 0 ? (
              <span>
                ישלח ל: {selectedRoles.map(r => roleOptions.find(o => o.value === r)?.label).join(', ')}
                <br />
                <span className="text-xs">Push notification + התראה באפליקציה</span>
              </span>
            ) : 'בחר קהל יעד'}
          </div>
          <button
            onClick={handleSend}
            disabled={broadcastMutation.isPending || !title.trim() || selectedRoles.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {broadcastMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                שלח התראה
              </>
            )}
          </button>
        </div>
      </div>

      {/* All Notifications History */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          כל ההתראות במערכת
        </h2>

        {/* Type Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setHistoryTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              historyTab === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            הכל
          </button>
          {Object.entries(typeConfig).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setHistoryTab(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                historyTab === type
                  ? `${config.bg} ${config.text}`
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>

        {(allLoading || historyLoading) ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-5 animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3 mb-3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-white/[0.08] p-12 text-center">
            <div className="text-5xl mb-4">📨</div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">אין התראות</h3>
            <p className="text-slate-500 dark:text-slate-400">
              {historyTab === 'all' ? 'עדיין לא נשלחו התראות במערכת' : 'אין התראות מסוג זה'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item, idx) => {
              const config = typeConfig[item._id.type] || typeConfig.update;
              return (
                <div
                  key={idx}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/[0.08] p-5"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 dark:text-white">{item._id.title}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.text}`}>
                            {config.label}
                          </span>
                        </div>
                        {item._id.body && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item._id.body}</p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          {moment(item.createdAt).format('DD/MM/YYYY HH:mm')} • {moment(item.createdAt).fromNow()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {item.count} נמענים
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        {item.readCount}/{item.count} נקראו
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
