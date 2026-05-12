import { useState, useEffect } from 'react';
import api from '../../services/api';
import moment from 'moment';
import 'moment/locale/he';
import { toast } from 'react-toastify';

moment.locale('he');

const PAGE_SIZE = 50;

// ─── Reusable UI atoms ────────────────────────────────────────────

const Spinner = () => (
  <div className="flex justify-center items-center py-16">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const Empty = ({ icon, label }) => (
  <div className="text-center py-16 text-slate-400">
    <p className="text-4xl mb-3">{icon}</p>
    <p className="text-sm">{label}</p>
  </div>
);

const DateInput = ({ value, onChange }) => (
  <input
    type="date"
    value={value}
    onChange={e => onChange(e.target.value)}
    className="h-9 bg-slate-50 dark:bg-slate-700 border-0 rounded-xl px-2.5 text-xs text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-400 outline-none"
  />
);

const SearchInput = ({ value, onChange, onEnter, placeholder }) => (
  <div className="relative flex-1 min-w-[180px]">
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onEnter()}
      placeholder={placeholder}
      className="w-full h-9 bg-slate-50 dark:bg-slate-700 border-0 rounded-xl pr-8 pl-3 text-xs text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400 outline-none"
    />
  </div>
);

const RefreshBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    title="רענן"
    className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
  >
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    רענן
  </button>
);

const ApplyBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
  >
    חפש
  </button>
);

const Pagination = ({ page, total, onChange }) => {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return (
    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 text-right bg-slate-50/50 dark:bg-slate-800/50">
      {total.toLocaleString()} רשומות
    </div>
  );
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        הקודם
      </button>
      <span className="text-xs text-slate-400 tabular-nums">
        עמוד <strong className="text-slate-600 dark:text-slate-300">{page + 1}</strong> מתוך {totalPages} · {total.toLocaleString()} רשומות
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
      >
        הבא
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
    </div>
  );
};

// ─── System log row ────────────────────────────────────────────────

