<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ aberta: sidebarAberta }">
      <div class="sidebar-logo">
        <h1>Clinic<span>App</span></h1>
        <p>🏥 Clínica Médica</p>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" :class="{ ativo: rota === 'Dashboard' }">
          <span class="nav-icone">📊</span> Dashboard
        </router-link>
        <router-link to="/agendamento" class="nav-item" :class="{ ativo: rota === 'Agendamento' }">
          <span class="nav-icone">📅</span> Agendar Consulta
        </router-link>
        <router-link to="/minhas-consultas" class="nav-item" :class="{ ativo: rota === 'MinhasConsultas' }">
          <span class="nav-icone">🗂️</span>
          {{ authStore.eSecretario ? 'Todas as Consultas' : 'Minhas Consultas' }}
        </router-link>
        <router-link v-if="authStore.eSecretario" to="/admin" class="nav-item" :class="{ ativo: rota === 'Admin' }">
          <span class="nav-icone">⚙️</span> Painel Admin
        </router-link>
      </nav>

      <div class="sidebar-usuario">
        <div class="usuario-info">
          <div class="avatar">{{ authStore.inicias }}</div>
          <div>
            <div class="usuario-nome">{{ authStore.usuario?.nome?.split(' ')[0] }}</div>
            <div class="usuario-tipo">{{ authStore.usuario?.tipo }}</div>
          </div>
        </div>
        <button class="btn-logout" @click="sair">🚪 Sair</button>
      </div>
    </aside>

    <!-- Overlay do menu mobile -->
    <div v-if="sidebarAberta" class="overlay-mobile" @click="sidebarAberta = false"></div>

    <!-- Conteúdo principal -->
    <main class="conteudo-principal">
      <!-- Header mobile -->
      <div class="mobile-header">
        <button class="menu-toggle" @click="sidebarAberta = !sidebarAberta">☰</button>
        <span class="mobile-titulo">ClinicApp</span>
      </div>

      <!-- Slot para o conteúdo de cada view -->
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarAberta = ref(false)
const rota = computed(() => route.name)

const sair = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.overlay-mobile {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 99;
}

.mobile-header {
  display: none;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.menu-toggle {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: var(--raio-pequeno);
  padding: 8px 12px;
  font-size: 1.1rem;
  cursor: pointer;
}

.mobile-titulo {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--azul-escuro);
}

@media (max-width: 768px) {
  .overlay-mobile { display: block; }
  .mobile-header { display: flex; }
}
</style>
