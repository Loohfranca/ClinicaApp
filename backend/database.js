// database.js - Configuração e inicialização do banco de dados SQLite
const Database = require('better-sqlite3');
const path = require('path');

// Cria ou abre o banco de dados
const db = new Database(path.join(__dirname, 'clinica.db'));

// Habilita WAL mode para melhor performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Criação das tabelas
const criarTabelas = () => {
  // Tabela de usuários (pacientes e secretários)
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      cpf TEXT UNIQUE,
      tipo TEXT NOT NULL CHECK(tipo IN ('paciente', 'secretario')),
      telefone TEXT,
      cep TEXT,
      rua TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,
      numero TEXT,
      complemento TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de médicos
  db.exec(`
    CREATE TABLE IF NOT EXISTS medicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      especialidade TEXT NOT NULL,
      crm TEXT UNIQUE NOT NULL,
      telefone TEXT,
      email TEXT,
      ativo INTEGER DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de consultas
  db.exec(`
    CREATE TABLE IF NOT EXISTS consultas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      medico_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      hora TEXT NOT NULL,
      especialidade TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'agendada' CHECK(status IN ('agendada', 'confirmada', 'cancelada', 'realizada')),
      observacoes TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
      FOREIGN KEY (medico_id) REFERENCES medicos(id)
    )
  `);

  console.log('✅ Tabelas criadas/verificadas com sucesso!');
};

criarTabelas();

module.exports = db;
