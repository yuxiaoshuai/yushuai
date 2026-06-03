import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/yubot-cache-sw.js')
  })
}
