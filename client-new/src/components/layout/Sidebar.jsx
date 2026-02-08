import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const menuItems = [
    { path: '/dashboard', label: 'דף הבית', icon: '🏠', roles: ['admin', 'business_owner'] },
    { path: '/users', label: 'ניהול משתמשים', icon: '👥', roles: ['admin'] },
    { path: '/events', label: 'יומן תורים', icon: '📅', roles: ['admin', 'business_owner'] },
    { path: '/appointment-types', label: 'סוגי תורים', icon: '⚙️', roles: ['admin', 'business_owner'] },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-64px)] sticky top-16 hidden md:block">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 text-right">תפריט ניווט</h3>
      </div>

      <nav className="p-4">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all text-right flex-row-reverse ${
              location.pathname === item.path
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
