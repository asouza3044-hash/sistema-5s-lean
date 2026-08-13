const { getSql } = require('./_lib/db');
const { getSessionFromEvent } = require('./_lib/auth');
const { json, noContent, isPreflight } = require('./_lib/http');

// Confere o papel atual no banco (não no token) — um token de 30 dias não deve
// continuar valendo como admin depois que alguém rebaixa esse usuário no meio do caminho.
async function isAdmin(sql, session) {
  if (!session) return false;
  const rows = await sql`SELECT role, level FROM users WHERE username = ${session.username} LIMIT 1`;
  const current = rows[0];
  return !!current && (current.role === 'administrador' || current.level === 'senior');
}

exports.handler = async (event) => {
  if (isPreflight(event)) return noContent();

  const session = getSessionFromEvent(event);
  if (!session) return json(401, { error: 'Sessão inválida ou expirada, faça login novamente' });

  const sql = getSql();

  if (event.httpMethod === 'GET') {
    const rows = await sql`SELECT id, username, name, role, sector, level, title FROM users ORDER BY name`;
    return json(200, { users: rows });
  }

  if (event.httpMethod === 'PATCH') {
    if (!(await isAdmin(sql, session))) return json(403, { error: 'Só administradores podem editar usuários' });
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return json(400, { error: 'JSON inválido' });
    }
    const { username, level, role, sector, title } = body;
    if (!username) return json(400, { error: 'username é obrigatório' });

    const rows = await sql`
      UPDATE users SET
        level = COALESCE(${level}, level),
        role = COALESCE(${role}, role),
        sector = COALESCE(${sector}, sector),
        title = COALESCE(${title}, title)
      WHERE username = ${username}
      RETURNING id, username, name, role, sector, level, title
    `;
    if (rows.length === 0) return json(404, { error: 'Usuário não encontrado' });
    return json(200, { user: rows[0] });
  }

  if (event.httpMethod === 'DELETE') {
    if (!(await isAdmin(sql, session))) return json(403, { error: 'Só administradores podem excluir usuários' });
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      body = {};
    }
    const username = body.username || (event.queryStringParameters && event.queryStringParameters.username);
    if (!username) return json(400, { error: 'username é obrigatório' });
    if (username === 'admin') return json(400, { error: 'A conta mestre não pode ser excluída' });

    await sql`DELETE FROM users WHERE username = ${username}`;
    return json(200, { ok: true });
  }

  return json(405, { error: 'Método não permitido' });
};
