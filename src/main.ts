import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from '@/store/settings'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

useSettingsStore(pinia).hydrate()

app.mount('#app')
