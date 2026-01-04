# Media Messaging Guide

## Overview
The messaging system now fully supports sending and receiving all types of media files with custom players and handlers.

## Supported File Types

### 1. **Images** 
- Formats: JPEG, PNG, WebP, GIF, BMP
- Display: Thumbnail preview
- Auto-optimized to WebP

### 2. **Videos** 
- Formats: MP4, WebM, AVI, MOV, MKV, FLV
- Display: Custom VideoPlayer with controls
- Features: Play/Pause, Seek, Volume, Skip 10s, Fullscreen

### 3. **Audio/Voice Notes**
- Formats: MP3, WAV, AAC, FLAC, OGG, M4A, WebM
- Display: Custom AudioPlayer with controls
- Features: Play/Pause, Seek, Volume, Skip 10s, Time display

### 4. **Documents**
- Formats: PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT, ZIP, RAR, 7Z
- Display: Download link with file icon
- Shows file name and size

## Frontend Components

### AudioPlayer (`client/src/components/AudioPlayer.jsx`)
- Custom audio player UI
- Time display and progress bar
- Volume control
- Skip 10s backward/forward
- Play/Pause controls

### VideoPlayer (`client/src/components/VideoPlayer.jsx`)
- Custom video player UI
- Fullscreen support
- Time display and progress bar
- Volume control
- Skip 10s backward/forward
- Play/Pause controls

## How It Works

### Sending Files
```javascript
// File input accepts all types
<input 
  type="file"
  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
/>

// Send via sendMessage function
const formData = new FormData();
formData.append('to_user_id', userId);
formData.append('text', 'Optional message');
formData.append('file', fileInputElement.files[0]);

await api.post('/api/message/send', formData);
```

### Receiving Files
Files are automatically detected by MIME type and rendered with appropriate player:

```javascript
{message.message_type === "video" && <VideoPlayer src={...} />}
{message.message_type === "audio" && <AudioPlayer src={...} />}
{message.message_type === "image" && <img src={...} />}
{message.message_type === "document" && <a download href={...} />}
```

## Backend Processing

### File Type Detection
The backend automatically detects file types based on MIME type:
- `image/*` → `image`
- `video/*` → `video`
- `audio/*` → `audio`
- Other types → `document`

### Message Fields
```javascript
{
  _id: "message_id",
  from_user_id: "user_id",
  to_user_id: "recipient_id",
  message_type: "video", // or image, audio, document, voice
  message_url: "https://...", // URL from ImageKit
  file_name: "video.mp4",
  file_size: 1024000, // in bytes
  file_type: "video/mp4", // MIME type
  text: "Optional message",
  createdAt: "...",
  updatedAt: "..."
}
```

## File Size Limits
- Current limit: **50MB per file**
- Change in: `server/configs/multer.js`

## Storage
All files are uploaded to **ImageKit** for CDN delivery and reliable storage.

## UI/UX Features

### AudioPlayer
- 🎵 File name display
- ⏱️ Current time / Total duration
- 📊 Progress bar with seek
- 🔊 Volume control (0-100%)
- ⏩ Skip forward 10s
- ⏪ Skip backward 10s
- ▶️ Play/Pause toggle
- Gradient background (purple theme)

### VideoPlayer
- 🎬 File name display
- ⏱️ Current time / Total duration
- 📊 Progress bar with seek
- 🔊 Volume control (0-100%)
- ⏩ Skip forward 10s
- ⏪ Skip backward 10s
- ▶️ Play/Pause toggle
- 🖥️ Fullscreen support
- Black theme with red accent

## Error Handling
- Files that fail to upload show error toast
- Network errors trigger NoInternetError page
- Unsupported formats are categorized as documents

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Video: H.264 codec
- Audio: AAC, MP3, Opus codecs
- HTML5 media player support required
