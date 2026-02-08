import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import PrivateRoute from './components/common/PrivateRoute';

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
import NotFound from './components/pages/NotFound';

import './App.css';

function App() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Router>
      <div className="min-h-screen flex flex-col" dir="rtl">
        <Navbar />
        <div className="flex flex-1 flex-col md:flex-row">
          {isAuthenticated && <Sidebar />}
          <main className="flex-1 bg-gray-50 min-h-[calc(100vh-64px)]">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/AppointmentScheduler" element={<AppointmentScheduler />} />
              <Route path="/users/:username" element={<PublicBooking />} />
              <Route path="/:username" element={<PublicBooking />} />

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
                path="/"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
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
    </Router>
  );
}

export default App;
