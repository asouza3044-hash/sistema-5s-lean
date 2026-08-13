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
      SELECT question_key, score, points
      FROM audit_responses
      WHERE company_id = ${COMPANY_ID}
    `;
    const scores = {};
    for (const row of rows) scores[row.question_key] = row.score;
    return json(200, { scores });
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return json(400, { error: 'JSON inválido' });
    }
    const { questionKey, senso, score, points } = body;
    if (!questionKey || !senso || !score) {
      return json(400, { error: 'questionKey, senso e score são obrigatórios' });
    }

    await sql`
      INSERT INTO audit_responses (company_id, question_key, senso, score, points, auditor_username)
      VALUES (${COMPANY_ID}, ${questionKey}, ${senso}, ${score}, ${points || 0}, ${session.username})
      ON CONFLICT (company_id, question_key)
      DO UPDATE SET score = EXCLUDED.score, points = EXCLUDED.points,
                    auditor_username = EXCLUDED.auditor_username, updated_at = CURRENT_TIMESTAMP
    `;
    return json(200, { ok: true });
  }

  if (event.httpMethod === 'DELETE') {
    await sql`DELETE FROM audit_responses WHERE company_id = ${COMPANY_ID}`;
    return json(200, { ok: true });
  }

  return json(405, { error: 'Método não permitido' });
};
