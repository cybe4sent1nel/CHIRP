# Component Integration Examples

## How to Integrate New Safety Features into Existing Components

### 1. Navigation/Header Integration

#### Before
```jsx
// components/Header.jsx
export const Header = () => {
  return (
    <header className="border-b border-gray-200">
      <nav className="flex items-center justify-between p-4">
        <Logo />
        <NavLinks />
        <UserMenu />
      </nav>
    </header>
  );
};
```

#### After (Add Settings Link)
```jsx
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();
  
  return (
    <header className="border-b border-gray-200">
      <nav className="flex items-center justify-between p-4">
        <Logo />
        <NavLinks />
        <UserMenu>
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings size={20} />
            Settings
          </button>
        </UserMenu>
      </nav>
    </header>
  );
};
```

---

### 2. Chat Message Component Integration

#### Before
```jsx
// components/ChatBubble.jsx
const ChatBubble = ({ message, isOwn }) => {
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
        <time className="text-xs opacity-70">
          {new Date(message.createdAt).toLocaleTimeString()}
        </time>
      </div>
    </div>
  );
};
```

#### After (Add Actions & Status)
```jsx
import { Settings } from 'lucide-react';
import MessageActions from '@/components/MessageActions';
import MessageStatus from '@/components/MessageStatus';

const ChatBubble = ({ message, isOwn, onMessageDeleted }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div 
        className={`max-w-xs rounded-lg p-3 relative ${
          isOwn 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-black'
        }`}
      >
        <p>{message.text}</p>
        
        <div className="flex items-center justify-between gap-2 mt-2">
          <time className="text-xs opacity-70">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </time>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isOwn && <MessageStatus message={message} />}
            
            <MessageActions 
              message={message}
              isOwn={isOwn}
              onDelete={onMessageDeleted}
              onReport={() => console.log('Reported')}
              onBlock={() => console.log('Blocked')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
```

---

### 3. Chat Screen Integration

#### Before
```jsx
// pages/Messages.jsx
const ChatScreen = ({ chatUserId, chatUserName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [chatUserId]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="font-bold">{chatUserName}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => (
          <ChatBubble key={msg._id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
};
```

#### After (Add Chat Management)
```jsx
import ChatBubble from '@/components/ChatBubble';
import ChatManagement from '@/components/ChatManagement';
import { useAuth } from '@clerk/clerk-react';

const ChatScreen = ({ chatUserId, chatUserName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { userId } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, [chatUserId]);

  const handleMessageDeleted = (messageId) => {
    setMessages(messages.filter(m => m._id !== messageId));
  };

  const handleChatCleared = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg">{chatUserName}</h2>
          <p className="text-sm text-gray-500">Online</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Phone size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Video size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation</p>
          </div>
        ) : (
          messages.map(msg => (
            <ChatBubble 
              key={msg._id} 
              message={msg}
              isOwn={msg.sender_id === userId}
              onMessageDeleted={handleMessageDeleted}
            />
          ))
        )}
        <div ref={messagesEndRef} /> {/* Auto-scroll */}
      </div>

      {/* Chat Management Controls */}
      <ChatManagement 
        chatUserId={chatUserId}
        onChatCleared={handleChatCleared}
      />

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
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
            className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### 4. Profile/User Card Integration

#### Before
```jsx
// components/UserCard.jsx
const UserCard = ({ user }) => {
  const navigate = useNavigate();
  
  return (
    <div className="border rounded-lg p-4">
      <img 
        src={user.profile_picture} 
        alt={user.full_name}
        className="w-full h-48 object-cover rounded"
      />
      <h3 className="font-bold mt-4">{user.full_name}</h3>
      <p className="text-gray-600">@{user.username}</p>
      
      <button onClick={() => navigate(`/profile/${user._id}`)}>
        View Profile
      </button>
    </div>
  );
};
```

#### After (Add Block/Report)
```jsx
import { MoreVertical, Block, Flag } from 'lucide-react';
import api from '@/api/axios';
import toast from 'react-hot-toast';

