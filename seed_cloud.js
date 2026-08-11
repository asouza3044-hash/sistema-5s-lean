const CLOUD_MASTER_API = 'https://jsonblob.com/api/jsonBlob/019ff2fe-dc89-756e-bec9-d891b4f8ee03';

async function syncCleanUsersWithXando() {
  try {
    const res = await fetch(CLOUD_MASTER_API, { headers: { 'Accept': 'application/json' } });
    let data = await res.json();
    
    if (!data) data = {};

    const CLEAN_IMPAK_USERS_MAP = {
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

      xando: { username: 'xando', password: '5s2026', name: 'Xando Souza', role: 'lider_diario', level: 'diario', sector: 'Usinagem', title: 'Grupo 1: Líder de Usinagem' },
      xandinho: { username: 'xandinho', password: '5s2026', name: 'Xandinho (Teste)', role: 'colaborador', level: 'colaborador', sector: 'Acabamento', title: 'Grupo 1: Colaborador de Acabamento' },

      monitor: { username: 'monitor', password: '5s2026', name: 'Gestão Visual TV Fábrica & Escritório', role: 'monitor', level: 'monitor', title: '📺 Gestão Visual 5S (TV 16:9)' }
    };

    data.users = CLEAN_IMPAK_USERS_MAP;

    const putRes = await fetch(CLOUD_MASTER_API, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (putRes.ok) {
      console.log('🎉 XANDO E XANDINHO INCLUÍDOS COM SUCESSO NO BANCO DA NUVEM!');
    } else {
      console.error('Erro ao atualizar a nuvem:', putRes.status);
    }
  } catch (err) {
    console.error('Erro ao sincronizar usuários:', err);
  }
}

syncCleanUsersWithXando();
