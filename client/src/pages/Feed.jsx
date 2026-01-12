import { useEffect, useState } from "react";
import { assets, dummyPostsData } from "../assets/assets";
import Loading from "../components/Loading";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import RecentMessages from "../components/RecentMessages";
import OnboardingStepper from "../components/OnboardingStepper";
import api from "../api/axios.js";
import { useAuth } from "@clerk/clerk-react";
import { useCustomAuth } from "../context/AuthContext";
import { useSelector } from "react-redux";
import { ArrowUp } from "lucide-react";
import toast from "react-hot-toast";

const Feed = () => {
    const { getToken } = useAuth()
    const { token: customToken } = useCustomAuth();
    const user = useSelector((state) => state.user.value);
    const [feeds, setFeeds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasNewPosts, setHasNewPosts] = useState(false);
    const [latestPostTime, setLatestPostTime] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingChecked, setOnboardingChecked] = useState(false);
    const [authToken, setAuthToken] = useState(null);

    // Get authentication token (Clerk or Custom)
    const getAuthToken = async () => {
        const clerkToken = await getToken();
        const token = clerkToken || customToken;
        setAuthToken(token);
        return token;
    };

    const fetchFeeds = async () => {
        try {
            setLoading(true)
            const token = authToken || (await getAuthToken());
            const { data } = await api.get('/api/post/feed', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                setFeeds(data.posts)
                if (data.posts.length > 0) {
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
            const token = authToken || (await getAuthToken());
            const { data } = await api.get('/api/post/feed', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success && data.posts.length > 0) {
                const newestPostTime = new Date(data.posts[0].createdAt).getTime();
                if (latestPostTime && newestPostTime > latestPostTime) {
                    setHasNewPosts(true);
                }
            }
        } catch (error) {
            console.error('Error checking for new posts:', error);
        }
    };

    // Check if user needs onboarding
    const checkOnboardingStatus = async () => {
        if (!user || onboardingChecked) return;
        
        try {
            const token = authToken || (await getAuthToken());
            console.log('[ONBOARDING] Checking onboarding status for user:', user._id);
            
            const { data } = await api.get('/api/onboarding/check-status', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[ONBOARDING] Status response:', data);

            if (data.success) {
                if (!data.isOnboarded) {
                    console.log('[ONBOARDING] User not onboarded, showing modal');
                    setShowOnboarding(true);
                } else {
                    console.log('[ONBOARDING] User already onboarded, skipping modal');
                    setShowOnboarding(false);
                }
            }
            // Always mark as checked to prevent re-running
            setOnboardingChecked(true);
        } catch (error) {
            console.error('[ONBOARDING] Error checking onboarding status:', error);
            // Still mark as checked even if there's an error to prevent infinite loop
            setOnboardingChecked(true);
        }
    };

    // Initialize auth token once
    useEffect(() => {
        const initToken = async () => {
            await getAuthToken();
        };
        if (user && !authToken) {
            initToken();
        }
    }, [user]);

    // Fetch feeds when auth token is available
    useEffect(() => {
        if (!authToken) return;
        
        fetchFeeds();
        
        // Check for new posts every 10 seconds
        const interval = setInterval(checkForNewPosts, 10000);
        
        return () => clearInterval(interval);
    }, [authToken]);

    // Check onboarding status when user changes
    useEffect(() => {
        if (!user || onboardingChecked) return;
        checkOnboardingStatus();
    }, [user]);
    return !loading ? (
      <>
        {/* Onboarding Modal */}
        {showOnboarding && (
          <OnboardingStepper 
            onComplete={() => {
              console.log('[ONBOARDING] Onboarding completed, closing modal');
              setShowOnboarding(false);
              setOnboardingChecked(true);
            }}
            user={user}
            token={customToken}
          />
        )}

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
        </>
    ) : (
        <Loading />
    );
};

export default Feed;
