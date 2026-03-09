// routes/consultas.js - Rotas para gerenciamento de consultas
const express = require('express');
const db = require('../database');
const { autenticar, apenasSecretario } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/consultas
 * Paciente: lista suas próprias consultas
 * Secretário: lista todas as consultas com filtros opcionais
 */
router.get('/', autenticar, (req, res) => {
    try {
        if (req.usuario.tipo === 'secretario') {
            // Secretário pode filtrar por data e médico
            const { data, medico_id } = req.query;
            let query = `
        SELECT c.*, u.nome AS paciente_nome, u.cpf AS paciente_cpf,
               m.nome AS medico_nome, m.especialidade AS medico_especialidade
        FROM consultas c
        JOIN usuarios u ON c.paciente_id = u.id
        JOIN medicos m ON c.medico_id = m.id
        WHERE 1=1
      `;
            const params = [];

            if (data) {
                query += ' AND c.data = ?';
                params.push(data);
            }
            if (medico_id) {
                query += ' AND c.medico_id = ?';
                params.push(medico_id);
            }

            query += ' ORDER BY c.data DESC, c.hora ASC';
            const consultas = db.prepare(query).all(...params);
            return res.json({ consultas });
        }

        // Paciente vê apenas suas próprias consultas
        const consultas = db.prepare(`
      SELECT c.*, m.nome AS medico_nome, m.especialidade AS medico_especialidade, m.crm AS medico_crm
      FROM consultas c
      JOIN medicos m ON c.medico_id = m.id
      WHERE c.paciente_id = ?
      ORDER BY c.data DESC, c.hora ASC
    `).all(req.usuario.id);

        res.json({ consultas });
    } catch (err) {
        console.error('Erro ao listar consultas:', err);
        res.status(500).json({ erro: 'Erro ao buscar consultas.' });
    }
});

/**
 * GET /api/consultas/hoje
 * Retorna consultas do dia atual (ou da data passada via ?data=YYYY-MM-DD)
 * Inclui métricas para o dashboard
 */
router.get('/hoje', autenticar, apenasSecretario, (req, res) => {
    try {
        // Aceita data via query param; cai para hoje se não informado
        const data = req.query.data || new Date().toISOString().split('T')[0];

        const consultas = db.prepare(`
      SELECT c.*, u.nome AS paciente_nome,
             m.nome AS medico_nome, m.especialidade AS medico_especialidade
      FROM consultas c
      JOIN usuarios u ON c.paciente_id = u.id
      JOIN medicos m ON c.medico_id = m.id
      WHERE c.data = ?
      ORDER BY c.hora ASC
    `).all(data);

        // Métricas do dashboard
        const totalHoje = consultas.length;
        const agendadas = consultas.filter(c => c.status === 'agendada').length;
        const confirmadas = consultas.filter(c => c.status === 'confirmada').length;
        const canceladas = consultas.filter(c => c.status === 'cancelada').length;
        const realizadas = consultas.filter(c => c.status === 'realizada').length;

        // Total geral de pacientes
        const totalPacientes = db.prepare(
            "SELECT COUNT(*) AS total FROM usuarios WHERE tipo = 'paciente'"
        ).get().total;

        res.json({
            consultas,
            metricas: { totalHoje, agendadas, confirmadas, canceladas, realizadas, totalPacientes }
        });
    } catch (err) {
        console.error('Erro ao buscar consultas de hoje:', err);
        res.status(500).json({ erro: 'Erro ao buscar dados do dashboard.' });
    }
});

/**
 * POST /api/consultas
 * Cria uma nova consulta com verificação de conflito de horário
 */
