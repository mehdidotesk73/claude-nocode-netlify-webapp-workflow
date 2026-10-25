import { watch } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { logDebug } from './debug'

// How often an open app re-checks the server for a newer deploy. iOS keeps
// installed PWAs alive for a long time, so without this an open app could miss
// a deploy and keep serving the cached build.
const UPDATE_CHECK_MS = 60_000

/**
 * Registers the service worker, polls for new deploys, and auto-reloads into
 * them. Returns `updateServiceWorker` so the UI can offer a manual button.
 */
export function setupPWAUpdates() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      logDebug(`service worker registered`)
      if (registration) {
        setInterval(() => {
          registration.update().catch(() => {})
        }, UPDATE_CHECK_MS)
      }
    },
    onRegisterError(err) {
      logDebug(`service worker register error: ${err}`, 'error')
    },
  })

  // As soon as a new build is detected, swap to it and reload.
  watch(needRefresh, (ready) => {
    if (ready) {
      logDebug('new build detected — reloading')
      updateServiceWorker(true)
    }
  })

  /**
   * Manual "Reload latest". The polite `updateServiceWorker(true)` path proved
   * unreliable on iOS Safari PWAs: if `reg.update()` doesn't actually swap in a
   * new worker, the old SW keeps controlling the page and replays the
   * *precached* `index.html` + hashed bundle out of Cache Storage, so
   * `location.reload()` lands back on the same version.
   *
   * Since this only runs when the user has explicitly asked for the latest build
   * (and `version.json` has confirmed one is live), be decisive: unregister the
   * service worker, wipe its caches, and navigate with a cache-buster so neither
   * the SW precache nor the HTTP cache can replay the stale build. The SW
   * re-registers and re-precaches the new build on the next load.
   */
  async function reloadLatest() {
    logDebug('manual reload — clearing SW + caches')
    // Drop every service worker so none can intercept the next navigation.
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? []
      await Promise.all(regs.map((r) => r.unregister()))
    } catch (err) {
      logDebug(`sw unregister failed: ${err}`, 'error')
    }
    // Wipe Workbox's precache (where the old index.html + bundle live).
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } catch (err) {
      logDebug(`cache clear failed: ${err}`, 'error')
    }
    // Cache-bust the navigation itself so the HTTP layer can't serve a stale
    // index.html. main.ts strips the marker from the URL once we're back up.
    try {
      const url = new URL(location.href)
      url.searchParams.set('fresh', Date.now().toString())
      location.replace(url.toString())
    } catch {
      location.reload()
    }
  }

  return { reloadLatest }
}
