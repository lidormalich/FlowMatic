import { useState, useEffect } from 'react';
import api from '../../services/api';
import moment from 'moment';
import 'moment/locale/he';
import { toast } from 'react-toastify';

moment.locale('he');

const Section = ({ title, children }) => (
  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 mb-4">
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 text-right">{title}</h3>
    {children}
  </div>
);

const Row = ({ label, value, dir }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
    <span className="text-slate-500 dark:text-slate-400 text-xs" dir="ltr">{value ?? '—'}</span>
    <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{label}</span>
  </div>
);

const StatusBadge = ({ isSuspended, isInactive }) => {
  if (isSuspended) return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">מושעה</span>;
  if (isInactive) return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">לא פעיל</span>;
  return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">פעיל</span>;
};

const BusinessDetailModal = ({ businessId, onClose, onUpdated }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [creditsInput, setCreditsInput] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [subNotes, setSubNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/users/admin/business/${businessId}`);
        setDetail(res.data);
        setSubStatus(res.data.user.subscription?.status || 'trial');
        setSubNotes(res.data.user.subscription?.notes || '');
      } catch {
        toast.error('שגיאה בטעינת פרטי עסק');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [businessId]);

  const handleSuspend = async () => {
    const isSuspended = detail.user.isSuspended;
    const action = isSuspended ? 'לבטל השעיה' : 'להשעות';
    if (!window.confirm(`האם אתה בטוח שברצונך ${action} את העסק הזה?`)) return;
    setActionLoading(true);
    try {
      await api.post(`/users/${businessId}/suspend`, { suspend: !isSuspended });
      toast.success(isSuspended ? 'ההשעיה בוטלה' : 'העסק הושעה');
      setDetail(d => ({ ...d, user: { ...d.user, isSuspended: !isSuspended } }));
      onUpdated?.();
    } catch {
      toast.error('שגיאה בעדכון סטטוס');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    setActionLoading(true);
    try {
      await api.put(`/users/${businessId}/subscription`, { status: subStatus, notes: subNotes });
      toast.success('מנוי עודכן בהצלחה');
      setDetail(d => ({ ...d, user: { ...d.user, subscription: { ...d.user.subscription, status: subStatus, notes: subNotes } } }));
      onUpdated?.();
    } catch {
      toast.error('שגיאה בעדכון מנוי');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCredits = async () => {
    const amount = parseInt(creditsInput);
    if (isNaN(amount) || amount === 0) return;
    setActionLoading(true);
    try {
      await api.post(`/users/${businessId}/credits`, { amount });
      toast.success(`${amount > 0 ? 'נוספו' : 'הורדו'} ${Math.abs(amount)} קרדיטים`);
      setDetail(d => ({ ...d, user: { ...d.user, credits: (d.user.credits || 0) + amount } }));
      setCreditsInput('');
      onUpdated?.();
    } catch {
      toast.error('שגיאה בעדכון קרדיטים');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { key: 'overview', label: 'סקירה' },
    { key: 'appointments', label: 'תורים אחרונים' },
    { key: 'audit', label: 'יומן פעילות' },
    { key: 'actions', label: 'פעולות' },
  ];

  const isInactive = detail?.stats?.lastActivity
    ? new Date(detail.stats.lastActivity) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          {loading ? (
            <div className="w-40 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-center gap-3">
              {detail.user.themeSettings?.logoUrl ? (
                <img src={detail.user.themeSettings.logoUrl} className="w-10 h-10 rounded-xl object-cover" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                  {(detail.user.businessName || detail.user.name || '?')[0]}
                </div>
              )}
              <div>
                <h2 className="font-bold text-slate-800 dark:text-white">{detail.user.businessName || detail.user.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge isSuspended={detail.user.isSuspended} isInactive={isInactive} />
                  <span className="text-xs text-slate-400">{detail.user.subscription?.status || 'trial'}</span>
                </div>
              </div>
            </div>
          )}
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 flex-shrink-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === t.key ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* ── Overview ── */}
              {activeTab === 'overview' && (
                <>
                  <Section title="פרטי קשר">
                    <Row label="שם מלא" value={detail.user.name} />
                    <Row label="אימייל" value={detail.user.email} />
                    <Row label="טלפון" value={detail.user.phoneNumber || '—'} />
                    <Row label="שם משתמש" value={`@${detail.user.username}`} />
                    <Row label="כתובת" value={detail.user.businessAddress || '—'} />
                    <Row label="סוג עסק" value={detail.user.businessType || '—'} />
                    <Row label="נרשם" value={moment(detail.user.date).format('DD/MM/YYYY HH:mm')} />
                  </Section>

                  <Section title="נתוני תורים">
                    <Row label="סה״כ תורים" value={detail.stats.totalAppointments} />
                    <Row label="הושלמו" value={detail.stats.completedAppointments} />
                    <Row label="בוטלו" value={detail.stats.cancelledAppointments} />
                    <Row label="לא הגיעו (no-show)" value={detail.stats.noShowAppointments} />
                    <Row label="הכנסות כוללות" value={`₪${(detail.stats.totalRevenue || 0).toLocaleString()}`} />
                    <Row label="לקוחות ייחודיים" value={detail.stats.uniqueClientsCount} />
                    <Row label="תורים החודש" value={detail.stats.appointmentsThisMonth} />
                  </Section>

                  <Section title="שימוש במערכת (לחיוב)">
                    <Row label="תורים שנוצרו" value={detail.stats.usageStats?.appointmentsCreated ?? 0} />
                    <Row label="תורים שבוטלו" value={detail.stats.usageStats?.appointmentsCancelled ?? 0} />
                    <Row label="לקוחות שנוספו" value={detail.stats.usageStats?.clientsAdded ?? 0} />
                    <Row label="SMS שנשלחו" value={detail.stats.usageStats?.smsSent ?? 0} />
                    <Row label="כניסות למערכת" value={detail.stats.loginCount} />
                    <Row label="כניסה אחרונה" value={detail.stats.lastLoginAt ? moment(detail.stats.lastLoginAt).format('DD/MM/YYYY HH:mm') : 'אף פעם'} />
                    <Row label="פעילות אחרונה" value={detail.stats.lastActivity ? moment(detail.stats.lastActivity).fromNow() : 'אין'} />
                  </Section>

                  <Section title="מנוי וקרדיטים">
                    <Row label="סטטוס מנוי" value={detail.user.subscription?.status} />
                    <Row label="התחיל" value={detail.user.subscription?.subscribedAt ? moment(detail.user.subscription.subscribedAt).format('DD/MM/YYYY') : '—'} />
                    <Row label="תום ניסיון" value={detail.user.subscription?.trialEndsAt ? moment(detail.user.subscription.trialEndsAt).format('DD/MM/YYYY') : '—'} />
                    <Row label="קרדיטים" value={detail.user.credits} />
                    <Row label="הערות מנהל" value={detail.user.subscription?.notes || '—'} />
                  </Section>

                  <Section title="תנאי שימוש">
                    <Row label="אישר ToS" value={detail.user.tos?.agreedAt ? `✓ ${moment(detail.user.tos.agreedAt).format('DD/MM/YYYY')}` : '✗ לא אישר'} />
                    <Row label="גרסה" value={detail.user.tos?.version || '—'} />
                    <Row label="IP בהרשמה" value={detail.user.tos?.ip || '—'} />
                  </Section>
                </>
              )}

              {/* ── Recent Appointments ── */}
              {activeTab === 'appointments' && (
                <div className="space-y-2">
                  {detail.recentAppointments.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">אין תורים עדיין</p>
                  ) : detail.recentAppointments.map(a => (
                    <div key={a._id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                      <div className="text-left">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          a.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                          a.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          a.status === 'no_show' ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>{a.status === 'completed' ? 'הושלם' : a.status === 'cancelled' ? 'בוטל' : a.status === 'no_show' ? 'לא הגיע' : 'מאושר'}</span>
                        {a.price > 0 && <span className="text-xs text-slate-400 mr-2">₪{a.price}</span>}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{a.customerName}</p>
                        <p className="text-xs text-slate-400">{moment(a.date).format('DD/MM/YYYY')} {a.startTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Audit Log ── */}
              {activeTab === 'audit' && (
                <div className="space-y-1.5">
                  {detail.auditLogs.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">אין פעולות מתועדות</p>
                  ) : detail.auditLogs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5">
                      <span className="text-xs text-slate-400">{moment(log.timestamp).format('DD/MM HH:mm')}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          log.action === 'login' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          log.action === 'delete' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          log.action === 'create' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>{log.action}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{log.resource}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Actions ── */}
              {activeTab === 'actions' && (
                <div className="space-y-4">
                  {/* Suspend */}
                  <Section title="השעיית עסק">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 text-right">
                      {detail.user.isSuspended ? 'העסק כרגע מושעה. ביטול ההשעיה יאפשר לו להתחבר ולנהל תורים.' : 'השעיה תמנע מהעסק להתחבר למערכת.'}
                    </p>
                    <button onClick={handleSuspend} disabled={actionLoading}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 ${detail.user.isSuspended ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
                      {detail.user.isSuspended ? 'בטל השעיה' : 'השעה עסק'}
                    </button>
                  </Section>

                  {/* Subscription */}
                  <Section title="עדכון מנוי">
                    <div className="space-y-3">
                      <select value={subStatus} onChange={e => setSubStatus(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300">
                        <option value="trial">ניסיון</option>
                        <option value="active">פעיל</option>
                        <option value="suspended">מושעה</option>
                        <option value="expired">פג תוקף</option>
                      </select>
                      <textarea value={subNotes} onChange={e => setSubNotes(e.target.value)}
                        placeholder="הערות מנהל (אופציונלי)..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none h-20 text-right"
                      />
                      <button onClick={handleUpdateSubscription} disabled={actionLoading}
                        className="w-full py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50">
                        עדכן מנוי
                      </button>
                    </div>
                  </Section>

                  {/* Credits */}
                  <Section title="ניהול קרדיטים">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 text-right">
                      קרדיטים נוכחיים: <span className="font-bold text-slate-700 dark:text-slate-200">{detail.user.credits}</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleAddCredits} disabled={actionLoading || !creditsInput}
                        className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 flex-shrink-0">
                        עדכן
                      </button>
                      <input type="number" value={creditsInput} onChange={e => setCreditsInput(e.target.value)}
                        placeholder="כמות (שלילי להורדה)"
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300" dir="ltr"
                      />
                    </div>
                  </Section>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailModal;
