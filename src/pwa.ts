import { registerSW } from 'virtual:pwa-register'

export function setupPWA() {
  // Register and auto-update the service worker
  const updateSW = registerSW({
    onNeedRefresh() {
      // PWA is ready for update; the Update Available affordance will handle the prompt
    },
    onOfflineReady() {
      // PWA is ready to work offline
    },
  })

  return { updateSW }
}

// Called by App.vue when user clicks "Reload latest"
export async function reloadLatest() {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  } else {
    window.location.reload()
  }
}
