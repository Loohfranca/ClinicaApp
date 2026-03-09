<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-titulo">
        <span>⚙️</span> Painel Administrativo
      </h1>
      <p class="page-subtitulo">Gerencie médicos, pacientes e consultas da clínica</p>
    </div>

    <!-- Tabs de navegação -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ ativa: tabAtiva === tab.id }"
        @click="tabAtiva = tab.id"
      >
        {{ tab.icone }} {{ tab.label }}
      </button>
    </div>

    <!-- TAB: Dashboard -->
    <div v-if="tabAtiva === 'dashboard'" class="tab-conteudo">
      <div v-if="carregandoDash" class="loading">
        <div class="spinner"></div>
      </div>
      <div v-else>
        <div class="metricas-grid">
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

        <!-- Tabela do dia -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-titulo">📋 Agenda de Hoje</h2>
            <input type="date" v-model="dataFiltro" class="form-input" style="width:180px;"
              @change="carregarDashboard" />
          </div>
          <div v-if="consultasHoje.length === 0" class="estado-vazio">
            <div class="icone">📭</div>
            <h3>Nenhuma consulta hoje</h3>
          </div>
          <div v-else class="tabela-container">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Médico</th>
                  <th>Especialidade</th>
                  <th>Status</th>
                  <th>Ações</th>
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
                  <td>
                    <select class="form-select-sm" :value="c.status"
                      @change="(e) => alterarStatus(c.id, e.target.value)">
                      <option value="agendada">Agendada</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="realizada">Realizada</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: Médicos -->
    <div v-if="tabAtiva === 'medicos'" class="tab-conteudo">
      <div class="card">
        <div class="card-header">
          <h2 class="card-titulo">👨‍⚕️ Médicos Cadastrados</h2>
          <button class="btn btn-primario btn-sm" @click="mostrarFormMedico = !mostrarFormMedico">
            {{ mostrarFormMedico ? '✕ Cancelar' : '+ Novo Médico' }}
          </button>
        </div>

        <!-- Formulário de novo médico -->
        <div v-if="mostrarFormMedico" class="form-novo-medico">
          <div v-if="erroMedico" class="alerta alerta-erro">⚠️ {{ erroMedico }}</div>
          <div v-if="sucessoMedico" class="alerta alerta-sucesso">✅ {{ sucessoMedico }}</div>

          <form @submit.prevent="salvarMedico" class="form-médico">
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Nome Completo *</label>
                <input v-model="formMedico.nome" type="text" class="form-input"
                  placeholder="Dr. João Silva" required />
              </div>
              <div class="form-group">
                <label class="form-label">Especialidade *</label>
                <input v-model="formMedico.especialidade" type="text" class="form-input"
                  placeholder="Cardiologia" required />
              </div>
              <div class="form-group">
                <label class="form-label">CRM *</label>
                <input v-model="formMedico.crm" type="text" class="form-input"
                  placeholder="CRM-SP 12345" required />
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Telefone</label>
                <input v-model="formMedico.telefone" type="tel" class="form-input"
                  placeholder="(11) 99999-0000" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input v-model="formMedico.email" type="email" class="form-input"
                  placeholder="medico@clinica.com" />
              </div>
              <div class="form-group d-flex align-end">
                <button type="submit" class="btn btn-primario w-full" :disabled="salvandoMedico">
                  {{ salvandoMedico ? 'Salvando...' : '✅ Salvar Médico' }}
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Lista de médicos -->
        <div v-if="carregandoMedicos" class="loading"><div class="spinner"></div></div>
        <div v-else class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Especialidade</th>
                <th>CRM</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in medicos" :key="m.id">
                <td><strong>{{ m.nome }}</strong></td>
                <td>{{ m.especialidade }}</td>
                <td><code>{{ m.crm }}</code></td>
                <td>{{ m.email || m.telefone || '—' }}</td>
                <td>
                  <span class="badge" :class="m.ativo ? 'badge-confirmada' : 'badge-cancelada'">
                    {{ m.ativo ? '✅ Ativo' : '❌ Inativo' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm"
                    :class="m.ativo ? 'btn-perigo' : 'btn-primario'"
                    @click="toggleMedico(m)">
                    {{ m.ativo ? 'Desativar' : 'Ativar' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB: Pacientes -->
    <div v-if="tabAtiva === 'pacientes'" class="tab-conteudo">
      <div class="card">
        <div class="card-header">
          <h2 class="card-titulo">👥 Pacientes Cadastrados</h2>
          <input v-model="buscaPaciente" type="text" class="form-input"
            style="width: 250px;" placeholder="🔍 Buscar paciente..." />
        </div>

        <div v-if="carregandoPacientes" class="loading"><div class="spinner"></div></div>
        <div v-else-if="pacientesFiltrados.length === 0" class="estado-vazio">
          <div class="icone">👥</div>
          <h3>Nenhum paciente encontrado</h3>
        </div>
        <div v-else class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>CPF</th>
                <th>Cidade</th>
                <th>Telefone</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in pacientesFiltrados" :key="p.id">
                <td><strong>{{ p.nome }}</strong></td>
                <td>{{ p.email }}</td>
                <td>{{ formatarCPF(p.cpf) || '—' }}</td>
                <td>{{ p.cidade ? `${p.cidade}/${p.estado}` : '—' }}</td>
                <td>{{ p.telefone || '—' }}</td>
                <td>{{ formatarDataCurta(p.criado_em) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { API } from '../stores/auth.js'
import Layout from './Layout.vue'

const tabAtiva = ref('dashboard')
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icone: '📊' },
  { id: 'medicos', label: 'Médicos', icone: '👨‍⚕️' },
  { id: 'pacientes', label: 'Pacientes', icone: '👥' }
]

// Dashboard
const carregandoDash = ref(true)
const metricas = ref({
  totalHoje: 0, agendadas: 0, confirmadas: 0, canceladas: 0, realizadas: 0, totalPacientes: 0
})
const consultasHoje = ref([])
const dataFiltro = ref(new Date().toISOString().split('T')[0])

// Médicos
const carregandoMedicos = ref(false)
const medicos = ref([])
const mostrarFormMedico = ref(false)
const salvandoMedico = ref(false)
const erroMedico = ref('')
const sucessoMedico = ref('')
const formMedico = reactive({ nome: '', especialidade: '', crm: '', telefone: '', email: '' })

// Pacientes
const carregandoPacientes = ref(false)
const pacientes = ref([])
const buscaPaciente = ref('')

const statusIcone = (status) => {
  const icones = { agendada: '🟡', confirmada: '✅', cancelada: '❌', realizada: '🏥' }
  return icones[status] || '❓'
}

const formatarCPF = (cpf) => {
  if (!cpf) return ''
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const formatarDataCurta = (dt) => {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('pt-BR')
}

const pacientesFiltrados = computed(() => {
  if (!buscaPaciente.value) return pacientes.value
  const termo = buscaPaciente.value.toLowerCase()
  return pacientes.value.filter(p =>
    [p.nome, p.email, p.cpf, p.cidade].filter(Boolean).join(' ').toLowerCase().includes(termo)
  )
})

const carregarDashboard = async () => {
  carregandoDash.value = true
  try {
    const res = await API.get(`/consultas/hoje?data=${dataFiltro.value}`)
    consultasHoje.value = res.data.consultas
    metricas.value = res.data.metricas
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err)
  } finally {
    carregandoDash.value = false
  }
}

const alterarStatus = async (id, novoStatus) => {
  try {
    await API.put(`/consultas/${id}/status`, { status: novoStatus })
    await carregarDashboard()
  } catch (err) {
    alert(err.response?.data?.erro || 'Erro ao alterar status.')
  }
}

const carregarMedicos = async () => {
  carregandoMedicos.value = true
  try {
    const res = await API.get('/medicos/todos')
    medicos.value = res.data.medicos
  } catch {
    console.error('Erro ao carregar médicos')
  } finally {
    carregandoMedicos.value = false
  }
}

const salvarMedico = async () => {
  salvandoMedico.value = true
  erroMedico.value = ''
  sucessoMedico.value = ''

  try {
    await API.post('/medicos', formMedico)
    sucessoMedico.value = `Médico ${formMedico.nome} cadastrado com sucesso!`

    // Reseta o formulário
    Object.assign(formMedico, { nome: '', especialidade: '', crm: '', telefone: '', email: '' })

    await carregarMedicos()
    setTimeout(() => { mostrarFormMedico.value = false; sucessoMedico.value = '' }, 2000)
  } catch (err) {
    erroMedico.value = err.response?.data?.erro || 'Erro ao cadastrar médico.'
  } finally {
    salvandoMedico.value = false
  }
}

const toggleMedico = async (medico) => {
  const acao = medico.ativo ? 'desativar' : 'ativar'
  if (!confirm(`Deseja ${acao} o médico ${medico.nome}?`)) return

  try {
    await API.put(`/medicos/${medico.id}`, { ...medico, ativo: medico.ativo ? 0 : 1 })
    await carregarMedicos()
  } catch (err) {
    alert(err.response?.data?.erro || `Erro ao ${acao} médico.`)
  }
}

const carregarPacientes = async () => {
  carregandoPacientes.value = true
  try {
    const res = await API.get('/pacientes')
    pacientes.value = res.data.pacientes
  } catch {
    console.error('Erro ao carregar pacientes')
  } finally {
    carregandoPacientes.value = false
  }
}

// Carrega dados ao mudar de tab
watch(tabAtiva, (nova) => {
  if (nova === 'medicos' && medicos.value.length === 0) carregarMedicos()
  if (nova === 'pacientes' && pacientes.value.length === 0) carregarPacientes()
})

onMounted(carregarDashboard)
</script>

<style scoped>
/* Tabs */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: white;
  padding: 6px;
  border-radius: var(--raio);
  box-shadow: var(--sombra-suave);
  width: fit-content;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--raio-pequeno);
  font-family: var(--fonte);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--cinza);
  background: transparent;
  transition: var(--transicao);
}

.tab-btn:hover {
  background: var(--cinza-claro);
  color: var(--azul-escuro);
}

.tab-btn.ativa {
  background: var(--azul-escuro);
  color: white;
}

.tab-conteudo { animation: fadeIn 0.3s ease; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Formulário de médico */
.form-novo-medico {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--cinza-claro);
  border-radius: var(--raio);
}

.form-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 12px;
}

.form-row-3:last-child { margin-bottom: 0; }

.align-end { align-items: flex-end; }

/* Tabela */
.form-select-sm {
  padding: 6px 10px;
  font-size: 0.82rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-family: var(--fonte);
  background: white;
  cursor: pointer;
  outline: none;
  min-width: 120px;
}

code {
  background: var(--cinza-claro);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .form-row-3 { grid-template-columns: 1fr; }
  .tabs { width: 100%; overflow-x: auto; }
}
</style>
