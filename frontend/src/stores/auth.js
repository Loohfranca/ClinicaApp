// stores/auth.js - Store Pinia para autenticação do usuário
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// Configura a base URL do axios
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 10000
})

// Interceptor para adicionar o token em todas as requisições
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('clinica_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Interceptor para lidar com respostas (logout automático em 401)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('clinica_token')
            localStorage.removeItem('clinica_usuario')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export { API }

export const useAuthStore = defineStore('auth', () => {
    // Estado
    const token = ref(localStorage.getItem('clinica_token') || null)
    const usuario = ref(
        localStorage.getItem('clinica_usuario')
            ? JSON.parse(localStorage.getItem('clinica_usuario'))
            : null
    )

    // Computed
    const estaLogado = computed(() => !!token.value && !!usuario.value)
    const eSecretario = computed(() => usuario.value?.tipo === 'secretario')
    const ePaciente = computed(() => usuario.value?.tipo === 'paciente')
    const inicias = computed(() => {
        if (!usuario.value?.nome) return '?'
        return usuario.value.nome
            .split(' ')
            .slice(0, 2)
            .map(n => n[0])
            .join('')
            .toUpperCase()
    })

    // Ações
    /**
     * Realiza o login e salva o token e usuário no localStorage
     */
    const login = async (email, senha) => {
        const resposta = await API.post('/auth/login', { email, senha })
        const { token: novoToken, usuario: novoUsuario } = resposta.data

        token.value = novoToken
        usuario.value = novoUsuario

        localStorage.setItem('clinica_token', novoToken)
        localStorage.setItem('clinica_usuario', JSON.stringify(novoUsuario))

        return novoUsuario
    }

    /**
     * Realiza o cadastro de um novo usuário
     */
    const cadastrar = async (dados) => {
        const resposta = await API.post('/auth/cadastro', dados)
        return resposta.data
    }

    /**
     * Realiza o logout limpando o estado e localStorage
     */
    const logout = () => {
        token.value = null
        usuario.value = null
        localStorage.removeItem('clinica_token')
        localStorage.removeItem('clinica_usuario')
    }

    /**
     * Verifica se o token JWT ainda é válido
     */
    const verificarToken = () => {
        if (!token.value) return false

        try {
            // Decodifica o payload do JWT (sem verificar assinatura - feito pelo backend)
            const payload = JSON.parse(atob(token.value.split('.')[1]))
            const expirado = payload.exp * 1000 < Date.now()

            if (expirado) {
                logout()
                return false
            }

            return true
        } catch {
            logout()
            return false
        }
    }

    return {
        token,
        usuario,
        estaLogado,
        eSecretario,
        ePaciente,
        inicias,
        login,
        cadastrar,
        logout,
        verificarToken
    }
})
