import { useState } from 'react';
import { Smile, ImageIcon, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';

// Initialize Giphy with a free API key - you'll need to get one from https://developers.giphy.com/
const gf = new GiphyFetch('YOUR_GIPHY_API_KEY'); // Replace with actual API key

const EmojiGifPicker = ({ onEmojiSelect, onGifSelect }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('emoji'); // 'emoji', 'gif', or 'sticker'
  const [gifSearchTerm, setGifSearchTerm] = useState('');
  const [stickerSearchTerm, setStickerSearchTerm] = useState('');

  // Fetch GIFs based on search or trending
  const fetchGifs = (offset) => {
    if (gifSearchTerm) {
      return gf.search(gifSearchTerm, { offset, limit: 10 });
    }
    return gf.trending({ offset, limit: 10 });
  };

  // Fetch Stickers based on search or trending
  const fetchStickers = (offset) => {
    if (stickerSearchTerm) {
      return gf.search(stickerSearchTerm, { offset, limit: 10, type: 'stickers' });
    }
    return gf.trending({ offset, limit: 10, type: 'stickers' });
  };

  const handleEmojiClick = (emojiData) => {
    onEmojiSelect(emojiData.emoji);
    setShowPicker(false);
  };

  const handleGifClick = (gif, e) => {
    e.preventDefault();
    const gifUrl = gif.images.fixed_height.url;
    onGifSelect(gifUrl);
    setShowPicker(false);
  };

  const handleStickerClick = (sticker, e) => {
    e.preventDefault();
    const stickerUrl = sticker.images.fixed_height.url;
    onGifSelect(stickerUrl); // Reuse the same handler as GIFs
    setShowPicker(false);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Emojis & GIFs"
      >
        <Smile className="w-6 h-6 text-gray-500 hover:text-gray-700" />
      </button>

      {/* Picker Modal */}
      {showPicker && (
        <div className="fixed bottom-20 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999]">
          {/* Header with tabs */}
          <div className="flex items-center justify-between border-b border-gray-200 p-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('emoji')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  activeTab === 'emoji'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                😊 Emoji
              </button>
              <button
                onClick={() => setActiveTab('sticker')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  activeTab === 'sticker'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🎨 Sticker
              </button>
              <button
                onClick={() => setActiveTab('gif')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  activeTab === 'gif'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🎬 GIF
              </button>
            </div>
            <button
              onClick={() => setShowPicker(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-2">
            {activeTab === 'emoji' && (
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={350}
                height={400}
                searchDisabled={false}
                skinTonesDisabled={false}
                previewConfig={{ showPreview: false }}
              />
            )}

            {activeTab === 'sticker' && (
              <div className="w-[350px] h-[400px] overflow-hidden flex flex-col">
                {/* Sticker Search */}
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search Stickers..."
                    value={stickerSearchTerm}
                    onChange={(e) => setStickerSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Sticker Grid */}
                <div className="flex-1 overflow-y-auto">
                  <Grid
                    key={stickerSearchTerm}
                    width={330}
                    columns={3}
                    fetchGifs={fetchStickers}
                    onGifClick={handleStickerClick}
                    hideAttribution={false}
                  />
                </div>
              </div>
            )}

            {activeTab === 'gif' && (
              <div className="w-[350px] h-[400px] overflow-hidden flex flex-col">
                {/* GIF Search */}
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search GIFs..."
                    value={gifSearchTerm}
                    onChange={(e) => setGifSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* GIF Grid */}
                <div className="flex-1 overflow-y-auto">
                  <Grid
                    key={gifSearchTerm}
                    width={330}
                    columns={2}
                    fetchGifs={fetchGifs}
                    onGifClick={handleGifClick}
                    hideAttribution={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiGifPicker;
