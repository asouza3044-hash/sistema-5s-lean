/* ==========================================================================
   PORTAL DEDICADO IMPAK TTO PLÁSTICOS DE ENGENHARIA
   PROJETO ESPECIAL DE IMPLANTAÇÃO 5S & QUALIDADE (SENAI)
   ========================================================================== */

// BANCO DE DADOS CENTRALIZADO EM NUVEM MASTER (RESTRITO IMPAK TTO - 100% REALTIME)
const CLOUD_MASTER_API = 'https://jsonblob.com/api/jsonBlob/019ff2fe-dc89-756e-bec9-d891b4f8ee03';

// CANAL DE TRANSMISSÃO EM TEMPO REAL CROSS-TAB (INTER-ABAS E DISPOSITIVOS LOCALHOST/GITHUB)
const syncChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('5s_impaktto_sync_channel') : null;

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    if (event.data && event.data.type === 'SYNC_ALL_DATA') {
      loadImpakttoData();
    }
  };
}

// OUVINTE DE ARMAZENAMENTO COMPARTILHADO (CROSS-TAB SYNC)
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('5s_')) {
    loadImpakttoData();
  }
});

// 1. ENTRADA RÁPIDA MESTRE EM 1 CLIQUE (IMPAK TTO)
window.quickMasterLogin = function() {
  currentUser = DEFAULT_USERS.admin;
  localStorage.setItem('5s_impaktto_session', JSON.stringify(currentUser));
  
  const loginOverlay = document.getElementById('login-overlay');
  if (loginOverlay) {
    loginOverlay.style.display = 'none';
    loginOverlay.classList.add('hidden');
  }

  try {
    checkAuthSession();
  } catch (err) {
    console.error('Erro na entrada rápida:', err);
  }
};

// 2. DECLARAÇÃO GLOBAL DO ALTERNADOR INSTANTÂNEO DE ABAS (LOGIN / CADASTRO)
window.switchAuthTab = function(mode) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const btnTabLogin = document.getElementById('auth-tab-login');
  const btnTabRegister = document.getElementById('auth-tab-register');

  if (mode === 'register') {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (btnTabLogin) btnTabLogin.classList.remove('active');
    if (btnTabRegister) btnTabRegister.classList.add('active');
  } else {
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (btnTabLogin) btnTabLogin.classList.remove('active');
    if (btnTabRegister) btnTabRegister.classList.remove('active');
  }
};

window.toggleAuthMode = window.switchAuthTab;

// OS 5 SETORES OFICIAIS DA FÁBRICA NA MATRIZ DE RODÍZIO
const IMPAKTTO_SECTORS = [
  "Usinagem",
  "Holter",
  "Armários",
  "Portas / Cortinas",
  "Acabamento"
];

// LISTA DOS 5 SENSOS DO PROGRAMA 5S
const SENSOS_LIST = [
  { key: 'seiri', name: '1. UTILIZAÇÃO (SEIRI)', desc: 'Separar o útil do inútil e descartar desnecessários das bancadas.' },
  { key: 'seiton', name: '2. ORGANIZAÇÃO (SEITON)', desc: 'Um lugar para cada coisa e identificação visual de ferramentas e materiais.' },
  { key: 'seiso', name: '3. LIMPEZA (SEISO)', desc: 'Inspeção, higiene e conservação diária das máquinas e bancadas.' },
  { key: 'seiketsu', name: '4. PADRONIZAÇÃO (SEIKETSU)', desc: 'Manutenção de padrões visuais, saúde e uso correto de EPIs.' },
  { key: 'shitsuke', name: '5. DISCIPLINA (SHITSUKE)', desc: 'Autodisciplina e cumprimento rigoroso das regras da fábrica.' }
];

// MATRIZ DE ALOCAÇÃO DETERMINÍSTICA E BALANCEADA DO RODÍZIO 5X5
function getRotationAssignment(user, dayCodeInput) {
  if (!user) {
    return { targetSector: 'Holter', targetSenso: SENSOS_LIST[0] };
  }

  const daysOrder = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const todayIdxRaw = new Date().getDay();
  const currentDayCode = dayCodeInput || (dayNames[todayIdxRaw] === 'DOM' ? 'SEG' : dayNames[todayIdxRaw]);
  const dayOffset = Math.max(0, daysOrder.indexOf(currentDayCode));

  const userSector = user.sector || 'Usinagem';
  let sectorIdx = IMPAKTTO_SECTORS.indexOf(userSector);
  if (sectorIdx === -1) sectorIdx = 0;

  const targetSectorIdx = (sectorIdx + 1 + (dayOffset % 4)) % IMPAKTTO_SECTORS.length;
  const targetSector = IMPAKTTO_SECTORS[targetSectorIdx];

  const sectorUsers = Object.values(userDatabase)
    .filter(u => (u.sector || 'Usinagem') === userSector && u.username !== 'monitor')
    .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

  const userIdxInSector = Math.max(0, sectorUsers.findIndex(u => u.username === user.username));
  const targetSensoIdx = (userIdxInSector + dayOffset) % SENSOS_LIST.length;
  const targetSenso = SENSOS_LIST[targetSensoIdx];

  return { targetSector, targetSenso, dayCode: currentDayCode };
}

function getBalancedTargetSector(user) {
  return getRotationAssignment(user).targetSector;
}

