const CLOUD_MASTER_API = 'https://jsonblob.com/api/jsonBlob/019ff2fe-dc89-756e-bec9-d891b4f8ee03';

async function syncAllUsers() {
  try {
    const res = await fetch(CLOUD_MASTER_API, { headers: { 'Accept': 'application/json' } });
    let data = await res.json();
    
    if (!data) data = {};

    const FULL_USERS_MAP = {
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

      xando: { username: 'xando', password: '5s2026', name: 'Xando Souza', role: 'administrador', level: 'senior', sector: 'Acabamento', title: 'Grupo 3: Administrador Mestre 5S' },
      ararinha: { username: 'ararinha', password: '5s2026', name: 'Ararinha Azul', role: 'lider_diario', level: 'diario', sector: 'Usinagem', title: 'Grupo 1: Líder de Usinagem' },
      maria: { username: 'maria.sohipren', password: '5s2026', name: 'Maria Silva', role: 'auditor_semanal', level: 'semanal', sector: 'Holter', title: 'Grupo 2: Auditora Volante 5S' },
      sohipren_user: { username: 'sohipren', password: '5s2026', name: 'Operador Sohipren', role: 'lider_diario', level: 'diario', sector: 'Armários', title: 'Grupo 1: Líder de Armários' },
      logistica_user: { username: 'logistica', password: '5s2026', name: 'Gerente Logística', role: 'auditor_semanal', level: 'semanal', sector: 'Portas / Cortinas', title: 'Grupo 2: Auditor Logística' },

      monitor: { username: 'monitor', password: '5s2026', name: 'Gestão Visual TV Fábrica & Escritório', role: 'monitor', level: 'monitor', title: '📺 Gestão Visual 5S (TV 16:9)' }
    };

    data.users = { ...FULL_USERS_MAP, ...(data.users || {}) };

    const putRes = await fetch(CLOUD_MASTER_API, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (putRes.ok) {
      console.log('🎉 TODOS OS 16 USUÁRIOS RECONSTITUÍDOS COM SUCESSO NO BANCO!');
    } else {
      console.error('Erro ao salvar usuários:', putRes.status);
    }
  } catch (err) {
    console.error('Erro na sincronização de usuários:', err);
  }
}

syncAllUsers();
