import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register push notification service worker (production only, not in iframes)
if ("serviceWorker" in navigator && !window.location.hostname.includes("id-preview--")) {
  try {
    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    if (!isInIframe) {
      navigator.serviceWorker.register("/sw-push.js").catch(() => {
        // Push SW registration failed silently — not critical
      });
    }
  } catch {
    // Ignore
  }
}

createRoot(document.getElementById("root")!).render(<App />);