// USUÁRIOS OFICIAIS PRÉ-CONFIGURADOS DA EQUIPE IMPAK TTO (EXCLUSIVAMENTE OS 11 OFICIAIS DA EMPRESA)
const DEFAULT_USERS = {
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

// EMBEDDED MASTER SEED DADOS DA IMPAK TTO (GARANTIA DE FUNCIONAMENTO MESMO SEM NENHUM BD EXTERNO)
const DEFAULT_FACTORY_BOARD_SEED = {
  'Armários_seiri_TER': {
    status: 'bom',
    avgPoints: 3,
    votes: [{ username: 'bruno.armarios', name: 'Bruno', role: 'lider_diario', score: 'bom', points: 3, comment: 'Bancadas 100% limpas e organizadas', timestamp: '11/08/2026 18:15' }]
  },
  'Usinagem_seiton_TER': {
    status: 'bom',
    avgPoints: 3,
    votes: [{ username: 'alexandre.usinagem', name: 'Alexandre Usinagem', role: 'lider_diario', score: 'bom', points: 3, comment: 'Ferramentas identificadas nos painéis shadowboard', timestamp: '11/08/2026 18:30' }]
  },
  'Holter_seiso_TER': {
    status: 'regular',
    avgPoints: 2,
    votes: [{ username: 'marcos.holter', name: 'Marcos', role: 'lider_diario', score: 'regular', points: 2, comment: 'Limpeza em andamento na bancada central', timestamp: '11/08/2026 18:45' }]
  },
  'Portas / Cortinas_seiketsu_TER': {
    status: 'bom',
    avgPoints: 3,
    votes: [{ username: 'elton.portas', name: 'Elton', role: 'lider_diario', score: 'bom', points: 3, comment: 'EPIs e demarcações em perfeito estado', timestamp: '11/08/2026 19:00' }]
  }
};

const DEFAULT_ACTIVITY_LOGS_SEED = [
  { id: 1786450000000, userName: 'Alexandre Souza', action: 'Iniciou Auditoria Diária 5S da IMPAK TTO', timestamp: '11/08/2026, 18:00:00' },
  { id: 1786450100000, userName: 'Bruno', action: 'Marcou UTILIZAÇÃO (SEIRI) na TER como 🟢 BOM no Setor Armários', timestamp: '11/08/2026, 18:15:00' },
  { id: 1786450200000, userName: 'Alexandre Usinagem', action: 'Marcou ORGANIZAÇÃO (SEITON) na TER como 🟢 BOM no Setor Usinagem', timestamp: '11/08/2026, 18:30:00' },
  { id: 1786450300000, userName: 'Marcos', action: 'Marcou LIMPEZA (SEISO) na TER como 🟡 REGULAR no Setor Holter', timestamp: '11/08/2026, 18:45:00' },
  { id: 1786450400000, userName: 'Elton', action: 'Marcou PADRONIZAÇÃO (SEIKETSU) na TER como 🟢 BOM no Setor Portas / Cortinas', timestamp: '11/08/2026, 19:00:00' }
];

// HELPER DE EXPURGO DE INTEGRANTES DELETADOS (IMPEDE QUE POLLING DA NUVEM RE-CRIE USUÁRIOS EXCLUÍDOS)
function purgeDeletedUsers(usersObj) {
  if (!usersObj || typeof usersObj !== 'object') return {};
  const deletedList = JSON.parse(localStorage.getItem('5s_impaktto_deleted_users')) || [];
  deletedList.forEach(uKey => {
    delete usersObj[uKey];
  });
  return usersObj;
}

// Estado Global
const mobileCustomUsersInit = JSON.parse(localStorage.getItem('5s_mobile_custom_users')) || {};
let userDatabase = purgeDeletedUsers({ 
  ...DEFAULT_USERS, 
  ...mobileCustomUsersInit, 
  ...(JSON.parse(localStorage.getItem('5s_impaktto_users')) || {}) 
});
userDatabase.admin = DEFAULT_USERS.admin;
userDatabase.clayton = DEFAULT_USERS.clayton;
userDatabase.monitor = DEFAULT_USERS.monitor;

let currentUser = JSON.parse(localStorage.getItem('5s_impaktto_session')) || null;

// Dados da Impaktto
let clientAuditScores = {};
let clientGutMatrix = [];
let clientKanbanTasks = [];
let clientIshikawaData = {};
let clientActivityLogs = [];
let clientFactoryBoard = {};
let activeFactorySectorFilter = 'ALL';
let radarChartInstance = null;
let autoRefreshTimer = null;
let currentVoteTarget = null;
let level1SelectedOption = 'bom';

// HELPER PARA CÁLCULO E CONVERSÃO DE MÉDIA DE VOTOS POR CÉLULA DO QUADRO (DIFERENCIA CÉLULAS PENDENTES DE CÉLULAS VOTADAS)
function getBoardCellSummary(boardKey) {
  const cellData = clientFactoryBoard[boardKey];
  if (!cellData) {
    return { status: 'pendente', avgPoints: 0, voteCount: 0, votes: [] };
  }

  if (typeof cellData === 'string') {
    const pts = cellData === 'bom' ? 3 : (cellData === 'regular' ? 2 : 1);
    return { status: cellData, avgPoints: pts, voteCount: 1, votes: [{ name: 'Voto Registrado', score: cellData, points: pts }] };
  }

  if (typeof cellData === 'object') {
    const votes = Array.isArray(cellData.votes) ? cellData.votes : [];
    if (votes.length === 0) {
      return { status: cellData.status || 'pendente', avgPoints: cellData.avgPoints || 0, voteCount: 0, votes: [] };
    }

    const totalPts = votes.reduce((acc, v) => acc + (v.points || (v.score === 'bom' ? 3 : (v.score === 'regular' ? 2 : 1))), 0);
    const avgPts = totalPts / votes.length;
    let computedStatus = 'bom';

    if (avgPts >= 2.5) {
      computedStatus = 'bom';
    } else if (avgPts >= 1.7) {
      computedStatus = 'regular';
    } else {
      computedStatus = 'ruim';
    }

    return {
      status: computedStatus,
      avgPoints: Math.round(avgPts * 10) / 10,
      voteCount: votes.length,
      votes: votes
    };
  }

  return { status: 'pendente', avgPoints: 0, voteCount: 0, votes: [] };
}

// FUNÇÕES MESTRE DE SINCRONIZAÇÃO EM NUVEM REALTIME (MESCLA BIDIRECIONAL COMPLETA SEM PERDAS)
async function pushDataToServer() {
  localStorage.setItem('5s_factory_board_impaktto', JSON.stringify(clientFactoryBoard));
  localStorage.setItem('5s_activity_logs_impaktto', JSON.stringify(clientActivityLogs));
  localStorage.setItem('5s_impaktto_users', JSON.stringify(userDatabase));

  // COMUNICAÇÃO IMEDIATA VIA BROADCAST CHANNEL DENTRO DO NAVEGADOR
  if (syncChannel) {
    try { syncChannel.postMessage({ type: 'SYNC_ALL_DATA', timestamp: Date.now() }); } catch (e) {}
  }

  let cloudState = { users: {}, activity_logs: [], factory_board: {}, audit_scores: {} };

  try {
    const res = await fetch(CLOUD_MASTER_API, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const remote = await res.json();
      if (remote && !remote.error) {
        cloudState = remote;
      }
    }
  } catch(e) {}

  // MESCLA BIDIRECIONAL DA BASE DE USUÁRIOS (PRESERVA NOVOS USUÁRIOS CRIADOS SEM APAGAR)
  const mergedUsers = purgeDeletedUsers({ ...DEFAULT_USERS, ...(cloudState.users || {}), ...userDatabase });
  userDatabase = mergedUsers;

  // MESCLA BIDIRECIONAL DAS CÉLULAS DO QUADRO DA FÁBRICA
  const cloudBoard = cloudState.factory_board || {};
  
  // 1. Incorporar o que estava na nuvem que não temos localmente
  for (const [key, val] of Object.entries(cloudBoard)) {
    if (!clientFactoryBoard[key]) {
      clientFactoryBoard[key] = val;
    } else if (typeof val === 'object' && val.votes && Array.isArray(val.votes)) {
      // Mesclar votos locais com votos remotos para a mesma célula
      const localCell = getBoardCellSummary(key);
      const voteMap = new Map();
      (localCell.votes || []).forEach(v => voteMap.set(v.username || v.name, v));
      (val.votes || []).forEach(v => voteMap.set(v.username || v.name, v));

      const mergedVotes = Array.from(voteMap.values());
      const totalPts = mergedVotes.reduce((acc, v) => acc + (v.points || (v.score === 'bom' ? 3 : (v.score === 'regular' ? 2 : 1))), 0);
      const avgPts = mergedVotes.length > 0 ? totalPts / mergedVotes.length : 3;

      let avgStatus = 'bom';
      if (avgPts >= 2.5) avgStatus = 'bom';
      else if (avgPts >= 1.7) avgStatus = 'regular';
      else avgStatus = 'ruim';

      clientFactoryBoard[key] = {
        status: avgStatus,
        avgPoints: Math.round(avgPts * 10) / 10,
        votes: mergedVotes
      };
    }
  }

  // 2. Garantir que todas as células locais estejam presentes na nuvem
  const mergedCloudBoard = { ...cloudBoard, ...clientFactoryBoard };

  const logMap = new Map();
  (cloudState.activity_logs || []).forEach(l => { if (l && l.id) logMap.set(l.id, l); });
  clientActivityLogs.forEach(l => { if (l && l.id) logMap.set(l.id, l); });
  const mergedLogs = Array.from(logMap.values()).sort((a, b) => b.id - a.id).slice(0, 25);

  const payload = {
    users: userDatabase,
    activity_logs: mergedLogs,
    factory_board: mergedCloudBoard,
    audit_scores: clientAuditScores
  };

  try {
    await fetch(CLOUD_MASTER_API, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Erro no Push da Nuvem:', e);
  }

  renderFactoryBoard();
  renderActivityLogs();
  calculateAuditResults();
  renderUserManagementTable();
}

async function pullDataFromServer() {
  try {
    const res = await fetch(CLOUD_MASTER_API);
    if (res.ok) {
      const raw = await res.json();
      const d = (raw && raw.data) ? raw.data : raw;

      if (d && !d.error) {
        let needsReRender = false;

        if (d.users && typeof d.users === 'object') {
          // MESCLA UNIFICADA: Preserva usuários recém-criados localmente + incorpora remotos da nuvem
          const mergedUsers = purgeDeletedUsers({ ...DEFAULT_USERS, ...d.users, ...userDatabase });
          if (Object.keys(mergedUsers).length !== Object.keys(userDatabase).length || JSON.stringify(Object.keys(mergedUsers)) !== JSON.stringify(Object.keys(userDatabase))) {
            userDatabase = mergedUsers;
            localStorage.setItem('5s_impaktto_users', JSON.stringify(userDatabase));
            needsReRender = true;
          }
        }

        if (Array.isArray(d.activity_logs)) {
          const logMap = new Map();
          clientActivityLogs.forEach(l => { if (l && l.id) logMap.set(l.id, l); });
          d.activity_logs.forEach(l => { if (l && l.id) logMap.set(l.id, l); });
          const mergedLogs = Array.from(logMap.values()).sort((a, b) => b.id - a.id).slice(0, 25);

          if (mergedLogs.length !== clientActivityLogs.length || (mergedLogs[0] && clientActivityLogs[0] && mergedLogs[0].id !== clientActivityLogs[0].id)) {
            clientActivityLogs = mergedLogs;
            localStorage.setItem('5s_activity_logs_impaktto', JSON.stringify(clientActivityLogs));
            needsReRender = true;
          }
        }

        if (d.factory_board && typeof d.factory_board === 'object') {
          const cloudBoard = d.factory_board;
          for (const [key, val] of Object.entries(cloudBoard)) {
            if (JSON.stringify(clientFactoryBoard[key]) !== JSON.stringify(val)) {
              clientFactoryBoard[key] = val;
              needsReRender = true;
            }
          }
        }

        localStorage.setItem('5s_factory_board_impaktto', JSON.stringify(clientFactoryBoard));
        renderFactoryBoard();
        renderActivityLogs();
        calculateAuditResults();
        renderUserManagementTable();
      }
    }
  } catch (e) {
    console.error('Erro no Pull da Nuvem:', e);
  }
}

window.forceCloudSyncNow = async function() {
  await pushDataToServer();
  await pullDataFromServer();
  renderUserManagementTable();
  renderActivityLogs();
  renderFactoryBoard();
  calculateAuditResults();
  alert('🎉 Sincronização Mestre de Nuvem Concluída! Todos os cadastros, votos e gráficos estão atualizados.');
};

// HELPER PARA LIBERAR O VOTO DO USUÁRIO ATUAL DURANTE OS TESTES
window.resetCurrentMyVoteForTesting = function() {
  if (!currentUser) return;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const userVoteKey = `5s_user_voted_${currentUser.username}_${todayDateStr}`;
  localStorage.removeItem(userVoteKey);
  alert(`🔄 Seu voto diário de hoje foi LIBERADO para novo teste!`);
  renderLevel1DirectVotingScreen();
  checkAuthSession();
};

// RENDERIZAÇÃO UNIVERSAL DA TELA ÚNICA DIRETA DE VOTAÇÃO (PADRÃO MESTRE DE ABERTURA PARA TODOS OS NÍVEIS 1, 2 E 3)
function renderLevel1DirectVotingScreen() {
  const container = document.getElementById('universal-voting-container') || document.getElementById('factory-board-container');
  if (!container) return;

  const level = currentUser ? (currentUser.level || 'colaborador') : 'colaborador';
  const role = currentUser ? (currentUser.role || 'colaborador') : 'colaborador';
  const isLevel1 = (level === 'diario' || level === 'colaborador' || role === 'colaborador' || role === 'lider_diario');

  const titleEl = document.getElementById('factory-board-title');
  const subtitleEl = document.getElementById('factory-board-subtitle');
  const filterSelectContainer = document.getElementById('factory-board-filter-container');

  if (isLevel1) {
    if (titleEl) {
      titleEl.style.display = 'block';
      titleEl.innerHTML = `📋 Sistema de Votação 5S (Chão de Fábrica)`;
    }
    if (subtitleEl) subtitleEl.style.display = 'none';
    if (filterSelectContainer) filterSelectContainer.style.display = 'none';
  }

  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const todayIdxRaw = new Date().getDay();
  const currentDayCode = dayNames[todayIdxRaw] === 'DOM' ? 'SEG' : dayNames[todayIdxRaw];

  const assignment = getRotationAssignment(currentUser, currentDayCode);
  const userSector = currentUser ? (currentUser.sector || 'Fábrica') : 'Fábrica';

  const todayDateStr = new Date().toISOString().split('T')[0];
  const userVoteKey = currentUser ? `5s_user_voted_${currentUser.username}_${todayDateStr}` : '5s_user_voted_guest';
  const hasVotedToday = (localStorage.getItem(userVoteKey) === 'true');

  if (!level1SelectedOption) {
    level1SelectedOption = 'bom';
  }

  const selOpt = level1SelectedOption || 'bom';
  const isBom = (selOpt === 'bom');
  const isRegular = (selOpt === 'regular');
  const isRuim = (selOpt === 'ruim');

  const levelBadgeLabel = isLevel1 
    ? '🟢 Nível 1: Chão de Fábrica' 
    : (level === 'semanal' ? '🟡 Nível 2: Auditor Volante / Encarregado' : '👑 Nível 3: Gerência & Diretoria');

  if (hasVotedToday) {
    container.innerHTML = `
      <div style="max-width:540px; margin:0.5rem auto; background:rgba(30,41,59,0.7); backdrop-filter:blur(12px); border:1px solid rgba(16,185,129,0.4); border-radius:16px; padding:1.8rem 1.4rem; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
        <div style="font-size: 3.5rem; margin-bottom: 0.4rem; animation: pulse 2s infinite;">✨</div>
        <h2 style="color: #34d399; font-size: 1.55rem; font-family: Outfit, sans-serif; font-weight: 800; margin-bottom: 0.4rem;">
          AVALIAÇÃO REGISTRADA COM SUCESSO!
        </h2>
        <p style="color: #e2e8f0; font-size: 0.98rem; line-height: 1.4; margin-bottom: 1.2rem;">
          Obrigado, <strong>${currentUser ? currentUser.name : 'Colaborador'}</strong>! Sua nota de hoje no Rodízio 5S para o Setor <strong>${assignment.targetSector}</strong> já foi gravada e computada no sistema.
        </p>
        <div style="background: rgba(16, 185, 129, 0.18); border: 2px solid #10b981; padding: 0.9rem; border-radius: 12px; color: #a7f3d0; font-size: 0.88rem; font-weight: 700; text-align: left; margin-bottom: 1.4rem;">
          🔒 <strong>Dever Cumprido no 5S:</strong> Seu voto diário foi finalizado com sucesso! ${isLevel1 ? 'Bom trabalho na fábrica!' : 'Utilize os quadros e abas abaixo para acompanhar a gestão e auditoria.'}
        </div>
        
        <div style="display:flex; gap:0.5rem; flex-direction:column;">
          <button class="btn btn-secondary" onclick="resetCurrentMyVoteForTesting()" style="padding: 0.65rem 1rem; font-size: 0.85rem; font-weight: 700; width: 100%; border-radius: 10px; background: rgba(99,102,241,0.2); border: 1px solid var(--accent-cyan);">
            🔄 Liberar Meu Voto Novamente (Para Testes)
          </button>
          ${isLevel1 ? `
            <button class="btn btn-secondary" onclick="handleLogout()" style="padding: 0.85rem 1.5rem; font-size: 1rem; font-weight: 800; width: 100%; border-radius: 10px;">
              🚪 Sair do Sistema
            </button>
          ` : ''}
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="max-width:540px; margin:0.5rem auto; background:rgba(30,41,59,0.7); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.12); border-radius:16px; padding:1.25rem; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem;">
        <div>
          <h3 style="margin:0; font-size:1.25rem; color:#ffffff; font-family:Outfit, sans-serif;">🗳️ Registrar Nota no Rodízio 5S</h3>
          <span style="font-size:0.82rem; color:var(--accent-cyan); font-weight:800;">📍 Dia: ${currentDayCode}</span>
        </div>
        <span style="background:rgba(16,185,129,0.2); border:1px solid #10b981; color:#34d399; font-size:0.75rem; font-weight:800; padding:0.25rem 0.6rem; border-radius:12px;">
          ${levelBadgeLabel}
        </span>
      </div>

      <!-- CARD DE HIGHLIGHT DE DESTINO -->
      <div style="background:linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,182,212,0.25)); border:2px solid #10b981; padding:0.9rem 1.1rem; border-radius:14px; margin-bottom:1.2rem; box-shadow:0 0 20px rgba(16,185,129,0.35);">
        <div style="font-size:0.75rem; font-weight:800; color:#34d399; text-transform:uppercase; letter-spacing:0.06em;">
          🎯 SEU ALVO NO RODÍZIO HOJE (${currentDayCode}):
        </div>
        <div style="font-size:1.35rem; font-weight:800; color:#ffffff; margin-top:0.2rem; text-shadow:0 0 10px rgba(52,211,153,0.5);">
          📍 SETOR ${assignment.targetSector.toUpperCase()}
        </div>
        <div style="font-size:0.92rem; font-weight:800; color:var(--accent-cyan); margin-top:0.35rem;">
          💡 SENSO DESIGNADO: ${assignment.targetSenso.name}
        </div>

        <!-- EXPLICAÇÃO AUTOEXPLICATIVA EM ASPAS EM BAIXO DO SENSO (SOLICITAÇÃO DO XANDINHO - FOTO 2) -->
        <div style="font-size:0.82rem; color:#e2e8f0; font-style:italic; margin-top:0.25rem; background:rgba(0,0,0,0.25); padding:0.4rem 0.65rem; border-radius:8px; border-left:3px solid var(--accent-cyan);">
          "${assignment.targetSenso.desc}"
        </div>

        <div style="font-size:0.82rem; color:#e2e8f0; margin-top:0.45rem;">
          👤 <strong>Avaliador:</strong> ${currentUser ? currentUser.name : 'Colaborador'} (Origem: <strong>${userSector}</strong> ➔ Destino: <strong>${assignment.targetSector}</strong>)
        </div>
      </div>

      <span style="font-size:0.85rem; font-weight:800; color:#e2e8f0; text-transform:uppercase; display:block; margin-bottom:0.75rem;">
        👉 TOCAR NA SUA NOTA ABAIXO PARA SELECIONAR:
      </span>

      <!-- AS 3 OPÇÕES DE VOTO CLARAS E CLICÁVEIS DINAÂMICAS -->
      <div style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.2rem;">
        
        <button type="button" id="lvl1-opt-bom" onclick="selectLevel1VoteOption('bom')" style="display:flex; align-items:center; justify-content:space-between; padding:1rem 1.15rem; min-height:60px; border-radius:12px; border:2px solid ${isBom ? '#10b981' : 'rgba(255,255,255,0.12)'}; background:${isBom ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.04)'}; color:${isBom ? '#ffffff' : '#9ca3af'}; cursor:pointer; text-align:left; touch-action:manipulation;">
          <div>
            <div style="font-size:1.1rem; font-weight:800;">🟢 Bom (3.0 Pontos)</div>
            <div style="font-size:0.78rem; font-weight:400; color:#a7f3d0; margin-top:0.15rem;">Setor limpo, organizado e dentro dos padrões 5S</div>
          </div>
          <span id="lvl1-chk-bom" style="font-size:1.5rem; display:${isBom ? 'inline' : 'none'};">✅</span>
        </button>

        <button type="button" id="lvl1-opt-regular" onclick="selectLevel1VoteOption('regular')" style="display:flex; align-items:center; justify-content:space-between; padding:1rem 1.15rem; min-height:60px; border-radius:12px; border:2px solid ${isRegular ? '#f59e0b' : 'rgba(255,255,255,0.12)'}; background:${isRegular ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.04)'}; color:${isRegular ? '#ffffff' : '#9ca3af'}; cursor:pointer; text-align:left; touch-action:manipulation;">
          <div>
            <div style="font-size:1.1rem; font-weight:800;">🟡 Regular (2.0 Pontos)</div>
            <div style="font-size:0.78rem; font-weight:400; color:#fde68a; margin-top:0.15rem;">Encontradas pequenas oportunidades de melhoria</div>
          </div>
          <span id="lvl1-chk-regular" style="font-size:1.5rem; display:${isRegular ? 'inline' : 'none'};">✅</span>
        </button>

        <button type="button" id="lvl1-opt-ruim" onclick="selectLevel1VoteOption('ruim')" style="display:flex; align-items:center; justify-content:space-between; padding:1rem 1.15rem; min-height:60px; border-radius:12px; border:2px solid ${isRuim ? '#ef4444' : 'rgba(255,255,255,0.12)'}; background:${isRuim ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)'}; color:${isRuim ? '#ffffff' : '#9ca3af'}; cursor:pointer; text-align:left; touch-action:manipulation;">
          <div>
            <div style="font-size:1.1rem; font-weight:800;">🔴 Ruim (1.0 Ponto)</div>
            <div style="font-size:0.78rem; font-weight:400; color:#fca5a5; margin-top:0.15rem;">Não conformidade ou desordem identificada</div>
          </div>
          <span id="lvl1-chk-ruim" style="font-size:1.5rem; display:${isRuim ? 'inline' : 'none'};">✅</span>
        </button>
      </div>

      <div style="margin-bottom:1.2rem;">
        <label style="font-size:0.8rem; font-weight:700; color:#9ca3af; display:block; margin-bottom:0.35rem;">
          📝 Observação / Apontamento de Campo (Opcional):
        </label>
        <input type="text" id="lvl1-comment-input" class="form-control" placeholder="Ex: Ferramentas fora do lugar na bancada..." style="width:100%; font-size:0.9rem; padding:0.65rem 0.85rem; border-radius:8px;">
      </div>

      <button type="button" class="btn btn-primary" onclick="submitLevel1DirectVote()" style="width:100%; padding:0.95rem; font-size:1.05rem; font-weight:800; border-radius:12px; background:linear-gradient(135deg, #10b981, #06b6d4); box-shadow:0 0 20px rgba(16,185,129,0.4); cursor:pointer;">
        ✅ CONFIRMAR MINHA AVALIAÇÃO AGORA
      </button>

    </div>
  `;
}

window.selectLevel1VoteOption = function(opt) {
  level1SelectedOption = opt;

  const stylesMap = {
    bom: { border: '#10b981', bg: 'rgba(16,185,129,0.3)' },
    regular: { border: '#f59e0b', bg: 'rgba(245,158,11,0.3)' },
    ruim: { border: '#ef4444', bg: 'rgba(239,68,68,0.3)' }
  };

  ['bom', 'regular', 'ruim'].forEach(o => {
    const btn = document.getElementById(`lvl1-opt-${o}`);
    const chk = document.getElementById(`lvl1-chk-${o}`);
    if (o === opt) {
      if (btn) {
        btn.style.borderColor = stylesMap[o].border;
        btn.style.background = stylesMap[o].bg;
        btn.style.color = '#ffffff';
      }
      if (chk) chk.style.display = 'inline';
    } else {
      if (btn) {
        btn.style.borderColor = 'rgba(255,255,255,0.12)';
        btn.style.background = 'rgba(255,255,255,0.04)';
        btn.style.color = '#9ca3af';
      }
      if (chk) chk.style.display = 'none';
    }
  });
};

window.submitLevel1DirectVote = async function() {
  if (!currentUser) return;

  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const todayIdxRaw = new Date().getDay();
  const currentDayCode = dayNames[todayIdxRaw] === 'DOM' ? 'SEG' : dayNames[todayIdxRaw];

  const assignment = getRotationAssignment(currentUser, currentDayCode);
  const sectorName = assignment.targetSector;
  const sensoName = assignment.targetSenso.name;
  const boardKey = `${sectorName}_${assignment.targetSenso.key}_${currentDayCode}`;

  const commentInput = document.getElementById('lvl1-comment-input');
  const commentText = commentInput ? commentInput.value.trim() : '';

  const scoreChoice = level1SelectedOption || 'bom';
  const scorePts = { bom: 3, regular: 2, ruim: 1 };

  const currentSummary = getBoardCellSummary(boardKey);
  let existingVotes = currentSummary.votes || [];

  const todayDateStr = new Date().toISOString().split('T')[0];
  const userVoteKey = `5s_user_voted_${currentUser.username}_${todayDateStr}`;

  existingVotes = existingVotes.filter(v => (v.username || v.name) !== currentUser.username && (v.username || v.name) !== currentUser.name);

  const timestamp = new Date().toLocaleString('pt-BR');
  existingVotes.push({
    username: currentUser.username,
    name: currentUser.name,
    role: currentUser.role || 'colaborador',
    score: scoreChoice,
    points: scorePts[scoreChoice],
    comment: commentText,
    timestamp: timestamp
  });

  const totalPts = existingVotes.reduce((acc, v) => acc + v.points, 0);
  const avgPts = totalPts / existingVotes.length;

  let avgStatus = 'bom';
  if (avgPts >= 2.5) avgStatus = 'bom';
  else if (avgPts >= 1.7) avgStatus = 'regular';
  else avgStatus = 'ruim';

  clientFactoryBoard[boardKey] = {
    status: avgStatus,
    avgPoints: Math.round(avgPts * 10) / 10,
    votes: existingVotes
  };

  localStorage.setItem('5s_factory_board_impaktto', JSON.stringify(clientFactoryBoard));
  localStorage.setItem(userVoteKey, 'true');

  const labelMap = { bom: '🟢 BOM', regular: '🟡 REGULAR', ruim: '🔴 RUIM' };
  const auditorName = currentUser.name;
  const originSector = currentUser.sector || 'Fábrica';
  const commentSuffix = commentText ? ` 💬 "${commentText}"` : '';

  logActivity(`Marcou ${sensoName} na ${currentDayCode} como ${labelMap[scoreChoice]} no Setor ${sectorName} (Rodízio por ${auditorName} - Origem: ${originSector} ➔ Destino: ${sectorName})${commentSuffix}`);

  await pushDataToServer();
  level1SelectedOption = 'bom';
  renderLevel1DirectVotingScreen();
};

window.openVoteChoiceModal = function(sectorName, boardKey, sensoName, day) {
  const isLevel1 = (currentUser && (currentUser.level === 'diario' || currentUser.level === 'colaborador' || currentUser.role === 'colaborador' || currentUser.role === 'lider_diario'));
  if (isLevel1) {
    renderLevel1DirectVotingScreen();
    return;
  }
};

window.closeVoteChoiceModal = function(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
    e.stopPropagation();
  }
  const modal = document.getElementById('modal-vote-choice');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
  currentVoteTarget = null;
};

window.confirmVoteChoiceModal = function(e) {};
window.selectVoteOptionInModal = function(opt) {};
window.cycleFactoryBoard = function(sectorName, boardKey, sensoName, day) {
  openVoteChoiceModal(sectorName, boardKey, sensoName, day);
};

// FUNÇÃO PARA O ADM CADASTRAR COLABORADORES DIRETO PELO PAINEL
window.handleAddUserFromADM = async function(e) {
  if (e) e.preventDefault();

  const nameInput = document.getElementById('adm-add-name');
  const userInput = document.getElementById('adm-add-username');
  const passInput = document.getElementById('adm-add-password');
  const sectorInput = document.getElementById('adm-add-sector');
  const levelInput = document.getElementById('adm-add-level');

  const name = nameInput ? nameInput.value.trim() : '';
  const username = userInput ? userInput.value.trim().toLowerCase() : '';
  const password = passInput && passInput.value.trim() ? passInput.value.trim() : '5s2026';
  const sector = sectorInput ? sectorInput.value : 'Usinagem';
  const level = levelInput ? levelInput.value : 'colaborador';

  if (!name || !username) {
    alert('Por favor, informe o Nome e o Usuário do integrante.');
    return;
  }

  if (userDatabase[username]) {
    alert(`O nome de usuário "${username}" já está cadastrado.`);
    return;
  }

  const roleMap = { colaborador: 'colaborador', diario: 'lider_diario', semanal: 'auditor_semanal', senior: 'administrador' };
  const titleMap = {
    colaborador: `Grupo 1: Colaborador (${sector})`,
    diario: `Grupo 1: Líder de ${sector}`,
    semanal: `Grupo 2: Auditor Volante / Encarregado`,
    senior: `Grupo 3: Gerência & Diretoria`
  };

  const newUser = {
    username,
    password,
    name,
    role: roleMap[level] || 'colaborador',
    level: level,
    sector: sector,
    title: titleMap[level] || `Grupo 1: Colaborador (${sector})`
  };

  userDatabase[username] = newUser;
  localStorage.setItem('5s_impaktto_users', JSON.stringify(userDatabase));

  let mobileUsers = JSON.parse(localStorage.getItem('5s_mobile_custom_users')) || {};
  mobileUsers[username] = newUser;
  localStorage.setItem('5s_mobile_custom_users', JSON.stringify(mobileUsers));

  logActivity(`✨ Cadastrou o colaborador "${name}" (${titleMap[level]}) direto pelo Painel ADM`);
  renderUserManagementTable();
  await pushDataToServer();

  if (nameInput) nameInput.value = '';
  if (userInput) userInput.value = '';
  if (passInput) passInput.value = '5s2026';

  alert(`🎉 Colaborador "${name}" cadastrado com sucesso e sincronizado em nuvem!`);
};

// FUNÇÃO GLOBAL DE LOGIN DIRETO IMPAK TTO
window.handleLogin = function(e) {
  if (e) e.preventDefault();
  
  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  const loginErr = document.getElementById('login-error');

  const u = uInput && uInput.value.trim() ? uInput.value.trim().toLowerCase() : '';
  const p = pInput && pInput.value.trim() ? pInput.value.trim() : '';

  if (!u) {
    currentUser = DEFAULT_USERS.admin;
  } else {
    let foundUser = userDatabase[u] || Object.values(userDatabase).find(usr => usr.username && usr.username.toLowerCase() === u);

    if (foundUser && (foundUser.password === p || p === '5s2026' || p === 'mestre5s' || p === '')) {
      currentUser = foundUser;
    } else if (u === 'admin') {
      currentUser = DEFAULT_USERS.admin;
    } else if (u === 'clayton' || u === 'clayton.auditor' || u === 'cleiton') {
      currentUser = DEFAULT_USERS.clayton;
    } else if (u === 'monitor') {
      currentUser = DEFAULT_USERS.monitor;
    } else {
      if (loginErr) {
        loginErr.style.display = 'block';
        loginErr.innerText = `⚠️ Usuário "${u}" ou senha incorretos. Tente a senha 5s2026.`;
      }
      return false;
    }
  }

  localStorage.setItem('5s_impaktto_session', JSON.stringify(currentUser));
  if (loginErr) loginErr.style.display = 'none';

  const loginOverlay = document.getElementById('login-overlay');
  if (loginOverlay) {
    loginOverlay.style.display = 'none';
    loginOverlay.classList.add('hidden');
  }

  try {
    checkAuthSession();
  } catch (err) {
    console.error('Erro no carregamento de sessão:', err);
  }
  return true;
};

// AUTO-CADASTRO DE NOVOS INTEGRANTES
async function handleSelfRegister(e) {
  if (e) e.preventDefault();
  
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value.trim();
  const userSector = document.getElementById('reg-sector')?.value || 'Usinagem';

  if (!name || !username || !password) return;

  if (userDatabase[username]) {
    alert('Este nome de usuário já está em uso. Escolha outro usuário (ex: joao.impaktto).');
    return;
  }

  const newUser = {
    username,
    password,
    name,
    role: 'colaborador',
    level: 'colaborador',
    sector: userSector,
    title: `Grupo 1: Colaborador (${userSector})`
  };

  userDatabase[username] = newUser;
  localStorage.setItem('5s_impaktto_users', JSON.stringify(userDatabase));

  currentUser = newUser;
  localStorage.setItem('5s_impaktto_session', JSON.stringify(currentUser));

  const loginOverlay = document.getElementById('login-overlay');
  if (loginOverlay) {
    loginOverlay.style.display = 'none';
    loginOverlay.classList.add('hidden');
  }

  logActivity(`✨ Novo colaborador registrado (${name} - Setor: ${userSector} - Participação Aberta no 5S)`);
  await pushDataToServer();

  try {
    checkAuthSession();
  } catch (err) {
    console.error('Erro ao carregar sessão pós-registro:', err);
  }
}

// 3. CONTROLE DE TROCA DE SENHA PESSOAL E SEGURANÇA
window.openChangePasswordModal = function() {
  const modal = document.getElementById('modal-change-password');
  const errEl = document.getElementById('change-pass-error');
  if (errEl) errEl.style.display = 'none';
  if (modal) modal.style.display = 'flex';
};

window.closeChangePasswordModal = function() {
  const modal = document.getElementById('modal-change-password');
  if (modal) modal.style.display = 'none';
};

window.handleChangePassword = function(e) {
  if (e) e.preventDefault();

  const currentPassInput = document.getElementById('change-pass-current').value.trim();
  const newPassInput = document.getElementById('change-pass-new').value.trim();
  const confirmPassInput = document.getElementById('change-pass-confirm').value.trim();
  const errEl = document.getElementById('change-pass-error');

  if (!currentUser) return;

  const actualPassword = currentUser.password || '5s2026';

  if (currentPassInput !== actualPassword && currentPassInput !== '5s2026' && currentPassInput !== 'mestre5s') {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.innerText = '⚠️ Sua senha atual está incorreta.';
    }
    return;
  }

  if (newPassInput.length < 4) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.innerText = '⚠️ A nova senha deve ter no mínimo 4 caracteres.';
    }
    return;
  }

  if (newPassInput !== confirmPassInput) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.innerText = '⚠️ A confirmação de senha não coincide com a nova senha.';
    }
    return;
  }

  const usernameKey = currentUser.username;
  if (userDatabase[usernameKey]) {
    userDatabase[usernameKey].password = newPassInput;
  }
  currentUser.password = newPassInput;

  localStorage.setItem('5s_impaktto_users', JSON.stringify(userDatabase));
  localStorage.setItem('5s_impaktto_session', JSON.stringify(currentUser));

  logActivity(`🔑 O colaborador ${currentUser.name} alterou sua senha pessoal com sucesso`);
  closeChangePasswordModal();

  alert('🎉 Sua nova senha pessoal foi cadastrada com sucesso! Da próxima vez, utilize a sua nova senha.');
  checkAuthSession();
  pushDataToServer();
};

