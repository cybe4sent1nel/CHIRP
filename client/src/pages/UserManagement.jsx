import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useCustomAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, Trash2, Ban, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const UserManagement = () => {
  const { getToken } = useAuth();
  const { token: customToken } = useCustomAuth();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Check if user is admin
  const isAdmin = user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!user) {
      return; // Wait for user to load
    }
    if (!isAdmin) {
      navigate('/');
      toast.error('Access denied. Admin only.');
      return;
    }
    fetchUsers();
  }, [isAdmin, navigate, user]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const clerkToken = await getToken();
            const authToken = clerkToken || customToken;

            const { data } = await api.get('/api/admin/user-stats', {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (data.success) {
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Filter users
    useEffect(() => {
        let filtered = users;

        if (searchQuery.trim()) {
            filtered = filtered.filter(user =>
                user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterRole !== 'all') {
            filtered = filtered.filter(user => user.role === filterRole);
        }

        setFilteredUsers(filtered);
    }, [users, searchQuery, filterRole]);

    const handleBanUser = async (userId) => {
        if (!window.confirm('Are you sure you want to ban this user?')) return;

        try {
            const clerkToken = await getToken();
            const authToken = clerkToken || customToken;

            const { data } = await api.post(`/api/admin/user/${userId}/ban`, {}, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (data.success) {
                toast.success('User banned successfully');
                fetchUsers();
            }
        } catch (error) {
            toast.error('Failed to ban user');
        }
    };

    const handleUnbanUser = async (userId) => {
        if (!window.confirm('Unban this user?')) return;

        try {
            const clerkToken = await getToken();
            const authToken = clerkToken || customToken;

            const { data } = await api.post(`/api/admin/user/${userId}/unban`, {}, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (data.success) {
                toast.success('User unbanned successfully');
                fetchUsers();
            }
        } catch (error) {
            toast.error('Failed to unban user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('This action cannot be undone. Delete this user?')) return;

        try {
            const clerkToken = await getToken();
            const authToken = clerkToken || customToken;

            const { data } = await api.delete(`/api/admin/user/${userId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (data.success) {
                toast.success('User deleted successfully');
                fetchUsers();
            }
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-2">Manage all users on the platform</p>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow flex gap-4 flex-wrap">
                {/* Search */}
                <div className="flex-1 min-w-xs relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, username, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                {/* Role Filter */}
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="all">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                </select>

                {/* Refresh Button */}
                <button
                    onClick={fetchUsers}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        {/* User Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.profile_picture || 'https://via.placeholder.com/40'}
                                                    alt={user.full_name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.full_name}</p>
                                                    <p className="text-sm text-gray-600">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className="px-6 py-4 text-gray-700">{user.email}</td>

                                        {/* Role */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user.role === 'admin'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {user.isBanned ? (
                                                    <>
                                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                                        <span className="text-sm text-red-600 font-medium">Banned</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                        <span className="text-sm text-green-600 font-medium">Active</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>

                                        {/* Joined Date */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {user.isBanned ? (
                                                    <button
                                                        onClick={() => handleUnbanUser(user._id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Unban user"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBanUser(user._id)}
                                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Ban user"
                                                    >
                                                        <Ban className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-lg">No users found</p>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{users.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Active Users</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                        {users.filter(u => !u.isBanned).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Banned Users</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                        {users.filter(u => u.isBanned).length}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
