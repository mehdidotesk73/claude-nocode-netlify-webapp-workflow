import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves from https://<owner>.github.io/<repo-name>/, so assets need
// that sub-path baked in. The Pages workflow sets VITE_BASE; Netlify and local dev
// serve from the root and leave it unset.
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'App Name',
        short_name: 'App',
        description: 'A web app built with Claude Code',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        // Relative so they resolve against `base` on both hosts.
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  define: {
    __BUILD_ID__: JSON.stringify(process.env.VITE_BUILD_ID || 'dev'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
