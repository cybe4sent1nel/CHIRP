import { Calendar, MapPin, Verified, PenBox, UserPlus, Users } from "lucide-react";
import moment from "moment";
import BrutalistQRButton from "./BrutalistQRButton";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useCustomAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const UserProfileInfo = ({ user, posts, profileId, setShowEdit }) => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { token: customToken } = useCustomAuth();
    const currentUser = useSelector((state) => state.user.value);
    const [isFollowing, setIsFollowing] = useState(user.followers?.includes(currentUser?._id));
    const [isConnected, setIsConnected] = useState(user.connections?.includes(currentUser?._id));
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [loadingConnect, setLoadingConnect] = useState(false);

    const handleFollow = async () => {
        try {
            setLoadingFollow(true);
            const token = await getToken() || customToken;
            const { data } = await api.post('/api/user/follow', { id: profileId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setIsFollowing(true);
                toast.success('Following user');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to follow user');
        } finally {
            setLoadingFollow(false);
        }
    };

    const handleUnfollow = async () => {
        try {
            setLoadingFollow(true);
            const token = await getToken() || customToken;
            const { data } = await api.post('/api/user/unfollow', { id: profileId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setIsFollowing(false);
                toast.success('Unfollowed user');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to unfollow user');
        } finally {
            setLoadingFollow(false);
        }
    };

    const handleConnect = async () => {
        try {
            setLoadingConnect(true);
            const token = await getToken() || customToken;
            const { data } = await api.post('/api/user/connect', { id: profileId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setIsConnected(true);
                toast.success('Connection request sent');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send connection request');
        } finally {
            setLoadingConnect(false);
        }
    };

    return (
        <div className="relative py-4 px-6 md:px-8 bg-white">
            <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-32 h-32 border-4 border-white shadow-lg absolute -top-16 rounded-full">
                    <img
                        src={user.profile_picture}
                        alt=""
                        className="absolute rounded-full z-2"
                    />
                </div>
                <div className="w-full pt-16 md:pt-0 md:pl-36">
                    <div className="flex flex-col md:flex-row items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1>{user.full_name}</h1>
                                <Verified className="w-6 h-6 text-blue-500" />
                            </div>
                            <p className="text-gray-600">
                                {user.username ? `@${user.username}` : "Add a username"}
                            </p>
                        </div>
                        {/* If a user is not on others profile that means he is opening his profile so we will give edit button. */}
                        {!profileId ? (
                            <button
                                onClick={() => setShowEdit(true)}
                                className="flex items-center  gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors mt-4 md:mt-0 cursor-pointer"
                            >
                                <PenBox className="w-4 h-4" />
                                Edit
                            </button>
                        ) : (
                            <div className="flex gap-3 mt-4 md:mt-0">
                                <button
                                    onClick={isFollowing ? handleUnfollow : handleFollow}
                                    disabled={loadingFollow}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${isFollowing
                                            ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    {loadingFollow ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button
                                    onClick={handleConnect}
                                    disabled={loadingConnect || isConnected}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${isConnected
                                            ? 'border border-gray-300 text-gray-700 bg-gray-50 cursor-not-allowed'
                                            : 'bg-purple-500 text-white hover:bg-purple-600'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <Users className="w-4 h-4" />
                                    {loadingConnect ? 'Sending...' : isConnected ? 'Connected' : 'Connect'}
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-700 text-sm max-w-md mt-4">{user.bio}</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mt-4">
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {user.location ? user.location : "Add location"}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            Joined{" "}
                            <span className="font-medium">
                                {moment(user.createdAt).fromNow()}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center gap-6 mt-6 border-t border-gray-200 pt-4">
                        <div>
                            <span className="sm:text-xl font-bold text-gray-900">
                                {posts.length}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500 ml-1.5">
                                Posts
                            </span>
                        </div>
                        <div>
                            <span className="sm:text-xl font-bold text-gray-900">{user.followers.length}</span>
                            <span className="text-xs sm:text-sm text-gray-500 ml-1.5">Followers</span>
                        </div>
                        <div>
                            <span className="sm:text-xl font-bold text-gray-900">{user.following.length}</span>
                            <span className="text-xs sm:text-sm text-gray-500 ml-1.5">Following</span>
                        </div>
                        {/* QR Button - Only show for own profile */}
                        {!profileId && (
                            <div className="ml-auto">
                                <BrutalistQRButton onClick={() => navigate("/profile-qr")} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileInfo;
