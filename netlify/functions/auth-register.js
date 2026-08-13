const bcrypt = require('bcryptjs');
const { getSql } = require('./_lib/db');
const { signSession } = require('./_lib/auth');
const { json, noContent, isPreflight } = require('./_lib/http');

const COMPANY_ID = 'impaktto';

exports.handler = async (event) => {
  if (isPreflight(event)) return noContent();
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return json(400, { error: 'JSON inválido' });
  }

  const name = String(body.name || '').trim();
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const sector = String(body.sector || '').trim();

  if (!name || !username || !password) {
    return json(400, { error: 'Nome, usuário e senha são obrigatórios' });
  }
  if (password.length < 4) {
    return json(400, { error: 'A senha precisa ter pelo menos 4 caracteres' });
  }

  const sql = getSql();
  const existing = await sql`SELECT id FROM users WHERE lower(username) = ${username} LIMIT 1`;
  if (existing.length > 0) {
    return json(409, { error: 'Esse usuário já existe' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const rows = await sql`
    INSERT INTO users (id, username, password, name, company_id, role, sector, level, title)
    VALUES (${username}, ${username}, ${passwordHash}, ${name}, ${COMPANY_ID}, 'colaborador', ${sector}, 'colaborador', 'Grupo 1: Colaborador de Setor')
    RETURNING *
  `;
  const user = rows[0];

  const token = signSession(user);
  const { password: _omit, ...safeUser } = user;
  return json(201, { token, user: safeUser });
};
