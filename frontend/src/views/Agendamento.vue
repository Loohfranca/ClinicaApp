<template>
  <Layout>
    <div class="page-header">
      <h1 class="page-titulo">
        <span>📅</span> Agendar Consulta
      </h1>
      <p class="page-subtitulo">Escolha o médico, data e horário para sua consulta</p>
    </div>

    <div class="agendamento-grid">
      <!-- Formulário de agendamento -->
      <div class="card">
        <div v-if="sucesso" class="alerta alerta-sucesso">✅ {{ sucesso }}</div>
        <div v-if="erro" class="alerta alerta-erro">⚠️ {{ erro }}</div>

        <!-- Alerta de chuva 🌧️ -->
        <div v-if="alertaChuva" class="alerta-chuva">
          <span class="icone-chuva">🌧️</span>
          <div>
            <strong>Previsão de Chuva!</strong>
            <p>{{ alertaChuva }}</p>
          </div>
        </div>

        <form @submit.prevent="agendar" class="form-agendamento">
          <!-- Paciente (apenas secretário vê esta opção) -->
          <div class="form-group" v-if="authStore.eSecretario">
            <label class="form-label" for="paciente">Paciente *</label>
            <select id="paciente" v-model="form.paciente_id" class="form-select">
              <option value="">Selecione o paciente (ou deixe vazio para si mesmo)</option>
              <option v-for="p in pacientes" :key="p.id" :value="p.id">
                {{ p.nome }} — {{ p.cpf || p.email }}
              </option>
            </select>
          </div>

          <!-- Especialidade -->
          <div class="form-group">
            <label class="form-label" for="especialidade">Especialidade *</label>
            <select
              id="especialidade"
              v-model="form.especialidade"
              class="form-select"
              @change="filtrarMedicos"
              required
            >
              <option value="">Selecione a especialidade</option>
              <option v-for="esp in especialidades" :key="esp" :value="esp">{{ esp }}</option>
            </select>
          </div>

          <!-- Médico -->
          <div class="form-group">
            <label class="form-label" for="medico">Médico *</label>
            <select
              id="medico"
              v-model="form.medico_id"
              class="form-select"
              :disabled="!form.especialidade"
              required
            >
              <option value="">
                {{ form.especialidade ? 'Selecione o médico' : 'Primeiro selecione a especialidade' }}
              </option>
              <option v-for="m in medicosFiltrados" :key="m.id" :value="m.id">
                {{ m.nome }} — CRM: {{ m.crm }}
              </option>
            </select>
          </div>

          <!-- Data e Hora -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="data">Data *</label>
              <input
                id="data"
                v-model="form.data"
                type="date"
                class="form-input"
                :min="dataMinima"
                :max="dataMaxima"
                @change="onDataChange"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="hora">Horário *</label>
              <select id="hora" v-model="form.hora" class="form-select" required>
                <option value="">Selecione</option>
                <option v-for="h in horariosDisponiveis" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
          </div>

          <!-- Observações -->
          <div class="form-group">
            <label class="form-label" for="obs">Observações</label>
            <textarea
              id="obs"
              v-model="form.observacoes"
              class="form-textarea"
              placeholder="Descreva brevemente o motivo da consulta, sintomas ou informações relevantes..."
              rows="4"
            ></textarea>
          </div>

          <!-- Indicador de clima (após escolher a data) -->
          <div v-if="climaInfo" class="clima-info">
            <div class="clima-header">
              <span class="clima-icone">{{ climaInfo.icone }}</span>
              <strong>{{ climaInfo.titulo }}</strong>
            </div>
            <p>{{ climaInfo.descricao }}</p>
          </div>

          <button
            type="submit"
            class="btn btn-primario w-full btn-lg"
            :disabled="carregando"
          >
            <span v-if="carregando" class="spinner-mini"></span>
            {{ carregando ? 'Agendando...' : '📅 Confirmar Agendamento' }}
          </button>
        </form>
      </div>

      <!-- Painel lateral: info e dicas -->
      <div class="painel-lateral">
        <!-- Info sobre o médico selecionado -->
        <div class="card medico-info" v-if="medicoSelecionado">
          <h3>👨‍⚕️ {{ medicoSelecionado.nome }}</h3>
          <div class="medico-detalhe">
            <span>🏥 Especialidade:</span>
            <strong>{{ medicoSelecionado.especialidade }}</strong>
          </div>
          <div class="medico-detalhe">
            <span>💳 CRM:</span>
            <strong>{{ medicoSelecionado.crm }}</strong>
          </div>
        </div>

        <!-- Horários disponíveis por turno -->
        <div class="card turnos-card">
          <h3 class="card-titulo">⏰ Horários Disponíveis</h3>
          <div class="turno">
            <h4>🌅 Manhã</h4>
            <div class="horarios-grid">
              <span v-for="h in horariosManha" :key="h"
                class="horario-chip"
                :class="{
                  'selecionado': form.hora === h,
                  'indisponivel': horariosOcupados.includes(h)
                }"
                @click="!horariosOcupados.includes(h) && (form.hora = h)"
              >{{ h }}</span>
            </div>
          </div>
          <div class="turno">
            <h4>☀️ Tarde</h4>
            <div class="horarios-grid">
              <span v-for="h in horariosTarde" :key="h"
                class="horario-chip"
                :class="{
                  'selecionado': form.hora === h,
                  'indisponivel': horariosOcupados.includes(h)
                }"
                @click="!horariosOcupados.includes(h) && (form.hora = h)"
              >{{ h }}</span>
            </div>
          </div>
          <p class="legenda-horarios">
            <span class="chip-dis"></span> Disponível
            <span class="chip-ocu"></span> Ocupado
            <span class="chip-sel"></span> Selecionado
          </p>
        </div>

        <!-- Dicas -->
        <div class="card dicas-card">
          <h3>💡 Dicas</h3>
          <ul>
            <li>Chegue 15 minutos antes da consulta</li>
            <li>Leve documentos de identidade e carteirinha do plano</li>
            <li>Se precisar cancelar, faça com pelo menos 24h de antecedência</li>
          </ul>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore, API } from '../stores/auth.js'
