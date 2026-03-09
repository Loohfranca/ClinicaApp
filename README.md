# 🏥 ClinicApp — Sistema de Gerenciamento de Consultas Médicas

Sistema completo para gerenciamento de consultas médicas de uma clínica de pequeno porte, desenvolvido com **Vue.js 3** no frontend e **Node.js + Express** no backend, com banco de dados **SQLite**.

---

## ✨ Funcionalidades

### 🔐 Autenticação
- Cadastro multi-step com validação completa
- Hash de senha com **bcrypt** (fator 10)
- Login com geração de **JWT** (validade de 24h)
- Verificação automática de expiração do token
- Logout com limpeza do estado no frontend

### 📅 Agendamento de Consultas
- Agendar consulta com médico, data, hora, especialidade e observações
- **Verificação de conflito de horário** antes de confirmar
- Seletor visual de horários disponíveis/ocupados
- Listar consultas do paciente logado
- Cancelar consulta (paciente cancela as suas, secretário cancela qualquer)
- Status da consulta: `agendada` → `confirmada` → `realizada` / `cancelada`

### 🌍 Integração com ViaCEP
- Campo de CEP no cadastro
- Busca automática ao perder o foco: rua, bairro, cidade, estado
- Preenchimento automático dos campos de endereço

### 🌧️ Integração com Open-Meteo (sem chave!)
- Ao escolher a data da consulta, verifica a previsão do tempo
- Usa Open-Meteo gratuitamente: `https://api.open-meteo.com/v1/forecast`
- Se houver previsão de chuva (>0mm), exibe **alerta visual animado** 🌧️
- Mostra ícone do tempo e descrição

### 👔 Painel Administrativo (Secretário)
- Dashboard com **6 métricas** em tempo real
- Agenda do dia com filtro por data
- Alterar status de qualquer consulta
- Cadastrar, ativar e desativar médicos
- Listar todos os pacientes com busca

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend UI | Vue.js 3 (Composition API) |
| Roteamento | Vue Router 4 |
| Estado | Pinia |
| HTTP | Axios |
| Backend | Node.js + Express |
| Banco de dados | SQLite via better-sqlite3 |
| Autenticação | JWT (jsonwebtoken) |
| Senha | bcryptjs |
| Estilo | CSS Puro (sem frameworks) |
| Fonte | Google Fonts — Nunito |

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- **Node.js** >= 18.x
- **npm** >= 9.x

### 1. Clone e instale as dependências

```bash
# Backend
cd clinica-app/backend
npm install
npm run seed     # Cria dados iniciais

# Frontend
cd ../frontend
npm install
```

### 2. Variáveis de ambiente

**Backend** — crie `clinica-app/backend/.env`:
```env
PORT=3001
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend** — crie `clinica-app/frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Rode os servidores

```bash
# Terminal 1 — Backend
cd clinica-app/backend
npm run dev        # Usa nodemon para hot reload

# Terminal 2 — Frontend
cd clinica-app/frontend
npm run dev        # http://localhost:5173
```

### 4. Acesse o sistema

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001/api

---

## 🔑 Credenciais de Demonstração

| Tipo | Email | Senha |
|---|---|---|
| 👔 Secretário | admin@clinica.com | admin123 |
| 🧑 Paciente | paciente@teste.com | teste123 |

---

## 🌐 Endpoints da API

### Autenticação
| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| POST | `/api/auth/cadastro` | Cadastrar usuário | ❌ |
| POST | `/api/auth/login` | Login, retorna JWT | ❌ |
| GET | `/api/auth/perfil` | Dados do usuário logado | ✅ |

### Consultas
| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| GET | `/api/consultas` | Lista consultas (paciente: as suas; secretário: todas) | ✅ |
| GET | `/api/consultas/hoje` | Consultas de hoje + métricas | ✅ Secretário |
| POST | `/api/consultas` | Criar consulta | ✅ |
| PUT | `/api/consultas/:id/status` | Alterar status | ✅ |
| DELETE | `/api/consultas/:id` | Cancelar consulta | ✅ |

### Médicos
| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| GET | `/api/medicos` | Listar médicos ativos | ✅ |
| GET | `/api/medicos/todos` | Listar todos (incluindo inativos) | ✅ Secretário |
| POST | `/api/medicos` | Cadastrar médico | ✅ Secretário |
| PUT | `/api/medicos/:id` | Atualizar médico | ✅ Secretário |
| DELETE | `/api/medicos/:id` | Desativar médico (soft delete) | ✅ Secretário |

### Pacientes
| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| GET | `/api/pacientes` | Listar todos os pacientes | ✅ Secretário |
| GET | `/api/pacientes/:id` | Dados de um paciente + histórico | ✅ Secretário |

---

## 🌍 Integrações Externas

