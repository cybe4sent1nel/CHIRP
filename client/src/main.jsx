import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Provider } from "react-redux";
import { store } from "./app/store.js";
import { AuthProvider } from "./context/AuthContext.jsx";

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

// Register service worker for offline support (unregister old, then register fresh)
if ('serviceWorker' in navigator) {
  const registerFreshServiceWorker = async () => {
    try {
      // Unregister all existing service workers to avoid stale handlers
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      console.log('[SW] All existing service workers unregistered. Re-registering fresh one...');

      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Fresh Service Worker registered:', registration);
    } catch (error) {
      console.log('[SW] Service Worker registration failed:', error);
    }
  };

  registerFreshServiceWorker();
}

// Debug routing/redirects
console.log('[MAIN] Application starting...');
console.log('[MAIN] Current path:', window.location.pathname);

// Log location changes
const originalSetHref = Object.getOwnPropertyDescriptor(Location.prototype, 'href')?.set;
if (originalSetHref) {
  Object.defineProperty(window.location, 'href', {
    set(value) {
      console.log('[MAIN] 🔄 REDIRECT: window.location.href being set to:', value);
      console.trace('[MAIN] Redirect stack trace:');
      originalSetHref.call(window.location, value);
    },
    get() {
      return Object.getPrototypeOf(Object.getPrototypeOf(window.location)).href;
    }
  });
}

createRoot(document.getElementById("root")).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    appearance={{
      baseTheme: undefined,
    }}
  >
    <BrowserRouter>
      <Provider store={store}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  </ClerkProvider>
);
