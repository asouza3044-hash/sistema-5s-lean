const { getSql } = require('./_lib/db');
const { getSessionFromEvent } = require('./_lib/auth');
const { json, noContent, isPreflight } = require('./_lib/http');

const COMPANY_ID = 'impaktto';

const IMPAKTTO_SECTORS = [
  "Usinagem",
  "Holter",
  "Armários",
  "Portas / Cortinas",
  "Acabamento"
];

exports.handler = async (event) => {
  if (isPreflight(event)) return noContent();

  const session = getSessionFromEvent(event);
  if (!session) return json(401, { error: 'Sessão inválida ou expirada, faça login novamente' });

  const sql = getSql();

  if (event.httpMethod === 'GET') {
    try {
      // 1. Histórico de Fechamentos Mensais
      const closures = await sql`
        SELECT id, year, month, sector, monthly_avg_points AS "monthlyAvgPoints",
               monthly_compliance_pct AS "monthlyCompliancePct", hit_meta AS "hitMeta",
               won_award AS "wonAward", closed_by_name AS "closedByName", notes,
               closed_at AS "closedAt"
        FROM monthly_awards_closures
        WHERE company_id = ${COMPANY_ID}
        ORDER BY year DESC, month DESC, monthly_compliance_pct DESC
      `;

      // 2. Ranking de Acúmulo do Prêmio Mór Anual
      const currentYear = new Date().getFullYear();
      const annualStats = await sql`
        SELECT sector,
               COUNT(*)::int AS "monthsClosed",
               SUM(CASE WHEN won_award = TRUE THEN 1 ELSE 0 END)::int AS "monthlyWinsCount",
               AVG(monthly_compliance_pct)::numeric(5,2) AS "annualAvgCompliancePct",
               AVG(monthly_avg_points)::numeric(3,2) AS "annualAvgPoints"
        FROM monthly_awards_closures
        WHERE company_id = ${COMPANY_ID} AND year = ${currentYear}
        GROUP BY sector
        ORDER BY "monthlyWinsCount" DESC, "annualAvgCompliancePct" DESC
      `;

      return json(200, {
        closures,
        annualStats,
        sectors: IMPAKTTO_SECTORS,
        currentYear
      });
    } catch (err) {
      console.error('Erro no GET de department-evolution:', err);
      return json(500, { error: 'Erro ao buscar dados de evolução por departamento' });
    }
  }

  if (event.httpMethod === 'POST') {
    const isSenior = (session.role === 'administrador' || session.level === 'senior');
    if (!isSenior) {
      return json(403, { error: 'Apenas a Gerência & Diretoria (Nível 3) podem realizar o fechamento mensal' });
    }

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch(e) {}

    const now = new Date();
    const year = Number(body.year) || now.getFullYear();
    const month = Number(body.month) || (now.getMonth() + 1);
    const notes = body.notes || 'Fechamento de Auditoria do Último Dia Útil do Mês';

    try {
      // Puxar votos do quadro para calcular médias do mês
      const votes = await sql`
        SELECT sector, score, points
        FROM factory_board_votes
      `;

      const sectorMap = {};
      IMPAKTTO_SECTORS.forEach(s => {
        sectorMap[s] = { totalPoints: 0, count: 0 };
      });

      votes.forEach(v => {
        if (sectorMap[v.sector]) {
          sectorMap[v.sector].totalPoints += Number(v.points || 3);
          sectorMap[v.sector].count += 1;
        }
      });

      const results = [];
      for (const sector of IMPAKTTO_SECTORS) {
        const data = sectorMap[sector];
        const avgPts = data.count > 0 ? (data.totalPoints / data.count) : 3.0;
        const compliancePct = Math.round((avgPts / 3.0) * 100 * 10) / 10;
        const hitMeta = (compliancePct >= 90.0);

        results.push({
          sector,
          avgPts: Math.round(avgPts * 100) / 100,
          compliancePct,
          hitMeta
        });
      }

      // Determinar vencedor(es) do prêmio mensal
      const maxPct = Math.max(...results.map(r => r.compliancePct));
      
      const savedClosures = [];
      for (const r of results) {
        const wonAward = r.hitMeta && (r.compliancePct === maxPct);
        const rows = await sql`
          INSERT INTO monthly_awards_closures
            (company_id, year, month, sector, monthly_avg_points, monthly_compliance_pct, hit_meta, won_award, closed_by_id, closed_by_name, notes)
          VALUES
            (${COMPANY_ID}, ${year}, ${month}, ${r.sector}, ${r.avgPts}, ${r.compliancePct}, ${r.hitMeta}, ${wonAward}, ${session.username}, ${session.name}, ${notes})
          ON CONFLICT (company_id, year, month, sector)
          DO UPDATE SET
            monthly_avg_points = EXCLUDED.monthly_avg_points,
            monthly_compliance_pct = EXCLUDED.monthly_compliance_pct,
            hit_meta = EXCLUDED.hit_meta,
            won_award = EXCLUDED.won_award,
            closed_by_id = EXCLUDED.closed_by_id,
            closed_by_name = EXCLUDED.closed_by_name,
            notes = EXCLUDED.notes,
            closed_at = CURRENT_TIMESTAMP
          RETURNING id, year, month, sector, monthly_avg_points AS "monthlyAvgPoints", monthly_compliance_pct AS "monthlyCompliancePct", hit_meta AS "hitMeta", won_award AS "wonAward"
        `;
        savedClosures.push(rows[0]);
      }

      // Registrar atividade
      await sql`
        INSERT INTO activity_logs (company_id, id, user_name, action)
        VALUES (${COMPANY_ID}, ${Date.now()}, ${session.name}, ${`🏆 Realizou o Fechamento Mensal de Auditoria e Premiação 5S (${month}/${year})`})
      `;

      return json(200, { ok: true, closures: savedClosures });
    } catch (err) {
      console.error('Erro no POST de fechamento mensal:', err);
      return json(500, { error: 'Erro ao realizar o fechamento mensal' });
    }
  }

  return json(405, { error: 'Método não permitido' });
};
