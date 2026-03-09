<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-titulo">
        <span>🗂️</span>
        {{ authStore.eSecretario ? 'Todas as Consultas' : 'Minhas Consultas' }}
      </h1>
      <p class="page-subtitulo">
        {{ authStore.eSecretario
          ? 'Gerencie todas as consultas da clínica'
          : 'Visualize e gerencie suas consultas' }}
      </p>
    </div>

    <!-- Filtros -->
    <div class="card filtros-card">
      <div class="filtros">
        <div class="filtro-group">
          <label class="form-label">Filtrar por Status</label>
          <select v-model="filtroStatus" class="form-select">
            <option value="">Todos os status</option>
            <option value="agendada">🟡 Agendada</option>
            <option value="confirmada">✅ Confirmada</option>
            <option value="cancelada">❌ Cancelada</option>
            <option value="realizada">🏥 Realizada</option>
          </select>
        </div>

        <div class="filtro-group" v-if="authStore.eSecretario">
          <label class="form-label">Filtrar por Data</label>
          <input v-model="filtroData" type="date" class="form-input" />
        </div>

        <div class="filtro-group" v-if="authStore.eSecretario">
          <label class="form-label">Filtrar por Médico</label>
          <select v-model="filtroMedico" class="form-select">
            <option value="">Todos os médicos</option>
            <option v-for="m in medicos" :key="m.id" :value="m.id">{{ m.nome }}</option>
          </select>
        </div>

        <div class="filtro-group">
          <label class="form-label">Buscar</label>
          <input v-model="busca" type="text" class="form-input" placeholder="Nome ou especialidade..." />
        </div>

        <button class="btn btn-secundario" @click="limparFiltros">🔄 Limpar</button>
      </div>
    </div>

    <!-- Contagem -->
    <div class="resultados-info">
      <span>{{ consultasFiltradas.length }} consulta(s) encontrada(s)</span>
      <router-link to="/agendamento" class="btn btn-primario btn-sm">
        + Nova Consulta
      </router-link>
    </div>

    <!-- Estado de carregamento -->
    <div v-if="carregando" class="loading">
      <div class="spinner"></div>
      <p>Carregando consultas...</p>
    </div>

    <!-- Estado vazio -->
    <div v-else-if="consultasFiltradas.length === 0" class="card estado-vazio">
      <div class="icone">📭</div>
      <h3>Nenhuma consulta encontrada</h3>
      <p>Tente ajustar os filtros ou agende uma nova consulta.</p>
      <router-link to="/agendamento" class="btn btn-primario" style="margin-top: 20px;">
        📅 Agendar Consulta
      </router-link>
    </div>

    <!-- Lista de consultas em cards -->
    <div v-else class="consultas-lista">
      <div
        v-for="c in consultasFiltradas"
        :key="c.id"
        class="consulta-card"
        :class="`consulta-${c.status}`"
      >
        <div class="consulta-header">
          <div class="consulta-data-hora">
            <span class="consulta-data">📅 {{ formatarData(c.data) }}</span>
            <span class="consulta-hora">🕐 {{ c.hora }}</span>
          </div>
          <span class="badge" :class="`badge-${c.status}`">
            {{ statusIcone(c.status) }} {{ c.status }}
          </span>
        </div>

        <div class="consulta-body">
          <div class="consulta-medico">
            <span class="consulta-label">Médico</span>
            <strong>{{ c.medico_nome }}</strong>
          </div>
          <div class="consulta-esp">
            <span class="consulta-label">Especialidade</span>
            <strong>{{ c.especialidade }}</strong>
          </div>
          <div class="consulta-crm" v-if="c.medico_crm">
            <span class="consulta-label">CRM</span>
            <span>{{ c.medico_crm }}</span>
          </div>

          <!-- Apenas para secretário: mostrar paciente -->
          <div v-if="authStore.eSecretario" class="consulta-paciente">
            <span class="consulta-label">Paciente</span>
            <strong>{{ c.paciente_nome }}</strong>
            <span v-if="c.paciente_cpf" class="cpf">CPF: {{ formatarCPF(c.paciente_cpf) }}</span>
          </div>

          <div v-if="c.observacoes" class="consulta-obs">
            <span class="consulta-label">Observações</span>
            <p>{{ c.observacoes }}</p>
          </div>
        </div>

        <!-- Ações -->
        <div class="consulta-acoes">
          <!-- Secretário pode alterar status -->
          <div v-if="authStore.eSecretario" class="status-change">
            <select
              class="form-select form-select-sm"
              :value="c.status"
              @change="(e) => alterarStatus(c.id, e.target.value)"
            >
              <option value="agendada">🟡 Agendada</option>
              <option value="confirmada">✅ Confirmada</option>
              <option value="cancelada">❌ Cancelada</option>
              <option value="realizada">🏥 Realizada</option>
            </select>
          </div>

          <!-- Paciente pode cancelar suas consultas -->
          <button
            v-if="c.status !== 'cancelada' && c.status !== 'realizada'"
            class="btn btn-perigo btn-sm"
            @click="cancelarConsulta(c.id)"
          >
            ❌ Cancelar
          </button>
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
const medicos = ref([])
const filtroStatus = ref('')
const filtroData = ref('')
const filtroMedico = ref('')
const busca = ref('')