import Layout from './Layout.vue'

const authStore = useAuthStore()

const carregando = ref(false)
const sucesso = ref('')
const erro = ref('')
const alertaChuva = ref('')
const climaInfo = ref(null)
const medicos = ref([])
const pacientes = ref([])
const horariosOcupados = ref([])

const form = reactive({
  paciente_id: '',
  especialidade: '',
  medico_id: '',
  data: '',
  hora: '',
  observacoes: ''
})

// Data mínima = hoje, máxima = 6 meses à frente
const dataMinima = computed(() => new Date().toISOString().split('T')[0])
const dataMaxima = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() + 6)
  return d.toISOString().split('T')[0]
})

// Horários disponíveis por turno
const horariosManha = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
const horariosTarde = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']
const horariosDisponiveis = computed(() =>
  [...horariosManha, ...horariosTarde].filter(h => !horariosOcupados.value.includes(h))
)

// Médico selecionado
const medicoSelecionado = computed(() =>
  medicos.value.find(m => m.id === form.medico_id) || null
)

// Especialidades únicas
const especialidades = computed(() => {
  return [...new Set(medicos.value.map(m => m.especialidade))].sort()
})

// Médicos filtrados por especialidade
const medicosFiltrados = computed(() => {
  if (!form.especialidade) return medicos.value
  return medicos.value.filter(m => m.especialidade === form.especialidade)
})

const filtrarMedicos = () => {
  form.medico_id = ''
  form.hora = ''
}

// Quando mudar data ou médico, verifica horários ocupados e clima
const onDataChange = async () => {
  form.hora = ''
  sucesso.value = ''
  alertaChuva.value = ''
  climaInfo.value = null

  if (form.data) {
    await verificarClima(form.data)
    if (form.medico_id) {
      await buscarHorariosOcupados()
    }
  }
}

watch(() => form.medico_id, async () => {
  form.hora = ''
  if (form.data && form.medico_id) {
    await buscarHorariosOcupados()
  }
})

// Busca horários ocupados para o médico+data
const buscarHorariosOcupados = async () => {
  try {
    const res = await API.get(`/consultas?medico_id=${form.medico_id}&data=${form.data}`)
    horariosOcupados.value = res.data.consultas
      .filter(c => c.status !== 'cancelada')
      .map(c => c.hora)
  } catch {
    horariosOcupados.value = []
  }
}

