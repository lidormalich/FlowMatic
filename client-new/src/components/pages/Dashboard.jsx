import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

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
      title: 'הקישור הציבורי שלי',
      description: 'דף קביעת תורים ללקוחות',
      icon: '🔗',
      link: `/users/${user?.username}`,
      color: 'from-pink-500 to-pink-600',
      roles: ['business_owner'],
    },
  ];

  // Filter cards based on user role
  const filteredCards = cards.filter(card =>
    !card.roles || card.roles.includes(user?.role)
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

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-right">
            <div className="text-5xl mb-3">📊</div>
            <h4 className="text-2xl font-bold mb-2">סטטיסטיקות</h4>
            <p className="text-white/90">נתונים עדכניים על המערכת</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">{user?.credits || 0}</div>
              <div className="text-sm text-white/80">קרדיטים</div>
            </div>

            <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">✓</div>
              <div className="text-sm text-white/80">פעיל</div>
            </div>

            {user?.role === 'business_owner' && user?.username && (
              <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm col-span-2 md:col-span-1">
                <div className="text-xl font-bold truncate">/users/{user.username}</div>
                <div className="text-sm text-white/80">קישור ציבורי</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
