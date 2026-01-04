# Complete Loaders Guide

Your app now has **THREE** beautiful loaders for different scenarios:

## 1. 🕯️ Page Loader (Candle Animation)
**When to use:** Page navigation, route changes, general loading

### Features
- Animated red & green candles
- Witty messages that change every 3 seconds
- Animated progress line
- Full-screen with gradient background

### Usage
```jsx
import usePageLoader from '../hooks/usePageLoader';

const MyComponent = () => {
  const { showLoader, hideLoader } = usePageLoader();

  const navigateToPage = async () => {
    showLoader();
    try {
      // Do async work
      await fetchData();
    } finally {
      hideLoader();
    }
  };

  return <button onClick={navigateToPage}>Go</button>;
};
```

### Witty Messages for Page Loader
1. "Lighting candles of innovation..."
2. "Breathing life into pixels..."
3. "Sprinkling digital magic..."
4. "Waking up the internet fairies..."
5. "Brewing some awesome sauce..."
6. "Summoning the code gods..."
7. "Polishing the digital mirrors..."
8. "Dancing with algorithms..."
9. "Whispering to the servers..."
10. "Crafting moments, loading dreams..."

---

## 2. ☁️ Cloud Upload Loader
**When to use:** File uploads, image uploads, post creation, story uploads

### Features
- Animated cloud with floating particles
- Upload arrow animation
- Witty messages that change every 2.5 seconds
- Progress bar animation
- Semi-transparent overlay

### Usage
```jsx
import useUploadLoader from '../hooks/useUploadLoader';

const CreatePost = () => {
  const { showUploadLoader, hideUploadLoader } = useUploadLoader();
  const [image, setImage] = useState(null);

  const handlePostSubmit = async (postData) => {
    showUploadLoader();
    try {
      const formData = new FormData();
      formData.append('content', postData.content);
      if (image) formData.append('image', image);

      const response = await fetch('/api/post/create', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setImage(null);
        navigate('/home');
      }
    } finally {
      hideUploadLoader();
    }
  };

  return (
    <form onSubmit={handlePostSubmit}>
      <input 
        type="file" 
        onChange={(e) => setImage(e.target.files[0])}
      />
      <button type="submit">Post</button>
    </form>
  );
};
```

### Story Upload Example
```jsx
import useUploadLoader from '../hooks/useUploadLoader';

const CreateStory = () => {
  const { showUploadLoader, hideUploadLoader } = useUploadLoader();
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    showUploadLoader();
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('background_color', selectedColor);

      const response = await fetch('/api/story/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setFile(null);
      }
    } finally {
      hideUploadLoader();
    }
  };

  return (
    <>
      <input 
        type="file" 
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Share Story</button>
    </>
  );
};
```

### Witty Messages for Cloud Upload Loader
1. "Sending your files to the cloud kingdom..."
2. "Teaching pixels to fly..."
3. "Uploading dreams to the internet..."
4. "Befriending the cloud servers..."
5. "Teleporting your content to infinity..."
6. "Making the cloud dance with your data..."
7. "Whispering secrets to the servers..."
8. "Converting vibes to bytes..."
9. "Riding the digital wind..."
10. "Painting the cloud with your creativity..."

---

## 3. 🤖 AI Chat Response Loader
**When to use:** AI responses, generating content, ChatGPT-like responses

### Features
- Animated bouncing dots (3 white dots)
- Witty messages that change every 2 seconds
- Appears as a chat bubble on the left
- Messages fade in and out
- Perfect for chat interfaces

### Usage
```jsx
import AIChatLoader from '../components/AIChatLoader';
import { useState } from 'react';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [input, setInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Add user message
    setMessages([...messages, { text: input, sender: 'user' }]);
    setInput('');

    // Show AI thinking loader
    setIsAIThinking(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      
      // Add AI response
      setMessages((prev) => [...prev, { 
        text: data.reply, 
        sender: 'ai' 
      }]);
    } finally {
      setIsAIThinking(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.sender}>
            {msg.text}
          </div>
        ))}
        {isAIThinking && <AIChatLoader isLoading={true} />}
      </div>

      <form onSubmit={handleSubmit}>
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};
```

### AI Studio Example
```jsx
import AIChatLoader from '../components/AIChatLoader';

const AIStudio = () => {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const generateContent = async (prompt) => {
    setLoading(true);
    setOutput(''); // Clear previous output

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      setOutput(data.content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea 
        placeholder="Your prompt..."
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button onClick={() => generateContent(prompt)}>
        Generate
      </button>

      {loading && <AIChatLoader isLoading={true} />}
      {output && <div className="output">{output}</div>}
    </div>
  );
};
```

### Witty Messages for AI Chat Loader
1. "AI is thinking deeply about your question..."
2. "Consulting the digital oracle..."
3. "Brewing artificial intelligence magic..."
4. "Teaching robots to understand you..."
5. "Downloading wisdom from the cloud..."
6. "Unleashing the neural networks..."
7. "Channeling the AI spirits..."
8. "Computing the answer with stardust..."
9. "Merging with the collective consciousness..."
10. "Translating human to AI and back..."
11. "Processing with cosmic energy..."
12. "Asking the digital gods for guidance..."

---

## Quick Reference

### Import Statements
```jsx
// Page Navigation Loading
import usePageLoader from '../hooks/usePageLoader';

// File/Image Uploading
import useUploadLoader from '../hooks/useUploadLoader';

// AI Responses (directly use component)
import AIChatLoader from '../components/AIChatLoader';
```

### Redux Dispatch (Manual Control)
```jsx
import { setLoading, setUploadLoading } from '../features/ui/uiSlice';

dispatch(setLoading(true));        // Show page loader
dispatch(setLoading(false));       // Hide page loader
dispatch(setUploadLoading(true));  // Show cloud loader
dispatch(setUploadLoading(false)); // Hide cloud loader
```

### Redux State Access
```jsx
const isLoading = useSelector((state) => state.ui?.isLoading);
const isUploading = useSelector((state) => state.ui?.isUploading);
```

---

## Best Practices

✅ **Always use finally block** - Ensures loader hides even if error occurs
```jsx
showLoader();
try {
  // async operation
} finally {
  hideLoader();
}
```

✅ **Different loaders for different tasks**
- Navigation → Page Loader (Candles)
- Uploading → Cloud Loader
- AI Responses → Chat Loader

✅ **Keep messages witty** - Each loader has rotating messages to keep UI fresh

✅ **Use with async operations only** - Not for synchronous operations

❌ **Don't forget to hide** - Always hide the loader when done

---

## Styling

All loaders:
- Have semi-transparent overlays
- Use gradient backgrounds
- Support all screen sizes
- Auto-hide when not needed
- Z-index: 99999 (appears above all content)

---

## Summary Table

| Loader | Use Case | Animation | Messages | Hook |
|--------|----------|-----------|----------|------|
| 🕯️ Page | Navigation | Candles | 10 messages | usePageLoader |
| ☁️ Cloud | Uploads | Cloud + Particles | 10 messages | useUploadLoader |
| 🤖 AI Chat | AI Response | Bouncing Dots | 12 messages | Direct component |
