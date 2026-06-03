import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { StoreProvider } from "./store/StoreProvider";
// Self-hosted Google display font (Fredoka) — bundled by Vite and precached by
// the PWA, so the dex keeps its playful type offline (no CDN/runtime fetch).
import "@fontsource/fredoka/latin-500.css";
import "@fontsource/fredoka/latin-600.css";
import "@fontsource/fredoka/latin-700.css";
import "./styles/theme.css";
import "./styles/animations.css";

// Auto-reload the open tab when a freshly deployed service worker takes control.
// The PWA uses `registerType: "autoUpdate"` (skipWaiting + clientsClaim), so a
// new deploy's SW activates and claims this page immediately — but the document
// already on screen keeps showing the OLD precached shell until a reload. This
// listener performs that reload once, so updates take effect without the user
// manually refreshing. We only reload when an EXISTING controller is replaced
// (a real update); the initial SW claim on a first-ever visit is skipped so it
// doesn't cause a reload flash. The `refreshing` guard prevents a reload loop.
if ("serviceWorker" in navigator) {
  let refreshing = false;
  const hadController = navigator.serviceWorker.controller != null;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>,
);
