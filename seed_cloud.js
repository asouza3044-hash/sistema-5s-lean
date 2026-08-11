const CLOUD_MASTER_API = 'https://jsonblob.com/api/jsonBlob/019ff2fe-dc89-756e-bec9-d891b4f8ee03';

async function inspectAndCleanCloud() {
  try {
    const res = await fetch(CLOUD_MASTER_API, { headers: { 'Accept': 'application/json' } });
    let data = await res.json();
    
    console.log('Tamanho atual do JSON raw:', JSON.stringify(data).length, 'bytes');

    // Manter dados essenciais e enxutos
    const cleanData = {
      users: data.users || {},
      activity_logs: (data.activity_logs || []).slice(0, 20),
      factory_board: data.factory_board || {},
      audit_scores: data.audit_scores || {}
    };

    cleanData.factory_board['Armários_seiri_TER'] = {
      status: 'bom',
      avgPoints: 3,
      votes: [{ username: 'bruno.armarios', name: 'Bruno', role: 'lider_diario', score: 'bom', points: 3, comment: 'Bancadas 100% limpas e organizadas', timestamp: '11/08/2026 10:15' }]
    };

    cleanData.factory_board['Usinagem_seiton_TER'] = {
      status: 'bom',
      avgPoints: 3,
      votes: [{ username: 'alexandre.usinagem', name: 'Alexandre Usinagem', role: 'lider_diario', score: 'bom', points: 3, comment: 'Ferramentas identificadas nos painéis shadowboard', timestamp: '11/08/2026 10:30' }]
    };

    cleanData.factory_board['Holter_seiso_TER'] = {
      status: 'regular',
      avgPoints: 2,
      votes: [{ username: 'marcos.holter', name: 'Marcos', role: 'lider_diario', score: 'regular', points: 2, comment: 'Limpeza em andamento na bancada central', timestamp: '11/08/2026 11:05' }]
    };

    cleanData.factory_board['Portas / Cortinas_seiketsu_TER'] = {
      status: 'bom',
      avgPoints: 3,
      votes: [{ username: 'elton.portas', name: 'Elton', role: 'lider_diario', score: 'bom', points: 3, comment: 'EPIs e demarcações em perfeito estado', timestamp: '11/08/2026 11:45' }]
    };

    const newJsonStr = JSON.stringify(cleanData);
    console.log('Novo tamanho do JSON limpo:', newJsonStr.length, 'bytes');

    const putRes = await fetch(CLOUD_MASTER_API, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: newJsonStr
    });

    if (putRes.ok) {
      console.log('🎉 BANCO DE DADOS EM NUVEM LIMPO E POPULADO COM SUCESSO!');
    } else {
      console.error('Erro na resposta do PUT:', putRes.status, putRes.statusText);
    }
  } catch (err) {
    console.error('Erro na inspeção e limpeza:', err);
  }
}

inspectAndCleanCloud();
