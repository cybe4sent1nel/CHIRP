# Account Settings & Safety Features Implementation

## Overview
Complete implementation of a dedicated Account Settings page with WhatsApp-style privacy features and comprehensive safety/moderation APIs.

## Frontend Components

### 1. Settings Page (`client/src/pages/Settings.jsx`)
**Features:**
- Three-tab interface: Privacy & Safety, Notifications, Account
- WhatsApp-like DM privacy controls
- Online status and last seen visibility toggles
- Profile visit permissions
- Comment and tagging restrictions
- Comprehensive notification preferences
- Two-factor authentication option
- Private account toggle
- Account deletion and logout

**Usage:**
```jsx
import Settings from '@/pages/Settings'

// Add to route
<Route path="/settings" element={<Settings />} />
```

### 2. Message Status Indicator (`client/src/components/MessageStatus.jsx`)
**Features:**
- Single check (sent) - gray
- Double check (delivered) - gray
- Double blue check (read) - blue
- Clock icon (pending) - gray

**Usage:**
```jsx
<MessageStatus message={message} />
```

### 3. Message Actions Menu (`client/src/components/MessageActions.jsx`)
**Features:**
- Delete for me
- Delete for everyone (sender only)
- Message info (shows who read/delivered)
- Report user (with reason selection)
- Block user
- Context menu with dropdown

**Supported Report Reasons:**
- Harassment
- Hate Speech
- False Information
- Spam
- Adult Content
- Violence
- Other

**Usage:**
```jsx
<MessageActions 
  message={message} 
  isOwn={isOwnMessage}
  onDelete={handleMessageDeleted}
  onReport={handleUserReported}
  onBlock={handleUserBlocked}
/>
```

### 4. Chat Management (`client/src/components/ChatManagement.jsx`)
**Features:**
- Clear entire chat
- Confirmation dialog
- Permanent deletion warning

**Usage:**
```jsx
<ChatManagement 
  chatUserId={userId}
  onChatCleared={handleChatCleared}
/>
```

## Backend APIs

### Safety Routes (`/api/safety/*`)

#### Block/Unblock Users
```
POST /api/safety/block
Body: { blockedUserId: string }

POST /api/safety/unblock
Body: { blockedUserId: string }

GET /api/safety/blocked-users
Returns: { blockedUsers: User[] }
```

#### Reporting
```
POST /api/safety/report/user
Body: { 
  reportedUserId: string,
  reason: 'harassment' | 'hate_speech' | 'false_information' | 'spam' | 'adult_content' | 'violence' | 'other',
  description?: string
}

POST /api/safety/report/post
Body: { 
  postId: string,
  reason: string,
  description?: string
}
```

#### Message Management
```
DELETE /api/safety/message/delete-for-me
Body: { messageId: string }

DELETE /api/safety/message/delete-for-everyone
Body: { messageId: string }
Note: Only sender can use this

DELETE /api/safety/chat/clear
Body: { otherUserId: string }

POST /api/safety/message/info
Body: { messageId: string }
Returns: {
  sent_at: Date,
  delivered_to: User[],
  read_by: User[]
}
Note: Only sender can view
```

#### Settings & Account
```
POST /api/user/settings
Body: {
  privacy: {
    dmFromEveryone: boolean,
    allowMessagesFromNonConnections: boolean,
    showOnlineStatus: boolean,
    showLastSeen: boolean,
    allowProfileVisits: boolean,
    allowComments: boolean,
    allowTagging: boolean
  },
  notifications: {
    messageNotifications: boolean,
    mentionNotifications: boolean,
    likeNotifications: boolean,
    commentNotifications: boolean,
    followNotifications: boolean,
    emailNotifications: boolean,
    pushNotifications: boolean
  },
  account: {
    twoFactorAuth: boolean,
    privateAccount: boolean,
    allowAIFeatures: boolean
  }
}

DELETE /api/user/account
Note: Permanently deletes user account and all associated data
```

## Database Models

### User Model Updates
```javascript
// Added to User schema:
privacy_settings: {
  dmFromEveryone: Boolean,
  allowMessagesFromNonConnections: Boolean,
  showOnlineStatus: Boolean,
  showLastSeen: Boolean,
  allowProfileVisits: Boolean,
  allowComments: Boolean,
  allowTagging: Boolean
},
notification_settings: {
  messageNotifications: Boolean,
  mentionNotifications: Boolean,
  likeNotifications: Boolean,
  commentNotifications: Boolean,
  followNotifications: Boolean,
  emailNotifications: Boolean,
  pushNotifications: Boolean
},
account_settings: {
  twoFactorAuth: Boolean,
  privateAccount: Boolean,
  allowAIFeatures: Boolean
}
```

