import { reactive } from 'vue'
import type { App } from 'vue'

interface LogEntry {
  time: string
  kind: 'log' | 'error' | 'warn'
  msg: string
  count: number
}

export const debugState = reactive({
  logs: [] as LogEntry[],
})

// Bound before any patching below, so writing to the log panel can never
// re-enter the patched console and record itself a second time.
const nativeConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}

/** Append to the buffer only — no console output. */
function record(msg: string, kind: LogEntry['kind']) {
  const last = debugState.logs[debugState.logs.length - 1]

  // A broken handler can fire the same error on every tap, or every frame.
  // Collapsing repeats keeps the one useful message from being pushed out of
  // a 100-entry buffer by copies of itself.
  if (last && last.kind === kind && last.msg === msg) {
    last.count++
    return
  }

  debugState.logs.push({ time: new Date().toLocaleTimeString(), kind, msg, count: 1 })

  if (debugState.logs.length > 100) debugState.logs.shift()
}

export function logDebug(msg: string, kind: LogEntry['kind'] = 'log') {
  record(msg, kind)
  nativeConsole[kind](`[${new Date().toLocaleTimeString()}] ${msg}`)
}

/** Render anything that reached the console as one readable line. */
function format(value: unknown): string {
  if (typeof value === 'string') return value

  if (value instanceof Error) {
    const frames = (value.stack || '')
      .split('\n')
      .slice(1, 4)
      .map((f) => f.trim())
      .join(' ← ')
    return frames ? `${value.name}: ${value.message} · ${frames}` : `${value.name}: ${value.message}`
  }

  try {
    const json = JSON.stringify(value)
    if (json === undefined) return String(value)
    return json.length > 400 ? `${json.slice(0, 400)}…` : json
  } catch {
    return String(value)
  }
}

const formatAll = (args: unknown[]) => args.map(format).join(' ')

/**
 * Route every error the app can produce into the on-screen log.
 *
 * The user is on a phone with no console, so an error they can't see is an
 * error they can't report. Four sources, and they catch different things —
 * dropping any one leaves a class of failure invisible:
 *
 *  - `app.config.errorHandler` — Vue catches throws inside event handlers,
 *    lifecycle hooks and watchers itself. Without this they reach nothing
 *    else, which is exactly the "button does nothing" case.
 *  - `console.error` / `console.warn` — anything a library or our own code
 *    logs directly, including Vue's own warnings.
 *  - `window.error` — plain script errors and (in the capture phase) failed
 *    image/script/stylesheet loads, which don't bubble.
 *  - `unhandledrejection` — a rejected promise nobody caught: the failed
 *    `fetch` in an async click handler that silently does nothing.
 *
 * Call before `app.mount()` so errors during the first render are caught too.
 */
export function installErrorCapture(app: App) {
  app.config.errorHandler = (err, _instance, info) => {
    record(`${format(err)} (in ${info})`, 'error')
    nativeConsole.error(err)
  }

  console.error = (...args: unknown[]) => {
    record(formatAll(args), 'error')
    nativeConsole.error(...args)
  }

  console.warn = (...args: unknown[]) => {
    record(formatAll(args), 'warn')
    nativeConsole.warn(...args)
  }

  window.addEventListener(
    'error',
    (e) => {
      const el = e.target as (HTMLElement & { src?: string; href?: string }) | null

      // Resource failures (img/script/link) target the element, not the window,
      // and carry no message — report what failed to load instead.
      if (el && el !== (window as unknown as HTMLElement) && el.tagName) {
        record(`Failed to load ${el.tagName.toLowerCase()}: ${el.src || el.href || '(unknown)'}`, 'error')
        return
      }

      record(e.error ? format(e.error) : `${e.message} (${e.filename}:${e.lineno})`, 'error')
    },
    true, // capture phase — resource errors don't bubble to window
  )

  window.addEventListener('unhandledrejection', (e) => {
    record(`Unhandled promise rejection: ${format(e.reason)}`, 'error')
  })
}

/** The log as one block of text, for the Copy log button. */
export function logAsText(buildId: string, buildTime: string): string {
  return [
    `build ${buildId} · ${buildTime}`,
    `${navigator.userAgent}`,
    `${location.href}`,
    '',
    ...debugState.logs.map(
      (l) => `${l.time} [${l.kind}] ${l.msg}${l.count > 1 ? ` (×${l.count})` : ''}`,
    ),
  ].join('\n')
}
