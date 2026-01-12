import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useCustomAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminDashboardHome = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { token: customToken } = useCustomAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [getToken, customToken]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const clerkToken = await getToken();
      const authToken = clerkToken || customToken;

      const { data } = await api.get('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Don't show error toast on dashboard, just log it
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your platform and users</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.total_users || 0}
              </p>
            </div>
            <Users className="w-12 h-12 text-indigo-600 opacity-20" />
          </div>
        </div>

        {/* Total Posts */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.total_posts || 0}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        {/* Pending Reports */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Reports</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.pending_reports || 0}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-600 opacity-20" />
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Rating</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.average_rating?.toFixed(1) || 0}
              </p>
            </div>
            <BarChart3 className="w-12 h-12 text-yellow-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* User Management Card */}
        <div
          onClick={() => navigate('/admin/users')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition-all hover:scale-105"
        >
          <Users className="w-8 h-8 text-indigo-600 mb-3" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">User Management</h3>
          <p className="text-gray-600 mb-4">
            Manage users, ban/unban accounts, and handle user administration
          </p>
          <button className="text-indigo-600 font-medium hover:text-indigo-700">
            Go to Users →
          </button>
        </div>

        {/* Reports Card */}
        <div
          onClick={() => navigate('/admin/reports')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition-all hover:scale-105"
        >
          <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Reports</h3>
          <p className="text-gray-600 mb-4">
            Review and take action on user reports and content violations
          </p>
          <button className="text-red-600 font-medium hover:text-red-700">
            View Reports →
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 font-medium mb-1">Welcome to Admin Dashboard</p>
          <p className="text-sm text-blue-700">
            Use this dashboard to manage your platform, monitor statistics, and ensure community safety.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
