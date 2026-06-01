import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Plantdex is a fully client-side app: load once, then run offline.
// The PWA plugin precaches the app shell + bundled plants.json, and caches
// remote plant images (Wikimedia) so already-seen plants survive offline.
export default defineConfig({
  // App is intended to be served from a subpath in the examples repo / GH pages.
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png", "icons/favicon.svg"],
      manifest: {
        name: "Plantdex",
        short_name: "Plantdex",
        description: "A Pokedex for plants — browse, search, and collect.",
        theme_color: "#0c3b1e",
        background_color: "#0c3b1e",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,json,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith("wikimedia.org"),
            handler: "CacheFirst",
            options: {
              cacheName: "plant-images",
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