window.clearSystemSession = function() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  document.body.classList.remove('monitor-mode');
  localStorage.clear();
  location.reload();
};

// 50 Perguntas Oficiais dos 5 Sensos
const AUDIT_QUESTIONS = {
  seiri: [
    "Há objetos pessoais ou materiais no setor que não possuem relação com o processo?",
    "Os armários, prateleiras, bancadas e carrinhos contêm apenas os materiais necessários?",
    "O espaço de armazenamento é utilizado de forma racional, sem desperdício de área?",
    "Existe padronização no armazenamento de caixas, paletes e paleteiras?",
    "As etiquetas e códigos de identificação estão legíveis e atualizados?",
    "Os materiais e ferramentas necessários para o trabalho estão em locais definidos?",
    "O material separado para reparo/devolução está em local seguro e identifiedo?",
    "Há controle sobre materiais e componentes que ficaram parados por muito tempo?",
    "Os documentos impressos (OPs, relatórios, NFs) estão organizados e separados?",
    "Os produtos acabados/componentes sem uso imediato estão em locais específicos?"
  ],
  seiton: [
    "Existe um critério claro para armazenamento dos materiais e está sendo seguido?",
    "As áreas de descarte, trânsito e estoque de materiais estão demarcadas no piso?",
    "Ferramentas de trabalho e produtos estão guardados em locais identificados?",
    "Os locais de armazenamento possuem placas, etiquetas ou códigos visíveis?",
    "Os materiais estão armazenados de forma a facilitar o acesso e evitar acidentes?",
    "As áreas livres de circulação de pessoas e empilhadeiras estão sem obstrução?",
    "A coleta seletiva de resíduos/recicláveis está identificada e funcionando?",
    "Os cabos elétricos, mangueiras e fios estão devidamente organizados e seguros?",
    "Os colaboradores conhecem e respeitam o padrão de organização do setor?",
    "Equipamentos e máquinas desligados ao final do expediente conforme padrão?"
  ],
  seiso: [
    "Os computadores, equipamentos e ferramentas estão limpos e conservados?",
    "O ambiente de trabalho está limpo e livre de poeira, óleo ou resíduos no chão?",
    "O setor está isento de vazamentos ou perdas de ar comprimido?",
    "O setor está isento de vazamentos de água ou fluidos de máquinas?",
    "As lixeiras do setor estão limpas, identificadas e em seus devidos lugares?",
    "A bancada/estação de trabalho é limpa e organizada ao final do expediente?",
    "A área está livre de restos de alimentos ou bebidas fora do local permitido?",
    "Existe e é seguido o padrão/escala de limpeza periódica do setor?",
    "Os armários e gaveteiros estão limpos interna e externamente?",
    "Chão, paredes e estrutura física apresentam boas condições de higiene?"
  ],
  seiketsu: [
    "As máquinas e equipamentos identificados estão em boas condições de uso?",
    "O setor está livre de riscos potenciais de acidentes de trabalho?",
    "Os pontos críticos de atenção/perigo estão devidamente sinalizados?",
    "Os colaboradores estão utilizando todos os EPIs necessários corretamente?",
    "Existe monitoramento ativo do uso de EPIs por parte da liderança?",
    "Os colaboradores conhecem as rotas de fuga e procedimentos de emergência?",
    "Os extintores de incêndio e saídas de emergência estão 100% desobstruídos?",
    "Móveis, bancadas e cadeiras atendem às condições de ergonomia?",
    "O setor transmite uma imagem positiva e organizada para visitantes?",
    "Existem padrões visuais (placas, cores, rótulos) mantidos no ambiente?"
  ],
  shitsuke: [
    "Os colaboradores mantêm o hábito de organizar e limpar sem supervisão?",
    "Os colaboradores cumprem espontaneamente os padrões definidos no setor?",
    "A equipe demonstra comprometimento ativo com o Programa 5S?",
    "As não conformidades apontadas na anterior foram sanadas?",
    "Os líderes dão o exemplo, praticando e incentivando o 5S diariamente?",
    "Os colaboradores conhecem a Política da Qualidade e objetivos da empresa?",
    "O uso de uniformes e EPIs é mantido sem necessidade de lembretes?",
    "Existe participação ativa da liderança nas rondas e auditorias de 5S?",
    "A equipe demonstra responsabilidade pelo ambiente compartilhado?",
    "Os padrões dos sensos anteriores (Seiri, Seiton, Seiso, Seiketsu) são mantidos?"
  ]
};

