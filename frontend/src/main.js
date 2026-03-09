// main.js - Ponto de entrada da aplicação Vue.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import './style.css'

const app = createApp(App)

// Registra o Pinia (gerenciamento de estado)
app.use(createPinia())

// Registra o Vue Router (navegação)
app.use(router)

app.mount('#app')
