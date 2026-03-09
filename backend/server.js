// server.js - Ponto de entrada do servidor Express
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

// ============ MIDDLEWARES GLOBAIS ============
// Configuração do CORS para permitir requisições do frontend Vue.js
app.use(cors({
    origin: (origin, callback) => {
        // Permite qualquer localhost em desenvolvimento, ou a URL configurada em produção
        const origemPermitida = process.env.FRONTEND_URL || 'http://localhost:5173'
        if (!origin || origin.startsWith('http://localhost') || origin === origemPermitida) {
            callback(null, true)
        } else {
            callback(new Error('Origem não permitida pelo CORS'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Parse de JSON no body das requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${req.method} ${req.path}`);
        next();
    });
}

// ============ ROTAS DA API ============
app.use('/api/auth', require('./routes/auth'));
app.use('/api/consultas', require('./routes/consultas'));
app.use('/api/medicos', require('./routes/medicos'));
app.use('/api/pacientes', require('./routes/pacientes'));

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        mensagem: 'API da Clínica Médica funcionando!',
        versao: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Rota para endpoints não encontrados
app.use('*', (req, res) => {
    res.status(404).json({ erro: 'Endpoint não encontrado.' });
});

// Handler global de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
});

// ============ INICIALIZAÇÃO ============
const PORTA = process.env.PORT || 3001;
app.listen(PORTA, () => {
    console.log('\n🏥 ====================================');
    console.log('   Clínica Médica - API Backend');
    console.log('====================================');
    console.log(`🚀 Servidor rodando em: http://localhost:${PORTA}`);
    console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Banco de dados: SQLite (clinica.db)`);
    console.log('====================================\n');
});

module.exports = app;
