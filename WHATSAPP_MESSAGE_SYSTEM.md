# WhatsApp-Style Message System Implementation

## Overview
This document explains how the message delivery and read receipts work in the Chirp application, following the WhatsApp message status pattern.

## Message Status Flow

### 1. **Sent Status (Single Gray Checkmark ✓)**
- **When**: Immediately when the sender sends a message
- **What happens**:
  - Message is saved to database with `sent: true`
  - Single gray checkmark appears on sender's screen
  - Message is displayed in chat

### 2. **Delivered Status (Double Gray Checkmark ✓✓)**
- **When**: Message reaches the recipient's device
- **Scenarios**:
  
  **A. Recipient is online when message is sent:**
  - Message is marked `delivered: true` immediately
  - Backend broadcasts delivery status to sender via SSE
  - Sender sees double gray checkmarks instantly
  
  **B. Recipient is offline when message is sent:**
  - Message stays with single checkmark (sent only)
  - When recipient comes online:
    - All undelivered messages are automatically marked as `delivered: true`
    - Backend broadcasts delivery status for each message to senders
    - Senders see checkmarks change from single to double gray

### 3. **Read Status (Double Green Checkmark ✓✓)**
- **When**: Recipient opens the chat and views the messages
- **What happens**:
  - User clicks on Message button in Connections page
  - Chat.jsx calls `markMessagesAsRead` API endpoint
  - Backend updates messages with `read: true, read_at: timestamp`
  - Backend broadcasts read status to sender via SSE
  - Sender sees checkmarks change from double gray to double green

## Technical Implementation

### Backend (Server-Side)

#### 1. **Message Schema** (`server/models/Message.js`)
```javascript
{
  sent: Boolean,          // Message sent to server
  delivered: Boolean,     // Message delivered to recipient
  read: Boolean,          // Message read by recipient
  delivered_at: Date,     // When delivered
  read_at: Date          // When read
}
```

#### 2. **Sending Messages** (`messageController.js - sendMessage`)
```javascript
// Check if recipient is online
const isRecipientOnline = connections[to_user_id] && connections[to_user_id].writable;

// Create message with appropriate status
const message = await Message.create({
  sent: true,
  delivered: isRecipientOnline,  // Auto-deliver if online
  delivered_at: isRecipientOnline ? new Date() : null
});

// If recipient is online, broadcast delivery status to sender
if (isRecipientOnline && connections[senderId]) {
  const deliveryUpdate = {
    type: 'messageStatus',
    messageId: message._id,
    status: 'delivered',
    timestamp: new Date().toISOString()
  };
  connections[senderId].write(`data: ${JSON.stringify(deliveryUpdate)}\n\n`);
}
```

#### 3. **Auto-Delivery on Connect** (`messageController.js - sseController`)
```javascript
// When user establishes SSE connection
const deliveryResult = await Message.updateMany(
  { to_user_id: userId, delivered: false, is_deleted: false },
  { delivered: true, delivered_at: new Date() }
);

// Notify senders about deliveries
if (deliveryResult.modifiedCount > 0) {
  const updatedMessages = await Message.find({
    to_user_id: userId,
    delivered: true,
    delivered_at: { $gte: new Date(Date.now() - 5000) }
  });
  
  updatedMessages.forEach(msg => {
    const senderId = msg.from_user_id || msg.sender_id;
    if (connections[senderId]) {
      const deliveryUpdate = {
        type: 'messageStatus',
        messageId: msg._id,
        status: 'delivered'
      };
      connections[senderId].write(`data: ${JSON.stringify(deliveryUpdate)}\n\n`);
    }
  });
}
```

#### 4. **Read Receipts** (`messageController.js - markMessagesAsRead`)
```javascript
// Mark messages as read
const result = await Message.updateMany(
  { from_user_id: from_user_id, to_user_id: userId, read: false },
  { read: true, seen: true, read_at: new Date() }
);

// Broadcast read status to sender
if (result.modifiedCount > 0 && connections[from_user_id]) {
  const readMessages = await Message.find({
    from_user_id: from_user_id,
    to_user_id: userId,
    read: true,
    read_at: { $gte: new Date(Date.now() - 5000) }
  });
  
  readMessages.forEach(msg => {
    const readUpdate = {
      type: 'messageStatus',
      messageId: msg._id,
      status: 'read'
    };
    connections[from_user_id].write(`data: ${JSON.stringify(readUpdate)}\n\n`);
  });
}
```

### Frontend (Client-Side)

#### 1. **SSE Message Status Handler** (`App.jsx`)
```javascript
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Handle message status updates
  if (data.type === 'messageStatus') {
    console.log('Message status update:', data.messageId, data.status);
    window.dispatchEvent(new CustomEvent('messageStatusChange', { detail: data }));
    return;
  }
  
  // ... other handlers
}
```

#### 2. **Chat Component Listener** (`Chat.jsx`)
```javascript
// Listen for status changes
useEffect(() => {
  const handleMessageStatusChange = (event) => {
    const { messageId, status } = event.detail;
    dispatch(updateMessageStatus({ messageId, status }));
  };

  window.addEventListener('messageStatusChange', handleMessageStatusChange);
  return () => window.removeEventListener('messageStatusChange', handleMessageStatusChange);
}, [dispatch]);

// Mark messages as read when opening chat
useEffect(() => {
  const markAsRead = async () => {
    try {
      const token = await getToken();
      await api.post('/api/message/mark-read', 
        { from_user_id: userId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  if (user && userId) {
    markAsRead();
  }
}, [userId, user, getToken]);
```

