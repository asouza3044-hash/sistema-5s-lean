// Cadastra os 11 integrantes oficiais da IMPAK TTO no banco novo, com senha em hash bcrypt
// (nunca texto puro). Rode uma vez após aplicar db/schema.sql num banco vazio.
//
// Uso: node --env-file=.env scripts/seed-official-users.mjs

import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const COMPANY_ID = 'impaktto';

const OFFICIAL_USERS = [
  { username: 'admin', password: 'mestre5s', name: 'Alexandre Souza', role: 'administrador', level: 'senior', sector: 'Acabamento', title: 'Grupo 3: Gerente de Projeto / Líder Mestre' },
  { username: 'kaio.diretor', password: '5s2026', name: 'Kaio', role: 'administrador', level: 'senior', sector: 'Usinagem', title: 'Grupo 3: Diretor' },
  { username: 'diego.fabrica', password: '5s2026', name: 'Diego', role: 'auditor_semanal', level: 'semanal', sector: 'Holter', title: 'Grupo 2: Encarregado de Fábrica' },
  { username: 'filipe.rh', password: '5s2026', name: 'Filipe', role: 'auditor_semanal', level: 'semanal', sector: 'Armários', title: 'Grupo 2: Encarregado RH - 5S' },
  { username: 'clayton.auditor', password: '5s2026', name: 'Clayton', role: 'auditor_semanal', level: 'semanal', sector: 'Portas / Cortinas', title: 'Grupo 2: Auditor Volante 5S / Suplência & Calibração' },
  { username: 'alexandre.usinagem', password: '5s2026', name: 'Alexandre Usinagem', role: 'lider_diario', level: 'diario', sector: 'Usinagem', title: 'Grupo 1: Líder de Usinagem' },
  { username: 'marcos.holter', password: '5s2026', name: 'Marcos', role: 'lider_diario', level: 'diario', sector: 'Holter', title: 'Grupo 1: Líder de Holter' },
  { username: 'bruno.armarios', password: '5s2026', name: 'Bruno', role: 'lider_diario', level: 'diario', sector: 'Armários', title: 'Grupo 1: Líder de Armários' },
  { username: 'elton.portas', password: '5s2026', name: 'Elton', role: 'lider_diario', level: 'diario', sector: 'Portas / Cortinas', title: 'Grupo 1: Líder de Portas / Cortinas' },
  { username: 'giovanna.acabamento', password: '5s2026', name: 'Giovanna', role: 'lider_diario', level: 'diario', sector: 'Acabamento', title: 'Grupo 1: Líder de Acabamento' },
  { username: 'monitor', password: '5s2026', name: 'Gestão Visual TV Fábrica & Escritório', role: 'monitor', level: 'monitor', sector: null, title: '📺 Gestão Visual 5S (TV 16:9)' },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL não definida. Rode com: node --env-file=.env scripts/seed-official-users.mjs');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  for (const u of OFFICIAL_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (id, username, password, name, company_id, role, sector, level, title)
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (username) DO NOTHING`,
      [u.username, passwordHash, u.name, COMPANY_ID, u.role, u.sector, u.level, u.title]
    );
    console.log(`  ✓ ${u.username}`);
  }

  console.log(`\n${OFFICIAL_USERS.length} usuários oficiais cadastrados (senha padrão 5s2026 / admin: mestre5s).`);
  await pool.end();
}

main().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