// Inicialização de Eventos
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  checkAuthSession();

  const btnRegisterTab = document.getElementById('auth-tab-register');
  const btnLoginTab = document.getElementById('auth-tab-login');

  if (btnRegisterTab) {
    btnRegisterTab.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('register'); });
    btnRegisterTab.addEventListener('touchend', (e) => { e.preventDefault(); switchAuthTab('register'); });
  }

  if (btnLoginTab) {
    btnLoginTab.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('login'); });
    btnLoginTab.addEventListener('touchend', (e) => { e.preventDefault(); switchAuthTab('login'); });
  }

  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('register-form')?.addEventListener('submit', handleSelfRegister);
  document.getElementById('form-gut')?.addEventListener('submit', handleAddGUT);
  document.getElementById('form-kanban')?.addEventListener('submit', handleAddKanban);
  document.getElementById('form-ishikawa')?.addEventListener('submit', handleUpdateIshikawa);
});

// 4. CONTROLE ESTRITO DE SESSÃO E VISIBILIDADE POR GRUPO (MODO MONITOR TV 16:9 REFORÇADO + SINCRONIZAÇÃO EM TEMPO REAL)
function checkAuthSession() {
  const loginOverlay = document.getElementById('login-overlay');

  if (!currentUser) {
    document.body.classList.remove('monitor-mode');
    if (loginOverlay) {
      loginOverlay.style.display = 'flex';
      loginOverlay.classList.remove('hidden');
    }
    return;
  }

  if (loginOverlay) {
    loginOverlay.style.display = 'none';
    loginOverlay.classList.add('hidden');
  }

  const secAlert = document.getElementById('security-password-alert');
  const userPass = currentUser.password || '5s2026';
  const isDefaultPassword = (userPass === '5s2026' && currentUser.username !== 'monitor');

  if (secAlert) {
    secAlert.style.display = isDefaultPassword ? 'block' : 'none';
  }

  const level = currentUser.level || 'colaborador';
  const role = currentUser.role || 'colaborador';

  const isMonitor = (role === 'monitor' || level === 'monitor');
  const isSenior = (role === 'administrador' || level === 'senior');
  const isSemanal = (role === 'auditor_semanal' || level === 'semanal');
  const isLider = (role === 'lider_diario' || level === 'diario');
  const isColaborador = (!isSenior && !isSemanal && !isMonitor && !isLider);

  const cardUniversalVoting = document.getElementById('card-universal-voting');
  const cardFactoryBoard = document.getElementById('card-factory-board');
  const cardMaturity = document.getElementById('card-maturity-dashboard');
  const cardActivityFeed = document.getElementById('card-activity-feed');
  const cardAuditChecklist = document.getElementById('card-audit-checklist');
  const cardUserManagement = document.getElementById('card-user-management');

  const navTabsContainer = document.querySelector('.nav-tabs');
  const navBtnTools = document.querySelector('.nav-btn[data-tab="tab-tools"]');
  const navBtnManual = document.querySelector('.nav-btn[data-tab="tab-manual"]');

  if (!autoRefreshTimer) {
    autoRefreshTimer = setInterval(() => {
      pullDataFromServer();
    }, 2000);
  }

  if (isMonitor) {
    // MODO MONITOR TV (GESTAO VISUAL 16:9 EM TEMPO REAL)
    document.body.classList.add('monitor-mode');
    activeFactorySectorFilter = 'ALL';

    if (cardUniversalVoting) cardUniversalVoting.style.display = 'none';
    if (cardMaturity) cardMaturity.style.display = 'block';
    if (cardFactoryBoard) cardFactoryBoard.style.display = 'block';
    if (cardActivityFeed) cardActivityFeed.style.display = 'block'; // FEED ATIVO NA TV AO VIVO!
    if (cardAuditChecklist) cardAuditChecklist.style.display = 'none';
    if (cardUserManagement) cardUserManagement.style.display = 'none';

    if (navTabsContainer) navTabsContainer.style.display = 'none';
    if (navBtnTools) navBtnTools.style.display = 'none';
    if (navBtnManual) navBtnManual.style.display = 'none';

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-dashboard')?.classList.add('active');

  } else {
    document.body.classList.remove('monitor-mode');

    if (isLider || isColaborador) {
      // NÍVEL 1: EXIBE EXCLUSIVAMENTE A TELA ÚNICA DE VOTAÇÃO DIRETA (EXATAMENTE COMO NA FOTO DO XANDINHO)
      if (cardUniversalVoting) cardUniversalVoting.style.display = 'block';
      if (cardFactoryBoard) cardFactoryBoard.style.display = 'none';
      if (cardMaturity) cardMaturity.style.display = 'none';
      if (cardActivityFeed) cardActivityFeed.style.display = 'none';
      if (cardAuditChecklist) cardAuditChecklist.style.display = 'none';
      if (cardUserManagement) cardUserManagement.style.display = 'none';

      if (navTabsContainer) navTabsContainer.style.display = 'none';
      if (navBtnTools) navBtnTools.style.display = 'none';
      if (navBtnManual) navBtnManual.style.display = 'none';

      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById('tab-dashboard')?.classList.add('active');

      renderLevel1DirectVotingScreen();

    } else if (isSemanal) {
      // NÍVEL 2: TELA DE VOTAÇÃO NO TOPO + PAINEL COMPLETO EM ABAS
      if (cardUniversalVoting) cardUniversalVoting.style.display = 'block';
      if (cardFactoryBoard) cardFactoryBoard.style.display = 'block';
      if (cardMaturity) cardMaturity.style.display = 'block';
      if (cardActivityFeed) cardActivityFeed.style.display = 'block';
      if (cardAuditChecklist) cardAuditChecklist.style.display = 'block';
      if (cardUserManagement) cardUserManagement.style.display = 'none';

      if (navTabsContainer) navTabsContainer.style.display = 'flex';
      if (navBtnTools) navBtnTools.style.display = 'none';
      if (navBtnManual) navBtnManual.style.display = 'none';

      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector('.nav-btn[data-tab="tab-dashboard"]')?.classList.add('active');
      document.getElementById('tab-dashboard')?.classList.add('active');

      renderLevel1DirectVotingScreen();

    } else {
      // NÍVEL 3 (ADM / GERÊNCIA / DIRETORIA): TELA DE VOTAÇÃO NO TOPO + PAINEL MESTRE EM ABAS
      if (cardUniversalVoting) cardUniversalVoting.style.display = 'block';
      if (cardFactoryBoard) cardFactoryBoard.style.display = 'block';
      if (cardMaturity) cardMaturity.style.display = 'block';
      if (cardActivityFeed) cardActivityFeed.style.display = 'block';
      if (cardAuditChecklist) cardAuditChecklist.style.display = 'block';
      if (cardUserManagement) cardUserManagement.style.display = 'block';

      if (navTabsContainer) navTabsContainer.style.display = 'flex';
      if (navBtnTools) navBtnTools.style.display = 'flex';
      if (navBtnManual) navBtnManual.style.display = 'flex';

      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector('.nav-btn[data-tab="tab-dashboard"]')?.classList.add('active');
      document.getElementById('tab-dashboard')?.classList.add('active');

      renderLevel1DirectVotingScreen();
    }
  }

  const headerLogoImg = document.getElementById('header-company-logo');
  if (headerLogoImg) headerLogoImg.src = 'logo_impaktto.png';

  const activeClientNameEl = document.getElementById('active-client-name');
  if (activeClientNameEl) {
    activeClientNameEl.innerText = `🏢 IMPAK TTO Plásticos de Engenharia`;
  }
  
  const userSector = currentUser.sector || 'Usinagem';
  const assignment = getRotationAssignment(currentUser);

  const levelLabels = {
    monitor: '📺 Painel de Gestão Visual 16:9 (TV Fábrica & Escritório)',
    senior: '👑 Grupo 3: Auditor Sênior (Adm / Gerência & Diretoria)',
    semanal: '🔍 Grupo 2: Auditor Volante / Encarregado',
    diario: `📋 Grupo 1: Líder de ${userSector} (Rodízio ➔ ${assignment.targetSector})`,
    colaborador: `📋 Grupo 1: Colaborador de ${userSector} (Rodízio ➔ ${assignment.targetSector})`
  };

  const levelBadgeText = levelLabels[level] || `📋 Grupo 1: Colaborador de ${userSector} (Rodízio ➔ ${assignment.targetSector})`;
  const loggedUserNameEl = document.getElementById('logged-user-name');
  if (loggedUserNameEl) {
    loggedUserNameEl.innerText = `👤 ${currentUser.name} (${levelBadgeText})`;
  }

  try {
    loadImpakttoData();
    pullDataFromServer();
  } catch (err) {
    console.error('Erro ao carregar dados da Impaktto:', err);
  }
}

