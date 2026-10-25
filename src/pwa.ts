import { watch } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

// A composable (useRegisterSW needs a component), so call it from App.vue's setup.
export function setupPWAUpdates() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      // iOS keeps installed PWAs alive for a long time; without a periodic
      // update check an open app never notices a deploy.
      if (reg) setInterval(() => reg.update().catch(() => {}), 60_000)
    },
  })

  // Apply a new worker as soon as it's ready. Apps holding unsaved state
  // should prompt here instead of reloading mid-edit.
  watch(needRefresh, (ready) => {
    if (ready) updateServiceWorker(true)
  })

  // The manual path. A polite updateServiceWorker(true) + reload often lands on
  // the same version on iOS: the old worker keeps control and replays the
  // precached bundle. This only runs when the user asked and version.json said
  // a newer build is live, so drop the worker and every cache outright.
  // Note: that includes any runtime caches the app adds (fonts, data).
  async function reloadLatest() {
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? []
      await Promise.all(regs.map((r) => r.unregister()))
      if (typeof caches !== 'undefined') {
        await Promise.all((await caches.keys()).map((k) => caches.delete(k)))
      }
    } finally {
      const url = new URL(location.href)
      url.searchParams.set('fresh', Date.now().toString())
      location.replace(url.toString())
    }
  }

  return { reloadLatest }
}
