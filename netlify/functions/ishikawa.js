const { getSql } = require('./_lib/db');
const { getSessionFromEvent } = require('./_lib/auth');
const { json, noContent, isPreflight } = require('./_lib/http');

const COMPANY_ID = 'impaktto';
const PROBLEM_MARKER = '_problema';

// categoria no banco (snake_case) <-> chave usada no front-end (camelCase)
const CATEGORY_MAP = {
  mao_obra: 'maoObra',
  metodo: 'metodo',
  maquina: 'maquina',
  material: 'material',
  meio_ambiente: 'meioAmbiente',
  medicao: 'medicao',
};
const CATEGORY_MAP_REVERSE = Object.fromEntries(Object.entries(CATEGORY_MAP).map(([k, v]) => [v, k]));

exports.handler = async (event) => {
  if (isPreflight(event)) return noContent();

  const session = getSessionFromEvent(event);
  if (!session) return json(401, { error: 'Sessão inválida ou expirada, faça login novamente' });

  const sql = getSql();

  if (event.httpMethod === 'GET') {
    const rows = await sql`
      SELECT id, categoria, causa FROM ishikawa_diagrams WHERE company_id = ${COMPANY_ID} ORDER BY id ASC
    `;
    const data = { problem: '', maoObra: [], metodo: [], maquina: [], material: [], meioAmbiente: [], medicao: [] };
    for (const row of rows) {
      if (row.categoria === PROBLEM_MARKER) {
        data.problem = row.causa;
        continue;
      }
      const key = CATEGORY_MAP[row.categoria];
      if (key) data[key].push({ id: row.id, causa: row.causa });
    }
    return json(200, { data });
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return json(400, { error: 'JSON inválido' });
    }

    if (typeof body.problem === 'string') {
      await sql`DELETE FROM ishikawa_diagrams WHERE company_id = ${COMPANY_ID} AND categoria = ${PROBLEM_MARKER}`;
      await sql`
        INSERT INTO ishikawa_diagrams (company_id, problem, categoria, causa, created_by)
        VALUES (${COMPANY_ID}, ${body.problem}, ${PROBLEM_MARKER}, ${body.problem}, ${session.name})
      `;
      return json(200, { ok: true });
    }

    const { categoria, causa } = body;
    const dbCategoria = CATEGORY_MAP_REVERSE[categoria];
    if (!dbCategoria || !causa) return json(400, { error: 'categoria e causa são obrigatórios' });

    const rows = await sql`
      INSERT INTO ishikawa_diagrams (company_id, problem, categoria, causa, created_by)
      VALUES (${COMPANY_ID}, '', ${dbCategoria}, ${causa}, ${session.name})
      RETURNING id
    `;
    return json(201, { id: rows[0].id });
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
    await sql`DELETE FROM ishikawa_diagrams WHERE id = ${id} AND company_id = ${COMPANY_ID}`;
    return json(200, { ok: true });
  }

  return json(405, { error: 'Método não permitido' });
};
