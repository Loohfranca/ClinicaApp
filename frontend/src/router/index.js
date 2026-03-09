// router/index.js - Configuração das rotas com proteção por autenticação
import { createRouter, createWebHistory } from 'vue-router'

// Importação lazy das views para melhor performance
const Login = () => import('../views/Login.vue')
const Cadastro = () => import('../views/Cadastro.vue')
const Dashboard = () => import('../views/Dashboard.vue')
const Agendamento = () => import('../views/Agendamento.vue')
const MinhasConsultas = () => import('../views/MinhasConsultas.vue')
const Admin = () => import('../views/Admin.vue')

const rotas = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { publica: true }
    },
    {
        path: '/cadastro',
        name: 'Cadastro',
        component: Cadastro,
        meta: { publica: true }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requerAutenticacao: true }
    },
    {
        path: '/agendamento',
        name: 'Agendamento',
        component: Agendamento,
        meta: { requerAutenticacao: true }
    },
    {
        path: '/minhas-consultas',
        name: 'MinhasConsultas',
        component: MinhasConsultas,
        meta: { requerAutenticacao: true }
    },
    {
        path: '/admin',
        name: 'Admin',
        component: Admin,
        meta: { requerAutenticacao: true, apenasSecretario: true }
    },
    {
        // Rota 404
        path: '/:pathMatch(.*)*',
        redirect: '/login'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes: rotas
})

// Guard de navegação - verifica autenticação antes de cada rota
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('clinica_token')
    const usuarioStr = localStorage.getItem('clinica_usuario')

    let usuarioValido = false
    let usuario = null

    if (token && usuarioStr) {
        try {
            // Verifica se token não expirou
            const payload = JSON.parse(atob(token.split('.')[1]))
            usuarioValido = payload.exp * 1000 > Date.now()
            usuario = JSON.parse(usuarioStr)
        } catch {
            usuarioValido = false
        }
    }

    // Rota pública: redireciona para dashboard se já logado
    if (to.meta.publica) {
        if (usuarioValido) {
            return next('/dashboard')
        }
        return next()
    }

    // Rota protegida: redireciona para login se não autenticado
    if (to.meta.requerAutenticacao && !usuarioValido) {
        return next('/login')
    }

    // Rota exclusiva para secretário
    if (to.meta.apenasSecretario && usuario?.tipo !== 'secretario') {
        return next('/dashboard')
    }

    next()
})

export default router
