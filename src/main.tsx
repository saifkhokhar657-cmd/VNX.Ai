import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept native fetch to handle relative paths in Android/Capacitor
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);
  const customFetch: typeof fetch = function (input, init) {
    if (typeof input === "string" && input.startsWith("/api/")) {
      const isAndroidApp = window.location.origin.includes('localhost') || window.location.origin.startsWith('capacitor://');
      const base = isAndroidApp ? "https://ais-pre-lh66pgwfqg2rxh4ag3fqz4-437927335979.asia-southeast1.run.app" : "";
      return originalFetch(base + input, init);
    }
    return originalFetch(input, init);
  };

  try {
    window.fetch = customFetch;
  } catch {
    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
      });
    } catch (e) {
      console.warn("Could not intercept window.fetch:", e);
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
