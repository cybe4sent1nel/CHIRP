import React, { useState, useEffect } from 'react';
import { TrendingUp, Hash, Eye, MessageCircle, ThumbsUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useCustomAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import moment from 'moment';

const Buzz = () => {
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const { token: customToken } = useCustomAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingData();
  }, [timeframe]);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      const clerkToken = await getToken();
      const authToken = clerkToken || customToken;
      const [hashtagsRes, postsRes] = await Promise.all([
        api.get(`/api/hashtag/trending?timeframe=${timeframe}&limit=10`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        api.get('/api/hashtag/posts/trending?limit=10', {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (hashtagsRes.data.success) {
        setTrendingHashtags(hashtagsRes.data.hashtags);
      }
      if (postsRes.data.success) {
        setTrendingPosts(postsRes.data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch trending data:', error);
      toast.error('Failed to load trending content');
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (tag) => {
    navigate(`/hashtag/${tag}`);
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Buzz</h1>
              <p className="text-sm text-gray-600">See what's trending on Chirp</p>
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="flex gap-2">
            {['day', 'week', 'month'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500">Loading trending content...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trending Hashtags */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-purple-600" />
                  Trending Topics
                </h2>
                <div className="space-y-3">
                  {trendingHashtags.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No trending topics yet</p>
                  ) : (
                    trendingHashtags.map((hashtag, index) => (
                      <div
                        key={hashtag._id}
                        onClick={() => handleHashtagClick(hashtag.tag)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 cursor-pointer transition-all group"
                      >
                        <span className="text-2xl font-bold text-gray-300 group-hover:text-purple-600 w-8">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 group-hover:text-purple-600 flex items-center gap-1">
                            <Hash className="w-4 h-4" />
                            {hashtag.tag}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hashtag.count} {hashtag.count === 1 ? 'post' : 'posts'}
                          </p>
                        </div>
                        <TrendingUp className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Trending Posts */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-600" />
                  Hot Posts
                </h2>
                <div className="space-y-4">
                  {trendingPosts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No trending posts yet</p>
                  ) : (
                    trendingPosts.map((post) => (
                      <div
                        key={post._id}
                        onClick={() => handlePostClick(post._id)}
                        className="p-4 rounded-xl hover:bg-gradient-to-r from-purple-50 to-pink-50 cursor-pointer transition-all border border-gray-100 hover:border-purple-200 group"
                      >
                        {/* User info */}
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={post.user?.profile_picture}
                            alt={post.user?.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 group-hover:text-purple-600">
                              {post.user?.full_name}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {moment(post.createdAt).fromNow()}
                            </p>
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-gray-800 mb-3 line-clamp-3">
                          {post.content}
                        </p>

                        {/* Image if exists */}
                        {post.image_urls && post.image_urls.length > 0 && (
                          <img
                            src={post.image_urls[0]}
                            alt="Post"
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.unique_viewers || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {post.likes_count?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count || 0}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Buzz;
