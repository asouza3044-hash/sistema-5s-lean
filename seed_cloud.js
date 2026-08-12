const CLOUD_MASTER_API = 'https://api.restful-api.dev/objects/ff8081819f7e10ae019ff3b195e32be6';

async function seedRestfulCloud() {
  try {
    const OFFICIAL_IMPAK_USERS = {
      admin: { username: 'admin', password: 'mestre5s', name: 'Alexandre Souza', role: 'administrador', level: 'senior', sector: 'Acabamento', title: 'Grupo 3: Gerente de Projeto / Líder Mestre' },
      kaio: { username: 'kaio.diretor', password: '5s2026', name: 'Kaio', role: 'administrador', level: 'senior', sector: 'Usinagem', title: 'Grupo 3: Diretor' },
      diego: { username: 'diego.fabrica', password: '5s2026', name: 'Diego', role: 'auditor_semanal', level: 'semanal', sector: 'Holter', title: 'Grupo 2: Encarregado de Fábrica' },
      filipe: { username: 'filipe.rh', password: '5s2026', name: 'Filipe', role: 'auditor_semanal', level: 'semanal', sector: 'Armários', title: 'Grupo 2: Encarregado RH - 5S' },
      clayton: { username: 'clayton.auditor', password: '5s2026', name: 'Clayton', role: 'auditor_semanal', level: 'semanal', sector: 'Portas / Cortinas', title: 'Grupo 2: Auditor Volante 5S / Suplência & Calibração' },

      alexandre_u: { username: 'alexandre.usinagem', password: '5s2026', name: 'Alexandre Usinagem', role: 'lider_diario', level: 'diario', sector: 'Usinagem', title: 'Grupo 1: Líder de Usinagem' },
      marcos: { username: 'marcos.holter', password: '5s2026', name: 'Marcos', role: 'lider_diario', level: 'diario', sector: 'Holter', title: 'Grupo 1: Líder de Holter' },
      bruno: { username: 'bruno.armarios', password: '5s2026', name: 'Bruno', role: 'lider_diario', level: 'diario', sector: 'Armários', title: 'Grupo 1: Líder de Armários' },
      elton: { username: 'elton.portas', password: '5s2026', name: 'Elton', role: 'lider_diario', level: 'diario', sector: 'Portas / Cortinas', title: 'Grupo 1: Líder de Portas / Cortinas' },
      giovanna: { username: 'giovanna.acabamento', password: '5s2026', name: 'Giovanna', role: 'lider_diario', level: 'diario', sector: 'Acabamento', title: 'Grupo 1: Líder de Acabamento' },

      monitor: { username: 'monitor', password: '5s2026', name: 'Gestão Visual TV Fábrica & Escritório', role: 'monitor', level: 'monitor', title: '📺 Gestão Visual 5S (TV 16:9)' }
    };

    const payload = {
      name: 'IMPAK_TTO_5S_MASTER_STATE',
      data: {
        users: OFFICIAL_IMPAK_USERS,
        activity_logs: [
          { id: 1786450000000, userName: 'Alexandre Souza', action: 'Iniciou Auditoria Diária 5S da IMPAK TTO', timestamp: '11/08/2026, 18:00:00' }
        ],
        factory_board: {
          'Armários_seiri_TER': {
            status: 'bom',
            avgPoints: 3,
            votes: [{ username: 'bruno.armarios', name: 'Bruno', role: 'lider_diario', score: 'bom', points: 3, comment: 'Bancadas 100% limpas e organizadas', timestamp: '11/08/2026 18:15' }]
          }
        },
        audit_scores: {}
      }
    };

    const res = await fetch(CLOUD_MASTER_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log('🎉 NUVEM RESTFUL-API POPULADA COM SUCESSO TOTAL!');
    } else {
      console.error('Erro na população da nuvem:', res.status);
    }
  } catch (err) {
    console.error('Erro na semente da nuvem:', err);
  }
}

seedRestfulCloud();