const UserCard = ({ user, onUserBlocked }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleBlock = async () => {
    try {
      await api.post('/api/safety/block', {
        blockedUserId: user._id
      });
      toast.success('User blocked');
      onUserBlocked?.();
      setShowMenu(false);
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    try {
      await api.post('/api/safety/report/user', {
        reportedUserId: user._id,
        reason: reportReason
      });
      toast.success('User reported');
      setShowReport(false);
      setReportReason('');
    } catch (error) {
      toast.error('Failed to report user');
    }
  };
  
  return (
    <div className="border rounded-lg p-4 relative">
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
        
        {/* More Menu */}
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
                onClick={() => setShowReport(!showReport)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Flag size={16} />
                Report
              </button>
              
              {showReport && (
                <div className="bg-gray-50 p-3 border-t">
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs border rounded p-1 mb-2"
                  >
                    <option value="">Select reason</option>
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
      
      <button 
        onClick={() => navigate(`/profile/${user._id}`)}
        className="w-full mt-4 bg-blue-500 text-white rounded py-2 hover:bg-blue-600"
      >
        View Profile
      </button>
    </div>
  );
};

export default UserCard;
```

---

### 5. Post Card Integration

#### Before
```jsx
// components/PostCard.jsx
const PostCard = ({ post }) => {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={post.user.profile_picture} 
          alt={post.user.full_name}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-bold">{post.user.full_name}</p>
          <p className="text-sm text-gray-500">@{post.user.username}</p>
        </div>
      </div>
      
      <p>{post.text}</p>
      
      {post.image && <img src={post.image} alt="Post" className="mt-4 rounded" />}
      
      <div className="flex gap-4 mt-4 text-gray-500">
        <button>Like</button>
        <button>Comment</button>
        <button>Share</button>
      </div>
    </div>
  );
};
```

#### After (Add Report Post)
```jsx
import { MoreVertical, Flag } from 'lucide-react';
import api from '@/api/axios';
import toast from 'react-hot-toast';

const PostCard = ({ post, onPostReported }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleReportPost = async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    try {
      await api.post('/api/safety/report/post', {
        postId: post._id,
        reason: reportReason,
        description: `Reported post: "${post.text.substring(0, 50)}..."`
      });
      toast.success('Post reported');
      setShowReport(false);
      setReportReason('');
      onPostReported?.();
    } catch (error) {
      toast.error('Failed to report post');
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img 
            src={post.user.profile_picture} 
            alt={post.user.full_name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-bold">{post.user.full_name}</p>
            <p className="text-sm text-gray-500">@{post.user.username}</p>
          </div>
        </div>
        
        {/* Report Menu */}
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
                onClick={() => setShowReport(!showReport)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Flag size={16} />
                Report Post
              </button>
              
              {showReport && (
                <div className="bg-gray-50 p-3 border-t">
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs border rounded p-1 mb-2"
                  >
                    <option value="">Select reason</option>
                    <option value="harassment">Harassment</option>
                    <option value="hate_speech">Hate Speech</option>
                    <option value="false_information">False Information</option>
                    <option value="spam">Spam</option>
                    <option value="adult_content">Adult Content</option>
                    <option value="violence">Violence</option>
                    <option value="other">Other</option>
                  </select>
                  <button 
                    onClick={handleReportPost}
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
      
      <p>{post.text}</p>
      
      {post.image && <img src={post.image} alt="Post" className="mt-4 rounded" />}
      
      <div className="flex gap-4 mt-4 text-gray-500">
        <button>Like</button>
        <button>Comment</button>
        <button>Share</button>
      </div>
    </div>
  );
};

export default PostCard;
```

---

## Summary

These integration examples show how to:

1. ✅ Add Settings navigation link
2. ✅ Add message actions to chat bubbles
3. ✅ Add chat management controls
4. ✅ Add block/report options to user profiles
5. ✅ Add report functionality to posts

Each example follows the same pattern:
- Import components and utilities
- Set up state for UI interactions
- Call API endpoints with error handling
- Show success/error toasts
- Update parent component state if needed

Adapt these patterns to your existing component structure!
