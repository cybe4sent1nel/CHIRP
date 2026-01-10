import React, { useState, useEffect } from 'react';
import { Lock, Bell, Shield, LogOut, Trash2, Eye, MessageSquare, Save, User, Mail, Globe, Download, UserX, Key, Smartphone } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Settings = () => {
  const { signOut, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const user = useSelector((state) => state.user.value);
  const [activeTab, setActiveTab] = useState('privacy');
  const [isSaving, setIsSaving] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Privacy & Safety Settings
  const [privacySettings, setPrivacySettings] = useState({
    dmFromEveryone: true,
    allowMessagesFromNonConnections: true,
    showOnlineStatus: true,
    showLastSeen: true,
    allowProfileVisits: true,
    allowComments: true,
    allowTagging: true,
    showEmail: false,
    showPhoneNumber: false,
    allowProfileIndexing: true,
    showBirthday: false,
    allowStoryReplies: true,
    allowStorySharing: true,
    allowMediaDownload: true,
    allowViewOnceMediaSave: false,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    messageNotifications: true,
    mentionNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    emailNotifications: false,
    pushNotifications: true,
    repostNotifications: true,
    storyNotifications: true,
    liveNotifications: true,
  });

  // Account Settings
  const [accountSettings, setAccountSettings] = useState({
    requireApprovalForTags: false,
    allowDataDownload: true,
    allowAccountDiscovery: true,
  });

  // Profile Settings
  const [profileSettings, setProfileSettings] = useState({
    username: user?.username || '',
    email: clerkUser?.primaryEmailAddress?.emailAddress || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });

  // Load blocked users
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get('/api/users/blocked', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          setBlockedUsers(data.blockedUsers || []);
        }
      } catch (error) {
        console.error('Failed to fetch blocked users:', error);
      }
    };
    fetchBlockedUsers();
  }, [getToken]);

  const handlePrivacyChange = (key) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNotificationChange = (key) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAccountChange = (key) => {
    setAccountSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleProfileChange = (key, value) => {
    setProfileSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUnblockUser = async (userId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(`/api/users/unblock/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setBlockedUsers(prev => prev.filter(u => u._id !== userId));
        toast.success('User unblocked successfully');
      }
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const handleDownloadData = async () => {
    try {
      const token = await getToken();
      toast.loading('Preparing your data...', { id: 'download-data' });
      const { data } = await api.get('/api/users/download-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Create and download JSON file
      const dataStr = JSON.stringify(data.userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chirp-data-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Data downloaded successfully!', { id: 'download-data' });
    } catch (error) {
      toast.error('Failed to download data', { id: 'download-data' });
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.post('/api/user/settings', {
        privacy: privacySettings,
        notifications: notificationSettings,
        account: accountSettings
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await signOut();
      window.location.href = '/welcome';
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      if (window.confirm('This will permanently delete all your data. Type DELETE to confirm.')) {
        try {
          await api.delete('/api/user/account');
          toast.success('Account deleted');
          signOut();
          window.location.href = '/welcome';
        } catch (error) {
          toast.error('Failed to delete account');
        }
      }
    }
  };

  const SettingToggle = ({ label, description, value, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
      <div className="flex-1">
        <p className="font-medium text-gray-800">{label}</p>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={onChange}
          className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'privacy', label: 'Privacy & Safety', icon: Lock },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'account', label: 'Account', icon: Shield },
                { id: 'blocked', label: 'Blocked Users', icon: UserX },
                { id: 'data', label: 'Data & Privacy', icon: Download },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-l-4 transition-colors ${
                      activeTab === item.id
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

                  {/* Avatar Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Picture</h3>
                    <div className="flex items-center gap-6 bg-gray-50 rounded-lg p-4">
                      <div className="flex flex-col items-center">
                        <img
                          src={user?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || user?.username || 'default')}&scale=80`}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500 mb-2"
                        />
                        <p className="text-sm text-gray-600">Your Avatar</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">To upload a custom profile picture, go to your Profile page and edit your profile information.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <input
                          type="text"
                          value={profileSettings.username}
                          onChange={(e) => handleProfileChange('username', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Your username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={profileSettings.email}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email managed by authentication provider</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                          value={profileSettings.bio}
                          onChange={(e) => handleProfileChange('bio', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          rows="3"
                          placeholder="Tell us about yourself"
                          maxLength="160"
                        />
                        <p className="text-xs text-gray-500 mt-1">{profileSettings.bio.length}/160 characters</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={profileSettings.location}
                          onChange={(e) => handleProfileChange('location', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="City, Country"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          value={profileSettings.website}
                          onChange={(e) => handleProfileChange('website', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy & Safety Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy & Safety</h2>

                  {/* Messages Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MessageSquare size={20} />
                      Direct Messages (WhatsApp-style)
                    </h3>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <SettingToggle
                        label="Allow DMs from everyone"
                        description="Let non-connections send you direct messages"
                        value={privacySettings.dmFromEveryone}
                        onChange={() => handlePrivacyChange('dmFromEveryone')}
                      />
                      <SettingToggle
                        label="Allow messages from non-connections"
                        description="Receive messages from users you don't follow"
                        value={privacySettings.allowMessagesFromNonConnections}
                        onChange={() => handlePrivacyChange('allowMessagesFromNonConnections')}
                      />
                    </div>
                  </div>

                  {/* Visibility Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Eye size={20} />
                      Visibility
                    </h3>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <SettingToggle
                        label="Show online status"
                        description="Let others see when you're active"
                        value={privacySettings.showOnlineStatus}
                        onChange={() => handlePrivacyChange('showOnlineStatus')}
                      />
                      <SettingToggle
                        label="Show last seen"
                        description="Display when you were last active"
                        value={privacySettings.showLastSeen}
                        onChange={() => handlePrivacyChange('showLastSeen')}
                      />
                      <SettingToggle
                        label="Allow profile visits"
                        description="Let others view your profile"
                        value={privacySettings.allowProfileVisits}
                        onChange={() => handlePrivacyChange('allowProfileVisits')}
                      />
                    </div>
                  </div>

                  {/* Interactions Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Interactions</h3>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <SettingToggle
                        label="Allow comments on posts"
                        description="Let others comment on your content"
                        value={privacySettings.allowComments}
                        onChange={() => handlePrivacyChange('allowComments')}
                      />
                      <SettingToggle
                        label="Allow tagging in posts"
                        description="Let others tag you in their posts"
                        value={privacySettings.allowTagging}
                        onChange={() => handlePrivacyChange('allowTagging')}
                      />                      <SettingToggle
                        label="Show email address"
                        description="Display your email on your profile"
                        value={privacySettings.showEmail}
                        onChange={() => handlePrivacyChange('showEmail')}
                      />
                      <SettingToggle
                        label="Show phone number"
                        description="Display your phone number on your profile"
                        value={privacySettings.showPhoneNumber}
                        onChange={() => handlePrivacyChange('showPhoneNumber')}
                      />
                      <SettingToggle
                        label="Allow profile indexing"
                        description="Allow search engines to find your profile"
                        value={privacySettings.allowProfileIndexing}
                        onChange={() => handlePrivacyChange('allowProfileIndexing')}
                      />
                    </div>
                  </div>

                  {/* Media Settings Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Download size={20} />
                      Media & Downloads
                    </h3>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <SettingToggle
                        label="Allow media downloads"
                        description="Let others save your photos and videos to their device"
                        value={privacySettings.allowMediaDownload}
                        onChange={() => handlePrivacyChange('allowMediaDownload')}
                      />
                      <SettingToggle
                        label="Allow saving view-once media"
                        description="Allow recipients to save view-once photos/videos"
                        value={privacySettings.allowViewOnceMediaSave}
                        onChange={() => handlePrivacyChange('allowViewOnceMediaSave')}
                      />
                      <SettingToggle
                        label="Show birthday"
                        description="Display your birthday on your profile"
                        value={privacySettings.showBirthday}
                        onChange={() => handlePrivacyChange('showBirthday')}
                      />
                      <SettingToggle
                        label="Allow story replies"
                        description="Let others reply to your stories"
                        value={privacySettings.allowStoryReplies}
                        onChange={() => handlePrivacyChange('allowStoryReplies')}
                      />
                      <SettingToggle
                        label="Allow story sharing"
                        description="Let others share your stories"
                        value={privacySettings.allowStorySharing}
                        onChange={() => handlePrivacyChange('allowStorySharing')}
                      />                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">In-App Notifications</h3>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <SettingToggle
                        label="Message notifications"
                        description="Get notified when you receive messages"
                        value={notificationSettings.messageNotifications}
                        onChange={() => handleNotificationChange('messageNotifications')}
                      />
                      <SettingToggle
                        label="Mention notifications"
                        description="Get notified when someone mentions you"
                        value={notificationSettings.mentionNotifications}
                        onChange={() => handleNotificationChange('mentionNotifications')}
                      />
                      <SettingToggle
                        label="Like notifications"
                        description="Get notified when someone likes your posts"
                        value={notificationSettings.likeNotifications}
                        onChange={() => handleNotificationChange('likeNotifications')}
                      />
                      <SettingToggle
                        label="Comment notifications"
                        description="Get notified when someone comments on your posts"
                        value={notificationSettings.commentNotifications}
                        onChange={() => handleNotificationChange('commentNotifications')}
                      />
                      <SettingToggle
                        label="Follow notifications"
                        description="Get notified when someone follows you"
                        value={notificationSettings.followNotifications}
                        onChange={() => handleNotificationChange('followNotifications')}
                      />
                      <SettingToggle
                        label="Repost notifications"
                        description="Get notified when someone reposts your content"
                        value={notificationSettings.repostNotifications}
                        onChange={() => handleNotificationChange('repostNotifications')}
                      />
                      <SettingToggle
                        label="Story notifications"
                        description="Get notified about stories from people you follow"
                        value={notificationSettings.storyNotifications}
                        onChange={() => handleNotificationChange('storyNotifications')}
                      />
                      <SettingToggle
                        label="Live notifications"
                        description="Get notified when someone goes live"
                        value={notificationSettings.liveNotifications}
                        onChange={() => handleNotificationChange('liveNotifications')}
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Push Notifications</h3>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <SettingToggle
                        label="Push notifications"
                        description="Receive notifications on your device"
                        value={notificationSettings.pushNotifications}
                        onChange={() => handleNotificationChange('pushNotifications')}
                      />
                      <SettingToggle
                        label="Email notifications"
                        description="Receive email summaries of activity"
                        value={notificationSettings.emailNotifications}
                        onChange={() => handleNotificationChange('emailNotifications')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Security</h3>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <SettingToggle
                        label="Two-factor authentication"
                        description="Add an extra layer of security to your account"
                        value={accountSettings.twoFactorAuth}
                        onChange={() => handleAccountChange('twoFactorAuth')}
                      />
                      <SettingToggle
                        label="Private account"
                        description="Only approved followers can see your posts"
                        value={accountSettings.privateAccount}
                        onChange={() => handleAccountChange('privateAccount')}
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Features</h3>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <SettingToggle
                        label="Allow AI features"
                        description="Use AI-powered suggestions and tools"
                        value={accountSettings.allowAIFeatures}
                        onChange={() => handleAccountChange('allowAIFeatures')}
                      />
                      <SettingToggle
                        label="Require approval for tags"
                        description="Approve before being tagged in posts"
                        value={accountSettings.requireApprovalForTags}
                        onChange={() => handleAccountChange('requireApprovalForTags')}
                      />
                      <SettingToggle
                        label="Allow account discovery"
                        description="Let others find your account by email or phone"
                        value={accountSettings.allowAccountDiscovery}
                        onChange={() => handleAccountChange('allowAccountDiscovery')}
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-red-600">Danger Zone</h3>
                    <div className="space-y-3 bg-red-50 rounded-lg p-4 border border-red-200">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center gap-2 justify-center font-medium"
                      >
                        <LogOut size={18} />
                        Log Out
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 justify-center font-medium"
                      >
                        <Trash2 size={18} />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Blocked Users Tab */}
              {activeTab === 'blocked' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Blocked Users</h2>
                  <p className="text-gray-600 mb-6">
                    You won't see posts or messages from blocked users, and they won't be able to contact you.
                  </p>

                  {blockedUsers.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No blocked users</p>
                      <p className="text-sm text-gray-500 mt-1">Users you block will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {blockedUsers.map(blockedUser => (
                        <div key={blockedUser._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={blockedUser.profile_picture}
                              alt={blockedUser.full_name}
                              className="w-12 h-12 rounded-full"
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{blockedUser.full_name}</p>
                              <p className="text-sm text-gray-500">@{blockedUser.username}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblockUser(blockedUser._id)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Data & Privacy Tab */}
              {activeTab === 'data' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Data & Privacy</h2>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Download Your Data
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600 mb-4">
                        Download a copy of your data including posts, messages, profile information, and more.
                      </p>
                      <button
                        onClick={handleDownloadData}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                      >
                        <Download size={18} />
                        Download Data
                      </button>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Privacy Rights
                    </h3>
                    <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                      <div>
                        <p className="font-medium text-gray-800">Right to Access</p>
                        <p className="text-sm text-gray-600">You can request access to your personal data at any time.</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Right to Deletion</p>
                        <p className="text-sm text-gray-600">You can request deletion of your account and data.</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Right to Portability</p>
                        <p className="text-sm text-gray-600">Download your data in a machine-readable format.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Collection</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600 mb-3">
                        We collect and process the following types of data:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                        <li>Profile information (name, username, bio)</li>
                        <li>Content you create (posts, messages, comments)</li>
                        <li>Interactions (likes, follows, shares)</li>
                        <li>Device and usage information</li>
                        <li>Location data (if enabled)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
