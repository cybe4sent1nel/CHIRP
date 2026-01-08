import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import moment from 'moment';
import toast from 'react-hot-toast';

const HashtagPage = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hashtagInfo, setHashtagInfo] = useState(null);

  useEffect(() => {
    fetchHashtagPosts();
  }, [tag]);

  const fetchHashtagPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/hashtag/${tag}/posts`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        setPosts(data.posts);
        setHashtagInfo(data.hashtag);
      }
    } catch (error) {
      console.error('Error fetching hashtag posts:', error);
      toast.error('Failed to load hashtag posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Hashtag Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-purple-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                #{tag}
              </h1>
              {hashtagInfo && (
                <div className="flex items-center gap-4 mt-2 text-gray-600">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {hashtagInfo.count} {hashtagInfo.count === 1 ? 'post' : 'posts'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Last used {moment(hashtagInfo.last_used).fromNow()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {hashtagInfo && hashtagInfo.trending_score > 50 && (
            <div className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 font-semibold">
                <TrendingUp className="w-5 h-5" />
                <span>🔥 Trending Now!</span>
              </div>
            </div>
          )}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No posts found
            </h3>
            <p className="text-gray-500">
              Be the first to post with #{tag}!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagPage;
