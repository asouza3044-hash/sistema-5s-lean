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
      SELECT id, problem, g, u, t, score, created_by AS "createdBy", created_at AS "createdAt"
      FROM gut_matrix WHERE company_id = ${COMPANY_ID} ORDER BY score DESC
    `;
    return json(200, { items: rows });
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return json(400, { error: 'JSON inválido' });
    }
    const { problem, g, u, t } = body;
    if (!problem || !g || !u || !t) return json(400, { error: 'problem, g, u e t são obrigatórios' });

    const score = Number(g) * Number(u) * Number(t);
    const rows = await sql`
      INSERT INTO gut_matrix (company_id, problem, g, u, t, score, created_by)
      VALUES (${COMPANY_ID}, ${problem}, ${g}, ${u}, ${t}, ${score}, ${session.name})
      RETURNING id, problem, g, u, t, score, created_by AS "createdBy"
    `;
    return json(201, { item: rows[0] });
  }

  if (event.httpMethod === 'DELETE') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      body = {};
    }
    const id = body.id || (event.queryStringParameters && event.queryStringParameters.id);
    if (!id) return json(400, { error: 'id é obrigatório' });
    await sql`DELETE FROM gut_matrix WHERE id = ${id} AND company_id = ${COMPANY_ID}`;
    return json(200, { ok: true });
  }

  return json(405, { error: 'Método não permitido' });
};
