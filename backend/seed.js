// seed.js - Dados iniciais para o banco de dados
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

const seed = async () => {
    console.log('🌱 Iniciando seed do banco de dados...');

    try {
        // ============ USUÁRIOS ============
        const senhaAdmin = await bcrypt.hash('admin123', 10);
        try {
            db.prepare(`
        INSERT INTO usuarios (nome, email, senha, tipo, cpf)
        VALUES (?, ?, ?, ?, ?)
      `).run('Administrador', 'admin@clinica.com', senhaAdmin, 'secretario', '00000000001');
            console.log('✅ Secretário admin criado: admin@clinica.com / admin123');
        } catch (e) {
            console.log('⚠️  Secretário admin já existe.');
        }

        const senhaPaciente = await bcrypt.hash('teste123', 10);
        try {
            db.prepare(`
        INSERT INTO usuarios (nome, email, senha, tipo, cpf, telefone, cep, rua, bairro, cidade, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                'João Silva', 'paciente@teste.com', senhaPaciente, 'paciente',
                '12345678901', '(11) 99999-8888', '01310-100',
                'Avenida Paulista', 'Bela Vista', 'São Paulo', 'SP'
            );
            console.log('✅ Paciente de teste criado: paciente@teste.com / teste123');
        } catch (e) {
            console.log('⚠️  Paciente de teste já existe.');
        }

        // ============ MÉDICOS ============
        const medicos = [
            { nome: 'Dra. Ana Oliveira', especialidade: 'Cardiologia', crm: 'CRM-SP 12345', email: 'ana.oliveira@clinica.com' },
            { nome: 'Dr. Bruno Santos', especialidade: 'Ortopedia', crm: 'CRM-SP 67890', email: 'bruno.santos@clinica.com' },
            { nome: 'Dra. Carla Mendes', especialidade: 'Dermatologia', crm: 'CRM-SP 11111', email: 'carla.mendes@clinica.com' }
        ];

        for (const m of medicos) {
            try {
                db.prepare(`INSERT INTO medicos (nome, especialidade, crm, email) VALUES (?, ?, ?, ?)`)
                    .run(m.nome, m.especialidade, m.crm, m.email);
                console.log(`✅ Médico criado: ${m.nome} - ${m.especialidade}`);
            } catch (e) {
                console.log(`⚠️  Médico ${m.nome} já existe.`);
            }
        }

        // ============ CONSULTAS ============
        const paciente = db.prepare("SELECT id FROM usuarios WHERE email = 'paciente@teste.com'").get();
        const medico1 = db.prepare("SELECT id FROM medicos WHERE crm = 'CRM-SP 12345'").get();
        const medico2 = db.prepare("SELECT id FROM medicos WHERE crm = 'CRM-SP 67890'").get();
        const medico3 = db.prepare("SELECT id FROM medicos WHERE crm = 'CRM-SP 11111'").get();

        if (paciente && medico1 && medico2 && medico3) {
            const hoje = new Date().toISOString().split('T')[0];
            const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
            const dataAmanha = amanha.toISOString().split('T')[0];

            // --- Consultas de HOJE ---
            const consultasHoje = [
                { medico: medico3.id, hora: '08:00', esp: 'Dermatologia', status: 'realizada', obs: 'Acompanhamento tratamento pele' },
                { medico: medico1.id, hora: '09:00', esp: 'Cardiologia', status: 'confirmada', obs: 'Consulta de rotina — pressão arterial' },
                { medico: medico2.id, hora: '14:30', esp: 'Ortopedia', status: 'agendada', obs: 'Dor no joelho direito' },
            ];

            for (const c of consultasHoje) {
                try {
                    db.prepare(`
            INSERT INTO consultas (paciente_id, medico_id, data, hora, especialidade, status, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(paciente.id, c.medico, hoje, c.hora, c.esp, c.status, c.obs);
                    console.log(`✅ Consulta HOJE ${c.hora} [${c.status}] criada`);
                } catch (e) {
                    console.log(`⚠️  Consulta de hoje ${c.hora} já existe.`);
                }
            }

            // --- Consulta de AMANHÃ ---
            try {
                db.prepare(`
          INSERT INTO consultas (paciente_id, medico_id, data, hora, especialidade, status, observacoes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(paciente.id, medico1.id, dataAmanha, '10:00', 'Cardiologia', 'agendada', 'Retorno de consulta');
                console.log(`✅ Consulta AMANHÃ 10:00 criada`);
            } catch (e) {
                console.log('⚠️  Consulta de amanhã já existe.');
            }
        }

        console.log('\n🎉 Seed concluído com sucesso!');
        console.log('\n📋 Credenciais de acesso:');
        console.log('   Secretário: admin@clinica.com / admin123');
        console.log('   Paciente:   paciente@teste.com / teste123');

    } catch (err) {
        console.error('❌ Erro no seed:', err);
        process.exit(1);
    }
};

seed();
