const { getSql } = require('./_lib/db');
const { getSessionFromEvent } = require('./_lib/auth');
const { json, noContent, isPreflight } = require('./_lib/http');

const COMPANY_ID = 'impaktto';

exports.handler = async (event) => {
  if (isPreflight(event)) return noContent();

  const session = getSessionFromEvent(event);
  if (!session) return json(401, { error: 'Sessão inválida ou expirada, faça login novamente' });

  const sql = getSql();

  if (event.httpMethod === 'GET') {
    const rows = await sql`
      SELECT id, user_name AS "userName", action, created_at AS timestamp
      FROM activity_logs
      WHERE company_id = ${COMPANY_ID}
      ORDER BY id DESC
      LIMIT 25
    `;
    return json(200, { logs: rows });
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return json(400, { error: 'JSON inválido' });
    }
    const { userName, action } = body;
    if (!userName || !action) return json(400, { error: 'userName e action são obrigatórios' });

    const id = Date.now();
    await sql`
      INSERT INTO activity_logs (id, company_id, user_name, action)
      VALUES (${id}, ${COMPANY_ID}, ${userName}, ${action})
      ON CONFLICT (id) DO NOTHING
    `;
    return json(201, { ok: true, id });
  }

  return json(405, { error: 'Método não permitido' });
};
