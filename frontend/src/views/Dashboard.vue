<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-titulo">
        <span>📊</span>
        Bem-vindo, {{ authStore.usuario?.nome?.split(' ')[0] }}!
      </h1>
      <p class="page-subtitulo">
        {{ authStore.eSecretario ? 'Painel administrativo — visão geral do dia' : 'Suas informações de saúde' }}
        | {{ dataHoje }}
      </p>
    </div>

    <!-- Métricas (secretário) ou cards do paciente -->
    <div v-if="authStore.eSecretario">
      <!-- Grid de métricas -->
      <div class="metricas-grid" v-if="!carregando">
        <div class="metrica-card">
          <div class="metrica-icone">📅</div>
          <div class="metrica-valor">{{ metricas.totalHoje }}</div>
          <div class="metrica-label">Consultas Hoje</div>
        </div>
        <div class="metrica-card">
          <div class="metrica-icone">🟡</div>
          <div class="metrica-valor">{{ metricas.agendadas }}</div>
          <div class="metrica-label">Agendadas</div>
        </div>
        <div class="metrica-card">
          <div class="metrica-icone">✅</div>
          <div class="metrica-valor">{{ metricas.confirmadas }}</div>
          <div class="metrica-label">Confirmadas</div>
        </div>
        <div class="metrica-card">
          <div class="metrica-icone">❌</div>
          <div class="metrica-valor">{{ metricas.canceladas }}</div>
          <div class="metrica-label">Canceladas</div>
        </div>
        <div class="metrica-card">
          <div class="metrica-icone">🏥</div>
          <div class="metrica-valor">{{ metricas.realizadas }}</div>
          <div class="metrica-label">Realizadas</div>
        </div>
        <div class="metrica-card">
          <div class="metrica-icone">👥</div>
          <div class="metrica-valor">{{ metricas.totalPacientes }}</div>
          <div class="metrica-label">Total Pacientes</div>
        </div>
      </div>

      <!-- Consultas do dia -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-titulo">📋 Consultas de Hoje</h2>
          <router-link to="/admin" class="btn btn-primario btn-sm">Ver Painel Completo</router-link>
        </div>

        <div v-if="carregando" class="loading">
          <div class="spinner"></div>
          <p>Carregando consultas...</p>
        </div>

        <div v-else-if="consultasHoje.length === 0" class="estado-vazio">
          <div class="icone">📭</div>
          <h3>Nenhuma consulta hoje</h3>
          <p>Não há consultas agendadas para hoje.</p>
        </div>

        <div v-else class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Horário</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Especialidade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in consultasHoje" :key="c.id">
                <td><strong>{{ c.hora }}</strong></td>
                <td>{{ c.paciente_nome }}</td>
                <td>{{ c.medico_nome }}</td>
                <td>{{ c.especialidade }}</td>
                <td>
                  <span class="badge" :class="`badge-${c.status}`">
                    {{ statusIcone(c.status) }} {{ c.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Dashboard do Paciente -->
    <div v-else>
      <!-- Próxima consulta -->
      <div class="proxima-consulta-section" v-if="proximaConsulta">
        <div class="card proxima-card">
          <div class="proxima-badge">PRÓXIMA CONSULTA</div>
          <div class="proxima-info">
            <div class="proxima-data-hora">
              <span class="proxima-data">📅 {{ formatarData(proximaConsulta.data) }}</span>
              <span class="proxima-hora">🕐 {{ proximaConsulta.hora }}</span>
            </div>
            <h3>{{ proximaConsulta.medico_nome }}</h3>
            <p>{{ proximaConsulta.especialidade }}</p>
            <span class="badge" :class="`badge-${proximaConsulta.status}`">
              {{ statusIcone(proximaConsulta.status) }} {{ proximaConsulta.status }}
            </span>
          </div>
          <div class="proxima-acoes">
            <router-link to="/agendamento" class="btn btn-primario">
              📅 Novo Agendamento
            </router-link>
            <button
              class="btn btn-perigo btn-sm"
              @click="cancelarConsulta(proximaConsulta.id)"
              v-if="proximaConsulta.status !== 'cancelada'"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <!-- Cards de ação rápida -->
      <div class="acoes-rapidas">
        <router-link to="/agendamento" class="acao-card">
          <span class="acao-icone">📅</span>
          <strong>Agendar Consulta</strong>
          <p>Marque sua próxima consulta</p>
        </router-link>
        <router-link to="/minhas-consultas" class="acao-card">
          <span class="acao-icone">🗂️</span>
          <strong>Minhas Consultas</strong>
          <p>Veja seu histórico completo</p>
        </router-link>
        <div class="acao-card" style="cursor: default;">
          <span class="acao-icone">📊</span>
          <strong>{{ totalConsultas }} Consultas</strong>
          <p>Histórico total de atendimentos</p>
        </div>
      </div>

      <!-- Lista de próximas consultas -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-titulo">📋 Próximas Consultas</h2>
          <router-link to="/minhas-consultas" class="btn btn-secundario btn-sm">Ver todas</router-link>
        </div>

        <div v-if="carregando" class="loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="proximasConsultas.length === 0" class="estado-vazio">
          <div class="icone">📭</div>
          <h3>Nenhuma consulta futura</h3>
          <p>Você não tem consultas agendadas.</p>
          <router-link to="/agendamento" class="btn btn-primario" style="margin-top: 16px;">
            📅 Agendar Agora
          </router-link>
        </div>

        <div v-else class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Horário</th>
                <th>Médico</th>
                <th>Especialidade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in proximasConsultas" :key="c.id">
                <td>{{ formatarData(c.data) }}</td>
                <td><strong>{{ c.hora }}</strong></td>
                <td>{{ c.medico_nome }}</td>
                <td>{{ c.especialidade }}</td>
                <td>
                  <span class="badge" :class="`badge-${c.status}`">
                    {{ statusIcone(c.status) }} {{ c.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore, API } from '../stores/auth.js'
import Layout from './Layout.vue'

const authStore = useAuthStore()
const carregando = ref(true)
const consultas = ref([])
const metricas = ref({
  totalHoje: 0, agendadas: 0, confirmadas: 0, canceladas: 0, realizadas: 0, totalPacientes: 0
})
const consultasHoje = ref([])

// Data formatada em português
const dataHoje = computed(() => {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
})

// Próxima consulta não cancelada
const proximaConsulta = computed(() => {
  const hoje = new Date().toISOString().split('T')[0]
  return consultas.value.find(c =>
    c.data >= hoje && c.status !== 'cancelada'
  ) || null
})

// Próximas 5 consultas
const proximasConsultas = computed(() => {
  const hoje = new Date().toISOString().split('T')[0]
  return consultas.value
    .filter(c => c.data >= hoje && c.status !== 'cancelada')
    .slice(0, 5)
})

const totalConsultas = computed(() => consultas.value.length)

const formatarData = (data) => {
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const statusIcone = (status) => {
  const icones = { agendada: '🟡', confirmada: '✅', cancelada: '❌', realizada: '🏥' }
  return icones[status] || '❓'
}

const cancelarConsulta = async (id) => {
  if (!confirm('Deseja cancelar esta consulta?')) return
  try {
    await API.delete(`/consultas/${id}`)
    await carregarDados()
  } catch (err) {
    alert(err.response?.data?.erro || 'Erro ao cancelar consulta.')
  }
}

const carregarDados = async () => {
  carregando.value = true
  try {
    if (authStore.eSecretario) {
      const res = await API.get('/consultas/hoje')
      consultasHoje.value = res.data.consultas
      metricas.value = res.data.metricas
    } else {
      const res = await API.get('/consultas')
      consultas.value = res.data.consultas
    }
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err)
  } finally {
    carregando.value = false
  }
}

onMounted(carregarDados)
</script>

<style scoped>
.proxima-consulta-section {
  margin-bottom: 24px;
}

.proxima-card {
  background: var(--gradiente-principal);
  color: white;
  position: relative;
  overflow: hidden;
}

.proxima-card::before {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(46, 204, 113, 0.15);
  right: -50px;
  top: -50px;
}

.proxima-card .card-header,
.proxima-card p { color: rgba(255,255,255,0.7); }

.proxima-badge {
  display: inline-block;
  background: var(--verde);
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.proxima-info { margin-bottom: 20px; }

.proxima-data-hora {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
}

.proxima-data, .proxima-hora {
  color: rgba(255,255,255,0.8);
  font-size: 0.9rem;
}

.proxima-info h3 {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.proxima-info .badge {
  margin-top: 8px;
}

.proxima-acoes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Cards de ação rápida */
.acoes-rapidas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.acao-card {
  background: white;
  border-radius: var(--raio-grande);
  padding: 28px;
  box-shadow: var(--sombra-suave);
  text-decoration: none;
  color: var(--azul-escuro);
  transition: var(--transicao);
  border: 2px solid transparent;
}

.acao-card:hover {
  border-color: var(--verde);
  transform: translateY(-4px);
  box-shadow: var(--sombra-media);
  color: var(--azul-escuro);
}

.acao-icone {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}

.acao-card strong {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.acao-card p {
  font-size: 0.85rem;
}
</style>
