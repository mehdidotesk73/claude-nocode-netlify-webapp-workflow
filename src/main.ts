import { createApp } from 'vue'
import App from './App.vue'
import { installErrorCapture } from './debug'
import './styles/vars.css'

const app = createApp(App)

// Before mount, so a crash during the first render still reaches the log panel.
installErrorCapture(app)

// "Reload latest" navigates with a `?fresh=<ts>` cache-buster to get past the
// service-worker and HTTP caches. Tidy it out of the URL once loaded.
try {
  const url = new URL(window.location.href)
  if (url.searchParams.has('fresh')) {
    url.searchParams.delete('fresh')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  }
} catch {
  // Non-fatal — a stray query param is harmless.
}

app.mount('#app')
