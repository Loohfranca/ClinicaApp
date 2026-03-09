// routes/pacientes.js - Rotas para visualização de pacientes (secretário)
const express = require('express');
const db = require('../database');
const { autenticar, apenasSecretario } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/pacientes
 * Lista todos os pacientes cadastrados (apenas secretário)
 */
router.get('/', autenticar, apenasSecretario, (req, res) => {
    try {
        const pacientes = db.prepare(`
      SELECT id, nome, email, cpf, telefone, cep, rua, bairro, cidade, estado, criado_em
      FROM usuarios
      WHERE tipo = 'paciente'
      ORDER BY nome
    `).all();

        res.json({ pacientes });
    } catch (err) {
        console.error('Erro ao listar pacientes:', err);
        res.status(500).json({ erro: 'Erro ao buscar pacientes.' });
    }
});

/**
 * GET /api/pacientes/:id
 * Retorna dados de um paciente específico (apenas secretário)
 */
router.get('/:id', autenticar, apenasSecretario, (req, res) => {
    const { id } = req.params;

    try {
        const paciente = db.prepare(`
      SELECT id, nome, email, cpf, telefone, cep, rua, bairro, cidade, estado, numero, complemento, criado_em
      FROM usuarios
      WHERE id = ? AND tipo = 'paciente'
    `).get(id);

        if (!paciente) {
            return res.status(404).json({ erro: 'Paciente não encontrado.' });
        }

        // Busca também as consultas do paciente
        const consultas = db.prepare(`
      SELECT c.*, m.nome AS medico_nome, m.especialidade AS medico_especialidade
      FROM consultas c
      JOIN medicos m ON c.medico_id = m.id
      WHERE c.paciente_id = ?
      ORDER BY c.data DESC
    `).all(id);

        res.json({ paciente, consultas });
    } catch (err) {
        console.error('Erro ao buscar paciente:', err);
        res.status(500).json({ erro: 'Erro ao buscar paciente.' });
    }
});

module.exports = router;
