import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ALERT_CATEGORIES = [
  { key: 'suspended',  label: 'מושעים',              color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',       dot: 'bg-red-500',    severity: 0 },
  { key: 'highNoShow', label: 'no-show גבוה (>20%)',  color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', dot: 'bg-orange-500', severity: 1 },
  { key: 'inactive',   label: 'לא פעילים 30+ יום',   color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',   dot: 'bg-amber-500',  severity: 2 },
  { key: 'lowCredits', label: 'קרדיטים SMS < 10',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', dot: 'bg-yellow-400', severity: 3 },
  { key: 'noTos',      label: 'לא אישרו תנאי שימוש', color: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600',        dot: 'bg-slate-400',  severity: 4 },
];

const classifyBusiness = (b) => {
  const alerts = [];
  if (b.isSuspended) alerts.push('suspended');
  if (b.totalAppointments > 0 && b.noShowAppointments / b.totalAppointments > 0.2) alerts.push('highNoShow');
  if (b.isInactive && !b.isSuspended) alerts.push('inactive');
  if ((b.credits || 0) < 10) alerts.push('lowCredits');
  if (!b.tos?.agreedAt) alerts.push('noTos');
  return alerts;
};

const AdminAlertsTab = ({ businesses, onBusinessUpdated }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [suspending, setSuspending] = useState(null);

  const alertMap = {};
  businesses.forEach(b => {
    const alerts = classifyBusiness(b);
    if (alerts.length > 0) alertMap[b._id] = alerts;
  });

  const alertBusinesses = businesses.filter(b => alertMap[b._id]?.length > 0);

  const counts = {};
  ALERT_CATEGORIES.forEach(cat => {
    counts[cat.key] = alertBusinesses.filter(b => alertMap[b._id]?.includes(cat.key)).length;
  });

  const filtered = activeCategory === 'all'
    ? alertBusinesses
    : alertBusinesses.filter(b => alertMap[b._id]?.includes(activeCategory));

  const sorted = [...filtered].sort((a, b) => {
    const sevA = Math.min(...(alertMap[a._id] || []).map(k => ALERT_CATEGORIES.find(c => c.key === k)?.severity ?? 99));
    const sevB = Math.min(...(alertMap[b._id] || []).map(k => ALERT_CATEGORIES.find(c => c.key === k)?.severity ?? 99));
    return sevA - sevB;
  });

  const handleSuspend = async (bizId, suspend) => {
    setSuspending(bizId);
    try {
      await api.post(`/users/${bizId}/suspend`, { suspend });
      toast.success(suspend ? 'העסק הושעה' : 'העסק הופעל');
      onBusinessUpdated();
    } catch {
      toast.error('שגיאה בעדכון');
    } finally {
      setSuspending(null);
    }
  };

  if (alertBusinesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">הכל תקין</h3>
        <p className="text-slate-400 text-sm mt-1">אין התראות פעילות</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-2xl border p-4 text-right transition-all ${
            activeCategory === 'all'
              ? 'bg-slate-700 dark:bg-slate-600 text-white border-slate-700'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
          }`}
        >
          <p className="text-2xl font-bold">{alertBusinesses.length}</p>
          <p className="text-xs mt-0.5 opacity-70">סה״כ התראות</p>
        </button>
        {ALERT_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`rounded-2xl border p-4 text-right transition-all ${
              activeCategory === cat.key
                ? cat.color
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
            }`}
          >
            <p className="text-2xl font-bold">{counts[cat.key]}</p>
            <p className="text-xs mt-0.5 opacity-70">{cat.label}</p>
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {sorted.map(b => {
            const alerts = alertMap[b._id] || [];
            return (
              <div key={b._id} className="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                {b.themeSettings?.logoUrl ? (
                  <img src={b.themeSettings.logoUrl} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 mt-0.5" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                    {(b.businessName || b.name || '?')[0]}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{b.businessName || b.name}</p>
                  <p className="text-xs text-slate-400 truncate" dir="ltr">{b.email}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {alerts.map(key => {
                      const cat = ALERT_CATEGORIES.find(c => c.key === key);
                      return cat ? (
                        <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cat.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.dot} inline-block flex-shrink-0`} />
                          {cat.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {b.isSuspended ? (
                    <button
                      onClick={() => handleSuspend(b._id, false)}
                      disabled={suspending === b._id}
                      className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {suspending === b._id ? '...' : 'הפעל'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSuspend(b._id, true)}
                      disabled={suspending === b._id}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {suspending === b._id ? '...' : 'השעה'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 text-right">
          {sorted.length} עסקים עם התראות
        </div>
      </div>
    </div>
  );
};

export default AdminAlertsTab;
