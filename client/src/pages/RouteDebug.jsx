// This component can be used to debug routing issues
// Add this route temporarily to test: <Route path="debug" element={<RouteDebug />} />

import { useLocation } from 'react-router-dom';

const RouteDebug = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🐛 Route Debug Page</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Location</h2>
          <pre className="bg-black p-4 rounded overflow-auto">
            {JSON.stringify({
              pathname: location.pathname,
              search: location.search,
              hash: location.hash,
              state: location.state
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Routes</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>✅ <a href="/" className="text-blue-400 hover:underline">/</a> - Home</p>
            <p>✅ <a href="/notifications" className="text-blue-400 hover:underline">/notifications</a> - Notifications</p>
            <p>✅ <a href="/messages" className="text-blue-400 hover:underline">/messages</a> - Messages</p>
            <p>✅ <a href="/connections" className="text-blue-400 hover:underline">/connections</a> - Network</p>
            <p>✅ <a href="/discover" className="text-blue-400 hover:underline">/discover</a> - Explore</p>
            <p>✅ <a href="/profile" className="text-blue-400 hover:underline">/profile</a> - Profile</p>
            <p>✅ <a href="/ai-studio" className="text-blue-400 hover:underline">/ai-studio</a> - AI Studio</p>
            <p>✅ <a href="/profile-qr" className="text-blue-400 hover:underline">/profile-qr</a> - Profile QR</p>
            <p>✅ <a href="/about" className="text-blue-400 hover:underline">/about</a> - About</p>
            <p>✅ <a href="/create-post" className="text-blue-400 hover:underline">/create-post</a> - Create Post</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Navigation</h2>
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = '/ai-studio'}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mb-2 text-left"
            >
              Go to /ai-studio
            </button>
            <button
              onClick={() => window.location.href = '/profile-qr'}
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded text-left"
            >
              Go to /profile-qr
            </button>
          </div>
        </div>

        <div className="mt-8 text-gray-400 text-sm">
          <p>Remove this page from App.jsx after testing.</p>
        </div>
      </div>
    </div>
  );
};

export default RouteDebug;
