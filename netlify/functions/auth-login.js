const bcrypt = require('bcryptjs');
const { getSql } = require('./_lib/db');
const { signSession } = require('./_lib/auth');
const { json, noContent, isPreflight } = require('./_lib/http');

exports.handler = async (event) => {
  if (isPreflight(event)) return noContent();
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return json(400, { error: 'JSON inválido' });
  }

  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!username || !password) {
    return json(400, { error: 'Usuário e senha são obrigatórios' });
  }

  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE lower(username) = ${username} LIMIT 1`;
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return json(401, { error: 'Usuário ou senha incorretos' });
  }

  const token = signSession(user);
  const { password: _omit, ...safeUser } = user;
  return json(200, { token, user: safeUser });
};
