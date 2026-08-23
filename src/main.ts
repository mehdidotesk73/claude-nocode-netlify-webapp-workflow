import { createApp } from 'vue'
import App from './App.vue'
import { installErrorCapture } from './debug'
import { setupPWA } from './pwa'
import './styles/vars.css'

const app = createApp(App)

// Before mount, so a crash during the first render still reaches the log panel.
installErrorCapture(app)

setupPWA()

app.mount('#app')
