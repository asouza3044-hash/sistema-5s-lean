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
      SELECT id, title, senso, status, owner, due_date AS "dueDate", created_by AS "createdBy"
      FROM kanban_tasks WHERE company_id = ${COMPANY_ID} ORDER BY created_at ASC
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
    const { title, senso, owner, dueDate } = body;
    if (!title) return json(400, { error: 'title é obrigatório' });

    const id = `kb_${Date.now()}`;
    const rows = await sql`
      INSERT INTO kanban_tasks (id, company_id, title, senso, status, owner, due_date, created_by)
      VALUES (${id}, ${COMPANY_ID}, ${title}, ${senso || null}, 'a-fazer', ${owner || null}, ${dueDate || null}, ${session.name})
      RETURNING id, title, senso, status, owner, due_date AS "dueDate", created_by AS "createdBy"
    `;
    return json(201, { item: rows[0] });
  }

  if (event.httpMethod === 'PATCH') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return json(400, { error: 'JSON inválido' });
    }
    const { id, status } = body;
    if (!id || !status) return json(400, { error: 'id e status são obrigatórios' });
    const rows = await sql`
      UPDATE kanban_tasks SET status = ${status}
      WHERE id = ${id} AND company_id = ${COMPANY_ID}
      RETURNING id, title, senso, status, owner, due_date AS "dueDate", created_by AS "createdBy"
    `;
    if (rows.length === 0) return json(404, { error: 'Tarefa não encontrada' });
    return json(200, { item: rows[0] });
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
    await sql`DELETE FROM kanban_tasks WHERE id = ${id} AND company_id = ${COMPANY_ID}`;
    return json(200, { ok: true });
  }

  return json(405, { error: 'Método não permitido' });
};