const LEVEL_META = {
  error: { label: 'שגיאה',  bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-400'    },
  warn:  { label: 'אזהרה',  bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  info:  { label: 'מידע',   bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400'  },
  debug: { label: 'debug',  bg: 'bg-slate-100 dark:bg-slate-700',    text: 'text-slate-600 dark:text-slate-400'},
};

const SysLogRow = ({ log }) => {
  const meta = LEVEL_META[log.level] || LEVEL_META.info;
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors border-b border-slate-100 dark:border-slate-700/40 last:border-0">
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 mt-0.5 ${meta.bg} ${meta.text}`}>
        {meta.label}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">
          {log.message}
        </p>
        {log.hostname && (
          <span className="text-[10px] text-slate-400 mt-0.5 inline-block">host: {log.hostname}</span>
        )}
        {log.metadata && Object.keys(log.metadata || {}).length > 0 && (
          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            {JSON.stringify(log.metadata)}
          </p>
        )}
      </div>
      <span className="text-[10px] text-slate-400 flex-shrink-0 whitespace-nowrap tabular-nums">
        {moment(log.timestamp).format('DD/MM HH:mm:ss')}
      </span>
    </div>
  );
};

// ─── Audit log row ─────────────────────────────────────────────────

const ACTION_COLOR = (action = '') => {
  const a = action.toUpperCase();
  if (a.includes('DELETE'))  return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  if (a.includes('POST') || a.includes('CREATE')) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
  if (a.includes('PUT') || a.includes('PATCH') || a.includes('UPDATE')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
  return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
};

const AuditLogRow = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = log.details && Object.keys(log.details || {}).length > 0;
  const user = log.userId;
  const userName = user?.businessName || user?.name || user?.email || 'מערכת';

  return (
    <div className="border-b border-slate-100 dark:border-slate-700/40 last:border-0">
      <div
        className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetails && setExpanded(e => !e)}
      >
        <span className="text-[10px] text-slate-400 flex-shrink-0 whitespace-nowrap tabular-nums w-24 text-right mt-0.5">
          {moment(log.timestamp).format('DD/MM HH:mm:ss')}
        </span>

        <div className="flex items-center gap-1.5 w-32 flex-shrink-0 min-w-0">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
            {userName[0]?.toUpperCase()}
          </div>
          <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">{userName}</span>
        </div>

        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${ACTION_COLOR(log.action)}`}>
          {log.action}
        </span>

        <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 truncate">
          {log.resource}
          {log.resourceId && (
            <span className="text-slate-300 dark:text-slate-600 mr-1 font-mono text-[10px]">
              #{String(log.resourceId).slice(-6)}
            </span>
          )}
        </span>

        {log.ip && (
          <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono hidden md:block" dir="ltr">
            {log.ip}
          </span>
        )}

        {hasDetails ? (
          <svg
            className={`w-3 h-3 text-slate-400 flex-shrink-0 transition-transform mt-0.5 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
      </div>

      {expanded && hasDetails && (
        <div className="px-4 pb-3 bg-slate-50 dark:bg-slate-800/60">
          <pre className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 rounded-xl p-3 overflow-x-auto max-h-40 leading-relaxed">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────

const AdminLogsTab = () => {
  const [sub, setSub] = useState('system');

  // ── System logs state ──
  const [sysLevel,  setSysLevel]  = useState('all');
  const [sysSearch, setSysSearch] = useState('');
  const [sysStart,  setSysStart]  = useState('');
  const [sysEnd,    setSysEnd]    = useState('');
  const [sysPage,   setSysPage]   = useState(0);
  const [sysData,   setSysData]   = useState(null);
  const [sysLoading, setSysLoading] = useState(false);
  const [sysKey,    setSysKey]    = useState(0);

  // ── Audit logs state ──
  const [audUserId, setAudUserId] = useState('');
  const [audSearch, setAudSearch] = useState('');
  const [audStart,  setAudStart]  = useState('');
  const [audEnd,    setAudEnd]    = useState('');
  const [audPage,   setAudPage]   = useState(0);
  const [audData,   setAudData]   = useState(null);
  const [audLoading, setAudLoading] = useState(false);
  const [audUsers,  setAudUsers]  = useState([]);
  const [audKey,    setAudKey]    = useState(0);

  // Load system logs — fires on level change, page change, or manual refresh/search
  useEffect(() => {
    if (sub !== 'system') return;
    let cancelled = false;
    setSysLoading(true);
    const params = {
      limit: PAGE_SIZE,
      skip:  sysPage * PAGE_SIZE,
      ...(sysLevel !== 'all' && { level: sysLevel }),
      ...(sysSearch.trim() && { search: sysSearch.trim() }),
      ...(sysStart && { startDate: sysStart }),
      ...(sysEnd   && { endDate:   sysEnd   }),
    };
    api.get('/users/admin/system-logs', { params })
      .then(res => { if (!cancelled) setSysData(res.data); })
      .catch(() => {
        if (!cancelled) { toast.error('שגיאה בטעינת לוגי מערכת'); setSysData({ logs: [], total: 0 }); }
      })
      .finally(() => { if (!cancelled) setSysLoading(false); });
    return () => { cancelled = true; };
  }, [sub, sysLevel, sysPage, sysKey]);

  // Load audit logs — fires on user change, page change, or manual refresh/search
  useEffect(() => {
    if (sub !== 'audit') return;
    let cancelled = false;
    setAudLoading(true);
    const params = {
      limit: PAGE_SIZE,
      skip:  audPage * PAGE_SIZE,
      ...(audUserId && { userId: audUserId }),
      ...(audSearch.trim() && { search: audSearch.trim() }),
      ...(audStart && { startDate: audStart }),
      ...(audEnd   && { endDate:   audEnd   }),
    };
    api.get('/users/admin/audit-logs', { params })
      .then(res => {
        if (!cancelled) {
          setAudData(res.data);
          if (res.data.users?.length) setAudUsers(res.data.users);
        }
      })
      .catch(() => {
        if (!cancelled) { toast.error('שגיאה בטעינת לוג פעולות'); setAudData({ logs: [], total: 0 }); }
      })
      .finally(() => { if (!cancelled) setAudLoading(false); });
    return () => { cancelled = true; };
  }, [sub, audUserId, audPage, audKey]);

  const applySys = () => { setSysPage(0); setSysKey(k => k + 1); };
  const applyAud = () => { setAudPage(0); setAudKey(k => k + 1); };

  const resetSys = () => { setSysSearch(''); setSysStart(''); setSysEnd(''); setSysPage(0); setSysKey(k => k + 1); };
  const resetAud = () => { setAudSearch(''); setAudStart(''); setAudEnd(''); setAudUserId(''); setAudPage(0); setAudKey(k => k + 1); };

  return (
    <div className="space-y-4">

      {/* ── Sub-tab bar ── */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {[
          { key: 'system', label: 'לוגי מערכת',   count: sysData?.total },
          { key: 'audit',  label: 'לוג פעולות',   count: audData?.total },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              sub === t.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
            {t.count != null && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                {t.count.toLocaleString()}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
           SUB-TAB: לוגי מערכת
      ══════════════════════════════════════════════════════════ */}
      {sub === 'system' && (
        <div>
          {/* Filter bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-3">

            {/* Row 1: level chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { key: 'all',   label: 'הכל',        dot: 'bg-slate-400'   },
                { key: 'error', label: 'שגיאות קריטיות', dot: 'bg-red-500'  },
                { key: 'warn',  label: 'אזהרות',      dot: 'bg-amber-500'  },
              ].map(l => (
                <button
                  key={l.key}
                  onClick={() => { setSysLevel(l.key); setSysPage(0); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    sysLevel === l.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${l.dot} ${sysLevel === l.key ? 'bg-white/70' : ''}`} />
                  {l.label}
                </button>
              ))}

              {/* Live count indicator */}
              {sysData != null && (
                <span className="mr-auto text-xs text-slate-400 self-center">
                  {sysLoading ? 'טוען...' : `${sysData.total.toLocaleString()} רשומות`}
                </span>
              )}
            </div>

            {/* Row 2: search + date + buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={sysSearch}
                onChange={setSysSearch}
                onEnter={applySys}
                placeholder="חפש בהודעות..."
              />

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                <span>מ-</span>
                <DateInput value={sysStart} onChange={setSysStart} />
                <span>עד</span>
                <DateInput value={sysEnd}   onChange={setSysEnd}   />
              </div>

              <ApplyBtn onClick={applySys} />
              <RefreshBtn onClick={resetSys} />
            </div>
          </div>

          {/* Log list */}
          {sysLoading ? (
            <Spinner />
          ) : sysData === null ? (
            <Spinner />
          ) : sysData.logs.length === 0 ? (
            <Empty icon="📋" label="לא נמצאו לוגים עבור הפילטר הנוכחי" />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="max-h-[62vh] overflow-y-auto">
                {sysData.logs.map((log, i) => (
                  <SysLogRow key={log._id || i} log={log} />
                ))}
              </div>
              <Pagination page={sysPage} total={sysData.total} onChange={setSysPage} />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           SUB-TAB: לוג פעולות
      ══════════════════════════════════════════════════════════ */}
      {sub === 'audit' && (
        <div>
          {/* Filter bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-3">

            {/* Row 1: user + search */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* User dropdown */}
              <div className="relative">
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <select
                  value={audUserId}
                  onChange={e => { setAudUserId(e.target.value); setAudPage(0); }}
                  className="h-9 bg-slate-50 dark:bg-slate-700 border-0 rounded-xl pr-8 pl-3 text-xs text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-400 outline-none min-w-[180px] appearance-none"
                >
                  <option value="">כל המשתמשים</option>
                  {audUsers.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.businessName || u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <SearchInput
                value={audSearch}
                onChange={setAudSearch}
                onEnter={applyAud}
                placeholder="חפש לפי פעולה / משאב..."
              />

              {audData != null && (
                <span className="mr-auto text-xs text-slate-400 self-center">
                  {audLoading ? 'טוען...' : `${audData.total.toLocaleString()} רשומות`}
                </span>
              )}
            </div>

            {/* Row 2: date range + buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>מ-</span>
                <DateInput value={audStart} onChange={setAudStart} />
                <span>עד</span>
                <DateInput value={audEnd}   onChange={setAudEnd}   />
              </div>

              <ApplyBtn onClick={applyAud} />
              <RefreshBtn onClick={resetAud} />
            </div>
          </div>

          {/* Legend for action colors */}
          <div className="flex flex-wrap gap-2 mb-3 text-[10px]">
            {[
              { label: 'מחיקה',  cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'         },
              { label: 'יצירה',  cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
              { label: 'עדכון',  cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'     },
              { label: 'אחר',    cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'    },
            ].map(l => (
              <span key={l.label} className={`px-2 py-0.5 rounded font-bold ${l.cls}`}>{l.label}</span>
            ))}
          </div>

          {/* Audit log table */}
          {audLoading ? (
            <Spinner />
          ) : audData === null ? (
            <Spinner />
          ) : audData.logs.length === 0 ? (
            <Empty icon="🔍" label="לא נמצאו רשומות עבור הפילטר הנוכחי" />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Column headers */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="w-24 text-right flex-shrink-0">זמן</span>
                <span className="w-32 flex-shrink-0">משתמש</span>
                <span className="flex-shrink-0 w-20">פעולה</span>
                <span className="flex-1">משאב</span>
                <span className="hidden md:block w-24 flex-shrink-0">IP</span>
                <span className="w-3 flex-shrink-0" />
              </div>

              <div className="max-h-[62vh] overflow-y-auto">
                {audData.logs.map((log, i) => (
                  <AuditLogRow key={log._id || i} log={log} />
                ))}
              </div>
              <Pagination page={audPage} total={audData.total} onChange={setAudPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLogsTab;
