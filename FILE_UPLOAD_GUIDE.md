# File Upload Support Guide

## Supported File Types

The messaging system now supports uploading the following file types:

### 1. **Images**
- Formats: JPEG, PNG, WebP, GIF, BMP, etc.
- Auto-optimized to WebP format for better performance
- Max size: 50MB
- Message type: `image`

### 2. **Videos**
- Formats: MP4, WebM, AVI, MOV, MKV, FLV, etc.
- Max size: 50MB
- Message type: `video`
- Stored with original format

### 3. **Audio Files**
- Formats: MP3, WAV, AAC, FLAC, OGG, M4A, etc.
- Max size: 50MB
- Message type: `audio`
- Perfect for voice notes and music clips

### 4. **Documents**
- Formats: PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT, ZIP, RAR, 7Z, etc.
- Max size: 50MB
- Message type: `document`
- Original format preserved

## Backend Changes

### Message Model Updates
The `Message` schema now includes:
- `message_type`: Enum of ["text", "image", "video", "audio", "document", "voice"]
- `message_url`: URL of uploaded file
- `file_name`: Original filename
- `file_size`: File size in bytes
- `file_type`: MIME type (e.g., 'video/mp4', 'audio/mpeg')

### API Endpoint: `/api/message/send`

**Request Format:**
```javascript
{
  to_user_id: "user_id",
  text: "Optional message text",
  file: <File Object> // Any file type
}
```

**Response Format:**
```javascript
{
  success: true,
  message: {
    _id: "message_id",
    from_user_id: "user_id",
    to_user_id: "recipient_id",
    text: "optional text",
    message_type: "video", // or image, audio, document
    message_url: "https://...",
    file_name: "video.mp4",
    file_size: 1024000,
    file_type: "video/mp4",
    createdAt: "2024-...",
    updatedAt: "2024-..."
  }
}
```

## Frontend Implementation

### Sending Files

```javascript
const formData = new FormData();
formData.append('to_user_id', recipientId);
formData.append('text', 'Check this out!');
formData.append('file', fileInputElement.files[0]); // Can be any file type

const response = await fetch('/api/message/send', {
  method: 'POST',
  body: formData
  // No Content-Type header - browser will set it with boundary
});
```

### Handling Different File Types

```javascript
const handleFileDisplay = (message) => {
  switch(message.message_type) {
    case 'image':
      return <img src={message.message_url} />;
    case 'video':
      return <video src={message.message_url} controls />;
    case 'audio':
      return <audio src={message.message_url} controls />;
    case 'document':
      return (
        <a href={message.message_url} download={message.file_name}>
          📄 {message.file_name}
        </a>
      );
    case 'text':
    default:
      return <p>{message.text}</p>;
  }
};
```

## File Size Limits

- Current limit: **50MB per file**
- To change: Edit `/server/configs/multer.js`

## Storage

All files are uploaded to **ImageKit** for reliable CDN delivery and storage.

## Error Handling

- Invalid field names are now handled gracefully
- Unsupported file types are categorized as "document"
- Temp files are automatically cleaned up after upload
- Failed uploads return proper error messages

## Performance Notes

- Images are automatically compressed and converted to WebP
- Video and audio files maintain original quality
- Documents are stored as-is
- All files are delivered via CDN for faster loading
