# 🐘 BANCO DE DADOS NEON POSTGRESQL - PROJETO 5S & QUALIDADE IMPAK TTO

> **Status:** Restaurado e 100% Operacional no Neon Cloud  
> **Data de Criação/Restauração:** 11/08/2026  
> **Projeto ID:** `little-fire-03061120`  
> **Região:** AWS US East 2 (`aws-us-east-2`)  

---

## 🔑 DADOS DE CONEXÃO DIRETA (URI & CREDENCIAIS)

- **Database Name:** `neondb`
- **Database User (Role):** `neondb_owner`
- **Host / Endpoint:** `ep-plain-snow-axzg7uwd-pooler.c-4.us-east-2.aws.neon.tech`
- **String de Conexão (PostgreSQL URI):**
  ```text
  postgresql://neondb_owner:npg_j0HfinbhY5Kx@ep-plain-snow-axzg7uwd-pooler.c-4.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
  ```

---

## 📊 ESTRUTURA DAS TABELAS E SCHEMAS RELACIONAIS

### 1. Tabela `companies` (Empresa Matriz)
```sql
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Tabela `users` (Os 11 Integrantes Oficiais da IMPAK TTO)
```sql
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_id VARCHAR(50) REFERENCES companies(id),
    role VARCHAR(50) NOT NULL,
    sector VARCHAR(100),
    level VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Tabela `factory_board_votes` (Votos Diários do Rodízio 5S)
```sql
CREATE TABLE IF NOT EXISTS factory_board_votes (
    id SERIAL PRIMARY KEY,
    board_key VARCHAR(100) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    senso VARCHAR(50) NOT NULL,
    day_code VARCHAR(10) NOT NULL,
    voter_username VARCHAR(100) NOT NULL,
    voter_name VARCHAR(255) NOT NULL,
    score VARCHAR(20) NOT NULL,
    points INT NOT NULL,
    comment TEXT,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Tabela `audit_responses` (Auditorias Semanais e Sinais 5S)
```sql
CREATE TABLE IF NOT EXISTS audit_responses (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id),
    question_key VARCHAR(100) NOT NULL,
    senso VARCHAR(50) NOT NULL,
    score VARCHAR(20) NOT NULL,
    points INT NOT NULL,
    auditor_username VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Tabela `gut_matrix` (Priorização Mestre de Ações 5S)
```sql
CREATE TABLE IF NOT EXISTS gut_matrix (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id),
    problem TEXT NOT NULL,
    g INT NOT NULL,
    u INT NOT NULL,
    t INT NOT NULL,
    score INT NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Tabela `kanban_tasks` (Plano de Ação 5W2H / Kanban)
```sql
CREATE TABLE IF NOT EXISTS kanban_tasks (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id),
    title TEXT NOT NULL,
    senso VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    owner VARCHAR(255),
    due_date VARCHAR(50),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 👥 USUÁRIOS OFICIAIS CADASTRADOS NO NEON

| ID / Usuário | Nome Completo | Nível / Grupo | Setor Matriz | Senha Padrão |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | Alexandre Souza | Nível 3: Gerência & Líder Mestre | Acabamento | `5s2026` / `mestre5s` |
| `kaio.diretor` | Kaio | Nível 3: Diretor | Usinagem | `5s2026` |
| `diego.fabrica` | Diego | Nível 2: Encarregado de Fábrica | Holter | `5s2026` |
| `filipe.rh` | Filipe | Nível 2: Encarregado RH - 5S | Armários | `5s2026` |
| `clayton.auditor` | Clayton | Nível 2: Auditor Volante / Suplência | Portas / Cortinas | `5s2026` |
| `alexandre.usinagem` | Alexandre Usinagem | Nível 1: Líder de Usinagem | Usinagem | `5s2026` |
| `marcos.holter` | Marcos | Nível 1: Líder de Holter | Holter | `5s2026` |
| `bruno.armarios` | Bruno | Nível 1: Líder de Armários | Armários | `5s2026` |
| `elton.portas` | Elton | Nível 1: Líder de Portas / Cortinas | Portas / Cortinas | `5s2026` |
| `giovanna.acabamento` | Giovanna | Nível 1: Líder de Acabamento | Acabamento | `5s2026` |
| `monitor` | Gestão Visual TV | Modo Monitor (TV 16:9 Fábrica) | Fábrica | `5s2026` |

---
*Gerado via Antigravity AI Assistant para o projeto 5S IMPAK TTO.*
