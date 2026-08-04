import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, Activity, Heart, Calendar, Check, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, totalScans: 0, totalConsultations: 0 });
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [users, setUsers] = useState([]); // This would normally be paginated
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [statsRes, doctorsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', config),
        axios.get('http://localhost:5000/api/admin/doctors/pending', config)
      ]);
      
      setStats(statsRes.data);
      setPendingDoctors(doctorsRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    }
  };

  const approveDoctor = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/admin/doctors/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Doctor approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve doctor');
    }
  };

  const suspendUser = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/admin/users/${id}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'bg-blue-100 text-blue-600' },
          { label: 'Total Doctors', value: stats.totalDoctors, icon: Heart, color: 'bg-red-100 text-red-600' },
          { label: 'Total Scans', value: stats.totalScans, icon: Activity, color: 'bg-green-100 text-green-600' },
          { label: 'Consultations', value: stats.totalConsultations, icon: Calendar, color: 'bg-purple-100 text-purple-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4">
            <div className={`p-4 rounded-xl ${stat.color}`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Doctors Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Pending Doctor Approvals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Specialization</th>
                <th className="px-6 py-4 font-medium">License</th>
                <th className="px-6 py-4 font-medium">Registered</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {pendingDoctors.map((doc: any) => (
                <tr key={doc._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{doc.user_id?.name || 'Unknown'}</td>
                  <td className="px-6 py-4">{doc.specialization}</td>
                  <td className="px-6 py-4">{doc.license_number}</td>
                  <td className="px-6 py-4">{new Date(doc.user_id?.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => approveDoctor(doc._id)}
                      className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium inline-flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                  </td>
                </tr>
              ))}
              {pendingDoctors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No pending doctors.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
