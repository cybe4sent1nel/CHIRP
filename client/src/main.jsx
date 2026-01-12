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

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    console.log('Service Worker registered:', registration);
  }).catch((error) => {
    console.log('Service Worker registration failed:', error);
  });
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
