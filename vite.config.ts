import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png", "robots.txt"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/, /^\/verify-email/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
      },
      manifest: {
        name: "Aurea Student",
        short_name: "Aurea",
        description: "Le hub tout-en-un pour étudiants en France : logement, admin, communauté & rencontres.",
        theme_color: "#d4a843",
        background_color: "#0f0f0f",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "fr",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        categories: ["education", "social", "lifestyle"],
        screenshots: [],
        shortcuts: [
          {
            name: "Hub Social",
            url: "/hub-social",
            description: "Voir les annonces",
          },
          {
            name: "Mon Dossier",
            url: "/mon-dossier",
            description: "Mes documents admin",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
