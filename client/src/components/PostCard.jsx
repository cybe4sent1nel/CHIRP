import { BadgeCheck, Heart, MessageCircle, Share2, Edit2, Trash2, MoreVertical, X, Save, Send, Repeat2, Sparkles, Lightbulb, FileText, Wand2, TrendingUp, ThumbsUp } from "lucide-react";
import moment from "moment";
import { useState, useEffect, useRef } from "react";
import { dummyUserData } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from '../api/axios.js'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/clerk-react'
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';
import EmojiGifPicker from './EmojiGifPicker';
import AIButton from './AIButton';
import PostAnalytics from './PostAnalytics';
import MentionHashtagText from './MentionHashtagText';
import ReactionPicker from './ReactionPicker';
import ReactionSummary from './ReactionSummary';
import ReactionModal from './ReactionModal';

const PostCard = ({ post, onPostUpdate, onPostDelete }) => {
  const navigate = useNavigate()
  const {getToken} = useAuth()
  const postWithHashtags = post.content.replace(
    /(#\w+)/g,
    '<span class="text-indigo-600">$1</span>'
  );

  const [likes, setLikes] = useState(post.likes_count);
  const [reactions, setReactions] = useState(post.reactions || []);
  const [userReaction, setUserReaction] = useState(post.user_reaction || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editImages, setEditImages] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [bounceReaction, setBounceReaction] = useState(false);
  const reactionButtonRef = useRef(null);
  const [commentReactionPicker, setCommentReactionPicker] = useState(null);
  const [commentReactions, setCommentReactions] = useState({});
  const [bounceCommentReaction, setBounceCommentReaction] = useState(null);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentMedia, setCommentMedia] = useState(null);
  const [commentMediaType, setCommentMediaType] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyMedia, setReplyMedia] = useState(null);
  const [replyMediaType, setReplyMediaType] = useState(null);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count || 0);
  const [sharesCount, setSharesCount] = useState(post.shares_count || 0);
  const [hasReposted, setHasReposted] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiFeatureType, setAiFeatureType] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [uniqueViewers, setUniqueViewers] = useState(post.unique_viewers || 0);

  const currentUser = useSelector((state) => state.user.value);
  const isOwnPost = post.user._id === currentUser._id;

  console.log('PostCard state:', { showAnalytics, isOwnPost, postId: post._id });

  // Track post view
  useEffect(() => {
    const trackView = async () => {
      if (!isOwnPost) {
        try {
          const { data } = await api.post(`/api/post/view/${post._id}`, 
            { referrer: 'feed' }, // Track where the view came from
            { headers: { Authorization: `Bearer ${await getToken()}` } }
          );
          if (data.success && data.uniqueViewers !== undefined) {
            setUniqueViewers(data.uniqueViewers);
          }
        } catch (error) {
          console.error('Error tracking post view:', error);
        }
      }
    };
    
    trackView();
  }, [post._id, isOwnPost]);

  // Fetch comments on mount
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  // Check if user has reposted
  useEffect(() => {
    checkRepostStatus();
  }, []);

  const fetchComments = async () => {
    try {
      const {data} = await api.get(`/api/comment/post/${post._id}`, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });
      if (data.success) {
        setComments(data.comments || []);
        setCommentsCount(data.comments?.length || 0);
        
        // Initialize comment reactions state
        const reactionsState = {};
        data.comments?.forEach(comment => {
          reactionsState[comment._id] = {
            reactions: comment.reactions || [],
            userReaction: comment.user_reaction || null
          };
        });
        setCommentReactions(reactionsState);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkRepostStatus = async () => {
    try {
      const {data} = await api.get(`/api/post/repost-status/${post._id}`, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });
      if (data.success) {
        setHasReposted(data.hasReposted);
      }
    } catch (error) {
      console.error('Error checking repost status:', error);
    }
  };

  // AI Features
  const handleAIFeature = async (featureType) => {
    setAiFeatureType(featureType);
    setShowAIModal(true);
    setShowAIMenu(false);
    setAiLoading(true);
    setAiResponse('');

    try {
      const prompts = {
        summarize: `Summarize this post in a concise way (2-3 sentences):\n\n"${post.content}"`,
        improve: `Improve this post to make it more engaging and professional while maintaining the original message:\n\n"${post.content}"`,
        suggestions: `Provide 3-4 actionable suggestions or insights based on this post:\n\n"${post.content}"`,
        analyze: `Analyze the sentiment, tone, and key themes of this post:\n\n"${post.content}"`
      };

      console.log('Making AI request for:', featureType);
      
      const requestBody = {
        prompt: prompts[featureType],
        systemPrompt: 'You are a helpful AI assistant that provides concise and valuable insights.',
        sessionId: `post-${post._id}`,
        type: 'text',
        tools: false,
        maxTokens: 512
      };
      
      console.log('Request body:', requestBody);

      const response = await fetch('https://chirpai.fahadkhanxyz8816.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 12344321'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'AI request failed');
      }

      if (!data.success && data.error) {
        throw new Error(data.error);
      }
      
      const aiText = data.response || data.text || data.message || 'No response generated';
      setAiResponse(aiText);
    } catch (error) {
      console.error('AI Feature Error:', error);
      const errorMsg = error.message || 'Failed to generate AI response';
      setAiResponse(`Error: ${errorMsg}. Please try again.`);
      toast.error('AI feature failed: ' + errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

   

  const handleLike = async () => {
    try {
      // Check if already liked (handle both string IDs and user objects)
      const isLiked = Array.isArray(likes) 
        ? likes.some(like => typeof like === 'object' ? like._id === currentUser._id : like === currentUser._id)
        : false;
      
      // Optimistic update
      if (isLiked) {
        setLikes(prev => Array.isArray(prev) 
          ? prev.filter(like => typeof like === 'object' ? like._id !== currentUser._id : like !== currentUser._id)
          : []);
        setUserReaction(null);
      } else {
        setLikes(prev => {
          const currentLikes = Array.isArray(prev) ? prev : [];
          return [...currentLikes, {
            _id: currentUser._id,
            full_name: currentUser.full_name,
            username: currentUser.username,
            profile_picture: currentUser.profile_picture
          }];
        });
        setUserReaction('LIKE');
      }

      const {data} = await api.post('/api/post/like', {
        postId: post._id,
        reactionType: 'LIKE'
      }, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      })
      
      if (data.success){
        // Update with server data (already populated)
        setLikes(data.likes || []);
        setUserReaction(data.userReaction || null);
        
        // Send notification to post owner if it's a like (not unlike)
        if (!isLiked && post.user._id !== currentUser._id) {
          await api.post('/api/notification/send', {
            recipientId: post.user._id,
            type: 'like',
            message: `${currentUser.full_name} reacted to your post`,
            link: `/post/${post._id}`
          }, {
            headers: {Authorization: `Bearer ${await getToken()}`}
          });
        }
      } else {
        // Revert on error
        if (isLiked) {
          setLikes(prev => [...prev, currentUser._id]);
        } else {
          setLikes(prev => prev.filter(id => id !== currentUser._id));
        }
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to like post');
      // Revert on error
      const isLiked = Array.isArray(likes) ? likes.includes(currentUser._id) : false;
      if (isLiked) {
        setLikes(prev => [...prev, currentUser._id]);
      } else {
        setLikes(prev => Array.isArray(prev) ? prev.filter(id => id !== currentUser._id) : []);
      }
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      setShowReactionPicker(false);
      
      // Trigger bounce animation
      setBounceReaction(true);
      setTimeout(() => setBounceReaction(false), 600);

      const isLiked = Array.isArray(likes) 
        ? likes.some(like => typeof like === 'object' ? like._id === currentUser._id : like === currentUser._id)
        : false;
      
      // Optimistic update
      if (userReaction === reactionType && isLiked) {
        // Remove reaction
        setLikes(prev => Array.isArray(prev) 
          ? prev.filter(like => typeof like === 'object' ? like._id !== currentUser._id : like !== currentUser._id)
          : []);
        setUserReaction(null);
      } else {
        // Add or update reaction
        if (!isLiked) {
          setLikes(prev => {
            const currentLikes = Array.isArray(prev) ? prev : [];
            return [...currentLikes, {
              _id: currentUser._id,
              full_name: currentUser.full_name,
              username: currentUser.username,
              profile_picture: currentUser.profile_picture
            }];
          });
        }
        setUserReaction(reactionType);
      }

      const {data} = await api.post('/api/post/like', {
        postId: post._id,
        reactionType
      }, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      })
      
      if (data.success){
        setLikes(data.likes || []);
        setUserReaction(data.userReaction || null);
        
        // Update reactions array
        if (data.userReaction) {
          setReactions(prev => {
            const filtered = prev.filter(r => r.user !== currentUser._id);
            return [...filtered, { user: currentUser._id, type: data.userReaction, createdAt: new Date() }];
          });
        } else {
          setReactions(prev => prev.filter(r => r.user !== currentUser._id));
        }
        
        // Send notification
        if (data.userReaction && post.user._id !== currentUser._id) {
          await api.post('/api/notification/send', {
            recipientId: post.user._id,
            type: 'like',
            message: `${currentUser.full_name} reacted to your post`,
            link: `/post/${post._id}`
          }, {
            headers: {Authorization: `Bearer ${await getToken()}`}
          });
        }
      }
    } catch (error) {
      console.error('Reaction error:', error);
      toast.error('Failed to react to post');
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (isEditing) {
      setEditContent(prev => prev + emoji);
    } else {
      setCommentText(prev => prev + emoji);
    }
  };

  const handleCommentGifSelect = (gifUrl) => {
    const mediaType = gifUrl.includes('sticker') ? 'sticker' : 'gif';
    setCommentMedia(gifUrl);
    setCommentMediaType(mediaType);
  };

  const handleReplyGifSelect = (gifUrl) => {
    const mediaType = gifUrl.includes('sticker') ? 'sticker' : 'gif';
    setReplyMedia(gifUrl);
    setReplyMediaType(mediaType);
  };

  const handleEditPost = async () => {
    try {
      const formData = new FormData();
      formData.append('postId', post._id);
      formData.append('content', editContent);
      
      editImages.forEach(img => {
        formData.append('images', img);
      });

      const {data} = await api.put('/api/post/update', formData, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });

      if (data.success) {
        toast.success('Post updated!');
        setIsEditing(false);
        if (onPostUpdate) onPostUpdate(data.post);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const {data} = await api.delete(`/api/post/delete/${post._id}`, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });

      if (data.success) {
        toast.success('Post deleted!');
        if (onPostDelete) onPostDelete(post._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() && !commentMedia) return;

    try {
      const {data} = await api.post('/api/comment/add', {
        postId: post._id,
        text: commentText,
        media_url: commentMedia,
        media_type: commentMediaType
      }, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });

      if (data.success) {
        setComments([...comments, data.comment]);
        setCommentText('');
        setCommentMedia(null);
        setCommentMediaType(null);
        setCommentsCount(prev => prev + 1);
        toast.success('Comment added!');
        
        // Send notification to post owner
        if (post.user._id !== currentUser._id) {
          await api.post('/api/notification/send', {
            recipientId: post.user._id,
            type: 'comment',
            message: `${currentUser.full_name} commented on your post`,
            link: `/post/${post._id}`
          }, {
            headers: {Authorization: `Bearer ${await getToken()}`}
          });
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditComment = async (commentId) => {
    try {
      const {data} = await api.put('/api/comment/update', {
        commentId,
        text: editingCommentText
      }, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });

      if (data.success) {
        setComments(comments.map(c => c._id === commentId ? data.comment : c));
        setEditingCommentId(null);
        setEditingCommentText('');
        toast.success('Comment updated!');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const {data} = await api.delete(`/api/comment/delete/${commentId}`, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });

      if (data.success) {
        setComments(comments.filter(c => c._id !== commentId));
        setCommentsCount(prev => prev - 1);
        toast.success('Comment deleted!');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCommentReaction = async (commentId, reactionType) => {
    try {
      setCommentReactionPicker(null);
      
      // Trigger bounce animation
      setBounceCommentReaction(commentId);
      setTimeout(() => setBounceCommentReaction(null), 600);

      const {data} = await api.post('/api/comment/react', {
        commentId,
        reactionType
      }, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });

      if (data.success) {
        // Update comment reactions in state
        setCommentReactions(prev => ({
          ...prev,
          [commentId]: {
            reactions: data.reactions || [],
            userReaction: data.userReaction
          }
        }));

        // Update the comment in the comments list
        setComments(prevComments => 
          prevComments.map(c => 
            c._id === commentId 
              ? { ...c, reactions: data.reactions || [] }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Comment reaction error:', error);
      toast.error('Failed to react to comment');
    }
  };

  const handleReply = async (parentCommentId) => {
    if (!replyText.trim() && !replyMedia) return;
    
    try {
      const {data} = await api.post('/api/comment/reply', {
        commentId: parentCommentId,
        text: replyText.trim(),
        media_url: replyMedia,
        media_type: replyMediaType
      }, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });

      if (data.success) {
        // Add the reply to the comments list
        setComments(prev => [...prev, data.reply]);
        setReplyText('');
        setReplyMedia(null);
        setReplyMediaType(null);
        setReplyingToCommentId(null);
        toast.success('Reply added!');
      }
    } catch (error) {
      console.error('Reply error:', error);
      toast.error('Failed to add reply');
    }
  };

  const handleRepost = async () => {
    try {
      const {data} = await api.post('/api/post/repost', {
        postId: post._id
      }, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });

      if (data.success) {
        const wasReposted = hasReposted;
        setHasReposted(!hasReposted);
        setRepostsCount(prev => hasReposted ? prev - 1 : prev + 1);
        toast.success(hasReposted ? 'Repost removed!' : 'Reposted!');
        
        // Send notification to post owner if reposting (not unreposting)
        if (!wasReposted && post.user._id !== currentUser._id) {
          await api.post('/api/notification/send', {
            recipientId: post.user._id,
            type: 'repost',
            message: `${currentUser.full_name} reposted your post`,
            link: `/post/${post._id}`
          }, {
            headers: {Authorization: `Bearer ${await getToken()}`}
          });
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleShare = async () => {
    try {
      // Copy post link to clipboard
      const postUrl = `${window.location.origin}/post/${post._id}`;
      await navigator.clipboard.writeText(postUrl);
      
      // Increment share count
      const {data} = await api.post('/api/post/share', {
        postId: post._id
      }, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });

      if (data.success) {
        setSharesCount(prev => prev + 1);
      }
      
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to share post');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl">
      {/* User Info */}
      <div className="flex items-center justify-between">
        <div 
          onClick={() => {
            if (post.user._id === currentUser._id) {
              navigate('/profile');
            } else {
              navigate(`/profile/${post.user.username || post.user._id}`);
            }
          }} 
          className="inline-flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img
            src={post.user.profile_picture}
            alt=""
            className="w-10 h-10 rounded-full shadow"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span>{post.user.full_name}</span>
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-gray-500 text-sm">
              @{post.user.username} • {moment(post.createdAt).fromNow()}
            </div>
          </div>
        </div>
        
        {/* Menu for own posts */}
        {isOwnPost && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Post
                </button>
                <button
                  onClick={() => {
                    handleDeletePost();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Content - Edit Mode */}
      {isEditing ? (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="absolute bottom-2 right-2">
              <EmojiGifPicker 
                onEmojiSelect={handleEmojiSelect}
                onGifSelect={() => {}}
              />
            </div>
          </div>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => setEditImages([...e.target.files])}
            className="text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleEditPost}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
                setEditImages([]);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Content - View Mode */}
          {post.content && (
            <div className="text-gray-800 text-sm whitespace-pre-line">
              <MentionHashtagText 
                text={post.content} 
                className="leading-relaxed"
              />
            </div>
          )}
      {/* Media (Images, Videos, Audio) */}
      <div className="space-y-3">
        {/* Images */}
        <div className="grid grid-cols-2 gap-2">
          {post.image_urls?.map((img, index) => (
            <img
              key={index}
              src={img}
              className={`w-full h-48 object-cover rounded-lg ${
                post.image_urls.length === 1 && "col-span-2 h-auto"
              }`}
            />
          ))}
        </div>

        {/* Videos */}
        {post.video_urls?.map((video, index) => (
          <div key={index} className="w-full">
            <VideoPlayer 
              src={video}
              fileName={`video-${index + 1}`}
            />
          </div>
        ))}

        {/* Audio */}
        {post.audio_urls?.map((audio, index) => (
          <div key={index} className="w-full">
            <AudioPlayer 
              src={audio}
              fileName={`audio-${index + 1}`}
            />
          </div>
        ))}
      </div>

      {/* AI Features Button - Right Side */}
      <div className="flex justify-end mt-2">
        <div className="relative">
          <AIButton 
            onClick={() => setShowAIMenu(!showAIMenu)}
            showMenu={showAIMenu}
          />
            
          {showAIMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-1">
              <button
                onClick={() => handleAIFeature('summarize')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-purple-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="text-sm font-medium text-gray-800">Summarize</div>
                  <div className="text-xs text-gray-500">Get a brief summary</div>
                </div>
              </button>
              <button
                onClick={() => handleAIFeature('improve')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-purple-50 transition-colors"
              >
                <Wand2 className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="text-sm font-medium text-gray-800">Improve</div>
                  <div className="text-xs text-gray-500">Make it more engaging</div>
                </div>
              </button>
              <button
                onClick={() => handleAIFeature('suggestions')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-purple-50 transition-colors"
              >
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-gray-800">Suggestions</div>
                  <div className="text-xs text-gray-500">Get actionable insights</div>
                </div>
              </button>
              <button
                onClick={() => handleAIFeature('analyze')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-purple-50 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-pink-600" />
                <div>
                  <div className="text-sm font-medium text-gray-800">Analyze</div>
                  <div className="text-xs text-gray-500">Sentiment & themes</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
      </>
      )}
      
      {/* Reaction Summary */}
      {Array.isArray(likes) && likes.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <ReactionSummary 
            reactions={reactions}
            likes={likes}
            currentUserId={currentUser._id}
            onClick={() => setShowReactionModal(true)}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between text-gray-600 text-sm pt-3 pb-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6">
          {/* Like/React Button */}
          <div className="flex items-center gap-2 relative">
            <div 
              ref={reactionButtonRef}
              className="relative"
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setTimeout(() => setShowReactionPicker(false), 300)}
            >
              <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
                userReaction ? "text-blue-600 font-semibold" : "text-gray-600 dark:text-gray-400"
              }`}
              onClick={handleLike}>
                <ThumbsUp
                  className={`transition-all duration-300 ${
                    userReaction ? "fill-blue-600 w-5 h-5" : "w-4 h-4"
                  } ${bounceReaction ? "animate-bounce" : ""}`}
                />
                <span className="text-sm">{userReaction || 'Like'}</span>
              </button>
              {showReactionPicker && (
                <div 
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setShowReactionPicker(false)}
                >
                  <ReactionPicker 
                    onReactionSelect={handleReaction}
                    position="top"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Comment Button - keeping existing structure but with better styling */}
          <div className="flex items-center gap-2 relative">
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Comment</span>
            </button>
            {commentsCount > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="text-xs text-gray-500 hover:text-blue-600 hover:underline cursor-pointer"
              >
                {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Keeping the old structure for profile pictures display */}
          <div className="hidden">
          {Array.isArray(likes) && likes.length > 0 && (
            <div className="flex -space-x-2">
              {likes.slice(0, 3).map((like, index) => {
                const user = typeof like === 'object' ? like : null;
                if (!user) return null;
                
                const isOwnProfile = user._id === currentUser._id;
                const handleProfileClick = () => {
                  if (isOwnProfile) {
                    navigate('/profile');
                  } else {
                    navigate(`/profile/${user.username || user._id}`);
                  }
                };
                
                return (
                  <div
                    key={user._id || index}
                    onClick={handleProfileClick}
                    className="cursor-pointer hover:scale-110 transition-transform"
                    title={user.full_name || user.username}
                  >
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.full_name}
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                        {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
              {likes.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
                  +{likes.length - 3}
                </div>
              )}
            </div>
          )}
          </div>

          {/* Repost Button */}
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
              hasReposted ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={handleRepost}
          >
            <Repeat2 className="w-4 h-4" />
            <span className="text-sm">Repost</span>
          </button>
          {repostsCount > 0 && (
            <span className="text-xs text-gray-500">
              {repostsCount} repost{repostsCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Share Button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
            {sharesCount > 0 && (
              <span className="text-xs">({sharesCount})</span>
            )}
          </button>
        </div>

        {/* Analytics Button (Only for own posts) */}
        {isOwnPost && (
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 group"
            onClick={(e) => {
              e.stopPropagation();
              setShowAnalytics(true);
            }}
            title="View Analytics"
          >
            <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">{uniqueViewers}</span>
          </button>
        )}
        </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          {/* Add Comment */}
          <div className="flex gap-2">
            <img
              src={currentUser.profile_picture}
              alt=""
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            />
            <div className="flex-1 space-y-2">
              {commentMedia && (
                <div className="relative inline-block">
                  <img src={commentMedia} alt="GIF" className="max-w-[200px] rounded-lg" />
                  <button
                    onClick={() => {
                      setCommentMedia(null);
                      setCommentMediaType(null);
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <EmojiGifPicker 
                    onEmojiSelect={handleEmojiSelect}
                    onGifSelect={handleCommentGifSelect}
                  />
                  <button
                    onClick={handleAddComment}
                    className="p-1 hover:bg-purple-100 rounded-full"
                  >
                    <Send className="w-4 h-4 text-purple-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-2">
            {comments
              .filter(comment => !comment.parentComment) // Only show top-level comments
              .map((comment) => {
              const isOwnComment = comment.user?._id === currentUser._id;
              const isEditingThis = editingCommentId === comment._id;
              const replies = comments.filter(c => c.parentComment === comment._id);

              return (
                <div key={comment._id}>
                  <div className="flex gap-2 bg-gray-50 p-3 rounded-lg"
>
                  <img
                    src={comment.user?.profile_picture || currentUser.profile_picture}
                    alt=""
                    onClick={() => {
                      if (comment.user?._id === currentUser._id) {
                        navigate('/profile');
                      } else if (comment.user?.username) {
                        navigate(`/profile/${comment.user.username}`);
                      }
                    }}
                    className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        onClick={() => {
                          if (comment.user?._id === currentUser._id) {
                            navigate('/profile');
                          } else if (comment.user?.username) {
                            navigate(`/profile/${comment.user.username}`);
                          }
                        }}
                        className="font-semibold text-sm cursor-pointer hover:text-purple-600"
                      >
                        {comment.user?.full_name || currentUser.full_name}
                      </span>
                      <span className="text-xs text-gray-500">{moment(comment.createdAt).fromNow()}</span>
                    </div>
                    
                    {isEditingThis ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => handleEditComment(comment._id)}
                            className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText('');
                            }}
                            className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-2">
                          {comment.text && (
                            <MentionHashtagText 
                              text={comment.text}
                              className="text-sm text-gray-800"
                            />
                          )}
                          {comment.media_url && (
                            <img 
                              src={comment.media_url} 
                              alt={comment.media_type || 'media'}
                              className="max-w-[250px] rounded-lg border border-gray-200"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-end">
                          {isOwnComment && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment._id);
                                  setEditingCommentText(comment.text);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Edit2 className="w-3 h-3 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Comment Actions */}
                        <div className="flex items-center gap-3 mt-2">
                          {/* Reaction Button */}
                          <div 
                            className="relative flex items-center gap-1"
                            onMouseEnter={() => setCommentReactionPicker(comment._id)}
                            onMouseLeave={() => setCommentReactionPicker(null)}
                          >
                            <button
                              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-all"
                              onClick={() => handleCommentReaction(comment._id, 'LIKE')}
                            >
                              <ThumbsUp
                                className={`transition-all duration-300 ${
                                  commentReactions[comment._id]?.userReaction || (comment.reactions && comment.reactions.some(r => r.user === currentUser._id))
                                    ? "text-blue-600 fill-blue-600 w-3.5 h-3.5" 
                                    : "text-gray-500 w-3 h-3"
                                } ${bounceCommentReaction === comment._id ? "animate-bounce" : ""}`}
                              />
                              <span className="text-xs text-gray-500">
                                {(commentReactions[comment._id]?.reactions?.length || comment.reactions?.length || 0) || ''}
                              </span>
                            </button>
                            {commentReactionPicker === comment._id && (
                              <ReactionPicker 
                                onReactionSelect={(type) => handleCommentReaction(comment._id, type)}
                                position="bottom"
                              />
                            )}
                          </div>
                          
                          {/* Reply Button */}
                          <button
                            onClick={() => {
                              setReplyingToCommentId(comment._id);
                              setReplyText('');
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-all"
                          >
                            <MessageCircle className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">Reply</span>
                          </button>
                        </div>
                        
                        {/* Reply Input */}
                        {replyingToCommentId === comment._id && (
                          <div className="mt-2 ml-4 border-l-2 border-purple-300 pl-3 space-y-2">
                            <div className="flex gap-2 items-start">
                              <img
                                src={currentUser.profile_picture}
                                alt=""
                                className="w-6 h-6 rounded-full"
                              />
                              <div className="flex-1 space-y-2">
                                {replyMedia && (
                                  <div className="relative inline-block">
                                    <img src={replyMedia} alt="GIF" className="max-w-[150px] rounded-lg" />
                                    <button
                                      onClick={() => {
                                        setReplyMedia(null);
                                        setReplyMediaType(null);
                                      }}
                                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                      <X className="w-2 h-2" />
                                    </button>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <div className="flex-1 relative">
                                    <input
                                      type="text"
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder={`Reply to ${comment.user?.full_name || 'user'}...`}
                                      className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleReply(comment._id);
                                        }
                                      }}
                                    />
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                      <EmojiGifPicker 
                                        onEmojiSelect={(emoji) => setReplyText(prev => prev + emoji)}
                                        onGifSelect={handleReplyGifSelect}
                                      />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleReply(comment._id)}
                                    className="p-1.5 hover:bg-purple-100 rounded-full"
                                  >
                                    <Send className="w-4 h-4 text-purple-600" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyingToCommentId(null);
                                      setReplyText('');
                                      setReplyMedia(null);
                                      setReplyMediaType(null);
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded-full"
                                  >
                                    <X className="w-4 h-4 text-gray-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="ml-10 mt-2 space-y-2 border-l-2 border-purple-200 pl-3">
                    {replies.map((reply) => {
                      const isOwnReply = reply.user?._id === currentUser._id;
                      const isEditingThisReply = editingCommentId === reply._id;
                      
                      return (
                        <div key={reply._id} className="flex gap-2 bg-purple-50/50 p-2 rounded-lg">
                          <img
                            src={reply.user?.profile_picture || currentUser.profile_picture}
                            alt=""
                            onClick={() => {
                              if (reply.user?._id === currentUser._id) {
                                navigate('/profile');
                              } else if (reply.user?.username) {
                                navigate(`/profile/${reply.user.username}`);
                              }
                            }}
                            className="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span 
                                onClick={() => {
                                  if (reply.user?._id === currentUser._id) {
                                    navigate('/profile');
                                  } else if (reply.user?.username) {
                                    navigate(`/profile/${reply.user.username}`);
                                  }
                                }}
                                className="font-semibold text-xs cursor-pointer hover:text-purple-600"
                              >
                                {reply.user?.full_name || currentUser.full_name}
                              </span>
                              <span className="text-[10px] text-gray-500">{moment(reply.createdAt).fromNow()}</span>
                            </div>
                            
                            {isEditingThisReply ? (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                                />
                                <div className="flex gap-1 mt-1">
                                  <button
                                    onClick={() => handleEditComment(reply._id)}
                                    className="px-2 py-1 bg-purple-600 text-white text-[10px] rounded hover:bg-purple-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditingCommentText('');
                                    }}
                                    className="px-2 py-1 bg-gray-300 text-gray-700 text-[10px] rounded hover:bg-gray-400"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-col gap-2">
                                  {reply.text && (
                                    <MentionHashtagText 
                                      text={reply.text}
                                      className="text-xs text-gray-800"
                                    />
                                  )}
                                  {reply.media_url && (
                                    <img 
                                      src={reply.media_url} 
                                      alt={reply.media_type || 'media'}
                                      className="max-w-[200px] rounded-lg border border-gray-200"
                                    />
                                  )}
                                </div>
                                <div className="flex items-center justify-end">
                                  {isOwnReply && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingCommentId(reply._id);
                                          setEditingCommentText(reply.text);
                                        }}
                                        className="p-1 hover:bg-gray-200 rounded"
                                      >
                                        <Edit2 className="w-2.5 h-2.5 text-gray-600" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(reply._id)}
                                        className="p-1 hover:bg-gray-200 rounded"
                                      >
                                        <Trash2 className="w-2.5 h-2.5 text-red-600" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Reply Reaction Button */}
                                <div 
                                  className="relative flex items-center gap-1 mt-1"
                                  onMouseEnter={() => setCommentReactionPicker(reply._id)}
                                  onMouseLeave={() => setCommentReactionPicker(null)}
                                >
                                  <button
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-all"
                                    onClick={() => handleCommentReaction(reply._id, 'LIKE')}
                                  >
                                    <ThumbsUp
                                      className={`transition-all duration-300 ${
                                        commentReactions[reply._id]?.userReaction || (reply.reactions && reply.reactions.some(r => r.user === currentUser._id))
                                          ? "text-blue-600 fill-blue-600 w-3 h-3" 
                                          : "text-gray-500 w-2.5 h-2.5"
                                      } ${bounceCommentReaction === reply._id ? "animate-bounce" : ""}`}
                                    />
                                    <span className="text-[10px] text-gray-500">
                                      {(commentReactions[reply._id]?.reactions?.length || reply.reactions?.length || 0) || ''}
                                    </span>
                                  </button>
                                  {commentReactionPicker === reply._id && (
                                    <ReactionPicker 
                                      onReactionSelect={(type) => handleCommentReaction(reply._id, type)}
                                      position="bottom"
                                    />
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  {aiFeatureType === 'summarize' && <FileText className="w-6 h-6 text-white" />}
                  {aiFeatureType === 'improve' && <Wand2 className="w-6 h-6 text-white" />}
                  {aiFeatureType === 'suggestions' && <Lightbulb className="w-6 h-6 text-white" />}
                  {aiFeatureType === 'analyze' && <Sparkles className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {aiFeatureType === 'summarize' && 'Post Summary'}
                    {aiFeatureType === 'improve' && 'Improved Version'}
                    {aiFeatureType === 'suggestions' && 'AI Suggestions'}
                    {aiFeatureType === 'analyze' && 'Content Analysis'}
                  </h3>
                  <p className="text-sm text-white/80">Powered by Chirp AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {/* Original Post */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Original Post</h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
                </div>
              </div>

              {/* AI Response */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  {aiFeatureType === 'summarize' && 'Summary'}
                  {aiFeatureType === 'improve' && 'Improved Version'}
                  {aiFeatureType === 'suggestions' && 'Suggestions'}
                  {aiFeatureType === 'analyze' && 'Analysis'}
                </h4>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                  {aiLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                        <Sparkles className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-gray-600 mt-4 animate-pulse">AI is thinking...</p>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-800 whitespace-pre-line leading-relaxed">{aiResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Sparkles className="w-4 h-4" />
                <span>Generated by Chirp AI • Cloudflare Workers</span>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <PostAnalytics 
          post={post}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Reaction Modal */}
      {showReactionModal && (
        <ReactionModal
          reactions={reactions}
          likes={likes}
          currentUserId={currentUser._id}
          onClose={() => setShowReactionModal(false)}
        />
      )}
    </div>
  );
};

export default PostCard;
