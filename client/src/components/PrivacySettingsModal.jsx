import { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useCustomAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PrivacySettingsModal = ({ isOpen, onClose, user }) => {
    const { getToken } = useAuth();
    const { token: customToken } = useCustomAuth();
    const [loading, setLoading] = useState(false);
    const [privacy, setPrivacy] = useState({
        wholeAccountPrivate: false,
        profilePrivate: false,
        detailsPrivate: false,
        postsPrivate: false,
        storiesPrivate: false,
    });

    useEffect(() => {
        if (user?.privacy) {
            setPrivacy(user.privacy);
        }
    }, [user, isOpen]);

    const handleToggle = (key) => {
        setPrivacy(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const clerkToken = await getToken();
            const authToken = clerkToken || customToken;

            const { data } = await api.post('/api/user/update-privacy',
                { privacy },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            if (data.success) {
                toast.success('Privacy settings updated');
                onClose();
            }
        } catch (error) {
            console.error('Error updating privacy settings:', error);
            toast.error('Failed to update privacy settings');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-gray-900">Privacy Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Whole Account Private */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={privacy.wholeAccountPrivate}
                                onChange={() => handleToggle('wholeAccountPrivate')}
                                className="w-5 h-5 text-indigo-600 rounded mt-1"
                            />
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Keep Whole Account Private</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Only your followers and connections can see your profile, posts, and stories
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Individual Privacy Settings */}
                    {!privacy.wholeAccountPrivate && (
                        <>
                            {/* Profile Privacy */}
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={privacy.profilePrivate}
                                        onChange={() => handleToggle('profilePrivate')}
                                        className="w-5 h-5 text-indigo-600 rounded mt-1"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Private Profile</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Hide your profile details from non-followers
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Details Privacy */}
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={privacy.detailsPrivate}
                                        onChange={() => handleToggle('detailsPrivate')}
                                        className="w-5 h-5 text-indigo-600 rounded mt-1"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Private Details</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Hide bio, location, job info from non-followers
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Posts Privacy */}
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={privacy.postsPrivate}
                                        onChange={() => handleToggle('postsPrivate')}
                                        className="w-5 h-5 text-indigo-600 rounded mt-1"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Private Posts</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Only followers can see your posts
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Stories Privacy */}
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={privacy.storiesPrivate}
                                        onChange={() => handleToggle('storiesPrivate')}
                                        className="w-5 h-5 text-indigo-600 rounded mt-1"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Private Stories</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Only followers can view your stories
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                        <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            {privacy.wholeAccountPrivate
                                ? 'Your account is completely private. Only followers and connections can see any information.'
                                : 'You can customize which parts of your profile are visible to non-followers.'}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettingsModal;
