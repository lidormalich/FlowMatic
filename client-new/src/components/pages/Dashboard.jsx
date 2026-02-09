import { Link } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

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

  const cards = [
    {
      title: 'ניהול משתמשים',
      description: 'הוסף, ערוך ומחק משתמשים במערכת',
      icon: '👥',
      link: '/users',
      color: 'from-blue-500 to-blue-600',
      roles: ['admin'],
    },
    {
      title: 'יומן תורים',
      description: 'צפה ונהל את כל התורים במערכת',
      icon: '📅',
      link: '/events',
      color: 'from-purple-500 to-purple-600',
      roles: ['admin', 'business_owner'],
    },
    {
      title: 'סוגי תורים',
      description: 'נהל את סוגי השירותים והתורים',
      icon: '⚙️',
      link: '/appointment-types',
      color: 'from-green-500 to-green-600',
      roles: ['admin', 'business_owner'],
    },
    {
      title: 'הגדרות עסק',
      description: 'נהל את פרטי העסק והגדרות',
      icon: '🛠️',
      link: '/settings',
      color: 'from-orange-500 to-orange-600',
      roles: ['business_owner'],
    },
    {
      title: 'הקישור הציבורי שלי',
      description: 'דף קביעת תורים ללקוחות',
      icon: '🔗',
      link: `/book/${user?.username}`,
      color: 'from-pink-500 to-pink-600',
      roles: ['business_owner'],
    },
  ];

  // Filter cards based on user role
  const filteredCards = cards.filter(card =>
    !card.roles || card.roles.includes(user?.role)
  );

  const StatCard = ({ icon, value, label, color }) => (
    <div className={`text-center bg-white/10 rounded-xl p-5 backdrop-blur-sm hover:bg-white/20 transition-all duration-300`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
    </div>
  );

  const StatCardSkeleton = () => (
    <div className="text-center bg-white/10 rounded-xl p-5 backdrop-blur-sm animate-pulse">
      <div className="w-10 h-10 bg-white/20 rounded-full mx-auto mb-2"></div>
      <div className="w-16 h-8 bg-white/20 rounded mx-auto mb-1"></div>
      <div className="w-20 h-4 bg-white/20 rounded mx-auto"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          שלום {user?.name}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          ברוך הבא למערכת ניהול התורים FlowMatic
        </p>
      </div>

      {/* Stats Section - For Business Owners */}
      {user?.role === 'business_owner' && (
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-xl p-8 text-white mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right">
              <div className="text-5xl mb-3">📊</div>
              <h4 className="text-2xl font-bold mb-2">סקירה כללית</h4>
              <p className="text-white/90">נתונים עדכניים על העסק שלך</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 flex-1">
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
                  />
                  <StatCard
                    icon="📆"
                    value={stats?.upcomingAppointments || 0}
                    label="תורים השבוע"
                  />
                  <StatCard
                    icon="💰"
                    value={`₪${stats?.monthlyRevenue || 0}`}
                    label="הכנסה החודש"
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
        </div>
      )}

      {/* Credits Info for Business Owner */}
      {user?.role === 'business_owner' && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl shadow-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">💳</div>
              <div>
                <h4 className="text-xl font-bold">יתרת קרדיטים</h4>
                <p className="text-white/90">לשליחת הודעות SMS ללקוחות</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{user?.credits || 0}</div>
              <div className="text-sm text-white/80">קרדיטים זמינים</div>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredCards.length > 0 ? (
          filteredCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
            >
              {/* Gradient top border */}
              <div className={`h-2 bg-gradient-to-r ${card.color}`}></div>

              <div className="p-6 text-center">
                {/* Icon */}
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-4">
                  {card.description}
                </p>

                {/* Arrow */}
                <div className={`inline-flex items-center gap-2 text-transparent bg-gradient-to-r ${card.color} bg-clip-text font-semibold group-hover:gap-4 transition-all`}>
                  <span>לחץ כאן</span>
                  <span>←</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">ברוכים הבאים!</h3>
            <p className="text-gray-600 mb-6">
              נראה שאין פעולות זמינות עבורך כרגע.
              <br />
              צור קשר עם מנהל המערכת לקבלת הרשאות.
            </p>
          </div>
        )}
      </div>

      {/* Quick Link for Public Page */}
      {user?.role === 'business_owner' && user?.username && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-right">
              <h4 className="text-xl font-bold text-gray-800 mb-1">הקישור הציבורי שלך</h4>
              <p className="text-gray-600">שתף את הקישור עם לקוחות לקביעת תורים</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-sm" dir="ltr">
                {window.location.origin}/book/{user.username}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/book/${user.username}`);
                  // Could add toast here
                }}
                className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                📋 העתק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