### ViaCEP
- **URL:** `https://viacep.com.br/ws/{CEP}/json/`
- **Uso:** Busca automática de endereço pelo CEP no cadastro
- **Sem necessidade de chave de API**

### Open-Meteo
- **URL:** `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=precipitation_sum&timezone=America/Sao_Paulo&start_date={data}&end_date={data}`
- **Uso:** Verificação de chuva ao escolher data de consulta
- **Coordenadas padrão:** São Paulo (lat=-23.55, lon=-46.63)
- **Sem necessidade de chave de API**
- **Resposta:** Se `precipitation_sum > 0mm`, alerta de chuva é exibido

---

## 🗄️ Banco de Dados (SQLite)

### Tabela `usuarios`
| Campo | Tipo | Descrição |
|---|---|---|
| id | INTEGER PK | ID único |
| nome | TEXT | Nome completo |
| email | TEXT UNIQUE | Email de login |
| senha | TEXT | Hash bcrypt |
| cpf | TEXT | CPF formatado |
| tipo | TEXT | `paciente` ou `secretario` |
| telefone | TEXT | Telefone |
| cep | TEXT | CEP |
| rua | TEXT | Logradouro |
| bairro | TEXT | Bairro |
| cidade | TEXT | Cidade |
| estado | TEXT | UF |
| numero | TEXT | Número |
| complemento | TEXT | Complemento |
| criado_em | DATETIME | Data de criação |

### Tabela `medicos`
| Campo | Tipo | Descrição |
|---|---|---|
| id | INTEGER PK | ID único |
| nome | TEXT | Nome completo |
| especialidade | TEXT | Especialidade médica |
| crm | TEXT UNIQUE | Registro CRM |
| telefone | TEXT | Telefone |
| email | TEXT | Email |
| ativo | INTEGER | 1=ativo, 0=inativo |

### Tabela `consultas`
| Campo | Tipo | Descrição |
|---|---|---|
| id | INTEGER PK | ID único |
| paciente_id | FK | Referência ao usuário |
| medico_id | FK | Referência ao médico |
| data | TEXT | Data no formato YYYY-MM-DD |
| hora | TEXT | Horário HH:MM |
| especialidade | TEXT | Especialidade da consulta |
| status | TEXT | `agendada`, `confirmada`, `cancelada`, `realizada` |
| observacoes | TEXT | Observações facultativas |
| criado_em | DATETIME | Data de criação |

---

## 🚢 Deploy

### Backend — Railway
1. Acesse [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Configure as variáveis de ambiente no painel do Railway:
   - `JWT_SECRET` (gere uma chave forte)
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://seu-app.vercel.app`
3. O banco SQLite fica no volume persistente do Railway

### Frontend — Vercel
1. Acesse [vercel.com](https://vercel.com) → New Project → Importe do GitHub
2. Configure:
   - **Root Directory:** `clinica-app/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Variável de ambiente: `VITE_API_URL=https://seu-backend.railway.app/api`

---

## 🛡️ Segurança

- ✅ Senhas **nunca** retornadas nas respostas da API
- ✅ JWT com expiração de 24h e verificação no frontend
- ✅ Middleware de autenticação em todas as rotas privadas
- ✅ Middleware de autorização para rotas exclusivas do secretário
- ✅ Verificação de conflito de horário antes de criar consulta
- ✅ Paciente só pode cancelar suas próprias consultas
- ✅ CORS configurado para aceitar apenas o domínio do frontend
- ✅ Soft delete de médicos (mantém integridade referencial)

---

## 📁 Estrutura do Projeto

```
clinica-app/
├── backend/
│   ├── server.js           # Entrada do servidor Express
│   ├── database.js         # Config SQLite + criação de tabelas
│   ├── seed.js             # Dados básicos para desenvolvimento
│   ├── .env                # Variáveis de ambiente
│   ├── routes/
│   │   ├── auth.js         # Cadastro e login
│   │   ├── consultas.js    # CRUD de consultas
│   │   ├── medicos.js      # CRUD de médicos
│   │   └── pacientes.js    # Listagem de pacientes
│   ├── middleware/
│   │   └── auth.js         # JWT + verificação de role
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── Login.vue           # Login com credenciais demo
│   │   │   ├── Cadastro.vue        # Cadastro multi-step + ViaCEP
│   │   │   ├── Dashboard.vue       # Dashboard adaptativo por role
│   │   │   ├── Agendamento.vue     # Agendamento + Open-Meteo
│   │   │   ├── MinhasConsultas.vue # Lista com filtros
│   │   │   ├── Admin.vue           # Painel administrativo
│   │   │   └── Layout.vue          # Layout com sidebar
│   │   ├── router/index.js         # Rotas protegidas
│   │   ├── stores/auth.js          # Pinia + Axios interceptors
│   │   ├── style.css               # Design system completo
│   │   └── main.js
│   └── package.json
└── README.md
```
