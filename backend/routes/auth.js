// routes/auth.js - Rotas de autenticação (login e cadastro)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

/**
 * POST /api/auth/cadastro
 * Cadastra um novo usuário no sistema
 */
router.post('/cadastro', async (req, res) => {
    const {
        nome, email, senha, cpf, tipo,
        telefone, cep, rua, bairro, cidade, estado, numero, complemento
    } = req.body;

    // Validações básicas
    if (!nome || !email || !senha || !tipo) {
        return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha e tipo.' });
    }

    if (!['paciente', 'secretario'].includes(tipo)) {
        return res.status(400).json({ erro: 'Tipo deve ser paciente ou secretario.' });
    }

    if (senha.length < 6) {
        return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ erro: 'Email inválido.' });
    }

    try {
        // Verifica se email já existe
        const usuarioExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
        if (usuarioExistente) {
            return res.status(409).json({ erro: 'Email já cadastrado.' });
        }

        // Verifica se CPF já existe (se fornecido)
        if (cpf) {
            const cpfExistente = db.prepare('SELECT id FROM usuarios WHERE cpf = ?').get(cpf.replace(/\D/g, ''));
            if (cpfExistente) {
                return res.status(409).json({ erro: 'CPF já cadastrado.' });
            }
        }

        // Cria hash da senha com bcrypt (fator 10)
        const senhaHash = await bcrypt.hash(senha, 10);

        // Insere o usuário no banco
        const resultado = db.prepare(`
      INSERT INTO usuarios (nome, email, senha, cpf, tipo, telefone, cep, rua, bairro, cidade, estado, numero, complemento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            nome.trim(),
            email.toLowerCase().trim(),
            senhaHash,
            cpf ? cpf.replace(/\D/g, '') : null,
            tipo,
            telefone || null,
            cep || null,
            rua || null,
            bairro || null,
            cidade || null,
            estado || null,
            numero || null,
            complemento || null
        );

        // Busca o usuário recém-criado (sem a senha)
        const novoUsuario = db.prepare(
            'SELECT id, nome, email, cpf, tipo, cidade FROM usuarios WHERE id = ?'
        ).get(resultado.lastInsertRowid);

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: novoUsuario
        });

    } catch (err) {
        console.error('Erro no cadastro:', err);
        res.status(500).json({ erro: 'Erro interno ao cadastrar usuário.' });
    }
});

/**
 * POST /api/auth/login
 * Autentica um usuário e retorna o token JWT
 */
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }

    try {
        // Busca o usuário pelo email
        const usuario = db.prepare(
            'SELECT id, nome, email, senha, cpf, tipo, cidade FROM usuarios WHERE email = ?'
        ).get(email.toLowerCase().trim());

        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou senha incorretos.' });
        }

        // Verifica a senha com bcrypt
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha incorretos.' });
        }

        // Gera o token JWT com validade de 24 horas
        const token = jwt.sign(
            {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo
            },
            process.env.JWT_SECRET || 'chave_secreta_padrao',
            { expiresIn: '24h' }
        );

        // Retorna os dados do usuário (sem a senha) e o token
        res.json({
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cpf: usuario.cpf,
                tipo: usuario.tipo,
                cidade: usuario.cidade
            }
        });

    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ erro: 'Erro interno ao realizar login.' });
    }
});

/**
 * GET /api/auth/perfil
 * Retorna os dados do usuário autenticado
 */
const { autenticar } = require('../middleware/auth');
router.get('/perfil', autenticar, (req, res) => {
    const usuario = db.prepare(
        'SELECT id, nome, email, cpf, tipo, telefone, cep, rua, bairro, cidade, estado, numero, complemento FROM usuarios WHERE id = ?'
    ).get(req.usuario.id);

    if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json({ usuario });
});

module.exports = router;
