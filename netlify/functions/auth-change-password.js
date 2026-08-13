const bcrypt = require('bcryptjs');
const { getSql } = require('./_lib/db');
const { getSessionFromEvent } = require('./_lib/auth');
const { json, noContent, isPreflight } = require('./_lib/http');

exports.handler = async (event) => {
  if (isPreflight(event)) return noContent();
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido' });

  const session = getSessionFromEvent(event);
  if (!session) return json(401, { error: 'Sessão inválida ou expirada, faça login novamente' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return json(400, { error: 'JSON inválido' });
  }

  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  if (!currentPassword || !newPassword) {
    return json(400, { error: 'Informe a senha atual e a nova senha' });
  }
  if (newPassword.length < 4) {
    return json(400, { error: 'A nova senha precisa ter pelo menos 4 caracteres' });
  }

  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE username = ${session.username} LIMIT 1`;
  const user = rows[0];
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return json(401, { error: 'Senha atual incorreta' });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await sql`UPDATE users SET password = ${newHash} WHERE username = ${session.username}`;

  return json(200, { ok: true });
};
