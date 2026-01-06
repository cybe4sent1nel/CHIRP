import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Eye, Heart, MessageCircle, Share2, Users, Calendar, BarChart3, Download, UserPlus } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const PostAnalytics = ({ post, onClose }) => {
  const { getToken } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly'); // weekly, monthly, yearly
  const [emailReport, setEmailReport] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await api.get(`/api/posts/${post._id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { period }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableEmailReports = async () => {
    try {
      const token = await getToken();
      await api.post('/analytics/enable-email-reports', 
        { postId: post._id }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmailReport(true);
      toast.success('Weekly email reports enabled!');
    } catch (error) {
      toast.error('Failed to enable email reports');
    }
  };

  const handleExport = () => {
    // Export analytics data as CSV
    const csvData = analytics?.chartData.map(item => 
      `${item.date},${item.impressions},${item.engagement},${item.likes},${item.comments}`
    ).join('\n');
    
    const blob = new Blob([`Date,Impressions,Engagement,Likes,Comments\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `post-analytics-${post._id}.csv`;
    a.click();
    toast.success('Analytics exported!');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Post Analytics</h2>
                <p className="text-sm text-white/80">Track your post's performance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Period Filter */}
          <div className="mt-4 flex gap-2">
            {['weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === p
                    ? 'bg-white text-indigo-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {/* Impressions */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Impressions</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {analytics?.totalImpressions?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {analytics?.impressionsGrowth > 0 ? '+' : ''}{analytics?.impressionsGrowth || 0}% from last period
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Engagement */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Engagement Rate</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {analytics?.engagementRate || 0}%
                </p>
                <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {analytics?.engagementGrowth > 0 ? '+' : ''}{analytics?.engagementGrowth || 0}% from last period
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-lg shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Likes */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-600">Total Likes</p>
                <p className="text-2xl font-bold text-pink-900 mt-1">
                  {analytics?.totalLikes?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-pink-600 mt-1 flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {analytics?.likesGrowth || 0}% of impressions
                </p>
              </div>
              <div className="p-3 bg-pink-500 rounded-lg shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Comments</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {analytics?.totalComments?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {analytics?.commentRate || 0}% engagement
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-lg shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Profile Viewers */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Profile Clicks</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {analytics?.profileViewers?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  From this post
                </p>
              </div>
              <div className="p-3 bg-orange-500 rounded-lg shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Shares */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Total Shares</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">
                  {analytics?.totalShares?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                  <Share2 className="w-3 h-3" />
                  Reach amplification
                </p>
              </div>
              <div className="p-3 bg-indigo-500 rounded-lg shadow-lg">
                <Share2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="p-6 space-y-6">
          {/* Impressions Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              Impressions Over Time
            </h3>
            {analytics?.chartData && analytics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.chartData || []}>
                  <defs>
                    <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af" 
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorImpressions)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No impression data yet</p>
                  <p className="text-xs mt-1">Data will appear as users view your post</p>
                </div>
              </div>
            )}
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Engagement Breakdown
            </h3>
            {analytics?.chartData && analytics.chartData.some(d => d.likes || d.comments || d.shares) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="likes" fill="#ec4899" name="Likes" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="comments" fill="#10b981" name="Comments" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="shares" fill="#3b82f6" name="Shares" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No engagement data yet</p>
                  <p className="text-xs mt-1">Likes, comments, and shares will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Locations */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Top Viewer Locations
              </h3>
              <div className="space-y-3">
                {(analytics?.topLocations || []).map((location, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                        {location.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {location.count || 0} {location.count === 1 ? 'viewer' : 'viewers'}
                        </span>
                        <span className="text-sm font-bold text-indigo-600 w-12 text-right">
                          {location.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out group-hover:from-indigo-600 group-hover:to-purple-600" 
                        style={{ width: `${location.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {(!analytics?.topLocations || analytics.topLocations.length === 0) && (
                  <div className="text-center py-6 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No location data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Device Types */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Device Breakdown
              </h3>
              <div className="space-y-3">
                {(analytics?.deviceTypes || []).map((device, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                        {device.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {device.count || 0} {device.count === 1 ? 'view' : 'views'}
                        </span>
                        <span className="text-sm font-bold text-purple-600 w-12 text-right">
                          {device.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out group-hover:from-purple-600 group-hover:to-pink-600" 
                        style={{ width: `${device.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {(!analytics?.deviceTypes || analytics.deviceTypes.length === 0) && (
                  <div className="text-center py-6 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No device data yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={handleEnableEmailReports}
              disabled={emailReport}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                emailReport
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {emailReport ? 'Weekly Reports Enabled' : 'Enable Weekly Email Reports'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostAnalytics;