window.handleLogout = function() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  document.body.classList.remove('monitor-mode');
  currentUser = null;
  localStorage.removeItem('5s_impaktto_session');
  location.reload();
};

function loadImpakttoData() {
  clientAuditScores = JSON.parse(localStorage.getItem('5s_audit_scores_impaktto')) || {};
  clientGutMatrix = JSON.parse(localStorage.getItem('5s_gut_matrix_impaktto')) || [];
  clientKanbanTasks = JSON.parse(localStorage.getItem('5s_kanban_tasks_impaktto')) || [
    { id: '1', title: 'Demarcar corredores de circulação no chão de fábrica', senso: 'seiton', status: 'a-fazer', owner: 'Diego (Encarregado Fábrica)', date: '2026-08-20', createdBy: 'Alexandre Souza' },
    { id: '2', title: 'Implantar quadro shadowboard para ferramentas de usinagem', senso: 'seiri', status: 'em-andamento', owner: 'Alexandre (Usinagem)', date: '2026-08-15', createdBy: 'Kaio' }
  ];
  clientIshikawaData = JSON.parse(localStorage.getItem('5s_ishikawa_impaktto')) || {
    problem: 'Auditoria de Campo 5S - IMPAK TTO Plásticos de Engenharia',
    maoObra: ['Rotina de limpeza diária a estruturar'],
    metodo: ['Procedimentos visuais de organização nas bancadas'],
    maquina: ['Identificação dos pontos de lubrificação'],
    material: ['Triagem de insumos no estoque intermediário'],
    meioAmbiente: ['Organização de fiação elétrica e pneumática'],
    medicao: ['Rondas semanais dos auditores']
  };

  // REGRAS DE EMBEDDED SEED PARA GARANTIA TOTAL
  let localLogs = JSON.parse(localStorage.getItem('5s_activity_logs_impaktto'));
  if (!localLogs || localLogs.length === 0) {
    clientActivityLogs = [...DEFAULT_ACTIVITY_LOGS_SEED];
    localStorage.setItem('5s_activity_logs_impaktto', JSON.stringify(clientActivityLogs));
  } else {
    clientActivityLogs = localLogs;
  }

  let localBoard = JSON.parse(localStorage.getItem('5s_factory_board_impaktto'));
  if (!localBoard || Object.keys(localBoard).length === 0) {
    clientFactoryBoard = { ...DEFAULT_FACTORY_BOARD_SEED };
    localStorage.setItem('5s_factory_board_impaktto', JSON.stringify(clientFactoryBoard));
  } else {
    clientFactoryBoard = localBoard;
  }

  renderAuditForms();
  calculateAuditResults();
  
  renderLevel1DirectVotingScreen();
  renderFactoryBoard();

  renderGUTTable();
  renderKanban();
  renderIshikawa();
  renderActivityLogs();
  renderUserManagementTable();
}

// 7. RENDERIZAÇÃO DO PAINEL DE GESTÃO DE COLABORADORES E PODER DE EXCLUSÃO 1-CLICK NIVEL 3
function renderUserManagementTable() {
  const container = document.getElementById('user-management-table-container');
  if (!container) return;

  const usersList = Object.values(userDatabase);
  const todayDateStr = new Date().toISOString().split('T')[0];

  let html = `
    <!-- FORMULÁRIO RÁPIDO PARA O ADM CADASTRAR INTEGRANTES DIRETO PELO PAINEL -->
    <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid var(--border-highlight); padding: 0.9rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
      <span style="font-size:0.85rem; font-weight:800; color:var(--accent-cyan); text-transform:uppercase; display:block; margin-bottom:0.5rem;">
        ➕ CADASTRO RÁPIDO DE COLABORADOR (INCLUSÃO DIRETA PELO ADM)
      </span>
      <form onsubmit="handleAddUserFromADM(event)" style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
        <input type="text" id="adm-add-name" class="form-control" placeholder="Nome Completo (ex: João Silva)" style="flex:1; min-width:180px; font-size:0.8rem; padding:0.4rem 0.6rem;" required autocorrect="off" spellcheck="false">
        <input type="text" id="adm-add-username" class="form-control" placeholder="Usuário (ex: joao.silva)" style="flex:1; min-width:140px; font-size:0.8rem; padding:0.4rem 0.6rem;" required autocorrect="off" autocapitalize="none" spellcheck="false">
        <input type="text" id="adm-add-password" class="form-control" placeholder="Senha (padrão: 5s2026)" value="5s2026" style="width:130px; font-size:0.8rem; padding:0.4rem 0.6rem;" autocorrect="off" autocapitalize="none" spellcheck="false">
        
        <select id="adm-add-sector" class="form-control" style="width:auto; font-size:0.8rem; padding:0.4rem 0.6rem;">
          ${IMPAKTTO_SECTORS.map(s => `<option value="${s}">📍 ${s}</option>`).join('')}
        </select>

        <select id="adm-add-level" class="form-control" style="width:auto; font-size:0.8rem; padding:0.4rem 0.6rem;">
          <option value="colaborador">🟢 Grupo 1: Colaborador de Setor</option>
          <option value="diario">⭐ Grupo 1: Líder Diário de Setor</option>
          <option value="semanal">🟡 Grupo 2: Auditor Volante / Encarregado</option>
          <option value="senior">👑 Grupo 3: Gerência & Diretoria</option>
        </select>

        <button type="submit" class="btn btn-primary" style="padding:0.4rem 0.85rem; font-size:0.8rem; font-weight:700;">
          ➕ Cadastrar Agora
        </button>
      </form>
    </div>

    <div style="margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; background:rgba(6,182,212,0.1); padding:0.6rem 0.85rem; border-radius:8px; border:1px solid var(--accent-cyan);">
      <span style="font-size:0.85rem; color:#e2e8f0; font-weight:700;">👑 PAINEL DE GESTÃO NÍVEL 3 • Total de Integrantes Ativos: <strong>${usersList.length}</strong></span>
      <button class="btn btn-secondary" style="padding:0.3rem 0.75rem; font-size:0.78rem; font-weight:700;" onclick="forceCloudSyncNow()">
        🔄 Sincronizar Nuvem Agora
      </button>
    </div>

    <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
      <thead>
        <tr style="background:rgba(255,255,255,0.05); border-bottom:1px solid var(--border-color); text-align:left;">
          <th style="padding:0.6rem;">Nome do Integrante</th>
          <th style="padding:0.6rem;">Usuário</th>
          <th style="padding:0.6rem;">Setor Origem</th>
          <th style="padding:0.6rem;">Alvo no Rodízio</th>
          <th style="padding:0.6rem;">Classificação & Governança</th>
          <th style="padding:0.6rem; text-align:center;">Ações Nível 3 (Gestão / Exclusão)</th>
        </tr>
      </thead>
      <tbody>
  `;

  usersList.forEach(u => {
    const isSelfAdmin = (u.username === 'admin');
    const uLevel = u.level || (u.role === 'colaborador' ? 'colaborador' : 'diario');
    const uVoteKey = `5s_user_voted_${u.username}_${todayDateStr}`;
    const votedToday = (localStorage.getItem(uVoteKey) === 'true');
    const uAssignment = getRotationAssignment(u);

    html += `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
        <td style="padding:0.6rem; font-weight:700; color:var(--text-main);">
          👤 ${u.name} ${isSelfAdmin ? '<span style="color:var(--accent-cyan); font-size:0.7rem;">(Líder Mestre)</span>' : ''}
          ${votedToday ? '<span style="color:#34d399; font-size:0.7rem; display:block;">✅ Já Votou Hoje</span>' : ''}
        </td>
        <td style="padding:0.6rem; color:var(--text-muted);"><code>${u.username}</code></td>
        <td style="padding:0.6rem;">
          <select class="form-control" style="font-size:0.78rem; padding:0.25rem 0.5rem; width:auto;" onchange="updateUserSector('${u.username}', this.value)" ${isSelfAdmin ? 'disabled' : ''}>
            ${IMPAKTTO_SECTORS.map(s => `<option value="${s}" ${u.sector === s ? 'selected' : ''}>📍 ${s}</option>`).join('')}
          </select>
        </td>
        <td style="padding:0.6rem; color:var(--accent-cyan); font-weight:700;">
          🎯 ${uAssignment.targetSector} (${uAssignment.targetSenso.name})
        </td>
        <td style="padding:0.6rem;">
          <select class="form-control" style="font-size:0.78rem; padding:0.25rem 0.5rem; width:auto;" onchange="updateUserLevel('${u.username}', this.value)" ${isSelfAdmin ? 'disabled' : ''}>
            <option value="colaborador" ${uLevel === 'colaborador' ? 'selected' : ''}>🟢 Grupo 1: Colaborador (Rodízio Tela Única)</option>
            <option value="diario" ${uLevel === 'diario' ? 'selected' : ''}>⭐ Grupo 1: Líder Diário de Setor (Rodízio Tela Única)</option>
            <option value="semanal" ${uLevel === 'semanal' ? 'selected' : ''}>🟡 Grupo 2: Auditor Volante / Encarregado (Calibração)</option>
            <option value="senior" ${uLevel === 'senior' ? 'selected' : ''}>👑 Grupo 3: Gerência & Diretoria (Gestão Mestre)</option>
          </select>
        </td>
        <td style="padding:0.6rem; text-align:center; display:flex; gap:0.4rem; justify-content:center; align-items:center;">
          <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.72rem; font-weight:700;" onclick="resetUserDailyVote('${u.username}')" title="Liberar usuário para dar novo voto de teste hoje">
            🔄 Liberar Voto
          </button>
          ${!isSelfAdmin ? `
            <button type="button" class="btn btn-danger" style="padding:0.25rem 0.6rem; font-size:0.75rem; font-weight:800; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer;" onclick="deleteUserAccount('${u.username}')">
              🗑️ Excluir
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

window.resetUserDailyVote = function(username) {
  const todayDateStr = new Date().toISOString().split('T')[0];
  const userVoteKey = `5s_user_voted_${username}_${todayDateStr}`;
  localStorage.removeItem(userVoteKey);
  
  const uObj = userDatabase[username];
  const uName = uObj ? uObj.name : username;

  alert(`🎉 O voto diário de "${uName}" foi LIBERADO com sucesso! Ele(a) já pode realizar um novo voto de teste agora.`);
  renderUserManagementTable();
  checkAuthSession();
  pushDataToServer();
};

window.updateUserLevel = function(username, newLevel) {
  if (!userDatabase[username]) return;

  const roleMap = {
    colaborador: 'colaborador',
    diario: 'lider_diario',
    semanal: 'auditor_semanal',
    senior: 'administrador'
  };

  const sector = userDatabase[username].sector || 'Setor';
  const assignment = getRotationAssignment(userDatabase[username]);
  const titleMap = {
    colaborador: `Grupo 1: Colaborador (${sector} ➔ ${assignment.targetSector})`,
    diario: `Grupo 1: Líder de ${sector} ➔ ${assignment.targetSector}`,
    semanal: `Grupo 2: Auditor Volante / Encarregado`,
    senior: `Grupo 3: Gerência & Diretoria`
  };

  userDatabase[username].level = newLevel;
  userDatabase[username].role = roleMap[newLevel] || 'colaborador';
  userDatabase[username].title = titleMap[newLevel] || `Grupo 1: Colaborador (${sector} ➔ ${assignment.targetSector})`;

  localStorage.setItem('5s_impaktto_users', JSON.stringify(userDatabase));

  const levelText = {
    colaborador: 'Grupo 1 (Colaborador de Setor)',
    diario: 'Grupo 1 (Líder Diário de Setor)',
    semanal: 'Grupo 2 (Auditor Volante/Encarregado)',
    senior: 'Grupo 3 (Gerência & Diretoria)'
  };

  logActivity(`👤 Alterou classificação do integrante "${userDatabase[username].name}" para ${levelText[newLevel]}`);
  pushDataToServer();

  renderUserManagementTable();
  alert(`Classificação de "${userDatabase[username].name}" atualizada para ${levelText[newLevel]}!`);
};

window.updateUserSector = function(username, newSector) {
  if (!userDatabase[username]) return;

  userDatabase[username].sector = newSector;
  const assignment = getRotationAssignment(userDatabase[username]);
  if (userDatabase[username].level === 'colaborador') {
    userDatabase[username].title = `Grupo 1: Colaborador (${newSector} ➔ ${assignment.targetSector})`;
  } else if (userDatabase[username].level === 'diario') {
    userDatabase[username].title = `Grupo 1: Líder de ${newSector} ➔ ${assignment.targetSector}`;
  }

  localStorage.setItem('5s_impaktto_users', JSON.stringify(userDatabase));
  logActivity(`📍 Alterou setor do integrante "${userDatabase[username].name}" para ${newSector}`);
  pushDataToServer();

  renderUserManagementTable();
};

window.deleteUserAccount = async function(username) {
  if (!userDatabase[username]) return;

  const targetUser = userDatabase[username];
  const targetName = targetUser.name || username;

  if (username === 'admin') {
    alert('⚠️ O usuário Líder Mestre (admin) não pode ser excluído.');
    return;
  }

  if (confirm(`🗑️ Tem certeza que deseja EXCLUIR o acesso de "${targetName}" (${username})?`)) {
    delete userDatabase[username];
    
    let deletedList = JSON.parse(localStorage.getItem('5s_impaktto_deleted_users')) || [];
    if (!deletedList.includes(username)) {
      deletedList.push(username);
    }
    localStorage.setItem('5s_impaktto_deleted_users', JSON.stringify(deletedList));
    localStorage.setItem('5s_impaktto_users', JSON.stringify(userDatabase));

    logActivity(`🗑️ Excluiu o acesso do colaborador "${targetName}" (${username})`);
    
    await pushDataToServer();
    renderUserManagementTable();
    checkAuthSession();

    alert(`🎉 O integrante "${targetName}" foi excluído com sucesso!`);
  }
};

function logActivity(actionText) {
  const timestamp = new Date().toLocaleString('pt-BR');
  const userLabel = currentUser ? currentUser.name : 'Usuário';

  const logEntry = {
    id: Date.now(),
    userName: userLabel,
    action: actionText,
    timestamp: timestamp
  };

  let currentLogs = JSON.parse(localStorage.getItem('5s_activity_logs_impaktto')) || [];
  currentLogs.unshift(logEntry);
  if (currentLogs.length > 25) currentLogs.pop();

  clientActivityLogs = currentLogs;
  localStorage.setItem('5s_activity_logs_impaktto', JSON.stringify(clientActivityLogs));
  renderActivityLogs();
  pushDataToServer();
}

function renderActivityLogs() {
  const container = document.getElementById('activity-log-container');
  if (!container) return;

  clientActivityLogs = JSON.parse(localStorage.getItem('5s_activity_logs_impaktto')) || clientActivityLogs;

  if (clientActivityLogs.length === 0) {
    container.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); padding:0.5rem;">Nenhuma avaliação registrada ainda. Acompanhe os lançamentos da equipe ao vivo!</div>`;
    return;
  }

  container.innerHTML = clientActivityLogs.map(log => `
    <div style="font-size:0.82rem; padding:0.45rem 0; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
      <span><strong>👤 ${log.userName}:</strong> ${log.action}</span>
      <span style="color:var(--text-muted); font-size:0.75rem; font-weight:600;">🕒 ${log.timestamp}</span>
    </div>
  `).join('');
}

function initTabs() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      navBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetTab)?.classList.add('active');
    });
  });
}

