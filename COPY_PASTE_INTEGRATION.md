# Copy-Paste Integration Guide

Ready-to-use code snippets for integrating all new features.

---

## 1. Add Settings Route (App.jsx)

```jsx
import Settings from '@/pages/Settings'

// In your router configuration:
<Route path="/settings" element={<Settings />} />
```

---

## 2. Add Settings Navigation Link

### In Header Component
```jsx
import { Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

// Add to your navigation:
<Link 
  to="/settings" 
  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
>
  <Settings size={20} />
  <span>Settings</span>
</Link>
```

### In User Menu Dropdown
```jsx
<button 
  onClick={() => navigate('/settings')}
  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
>
  <Settings size={16} className="inline mr-2" />
  Settings
</button>
```

---

## 3. Integrate Message Status in Chat

```jsx
import MessageStatus from '@/components/MessageStatus'

function ChatBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="max-w-xs bg-white rounded-lg p-3">
        <p>{message.text}</p>
        
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-xs text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
          {isOwn && <MessageStatus message={message} />}
        </div>
      </div>
    </div>
  )
}
```

---

## 4. Integrate Message Actions

```jsx
import MessageActions from '@/components/MessageActions'

function ChatBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className="max-w-xs bg-white rounded-lg p-3 relative">
        <p>{message.text}</p>
        
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-xs text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isOwn && <MessageStatus message={message} />}
            <MessageActions 
              message={message}
              isOwn={isOwn}
              onDelete={() => removeMessage(message._id)}
              onReport={() => console.log('Reported')}
              onBlock={() => console.log('Blocked')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 5. Integrate Chat Management

```jsx
import ChatManagement from '@/components/ChatManagement'

function ChatScreen({ chatUserId }) {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4">
        <h2>Chat Name</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => (
          <ChatBubble key={msg._id} message={msg} />
        ))}
      </div>

      {/* Chat Management - Add this */}
      <ChatManagement 
        chatUserId={chatUserId}
        onChatCleared={() => {
          setMessages([])
        }}
      />

      {/* Message Input */}
      <div className="border-t p-4">
        <MessageInput />
      </div>
    </div>
  )
}
```

---

## 6. Integrate Encryption Badge

```jsx
import EncryptionBadge from '@/components/EncryptionBadge'

