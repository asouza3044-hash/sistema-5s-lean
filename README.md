# 🏢 Sistema de Gestão 5S & Qualidade — IMPAK TTO Plásticos de Engenharia

Portal corporativo de governança, auditoria de campo, gestão visual e ferramentas da qualidade desenvolvido para a **IMPAK TTO Plásticos de Engenharia** (Projeto Especial de Implantação 5S & Qualidade / SENAI).

---

## 📁 Estrutura do Projeto

```text
├── index.html                   # Interface Web Principal (Dashboard, Votação, Auditoria, Matriz GUT, Kanban, Ishikawa)
├── styles.css                   # Folha de estilos moderna (Dark Glassmorphism, Layout 16:9 TV, Responsivo)
├── app.js                       # Lógica client-side integrada à API de Netlify Functions
├── dev-server.mjs               # Servidor de desenvolvimento local Node.js (com live reload de funções e mock do Netlify)
├── netlify.toml                 # Configuração de build e redirecionamento de rotas (/api/*) no Netlify
│
├── db/
│   └── schema.sql               # Esquema oficial do banco de dados relacional PostgreSQL (Neon)
│
├── netlify/
│   └── functions/               # Backend Serverless (Netlify Functions)
│       ├── _lib/                # Módulos compartilhados (auth JWT, conexão Neon db, helpers HTTP)
│       ├── auth-login.js        # Autenticação e emissão de token JWT
│       ├── auth-register.js     # Auto-cadastro rápido de novos colaboradores (Grupo 1)
│       ├── auth-change-password.js # Troca de senha pessoal individual
│       ├── users.js             # Gestão de usuários e permissões (Nível 1, 2 e 3)
│       ├── factory-board.js     # Votações diárias do quadro da fábrica ("Como está nossa área?")
│       ├── audit-responses.js   # Checklist oficial mensal de auditoria 5S (50 itens)
│       ├── department-evolution.js # Fechamento mensal e ranking anual do Prêmio Mór 5S
│       ├── activity-log.js      # Feed de atividades e rastreabilidade em tempo real
│       ├── gut-matrix.js        # Matriz GUT (Gravidade x Urgência x Tendência)
│       ├── ishikawa.js          # Diagrama de Causa e Efeito (6M)
│       └── kanban-tasks.js      # Plano de ação 5W2H (Kanban)
│
├── scripts/
│   ├── seed-official-users.mjs  # Cadastro inicial dos 11 usuários oficiais com senhas criptografadas (bcrypt)
│   ├── migrate-jsonblob-to-neon.mjs # Script de migração de legado
│   ├── gerar_pdf_clayton.py     # Gerador do PDF de Termo de Nomeação e IT do Clayton
│   └── converter_logo.py        # Utilitário de conversão de imagem para PDFs
│
├── instrucao_trabalho_clayton_5s.pdf # Documento PDF oficial de instrução de trabalho do Auditor Volante
├── instrucoes_clayton.html      # Visualização web da instrução de trabalho do Auditor Volante
├── manual_implementacao_5s_qualidade.md # Manual Corporativo completo de implantação 5S
└── NEON_DATABASE_CONFIG.md      # Guia de configuração e infraestrutura do Neon PostgreSQL
```

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js (versão 18 ou superior)
- Arquivo `.env` configurado com `DATABASE_URL` e `JWT_SECRET`.

### 2. Instalação e Inicialização
```bash
# 1. Instalar dependências
npm install

# 2. Inicializar o servidor de desenvolvimento
npm run dev
```

Acesse no navegador: **`http://localhost:8888`**

---

## ⚙️ Comandos Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local com emulação de Netlify Functions e arquivos estáticos |
| `npm run start` | Alias para inicialização do servidor local |
| `npm run seed` | Popula o banco Neon com os 11 usuários oficiais da IMPAK TTO |
| `npm run migrate` | Executa a migração de dados do repositório legado |

---

## 👥 Níveis de Governança e Perfis de Acesso

1. **Nível 1 — Líderes de Setor (Grupo 1):** Votação diária rápida no rodízio cruzado nos 5 setores da fábrica (*Usinagem, Holter, Armários, Portas/Cortinas, Acabamento*).
2. **Nível 2 — Auditores & Encarregados (Grupo 2):** Auditoria volante, suplência de cobertura, checklist mensal oficial de 50 perguntas e moderação do quadro.
3. **Nível 3 — Gerência & Diretoria (Grupo 3):** Fechamento mensal de premiação (meta ≥ 90%), gestão de usuários/níveis, acesso ao manual corporativo e ranking anual.
4. **Painel TV / Monitor (`monitor`):** Interface de gestão visual para exibição contínua em televisores e monitores de chão de fábrica (proporção 16:9).