const formatarData = (data) => {
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  })
}

const formatarCPF = (cpf) => {
  if (!cpf) return ''
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const statusIcone = (status) => {
  const icones = { agendada: '🟡', confirmada: '✅', cancelada: '❌', realizada: '🏥' }
  return icones[status] || '❓'
}

// Consultas filtradas
const consultasFiltradas = computed(() => {
  return consultas.value.filter(c => {
    if (filtroStatus.value && c.status !== filtroStatus.value) return false
    if (filtroData.value && c.data !== filtroData.value) return false
    if (filtroMedico.value && c.medico_id !== filtroMedico.value) return false
    if (busca.value) {
      const termo = busca.value.toLowerCase()
      const camposBusca = [c.medico_nome, c.especialidade, c.paciente_nome, c.observacoes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!camposBusca.includes(termo)) return false
    }
    return true
  })
})

const limparFiltros = () => {
  filtroStatus.value = ''
  filtroData.value = ''
  filtroMedico.value = ''
  busca.value = ''
}

const cancelarConsulta = async (id) => {
  if (!confirm('Tem certeza que deseja cancelar esta consulta?')) return
  try {
    await API.delete(`/consultas/${id}`)
    await carregarConsultas()
  } catch (err) {
    alert(err.response?.data?.erro || 'Erro ao cancelar consulta.')
  }
}

const alterarStatus = async (id, novoStatus) => {
  try {
    await API.put(`/consultas/${id}/status`, { status: novoStatus })
    await carregarConsultas()
  } catch (err) {
    alert(err.response?.data?.erro || 'Erro ao alterar status.')
  }
}

const carregarConsultas = async () => {
  carregando.value = true
  try {
    let url = '/consultas'
    const params = new URLSearchParams()
    if (filtroData.value) params.append('data', filtroData.value)
    if (filtroMedico.value) params.append('medico_id', filtroMedico.value)
    if (params.toString()) url += `?${params.toString()}`

    const res = await API.get(url)
    consultas.value = res.data.consultas
  } catch (err) {
    console.error('Erro ao carregar consultas:', err)
  } finally {
    carregando.value = false
  }
}

onMounted(async () => {
  await carregarConsultas()

  if (authStore.eSecretario) {
    try {
      const res = await API.get('/medicos')
      medicos.value = res.data.medicos
    } catch {}
  }
})
</script>

<style scoped>
.filtros-card { margin-bottom: 20px; }
.filtros-card .form-group { margin-bottom: 0; }

.resultados-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  color: var(--cinza);
  font-size: 0.9rem;
  font-weight: 500;
}

.consultas-lista {
  display: grid;
  gap: 16px;
}

.consulta-card {
  background: white;
  border-radius: var(--raio-grande);
  padding: 24px;
  box-shadow: var(--sombra-suave);
  border-left: 5px solid #e2e8f0;
  transition: var(--transicao);
}

.consulta-card:hover {
  box-shadow: var(--sombra-media);
  transform: translateY(-2px);
}

.consulta-agendada { border-left-color: #3b82f6; }
.consulta-confirmada { border-left-color: var(--verde); }
.consulta-cancelada { border-left-color: var(--vermelho); opacity: 0.8; }
.consulta-realizada { border-left-color: var(--cinza); }

.consulta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.consulta-data-hora {
  display: flex;
  gap: 16px;
  align-items: center;
}

.consulta-data { color: var(--cinza); font-size: 0.9rem; }
.consulta-hora { font-weight: 700; font-size: 1.1rem; color: var(--azul-escuro); }

.consulta-body {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.consulta-medico, .consulta-esp, .consulta-crm, .consulta-paciente {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.consulta-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--cinza);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.consulta-paciente { grid-column: 1 / -1; }
.consulta-paciente .cpf { font-size: 0.8rem; color: var(--cinza); }

.consulta-obs {
  grid-column: 1 / -1;
  background: var(--cinza-claro);
  border-radius: var(--raio-pequeno);
  padding: 10px 14px;
}

.consulta-obs p { font-size: 0.88rem; color: var(--cinza); margin: 4px 0 0; }

.consulta-acoes {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--cinza-claro);
  flex-wrap: wrap;
}

.status-change { flex: 1; min-width: 200px; }

.form-select-sm {
  padding: 8px 12px;
  font-size: 0.85rem;
  border: 2px solid #e2e8f0;
  border-radius: var(--raio-pequeno);
  font-family: var(--fonte);
  background: white;
  cursor: pointer;
  width: 100%;
  outline: none;
}

.form-select-sm:focus {
  border-color: var(--verde);
}
</style>
