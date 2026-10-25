import { ref, computed, onMounted, onUnmounted } from 'vue'
import { logDebug } from '../debug'

export type VersionStatus = 'current' | 'update-ready' | 'unknown'

export interface PublishedVersion {
  commit: string
  builtAt: string
}

// Compares this bundle's build id against the version.json the origin serves
// (emitted by vite.config.ts). Service-worker internals can't tell "up to date"
// from "stale"; only the origin can. In `vite dev` there's no version.json, so
// the status stays 'unknown'.
export function useVersionCheck(intervalMs = 60_000) {
  const published = ref<PublishedVersion | null>(null)
  const status = computed<VersionStatus>(() =>
    !published.value
      ? 'unknown'
      : published.value.commit === __BUILD_ID__
        ? 'current'
        : 'update-ready',
  )

  // Log only when reachability changes, so an offline phone doesn't fill the
  // on-screen log with one error per poll.
  let lastFailed = false

  async function checkNow(): Promise<VersionStatus> {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (typeof body?.commit !== 'string') throw new Error('no commit field')
      published.value = { commit: body.commit, builtAt: String(body.builtAt ?? '') }
      if (lastFailed) logDebug('Version check reachable again.')
      lastFailed = false
    } catch (e) {
      // In `vite dev` there's never a version.json, so stay quiet there.
      if (!lastFailed && !import.meta.env.DEV) logDebug(`Version check failed: ${(e as Error).message}`, 'warn')
      lastFailed = true
    }
    return status.value
  }

  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    checkNow()
    timer = setInterval(checkNow, intervalMs)
  })
  onUnmounted(() => clearInterval(timer))

  return { status, published, checkNow }
}
