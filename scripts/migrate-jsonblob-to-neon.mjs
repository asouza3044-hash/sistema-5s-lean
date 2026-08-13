// Migração única: lê o documento jsonblob.com atual (users, factory_board, activity_logs)
// e grava no Neon Postgres antes do cutover, para não perder o que já foi registrado.
//
// Uso: node --env-file=.env scripts/migrate-jsonblob-to-neon.mjs
// Requer DATABASE_URL no .env (veja db/schema.sql — rode o schema primeiro).

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const CLOUD_MASTER_API = 'https://jsonblob.com/api/jsonBlob/019ff2fe-dc89-756e-bec9-d891b4f8ee03';
const COMPANY_ID = 'impaktto';

function statusToPoints(score) {
  return score === 'bom' ? 3 : score === 'regular' ? 2 : 1;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL não definida. Rode com: node --env-file=.env scripts/migrate-jsonblob-to-neon.mjs');
    process.exit(1);
  }
  const sql = neon(connectionString);

  console.log('Buscando estado atual em', CLOUD_MASTER_API);
  const res = await fetch(`${CLOUD_MASTER_API}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Falha ao ler jsonblob: HTTP ${res.status}`);
  const raw = await res.json();
  const cloud = raw.data ?? raw;

  const users = cloud.users || {};
  const factoryBoard = cloud.factory_board || {};
  const activityLogs = cloud.activity_logs || [];

  console.log(`Migrando ${Object.keys(users).length} usuários...`);
  for (const user of Object.values(users)) {
    const passwordHash = await bcrypt.hash(String(user.password || '5s2026'), 10);
    await sql`
      INSERT INTO users (id, username, password, name, company_id, role, sector, level, title)
      VALUES (${user.username}, ${user.username}, ${passwordHash}, ${user.name}, ${COMPANY_ID}, ${user.role}, ${user.sector || null}, ${user.level}, ${user.title || null})
      ON CONFLICT (username) DO NOTHING
    `;
  }

  console.log(`Migrando votos do quadro de fábrica (${Object.keys(factoryBoard).length} células)...`);
  let voteCount = 0;
  for (const [boardKey, cell] of Object.entries(factoryBoard)) {
    const votes = Array.isArray(cell?.votes) ? cell.votes : [];
    const parts = boardKey.split('_');
    const dayCode = parts[parts.length - 1];
    const senso = parts[parts.length - 2];
    const sector = parts.slice(0, parts.length - 2).join('_');

    for (const vote of votes) {
      try {
        await sql`
          INSERT INTO factory_board_votes (board_key, sector, senso, day_code, voter_username, voter_name, score, points, comment)
          VALUES (${boardKey}, ${sector}, ${senso}, ${dayCode}, ${vote.username || 'desconhecido'}, ${vote.name || 'Desconhecido'}, ${vote.score}, ${vote.points || statusToPoints(vote.score)}, ${vote.comment || null})
          ON CONFLICT (board_key, voter_username, day_code) DO NOTHING
        `;
        voteCount++;
      } catch (err) {
        console.warn(`  aviso: voto ignorado em ${boardKey} (${err.message})`);
      }
    }
  }
  console.log(`  ${voteCount} votos migrados.`);

  console.log(`Migrando ${activityLogs.length} eventos do feed de atividade...`);
  for (const log of activityLogs) {
    await sql`
      INSERT INTO activity_logs (id, company_id, user_name, action)
      VALUES (${log.id}, ${COMPANY_ID}, ${log.userName}, ${log.action})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log('Migração concluída.');
}

main().catch((err) => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