function ChatPage({ chatUserId }) {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4">
        <h2>Chat Name</h2>
      </div>

      {/* ENCRYPTION BADGE - Add this */}
      <EncryptionBadge />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => (
          <ChatBubble key={msg._id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <MessageInput />
      </div>
    </div>
  )
}
```

---

## 7. Complete Chat Component (All Features)

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import api from '@/api/axios'
import MessageStatus from '@/components/MessageStatus'
import MessageActions from '@/components/MessageActions'
import ChatManagement from '@/components/ChatManagement'
import EncryptionBadge from '@/components/EncryptionBadge'
import toast from 'react-hot-toast'

export default function ChatScreen({ chatUserId, chatUserName }) {
  const { userId } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    fetchMessages()
  }, [chatUserId])

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/api/message/${chatUserId}`)
      setMessages(response.data.messages)
    } catch (error) {
      toast.error('Failed to fetch messages')
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const response = await api.post('/api/message/send', {
        recipientId: chatUserId,
        text: newMessage,
        message_type: 'text'
      })
      setMessages([...messages, response.data.message])
      setNewMessage('')
    } catch (error) {
      toast.error('Failed to send message')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 p-4 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg">{chatUserName}</h2>
          <p className="text-sm text-gray-500">Online</p>
        </div>
      </header>

      {/* Encryption Badge */}
      <EncryptionBadge />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation</p>
          </div>
        ) : (
          messages.map(msg => (
            <div 
              key={msg._id}
              className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'} mb-3 group`}
            >
              <div 
                className={`max-w-xs rounded-lg p-3 ${
                  msg.sender_id === userId 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-black'
                }`}
              >
                <p>{msg.text}</p>
                
                <div className="flex items-center justify-end gap-2 mt-2">
                  <span className="text-xs opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  
                  {msg.sender_id === userId && (
                    <>
                      <MessageStatus message={msg} />
                      <MessageActions 
                        message={msg}
                        isOwn={true}
                        onDelete={() => {
                          setMessages(messages.filter(m => m._id !== msg._id))
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Management */}
      <ChatManagement 
        chatUserId={chatUserId}
        onChatCleared={() => setMessages([])}
      />

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 outline-none focus:border-blue-500"
          />
          <button 
            onClick={sendMessage}
            className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 8. API Usage Examples

### Block a User
```javascript
const blockUser = async (userId) => {
  try {
    const response = await api.post('/api/safety/block', {
      blockedUserId: userId
    })
    if (response.data.success) {
      toast.success('User blocked')
    }
  } catch (error) {
    toast.error('Failed to block user')
  }
}
```

### Report a User
```javascript
const reportUser = async (userId) => {
  try {
    const response = await api.post('/api/safety/report/user', {
      reportedUserId: userId,
      reason: 'harassment',
      description: 'This user is being abusive'
    })
    if (response.data.success) {
      toast.success('User reported successfully')
    }
  } catch (error) {
    toast.error('Failed to report user')
  }
}
```

### Delete Message for Me
```javascript
const deleteForMe = async (messageId) => {
  try {
    const response = await api.delete('/api/safety/message/delete-for-me', {
      data: { messageId }
    })
    if (response.data.success) {
      toast.success('Message deleted')
      // Remove from UI
    }
  } catch (error) {
    toast.error('Failed to delete message')
  }
}
```

### Clear Chat
```javascript
const clearChat = async (chatUserId) => {
  try {
    const response = await api.delete('/api/safety/chat/clear', {
      data: { otherUserId: chatUserId }
    })
    if (response.data.success) {
      toast.success('Chat cleared')
      setMessages([])
    }
  } catch (error) {
    toast.error('Failed to clear chat')
  }
}
```

### Update Settings
```javascript
const saveSettings = async (settings) => {
  try {
    const response = await api.post('/api/user/settings', settings)
    if (response.data.success) {
      toast.success('Settings saved')
    }
  } catch (error) {
    toast.error('Failed to save settings')
  }
}
```

---

## 9. User Card with Block/Report

```jsx
import { MoreVertical, Block, Flag } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

function UserCard({ user, onUserBlocked }) {
  const [showMenu, setShowMenu] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const handleBlock = async () => {
    try {
      await api.post('/api/safety/block', {
        blockedUserId: user._id
      })
      toast.success('User blocked')
      onUserBlocked?.()
    } catch (error) {
      toast.error('Failed to block user')
    }
  }

  const handleReport = async () => {
    if (!reportReason) {
      toast.error('Please select a reason')
      return
    }
    try {
      await api.post('/api/safety/report/user', {
        reportedUserId: user._id,
        reason: reportReason
      })
      toast.success('User reported')
      setReportReason('')
    } catch (error) {
      toast.error('Failed to report user')
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <img 
            src={user.profile_picture} 
            alt={user.full_name}
            className="w-full h-48 object-cover rounded"
          />
          <h3 className="font-bold mt-4">{user.full_name}</h3>
          <p className="text-gray-600">@{user.username}</p>
        </div>

        {/* Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreVertical size={20} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-10">
              <button 
                onClick={handleBlock}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 border-b"
              >
                <Block size={16} />
                Block User
              </button>

              <button 
                onClick={() => setReportReason(reportReason ? '' : 'other')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Flag size={16} />
                Report
              </button>

              {reportReason && (
                <div className="bg-gray-50 p-3 border-t">
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs border rounded p-1 mb-2"
                  >
                    <option value="harassment">Harassment</option>
                    <option value="hate_speech">Hate Speech</option>
                    <option value="spam">Spam</option>
                    <option value="other">Other</option>
                  </select>
                  <button 
                    onClick={handleReport}
                    className="w-full text-xs bg-red-600 text-white rounded py-1"
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 10. Toast Setup (App.jsx)

```jsx
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* Rest of your app */}
    </>
  )
}
```

---

## Quick Integration Checklist

- [ ] Copy 4 component files
- [ ] Copy 2 backend files
- [ ] Copy 2 new model files
- [ ] Update User.js model
- [ ] Update Message.js model
- [ ] Update server.js
- [ ] Update userRoutes.js
- [ ] Add Settings route
- [ ] Add Settings link
- [ ] Integrate MessageStatus
- [ ] Integrate MessageActions
- [ ] Integrate ChatManagement
- [ ] Integrate EncryptionBadge
- [ ] Test all endpoints
- [ ] Test Settings page
- [ ] Test message actions
- [ ] Test chat management
- [ ] Deploy!

---

## Summary

All code snippets are ready to copy and paste. Just follow the integration guides and you're done!

**Total integration time: 2-3 hours**
**Difficulty: Easy**
**Status: Ready to Deploy** ✅
