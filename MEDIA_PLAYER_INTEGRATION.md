# Media Player Integration Guide

## Overview
AudioPlayer and VideoPlayer components have been integrated across all sections of the application: Messages, Posts, and Chirp Channels.

## Components Used

### AudioPlayer.jsx
Custom audio player with:
- Play/Pause controls
- Progress bar with seek
- Volume control
- Skip 10s forward/backward
- Time display
- Purple gradient theme

### VideoPlayer.jsx
Custom video player with:
- Play/Pause controls
- Progress bar with seek
- Volume control
- Skip 10s forward/backward
- Time display
- Fullscreen support
- Black theme with red accent

## Integration Across Features

### 1. Direct Messages (ChatBox.jsx) ✅
**Supported Media Types:**
- 🖼️ Images - Inline image display
- 🎬 Videos - VideoPlayer component
- 🎵 Audio/Voice Notes - AudioPlayer component
- 📄 Documents - Download link with file info
- 📝 Text - Regular text messages

**Implementation:**
```javascript
import AudioPlayer from "../components/AudioPlayer";
import VideoPlayer from "../components/VideoPlayer";

{message.message_type === "video" && <VideoPlayer src={...} />}
{message.message_type === "audio" && <AudioPlayer src={...} />}
{message.message_type === "voice" && <AudioPlayer src={...} />}
```

### 2. Posts (PostCard.jsx) ✅
**Supported Media Types:**
- 🖼️ Images - Grid layout (1-4 images)
- 🎬 Videos - VideoPlayer component
- 🎵 Audio - AudioPlayer component

**Implementation:**
```javascript
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';

{post.image_urls?.map(img => <img src={img} />)}
{post.video_urls?.map(video => <VideoPlayer src={video} />)}
{post.audio_urls?.map(audio => <AudioPlayer src={audio} />)}
```

### 3. Chirp Channels (ChannelDetail.jsx) ✅
**Supported Media Types:**
- 🎵 Voice Notes - AudioPlayer component
- 🎬 Videos - VideoPlayer component
- 🖼️ Images - Inline image display
- 🎵 Audio Files - AudioPlayer component
- 📄 Documents - Download link with file info
- 📝 Text - Regular text messages

**Implementation:**
```javascript
import AudioPlayer from "../components/AudioPlayer";
import VideoPlayer from "../components/VideoPlayer";

{msg.message_type === "voice" && <AudioPlayer src={msg.content} />}
{msg.message_type === "video" && <VideoPlayer src={msg.content} />}
{msg.message_type === "audio" && <AudioPlayer src={msg.content} />}
{msg.message_type === "image" && <img src={msg.content} />}
{msg.message_type === "document" && <a download href={msg.content} />}
```

## Media Type Detection

The backend automatically detects file types based on MIME type:

| MIME Type | Message Type |
|-----------|--------------|
| `image/*` | `image` |
| `video/*` | `video` |
| `audio/*` | `audio` |
| Other | `document` |

## File Storage
All media files are uploaded to **ImageKit** CDN for:
- Global content delivery
- Reliable storage
- Automatic optimization (images → WebP)

## Data Structure

### Message Object
```javascript
{
  message_type: "video", // text, image, video, audio, document, voice
  message_url: "https://...", // File URL
  file_name: "video.mp4",
  file_size: 1024000, // bytes
  file_type: "video/mp4", // MIME type
  content: "text message or media URL"
}
```

### Post Object
```javascript
{
  image_urls: ["url1", "url2"],
  video_urls: ["video_url1"],
  audio_urls: ["audio_url1"]
}
```

### Channel Message Object
```javascript
{
  message_type: "voice",
  content: "media_url_or_text",
  file_name: "voice.webm"
}
```

## Features Summary

### Audio Player Features
✅ Play/Pause toggle
✅ Progress bar with seek
✅ Current time / Total duration display
✅ Volume control (0-100%)
✅ Skip backward 10 seconds
✅ Skip forward 10 seconds
✅ Responsive design
✅ Purple gradient theme

### Video Player Features
✅ Play/Pause toggle
✅ Progress bar with seek
✅ Current time / Total duration display
✅ Volume control (0-100%)
✅ Skip backward 10 seconds
✅ Skip forward 10 seconds
✅ Fullscreen support
✅ Click to play/pause on video
✅ Responsive design
✅ Black theme with red accent

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- HTML5 media player support required
- Video codecs: H.264
- Audio codecs: AAC, MP3, Opus

## File Size Limits
- Current limit: **50MB per file**
- Configure in: `server/configs/multer.js`

## Error Handling
- Failed uploads show error toast
- Network errors trigger NoInternetError page
- Unsupported formats are categorized as documents
- Graceful fallback for missing URLs

## Usage Example

### Sending Media in Chat
```javascript
const formData = new FormData();
formData.append('to_user_id', userId);
formData.append('text', 'Check this out!');
formData.append('file', fileInput.files[0]); // Any file type

await api.post('/api/message/send', formData);
```

### Rendering Media
```javascript
// AudioPlayer
<AudioPlayer 
  src="https://example.com/audio.mp3"
  fileName="My Song.mp3"
/>

// VideoPlayer
<VideoPlayer 
  src="https://example.com/video.mp4"
  fileName="My Video.mp4"
/>
```

## Future Enhancements
- [ ] Download media button
- [ ] Share media functionality
- [ ] Media thumbnails/previews
- [ ] Streaming for large videos
- [ ] Playback speed control
- [ ] Playlist support for channels
- [ ] Media reactions/comments
