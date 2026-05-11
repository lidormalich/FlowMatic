import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import SubscriptionExpired from '../pages/SubscriptionExpired';

const isSubscriptionBlocked = (user) => {
  if (user?.role !== 'business_owner') return false;
  const sub = user?.subscription;
  if (!sub) return false;
  if (sub.status === 'suspended' || sub.status === 'expired') return true;
  if (sub.status === 'trial' && sub.trialEndsAt && new Date(sub.trialEndsAt) < new Date()) return true;
  return false;
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.isOnboarded === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (isSubscriptionBlocked(user)) {
    return <SubscriptionExpired isSuspended={user.subscription?.status === 'suspended'} />;
  }

  return children;
};

export default PrivateRoute;
