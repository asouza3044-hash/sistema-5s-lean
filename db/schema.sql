-- Schema do Portal 5S IMPAK TTO no Neon Postgres.
-- Rode este arquivo inteiro no SQL Editor do console Neon (ou via psql) uma única vez.
-- Idempotente: pode ser rodado de novo sem duplicar nada.

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- hash bcrypt, nunca texto puro
    name VARCHAR(255) NOT NULL,
    company_id VARCHAR(50) REFERENCES companies(id),
    role VARCHAR(50) NOT NULL,
    sector VARCHAR(100),
    level VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Impede o mesmo usuário votar duas vezes na mesma célula no mesmo dia
    -- (substitui a flag local `5s_user_voted_*`, que era por aparelho, não por usuário).
    CONSTRAINT uq_vote_por_usuario_dia UNIQUE (board_key, voter_username, day_code)
);

CREATE TABLE IF NOT EXISTS audit_responses (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id),
    question_key VARCHAR(100) NOT NULL,
    senso VARCHAR(50) NOT NULL,
    score VARCHAR(20) NOT NULL,
    points INT NOT NULL,
    auditor_username VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_audit_resposta_por_pergunta UNIQUE (company_id, question_key)
);

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

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id),
    user_name VARCHAR(255) NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela nova: não existia no schema original, o Ishikawa era 100% local ao aparelho.
CREATE TABLE IF NOT EXISTS ishikawa_diagrams (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id),
    problem TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- mao_obra | metodo | maquina | material | meio_ambiente | medicao
    causa TEXT NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO companies (id, name, industry)
VALUES ('impaktto', 'IMPAK TTO Plásticos de Engenharia', 'Usinagem / Plásticos de Engenharia')
ON CONFLICT (id) DO NOTHING;
