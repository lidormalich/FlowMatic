import { Link } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

// Mini sparkline SVG component
const Sparkline = ({ data, color = '#3b82f6', height = 40 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h * 0.85);
    return `${x},${y}`;
  }).join(' ');

  // Area fill path
  const firstX = 0;
  const lastX = w;
  const areaPath = `M${firstX},${h} L${points.split(' ').map(p => p).join(' L')} L${lastX},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: `${h}px`, display: 'block', marginTop: '0.5rem' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/appointments/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
    setLoading(false);
  };

  const quickActions = [
    {
      title: 'ניהול משתמשים',
      description: 'הוסף, ערוך ומחק משתמשים',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      link: '/users',
      color: 'blue',
      roles: ['admin'],
    },
    {
      title: 'יומן תורים',
      description: 'צפה ונהל את כל התורים',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      link: '/events',
      color: 'purple',
      roles: ['admin', 'business_owner'],
    },
    {
      title: 'סוגי תורים',
      description: 'נהל סוגי שירותים ותורים',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      link: '/appointment-types',
      color: 'green',
      roles: ['admin', 'business_owner'],
    },
    {
      title: 'לקוחות',
      description: 'צפה ונהל את הלקוחות שלך',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      link: '/clients',
      color: 'teal',
      roles: ['admin', 'business_owner'],
    },
    {
      title: 'דוחות',
      description: 'נתונים וסטטיסטיקות',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      link: '/reports',
      color: 'indigo',
      roles: ['admin', 'business_owner'],
    },
    {
      title: 'צוות',
      description: 'נהל את צוות העובדים',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      link: '/staff',
      color: 'cyan',
      roles: ['admin', 'business_owner'],
    },
    {
      title: 'מלאי',
      description: 'נהל מוצרים ומלאי',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      link: '/inventory',
      color: 'amber',
      roles: ['admin', 'business_owner'],
    },
    {
      title: 'רשימת המתנה',
      description: 'נהל רשימת המתנה',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/waitlist',
      color: 'rose',
      roles: ['admin', 'business_owner'],
    },
    {
      title: 'הגדרות עסק',
      description: 'נהל את פרטי העסק',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      link: '/settings',
      color: 'orange',
      roles: ['business_owner'],
    },
    {
      title: 'הקישור הציבורי שלי',
      description: 'דף קביעת תורים ללקוחות',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      link: `/book/${user?.username}`,
      color: 'pink',
      roles: ['business_owner'],
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'bg-blue-500 text-white',
      text: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'bg-purple-500 text-white',
      text: 'text-purple-600 dark:text-purple-400',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'bg-green-500 text-white',
      text: 'text-green-600 dark:text-green-400',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'bg-orange-500 text-white',
      text: 'text-orange-600 dark:text-orange-400',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      icon: 'bg-pink-500 text-white',
      text: 'text-pink-600 dark:text-pink-400',
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      icon: 'bg-teal-500 text-white',
      text: 'text-teal-600 dark:text-teal-400',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: 'bg-indigo-500 text-white',
      text: 'text-indigo-600 dark:text-indigo-400',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      icon: 'bg-cyan-500 text-white',
      text: 'text-cyan-600 dark:text-cyan-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'bg-amber-500 text-white',
      text: 'text-amber-600 dark:text-amber-400',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      icon: 'bg-rose-500 text-white',
      text: 'text-rose-600 dark:text-rose-400',
    },
  };

  // Filter cards based on user role
  const filteredActions = quickActions.filter(action =>
    !action.roles || action.roles.includes(user?.role)
  );

  const StatCard = ({ icon, value, label, trend, sparkline, sparkColor }) => (
    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      {sparkline && sparkline.length > 1 && (
        <Sparkline data={sparkline} color={sparkColor || '#3b82f6'} height={36} />
      )}
    </div>
  );

  const StatCardSkeleton = () => (
    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
      <div className="w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
      <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          שלום, {user?.name}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          ברוך הבא למערכת ניהול התורים FlowMatic
        </p>
      </div>

      {/* Stats Section - For Business Owners */}
      {user?.role === 'business_owner' && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">סקירה כללית</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">נתונים עדכניים על העסק שלך</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  icon="📅"
                  value={stats?.todayAppointments || 0}
                  label="תורים היום"
                  sparkline={stats?.weeklyTrend}
                  sparkColor="#3b82f6"
                />
                <StatCard
                  icon="📆"
                  value={stats?.upcomingAppointments || 0}
                  label="תורים השבוע"
                  sparkline={stats?.weeklyTrend}
                  sparkColor="#8b5cf6"
                />
                <StatCard
                  icon="₪"
                  value={stats?.monthlyRevenue?.toLocaleString() || 0}
                  label="הכנסה החודש"
                  sparkline={stats?.monthlyRevenueTrend}
                  sparkColor="#10b981"
                />
                <StatCard
                  icon="👥"
                  value={stats?.newClients || 0}
                  label="לקוחות חדשים"
                />
                <StatCard
                  icon="✅"
                  value={stats?.completedThisMonth || 0}
                  label="הושלמו החודש"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Credits Info for Business Owner */}
      {user?.role === 'business_owner' && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 mb-10 shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="text-white">
                <h4 className="text-xl font-bold">יתרת קרדיטים</h4>
                <p className="text-white/80 text-sm">לשליחת הודעות SMS ללקוחות</p>
              </div>
            </div>
            <div className="text-right text-white">
              <div className="text-4xl font-bold">{user?.credits || 0}</div>
              <div className="text-sm text-white/80">קרדיטים זמינים</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - Bento Grid */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">פעולות מהירות</h2>

        {filteredActions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredActions.map((action, index) => {
              const colors = colorClasses[action.color];
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-12 h-12 ${colors.icon} rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {action.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    {action.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                    {action.description}
                  </p>
                  <div className={`flex items-center gap-2 ${colors.text} font-medium text-sm`}>
                    <span>לחץ כאן</span>
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">ברוכים הבאים!</h3>
            <p className="text-slate-500 dark:text-slate-400">
              נראה שאין פעולות זמינות עבורך כרגע.
              <br />
              צור קשר עם מנהל המערכת לקבלת הרשאות.
            </p>
          </div>
        )}
      </div>

      {/* Public Link Section */}
      {user?.role === 'business_owner' && user?.username && (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-right">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">הקישור הציבורי שלך</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">שתף את הקישור עם לקוחות לקביעת תורים</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-2xl font-mono text-sm text-slate-600 dark:text-slate-300" dir="ltr">
                {window.location.origin}/book/{user.username}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/book/${user.username}`);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-full font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                העתק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
