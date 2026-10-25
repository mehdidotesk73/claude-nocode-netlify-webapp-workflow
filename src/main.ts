import { createApp } from 'vue'
import App from './App.vue'
import { installErrorCapture } from './debug'
import './styles/vars.css'

const app = createApp(App)

// Before mount, so a crash during the first render still reaches the log panel.
installErrorCapture(app)

// "Reload latest" adds ?fresh=<ts> to bust caches; drop it so it isn't
// bookmarked or shared. The service worker is registered from App.vue.
const loaded = new URL(location.href)
if (loaded.searchParams.has('fresh')) {
  loaded.searchParams.delete('fresh')
  history.replaceState(history.state, '', loaded.toString())
}

app.mount('#app')
