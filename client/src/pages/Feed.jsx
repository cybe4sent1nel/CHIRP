import { useEffect, useState } from "react";
import { assets, dummyPostsData } from "../assets/assets";
import Loading from "../components/Loading";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import RecentMessages from "../components/RecentMessages";
import api from "../api/axios.js";
import { useAuth } from "@clerk/clerk-react";
import { useCustomAuth } from "../context/AuthContext";
import { ArrowUp } from "lucide-react";
import toast from "react-hot-toast";

const Feed = () => {
  const {getToken} = useAuth()
  const { token: customToken } = useCustomAuth();
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [latestPostTime, setLatestPostTime] = useState(null);

  const fetchFeeds = async () => {
    try {
      setLoading(true)
      const clerkToken = await getToken();
      const authToken = clerkToken || customToken;
      const {data} = await api.get('/api/post/feed', {
        headers: {Authorization: `Bearer ${authToken}`}
      })
      if(data.success){
        setFeeds(data.posts)
        if(data.posts.length > 0) {
          setLatestPostTime(new Date(data.posts[0].createdAt).getTime());
        }
        setHasNewPosts(false);
      } else {
        toast.error(data.message)
       }

    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  };

  const checkForNewPosts = async () => {
    try {
      const clerkToken = await getToken();
      const authToken = clerkToken || customToken;
      const {data} = await api.get('/api/post/feed', {
        headers: {Authorization: `Bearer ${authToken}`}
      })
      if(data.success && data.posts.length > 0) {
        const newestPostTime = new Date(data.posts[0].createdAt).getTime();
        if(latestPostTime && newestPostTime > latestPostTime) {
          setHasNewPosts(true);
        }
      }
    } catch (error) {
      console.error('Error checking for new posts:', error);
    }
  };

  useEffect(() => {
    fetchFeeds();
    // Check for new posts every 10 seconds
    const interval = setInterval(checkForNewPosts, 10000);
    return () => clearInterval(interval);
  }, [customToken, getToken]);
  return !loading ? (
    <div className="h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8 relative">
      {/* New Posts Button */}
      {hasNewPosts && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={fetchFeeds}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-medium transition-all duration-200 shadow-lg"
          >
            <ArrowUp size={18} />
            New posts
          </button>
        </div>
      )}
      {/* Stories and Post list */}
      <div>
        <StoriesBar />
        <div className="p-4 space-y-6">
          {feeds.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
      {/* Right Sidebar */}
      <div className="max-xl:hidden sticky top-0">
        <div className="max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow">
          <h3 className="text-slate-800 font-semibold">Sponsored</h3>
          <img src={assets.sponsored_img} className="w-75 h-50 rounded-md " />
          <p className="text-slate-600">Email marketing</p>
          <p className="text-slate-400">
            Supercharge your marketing with a powerful, easy-to-use platform
            built for results.
          </p>
        </div>
        <RecentMessages />
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default Feed;