#### 3. **Redux State Management** (`messagesSlice.js`)
```javascript
updateMessageStatus: (state, action) => {
  const { messageId, status } = action.payload;
  const messageIndex = state.messages.findIndex(msg => msg._id === messageId);
  
  if (messageIndex !== -1) {
    const message = state.messages[messageIndex];
    
    if (status === 'delivered') {
      message.delivered = true;
      message.delivered_at = new Date().toISOString();
    } else if (status === 'read') {
      message.read = true;
      message.read_at = new Date().toISOString();
      message.delivered = true;  // Read implies delivered
    }
  }
}
```

#### 4. **Message Status Display** (`MessageStatus.jsx`)
```javascript
const MessageStatus = ({ message }) => {
  // Determine actual status (priority: read > delivered > sent)
  const actualStatus = message.read 
    ? 'read' 
    : message.delivered 
      ? 'delivered' 
      : message.sent 
        ? 'sent' 
        : 'pending';

  return (
    <div className="flex items-center gap-1 text-xs">
      {actualStatus === 'pending' && <Clock className="w-3 h-3" />}
      {actualStatus === 'sent' && <SingleCheck />}  {/* Gray */}
      {actualStatus === 'delivered' && <DoubleCheck color="gray" />}
      {actualStatus === 'read' && <DoubleCheck color="green" />}
    </div>
  );
};
```

## Real-Time Communication Flow

### Scenario 1: Both Users Online
```
Sender                    Server                    Recipient
  |                         |                         |
  |--Send Message---------->|                         |
  |<-sent: true-------------|                         |
  |  (Single ✓)             |                         |
  |                         |--Message--------------->|
  |                         |<-delivered: true--------|
  |<-status: delivered------|                         |
  |  (Double ✓✓ gray)       |                         |
  |                         |                         |
  |                         |<-User opens chat--------|
  |                         |--Mark as read---------->|
  |<-status: read-----------|                         |
  |  (Double ✓✓ green)      |                         |
```

### Scenario 2: Recipient Offline
```
Sender                    Server                    Recipient
  |                         |                         |
  |--Send Message---------->|                         |
  |<-sent: true-------------|                         |
  |  (Single ✓)             |                         |
  |                         |    (Recipient offline)  |
  |                         |                         |
  |                         |<-Recipient connects-----|
  |                         |--Auto-mark delivered--->|
  |<-status: delivered------|                         |
  |  (Double ✓✓ gray)       |                         |
  |                         |                         |
  |                         |<-Opens chat-------------|
  |<-status: read-----------|                         |
  |  (Double ✓✓ green)      |                         |
```

## Key Features

### ✅ Implemented
1. **Single gray checkmark** - Message sent to server
2. **Double gray checkmarks** - Message delivered to recipient
3. **Double green checkmarks** - Message read by recipient
4. **Real-time status updates** - Via Server-Sent Events (SSE)
5. **Auto-delivery marking** - When recipient comes online
6. **Read-only on open** - Messages marked read when chat is opened
7. **Unread message counts** - Badge on connection cards
8. **Persistent status** - Status saved in database

### 🎯 WhatsApp Parity Features
- Messages only marked as read when user opens the chat
- Delivered status updates when user comes online
- Real-time checkmark updates without page refresh
- Green color for sender bubbles (#dcf8c6)
- Proper message alignment (sender right, receiver left)
- Status persists across sessions

## API Endpoints

### 1. Send Message
```
POST /api/message/send
Body: { to_user_id, text, file }
Response: { success, message }
```

### 2. Get Messages
```
POST /api/message/get
Body: { to_user_id }
Response: { success, messages }
```

### 3. Mark Messages as Read
```
POST /api/message/mark-read
Body: { from_user_id }
Response: { success, count }
```

### 4. Get Unread Counts
```
GET /api/message/unread-counts
Response: { success, counts: { userId: count }, total }
```

### 5. SSE Connection
```
GET /api/message/:userId
Response: Server-Sent Events stream
Events: message, messageStatus, userStatus, onlineUsersList
```

## Testing the System

### Test 1: Online Delivery
1. Have two users logged in
2. User A sends message to User B
3. **Expected**: User A sees double gray checkmarks immediately
4. User B opens chat
5. **Expected**: User A sees double green checkmarks

### Test 2: Offline Delivery
1. User A is online, User B is offline
2. User A sends message to User B
3. **Expected**: User A sees single gray checkmark
4. User B comes online
5. **Expected**: User A sees checkmark change to double gray
6. User B opens chat
7. **Expected**: User A sees checkmarks turn green

### Test 3: Multiple Messages
1. Send multiple messages while recipient is offline
2. Recipient comes online
3. **Expected**: All messages show double gray checkmarks
4. Recipient opens chat
5. **Expected**: All unread messages turn green

## Troubleshooting

### Checkmarks not updating
- Check browser console for SSE connection
- Verify backend `connections` object has both users
- Check that `messageStatus` events are being sent

### Messages always showing single checkmark
- Verify recipient's SSE connection is established
- Check `delivered` field in database
- Ensure `isRecipientOnline` logic is correct

### Read receipts not working
- Confirm `markMessagesAsRead` endpoint is being called
- Check SSE broadcast to sender
- Verify Redux state is updating

## Future Enhancements
- [ ] Group message read receipts (show count of readers)
- [ ] Typing indicators
- [ ] Message forwarding with original status preservation
- [ ] Bulk status updates optimization
- [ ] Read receipt toggle (privacy setting)
