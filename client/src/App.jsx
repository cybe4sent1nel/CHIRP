import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import CustomAuth from "./pages/CustomAuth";
import AuthLanding from "./pages/AuthLanding";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Connections from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Notifications from "./pages/Notifications";
import About from "./pages/About";
import AIStudio from "./pages/AIStudio";
import ProfileQR from "./pages/ProfileQR";
import ChirpNews from "./pages/ChirpNews";
import ChirpArticles from "./pages/ChirpArticles";
import NewsDetail from "./pages/NewsDetail";
import ArticleDetail from "./pages/ArticleDetail";
import ChirpChannels from "./pages/ChirpChannels";
import CreateChannel from "./pages/CreateChannel";
import ChannelDetail from "./pages/ChannelDetail";
import NotFound from "./pages/NotFound";
import PageLoader from "./components/PageLoader";
import CloudUploadLoader from "./components/CloudUploadLoader";
import NoInternetError from "./components/NoInternetError";
import { useUser, useAuth } from "@clerk/clerk-react";
import Layout from "./pages/Layout";
import { Toaster } from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "./features/user/userSlice";
import { fetchConnections, updateUserStatus } from "./features/connections/connectionSlice.js";
import { addMessage } from "./features/messages/messagesSlice.js";
import toast from 'react-hot-toast'
import Notification from "./components/Notification";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import ClickSpark from "./components/ClickSpark";

// Fetch error interceptor - catches all network errors
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch.apply(this, args)
    .catch(error => {
      // Dispatch custom event for network errors
      console.error('Network Error caught:', error);
      window.dispatchEvent(new CustomEvent('networkError', { detail: error }));
      // Don't throw, return a rejected promise that we can handle
      return Promise.reject(error);
    });
};

// Handle unhandled network errors globally
window.addEventListener('error', (event) => {
  if (event.message && (event.message.includes('fetch') || event.message.includes('Network'))) {
    window.dispatchEvent(new CustomEvent('networkError', { detail: event }));
  }
});

import { useCustomAuth } from "./context/AuthContext";

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (event.reason.message?.includes('fetch') || event.reason.message?.includes('Network') || event.reason instanceof TypeError)) {
    window.dispatchEvent(new CustomEvent('networkError', { detail: event.reason }));
  }
});

