/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Build stamps injected by `define` in vite.config.ts — surfaced in the footer.
declare const __BUILD_ID__: string
declare const __BUILD_TIME__: string

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
