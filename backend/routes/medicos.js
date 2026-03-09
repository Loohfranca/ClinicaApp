// routes/medicos.js - Rotas para gerenciamento de médicos
const express = require('express');
const db = require('../database');
const { autenticar, apenasSecretario } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/medicos
 * Lista todos os médicos ativos (acesso para todos autenticados)
 */
router.get('/', autenticar, (req, res) => {
    try {
        const medicos = db.prepare(
            'SELECT id, nome, especialidade, crm, telefone, email FROM medicos WHERE ativo = 1 ORDER BY nome'
        ).all();

        res.json({ medicos });
    } catch (err) {
        console.error('Erro ao listar médicos:', err);
        res.status(500).json({ erro: 'Erro ao buscar médicos.' });
    }
});

/**
 * GET /api/medicos/todos
 * Lista todos os médicos incluindo inativos (apenas secretário)
 */
router.get('/todos', autenticar, apenasSecretario, (req, res) => {
    try {
        const medicos = db.prepare(
            'SELECT * FROM medicos ORDER BY nome'
        ).all();

        res.json({ medicos });
    } catch (err) {
        console.error('Erro ao listar médicos:', err);
        res.status(500).json({ erro: 'Erro ao buscar médicos.' });
    }
});

/**
 * POST /api/medicos
 * Cadastra um novo médico (apenas secretário)
 */
router.post('/', autenticar, apenasSecretario, (req, res) => {
    const { nome, especialidade, crm, telefone, email } = req.body;

    // Validações
    if (!nome || !especialidade || !crm) {
        return res.status(400).json({ erro: 'Nome, especialidade e CRM são obrigatórios.' });
    }

    try {
        // Verifica se o CRM já existe
        const crmExistente = db.prepare('SELECT id FROM medicos WHERE crm = ?').get(crm.trim());
        if (crmExistente) {
            return res.status(409).json({ erro: 'CRM já cadastrado.' });
        }

        const resultado = db.prepare(`
      INSERT INTO medicos (nome, especialidade, crm, telefone, email)
      VALUES (?, ?, ?, ?, ?)
    `).run(
            nome.trim(),
            especialidade.trim(),
            crm.trim(),
            telefone || null,
            email || null
        );

        const novoMedico = db.prepare('SELECT * FROM medicos WHERE id = ?').get(resultado.lastInsertRowid);

        res.status(201).json({
            mensagem: 'Médico cadastrado com sucesso!',
            medico: novoMedico
        });

    } catch (err) {
        console.error('Erro ao cadastrar médico:', err);
        res.status(500).json({ erro: 'Erro ao cadastrar médico.' });
    }
});

/**
 * PUT /api/medicos/:id
 * Atualiza dados de um médico (apenas secretário)
 */
router.put('/:id', autenticar, apenasSecretario, (req, res) => {
    const { id } = req.params;
    const { nome, especialidade, crm, telefone, email, ativo } = req.body;

    try {
        const medico = db.prepare('SELECT id FROM medicos WHERE id = ?').get(id);
        if (!medico) {
            return res.status(404).json({ erro: 'Médico não encontrado.' });
        }

        db.prepare(`
      UPDATE medicos SET nome = ?, especialidade = ?, crm = ?, telefone = ?, email = ?, ativo = ?
      WHERE id = ?
    `).run(
            nome || medico.nome,
            especialidade || medico.especialidade,
            crm || medico.crm,
            telefone || null,
            email || null,
            ativo !== undefined ? ativo : 1,
            id
        );

        const medicoAtualizado = db.prepare('SELECT * FROM medicos WHERE id = ?').get(id);
        res.json({ mensagem: 'Médico atualizado!', medico: medicoAtualizado });

    } catch (err) {
        console.error('Erro ao atualizar médico:', err);
        res.status(500).json({ erro: 'Erro ao atualizar médico.' });
    }
});

/**
 * DELETE /api/medicos/:id
 * Desativa um médico (soft delete, apenas secretário)
 */
router.delete('/:id', autenticar, apenasSecretario, (req, res) => {
    const { id } = req.params;

    try {
        const medico = db.prepare('SELECT id FROM medicos WHERE id = ?').get(id);
        if (!medico) {
            return res.status(404).json({ erro: 'Médico não encontrado.' });
        }

        // Soft delete - apenas desativa
        db.prepare('UPDATE medicos SET ativo = 0 WHERE id = ?').run(id);

        res.json({ mensagem: 'Médico desativado com sucesso.' });
    } catch (err) {
        console.error('Erro ao desativar médico:', err);
        res.status(500).json({ erro: 'Erro ao desativar médico.' });
    }
});

module.exports = router;
