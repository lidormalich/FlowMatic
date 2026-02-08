import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-gradient-to-r from-primary to-secondary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/FlowMatic.webp"
              alt="FlowMatic"
              className="h-10 w-auto transition-transform group-hover:scale-110"
            />
            <span className="text-white font-bold text-xl hidden sm:block">
              FlowMatic
            </span>
          </Link>

          {/* Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-white font-medium hidden sm:block">
                  שלום, {user?.name}
                </span>
                {user?.role && (
                  <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {user.role === 'admin' ? 'מנהל' : user.role === 'business_owner' ? 'בעל עסק' : 'לקוח'}
                  </span>
                )}
                {user?.credits !== undefined && (
                  <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                    💰 {user.credits} קרדיטים
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-lg transition-all"
                >
                  התנתק
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:bg-white/10 font-medium px-4 py-2 rounded-lg transition-all"
                >
                  התחבר
                </Link>
                <Link
                  to="/register"
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-lg transition-all"
                >
                  הרשמה
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
