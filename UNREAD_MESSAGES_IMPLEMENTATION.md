# Unread Messages Implementation

## Overview
Implemented a complete unread message tracking system that only marks messages as read when users explicitly open a chat, not when they simply view the messages list.

## Backend Changes

### 1. Message Controller (`server/controllers/messageController.js`)

#### Removed Auto-Read Marking
- **Before**: Messages were automatically marked as read when fetching chat messages
- **After**: Messages remain unread until explicitly marked

#### New Endpoints Added

**`POST /api/message/mark-read`**
- Marks all messages from a specific user as read
- Only called when user opens a chat conversation
- Updates `read`, `seen`, and `read_at` fields

**`GET /api/message/unread-counts`**
- Returns unread message counts per user
- Aggregates unread messages by sender
- Returns both individual counts and total count

### 2. Routes (`server/routes/messageRoutes.js`)
```javascript
messageRouter.post("/mark-read", protect, markMessagesAsRead);
messageRouter.get("/unread-counts", protect, getUnreadCounts);
```

## Frontend Changes

### 1. Chat Page (`client/src/pages/Chat.jsx`)
- Added `markAsRead()` function that calls when component mounts
- Messages are marked as read only when user opens the chat
- Uses `useEffect` to trigger on `userId` change

### 2. Connections Page (`client/src/pages/Connections.jsx`)
- Fetches unread counts on component mount
- Displays unread badge on "Message" button for each connection
- Badge shows count of unread messages from that user

### 3. Messages Page (`client/src/pages/Messages.jsx`)
- Shows total unread count next to "Messages" title
- Displays individual unread badges on each user's Message button
- Badges are red with white text for high visibility
- Auto-refreshes when connections list updates

## Features

### Visual Indicators
1. **Connection Cards**: Red badge on Message button with unread count
2. **Messages Sidebar**: 
   - Total unread count badge next to page title
   - Individual unread badges on each user's Message button
3. **Real-time Updates**: Counts update when new messages arrive

### User Experience
- Messages stay unread until user clicks "Message" button
- Clear visual feedback with red badges
- Unread counts persist across page refreshes
- Counts update immediately after reading messages

## API Response Format

### Unread Counts Response
```json
{
  "success": true,
  "unreadCounts": {
    "user_id_1": 5,
    "user_id_2": 3
  },
  "total": 8
}
```

### Mark as Read Response
```json
{
  "success": true,
  "message": "Messages marked as read",
  "count": 5
}
```

## Database Fields Used
- `read`: Boolean flag for read status
- `read_at`: Timestamp when message was read
- `seen`: Boolean flag for seen status (legacy support)
- `from_user_id`: Sender ID for aggregation
- `to_user_id`: Recipient ID for filtering

## Benefits
1. **Accurate Read Tracking**: Messages only marked read when actually viewed
2. **Better UX**: Users know exactly how many unread messages they have
3. **Privacy**: Senders can't tell if recipient opened messages list vs. actual chat
4. **Performance**: Efficient aggregation queries for counting unread messages
