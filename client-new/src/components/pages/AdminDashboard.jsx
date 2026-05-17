import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import moment from 'moment';
import 'moment/locale/he';
import { toast } from 'react-toastify';
import BusinessDetailModal from './BusinessDetailModal';
import AdminLogsTab from './AdminLogsTab';
import AdminAlertsTab from './AdminAlertsTab';

moment.locale('he');

// ─── Sub-components ───────────────────────────────────────────────

const StatCard = ({ label, value, sub, color, trend }) => (
  <div className={`rounded-2xl p-5 ${color}`}>
    <p className="text-xs font-bold uppercase tracking-wider opacity-60 text-right mb-2">{label}</p>
    <p className="text-2xl font-bold text-right">{value}</p>
    {sub && <p className="text-xs opacity-60 mt-0.5 text-right">{sub}</p>}
    {trend !== null && trend !== undefined && (
      <div className="mt-2">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
          trend > 0 ? 'bg-emerald-200/70 text-emerald-800' :
          trend < 0 ? 'bg-red-200/70 text-red-800' :
          'bg-slate-200/70 text-slate-600'
        }`}>
          {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend)}% vs. חודש קודם
        </span>
      </div>
    )}
  </div>
);

const KpiBar = ({ label, value, color, inverse = false }) => {
  const barColor = inverse
    ? (value > 20 ? 'bg-red-500' : value > 10 ? 'bg-amber-400' : 'bg-emerald-500')
    : color;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-200">{value}%</span>
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
};

const HBar = ({ rank, label, value, max, color, format }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const isTop3 = rank <= 3;
  return (
    <div className="flex items-center gap-2 group">
      <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${isTop3 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>{rank}</span>
      <div className="w-28 text-xs text-right truncate flex-shrink-0 text-slate-600 dark:text-slate-400" title={label}>{label}</div>
      <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
        <div
          className={`h-full rounded-lg flex items-center justify-end px-2 transition-all duration-700 ${color}`}
          style={{ width: `${pct}%`, minWidth: value > 0 ? '2rem' : 0 }}
        >
          {pct > 18 && (
            <span className="text-[11px] text-white font-bold whitespace-nowrap">
              {format ? format(value) : value}
            </span>
          )}
        </div>
      </div>
      {pct <= 18 && (
        <span className="text-xs text-slate-500 dark:text-slate-400 w-16 text-right flex-shrink-0">
          {format ? format(value) : value}
        </span>
      )}
    </div>
  );
};

const StatusBadge = ({ business: b }) => {
  if (b.isSuspended) return <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">מושעה</span>;
  if (b.isInactive) return <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">לא פעיל</span>;
  return <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">פעיל</span>;
};

const TABS = [
  { key: 'overview',      label: 'סקירה'          },
  { key: 'businesses',    label: 'עסקים'           },
  { key: 'trends',        label: 'מגמות'           },
  { key: 'logs',          label: 'לוגים'           },
  { key: 'alerts',        label: 'התראות'          },
  { key: 'notif-control', label: 'שליטת התראות'   },
];

const BIZ_FILTERS = [
  { key: 'all',       label: 'הכל'       },
  { key: 'active',    label: 'פעילים'    },
  { key: 'inactive',  label: 'לא פעילים' },
  { key: 'engaged',   label: 'מעורבים'   },
  { key: 'suspended', label: 'מושעים'    },
];

// ─── Main Component ───────────────────────────────────────────────

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');
  const [selectedBizId, setSelectedBizId] = useState(null);

  const [timeline, setTimeline]               = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const [suspending, setSuspending] = useState(null);

  // Notification control state
  const [notifSettings, setNotifSettings] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);

  const setTab = (key) => setSearchParams({ tab: key });

  const loadStats = () => {
    setLoading(true);
    api.get('/users/admin/stats')
      .then(res => setData(res.data))
      .catch(() => toast.error('שגיאה בטעינת נתוני מנהל'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    if (activeTab === 'notif-control' && !notifSettings) {
      api.get('/users/admin/notification-settings')
        .then(res => setNotifSettings(res.data.notifications))
        .catch(() => toast.error('שגיאה בטעינת הגדרות'));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'trends' || timeline !== null) return;
    setTimelineLoading(true);
    api.get('/users/admin/platform-timeline')
      .then(res => setTimeline(res.data.months))
      .catch(() => toast.error('שגיאה בטעינת ציר הזמן'))
      .finally(() => setTimelineLoading(false));
  }, [activeTab]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleSuspend = async (bizId, suspend) => {
    setSuspending(bizId);
    try {
      await api.post(`/users/${bizId}/suspend`, { suspend });
      toast.success(suspend ? 'העסק הושעה' : 'העסק הופעל');
      loadStats();
    } catch {
      toast.error('שגיאה בעדכון סטטוס');
    } finally {
      setSuspending(null);
    }
  };

  const handleExport = () => {
    api.get('/users/admin/export/businesses', { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `businesses_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('שגיאה בייצוא CSV'));
  };

  // ── Derived data ──────────────────────────────────────────────

  const filteredBusinesses = (data?.businesses || []).filter(b => {
    const matchSearch = !search ||
      b.name?.includes(search) || b.businessName?.includes(search) || b.email?.includes(search);
    const matchFilter =
      filter === 'all' ||
      (filter === 'active'    && !b.isInactive && !b.isSuspended) ||
      (filter === 'inactive'  &&  b.isInactive && !b.isSuspended) ||
      (filter === 'suspended' &&  b.isSuspended) ||
      (filter === 'engaged'   &&  b.totalAppointments >= 10);
    return matchSearch && matchFilter;
  });

  // ── Loading / null guard ──────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const { totals, kpis, businesses, clientScores } = data;

  const alertCount = businesses.filter(b =>
    b.isSuspended ||
    (b.isInactive && !b.isSuspended) ||
    !b.tos?.agreedAt ||
    (b.credits || 0) < 10 ||
    (b.totalAppointments > 0 && b.noShowAppointments / b.totalAppointments > 0.2)
  ).length;

  const lowCreditBusinesses = businesses.filter(b => (b.credits || 0) < 10);

  const topByAppointments = [...businesses]
    .sort((a, b) => b.totalAppointments - a.totalAppointments)
    .slice(0, 10);

  const topByRevenue = [...businesses]
    .filter(b => b.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  const growingBusinesses = businesses
    .filter(b => b.appointmentsLastMonth > 0)
    .map(b => ({ ...b, delta: b.appointmentsThisMonth - b.appointmentsLastMonth }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 8);

  const maxGrowthAbs = Math.max(...growingBusinesses.map(b => Math.abs(b.delta)), 1);

  // ─────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" dir="rtl">

      {selectedBizId && (
        <BusinessDetailModal
          businessId={selectedBizId}
          onClose={() => setSelectedBizId(null)}
          onUpdated={loadStats}
        />
      )}

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 py-3 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">מנהל מערכת</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {businesses.length} עסקים רשומים · {totals.totalAppointments.toLocaleString()} תורים כולל
            </p>
          </div>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 self-start sm:self-auto flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
                {tab.key === 'businesses' && (
                  <span className="mr-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                    {businesses.length}
                  </span>
                )}
                {tab.key === 'alerts' && alertCount > 0 && (
                  <span className="mr-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                    {alertCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
           TAB: סקירה
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-5">

          {/* Global KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="עסקים רשומים"
              value={totals.businesses}
              sub={`${totals.newBusinessesThisMonth} חדשים החודש`}
              trend={kpis.growthRate}
              color="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
            />
            <StatCard
              label="תורים החודש"
              value={totals.appointmentsThisMonth.toLocaleString()}
              sub={`${totals.totalAppointments.toLocaleString()} סה״כ`}
              trend={kpis.appointmentGrowthRate}
              color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200"
            />
            <StatCard
              label="הכנסות מאושרות"
              value={`₪${totals.totalRevenue.toLocaleString()}`}
              sub={`ממוצע ₪${kpis.avgRevenuePerBusiness.toLocaleString()} לעסק`}
              color="bg-violet-50 dark:bg-violet-900/20 text-violet-800 dark:text-violet-200"
            />
            <StatCard
              label="לקוחות ייחודיים"
              value={totals.totalUniqueClients.toLocaleString()}
              sub="בכל הפלטפורמה"
              color="bg-sky-50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-200"
            />
          </div>

          {/* Health + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-right">בריאות הפלטפורמה</h3>
              <div className="space-y-4">
                <KpiBar label="שיעור המרה (10+ תורים)" value={kpis.platformConversionRate} color="bg-blue-500" />
                <KpiBar label="ציות תנאי שימוש"        value={kpis.tosCompliantRate}        color="bg-emerald-500" />
                <KpiBar label="שיעור ביטולים"           value={kpis.cancellationRate}        color="bg-amber-500" inverse />
                <KpiBar label="שיעור no-show"           value={kpis.noShowRate}              color="bg-red-500"   inverse />
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

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-right">מצב עסקים</h3>
              <div className="space-y-3.5">
                {[
                  { label: 'פעילים',              value: totals.activeBusinesses,    color: 'bg-emerald-500' },
                  { label: 'לא פעילים (30+ יום)', value: totals.inactiveBusinesses,  color: 'bg-amber-500'  },
                  { label: 'מושעים',              value: totals.suspendedBusinesses, color: 'bg-red-500'    },
                ].map(item => {
                  const pct = totals.businesses > 0 ? Math.round((item.value / totals.businesses) * 100) : 0;
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-8 text-right flex-shrink-0">{item.value}</span>
                      <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-40 text-right flex-shrink-0">{item.label}</span>
                      <span className="text-xs text-slate-400 w-7 text-left flex-shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-right">ציות תנאי שימוש</h4>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{kpis.tosCompliantRate}%</span>
                  <span className="text-xs text-slate-400">{kpis.tosCompliantCount} מתוך {totals.businesses} עסקים אישרו</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${kpis.tosCompliantRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Client Score + SMS Credits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientScores && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-right">ציוני לקוחות — פלטפורמה</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{clientScores.priority}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">★ עדיפות גבוהה</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{clientScores.avgScore}</p>
                    <p className="text-xs text-slate-400 mt-0.5">ממוצע ציון</p>
                  </div>
                  <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{clientScores.flagged}</p>
                    <p className="text-xs text-red-500 mt-0.5">⚠ בעייתיים</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${clientScores.avgScore >= 75 ? 'bg-emerald-500' : clientScores.avgScore >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
                    style={{ width: `${clientScores.avgScore}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 text-right">{clientScores.total} לקוחות במערכת</p>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  lowCreditBusinesses.length > 0
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {lowCreditBusinesses.length} עסקים
                </span>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-right">קרדיטים SMS נמוכים (&lt;10)</h3>
              </div>
              {lowCreditBusinesses.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">כל העסקים מעל הסף</p>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {lowCreditBusinesses.slice(0, 8).map(b => (
                    <div key={b._id} className="flex items-center justify-between py-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        (b.credits || 0) === 0
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {b.credits || 0}
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{b.businessName || b.name}</span>
                    </div>
                  ))}
                  {lowCreditBusinesses.length > 8 && (
                    <p className="text-xs text-slate-400 text-right pt-1">ועוד {lowCreditBusinesses.length - 8}...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Leaderboards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-right text-sm">🏆 TOP 5 — לפי תורים</h3>
              <div className="space-y-2.5">
                {topByAppointments.slice(0, 5).map((b, i) => (
                  <div key={b._id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg px-1 py-0.5 transition-colors"
                    onClick={() => setSelectedBizId(b._id)}>
                    <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${i < 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{i + 1}</span>
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{b.businessName || b.name}</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{b.totalAppointments}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-right text-sm">💰 TOP 5 — לפי הכנסות</h3>
              {topByRevenue.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">אין נתוני הכנסות עדיין</p>
              ) : (
                <div className="space-y-2.5">
                  {topByRevenue.slice(0, 5).map((b, i) => (
                    <div key={b._id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg px-1 py-0.5 transition-colors"
                      onClick={() => setSelectedBizId(b._id)}>
                      <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${i < 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{i + 1}</span>
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{b.businessName || b.name}</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₪{b.totalRevenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           TAB: עסקים
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'businesses' && (
        <div>
          {/* Search + Filters + Export */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="חיפוש לפי שם / אימייל..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 dark:text-white"
            />
            <div className="flex gap-2 flex-wrap">
              {BIZ_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    filter === f.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={handleExport}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                title="ייצוא CSV"
              >
                ⬇ CSV
              </button>
            </div>
          </div>

          {/* Table */}
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
                    <th className="text-center p-4 font-semibold text-slate-500 dark:text-slate-400 hidden lg:table-cell">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredBusinesses.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center p-10 text-slate-400">לא נמצאו עסקים</td>
                    </tr>
                  ) : filteredBusinesses.map(b => (
                    <tr
                      key={b._id}
                      onClick={() => setSelectedBizId(b._id)}
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                    >
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
                            <p className="font-semibold text-slate-800 dark:text-white">{b.businessName || b.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[160px]" dir="ltr">{b.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{b.totalAppointments}</span>
                        {b.totalAppointments >= 10 && <span className="mr-1 text-xs">⭐</span>}
                      </td>
                      <td className="p-4 text-center text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        <span className="font-medium">{b.appointmentsThisMonth}</span>
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
                        {b.tos?.agreedAt
                          ? <span title={`אושר ב-${moment(b.tos.agreedAt).format('DD/MM/YYYY')}`} className="text-emerald-500 text-xl cursor-help">✓</span>
                          : <span className="text-slate-300 dark:text-slate-600 text-xl">✗</span>
                        }
                      </td>
                      <td className="p-4 text-center text-xs hidden lg:table-cell">
                        {b.lastLoginAt
                          ? <span title={moment(b.lastLoginAt).format('DD/MM/YYYY HH:mm')} className="text-slate-500 dark:text-slate-400 cursor-help">
                              {moment(b.lastLoginAt).fromNow()}
                              <span className="block text-slate-300 dark:text-slate-600">({b.loginCount || 0} כניסות)</span>
                            </span>
                          : <span className="text-slate-300 dark:text-slate-600">אף פעם</span>
                        }
                      </td>
                      <td className="p-4 text-center text-xs text-slate-400 hidden xl:table-cell">
                        {b.lastActivity ? moment(b.lastActivity).fromNow() : 'אין'}
                      </td>
                      <td className="p-4 text-center"><StatusBadge business={b} /></td>
                      <td className="p-4 text-center hidden lg:table-cell" onClick={e => e.stopPropagation()}>
                        {b.isSuspended ? (
                          <button
                            onClick={() => handleSuspend(b._id, false)}
                            disabled={suspending === b._id}
                            className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {suspending === b._id ? '...' : 'הפעל'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(b._id, true)}
                            disabled={suspending === b._id}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {suspending === b._id ? '...' : 'השעה'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 text-right">
              מציג {filteredBusinesses.length} מתוך {businesses.length} עסקים · ⭐ = עסק מעורב (10+ תורים)
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           TAB: מגמות
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'trends' && (
        <div className="space-y-5">

          {/* 12-Month Timeline Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-5 text-right text-sm">ציר זמן — 12 חודשים אחרונים</h3>
            {timelineLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !timeline || timeline.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">אין נתוני ציר זמן</p>
            ) : (() => {
              const maxAppts = Math.max(...timeline.map(m => m.appointments), 1);
              const maxRev   = Math.max(...timeline.map(m => m.revenue), 1);
              return (
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-1.5 min-w-max pb-1" style={{ height: '110px' }}>
                    {timeline.map((m, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5 group" style={{ width: '48px' }}>
                        <div
                          className="w-full bg-blue-400 dark:bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600"
                          style={{ height: `${Math.round((m.appointments / maxAppts) * 90)}px`, minHeight: m.appointments > 0 ? '4px' : 0 }}
                          title={`${m.label}: ${m.appointments} תורים, ₪${m.revenue.toLocaleString()}`}
                        />
                        <span className="text-[10px] text-slate-400 text-center leading-tight whitespace-nowrap">{m.shortLabel}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 min-w-max" style={{ height: '80px' }}>
                    {timeline.map((m, i) => (
                      <div key={i} className="flex items-end" style={{ width: '48px' }}>
                        <div
                          className="w-full bg-emerald-400 dark:bg-emerald-500 rounded-t-lg transition-all duration-500 hover:bg-emerald-600"
                          style={{ height: `${Math.round((m.revenue / maxRev) * 70)}px`, minHeight: m.revenue > 0 ? '4px' : 0 }}
                          title={`₪${m.revenue.toLocaleString()}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-400 rounded inline-block" /> תורים</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-400 rounded inline-block" /> הכנסות</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Growth micro-cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'צמיחת עסקים',
                value: kpis.growthRate,
                sub: `${totals.newBusinessesThisMonth} חדשים החודש`,
                positive: kpis.growthRate > 0,
              },
              {
                label: 'צמיחת תורים',
                value: kpis.appointmentGrowthRate,
                sub: `${totals.appointmentsThisMonth} vs. ${totals.appointmentsLastMonth} חודש קודם`,
                positive: kpis.appointmentGrowthRate > 0,
              },
              {
                label: 'שיעור no-show',
                value: kpis.noShowRate,
                sub: 'מכלל התורים',
                positive: kpis.noShowRate <= 8,
                isPercent: true,
                suffix: '%',
                inverse: true,
              },
              {
                label: 'שיעור ביטולים',
                value: kpis.cancellationRate,
                sub: 'מכלל התורים',
                positive: kpis.cancellationRate <= 10,
                isPercent: true,
                suffix: '%',
                inverse: true,
              },
            ].map(item => (
              <div key={item.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-right">
                <p className="text-xs text-slate-400 mb-1.5">{item.label}</p>
                <p className={`text-2xl font-bold ${
                  item.inverse
                    ? (item.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')
                    : (item.positive ? 'text-emerald-600 dark:text-emerald-400' : item.value < 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300')
                }`}>
                  {!item.isPercent && (item.value > 0 ? '▲ ' : item.value < 0 ? '▼ ' : '— ')}
                  {Math.abs(item.value)}{item.suffix || '%'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Bar charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-5 text-right text-sm">TOP 10 — לפי תורים</h3>
              {topByAppointments.length === 0
                ? <p className="text-slate-400 text-sm text-center py-6">אין נתונים</p>
                : (
                  <div className="space-y-3">
                    {topByAppointments.map((b, i) => (
                      <HBar
                        key={b._id}
                        rank={i + 1}
                        label={b.businessName || b.name}
                        value={b.totalAppointments}
                        max={topByAppointments[0].totalAppointments}
                        color={i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-blue-400' : i === 2 ? 'bg-blue-300' : 'bg-slate-300 dark:bg-slate-600'}
                      />
                    ))}
                  </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-5 text-right text-sm">TOP 10 — לפי הכנסות</h3>
              {topByRevenue.length === 0
                ? <p className="text-slate-400 text-sm text-center py-6">אין נתוני הכנסות</p>
                : (
                  <div className="space-y-3">
                    {topByRevenue.map((b, i) => (
                      <HBar
                        key={b._id}
                        rank={i + 1}
                        label={b.businessName || b.name}
                        value={b.totalRevenue}
                        max={topByRevenue[0].totalRevenue}
                        color={i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-emerald-400' : i === 2 ? 'bg-emerald-300' : 'bg-slate-300 dark:bg-slate-600'}
                        format={v => `₪${v.toLocaleString()}`}
                      />
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* MoM growth chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-5 text-right text-sm">צמיחה בתורים — החודש vs. חודש קודם</h3>
            {growingBusinesses.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">אין נתוני השוואה (נדרשת פעילות גם החודש וגם חודש שעבר)</p>
            ) : (
              <div className="space-y-2.5">
                {growingBusinesses.map(b => (
                  <div key={b._id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-28 text-right truncate flex-shrink-0">{b.businessName || b.name}</span>
                    <span className="text-xs text-slate-400 w-5 text-left flex-shrink-0">{b.appointmentsLastMonth}</span>
                    <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg ${b.delta >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                        style={{ width: `${(Math.abs(b.delta) / maxGrowthAbs) * 100}%`, minWidth: Math.abs(b.delta) > 0 ? '4px' : 0 }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-16 text-left flex-shrink-0 ${b.delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : b.delta < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {b.delta > 0 ? '+' : ''}{b.delta} → {b.appointmentsThisMonth}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           TAB: לוגים
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && <AdminLogsTab />}

      {/* ══════════════════════════════════════════════════════════
           TAB: התראות
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'alerts' && (
        <AdminAlertsTab businesses={businesses} onBusinessUpdated={loadStats} />
      )}

      {/* ══════════════════════════════════════════════════════════
           TAB: שליטת התראות
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'notif-control' && (
        <div className="max-w-lg mx-auto space-y-4">
          <div className="text-right mb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">שליטת התראות מערכת</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">הפעל או השבת סוגי התראות ברמת המערכת עבור כל המשתמשים</p>
          </div>

          {!notifSettings ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {[
                { key: 'reminders',     label: 'תזכורות תור',       desc: 'שליחת תזכורת 24 שעות ו-30 דקות לפני התור (Cron)',       color: 'blue'   },
                { key: 'confirmations', label: 'אישור קביעת תור',   desc: 'התראה לבעל העסק כשלקוח קובע תור חדש',                  color: 'emerald' },
                { key: 'cancellations', label: 'ביטול תור',          desc: 'התראה כשתור מבוטל — לבעל העסק וללקוח',                 color: 'red'    },
                { key: 'reschedules',   label: 'שינוי/עדכון תור',   desc: 'התראה על שינוי סטטוס תור — לבעל העסק וללקוח',          color: 'amber'  },
              ].map(({ key, label, desc, color }) => {
                const colorMap = {
                  blue:    'bg-blue-50 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-700/40',
                  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/40',
                  red:     'bg-red-50 dark:bg-red-900/20 border-red-200/60 dark:border-red-700/40',
                  amber:   'bg-amber-50 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-700/40',
                };
                const dotMap = {
                  blue: 'bg-blue-500', emerald: 'bg-emerald-500', red: 'bg-red-500', amber: 'bg-amber-500'
                };
                return (
                  <div key={key} className={`flex items-center justify-between p-4 rounded-2xl border ${colorMap[color]}`}>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={!!notifSettings[key]}
                        onChange={(e) => setNotifSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className={`w-[52px] h-[32px] bg-slate-200 dark:bg-slate-600 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-[28px] after:w-[28px] after:transition-all after:shadow-sm peer-checked:after:translate-x-[20px] rtl:peer-checked:after:-translate-x-[20px]`} />
                    </label>
                    <div className="text-right flex-1 mr-4">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`w-2 h-2 rounded-full ${notifSettings[key] ? dotMap[color] : 'bg-slate-300'}`} />
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={async () => {
                  setNotifSaving(true);
                  try {
                    await api.put('/users/admin/notification-settings', { notifications: notifSettings });
                    toast.success('הגדרות נשמרו');
                  } catch {
                    toast.error('שגיאה בשמירה');
                  }
                  setNotifSaving(false);
                }}
                disabled={notifSaving}
                className="w-full h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-2xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {notifSaving
                  ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  : null}
                שמור הגדרות
              </button>

              <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3 text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  שינויים יכנסו לתוקף תוך 5 דקות (cache). כיבוי סוג התראה ימנע שליחה חדשה — התראות שכבר נשלחו לא יבוטלו.
                </p>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
