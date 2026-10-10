import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Hero from './components/common/Hero';
import Features from './components/common/Features';
import Footer from './components/common/Footer';
import PatientLogin from './components/common/PatientLogin';
import DoctorLogin from './components/common/DoctorLogin';
import ProtectedRoute from './components/common/ProtectedRoute';
import Register from './components/common/Register';
import DoctorRegister from './components/doctor/DoctorRegister';
import VerifyOtp from './components/common/VerifyOtp';
import ForgotPassword from './components/common/ForgotPassword';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import Profile from './components/common/Profile';
import Dermatologists from './components/doctor/Dermatologists';
import ScanHistory from './components/common/ScanHistory';
import MyReports from './components/common/MyReports';
import Notifications from './components/common/Notifications';
import Appointments from './components/common/Appointments';
import Settings from './components/common/Settings';
import Help from './components/common/Help';
import About from './components/common/About';
import Analytics from './components/doctor/Analytics';
import ConsultationHistory from './components/doctor/ConsultationHistory';
import MessagesInbox from './components/doctor/MessagesInbox';
import DoctorSettings from './components/doctor/DoctorSettings';
import PatientDetail from './components/doctor/PatientDetail';
import DoctorLanding from './components/doctor/DoctorLanding';
import DoctorScheduleManager from './components/doctor/DoctorScheduleManager';
import DoctorPendingApproval from './components/doctor/DoctorPendingApproval';
import DoctorVerifyOtp from './components/doctor/DoctorVerifyOtp';

// Admin imports
import AdminLogin from './components/admin/AdminLogin';
import AdminSetup from './components/admin/AdminSetup';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminDoctors from './components/admin/AdminDoctors';
import AdminUsers from './components/admin/AdminUsers';
import AdminLogs from './components/admin/AdminLogs';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white selection:bg-cyan-500/30 selection:text-cyan-100">
        <Routes>
          <Route path="/" element={
            <>
              <Navbar />
              <main>
                <Hero />
                <Features />
              </main>
              <Footer />
            </>
          } />
          {/* Auth routes */}
          <Route path="/login" element={<PatientLogin />} />
          <Route path="/login/patient" element={<PatientLogin />} />
          <Route path="/login/doctor" element={<DoctorLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-doctor" element={<DoctorRegister />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/doctor/verify-otp" element={<DoctorVerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/doctor/pending-approval" element={<DoctorPendingApproval />} />

          {/* Protected patient routes */}
          <Route path="/dashboard" element={<ProtectedRoute role="patient"><Dashboard /></ProtectedRoute>} />
          <Route path="/scan-history" element={<ProtectedRoute role="patient"><ScanHistory role="patient" /></ProtectedRoute>} />
          <Route path="/my-reports" element={<ProtectedRoute role="patient"><MyReports /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute role={['patient', 'doctor']}><Notifications /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute role="patient"><Appointments /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute role="patient"><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute role="patient"><Profile /></ProtectedRoute>} />
          <Route path="/my-profile" element={<ProtectedRoute role="patient"><Profile /></ProtectedRoute>} />
          <Route path="/patient/profile" element={<ProtectedRoute role="patient"><Profile /></ProtectedRoute>} />

          {/* Protected doctor routes */}
          <Route path="/doctor-dashboard" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/schedule" element={<ProtectedRoute role="doctor"><DoctorScheduleManager /></ProtectedRoute>} />
          <Route path="/doctor/scans" element={<ProtectedRoute role="doctor"><ScanHistory role="doctor" /></ProtectedRoute>} />
          <Route path="/doctor/analytics" element={<ProtectedRoute role="doctor"><Analytics /></ProtectedRoute>} />
          <Route path="/doctor/history" element={<ProtectedRoute role="doctor"><ConsultationHistory /></ProtectedRoute>} />
          <Route path="/doctor/messages" element={<ProtectedRoute role="doctor"><MessagesInbox /></ProtectedRoute>} />
          <Route path="/doctor/settings" element={<ProtectedRoute role="doctor"><DoctorSettings /></ProtectedRoute>} />
          <Route path="/doctor/patient/:id" element={<ProtectedRoute role="doctor"><PatientDetail /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/doctors" element={<AdminProtectedRoute><AdminDoctors /></AdminProtectedRoute>} />
          <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
          <Route path="/admin/logs" element={<AdminProtectedRoute><AdminLogs /></AdminProtectedRoute>} />

          {/* Public shared routes */}
          <Route path="/doctor" element={<DoctorLanding />} />
          <Route path="/dermatologists" element={<Dermatologists />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
