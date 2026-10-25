import { execSync } from 'node:child_process'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// VITE_BUILD_ID if set, else Netlify's COMMIT_REF (set on every Netlify build),
// else git. Without the COMMIT_REF fallback every deployed footer reads "build dev".
function resolveBuildId(): string {
  const fromEnv = process.env.VITE_BUILD_ID || process.env.COMMIT_REF
  if (fromEnv) return fromEnv.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}
const buildId = resolveBuildId()
const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ')

// Publishes the build's identity next to the build, so a running copy can ask
// the origin what's live (src/lib/useVersionCheck.ts). Workbox's default
// globPatterns skip .json, so the service worker never caches this file.
function emitVersionJson(): Plugin {
  return {
    name: 'emit-version-json',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ commit: buildId, builtAt: buildTime }) + '\n',
      })
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    emitVersionJson(),
    VitePWA({
      registerType: 'autoUpdate',
      // src/pwa.ts registers the worker itself via useRegisterSW.
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'App Name',
        short_name: 'App',
        description: 'A web app built with Claude Code',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
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
    __BUILD_ID__: JSON.stringify(buildId),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
})