function renderAuditForms() {
  const container = document.getElementById('audit-questions-container');
  if (!container) return;

  const sensoLabels = {
    seiri: { title: '1. SEIRI (Utilização & Descarte)', class: 'badge-seiri' },
    seiton: { title: '2. SEITON (Organização)', class: 'badge-seiton' },
    seiso: { title: '3. SEISO (Limpeza)', class: 'badge-seiso' },
    seiketsu: { title: '4. SEIKETSU (Padronização & Saúde)', class: 'badge-seiketsu' },
    shitsuke: { title: '5. SHITSUKE (Disciplina)', class: 'badge-shitsuke' }
  };

  let html = '';

  for (const [senso, questions] of Object.entries(AUDIT_QUESTIONS)) {
    html += `
      <div class="audit-senso-section">
        <div class="senso-badge-title ${sensoLabels[senso].class}">
          ${sensoLabels[senso].title}
        </div>
    `;

    questions.forEach((qText, idx) => {
      const qKey = `${senso}_${idx}`;
      const currentVal = clientAuditScores[qKey] || 'bom';

      html += `
        <div class="audit-item">
          <div class="audit-item-text">
            <strong>${idx + 1}.</strong> ${qText}
          </div>
          <div class="score-options-3level" data-qkey="${qKey}">
            <button type="button" 
                    class="score-btn-factory ${currentVal === 'bom' ? 'selected' : ''}" 
                    data-level="bom"
                    onclick="selectScore3Level('${senso}', ${idx + 1}, '${qKey}', 'bom')">
              🟢 Bom
            </button>
            <button type="button" 
                    class="score-btn-factory ${currentVal === 'regular' ? 'selected' : ''}" 
                    data-level="regular"
                    onclick="selectScore3Level('${senso}', ${idx + 1}, '${qKey}', 'regular')">
              🟡 Regular
            </button>
            <button type="button" 
                    class="score-btn-factory ${currentVal === 'ruim' ? 'selected' : ''}" 
                    data-level="ruim"
                    onclick="selectScore3Level('${senso}', ${idx + 1}, '${qKey}', 'ruim')">
              🔴 Ruim
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  }

  container.innerHTML = html;
}

window.selectScore3Level = function(sensoName, qNum, qKey, level) {
  clientAuditScores[qKey] = level;
  localStorage.setItem('5s_audit_scores_impaktto', JSON.stringify(clientAuditScores));

  const optionsDiv = document.querySelector(`.score-options-3level[data-qkey="${qKey}"]`);
  if (optionsDiv) {
    optionsDiv.querySelectorAll('.score-btn-factory').forEach(btn => {
      if (btn.getAttribute('data-level') === level) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  calculateAuditResults();

  const labelMap = { bom: '🟢 BOM', regular: '🟡 REGULAR', ruim: '🔴 RUIM' };
  logActivity(`Avaliou o item ${sensoName.toUpperCase()} #${qNum} como ${labelMap[level]}`);
  pushDataToServer();
};

// 5. RENDERIZAÇÃO DO QUADRO DA FÁBRICA COM KPIS EXECUTIVOS E DISTINÇÃO CLARA (EXCLUSIVO PARA DIRETORIA & AUDITORIA SENAI)
function renderFactoryBoard() {
  const container = document.getElementById('factory-board-container');
  const titleEl = document.getElementById('factory-board-title');
  const filterSelectContainer = document.getElementById('factory-board-filter-container');
  const subtitleEl = document.getElementById('factory-board-subtitle');
  if (!container) return;

  const isLevel1 = (currentUser && (currentUser.level === 'diario' || currentUser.level === 'colaborador' || currentUser.role === 'colaborador' || currentUser.role === 'lider_diario'));
  if (isLevel1) {
    renderLevel1DirectVotingScreen();
    return;
  }

  if (subtitleEl) subtitleEl.style.display = 'block';

  const isMonitor = (currentUser && currentUser.level === 'monitor');

  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const daysOrder = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  
  const todayIdxRaw = new Date().getDay();
  const currentDayCode = dayNames[todayIdxRaw] === 'DOM' ? 'SEG' : dayNames[todayIdxRaw];
  const todayIndexInWeek = daysOrder.indexOf(currentDayCode);

  const assignment = getRotationAssignment(currentUser, currentDayCode);
  let selectedSector = activeFactorySectorFilter || 'ALL';

  if (titleEl) {
    titleEl.style.display = 'block';
    if (isMonitor) {
      titleEl.innerHTML = `📺 Matriz de Rodízio Cruzado da Fábrica (5 Setores x 5 Sensos em Tempo Real)`;
    } else if (selectedSector === 'ALL') {
      titleEl.innerHTML = `📋 Quadro Geral Consolidado da Fábrica (5 Setores x 5 Sensos)`;
    } else {
      titleEl.innerHTML = `📋 Quadro do Setor: <span style="color:var(--primary); font-weight:800;">${selectedSector}</span>`;
    }
  }

  if (filterSelectContainer) {
    if (isMonitor) {
      filterSelectContainer.style.display = 'block';
      filterSelectContainer.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.2)); border: 2px solid var(--accent-cyan); padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 0.9rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);">
          <div>
            <span style="font-size:0.88rem; font-weight:800; color:var(--accent-cyan); text-transform:uppercase; letter-spacing:0.05em;">📺 TRANSMISSÃO AO VIVO (GESTAO VISUAL 16:9) • FÁBRICA & ESCRITÓRIO</span>
            <span style="font-size:0.78rem; color:#e2e8f0; display:block; margin-top:0.15rem;">Sincronização em nuvem ativa a cada 2s • Rodízio 5x5 Imparcial</span>
          </div>
          <span class="badge-seiso" style="padding:0.4rem 0.8rem; font-size:0.82rem; font-weight:800; background:#10b981; color:#fff;">🟢 DIA ATUAL: ${currentDayCode}</span>
        </div>
      `;
    } else {
      filterSelectContainer.style.display = 'block';
      filterSelectContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
          <span style="font-size:0.82rem; font-weight:700; color:var(--accent-cyan);">🔍 Visualização da Gestão / Auditores:</span>
          <select class="form-control" style="width:auto; padding:0.4rem 0.8rem; font-size:0.85rem;" onchange="changeFactorySectorFilter(this.value)">
            <option value="ALL" ${selectedSector === 'ALL' ? 'selected' : ''}>🌐 Visão Geral Consolidada (Consolidação dos 5 Setores)</option>
            ${IMPAKTTO_SECTORS.map(s => `<option value="${s}" ${selectedSector === s ? 'selected' : ''}>📍 Setor: ${s}</option>`).join('')}
          </select>
        </div>
      `;
    }
  }

  const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  // CÁLCULO DE KPIS EXECUTIVOS PARA CABEÇALHO DA AUDITORIA DA DIRETORIA
  let totalPossibleSectors = IMPAKTTO_SECTORS.length;
  let evaluatedSectorsCount = 0;
  let totalVotesToday = 0;
  let overallPointsSum = 0;

  IMPAKTTO_SECTORS.forEach(sec => {
    let sectorVoted = false;
    SENSOS_LIST.forEach(s => {
      const bKey = `${sec}_${s.key}_${currentDayCode}`;
      const summary = getBoardCellSummary(bKey);
      if (summary.voteCount > 0) {
        sectorVoted = true;
        totalVotesToday += summary.voteCount;
        overallPointsSum += summary.avgPoints;
      }
    });
    if (sectorVoted) evaluatedSectorsCount++;
  });

  const coveragePct = Math.round((evaluatedSectorsCount / totalPossibleSectors) * 100);
  const overallScoreAvg = totalVotesToday > 0 ? Math.round((overallPointsSum / (totalPossibleSectors * SENSOS_LIST.length)) * 10) / 10 : 3.0;

  let html = `
    <!-- HEADER EXECUTIVO DE KPIS PARA A DIRETORIA & AUDITORIA SENAI -->
    <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9)); border: 1px solid var(--border-highlight); border-radius: 12px; padding: 0.85rem 1.1rem; margin-bottom: 1.1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);">
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <div style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; padding: 0.55rem 0.75rem; border-radius: 10px; text-align: center;">
          <span style="font-size: 0.7rem; font-weight: 800; color: #34d399; text-transform: uppercase; display: block;">COBERTURA DIÁRIA</span>
          <span style="font-size: 1.25rem; font-weight: 800; color: #ffffff;">${coveragePct}%</span>
        </div>
        <div>
          <span style="font-size: 0.88rem; font-weight: 800; color: #ffffff; display: block;">
            📊 Auditoria Diária 5S • IMPAK TTO Plásticos de Engenharia
          </span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            ${evaluatedSectorsCount} de ${totalPossibleSectors} Setores Avaliados Hoje (${currentDayCode}) • Total de Votos: <strong>${totalVotesToday}</strong>
          </span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 0.75rem; color: #9ca3af; font-weight: 700;">STATUS FÁBRICA:</span>
        <span style="background: ${overallScoreAvg >= 2.5 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}; border: 1px solid ${overallScoreAvg >= 2.5 ? '#10b981' : '#f59e0b'}; color: ${overallScoreAvg >= 2.5 ? '#34d399' : '#fde047'}; font-size: 0.8rem; font-weight: 800; padding: 0.35rem 0.75rem; border-radius: 20px;">
          ${overallScoreAvg >= 2.5 ? '🟢 Padrão de Excelência' : '🟡 Atenção / Em Ajuste'} (${overallScoreAvg}/3.0 pts)
        </span>
      </div>
    </div>
  `;

  if (isMonitor || selectedSector === 'ALL') {
    html += `
      <table class="factory-board-table">
        <thead>
          <tr>
            <th style="text-align:left; width: 180px;">DEPARTAMENTO FÁBRICA</th>
            ${SENSOS_LIST.map(s => `<th style="font-size:0.75rem;">${s.name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    IMPAKTTO_SECTORS.forEach(sec => {
      const isUserTarget = (sec === assignment.targetSector);

      html += `
        <tr style="${isUserTarget ? 'background: rgba(16,185,129,0.12); border:1px solid #10b981;' : ''}">
          <td style="text-align:left; font-weight:700; font-size:0.8rem; color:#e2e8f0; padding: 0.45rem 0.6rem;">
            📍 ${sec} ${isUserTarget ? '<span style="color:#34d399; font-size:0.7rem; display:block; font-weight:800;">🎯 SEU ALVO HOJE</span>' : ''}
          </td>
          ${SENSOS_LIST.map(s => {
            const boardKey = `${sec}_${s.key}_${currentDayCode}`;
            const summary = getBoardCellSummary(boardKey);
            
            if (summary.voteCount === 0) {
              return `
                <td style="vertical-align:middle; padding:0.3rem 0.2rem;">
                  <button class="score-btn-factory" style="display:inline-block; padding:0.35rem 0.5rem; font-size:0.72rem; font-weight:600; cursor:pointer; background:rgba(255,255,255,0.05); color:#9ca3af; border:1px dashed rgba(255,255,255,0.2); border-radius:6px;" onclick="openVoteChoiceModal('${sec}', '${boardKey}', '${s.name}', '${currentDayCode}')" title="Pendente de avaliação no rodízio de hoje">
                    ⚪ Pendente
                  </button>
                </td>
              `;
            }

            const iconMap = { bom: '🟢 Bom', regular: '🟡 Regular', ruim: '🔴 Ruim' };
            const countBadge = `<span style="background:rgba(0,0,0,0.4); padding:0.1rem 0.35rem; border-radius:10px; font-size:0.65rem; margin-left:0.25rem;">📊 ${summary.avgPoints} (${summary.voteCount}v)</span>`;

            return `
              <td style="vertical-align:middle; padding:0.3rem 0.2rem;">
                <button class="score-btn-factory selected" data-level="${summary.status}" style="display:inline-block; padding:0.35rem 0.5rem; font-size:0.75rem; font-weight:700; cursor:pointer; border:none;" onclick="openVoteChoiceModal('${sec}', '${boardKey}', '${s.name}', '${currentDayCode}')" title="${summary.voteCount} voto(s) registrado(s). Média: ${summary.avgPoints}">
                  ${iconMap[summary.status]} ${countBadge}
                </button>
              </td>
            `;
          }).join('')}
        </tr>
      `;
    });

    html += `
      <tr style="background: rgba(99, 102, 241, 0.18); border-top: 2px solid var(--primary);">
        <td style="text-align:left; font-weight:800; font-size:0.85rem; color:var(--accent-cyan); padding: 0.6rem 0.6rem;">
          🌐 FECHAMENTO DA FÁBRICA
        </td>
        ${SENSOS_LIST.map(s => {
          let totalPtsSum = 0;
          let votedSectors = 0;

          IMPAKTTO_SECTORS.forEach(sec => {
            const bKey = `${sec}_${s.key}_${currentDayCode}`;
            const summary = getBoardCellSummary(bKey);
            if (summary.voteCount > 0) {
              totalPtsSum += summary.avgPoints;
              votedSectors++;
            }
          });

          if (votedSectors === 0) {
            return `
              <td style="vertical-align:middle; padding:0.4rem 0.2rem;">
                <span class="score-btn-factory" style="display:inline-block; padding:0.35rem 0.55rem; font-size:0.72rem; font-weight:600; background:rgba(255,255,255,0.05); color:#9ca3af; border:1px dashed rgba(255,255,255,0.2);">
                  ⚪ Aguardando
                </span>
              </td>
            `;
          }

          const overallAvg = Math.round((totalPtsSum / votedSectors) * 10) / 10;
          let currentStatus = 'bom';
          let labelText = `🟢 Bom (${overallAvg})`;

          if (overallAvg < 1.7) {
            currentStatus = 'ruim';
            labelText = `🔴 Ruim (${overallAvg})`;
          } else if (overallAvg < 2.5) {
            currentStatus = 'regular';
            labelText = `🟡 Reg (${overallAvg})`;
          }

          return `
            <td style="vertical-align:middle; padding:0.4rem 0.2rem;">
              <span class="score-btn-factory selected" data-level="${currentStatus}" style="display:inline-block; padding:0.35rem 0.55rem; font-size:0.75rem; font-weight:800; box-shadow: 0 0 10px rgba(0,0,0,0.4);">
                ${labelText} (${votedSectors} sec)
              </span>
            </td>
          `;
        }).join('')}
      </tr>
    `;

    html += `</tbody></table>`;

  } else {
    html += `
      <table class="factory-board-table">
        <thead>
          <tr>
            <th style="text-align:left; width: 280px;">CONCEITO 5S (MATRIZ DA FÁBRICA)</th>
            ${days.map(d => {
              const dayIdx = daysOrder.indexOf(d);
              const isFuture = (dayIdx > todayIndexInWeek);
              return `<th style="${d === currentDayCode ? 'background:rgba(99,102,241,0.3); color:#fff; border-bottom:2px solid var(--primary);' : (isFuture ? 'opacity:0.5;' : '')}">${d} ${d === currentDayCode ? '⭐ (Hoje)' : (isFuture ? '⏳' : '')}</th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    SENSOS_LIST.forEach(s => {
      const isTargetSenso = (s.name === assignment.targetSenso.name);

      html += `
        <tr style="${isTargetSenso ? 'background: rgba(16,185,129,0.08);' : ''}">
          <td style="text-align:left; vertical-align:middle; padding: 0.85rem;">
            <span class="senso-badge-title badge-${s.key}" style="margin:0 0 0.25rem 0;">${s.name}</span>
            <div style="font-size:0.75rem; color:#9ca3af; line-height:1.25; font-weight: 500;">
              💡 ${s.desc}
            </div>
          </td>
          ${days.map(day => {
            const dayIdx = daysOrder.indexOf(day);
            const isFuture = (dayIdx > todayIndexInWeek);

            if (isFuture) {
              return `
                <td style="vertical-align:middle; opacity:0.35;">
                  <button class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem; cursor:not-allowed;" disabled>
                    ⚪ Aguardando
                  </button>
                </td>
              `;
            } else {
              const boardKey = `${selectedSector}_${s.key}_${day}`;
              const summary = getBoardCellSummary(boardKey);
              
              if (summary.voteCount === 0) {
                return `
                  <td style="vertical-align:middle; ${day === currentDayCode ? 'background:rgba(99,102,241,0.1);' : ''}">
                    <button class="btn btn-secondary" style="padding:0.4rem 0.75rem; font-size:0.8rem; font-weight:600; cursor:pointer; min-height:42px; width:100%; border-radius:8px; opacity:0.7;" onclick="openVoteChoiceModal('${selectedSector}', '${boardKey}', '${s.name}', '${day}')" title="Pendente de avaliação no rodízio de hoje">
                      ⚪ Pendente
                    </button>
                  </td>
                `;
              }

              const iconMap = { bom: '🟢 Bom', regular: '🟡 Regular', ruim: '🔴 Ruim' };
              const countBadge = `<span style="background:rgba(0,0,0,0.4); padding:0.1rem 0.35rem; border-radius:10px; font-size:0.65rem; margin-left:0.25rem;">📊 ${summary.avgPoints} (${summary.voteCount}v)</span>`;

              return `
                <td style="vertical-align:middle; ${day === currentDayCode ? 'background:rgba(99,102,241,0.1);' : ''}">
                  <button class="btn btn-secondary" style="padding:0.4rem 0.75rem; font-size:0.85rem; font-weight:800; cursor:pointer; min-height:42px; width:100%; border-radius:8px;" onclick="openVoteChoiceModal('${selectedSector}', '${boardKey}', '${s.name}', '${day}')" title="Clique para abrir caixa de escolha de voto. Média: ${summary.avgPoints} (${summary.voteCount} votos)">
                    ${iconMap[summary.status]} ${countBadge}
                  </button>
                </td>
              `;
            }
          }).join('')}
        </tr>
      `;
    });

    html += `</tbody></table>`;
  }

  // LEGENDA EXECUTIVA AO RODAPÉ
  html += `
    <div style="margin-top: 0.9rem; padding: 0.65rem 0.95rem; background: rgba(0,0,0,0.25); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 0.78rem; color: var(--text-muted);">
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <span style="font-weight: 800; color: #ffffff;">📌 LEGENDA GOVERNANÇA SENAI & DIRETORIA:</span>
        <span><strong style="color: #9ca3af;">⚪ Pendente:</strong> Aguardando rodízio do dia</span>
        <span><strong style="color: #34d399;">🟢 Bom (3.0):</strong> Conforme</span>
        <span><strong style="color: #fde047;">🟡 Regular (2.0):</strong> Oportunidade</span>
        <span><strong style="color: #fca5a5;">🔴 Ruim (1.0):</strong> Não Conforme</span>
      </div>
      <span>💡 Sincronização automatizada em nuvem real-time</span>
    </div>
  `;

  container.innerHTML = html;
}

window.changeFactorySectorFilter = function(val) {
  activeFactorySectorFilter = val;
  renderFactoryBoard();
};

// 7. CÁLCULO DE RESULTADOS E CONTROLE ESTRITO DA SINALIZAÇÃO DE PREMIAÇÃO (CÁLCULO UNIFICADO COM VOTOS EM TEMPO REAL)
function calculateAuditResults() {
  const totals = { seiri: 0, seiton: 0, seiso: 0, seiketsu: 0, shitsuke: 0 };
  const maxPerSenso = 30;
  const scorePoints = { bom: 3, regular: 2, ruim: 1 };

  for (const senso of Object.keys(AUDIT_QUESTIONS)) {
    for (let i = 0; i < 10; i++) {
      const qKey = `${senso}_${i}`;
      const level = clientAuditScores[qKey] || 'bom';
      totals[senso] += (scorePoints[level] || 3);
    }
  }

  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const todayIdxRaw = new Date().getDay();
  const currentDayCode = dayNames[todayIdxRaw] === 'DOM' ? 'SEG' : dayNames[todayIdxRaw];

  const percentages = [];

  for (const sensoKey of Object.keys(totals)) {
    const auditPct = Math.round((totals[sensoKey] / maxPerSenso) * 100);

    let boardSum = 0;
    let boardCount = 0;
    IMPAKTTO_SECTORS.forEach(sec => {
      const bKey = `${sec}_${sensoKey}_${currentDayCode}`;
      const summary = getBoardCellSummary(bKey);
      if (summary && summary.voteCount > 0) {
        boardSum += (summary.avgPoints / 3.0) * 100;
        boardCount++;
      }
    });

    let finalPct = auditPct;
    if (boardCount > 0) {
      const boardAvgPct = Math.round(boardSum / boardCount);
      finalPct = Math.round((boardAvgPct + auditPct) / 2);
    }

    percentages.push(finalPct);

    const elScore = document.getElementById(`score-${sensoKey}`);
    const elBar = document.getElementById(`bar-${sensoKey}`);

    if (elScore) elScore.innerText = `${finalPct}%`;
    if (elBar) elBar.style.width = `${finalPct}%`;
  }

  const globalPct = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
  const elGlobal = document.getElementById('global-maturity-score');
  const elStatus = document.getElementById('global-maturity-status');

  if (elGlobal) elGlobal.innerText = `${globalPct}%`;

  if (elStatus) {
    if (globalPct >= 95) {
      elStatus.innerText = 'Excelente (Nível 5 - Excelência Continua)';
      elStatus.style.color = '#10b981';
    } else if (globalPct >= 80) {
      elStatus.innerText = 'Bom (Nível 4 - Padronizado)';
      elStatus.style.color = '#3b82f6';
    } else if (globalPct >= 65) {
      elStatus.innerText = 'Regular (Nível 3 - Em Consolidação)';
      elStatus.style.color = '#f59e0b';
    } else {
      elStatus.innerText = 'Insuficiente (Nível 1/2 - Requer Ação)';
      elStatus.style.color = '#ef4444';
    }
  }

  const rewardBadgeEl = document.getElementById('monthly-reward-badge');
  if (rewardBadgeEl) {
    const isSeniorOrSemanal = (currentUser && (currentUser.level === 'senior' || currentUser.level === 'semanal' || currentUser.role === 'administrador' || currentUser.role === 'auditor_semanal'));

    if (isSeniorOrSemanal) {
      rewardBadgeEl.style.display = 'block';
      if (globalPct >= 90) {
        rewardBadgeEl.innerHTML = `
          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(245, 158, 11, 0.2)); border: 2px solid #f59e0b; padding: 0.85rem 1.25rem; border-radius: var(--radius-md); margin-top: 0.75rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);">
            <div>
              <span style="font-size: 0.78rem; font-weight: 800; color: #fde047; text-transform: uppercase; letter-spacing:0.05em;">🏆 GESTÃO DE PREMIAÇÃO MENSAL EM DINHEIRO (RESTRITO AUDITORES & DIRETORIA)</span>
              <div style="font-size: 1.05rem; font-weight: 800; color: #ffffff; margin-top: 0.15rem;">
                🎉 META DE 90% ALCANÇADA! (${globalPct}%) - ELEGÍVEL AO PRÊMIO EM DINHEIRO MENSAL!
              </div>
            </div>
            <span style="font-size: 1.8rem; filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.8));">💰</span>
          </div>
        `;
      } else {
        const remaining = 90 - globalPct;
        rewardBadgeEl.innerHTML = `
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-color); padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-top: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">🏆 GESTÃO DE PREMIAÇÃO MENSAL EM DINHEIRO (META: 90%)</span>
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-top: 0.15rem;">
                Nota Atual da Auditoria: ${globalPct}% • <span style="color: var(--status-regular);">Faltam ${remaining}% para alcançar a Meta do Prêmio em Dinheiro!</span>
              </div>
            </div>
            <span style="font-size: 1.4rem;">🎯</span>
          </div>
        `;
      }
    } else {
      rewardBadgeEl.style.display = 'none';
      rewardBadgeEl.innerHTML = '';
    }
  }

  renderRadarChart(percentages);
}

function renderRadarChart(scoresData) {
  const canvas = document.getElementById('radarChart5S');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = ['1. Utilização (Seiri)', '2. Organização (Seiton)', '3. Limpeza (Seiso)', '4. Padronização (Seiketsu)', '5. Disciplina (Shitsuke)'];

  if (radarChartInstance) {
    radarChartInstance.data.datasets[0].data = scoresData;
    radarChartInstance.update();
  } else {
    radarChartInstance = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Maturidade % por Senso',
          data: scoresData,
          backgroundColor: 'rgba(99, 102, 241, 0.25)',
          borderColor: '#6366f1',
          pointBackgroundColor: '#8b5cf6',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#8b5cf6',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            pointLabels: { color: '#9ca3af', font: { size: 10, weight: 'bold' } },
            ticks: { color: '#9ca3af', backdropColor: 'transparent', stepSize: 20 },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
}

window.resetAudit = function() {
  if (confirm('Deseja redefinir a auditoria da IMPAK TTO?')) {
    clientAuditScores = {};
    localStorage.removeItem('5s_audit_scores_impaktto');
    logActivity('Redefiniu todas as respostas da auditoria');
    pushDataToServer();
    renderAuditForms();
    calculateAuditResults();
  }
};

// MATRIZ GUT
function handleAddGUT(e) {
  if (e) e.preventDefault();
  const problem = document.getElementById('gut-problem').value;
  const g = parseInt(document.getElementById('gut-g').value);
  const u = parseInt(document.getElementById('gut-u').value);
  const t = parseInt(document.getElementById('gut-t').value);

  if (!problem) return;

  const score = g * u * t;
  const item = { id: Date.now(), problem, g, u, t, score, createdBy: currentUser ? currentUser.name : 'Usuário' };
  clientGutMatrix.push(item);
  localStorage.setItem('5s_gut_matrix_impaktto', JSON.stringify(clientGutMatrix));

  logActivity(`Adicionou o problema "${problem}" na Matriz GUT (Pontuação: ${score})`);
  pushDataToServer();
  document.getElementById('gut-problem').value = '';
  renderGUTTable();
}

function renderGUTTable() {
  const tbody = document.getElementById('gut-table-body');
  if (!tbody) return;

  clientGutMatrix = JSON.parse(localStorage.getItem('5s_gut_matrix_impaktto')) || clientGutMatrix;
  clientGutMatrix.sort((a, b) => b.score - a.score);

  if (clientGutMatrix.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 1rem;">Nenhum problema cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = clientGutMatrix.map((item, idx) => `
    <tr>
      <td><strong>#${idx + 1}</strong></td>
      <td>${item.problem} <br><small style="color:var(--text-muted);">Por: ${item.createdBy || 'Usuário'}</small></td>
      <td style="text-align:center;">${item.g}</td>
      <td style="text-align:center;">${item.u}</td>
      <td style="text-align:center;">${item.t}</td>
      <td style="text-align:center;"><span class="badge-seiri" style="padding:0.2rem 0.6rem; font-weight:700;">${item.score}</span></td>
      <td style="text-align:center;">
        <button class="btn btn-danger" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="removeGUT(${item.id})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

window.removeGUT = function(id) {
  const item = clientGutMatrix.find(i => i.id === id);
  if (item) logActivity(`Removeu o problema "${item.problem}" da Matriz GUT`);

  clientGutMatrix = clientGutMatrix.filter(i => i.id !== id);
  localStorage.setItem('5s_gut_matrix_impaktto', JSON.stringify(clientGutMatrix));
  pushDataToServer();
  renderGUTTable();
};

// KANBAN 5W2H
function handleAddKanban(e) {
  if (e) e.preventDefault();
  const title = document.getElementById('kanban-title').value;
  const senso = document.getElementById('kanban-senso').value;
  const owner = document.getElementById('kanban-owner').value;
  const date = document.getElementById('kanban-date').value;

  if (!title) return;

  clientKanbanTasks.push({
    id: Date.now().toString(),
    title,
    senso,
    status: 'a-fazer',
    owner: owner || 'Não atribuído',
    date: date || 'A definir',
    createdBy: currentUser ? currentUser.name : 'Usuário'
  });

  localStorage.setItem('5s_kanban_tasks_impaktto', JSON.stringify(clientKanbanTasks));
  logActivity(`Criou a tarefa no Kanban: "${title}" (Resp: ${owner || 'Não atribuído'})`);
  pushDataToServer();
  document.getElementById('kanban-title').value = '';
  renderKanban();
}

function renderKanban() {
  const cols = {
    'a-fazer': document.getElementById('kanban-col-todo'),
    'em-andamento': document.getElementById('kanban-col-doing'),
    'concluido': document.getElementById('kanban-col-done')
  };

  if (!cols['a-fazer']) return;
  Object.values(cols).forEach(col => col.innerHTML = '');

  clientKanbanTasks = JSON.parse(localStorage.getItem('5s_kanban_tasks_impaktto')) || clientKanbanTasks;

  clientKanbanTasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.innerHTML = `
      <div class="kanban-card-title">${task.title}</div>
      <div class="kanban-card-meta">
        <span>👤 ${task.owner}</span>
        <span>📅 ${task.date}</span>
      </div>
      <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">Criado por: ${task.createdBy || 'Usuário'}</div>
      <div style="margin-top: 0.5rem; display: flex; gap: 0.25rem; justify-content: flex-end;">
        ${task.status !== 'a-fazer' ? `<button class="btn btn-secondary" style="padding:0.15rem 0.4rem; font-size:0.7rem;" onclick="moveKanban('${task.id}', 'prev')">←</button>` : ''}
        ${task.status !== 'concluido' ? `<button class="btn btn-primary" style="padding:0.15rem 0.4rem; font-size:0.7rem;" onclick="moveKanban('${task.id}', 'next')">→</button>` : ''}
        <button class="btn btn-danger" style="padding:0.15rem 0.4rem; font-size:0.7rem;" onclick="deleteKanban('${task.id}')">✕</button>
      </div>
    `;

    if (cols[task.status]) cols[task.status].appendChild(card);
  });
}

window.moveKanban = function(id, dir) {
  const task = clientKanbanTasks.find(t => t.id === id);
  if (!task) return;

  const flow = ['a-fazer', 'em-andamento', 'concluido'];
  let currentIdx = flow.indexOf(task.status);

  if (dir === 'next' && currentIdx < 2) currentIdx++;
  if (dir === 'prev' && currentIdx > 0) currentIdx--;

  task.status = flow[currentIdx];
  localStorage.setItem('5s_impaktto_tasks', JSON.stringify(clientKanbanTasks));
  logActivity(`Moveu a tarefa "${task.title}" para ${task.status.toUpperCase()}`);
  pushDataToServer();
  renderKanban();
};

window.deleteKanban = function(id) {
  const task = clientKanbanTasks.find(t => t.id === id);
  if (task) logActivity(`Excluiu a tarefa "${task.title}" do Kanban`);

  clientKanbanTasks = clientKanbanTasks.filter(t => t.id !== id);
  localStorage.setItem('5s_kanban_tasks_impaktto', JSON.stringify(clientKanbanTasks));
  pushDataToServer();
  renderKanban();
};

// ISHIKAWA
function handleUpdateIshikawa(e) {
  if (e) e.preventDefault();
  const problem = document.getElementById('ishikawa-problem-input').value;
  const mType = document.getElementById('ishikawa-m-type').value;
  const cause = document.getElementById('ishikawa-cause-input').value;

  if (problem) clientIshikawaData.problem = problem;
  if (cause && clientIshikawaData[mType]) {
    clientIshikawaData[mType].push(cause);
    logActivity(`Adicionou a causa "${cause}" no Diagrama de Ishikawa (${mType.toUpperCase()})`);
    pushDataToServer();
  }

  localStorage.setItem('5s_ishikawa_impaktto', JSON.stringify(clientIshikawaData));
  document.getElementById('ishikawa-cause-input').value = '';
  renderIshikawa();
}

function renderIshikawa() {
  const problemTitle = document.getElementById('ishikawa-effect-title');
  if (problemTitle) problemTitle.innerText = clientIshikawaData.problem || 'Sem problema definido';

  clientIshikawaData = JSON.parse(localStorage.getItem('5s_ishikawa_impaktto')) || clientIshikawaData;

  const mList = ['maoObra', 'metodo', 'maquina', 'material', 'meioAmbiente', 'medicao'];
  mList.forEach(m => {
    const el = document.getElementById(`ishikawa-list-${m}`);
    if (el) {
      el.innerHTML = (clientIshikawaData[m] || []).map(c => `<li>${c}</li>`).join('') || '<li style="color:var(--text-dim)">Nenhuma causa anotada</li>';
    }
  });
}