router.post('/', autenticar, (req, res) => {
    const { medico_id, data, hora, especialidade, observacoes, paciente_id } = req.body;

    // Define o paciente_id: secretário pode agendar para outros, paciente só para si
    const idPaciente = req.usuario.tipo === 'secretario' && paciente_id
        ? paciente_id
        : req.usuario.id;

    // Validações
    if (!medico_id || !data || !hora || !especialidade) {
        return res.status(400).json({ erro: 'Médico, data, hora e especialidade são obrigatórios.' });
    }

    // Valida formato de data (YYYY-MM-DD)
    const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dataRegex.test(data)) {
        return res.status(400).json({ erro: 'Formato de data inválido. Use YYYY-MM-DD.' });
    }

    // Verifica se a data não é no passado
    const dataConsulta = new Date(data + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataConsulta < hoje) {
        return res.status(400).json({ erro: 'Não é possível agendar consulta em data passada.' });
    }

    try {
        // Verifica se o médico existe e está ativo
        const medico = db.prepare('SELECT id FROM medicos WHERE id = ? AND ativo = 1').get(medico_id);
        if (!medico) {
            return res.status(404).json({ erro: 'Médico não encontrado ou inativo.' });
        }

        // Verifica conflito de horário: mesmo médico, mesma data e hora
        const conflito = db.prepare(`
      SELECT id FROM consultas
      WHERE medico_id = ? AND data = ? AND hora = ? AND status != 'cancelada'
    `).get(medico_id, data, hora);

        if (conflito) {
            return res.status(409).json({
                erro: 'Conflito de horário! Este médico já possui uma consulta neste horário.'
            });
        }

        // Cria a consulta
        const resultado = db.prepare(`
      INSERT INTO consultas (paciente_id, medico_id, data, hora, especialidade, observacoes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'agendada')
    `).run(idPaciente, medico_id, data, hora, especialidade.trim(), observacoes || null);

        // Busca a consulta com todos os dados para retornar
        const novaConsulta = db.prepare(`
      SELECT c.*, u.nome AS paciente_nome, m.nome AS medico_nome, m.especialidade AS medico_especialidade
      FROM consultas c
      JOIN usuarios u ON c.paciente_id = u.id
      JOIN medicos m ON c.medico_id = m.id
      WHERE c.id = ?
    `).get(resultado.lastInsertRowid);

        res.status(201).json({
            mensagem: 'Consulta agendada com sucesso!',
            consulta: novaConsulta
        });

    } catch (err) {
        console.error('Erro ao criar consulta:', err);
        res.status(500).json({ erro: 'Erro ao agendar consulta.' });
    }
});

/**
 * PUT /api/consultas/:id/status
 * Atualiza o status de uma consulta
 * Paciente só pode cancelar suas próprias consultas
 * Secretário pode alterar qualquer status
 */
router.put('/:id/status', autenticar, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const statusValidos = ['agendada', 'confirmada', 'cancelada', 'realizada'];
    if (!statusValidos.includes(status)) {
        return res.status(400).json({ erro: `Status inválido. Use: ${statusValidos.join(', ')}` });
    }

    try {
        const consulta = db.prepare('SELECT * FROM consultas WHERE id = ?').get(id);
        if (!consulta) {
            return res.status(404).json({ erro: 'Consulta não encontrada.' });
        }

        // Paciente só pode cancelar suas próprias consultas
        if (req.usuario.tipo === 'paciente') {
            if (consulta.paciente_id !== req.usuario.id) {
                return res.status(403).json({ erro: 'Você só pode cancelar suas próprias consultas.' });
            }
            if (status !== 'cancelada') {
                return res.status(403).json({ erro: 'Pacientes só podem cancelar consultas.' });
            }
        }

        db.prepare('UPDATE consultas SET status = ? WHERE id = ?').run(status, id);

        res.json({ mensagem: `Consulta ${status} com sucesso!` });
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        res.status(500).json({ erro: 'Erro ao atualizar consulta.' });
    }
});

/**
 * DELETE /api/consultas/:id
 * Cancela uma consulta (alternativa ao PUT /status)
 */
router.delete('/:id', autenticar, (req, res) => {
    const { id } = req.params;

    try {
        const consulta = db.prepare('SELECT * FROM consultas WHERE id = ?').get(id);
        if (!consulta) {
            return res.status(404).json({ erro: 'Consulta não encontrada.' });
        }

        // Verifica permissão: paciente só pode cancelar as suas
        if (req.usuario.tipo === 'paciente' && consulta.paciente_id !== req.usuario.id) {
            return res.status(403).json({ erro: 'Você não tem permissão para cancelar esta consulta.' });
        }

        if (consulta.status === 'cancelada') {
            return res.status(400).json({ erro: 'Esta consulta já está cancelada.' });
        }

        db.prepare("UPDATE consultas SET status = 'cancelada' WHERE id = ?").run(id);

        res.json({ mensagem: 'Consulta cancelada com sucesso!' });
    } catch (err) {
        console.error('Erro ao cancelar consulta:', err);
        res.status(500).json({ erro: 'Erro ao cancelar consulta.' });
    }
});

module.exports = router;
