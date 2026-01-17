import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { dummyPostsData, dummyUserData } from "../assets/assets";
import Loading from "../components/Loading";
import UserProfileInfo from "../components/UserProfileInfo";
import PostCard from "../components/PostCard";
import moment from 'moment'
import { Link } from "react-router-dom";
import ProfileModal from "../components/ProfileModal";
import ExtendedProfileModal from "../components/ExtendedProfileModal";
import {useAuth} from '@clerk/clerk-react'
import { useCustomAuth } from "../context/AuthContext";
import api from '../api/axios.js'
import {toast} from 'react-hot-toast'
import { useSelector } from "react-redux";
import { QrCode, Lock } from "lucide-react";
import Lottie from "lottie-react";
import emptyPostsAnimation from "../../public/animations/emptyposts.json";
import privateAccountAnimation from "../../public/animations/security.json";
const Profile = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.value)
  const {getToken} = useAuth()
  const { token: customToken } = useCustomAuth();
  const { profileId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);

  const fetchUser = async (profileId) => {
    const clerkToken = await getToken();
    const authToken = clerkToken || customToken;
    try {
      const {data} = await api.post('/api/user/profiles', {profileId}, {
        headers: {Authorization: `Bearer ${authToken}`}
      })
      if(data.success){
        setUser(data.profile)
        setPosts(data.posts)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  };

  useEffect(() => {
    if(profileId){
      fetchUser(profileId);
    } else {
       fetchUser(currentUser._id)
    }
  }, [profileId, currentUser]);

  return user ? (
    <div className="relative h-full overflow-y-scroll bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {/* Cover Photo */}
          <div className="h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
            {user.cover_photo && (
              <img
                src={user.cover_photo}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {/* User Info */}
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />
        </div>
        {/* Tabs */}
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow p-1 flex max-w-md mx-auto">
            {["posts", "media", "likes"].map((tab) => (
              <button
                onClick={() => setActiveTab(tab)}
                key={tab}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          {/* Posts */}
          {activeTab === "posts" && (
            <div className="mt-6 flex flex-col items-center gap-6">
              {user.privateAccount && profileId && profileId !== currentUser._id ? (
                <div className="w-full bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="w-64 h-64 mx-auto">
                    <Lottie animationData={privateAccountAnimation} loop={true} />
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Lock className="w-5 h-5 text-gray-600" />
                    <h3 className="text-xl font-bold text-gray-900">This Account is Private</h3>
                  </div>
                  <p className="text-gray-500 mt-2">Follow this account to see their posts</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="w-full bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="w-64 h-64 mx-auto">
                    <Lottie animationData={emptyPostsAnimation} loop={true} />
                  </div>
                  <p className="text-gray-500 text-lg font-semibold mt-4">
                    {profileId === currentUser._id || !profileId ? "No posts yet" : "No posts to show"}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {profileId === currentUser._id || !profileId 
                      ? "Start sharing your thoughts with the world!" 
                      : "This user hasn't posted anything yet"}
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))
              )}
            </div>
          )}

          {/* Media */}
          {activeTab === "media" && (
            <div className="flex flex-wrap mt-6 max-w-6xl">
              {posts
                .filter((post) => post.image_urls.length > 0)
                .map((post) => (
                  <div key={post._id}>
                    {post.image_urls.map((image, index) => (
                      <Link
                        target="_blank"
                        to={image}
                        key={`${post._id}-${index}`}
                        className="relative group"
                      >
                        <img
                          src={image}
                          className="w-64 aspect-video object-cover"
                          alt="post media"
                        />
                        <p className="absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300">
                          Posted {moment(post.createdAt).fromNow()}
                        </p>
                      </Link>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      {/* Edit Profile Modal */}
      {showEdit && <ExtendedProfileModal setShowEdit={setShowEdit} />}
    </div>
  ) : (
    <Loading />
  );
};

export default Profile;