const App = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isAuthenticated: customAuthActive } = useCustomAuth();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  const isLoading = useSelector((state) => state.ui?.isLoading || false);
  const isUploading = useSelector((state) => state.ui?.isUploading || false);
  const isOnline = useNetworkStatus();
  const [showNetworkError, setShowNetworkError] = useState(!isOnline);

  // User is authenticated if either Clerk user exists OR custom auth is active
  const isUserAuthenticated = user || customAuthActive;

  const dispatch = useDispatch();
  useEffect(()=>{
    const printToken = async () => {
      const token = await getToken()
      console.log(token)
    }
    printToken()
  },[])

  useEffect(()=>{
    const fetchData = async () => {
      if(user){
      const token = await getToken()
      dispatch(fetchUser(token))
      dispatch(fetchConnections
      (token))
    }
    }
    fetchData()
  }, [user, getToken, dispatch ])

  useEffect(()=>{
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    if (!isOnline) {
      setShowNetworkError(true);
    } else {
      setShowNetworkError(false);
    }
  }, [isOnline]);

  // Listen for fetch errors
  useEffect(() => {
    const handleNetworkError = (event) => {
      console.log('Network error detected:', event);
      setShowNetworkError(true);
    };
    window.addEventListener('networkError', handleNetworkError);
    
    return () => {
      window.removeEventListener('networkError', handleNetworkError);
    };
  }, []);

  // Detect online/offline changes in real-time
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored');
      setShowNetworkError(false);
    };
    
    const handleOffline = () => {
      console.log('Connection lost');
      setShowNetworkError(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(()=>{
    if(user){
      let eventSource = null;
      let reconnectTimeout = null;
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 5;
      const initialReconnectDelay = 1000; // 1 second

      const connectSSE = () => {
        try {
          // Handle both /api and non-/api base URLs
          let baseUrl = import.meta.env.VITE_BASEURL || 'http://localhost:4000';
          // Remove trailing /api if it exists, we'll add it explicitly
          baseUrl = baseUrl.replace(/\/api\/?$/, '');
          const sseUrl = baseUrl + '/api/message/' + user.id;
          console.log('Attempting SSE connection to:', sseUrl);
          eventSource = new EventSource(sseUrl);

          eventSource.onopen = () => {
            console.log('SSE connection established successfully');
            reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          }

          eventSource.onmessage = (event) => {
            try {
              // Skip heartbeat comments
              if (event.data.includes('heartbeat') || event.data.includes('connected')) {
                return;
              }
              
              const data = JSON.parse(event.data)
              
              // Handle initial online users list
              if (data.type === 'onlineUsersList') {
                console.log('Received online users list:', data.users);
                // Update Redux with all online users
                data.users.forEach(userId => {
                  dispatch(updateUserStatus({ userId, isOnline: true }));
                });
                return;
              }
              
              // Handle user status updates
              if (data.type === 'userStatus') {
                console.log('User status update received:', data.userId, data.isOnline ? 'online' : 'offline');
                // Update Redux store
                dispatch(updateUserStatus({ userId: data.userId, isOnline: data.isOnline }));
                console.log('Dispatched to Redux:', data.userId, data.isOnline);
                // Dispatch a custom event for components that need it
                window.dispatchEvent(new CustomEvent('userStatusChange', { detail: data }));
                return;
              }
              
              // Handle message status updates (delivered/read)
              if (data.type === 'messageStatus') {
                console.log('Message status update:', data.messageId, data.status);
                // Dispatch custom event for Chat component to handle
                window.dispatchEvent(new CustomEvent('messageStatusChange', { detail: data }));
                return;
              }

              // Handle regular messages
              const message = data;
              if(pathnameRef.current === ('/messages/' + message.from_user_id._id)){
                dispatch(addMessage(message))
              } else {
                toast.custom((t) => {
                  <Notification t={t} message={message} />
                }, {position: "bottom-right"})
              }
              // Notify that a new message was received
              window.dispatchEvent(new CustomEvent('messageReceived'));
            } catch (err) {
              console.warn('Error parsing SSE message:', err)
            }
          }

          eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            console.error('EventSource readyState:', eventSource.readyState);
            // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
            console.error('Error details:', {
              type: error.type,
              message: error.message,
              readyState: eventSource.readyState
            });
            eventSource?.close();

            // Attempt to reconnect with exponential backoff
            if (reconnectAttempts < maxReconnectAttempts) {
              const delay = initialReconnectDelay * Math.pow(2, reconnectAttempts);
              console.log(`Reconnecting SSE in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
              reconnectTimeout = setTimeout(() => {
                reconnectAttempts++;
                connectSSE();
              }, delay);
            } else {
              console.error('Max SSE reconnection attempts reached');
              toast.error('Connection lost. Please refresh the page.');
            }
          }
        } catch (err) {
          console.error('Error creating EventSource:', err);
          toast.error('Failed to establish message connection');
        }
      };

      connectSSE();

      return () => {
        console.log('App.jsx useEffect cleanup - closing EventSource for user:', user?.id);
        if (eventSource) {
          console.log('EventSource state before close:', eventSource.readyState);
          eventSource.close();
          console.log('EventSource closed');
        }
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
      }
    }
  }, [user, dispatch])
  
  if (showNetworkError) {
    return (
      <NoInternetError
        onRetry={() => {
          setShowNetworkError(false);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <>
      <Toaster />
      {isLoading && <PageLoader />}
      {isUploading && <CloudUploadLoader isLoading={isUploading} />}
      <ClickSpark>
        <Routes>
          {/* Landing Page - Clerk Login as default */}
          <Route path="/welcome" element={<Login />} />
          
          {/* Custom Auth Routes - Accessible without authentication */}
          <Route path="/auth" element={<CustomAuth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Protected Routes - Require authentication */}
          <Route path="/" element={!isUserAuthenticated ? <Login /> : <Layout />}>
            <Route index element={<Feed />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:userId" element={<Chat />} />
            <Route path="connections" element={<Connections />} />
            <Route path="discover" element={<Discover />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:profileId" element={<Profile />} />
            <Route path="create-post" element={<CreatePost />} />
            <Route path="about" element={<About />} />
            <Route path="ai-studio" element={<AIStudio />} />
            <Route path="profile-qr" element={<ProfileQR />} />
            <Route path="chirp-news" element={<ChirpNews />} />
            <Route path="news/:articleId" element={<NewsDetail />} />
            <Route path="chirp-articles" element={<ChirpArticles />} />
            <Route path="article/:articleId" element={<ArticleDetail />} />
            <Route path="chirp-channels" element={<ChirpChannels />} />
            <Route path="create-channel" element={<CreateChannel />} />
            <Route path="channel/:channelId" element={<ChannelDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
      </ClickSpark>
    </>
  );
};

export default App;
