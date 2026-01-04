# Page Loader Usage Guide

The beautiful candle animation loader is now integrated into your app! Here's how to use it.

## Features

✨ **Animated Candles**
- Light red candle (left)
- Light green candle (right)
- Realistic fire and smoke effects
- Sparkling light waves

📝 **Witty Messages** - Rotates through clever loading messages:
- "Lighting candles of innovation..."
- "Breathing life into pixels..."
- "Sprinkling digital magic..."
- And more!

📊 **Animated Progress Line** - Beautiful gradient bar animation

🎨 **Beautiful Gradient Background** - Professional loading screen

## How to Use

### Basic Usage (Page Navigation)

The loader is automatically triggered when `isLoading` is set to `true` in Redux.

```jsx
import usePageLoader from '../hooks/usePageLoader';

const MyComponent = () => {
  const { showLoader, hideLoader } = usePageLoader();

  const handleAction = async () => {
    showLoader();
    try {
      // Do something async
      await someAsyncOperation();
    } finally {
      hideLoader();
    }
  };

  return (
    <button onClick={handleAction}>
      Click Me
    </button>
  );
};
```

### Show Loader Before Navigation

```jsx
import { useNavigate } from 'react-router-dom';
import usePageLoader from '../hooks/usePageLoader';

const MyComponent = () => {
  const navigate = useNavigate();
  const { showLoader } = usePageLoader();

  const goToPage = () => {
    showLoader();
    navigate('/new-page');
  };

  return <button onClick={goToPage}>Navigate</button>;
};
```

### Post Upload Example

```jsx
import usePageLoader from '../hooks/usePageLoader';

const CreatePost = () => {
  const { showLoader, hideLoader } = usePageLoader();

  const handlePostSubmit = async (postData) => {
    showLoader();
    try {
      const response = await fetch('/api/post/create', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      
      if (response.ok) {
        // Navigate or show success
        navigate('/home');
      }
    } catch (error) {
      console.error(error);
    } finally {
      hideLoader();
    }
  };

  return (
    <form onSubmit={handlePostSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Story Upload Example

```jsx
import usePageLoader from '../hooks/usePageLoader';

const CreateStory = () => {
  const { showLoader, hideLoader } = usePageLoader();
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    showLoader();
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/story/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setFile(null);
        // Success toast or redirect
      }
    } finally {
      hideLoader();
    }
  };

  return (
    <>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload Story</button>
    </>
  );
};
```

### Using with Async Thunks (Redux)

```jsx
import usePageLoader from '../hooks/usePageLoader';
import { useDispatch } from 'react-redux';

const MyComponent = () => {
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = usePageLoader();

  const handleFetchData = async () => {
    showLoader();
    try {
      await dispatch(fetchSomeData()).unwrap();
    } finally {
      hideLoader();
    }
  };

  return (
    <button onClick={handleFetchData}>
      Fetch Data
    </button>
  );
};
```

### Image Upload (Form)

```jsx
import usePageLoader from '../hooks/usePageLoader';

const ProfileUpdate = () => {
  const { showLoader, hideLoader } = usePageLoader();
  const [image, setImage] = useState(null);

  const handleProfileUpdate = async () => {
    showLoader();
    try {
      const formData = new FormData();
      formData.append('image', image);
      
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Update success
      }
    } finally {
      hideLoader();
    }
  };

  return (
    <>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />
      <button onClick={handleProfileUpdate}>
        Update Profile
      </button>
    </>
  );
};
```

## Witty Loading Messages

The loader rotates through these messages every 3 seconds:

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

## Styling

The loader includes:
- **Full-screen overlay** with blur effect
- **Gradient background** (light blue to purple)
- **Fixed z-index: 99999** (appears above all content)
- **Responsive design** - works on all screen sizes

## Important Notes

⚠️ **Always hide the loader** - Make sure to call `hideLoader()` in the `finally` block to ensure it hides even if an error occurs.

⚠️ **Use with async operations only** - The loader is designed for operations that take time (API calls, file uploads, etc.)

✅ **Automatic animations** - No need to configure animations, they run automatically.

## Redux State

The loading state is stored in Redux at:
```
state.ui.isLoading (boolean)
```

You can also manually dispatch the action:
```jsx
import { setLoading } from '../features/ui/uiSlice';

dispatch(setLoading(true));  // Show loader
dispatch(setLoading(false)); // Hide loader
```
