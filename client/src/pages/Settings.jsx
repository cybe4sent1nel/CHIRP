import React, { useState } from 'react';
import { Lock, Bell, Shield, LogOut, Trash2, Eye, MessageSquare, Save } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Settings = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('privacy');
  const [isSaving, setIsSaving] = useState(false);

  // Privacy & Safety Settings
  const [privacySettings, setPrivacySettings] = useState({
    dmFromEveryone: true,
    allowMessagesFromNonConnections: true,
    showOnlineStatus: true,
    showLastSeen: true,
    allowProfileVisits: true,
    allowComments: true,
    allowTagging: true,
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
  });

  // Account Settings
  const [accountSettings, setAccountSettings] = useState({
    twoFactorAuth: false,
    privateAccount: false,
    allowAIFeatures: true,
  });

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
                { id: 'privacy', label: 'Privacy & Safety', icon: Lock },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'account', label: 'Account', icon: Shield },
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
                      />
                    </div>
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
