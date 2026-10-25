import { ref, computed, onMounted, onUnmounted } from 'vue'
import { logDebug } from '../debug'

// How often to re-poll the published manifest. Matches the service-worker
// update cadence in pwa.ts so the two freshness signals stay roughly in step.
const POLL_MS = 60_000

export interface PublishedVersion {
  commit: string
  builtAt: string
}

export type VersionStatus = 'current' | 'update-ready' | 'unknown'

/**
 * Tracks the *published* build — the one the live origin is actually serving —
 * by polling `version.json` (emitted into the build root by the
 * `emit-version-json` Vite plugin) and comparing it to the commit baked into
 * this bundle (`__BUILD_ID__`).
 *
 * This is the honest answer the old "Reload latest" button lacked: it lets the
 * UI distinguish "you're already on the latest published build" from "a newer
 * build is live, reload to get it" instead of guessing from service-worker
 * internals and silently reloading into the same version.
 */
export function useVersionCheck() {
  const loadedCommit = __BUILD_ID__
  const published = ref<PublishedVersion | null>(null)
  const checking = ref(false)
  // Only log a fetch failure when the condition changes, so a phone that's
  // offline (or on a deploy that predates version.json) doesn't spam the log
  // every poll.
  let lastErrorLogged = false

  const status = computed<VersionStatus>(() => {
    if (!published.value) return 'unknown'
    return published.value.commit === loadedCommit ? 'current' : 'update-ready'
  })

  /** Fetch version.json once (cache-busted, never from cache) and return the status. */
  async function checkNow(): Promise<VersionStatus> {
    checking.value = true
    try {
      const url = `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      published.value = (await res.json()) as PublishedVersion
      if (lastErrorLogged) {
        logDebug('version check recovered')
        lastErrorLogged = false
      }
    } catch (err) {
      if (!lastErrorLogged) {
        logDebug(`version check failed: ${err}`, 'error')
        lastErrorLogged = true
      }
    } finally {
      checking.value = false
    }
    return status.value
  }

  let timer: number | undefined
  onMounted(() => {
    void checkNow()
    timer = window.setInterval(() => void checkNow(), POLL_MS)
  })
  onUnmounted(() => {
    if (timer) window.clearInterval(timer)
  })

  return { loadedCommit, published, status, checking, checkNow }
}
