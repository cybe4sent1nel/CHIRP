# Quick Integration Steps

## 1. Add Settings Route to Router

Edit your `client/src/App.jsx` or routing file:

```jsx
import Settings from '@/pages/Settings'

// Add this to your route configuration:
<Route path="/settings" element={<Settings />} />
```

## 2. Add Settings Link to Navigation/Header

Add in your main navigation component:

```jsx
import { Settings as SettingsIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

// In your navigation:
<Link 
  to="/settings" 
  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
>
  <SettingsIcon size={20} />
  <span>Settings</span>
</Link>
```

Or in a profile dropdown menu:

```jsx
<button 
  onClick={() => navigate('/settings')}
  className="w-full text-left px-4 py-2 hover:bg-gray-100"
>
  <SettingsIcon size={16} className="inline mr-2" />
  Settings
</button>
```

## 3. Update Message Display Component

If you have a Message or Chat component, add the MessageActions:

```jsx
import MessageActions from '@/components/MessageActions'
import MessageStatus from '@/components/MessageStatus'

function ChatBubble({ message, currentUserId }) {
  const isOwn = message.sender_id === currentUserId
  
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-xs rounded-lg p-3 ${
          isOwn 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-black'
        }`}
      >
        <p>{message.text}</p>
        
        <div className="flex items-center justify-end gap-2 mt-2 text-xs">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
          
          {isOwn && <MessageStatus message={message} />}
          
          <MessageActions 
            message={message}
            isOwn={isOwn}
            onDelete={() => {
              // Refresh messages
            }}
            onReport={() => {
              // Handle reported
            }}
            onBlock={() => {
              // Handle blocked
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

## 4. Add Chat Management to Chat Screen

```jsx
import ChatManagement from '@/components/ChatManagement'

function ChatScreen({ chatUserId }) {
  const [messages, setMessages] = useState([])
  
  return (
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <h2>Chat with {otherUser.full_name}</h2>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => (
          <ChatBubble key={msg._id} message={msg} />
        ))}
      </div>
      
      {/* Chat Management */}
      <ChatManagement 
        chatUserId={chatUserId}
        onChatCleared={() => {
          setMessages([])
        }}
      />
      
      {/* Message Input */}
      <MessageInput />
    </div>
  )
}
```

## 5. Verify Backend Routes are Registered

Check your `server/server.js` includes:

```javascript
import safetyRouter from './routes/safetyRoutes.js'

// In routes section:
app.use('/api/safety', safetyRouter)
app.use('/api/user', userRouter) // Already has settings endpoint
```

## 6. Verify Models are Created

Ensure these files exist:
- `server/models/BlockList.js` ✅
- `server/models/Report.js` ✅
- `server/controllers/safetyController.js` ✅
- `server/routes/safetyRoutes.js` ✅

## 7. Test the Implementation

### Test Settings Page
1. Navigate to `/settings`
2. Toggle privacy settings
3. Toggle notification settings
4. Click "Save Changes"
5. Verify settings saved via Network tab

### Test Message Actions
1. Open a chat
2. Hover/right-click on a message
3. Click the three-dot menu
4. Test delete options
5. Test report/block options

### Test API Endpoints
```bash
# Test blocking a user
curl -X POST http://localhost:4000/api/safety/block \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blockedUserId": "USER_ID"}'

# Test reporting a user
curl -X POST http://localhost:4000/api/safety/report/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "USER_ID",
    "reason": "harassment",
    "description": "This user is harassing me"
  }'

# Test clearing chat
curl -X DELETE http://localhost:4000/api/safety/chat/clear \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherUserId": "USER_ID"}'
```

## 8. Add Toast Notifications

Make sure you have `react-hot-toast` installed:

```bash
npm install react-hot-toast
```

And in your main app file:

```jsx
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* Rest of app */}
    </>
  )
}
```

## 9. Optional: Add User Settings to Profile

Display user's current settings on their profile:

```jsx
async function fetchUserSettings() {
  const response = await api.get('/api/user/data')
  const user = response.data.user
  
  console.log('Privacy settings:', user.privacy_settings)
  console.log('Notification settings:', user.notification_settings)
  console.log('Account settings:', user.account_settings)
}
```

## File Structure Summary

```
client/src/
├── pages/
│   └── Settings.jsx (NEW)
├── components/
│   ├── MessageActions.jsx (NEW)
│   ├── MessageStatus.jsx (NEW)
│   └── ChatManagement.jsx (NEW)

server/
├── controllers/
│   └── safetyController.js (NEW)
├── models/
│   ├── BlockList.js (NEW)
│   ├── Report.js (NEW)
│   └── User.js (UPDATED)
│   └── Message.js (UPDATED)
├── routes/
│   ├── safetyRoutes.js (NEW)
│   └── userRoutes.js (UPDATED)
└── server.js (UPDATED)
```

## Troubleshooting

### Settings not saving
- Check browser console for errors
- Verify API endpoint is registered in `server.js`
- Check auth middleware is working

### Message actions not appearing
- Ensure `MessageActions` component is imported correctly
- Check CSS for any z-index issues with menu
- Verify message object has required fields

### API 404 errors
- Ensure safety routes are registered before `app.listen()`
- Check import statements in `server.js`
- Verify controller file exists at correct path

### Block/Report not working
- Check auth token is being sent
- Verify user IDs are correct format
- Check MongoDB connection is working

## Next Steps

1. ✅ Create Settings page
2. ✅ Create Safety controller and routes
3. ✅ Update models with new fields
4. ✅ Create message action components
5. ⏭️ **Integrate into your app**
6. ⏭️ Test all functionality
7. ⏭️ Add email notifications (optional)
8. ⏭️ Implement 2FA (optional)
9. ⏭️ Add admin dashboard for managing reports

## Support Files Created

- `ACCOUNT_SETTINGS_IMPLEMENTATION.md` - Complete documentation
- `SETTINGS_INTEGRATION_STEPS.md` - This file with quick integration guide
