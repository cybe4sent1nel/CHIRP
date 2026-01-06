import { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Scissors, Wand2, Sparkles, Download, Check, Layers, Eraser } from 'lucide-react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const MediaEditor = ({ file, onSave, onCancel, type = 'image' }) => {
  const [editedFile, setEditedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [activeFilter, setActiveFilter] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  
  // Video trimming states
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Background removal state
  const [removingBg, setRemovingBg] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

  const filters = [
    { name: 'none', label: 'Original', style: {} },
    { name: 'grayscale', label: 'B&W', style: { filter: 'grayscale(100%)' } },
    { name: 'sepia', label: 'Sepia', style: { filter: 'sepia(100%)' } },
    { name: 'vintage', label: 'Vintage', style: { filter: 'sepia(50%) contrast(120%) brightness(90%)' } },
    { name: 'cool', label: 'Cool', style: { filter: 'saturate(120%) hue-rotate(180deg)' } },
    { name: 'warm', label: 'Warm', style: { filter: 'saturate(130%) hue-rotate(-20deg)' } },
    { name: 'bright', label: 'Bright', style: { filter: 'brightness(120%) contrast(110%)' } },
    { name: 'dramatic', label: 'Dramatic', style: { filter: 'contrast(150%) saturate(80%)' } },
    { name: 'fade', label: 'Fade', style: { filter: 'brightness(110%) saturate(70%)' } },
  ];

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setEditedFile(file);
      
      if (type === 'video' && videoRef.current) {
        videoRef.current.onloadedmetadata = () => {
          const duration = videoRef.current.duration;
          setVideoDuration(duration);
          setTrimEnd(duration);
        };
      }

      return () => URL.revokeObjectURL(url);
    }
  }, [file, type]);

  const applyFilterToCanvas = () => {
    if (!canvasRef.current || type !== 'image') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Apply filter using CSS
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
      
      // Apply preset filter
      const filter = filters.find(f => f.name === activeFilter);
      if (filter && filter.style.filter) {
        ctx.filter += ` ${filter.style.filter}`;
      }
      
      ctx.drawImage(img, 0, 0);
    };
    
    img.src = preview;
  };

  useEffect(() => {
    if (type === 'image') {
      applyFilterToCanvas();
    }
  }, [brightness, contrast, saturation, blur, activeFilter, preview]);

  const removeBackground = async () => {
    if (type !== 'image') return;
    
    setRemovingBg(true);
    toast.loading('Removing background...', { id: 'bg-removal' });
    
    try {
      // Simple background removal using canvas (basic implementation)
      // For production, use @imgly/background-removal but it's heavy
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple edge detection and background removal
      // This is a basic implementation - works best with solid backgrounds
      const threshold = 30;
      const bgColor = { r: data[0], g: data[1], b: data[2] };
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const diff = Math.abs(r - bgColor.r) + Math.abs(g - bgColor.g) + Math.abs(b - bgColor.b);
        
        if (diff < threshold) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      setBgRemoved(true);
      toast.success('Background removed!', { id: 'bg-removal' });
    } catch (error) {
      toast.error('Failed to remove background', { id: 'bg-removal' });
      console.error(error);
    } finally {
      setRemovingBg(false);
    }
  };

  const trimVideo = async () => {
    if (type !== 'video') return;
    
    setIsProcessing(true);
    toast.loading('Trimming video...', { id: 'video-trim' });
    
    try {
      const video = videoRef.current;
      
      // Use a more reliable method for video trimming
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9') && 
          !MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        throw new Error('Browser does not support video recording');
      }
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm;codecs=vp8';
      
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000
      });
      
      const chunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '_trimmed.webm';
        const trimmedFile = new File([blob], fileName, { type: 'video/webm' });
        setEditedFile(trimmedFile);
        setIsProcessing(false);
        toast.success(`Video trimmed! Duration: ${(trimEnd - trimStart).toFixed(1)}s`, { id: 'video-trim' });
      };
      
      // Seek to start position
      video.currentTime = trimStart;
      
      await new Promise(resolve => {
        video.onseeked = resolve;
      });
      
      // Start recording
      mediaRecorder.start();
      
      // Draw frames
      const startTime = Date.now();
      const duration = (trimEnd - trimStart) * 1000; // Convert to milliseconds
      
      const drawFrame = () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed < duration && !video.paused && video.currentTime < trimEnd) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
          video.pause();
        }
      };
      
      video.play();
      drawFrame();
      
    } catch (error) {
      setIsProcessing(false);
      toast.error('Failed to trim video. Try a different browser or shorter clip.', { id: 'video-trim' });
      console.error(error);
    }
  };

  const handleSave = async () => {
    setIsProcessing(true);
    
    try {
      let finalFile = editedFile;
      
      if (type === 'image' && canvasRef.current) {
        // Convert canvas to blob
        const blob = await new Promise(resolve => {
          canvasRef.current.toBlob(resolve, 'image/jpeg', 0.95);
        });
        
        // Compress image
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        
        const compressedBlob = await imageCompression(blob, options);
        finalFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      }
      
      toast.success('Media saved successfully!');
      onSave(finalFile);
    } catch (error) {
      toast.error('Failed to save media');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Edit {type === 'image' ? 'Photo' : 'Video'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview Area */}
            <div className="lg:col-span-2">
              <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                {type === 'image' ? (
                  <>
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-full object-contain"
                      style={{ display: 'block' }}
                    />
                    <img
                      src={preview}
                      alt="Preview"
                      className="hidden"
                      crossOrigin="anonymous"
                    />
                  </>
                ) : (
                  <video
                    ref={videoRef}
                    src={preview}
                    className="max-w-full max-h-full object-contain"
                    controls
                    onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                  />
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {type === 'image' ? (
                <>
                  {/* Filters */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Wand2 className="w-5 h-5" />
                      Filters
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {filters.map(filter => (
                        <button
                          key={filter.name}
                          onClick={() => setActiveFilter(filter.name)}
                          className={`relative p-2 rounded-lg border-2 transition-all ${
                            activeFilter === filter.name
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-full aspect-square rounded bg-gradient-to-br from-purple-400 to-pink-400 mb-1"
                            style={filter.style}
                          />
                          <span className="text-xs font-medium">{filter.label}</span>
                          {activeFilter === filter.name && (
                            <Check className="absolute top-1 right-1 w-4 h-4 text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Adjustments */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Adjustments</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          Brightness: {brightness}%
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={brightness}
                          onChange={(e) => setBrightness(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          Contrast: {contrast}%
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={contrast}
                          onChange={(e) => setContrast(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          Saturation: {saturation}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={saturation}
                          onChange={(e) => setSaturation(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          Blur: {blur}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={blur}
                          onChange={(e) => setBlur(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Background Removal */}
                  <div>
                    <button
                      onClick={removeBackground}
                      disabled={removingBg || bgRemoved}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eraser className="w-5 h-5" />
                      {bgRemoved ? 'Background Removed' : 'Remove Background'}
                    </button>
                  </div>
                </>
              ) : (
                // Video controls
                <>
                  {/* Video Filters */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Wand2 className="w-5 h-5" />
                      Video Filters
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {filters.slice(0, 6).map(filter => (
                        <button
                          key={filter.name}
                          onClick={() => {
                            setActiveFilter(filter.name);
                            if (videoRef.current) {
                              videoRef.current.style.filter = filter.style.filter || 'none';
                            }
                          }}
                          className={`relative p-2 rounded-lg border-2 transition-all ${
                            activeFilter === filter.name
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-full aspect-square rounded bg-gradient-to-br from-blue-400 to-purple-400 mb-1"
                            style={filter.style}
                          />
                          <span className="text-xs font-medium">{filter.label}</span>
                          {activeFilter === filter.name && (
                            <Check className="absolute top-1 right-1 w-4 h-4 text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Trimming */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Scissors className="w-5 h-5" />
                      Trim Video
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-indigo-50 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Original:</span>
                          <span className="font-semibold text-gray-900">{videoDuration.toFixed(1)}s</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-600">Trimmed:</span>
                          <span className="font-semibold text-indigo-600">{(trimEnd - trimStart).toFixed(1)}s</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium text-gray-700">
                            Start Time
                          </label>
                          <span className="text-sm text-indigo-600 font-semibold">
                            {trimStart.toFixed(1)}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={videoDuration}
                          step="0.1"
                          value={trimStart}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setTrimStart(Math.min(value, trimEnd - 0.1));
                            if (videoRef.current) {
                              videoRef.current.currentTime = value;
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium text-gray-700">
                            End Time
                          </label>
                          <span className="text-sm text-indigo-600 font-semibold">
                            {trimEnd.toFixed(1)}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={videoDuration}
                          step="0.1"
                          value={trimEnd}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setTrimEnd(Math.max(value, trimStart + 0.1));
                            if (videoRef.current) {
                              videoRef.current.currentTime = value;
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = trimStart;
                            }
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Preview Start
                        </button>
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = trimEnd - 0.5;
                            }
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Preview End
                        </button>
                      </div>

                      <button
                        onClick={trimVideo}
                        disabled={isProcessing}
                        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        <Scissors className="w-5 h-5" />
                        {isProcessing ? 'Trimming...' : 'Apply Trim'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setTrimStart(0);
                          setTrimEnd(videoDuration);
                          if (videoRef.current) {
                            videoRef.current.currentTime = 0;
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Reset Trim
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-5 h-5" />
            {isProcessing ? 'Saving...' : 'Save & Use'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaEditor;
