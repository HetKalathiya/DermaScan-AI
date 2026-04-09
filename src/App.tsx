import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Hero from './components/common/Hero';
import Features from './components/common/Features';
import Footer from './components/common/Footer';
import Login from './components/common/Login';
import Register from './components/common/Register';
import DoctorRegister from './components/doctor/DoctorRegister';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import Profile from './components/common/Profile';
import Dermatologists from './components/doctor/Dermatologists';
import ScanHistory from './components/common/ScanHistory';

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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-doctor" element={<DoctorRegister />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/dermatologists" element={<Dermatologists />} />
          <Route path="/scan-history" element={<ScanHistory role="patient" />} />
          <Route path="/doctor/scans" element={<ScanHistory role="doctor" />} />
          <Route path="/profile" element={<Profile />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
