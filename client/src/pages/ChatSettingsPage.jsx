import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useCustomAuth } from '../context/AuthContext';
import {
    Lock, Shield, Bell, Database, Eye, EyeOff,
    Toggle2, Download, Trash2, Check, X
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ChatSettingsPage = () => {
    const { getToken } = useAuth();
    const { token: customToken } = useCustomAuth();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('privacy');
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [newBlockedUser, setNewBlockedUser] = useState('');

    useEffect(() => {
        fetchChatSettings();
        fetchBlockedUsers();
    }, []);

    const getAuthToken = async () => {
        try {
            let token = await getToken();
            if (!token && customToken) {
                token = customToken;
            }
            return token;
        } catch (e) {
            return customToken;
        }
    };

    const fetchChatSettings = async () => {
        try {
            const token = await getAuthToken();
            const { data } = await api.get('/api/chat-settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Error fetching chat settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchBlockedUsers = async () => {
        try {
            const token = await getAuthToken();
            const { data } = await api.get('/api/chat-settings/blocked-users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setBlockedUsers(data.blocked_users || []);
            }
        } catch (error) {
            console.error('Error fetching blocked users:', error);
        }
    };

    const updateSettings = async (endpoint, data) => {
        try {
            const token = await getAuthToken();
            const response = await api.put(endpoint, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSettings(response.data.settings);
                toast.success(response.data.message);
                return true;
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update settings');
            return false;
        }
    };

    const handlePrivacyChange = (setting, value) => {
        const updatedPrivacy = {
            ...settings.privacy,
            [setting]: value
        };
        updateSettings('/api/chat-settings/privacy', { privacy: updatedPrivacy });
    };

    const handleSecurityChange = (setting, value) => {
        const updatedSecurity = {
            ...settings.security,
            [setting]: value
        };
        updateSettings('/api/chat-settings/security', { security: updatedSecurity });
    };

    const handleBlockUser = async () => {
        if (!newBlockedUser.trim()) {
            toast.error('Enter a user ID or username');
            return;
        }

        const token = await getAuthToken();
        const response = await api.post('/api/chat-settings/block',
            { blockedUserId: newBlockedUser },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
            setNewBlockedUser('');
            fetchBlockedUsers();
            toast.success('User blocked');
        }
    };

    const handleUnblockUser = async (userId) => {
        const token = await getAuthToken();
        const response = await api.post('/api/chat-settings/unblock',
            { blockedUserId: userId },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
            fetchBlockedUsers();
            toast.success('User unblocked');
        }
    };

    const handleExportData = async () => {
        try {
            const token = await getAuthToken();
            const { data } = await api.get('/api/chat-settings/export', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Download as JSON
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data.data, null, 2)));
            element.setAttribute('download', 'chat-data-export.json');
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            toast.success('Data exported successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            toast.error('Failed to export data');
        }
    };

    const handleDeleteAllData = async () => {
        if (!window.confirm('Are you sure? This will delete all your chat data permanently.')) {
            return;
        }

        try {
            const token = await getAuthToken();
            const response = await api.delete('/api/chat-settings/delete-all', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('All chat data deleted');
                fetchChatSettings();
            }
        } catch (error) {
            console.error('Error deleting data:', error);
            toast.error('Failed to delete data');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading settings...</div>;
    }

    if (!settings) {
        return <div className="flex items-center justify-center h-screen">Failed to load settings</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Chat Settings</h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {[
                        { id: 'privacy', label: 'Privacy', icon: Eye },
                        { id: 'security', label: 'Security', icon: Shield },
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                        { id: 'data', label: 'Data & Privacy', icon: Database }
                    ].map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 font-medium ${activeTab === tab.id
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icon size={20} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                    <div className="bg-white rounded-lg shadow p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Who can contact you?</h2>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="messages"
                                        value="everyone"
                                        checked={settings.privacy.allow_messages_from === 'everyone'}
                                        onChange={(e) => handlePrivacyChange('allow_messages_from', e.target.value)}
                                        className="w-4 h-4"
                                    />
                                    <span>Everyone</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="messages"
                                        value="contacts"
                                        checked={settings.privacy.allow_messages_from === 'contacts'}
                                        onChange={(e) => handlePrivacyChange('allow_messages_from', e.target.value)}
                                        className="w-4 h-4"
                                    />
                                    <span>Contacts only</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="messages"
                                        value="nobody"
                                        checked={settings.privacy.allow_messages_from === 'nobody'}
                                        onChange={(e) => handlePrivacyChange('allow_messages_from', e.target.value)}
                                        className="w-4 h-4"
                                    />
                                    <span>Nobody</span>
                                </label>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h2 className="text-xl font-semibold mb-4">Visibility</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center justify-between">
                                        <span className="font-medium">Show Online Status</span>
                                        <select
                                            value={settings.privacy.show_online_status}
                                            onChange={(e) => handlePrivacyChange('show_online_status', e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded"
                                        >
                                            <option value="everyone">Everyone</option>
                                            <option value="contacts">Contacts</option>
                                            <option value="nobody">Nobody</option>
                                        </select>
                                    </label>
                                </div>

                                <div>
                                    <label className="flex items-center justify-between">
                                        <span className="font-medium">Show Last Seen</span>
                                        <select
                                            value={settings.privacy.show_last_seen}
                                            onChange={(e) => handlePrivacyChange('show_last_seen', e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded"
                                        >
                                            <option value="everyone">Everyone</option>
                                            <option value="contacts">Contacts</option>
                                            <option value="nobody">Nobody</option>
                                        </select>
                                    </label>
                                </div>

                                <div>
                                    <label className="flex items-center justify-between">
                                        <span className="font-medium">Profile Picture Visibility</span>
                                        <select
                                            value={settings.privacy.profile_picture_visibility}
                                            onChange={(e) => handlePrivacyChange('profile_picture_visibility', e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded"
                                        >
                                            <option value="everyone">Everyone</option>
                                            <option value="contacts">Contacts</option>
                                            <option value="nobody">Nobody</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Blocked Users */}
                        <div className="border-t pt-6">
                            <h2 className="text-xl font-semibold mb-4">Blocked Users</h2>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newBlockedUser}
                                        onChange={(e) => setNewBlockedUser(e.target.value)}
                                        placeholder="Enter user ID or username"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        onKeyPress={(e) => e.key === 'Enter' && handleBlockUser()}
                                    />
                                    <button
                                        onClick={handleBlockUser}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        Block
                                    </button>
                                </div>

                                {blockedUsers.length > 0 && (
                                    <div className="space-y-2">
                                        {blockedUsers.map(userId => (
                                            <div
                                                key={userId}
                                                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                                            >
                                                <span className="text-sm font-medium">{userId}</span>
                                                <button
                                                    onClick={() => handleUnblockUser(userId)}
                                                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                                                >
                                                    Unblock
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                    <div className="bg-white rounded-lg shadow p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Encryption & Security</h2>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <span className="font-medium">End-to-End Encryption</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.security.e2e_encryption}
                                        onChange={(e) => handleSecurityChange('e2e_encryption', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <span className="font-medium">Two-Factor Authentication</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.security.two_factor_enabled}
                                        onChange={(e) => handleSecurityChange('two_factor_enabled', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h2 className="text-xl font-semibold mb-4">Advanced Privacy Features</h2>
                            <div className="space-y-4">
                                <div className="p-3 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-medium">Disappearing Messages</span>
                                        <input
                                            type="checkbox"
                                            checked={settings.security.disappearing_messages_default.enabled}
                                            onChange={(e) => handleSecurityChange('disappearing_messages_default', {
                                                ...settings.security.disappearing_messages_default,
                                                enabled: e.target.checked
                                            })}
                                            className="w-5 h-5"
                                        />
                                    </div>
                                    {settings.security.disappearing_messages_default.enabled && (
                                        <div className="mt-3">
                                            <label className="text-sm text-gray-600 mb-2 block">Default Duration</label>
                                            <select
                                                value={settings.security.disappearing_messages_default.duration}
                                                onChange={(e) => handleSecurityChange('disappearing_messages_default', {
                                                    ...settings.security.disappearing_messages_default,
                                                    duration: e.target.value
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="15s">15 seconds</option>
                                                <option value="1m">1 minute</option>
                                                <option value="1h">1 hour</option>
                                                <option value="1d">1 day</option>
                                                <option value="7d">7 days</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <span className="font-medium">Burn After Reading</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.advanced.burn_after_reading}
                                        onChange={(e) => handleSecurityChange('burn_after_reading', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <span className="font-medium">Notify on Screenshot</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.security.notify_on_screenshot}
                                        onChange={(e) => handleSecurityChange('notify_on_screenshot', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                    <div className="bg-white rounded-lg shadow p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <span className="font-medium">Message Notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.message_notifications}
                                        onChange={(e) => handleSecurityChange('message_notifications', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <span className="font-medium">Sound</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.sound}
                                        onChange={(e) => handleSecurityChange('sound', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <span className="font-medium">Call Notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.call_notifications}
                                        onChange={(e) => handleSecurityChange('call_notifications', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data & Privacy */}
                {activeTab === 'data' && (
                    <div className="bg-white rounded-lg shadow p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Data Management</h2>
                            <div className="space-y-3">
                                <button
                                    onClick={handleExportData}
                                    className="w-full flex items-center justify-between px-4 py-3 border border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50"
                                >
                                    <span className="font-medium">Export Your Data</span>
                                    <Download size={20} />
                                </button>

                                <button
                                    onClick={handleDeleteAllData}
                                    className="w-full flex items-center justify-between px-4 py-3 border border-red-300 rounded-lg text-red-600 hover:bg-red-50"
                                >
                                    <span className="font-medium">Delete All Chat Data</span>
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h2 className="text-xl font-semibold mb-4">Privacy</h2>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <span className="font-medium">Allow Analytics</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.data_privacy.allow_analytics}
                                        onChange={(e) => handleSecurityChange('allow_analytics', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <span className="font-medium">Share Data with Third Parties</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.data_privacy.allow_third_party_sharing}
                                        onChange={(e) => handleSecurityChange('allow_third_party_sharing', e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSettingsPage;
