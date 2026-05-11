import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import PrivateRoute from './components/common/PrivateRoute';
import PushNotificationBanner from './components/common/PushNotificationBanner';

// Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/pages/Dashboard';
import Users from './components/pages/Users';
import Events from './components/pages/Events';
import AppointmentTypes from './components/pages/AppointmentTypes';
import AppointmentScheduler from './components/pages/AppointmentScheduler';
import PublicBooking from './components/pages/PublicBooking';
import BusinessSettings from './components/pages/BusinessSettings';
import Clients from './components/pages/Clients';
import Reports from './components/pages/Reports';
import Staff from './components/pages/Staff';
import Waitlist from './components/pages/Waitlist';
import Inventory from './components/pages/Inventory';
import Templates from './components/pages/Templates';
import MyAppointments from './components/pages/MyAppointments';
import NotificationCenter from './components/pages/NotificationCenter';
import ManageBooking from './components/pages/ManageBooking';
import AdminDashboard from './components/pages/AdminDashboard';
import TermsOfService from './components/pages/TermsOfService';
import NotFound from './components/pages/NotFound';
import LandingPage from './components/pages/LandingPage';
import OnboardingWizard from './components/pages/OnboardingWizard';

import './App.css';

function AppContent() {
  const { isAuthenticated } = useContext(AuthContext);
  const { isDark } = useTheme();
  const location = useLocation();

  // Define public routes where Navbar and Sidebar should be hidden
  const isPublicRoute = location.pathname.startsWith('/book/') || location.pathname === '/onboarding';

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950 text-slate-200' : ''}`} dir="rtl">
      {!isPublicRoute && <Navbar />}
      <div className="flex flex-1 flex-col md:flex-row">
        {isAuthenticated && !isPublicRoute && <Sidebar />}
        <main className={`flex-1 ${!isPublicRoute ? (isDark ? 'bg-slate-950' : 'bg-gray-50') : ''} min-h-[calc(100vh-64px)]`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/onboarding"
              element={
                <PrivateRoute>
                  <OnboardingWizard />
                </PrivateRoute>
              }
            />
            <Route path="/AppointmentScheduler" element={<AppointmentScheduler />} />
            <Route path="/book/:username" element={<PublicBooking />} />
            <Route path="/manage-booking/:token" element={<ManageBooking />} />
            <Route path="/terms" element={<TermsOfService />} />
            {/* <Route path="/:username" element={<PublicBooking />} /> */}

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <Users />
                </PrivateRoute>
              }
            />
            <Route
              path="/events"
              element={
                <PrivateRoute>
                  <Events />
                </PrivateRoute>
              }
            />
            <Route
              path="/appointment-types"
              element={
                <PrivateRoute>
                  <AppointmentTypes />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <BusinessSettings />
                </PrivateRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <PrivateRoute>
                  <Clients />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <PrivateRoute>
                  <Staff />
                </PrivateRoute>
              }
            />
            <Route
              path="/waitlist"
              element={
                <PrivateRoute>
                  <Waitlist />
                </PrivateRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <PrivateRoute>
                  <Inventory />
                </PrivateRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <PrivateRoute>
                  <Templates />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-appointments"
              element={
                <PrivateRoute>
                  <MyAppointments />
                </PrivateRoute>
              }
            />
            <Route
              path="/notification-center"
              element={
                <PrivateRoute>
                  <NotificationCenter />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LandingPage />
                )
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <PushNotificationBanner />
      <ToastContainer
        position="top-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
