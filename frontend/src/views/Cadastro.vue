<template>
  <div class="auth-page">
    <!-- Lado esquerdo: visual -->
    <div class="auth-esquerda">
      <div class="auth-branding">
        <div class="logo-grande">
          <span class="logo-icone">🏥</span>
          <h1>Clinic<span>App</span></h1>
        </div>
        <p class="auth-slogan">Crie sua conta e comece a cuidar da saúde</p>
        <div class="passos">
          <div class="passo" :class="{ ativo: etapaAtual >= 1 }">
            <div class="passo-num">1</div>
            <span>Dados Pessoais</span>
          </div>
          <div class="passo-linha" :class="{ ativo: etapaAtual >= 2 }"></div>
          <div class="passo" :class="{ ativo: etapaAtual >= 2 }">
            <div class="passo-num">2</div>
            <span>Endereço</span>
          </div>
          <div class="passo-linha" :class="{ ativo: etapaAtual >= 3 }"></div>
          <div class="passo" :class="{ ativo: etapaAtual >= 3 }">
            <div class="passo-num">3</div>
            <span>Confirmação</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Lado direito: formulário -->
    <div class="auth-direita">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Criar Conta 🩺</h2>
          <p>{{ etapaAtual === 1 ? 'Dados pessoais' : etapaAtual === 2 ? 'Endereço (opcional)' : 'Revise e confirme' }}</p>
        </div>

        <!-- Alerta de erro -->
        <div v-if="erro" class="alerta alerta-erro">⚠️ {{ erro }}</div>
        <div v-if="sucesso" class="alerta alerta-sucesso">✅ {{ sucesso }}</div>

        <!-- ETAPA 1: Dados pessoais -->
        <form v-if="etapaAtual === 1" @submit.prevent="proxima" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="nome">Nome Completo *</label>
            <input id="nome" v-model="form.nome" type="text" class="form-input"
              :class="{ erro: erros.nome }" placeholder="João da Silva" required />
            <span v-if="erros.nome" class="form-erro">{{ erros.nome }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email *</label>
            <input id="email" v-model="form.email" type="email" class="form-input"
              :class="{ erro: erros.email }" placeholder="seu@email.com" required />
            <span v-if="erros.email" class="form-erro">{{ erros.email }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="cpf">CPF</label>
            <input id="cpf" v-model="form.cpf" type="text" class="form-input"
              placeholder="000.000.000-00" maxlength="14"
              @input="formatarCPF" />
          </div>

          <div class="form-group">
            <label class="form-label" for="telefone">Telefone</label>
            <input id="telefone" v-model="form.telefone" type="tel" class="form-input"
              placeholder="(11) 99999-8888" />
          </div>

          <div class="form-group">
            <label class="form-label" for="tipo">Tipo de Conta *</label>
            <select id="tipo" v-model="form.tipo" class="form-select" required>
              <option value="paciente">🧑 Paciente</option>
              <option value="secretario">👔 Secretário(a)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="senha">Senha * (mínimo 6 caracteres)</label>
            <div class="input-com-icone">
              <input id="senha" v-model="form.senha" :type="mostrarSenha ? 'text' : 'password'"
                class="form-input" :class="{ erro: erros.senha }"
                placeholder="••••••••" required minlength="6" />
              <button type="button" class="toggle-senha" @click="mostrarSenha = !mostrarSenha">
                {{ mostrarSenha ? '🙈' : '👁️' }}
              </button>
            </div>
            <span v-if="erros.senha" class="form-erro">{{ erros.senha }}</span>
            <!-- Indicador de força da senha -->
            <div v-if="form.senha" class="forca-senha">
              <div class="barra-forca" :class="forcaSenha.classe"></div>
              <span class="texto-forca">{{ forcaSenha.texto }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmarSenha">Confirmar Senha *</label>
            <input id="confirmarSenha" v-model="form.confirmarSenha"
              :type="mostrarSenha ? 'text' : 'password'"
              class="form-input" :class="{ erro: erros.confirmarSenha }"
              placeholder="••••••••" required />
            <span v-if="erros.confirmarSenha" class="form-erro">{{ erros.confirmarSenha }}</span>
          </div>

          <button type="submit" class="btn btn-primario w-full">
            Próximo: Endereço →
          </button>
        </form>

        <!-- ETAPA 2: Endereço (via ViaCEP) -->
        <form v-if="etapaAtual === 2" @submit.prevent="proxima" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="cep">CEP</label>
            <div class="input-com-icone">
              <input id="cep" v-model="form.cep" type="text" class="form-input"
                placeholder="00000-000" maxlength="9"
                @blur="buscarCEP" @input="formatarCEP" />
              <span v-if="buscandoCEP" class="cep-loading">⏳</span>
            </div>
            <span v-if="erroCEP" class="form-erro">{{ erroCEP }}</span>
            <span v-if="form.cep && !erroCEP && !buscandoCEP" class="form-sucesso-cep">✅ CEP encontrado</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="rua">Rua / Logradouro</label>
              <input id="rua" v-model="form.rua" type="text" class="form-input"
                placeholder="Rua das Flores" />
            </div>
            <div class="form-group form-group-sm">
              <label class="form-label" for="numero">Número</label>
              <input id="numero" v-model="form.numero" type="text" class="form-input"
                placeholder="123" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="complemento">Complemento</label>
            <input id="complemento" v-model="form.complemento" type="text" class="form-input"
              placeholder="Apto 42, Bloco B..." />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bairro">Bairro</label>
              <input id="bairro" v-model="form.bairro" type="text" class="form-input"
                placeholder="Centro" />
            </div>
            <div class="form-group">
              <label class="form-label" for="cidade">Cidade</label>
              <input id="cidade" v-model="form.cidade" type="text" class="form-input"
                placeholder="São Paulo" />
            </div>
          </div>

          <div class="form-group form-group-sm">
            <label class="form-label" for="estado">UF</label>
            <input id="estado" v-model="form.estado" type="text" class="form-input"
              placeholder="SP" maxlength="2" />
          </div>

          <div class="form-acoes">
            <button type="button" class="btn btn-secundario" @click="etapaAtual = 1">
              ← Voltar
            </button>
            <button type="submit" class="btn btn-primario">
              Próximo: Revisar →
            </button>
          </div>
        </form>

        <!-- ETAPA 3: Confirmação -->
        <div v-if="etapaAtual === 3" class="etapa-confirmacao">
          <div class="resumo">
            <h3>📋 Resumo do Cadastro</h3>
            <div class="resumo-item">
              <span>Nome:</span> <strong>{{ form.nome }}</strong>
            </div>
            <div class="resumo-item">
              <span>Email:</span> <strong>{{ form.email }}</strong>
            </div>
            <div class="resumo-item" v-if="form.cpf">
              <span>CPF:</span> <strong>{{ form.cpf }}</strong>
            </div>
            <div class="resumo-item">
              <span>Tipo:</span>
              <strong>{{ form.tipo === 'paciente' ? '🧑 Paciente' : '👔 Secretário(a)' }}</strong>
            </div>
            <div class="resumo-item" v-if="form.cidade">
              <span>Cidade:</span> <strong>{{ form.cidade }}/{{ form.estado }}</strong>
            </div>
          </div>

          <div class="form-acoes">
            <button type="button" class="btn btn-secundario" @click="etapaAtual = 2">
              ← Voltar
            </button>
            <button
              type="button"
              class="btn btn-primario"
              @click="cadastrar"
              :disabled="carregando"
            >
              <span v-if="carregando" class="spinner-mini"></span>
              {{ carregando ? 'Cadastrando...' : '✅ Confirmar Cadastro' }}
            </button>
          </div>
        </div>

        <div class="auth-footer">
          <p>Já tem conta? <router-link to="/login">Fazer login</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const etapaAtual = ref(1)
const carregando = ref(false)
const buscandoCEP = ref(false)
const erro = ref('')
const sucesso = ref('')
const erroCEP = ref('')
const mostrarSenha = ref(false)

const form = reactive({
  nome: '', email: '', cpf: '', telefone: '', tipo: 'paciente',
  senha: '', confirmarSenha: '',
  cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: ''
})

const erros = reactive({
  nome: '', email: '', senha: '', confirmarSenha: ''
})

// Força da senha
const forcaSenha = computed(() => {
  const s = form.senha
  if (!s) return { classe: '', texto: '' }
  if (s.length < 6) return { classe: 'fraca', texto: '🔴 Senha fraca' }
  if (s.length < 10 || !/\d/.test(s) || !/[A-Z]/.test(s)) return { classe: 'media', texto: '🟡 Senha razoável' }
  return { classe: 'forte', texto: '🟢 Senha forte' }
})

// Formatação de CPF: 000.000.000-00
const formatarCPF = () => {
  let v = form.cpf.replace(/\D/g, '')
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  form.cpf = v
}

// Formatação de CEP: 00000-000
const formatarCEP = () => {
  let v = form.cep.replace(/\D/g, '')
  v = v.replace(/(\d{5})(\d)/, '$1-$2')
  form.cep = v
  erroCEP.value = ''
}

// Busca automática de CEP via ViaCEP
const buscarCEP = async () => {
  const cepLimpo = form.cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return

  buscandoCEP.value = true
  erroCEP.value = ''

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const dados = await resposta.json()

    if (dados.erro) {
      erroCEP.value = 'CEP não encontrado. Verifique e tente novamente.'
      return
    }

    // Preenche os campos automaticamente
    form.rua = dados.logradouro || ''
    form.bairro = dados.bairro || ''
    form.cidade = dados.localidade || ''
    form.estado = dados.uf || ''

  } catch (err) {
    erroCEP.value = 'Erro ao buscar CEP. Preencha o endereço manualmente.'
  } finally {
    buscandoCEP.value = false
  }
}

// Validação da etapa 1
const validarEtapa1 = () => {
  let valido = true
  erros.nome = ''
  erros.email = ''
  erros.senha = ''
  erros.confirmarSenha = ''

  if (!form.nome.trim() || form.nome.trim().length < 3) {
    erros.nome = 'Nome deve ter pelo menos 3 caracteres'
    valido = false
  }

  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    erros.email = 'Email inválido'
    valido = false
  }

  if (!form.senha || form.senha.length < 6) {
    erros.senha = 'Senha deve ter no mínimo 6 caracteres'
    valido = false
  }

  if (form.senha !== form.confirmarSenha) {
    erros.confirmarSenha = 'As senhas não coincidem'
    valido = false
  }

  return valido
}

// Vai para próxima etapa
const proxima = () => {
  erro.value = ''

  if (etapaAtual.value === 1) {
    if (validarEtapa1()) {
      etapaAtual.value = 2
    }
  } else if (etapaAtual.value === 2) {
    etapaAtual.value = 3
  }
}

// Realiza o cadastro
const cadastrar = async () => {
  carregando.value = true
  erro.value = ''

  try {
    await authStore.cadastrar({
      nome: form.nome.trim(),
      email: form.email.toLowerCase().trim(),
      senha: form.senha,
      cpf: form.cpf || undefined,
      tipo: form.tipo,
      telefone: form.telefone || undefined,
      cep: form.cep || undefined,
      rua: form.rua || undefined,
      numero: form.numero || undefined,
      complemento: form.complemento || undefined,
      bairro: form.bairro || undefined,
      cidade: form.cidade || undefined,
      estado: form.estado || undefined
    })

    sucesso.value = 'Cadastro realizado com sucesso! Redirecionando...'

    // Faz login automático após cadastro
    setTimeout(async () => {
      try {
        await authStore.login(form.email, form.senha)
        router.push('/dashboard')
      } catch {
        router.push('/login')
      }
    }, 1500)

  } catch (err) {
    erro.value = err.response?.data?.erro || 'Erro ao realizar cadastro.'
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
/* Reutiliza estilos do Login.vue com acréscimos */
.auth-page { min-height: 100vh; display: flex; }

.auth-esquerda {
  flex: 1;
  background: var(--gradiente-principal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

.auth-esquerda::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(46, 204, 113, 0.1);
  top: -100px;
  right: -100px;
}

.auth-branding { z-index: 1; max-width: 400px; }

.logo-grande { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.logo-icone { font-size: 3rem; }
.logo-grande h1 { font-size: 2.8rem; font-weight: 900; color: white; }
.logo-grande h1 span { color: var(--verde); }
.auth-slogan { color: rgba(255,255,255,0.7); font-size: 1.1rem; margin-bottom: 40px; }

/* Indicador de etapas */
.passos {
  display: flex;
  align-items: center;
  gap: 8px;
}

.passo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.passo-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition: var(--transicao);
}

.passo.ativo .passo-num {
  background: var(--verde);
  color: white;
  box-shadow: var(--sombra-verde);
}

.passo span {
  color: rgba(255,255,255,0.6);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.passo.ativo span { color: white; }

.passo-linha {
  flex: 1;
  height: 2px;
  background: rgba(255,255,255,0.2);
  margin-bottom: 20px;
  transition: var(--transicao);
}

.passo-linha.ativo { background: var(--verde); }

.auth-direita {
  width: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--cinza-claro);
  overflow-y: auto;
}

.auth-card { width: 100%; max-width: 440px; }

.auth-header { text-align: center; margin-bottom: 28px; }
.auth-header h2 { font-size: 1.8rem; font-weight: 800; color: var(--azul-escuro); margin-bottom: 8px; }

.auth-form { display: flex; flex-direction: column; gap: 4px; }

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.form-group-sm { min-width: 0; }

.input-com-icone { position: relative; }
.input-com-icone .form-input { padding-right: 48px; }

.toggle-senha, .cep-loading {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
}

.form-sucesso-cep {
  font-size: 0.8rem;
  color: var(--verde-escuro);
  margin-top: 4px;
  font-weight: 600;
}

/* Força da senha */
.forca-senha {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.barra-forca {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #e2e8f0;
  position: relative;
  overflow: hidden;
}

.barra-forca::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.barra-forca.fraca::after { width: 30%; background: var(--vermelho); }
.barra-forca.media::after { width: 60%; background: var(--amarelo); }
.barra-forca.forte::after { width: 100%; background: var(--verde); }

.texto-forca { font-size: 0.78rem; font-weight: 600; white-space: nowrap; }

.form-acoes {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.form-acoes .btn { flex: 1; justify-content: center; }

/* Resumo da etapa 3 */
.resumo {
  background: var(--cinza-claro);
  border-radius: var(--raio);
  padding: 20px;
  margin-bottom: 24px;
}

.resumo h3 { margin-bottom: 16px; font-size: 1rem; }

.resumo-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9rem;
}

.resumo-item:last-child { border-bottom: none; }
.resumo-item span { color: var(--cinza); }

.auth-footer { text-align: center; margin-top: 20px; color: var(--cinza); font-size: 0.9rem; }
.auth-footer a { color: var(--verde-escuro); font-weight: 700; }

.spinner-mini {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: girar 0.6s linear infinite;
  display: inline-block;
}

@media (max-width: 768px) {
  .auth-page { flex-direction: column; }
  .auth-esquerda { padding: 30px 20px; min-height: 200px; }
  .auth-direita { width: 100%; padding: 20px; }
}
</style>
