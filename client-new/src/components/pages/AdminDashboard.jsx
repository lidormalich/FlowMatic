import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import moment from 'moment';
import 'moment/locale/he';
import { toast } from 'react-toastify';
import BusinessDetailModal from './BusinessDetailModal';

moment.locale('he');

const StatCard = ({ label, value, sub, color, trend, trendLabel }) => (
  <div className={`rounded-2xl p-5 ${color}`}>
    <p className="text-xs font-bold uppercase tracking-wider opacity-70 text-right mb-1">{label}</p>
    <div className="flex items-end justify-between">
      <div>
        {trend !== null && trend !== undefined && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-200/60 text-emerald-700' : trend < 0 ? 'bg-red-200/60 text-red-700' : 'bg-slate-200/60 text-slate-600'}`}>
            {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {trend !== null ? `${Math.abs(trend)}%` : ''} {trendLabel || 'vs. חודש קודם'}
          </span>
        )}
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  </div>
);

const KpiBar = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold">{value}%</span>
        <span>{label}</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/users/admin/stats');
      setData(res.data);
    } catch {
      toast.error('שגיאה בטעינת נתוני מנהל');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const filteredBusinesses = data?.businesses?.filter(b => {
    const matchSearch = !search ||
      b.name?.includes(search) || b.businessName?.includes(search) || b.email?.includes(search);
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && !b.isInactive && !b.isSuspended) ||
      (filter === 'inactive' && b.isInactive && !b.isSuspended) ||
      (filter === 'suspended' && b.isSuspended) ||
      (filter === 'engaged' && b.totalAppointments >= 10);
    return matchSearch && matchFilter;
  }) || [];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const { totals, kpis } = data;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" dir="rtl">
      {selectedBusinessId && (
        <BusinessDetailModal
          businessId={selectedBusinessId}
          onClose={() => setSelectedBusinessId(null)}
          onUpdated={loadStats}
        />
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">לוח בקרה — מנהל מערכת</h1>
        <p className="text-slate-400 text-sm mt-1">סקירה גלובלית של הפלטפורמה</p>
      </div>

      {/* ── Global Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="עסקים רשומים" value={totals.businesses}
          sub={`${totals.newBusinessesThisMonth} חדשים החודש`}
          trend={kpis.growthRate} trendLabel="vs. חודש קודם"
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300" />
        <StatCard label="תורים החודש" value={totals.appointmentsThisMonth.toLocaleString()}
          sub={`${totals.totalAppointments.toLocaleString()} סה״כ`}
          trend={kpis.appointmentGrowthRate}
          color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300" />
        <StatCard label="הכנסות מאושרות" value={`₪${totals.totalRevenue.toLocaleString()}`}
          sub={`ממוצע ₪${kpis.avgRevenuePerBusiness.toLocaleString()} לעסק`}
          color="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300" />
        <StatCard label="לקוחות ייחודיים" value={totals.totalUniqueClients.toLocaleString()}
          sub="בכל הפלטפורמה"
          color="bg-sky-50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-300" />
      </div>

      {/* ── KPI Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* Platform Health */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-right">בריאות הפלטפורמה</h3>
          <div className="space-y-4">
            <KpiBar label="שיעור המרה (10+ תורים)" value={kpis.platformConversionRate} max={100} color="bg-blue-500" />
            <KpiBar label="ציות תנאי שימוש" value={kpis.tosCompliantRate} max={100} color="bg-emerald-500" />
            <KpiBar label="שיעור ביטולים" value={kpis.cancellationRate} max={100} color="bg-amber-500" />
            <KpiBar label="שיעור no-show" value={kpis.noShowRate} max={100} color="bg-red-500" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
              <p className="text-xl font-bold text-slate-800 dark:text-white">{totals.engagedBusinesses}</p>
              <p className="text-xs text-slate-400">עסקים מעורבים</p>
            </div>
            <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
              <p className="text-xl font-bold text-slate-800 dark:text-white">{kpis.avgAppointmentsPerBusiness}</p>
              <p className="text-xs text-slate-400">תורים לעסק/חודש</p>
            </div>
          </div>
        </div>

        {/* Business Status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-right">מצב עסקים</h3>
          <div className="space-y-3">
            {[
              { label: 'פעילים', value: totals.activeBusinesses, color: 'bg-emerald-500', pct: totals.businesses },
              { label: 'לא פעילים (30+ יום)', value: totals.inactiveBusinesses, color: 'bg-amber-500', pct: totals.businesses },
              { label: 'מושעים', value: totals.suspendedBusinesses, color: 'bg-red-500', pct: totals.businesses },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.pct > 0 ? Math.round((item.value / item.pct) * 100) : 0}%` }} />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 w-40 text-right">{item.label}</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-8 text-left">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-right">תנאי שימוש</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{kpis.tosCompliantCount} מתוך {totals.businesses} עסקים אישרו</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{kpis.tosCompliantRate}%</span>
            </div>
            <div className="mt-1.5 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${kpis.tosCompliantRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Business Table ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="חיפוש לפי שם / אימייל..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'הכל' },
            { key: 'active', label: 'פעילים' },
            { key: 'inactive', label: 'לא פעילים' },
            { key: 'engaged', label: 'מעורבים' },
            { key: 'suspended', label: 'מושעים' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <th className="text-right p-4 font-semibold text-slate-500 dark:text-slate-400">עסק</th>
                <th className="text-center p-4 font-semibold text-slate-500 dark:text-slate-400">תורים</th>
                <th className="text-center p-4 font-semibold text-slate-500 dark:text-slate-400 hidden sm:table-cell">החודש</th>
                <th className="text-center p-4 font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">לקוחות</th>
                <th className="text-center p-4 font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">הכנסות</th>
                <th className="text-center p-4 font-semibold text-slate-500 dark:text-slate-400 hidden lg:table-cell">ToS</th>
                <th className="text-center p-4 font-semibold text-slate-500 dark:text-slate-400 hidden lg:table-cell">כניסה אחרונה</th>
                <th className="text-center p-4 font-semibold text-slate-500 dark:text-slate-400 hidden xl:table-cell">פעילות</th>
                <th className="text-center p-4 font-semibold text-slate-500 dark:text-slate-400">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredBusinesses.length === 0 ? (
                <tr><td colSpan={9} className="text-center p-8 text-slate-400">לא נמצאו עסקים</td></tr>
              ) : filteredBusinesses.map(b => (
                <tr key={b._id} onClick={() => setSelectedBusinessId(b._id)}
                  className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {b.themeSettings?.logoUrl ? (
                        <img src={b.themeSettings.logoUrl} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(b.businessName || b.name || '?')[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">{b.businessName || b.name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[160px]" dir="ltr">{b.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{b.totalAppointments}</span>
                    {b.totalAppointments >= 10 && <span className="mr-1 text-xs">⭐</span>}
                  </td>
                  <td className="p-4 text-center text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {b.appointmentsThisMonth}
                    {b.appointmentsLastMonth > 0 && (
                      <span className={`text-xs mr-1 ${b.appointmentsThisMonth >= b.appointmentsLastMonth ? 'text-emerald-500' : 'text-red-400'}`}>
                        ({b.appointmentsThisMonth >= b.appointmentsLastMonth ? '▲' : '▼'}{Math.abs(b.appointmentsThisMonth - b.appointmentsLastMonth)})
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center text-slate-500 dark:text-slate-400 hidden md:table-cell">{b.uniqueClientsCount}</td>
                  <td className="p-4 text-center font-semibold hidden md:table-cell">
                    <span className={b.totalRevenue > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}>
                      {b.totalRevenue > 0 ? `₪${b.totalRevenue.toLocaleString()}` : '—'}
                    </span>
                  </td>
                  <td className="p-4 text-center hidden lg:table-cell">
                    {b.tos?.agreedAt ? (
                      <span title={`אושר ב-${moment(b.tos.agreedAt).format('DD/MM/YYYY')} | גרסה ${b.tos.version}`}
                        className="text-emerald-500 text-lg cursor-help">✓</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-lg">✗</span>
                    )}
                  </td>
                  <td className="p-4 text-center text-xs hidden lg:table-cell">
                    {b.lastLoginAt ? (
                      <span title={moment(b.lastLoginAt).format('DD/MM/YYYY HH:mm')} className="text-slate-500 dark:text-slate-400 cursor-help">
                        {moment(b.lastLoginAt).fromNow()}
                        <span className="block text-slate-300 dark:text-slate-600">({b.loginCount || 0} כניסות)</span>
                      </span>
                    ) : <span className="text-slate-300 dark:text-slate-600">אף פעם</span>}
                  </td>
                  <td className="p-4 text-center text-xs text-slate-400 hidden xl:table-cell">
                    {b.lastActivity ? moment(b.lastActivity).fromNow() : 'אין'}
                  </td>
                  <td className="p-4 text-center">
                    {b.isSuspended ? (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">מושעה</span>
                    ) : b.isInactive ? (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">לא פעיל</span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">פעיל</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 text-right">
          מציג {filteredBusinesses.length} מתוך {data.businesses.length} עסקים | ⭐ = עסק מעורב (10+ תורים)
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
