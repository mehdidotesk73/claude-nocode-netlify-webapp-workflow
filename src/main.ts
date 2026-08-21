import { createApp } from 'vue'
import App from './App.vue'
import { setupPWA } from './pwa'
import './styles/vars.css'

const app = createApp(App)

setupPWA()

app.mount('#app')
