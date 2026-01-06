import { useState } from "react";
import { Image, X, Wand2, FileText, Lightbulb, ImagePlus } from "lucide-react";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import {toast} from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from '../api/axios.js'
import EmojiGifPicker from '../components/EmojiGifPicker';
import MediaEditor from '../components/MediaEditor';
import CloudUploadLoader from '../components/CloudUploadLoader';
import GenerateButton from '../components/GenerateButton';
import BeachBirdLoader from '../components/BeachBirdLoader';

const CreatePost = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiFeatureType, setAiFeatureType] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const user = useSelector((state) => state.user.value);

  const { getToken } = useAuth();

  const handleEmojiSelect = (emoji) => {
    setContent(prev => prev + emoji);
  };

  const handleGifSelect = (gifUrl) => {
    toast.info('GIF support coming soon!');
  };

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const file = files[0];
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setMediaType(type);
      setEditingMedia(file);
    }
  };

  const handleMediaSave = (editedFile) => {
    setImages([...images, editedFile]);
    setEditingMedia(null);
  };

  const handleAIGenerate = async (featureType) => {
    if (!content && featureType !== 'write' && featureType !== 'image') {
      toast.error('Please enter some content first');
      return;
    }

    if (featureType === 'image' && !content) {
      toast.error('Please describe the image you want to generate');
      return;
    }

    setAiFeatureType(featureType);
    setAiLoading(true);
    setShowAIModal(true);
    setAiResponse('');

    const prompts = {
      write: 'Generate an engaging social media post. Be creative, concise, and compelling. Write in a professional yet approachable tone.',
      refine: `Improve and refine this post while keeping its core message:\n\n${content}`,
      analyze: `Analyze this post and provide actionable suggestions for improvement:\n\n${content}`,
      expand: `Expand on this post with more details and context:\n\n${content}`,
      image: content
    };

    // Auto-detect model hint based on content and feature type
    let modelHint = 'auto';
    if (featureType === 'image') {
      modelHint = 'image';
    } else if (featureType === 'write') {
      // Check if content needs creativity vs speed
      const needsQuality = content && content.length > 100;
      modelHint = needsQuality ? 'quality' : 'fast';
    } else if (featureType === 'analyze') {
      modelHint = 'reasoning'; // Use reasoning model for analysis
    } else if (featureType === 'refine') {
      modelHint = 'quality'; // Use quality model for refinement
    }

    try {
      const requestType = featureType === 'image' ? 'image' : 'text';
      
      const response = await fetch('https://chirpai.fahadkhanxyz8816.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 12344321'
        },
        body: JSON.stringify({
          prompt: prompts[featureType],
          systemPrompt: featureType !== 'image' ? 'You are a professional content writer assistant. Provide clear, well-formatted responses without using asterisks for emphasis unless specifically required for lists or technical content. Use proper markdown formatting with headers, line breaks, and structure. Be concise, professional, and actionable.' : undefined,
          sessionId: `create-post-${Date.now()}`,
          type: requestType,
          modelHint, // Pass model hint to worker for intelligent selection
          tools: false,
          maxTokens: featureType !== 'image' ? 512 : undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (featureType === 'write' || featureType === 'refine' || featureType === 'expand') {
          setContent(data.response);
          toast.success('Content generated successfully!');
          setShowAIModal(false);
        } else if (featureType === 'analyze') {
          setAiResponse(data.response);
        } else if (featureType === 'image') {
          // Convert base64 image to File object
          const base64Data = data.response;
          const response_blob = await fetch(base64Data);
          const blob = await response_blob.blob();
          const file = new File([blob], `ai-generated-${Date.now()}.png`, { type: 'image/png' });
          
          setImages([...images, file]);
          toast.success('Image generated successfully!');
          setShowAIModal(false);
        }
      } else {
        throw new Error(data.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      toast.error('Failed to generate AI content');
      setShowAIModal(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    const token = getToken()
    if (!images.length && content) {
      toast.error("Please add at least one image or text");
    }
    setUploadProgress(0);

    const postType =
      images.length && content
        ? "text_with_image"
        : images.length
        ? "image"
        : "text";

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("post_type", postType);
      images.map((image) => {
        formData.append("images", image);
      });

      const { data } = await api.post("/api/post/add", formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      console.log(data)
      if (data.success) {
        setUploadProgress(100);
        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        console.log(data.message);
        throw new Error(data.message);
      }
    } catch (error) {
      console.log(error.message);
      throw new Error(error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Create Post
          </h1>
          <p className="text-slate-600">Share your thoughts with the world</p>
        </div>
        {/* Form */}
        <div className="max-w-xl bg-white p-4 sm:p-8 sm:pb-3 rounded-xl shadown-md space-y-4 overflow-visible">
          {/* Header */}
          <div className="flex items-center gap-3">
            <img
              src={user.profile_picture}
              alt=""
              className="w-12 h-12 rounded-full shadow"
            />
            <div>
              <h2 className="font-semibold">{user.full_name}</h2>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>
          {/* Text Area */}
          <div className="relative overflow-visible">
            <textarea
              className="w-full resize-none min-h-32 mt-4 text-sm outline-none placeholder-gray-400 pr-12"
              placeholder="What's happening?"
              onChange={(e) => setContent(e.target.value)}
              value={content}
            />
            <div className="absolute bottom-2 right-2 z-50">
              <EmojiGifPicker 
                onEmojiSelect={handleEmojiSelect}
                onGifSelect={handleGifSelect}
              />
            </div>
          </div>

          {/* AI Features */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <div className="relative">
              <GenerateButton 
                onClick={() => setShowAIMenu(!showAIMenu)} 
                isGenerating={aiLoading}
              />
              
              {showAIMenu && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        handleAIGenerate('write');
                        setShowAIMenu(false);
                      }}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all group"
                    >
                      <Wand2 className="w-5 h-5 text-purple-500 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 group-hover:text-purple-600">Write Post</div>
                        <div className="text-xs text-gray-500">Generate a new post from scratch</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        handleAIGenerate('refine');
                        setShowAIMenu(false);
                      }}
                      disabled={!content}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-5 h-5 text-blue-500 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600">Refine Content</div>

                    <button
                      onClick={() => {
                        handleAIGenerate('image');
                        setShowAIMenu(false);
                      }}
                      disabled={!content}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ImagePlus className="w-5 h-5 text-orange-500 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 group-hover:text-orange-600">Generate Image</div>
                        <div className="text-xs text-gray-500">Create an image from description</div>
                      </div>
                    </button>
                        <div className="text-xs text-gray-500">Improve your existing content</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        handleAIGenerate('analyze');
                        setShowAIMenu(false);
                      }}
                      disabled={!content}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lightbulb className="w-5 h-5 text-green-500 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 group-hover:text-green-600">Analyze Post</div>
                        <div className="text-xs text-gray-500">Get suggestions and insights</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400 ml-2">AI-powered content assistant</span>
          </div>

          {/* Images and Videos */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {images.map((file, i) => (
                <div key={i} className="relative group">
                  {file.type.startsWith('video/') ? (
                    <video
                      src={URL.createObjectURL(file)}
                      className="h-32 rounded-md object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${i + 1}`}
                      className="h-32 rounded-md object-cover"
                    />
                  )}
                  <div
                    onClick={() =>
                      setImages(images.filter((_, index) => index !== i))
                    }
                    className="absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/60 rounded-md cursor-pointer"
                  >
                    <X className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {file.type.startsWith('video/') ? 'Video' : 'Image'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Bar */}
          <div className="flex items-center justify-between  pt-3 border-t border-gray-300">
            <label
              htmlFor="images"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
              title="Add photo or video"
            >
              <Image className="size-6" />
              <span className="hidden sm:inline">Photo/Video</span>
            </label>

            <input
              type="file"
              id="images"
              accept="image/*,video/*"
              hidden
              onChange={handleMediaSelect}
            />

            <button
              disabled={loading}
              onClick={() =>
                toast.promise(handleSubmit(), {
                  loading: "uploading ...",
                  success: <p>Post Added</p>,
                  error: <p>Post Not Added</p>,
                })
              }
              className="text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer"
            >
              Publish Post
            </button>
          </div>
        </div>

      {/* Upload Progress Loader */}
      <CloudUploadLoader 
        isLoading={loading} 
        progress={uploadProgress}
        showProgress={true}
      />
      </div>

      {/* Media Editor Modal */}
      {editingMedia && (
        <MediaEditor
          file={editingMedia}
          type={mediaType}
          onSave={handleMediaSave}
          onCancel={() => setEditingMedia(null)}
        />
      )}

      {/* AI Analysis Modal */}
      {showAIModal && aiFeatureType === 'analyze' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-white" />
                  <h3 className="text-xl font-bold text-white">AI Analysis</h3>
                </div>
                <button 
                  onClick={() => setShowAIModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <BeachBirdLoader showMessage={true} />
                  <p className="text-gray-500 mt-4">Analyzing your content...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Post:</h4>
                    <p className="text-gray-600">{content}</p>
                  </div>
                  {aiResponse && (
                    <div className="whitespace-pre-wrap text-gray-800">
                      {aiResponse}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <p className="text-xs text-center text-gray-500">
                Powered by Chirp AI
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Image Generation Modal */}
      {showAIModal && aiFeatureType === 'image' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImagePlus className="w-6 h-6 text-white" />
                  <h3 className="text-xl font-bold text-white">Generating Image</h3>
                </div>
                <button 
                  onClick={() => setShowAIModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-12">
                <BeachBirdLoader showMessage={true} />
                <p className="text-gray-500 mt-4">Creating your image...</p>
                <p className="text-gray-400 text-sm mt-2">"{content}"</p>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <p className="text-xs text-center text-gray-500">
                Powered by Chirp AI • Flux Schnell
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
