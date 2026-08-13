const { getSql } = require('./_lib/db');
const { getSessionFromEvent } = require('./_lib/auth');
const { json, noContent, isPreflight } = require('./_lib/http');

function summarize(votes) {
  const totalPts = votes.reduce((acc, v) => acc + v.points, 0);
  const avgPts = totalPts / votes.length;
  let status = 'bom';
  if (avgPts >= 2.5) status = 'bom';
  else if (avgPts >= 1.7) status = 'regular';
  else status = 'ruim';
  return { status, avgPoints: Math.round(avgPts * 10) / 10, voteCount: votes.length, votes };
}

exports.handler = async (event) => {
  if (isPreflight(event)) return noContent();

  const session = getSessionFromEvent(event);
  if (!session) return json(401, { error: 'Sessão inválida ou expirada, faça login novamente' });

  const sql = getSql();

  if (event.httpMethod === 'GET') {
    const rows = await sql`
      SELECT id, board_key, voter_username, voter_name, score, points, comment, voted_at
      FROM factory_board_votes
      ORDER BY voted_at ASC
    `;
    const board = {};
    for (const row of rows) {
      if (!board[row.board_key]) board[row.board_key] = [];
      board[row.board_key].push({
        id: row.id,
        username: row.voter_username,
        name: row.voter_name,
        score: row.score,
        points: row.points,
        comment: row.comment,
        timestamp: row.voted_at,
      });
    }
    const summarized = {};
    for (const key of Object.keys(board)) {
      summarized[key] = summarize(board[key]);
    }
    return json(200, { board: summarized });
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return json(400, { error: 'JSON inválido' });
    }
    const { boardKey, sector, senso, dayCode, score, points, comment } = body;
    if (!boardKey || !sector || !senso || !dayCode || !score) {
      return json(400, { error: 'Dados incompletos para registrar o voto' });
    }

    try {
      await sql`
        INSERT INTO factory_board_votes (board_key, sector, senso, day_code, voter_username, voter_name, score, points, comment)
        VALUES (${boardKey}, ${sector}, ${senso}, ${dayCode}, ${session.username}, ${session.name}, ${score}, ${points}, ${comment || null})
      `;
    } catch (err) {
      if (err && err.code === '23505') {
        return json(409, { error: 'Você já registrou sua avaliação nesta célula hoje' });
      }
      throw err;
    }
    return json(201, { ok: true });
  }

  if (event.httpMethod === 'DELETE') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return json(400, { error: 'JSON inválido' });
    }

    // Remover 1 voto específico: poder de moderação do Nível 2 (auditor_semanal/semanal) e Nível 3
    // (administrador/senior) — usado para tirar um voto que julguem tendencioso ou incorreto.
    if (body.voteId) {
      const modRows = await sql`SELECT role, level FROM users WHERE username = ${session.username} LIMIT 1`;
      const mod = modRows[0];
      const canModerate = mod && (['administrador', 'auditor_semanal'].includes(mod.role) || ['senior', 'semanal'].includes(mod.level));
      if (!canModerate) return json(403, { error: 'Só auditores (Nível 2) ou gerência (Nível 3) podem remover um voto de outra pessoa' });

      await sql`DELETE FROM factory_board_votes WHERE id = ${body.voteId}`;
      return json(200, { ok: true });
    }

    // Só para uso administrativo em testes/demonstrações: apaga o voto do dia de um usuário
    // para que ele possa votar de novo (o normal é o UNIQUE bloquear voto duplicado no dia).
    if (body.voterUsername && body.dayCode) {
      const adminRows = await sql`SELECT role, level FROM users WHERE username = ${session.username} LIMIT 1`;
      const admin = adminRows[0];
      const isAdmin = admin && (admin.role === 'administrador' || admin.level === 'senior');
      if (!isAdmin) return json(403, { error: 'Só administradores podem liberar o voto de outro usuário' });

      await sql`DELETE FROM factory_board_votes WHERE voter_username = ${body.voterUsername} AND day_code = ${body.dayCode}`;
      return json(200, { ok: true });
    }

    return json(400, { error: 'Informe voteId, ou voterUsername + dayCode' });
  }

  return json(405, { error: 'Método não permitido' });
};