### Message Model Updates
```javascript
// Added fields for WhatsApp-style features:
sender_id: ObjectId,        // Replaces from_user_id
recipient_id: ObjectId,     // Replaces to_user_id
sent: Boolean,              // Message sent
delivered: Boolean,         // Message delivered
read: Boolean,              // Message read
delivered_at: Date,         // When delivered
read_at: Date,             // When read
read_by: [ObjectId],       // Who read it
delivered_to: [ObjectId],  // Who received it
is_deleted: Boolean,       // Deleted for everyone
deleted_at: Date,          // When deleted
deleted_by: [ObjectId]     // Who deleted for themselves
```

### BlockList Model (New)
```javascript
{
  user_id: ObjectId,           // User doing the blocking
  blocked_user_id: ObjectId,   // User being blocked
  created_at: Date
}
```

### Report Model (New)
```javascript
{
  reporter_id: ObjectId,
  reported_user_id?: ObjectId,
  reported_post_id?: ObjectId,
  type: 'user' | 'post',
  reason: String,
  description?: String,
  status: 'pending' | 'reviewed' | 'resolved',
  created_at: Date
}
```

## Integration Guide

### 1. Update Message Display Component
```jsx
import MessageStatus from '@/components/MessageStatus'
import MessageActions from '@/components/MessageActions'

function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-xs bg-white rounded-lg p-3 shadow">
        <p>{message.text}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
          {isOwn && <MessageStatus message={message} />}
          <MessageActions message={message} isOwn={isOwn} />
        </div>
      </div>
    </div>
  )
}
```

### 2. Update Chat Screen
```jsx
import ChatManagement from '@/components/ChatManagement'

function ChatScreen({ chatUserId }) {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        {/* Messages */}
      </div>
      <ChatManagement 
        chatUserId={chatUserId}
        onChatCleared={() => {
          // Refresh messages
        }}
      />
      <MessageInput />
    </div>
  )
}
```

### 3. Add Settings Link to Navigation
```jsx
<Link to="/settings" className="...">
  <SettingsIcon />
  Settings
</Link>
```

## API Usage Examples

### Block a User
```javascript
const blockUser = async (userId) => {
  const response = await api.post('/api/safety/block', {
    blockedUserId: userId
  });
  if (response.data.success) {
    toast.success('User blocked');
  }
};
```

### Report a Post
```javascript
const reportPost = async (postId, reason) => {
  const response = await api.post('/api/safety/report/post', {
    postId,
    reason,
    description: 'This is inappropriate content'
  });
  if (response.data.success) {
    toast.success('Post reported successfully');
  }
};
```

### Delete Message for Everyone
```javascript
const deleteMessageForEveryone = async (messageId) => {
  const response = await api.delete('/api/safety/message/delete-for-everyone', {
    data: { messageId }
  });
  if (response.data.success) {
    toast.success('Message deleted for everyone');
  }
};
```

### Get Message Info
```javascript
const getMessageInfo = async (messageId) => {
  const response = await api.post('/api/safety/message/info', {
    messageId
  });
  if (response.data.success) {
    const { sent_at, delivered_to, read_by } = response.data.messageInfo;
    console.log('Delivered to:', delivered_to);
    console.log('Read by:', read_by);
  }
};
```

### Update Settings
```javascript
const updateSettings = async (settings) => {
  const response = await api.post('/api/user/settings', {
    privacy: {
      dmFromEveryone: true,
      allowMessagesFromNonConnections: false,
      showOnlineStatus: false,
      // ... other settings
    },
    notifications: { /* ... */ },
    account: { /* ... */ }
  });
  if (response.data.success) {
    toast.success('Settings updated');
  }
};
```

## Security Considerations

1. **Authentication:** All safety endpoints require authentication via `protect` middleware
2. **Authorization:** 
   - Users can only block/report others
   - Only senders can delete messages for everyone
   - Only senders can view message info
3. **Data Deletion:** Deleting account also deletes all associated data
4. **Rate Limiting:** Consider adding rate limiting for reports to prevent spam

## Features Summary

✅ Dedicated Account Settings page with WhatsApp-like privacy controls
✅ Message status indicators (sent, delivered, read)
✅ Message info showing who read/delivered
✅ Delete message for me / for everyone
✅ Clear entire chat
✅ Block/unblock users
✅ Report users with detailed reasons
✅ Report posts
✅ Notification preferences
✅ Privacy settings (DM, online status, profile visibility)
✅ Account security settings
✅ Account deletion

## Pending Tasks

- [ ] Add email notifications system
- [ ] Implement two-factor authentication
- [ ] Add push notifications
- [ ] Create admin panel for reports review
- [ ] Add message search functionality
- [ ] Implement message pinning
- [ ] Add read receipts sync via WebSocket