// Verifica previsão do tempo via Open-Meteo
const verificarClima = async (data) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&daily=precipitation_sum&timezone=America/Sao_Paulo&start_date=${data}&end_date=${data}`
    const res = await fetch(url)
    const dados = await res.json()

    const precipitacao = dados.daily?.precipitation_sum?.[0] ?? 0

    if (precipitacao > 0) {
      alertaChuva.value = `Precipitação prevista: ${precipitacao.toFixed(1)}mm. Considere confirmar sua presença ou trazer guarda-chuva!`
      climaInfo.value = {
        icone: '🌧️',
        titulo: 'Chuva Esperada',
        descricao: `Previsão de ${precipitacao.toFixed(1)}mm de chuva para este dia em São Paulo.`
      }
    } else {
      climaInfo.value = {
        icone: '☀️',
        titulo: 'Dia sem chuva',
        descricao: 'A previsão é de tempo seco para este dia. Ótimo para sair de casa!'
      }
    }
  } catch (err) {
    // Falha silenciosa na API de clima
    console.warn('Não foi possível verificar o clima:', err)
  }
}

// Submissão do formulário
const agendar = async () => {
  if (!form.medico_id || !form.data || !form.hora || !form.especialidade) {
    erro.value = 'Preencha todos os campos obrigatórios.'
    return
  }

  carregando.value = true
  erro.value = ''
  sucesso.value = ''

  try {
    await API.post('/consultas', {
      medico_id: form.medico_id,
      data: form.data,
      hora: form.hora,
      especialidade: form.especialidade,
      observacoes: form.observacoes || undefined,
      paciente_id: form.paciente_id || undefined
    })

    sucesso.value = '🎉 Consulta agendada com sucesso!'

    // Limpa o formulário
    form.especialidade = ''
    form.medico_id = ''
    form.data = ''
    form.hora = ''
    form.observacoes = ''
    alertaChuva.value = ''
    climaInfo.value = null
    horariosOcupados.value = []

    // Scrola para o topo para ver a mensagem
    window.scrollTo({ top: 0, behavior: 'smooth' })

  } catch (err) {
    erro.value = err.response?.data?.erro || 'Erro ao agendar consulta.'
  } finally {
    carregando.value = false
  }
}

onMounted(async () => {
  try {
    const resMedicos = await API.get('/medicos')
    medicos.value = resMedicos.data.medicos

    if (authStore.eSecretario) {
      const resPacientes = await API.get('/pacientes')
      pacientes.value = resPacientes.data.pacientes
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
  }
})
</script>

<style scoped>
.agendamento-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}

.form-agendamento { display: flex; flex-direction: column; gap: 4px; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Info do médico */
.medico-info h3 { margin-bottom: 16px; font-size: 1rem; }

.medico-detalhe {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--cinza-claro);
  font-size: 0.9rem;
}

.medico-detalhe:last-child { border-bottom: none; }
.medico-detalhe span { color: var(--cinza); }

/* Horários */
.turnos-card { margin-top: 0; }
.turno { margin-bottom: 16px; }
.turno h4 { font-size: 0.85rem; color: var(--cinza); margin-bottom: 8px; font-weight: 600; }

.horarios-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.horario-chip {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--cinza-claro);
  color: var(--azul-escuro);
  transition: var(--transicao-rapida);
  border: 2px solid transparent;
  user-select: none;
}

.horario-chip:hover:not(.indisponivel) {
  border-color: var(--verde);
  background: var(--verde-claro);
}

.horario-chip.selecionado {
  background: var(--verde);
  color: white;
  border-color: var(--verde-escuro);
}

.horario-chip.indisponivel {
  background: var(--vermelho-claro);
  color: #c0392b;
  cursor: not-allowed;
  opacity: 0.7;
  text-decoration: line-through;
}

.legenda-horarios {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--cinza);
  margin-top: 8px;
}

.chip-dis, .chip-ocu, .chip-sel {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.chip-dis { background: var(--cinza-claro); }
.chip-ocu { background: var(--vermelho-claro); }
.chip-sel { background: var(--verde); }

/* Dicas */
.dicas-card h3 { margin-bottom: 12px; font-size: 1rem; }
.dicas-card ul { list-style: none; }
.dicas-card li {
  padding: 8px 0;
  color: var(--cinza);
  font-size: 0.88rem;
  border-bottom: 1px solid var(--cinza-claro);
  padding-left: 20px;
  position: relative;
}
.dicas-card li::before {
  content: '•';
  position: absolute;
  left: 4px;
  color: var(--verde);
  font-weight: 700;
}
.dicas-card li:last-child { border-bottom: none; }

/* Info do clima */
.clima-info {
  background: var(--cinza-claro);
  border-radius: var(--raio);
  padding: 14px 16px;
  margin-bottom: 8px;
}

.clima-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.clima-icone { font-size: 1.5rem; }

.clima-info p { font-size: 0.85rem; }

.spinner-mini {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: girar 0.6s linear infinite;
  display: inline-block;
}

@media (max-width: 900px) {
  .agendamento-grid { grid-template-columns: 1fr; }
  .painel-lateral { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-row { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .painel-lateral { grid-template-columns: 1fr; }
}
</style>
