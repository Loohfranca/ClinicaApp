<template>
  <div class="auth-page">
    <!-- Lado esquerdo: visual -->
    <div class="auth-esquerda">
      <div class="auth-branding">
        <div class="logo-grande">
          <span class="logo-icone">🏥</span>
          <h1>Clinic<span>App</span></h1>
        </div>
        <p class="auth-slogan">Cuidando de você com tecnologia e carinho</p>
        <div class="recursos">
          <div class="recurso">
            <span>📅</span>
            <div>
              <strong>Agendamento Online</strong>
              <p>Marque sua consulta a qualquer hora</p>
            </div>
          </div>
          <div class="recurso">
            <span>👩‍⚕️</span>
            <div>
              <strong>Especialistas</strong>
              <p>Médicos em diversas especialidades</p>
            </div>
          </div>
          <div class="recurso">
            <span>🛡️</span>
            <div>
              <strong>Seguro e Privado</strong>
              <p>Seus dados protegidos com criptografia</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lado direito: formulário -->
    <div class="auth-direita">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Bem-vindo de volta! 👋</h2>
          <p>Faça login para acessar suas consultas</p>
        </div>

        <!-- Alerta de erro -->
        <div v-if="erro" class="alerta alerta-erro">
          ⚠️ {{ erro }}
        </div>

        <!-- Formulário de login -->
        <form @submit.prevent="fazerLogin" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{ erro: erros.email }"
              placeholder="seu@email.com"
              autocomplete="email"
              required
            />
            <span v-if="erros.email" class="form-erro">{{ erros.email }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="senha">Senha</label>
            <div class="input-com-icone">
              <input
                id="senha"
                v-model="form.senha"
                :type="mostrarSenha ? 'text' : 'password'"
                class="form-input"
                :class="{ erro: erros.senha }"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                class="toggle-senha"
                @click="mostrarSenha = !mostrarSenha"
              >
                {{ mostrarSenha ? '🙈' : '👁️' }}
              </button>
            </div>
            <span v-if="erros.senha" class="form-erro">{{ erros.senha }}</span>
          </div>

          <button
            type="submit"
            class="btn btn-primario w-full"
            :disabled="carregando"
          >
            <span v-if="carregando" class="spinner-mini"></span>
            {{ carregando ? 'Entrando...' : '🔓 Entrar' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Não tem conta? <router-link to="/cadastro">Cadastre-se grátis</router-link></p>
        </div>

        <!-- Credenciais de demonstração -->
        <div class="demo-credentials">
          <p class="demo-titulo">🔑 Credenciais de Demonstração</p>
          <div class="demo-buttons">
            <button class="demo-btn" @click="usarDemo('admin@clinica.com', 'admin123')">
              👔 Secretário
            </button>
            <button class="demo-btn" @click="usarDemo('paciente@teste.com', 'teste123')">
              🧑 Paciente
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const carregando = ref(false)
const erro = ref('')
const mostrarSenha = ref(false)

const form = reactive({
  email: '',
  senha: ''
})

const erros = reactive({
  email: '',
  senha: ''
})

// Preenche credenciais de demonstração
const usarDemo = (email, senha) => {
  form.email = email
  form.senha = senha
}

// Validação do formulário
const validar = () => {
  let valido = true
  erros.email = ''
  erros.senha = ''

  if (!form.email) {
    erros.email = 'Email é obrigatório'
    valido = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    erros.email = 'Email inválido'
    valido = false
  }

  if (!form.senha) {
    erros.senha = 'Senha é obrigatória'
    valido = false
  }

  return valido
}

// Submissão do formulário
const fazerLogin = async () => {
  if (!validar()) return

  carregando.value = true
  erro.value = ''

  try {
    await authStore.login(form.email, form.senha)
    router.push('/dashboard')
  } catch (err) {
    if (!err.response) {
      erro.value = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3001.'
    } else {
      erro.value = err.response?.data?.erro || 'Erro ao fazer login. Verifique suas credenciais.'
    }
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
}

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

.auth-esquerda::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.2);
  bottom: -80px;
  left: -80px;
}

.auth-branding {
  z-index: 1;
  max-width: 400px;
}

.logo-grande {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo-icone {
  font-size: 3rem;
}

.logo-grande h1 {
  font-size: 2.8rem;
  font-weight: 900;
  color: white;
}

.logo-grande h1 span {
  color: var(--verde);
}

.auth-slogan {
  color: rgba(255,255,255,0.7);
  font-size: 1.1rem;
  margin-bottom: 40px;
}

.recursos {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recurso {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.recurso > span {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.recurso strong {
  display: block;
  color: white;
  font-weight: 700;
}

.recurso p {
  color: rgba(255,255,255,0.6);
  font-size: 0.85rem;
}

.auth-direita {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--cinza-claro);
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-header h2 {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--azul-escuro);
  margin-bottom: 8px;
}

.auth-header p {
  color: var(--cinza);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-com-icone {
  position: relative;
}

.input-com-icone .form-input {
  padding-right: 48px;
}

.toggle-senha {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  color: var(--cinza);
  font-size: 0.9rem;
}

.auth-footer a {
  color: var(--verde-escuro);
  font-weight: 700;
}

.demo-credentials {
  margin-top: 24px;
  padding: 16px;
  background: white;
  border-radius: var(--raio);
  border: 2px dashed #e2e8f0;
  text-align: center;
}

.demo-titulo {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--cinza);
  margin-bottom: 10px;
}

.demo-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.demo-btn {
  padding: 8px 16px;
  background: var(--cinza-claro);
  border: 2px solid #e2e8f0;
  border-radius: var(--raio-pequeno);
  font-family: var(--fonte);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transicao);
  color: var(--azul-escuro);
}

.demo-btn:hover {
  border-color: var(--verde);
  background: var(--verde-claro);
  color: var(--verde-escuro);
}

.spinner-mini {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: girar 0.6s linear infinite;
  display: inline-block;
}

@media (max-width: 768px) {
  .auth-page { flex-direction: column; }
  .auth-esquerda { padding: 40px 20px; min-height: 250px; }
  .auth-direita { width: 100%; padding: 20px; }
  .logo-grande h1 { font-size: 2rem; }
  .recursos { display: none; }
}
</style>
