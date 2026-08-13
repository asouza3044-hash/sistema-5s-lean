/* ==========================================================================
   PORTAL DEDICADO IMPAK TTO PLÁSTICOS DE ENGENHARIA
   PROJETO ESPECIAL DE IMPLANTAÇÃO 5S & QUALIDADE (SENAI)
   ========================================================================== */

// BACKEND REAL: NETLIFY FUNCTIONS + NEON POSTGRES (SUBSTITUI O ANTIGO DOCUMENTO PÚBLICO NO JSONBLOB.COM)
const API_BASE = '/.netlify/functions';
let authToken = localStorage.getItem('5s_impaktto_token') || null;

// CHAMADA AUTENTICADA GENÉRICA ÀS NETLIFY FUNCTIONS (SUBSTITUI O FETCH DIRETO AO JSONBLOB)
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = {};
  try { data = await res.json(); } catch (e) { /* resposta sem corpo (204) */ }

  if (!res.ok) {
    const err = new Error(data.error || `Erro ${res.status} ao falar com o servidor`);
    err.status = res.status;
    throw err;
  }
  return data;
}

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

// LOGIN REAL CONTRA O SERVIDOR (SUBSTITUI A ANTIGA VALIDAÇÃO LOCAL COM SENHAS UNIVERSAIS)
async function performLogin(username, password) {
  const { token, user } = await apiFetch('/auth-login', { method: 'POST', body: { username, password } });
  authToken = token;
  currentUser = user;
  localStorage.setItem('5s_impaktto_token', authToken);
  localStorage.setItem('5s_impaktto_session', JSON.stringify(currentUser));

  const loginOverlay = document.getElementById('login-overlay');
  if (loginOverlay) {
    loginOverlay.style.display = 'none';
    loginOverlay.classList.add('hidden');
  }

  await checkAuthSession();
}

// 1. ATALHO PARA A CONTA MESTRE — só preenche o usuário "admin" e foca a senha.
// A senha não fica mais escrita no código-fonte (antes ficava visível para qualquer
// pessoa que abrisse o DevTools do navegador); quem usa o atalho ainda precisa digitá-la.
window.quickMasterLogin = function() {
  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  if (uInput) uInput.value = 'admin';
  if (pInput) pInput.focus();
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

// OS 3 SENSOS QUE EXIGEM VOTO REAL TODO DIA EM CADA UM DOS 5 SETORES (5 x 3 = 15 CÉLULAS OBRIGATÓRIAS).
// Os 2 últimos (Seiketsu/Shitsuke) NUNCA pedem voto manual — são calculados como média dos 3 primeiros
// daquele setor no dia (ver getComputedSensoSummary).
const REQUIRED_SENSOS = SENSOS_LIST.slice(0, 3);
const COMPUTED_SENSOS = SENSOS_LIST.slice(3);

// HASH ESTÁVEL DE STRING (PARA DAR A CADA PESSOA UM PONTO DE PARTIDA DIFERENTE NO RODÍZIO)
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// MATRIZ DE ALOCAÇÃO DO RODÍZIO CRUZADO — cada pessoa fecha 1 DEPARTAMENTO INTEIRO por dia (os 3
// sensos obrigatórios de uma vez, não 1 senso solto), sempre num setor que não é o seu. É um
// deslocamento cíclico fixo (não depende de hash): com os 5 líderes oficiais (1 por setor), isso
// garante uma correspondência 1-para-1 sem repetição — os 5 setores fecham automaticamente todo dia
// quando os 5 votam. Gente extra do mesmo setor (ex: o auditor de nível 2 daquele setor) cai no MESMO
// alvo do líder do dia, reforçando/conferindo o mesmo setor. Se sobrar gente faltando, o Nível 2/3
// fecha manualmente pelo quadro (ver openVoteChoiceModal).
function getRotationAssignment(user, dayCodeInput) {
  if (!user) {
    return { targetSector: 'Holter', dayCode: 'SEG' };
  }

  const daysOrder = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const todayIdxRaw = new Date().getDay();
  const currentDayCode = dayCodeInput || (dayNames[todayIdxRaw] === 'DOM' ? 'SEG' : dayNames[todayIdxRaw]);
  const dayOffset = Math.max(0, daysOrder.indexOf(currentDayCode));

  const userSector = user.sector || '';
  const homeIdx = IMPAKTTO_SECTORS.indexOf(userSector);
  const numSectors = IMPAKTTO_SECTORS.length;

  // Deslocamento de 1 a (numSectors-1) — nunca 0, então nunca cai no próprio setor.
  const shift = 1 + (dayOffset % (numSectors - 1));
  const targetIdx = homeIdx === -1
    ? dayOffset % numSectors // colaboradores fora dos 5 setores (ex: times comerciais) rodam por todos
    : (homeIdx + shift) % numSectors;
  const targetSector = IMPAKTTO_SECTORS[targetIdx];

  return { targetSector, dayCode: currentDayCode };
}

function getBalancedTargetSector(user) {
  return getRotationAssignment(user).targetSector;
}

// COBERTURA DO DIA: quantas das 15 células obrigatórias (5 setores x 3 sensos) já têm ao menos 1 voto,
// e quais setores já fecharam os 3 sensos obrigatórios ("setor fechado" = pronto para consolidar).
function getDailyCoverage(dayCode) {
  let closedCells = 0;
  let closedSectors = 0;
  const pendingCells = [];

  IMPAKTTO_SECTORS.forEach(sector => {
    let sectorClosed = true;
    REQUIRED_SENSOS.forEach(senso => {
      const boardKey = `${sector}_${senso.key}_${dayCode}`;
      const summary = getBoardCellSummary(boardKey);
      if (summary.voteCount > 0) {
        closedCells++;
      } else {
        sectorClosed = false;
        pendingCells.push({ sector, senso });
      }
    });
    if (sectorClosed) closedSectors++;
  });

  const totalCells = IMPAKTTO_SECTORS.length * REQUIRED_SENSOS.length;
  return { closedCells, totalCells, closedSectors, totalSectors: IMPAKTTO_SECTORS.length, pendingCells };
}


// Estado Global — userDatabase é sempre populado a partir do servidor (ver refreshAllFromServer).
// Não existe mais blacklist local de exclusão: excluir um usuário agora é um DELETE real no banco,
// visível para todos os dispositivos na próxima atualização.
let userDatabase = {};

// currentUser só é considerado válido se ainda houver um token de sessão — sem token, não há sessão.
let currentUser = authToken ? (JSON.parse(localStorage.getItem('5s_impaktto_session')) || null) : null;

// Dados da Impaktto
let clientAuditScores = {};
let clientGutMatrix = [];
let clientKanbanTasks = [];
let clientIshikawaData = {};
let clientActivityLogs = [];
let clientFactoryBoard = {};
let activeFactorySectorFilter = 'ALL';
let radarChartInstance = null;
let radarChartInstanceMonitor = null;
let autoRefreshTimer = null;
let currentVoteTarget = null;
let modalSelectedScore = 'bom';
// Nota selecionada para cada um dos 3 sensos obrigatórios do departamento-alvo do dia (fecha o
// departamento inteiro de uma vez, não 1 senso solto). Chaves: seiri, seiton, seiso.
let level1SelectedScores = { seiri: 'bom', seiton: 'bom', seiso: 'bom' };

// HELPER PARA CÁLCULO E CONVERSÃO DE MÉDIA DE VOTOS POR CÉLULA DO QUADRO (DIFERENCIA CÉLULAS PENDENTES DE CÉLULAS VOTADAS)
// SEIKETSU/SHITSUKE NUNCA TÊM VOTO PRÓPRIO — SÃO A MÉDIA DOS 3 SENSOS OBRIGATÓRIOS DAQUELE SETOR NO DIA.
function getComputedSensoSummary(sector, dayCode) {
  const baseSummaries = REQUIRED_SENSOS
    .map(s => getBoardCellSummary(`${sector}_${s.key}_${dayCode}`))
    .filter(s => s.voteCount > 0);

  if (baseSummaries.length === 0) {
    return { status: 'pendente', avgPoints: 0, voteCount: 0, votes: [], computed: true };
  }

  const avgPts = baseSummaries.reduce((acc, s) => acc + s.avgPoints, 0) / baseSummaries.length;
  const status = avgPts >= 2.5 ? 'bom' : (avgPts >= 1.7 ? 'regular' : 'ruim');

  return { status, avgPoints: Math.round(avgPts * 10) / 10, voteCount: baseSummaries.length, votes: [], computed: true };
}

function getBoardCellSummary(boardKey) {
  const parts = boardKey.split('_');
  const dayCode = parts[parts.length - 1];
  const sensoKey = parts[parts.length - 2];
  const sector = parts.slice(0, parts.length - 2).join('_');

  if (sensoKey === 'seiketsu' || sensoKey === 'shitsuke') {
    return getComputedSensoSummary(sector, dayCode);
  }

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

// ATUALIZAÇÃO A PARTIR DO SERVIDOR REAL (SUBSTITUI O ANTIGO MERGE POR "ÚLTIMA ESCRITA GANHA" DO JSONBLOB)
// Cada recurso já vem pronto do banco — não há mais merge do lado do cliente, o Postgres é a única
// fonte de verdade. Mantém os mesmos nomes de função usados no resto do app (pushDataToServer,
// pullDataFromServer, loadImpakttoData) como apelidos, para não precisar tocar em cada chamador.
async function refreshAllFromServer() {
  if (!authToken) return;
  try {
    const [usersRes, boardRes, logsRes, auditRes, gutRes, kanbanRes, ishikawaRes] = await Promise.all([
      apiFetch('/users'),
      apiFetch('/factory-board'),
      apiFetch('/activity-log'),
      apiFetch('/audit-responses'),
      apiFetch('/gut-matrix'),
      apiFetch('/kanban-tasks'),
      apiFetch('/ishikawa'),
    ]);

    userDatabase = {};
    (usersRes.users || []).forEach(u => { userDatabase[u.username] = u; });

    clientFactoryBoard = boardRes.board || {};
    clientActivityLogs = logsRes.logs || [];
    clientAuditScores = auditRes.scores || {};
    clientGutMatrix = gutRes.items || [];
    clientKanbanTasks = kanbanRes.items || [];
    clientIshikawaData = ishikawaRes.data || clientIshikawaData;

    renderFactoryBoard();
    renderActivityLogs();
    calculateAuditResults();
    renderUserManagementTable();
    if (typeof renderGUTTable === 'function') renderGUTTable();
    if (typeof renderKanban === 'function') renderKanban();
    if (typeof renderIshikawa === 'function') renderIshikawa();
    if (currentUser && currentUser.level === 'monitor') renderMonitorTvDashboard();
  } catch (e) {
    console.error('Erro ao atualizar dados do servidor:', e);
  }
}

const loadImpakttoData = refreshAllFromServer;
const pushDataToServer = refreshAllFromServer;
const pullDataFromServer = refreshAllFromServer;

window.forceCloudSyncNow = async function() {
  await refreshAllFromServer();
  alert('🎉 Sincronização concluída! Todos os cadastros, votos e gráficos estão atualizados.');
};

// O voto diário agora é controlado pelo próprio banco (uma linha por usuário/célula/dia,
// com restrição UNIQUE) — não existe mais flag local para "liberar" manualmente.
window.resetCurrentMyVoteForTesting = function() {
  alert('O controle de "já votei hoje" agora é feito pelo servidor (Neon), não mais pelo navegador — não há mais nada para liberar aqui.');
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

  // "Já fechei o setor hoje" agora vem do próprio quadro trazido do servidor (uma linha por
  // usuário/célula/dia no Postgres) — só conta como feito quando os 3 sensos obrigatórios do
  // departamento-alvo já têm um voto DESTE usuário.
  const hasVotedToday = !!currentUser && REQUIRED_SENSOS.every(s => {
    const bKey = `${assignment.targetSector}_${s.key}_${currentDayCode}`;
    return getBoardCellSummary(bKey).votes.some(v => v.username === currentUser.username);
  });

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
        <div style="font-size:0.82rem; color:#e2e8f0; margin-top:0.35rem;">
          Feche o setor avaliando os <strong>3 sensos abaixo</strong> de uma vez só.
        </div>

        <div style="font-size:0.82rem; color:#e2e8f0; margin-top:0.45rem;">
          👤 <strong>Avaliador:</strong> ${currentUser ? currentUser.name : 'Colaborador'} (Origem: <strong>${userSector}</strong> ➔ Destino: <strong>${assignment.targetSector}</strong>)
        </div>
      </div>

      <!-- 3 GRUPOS DE NOTA, 1 POR SENSO OBRIGATÓRIO — FECHA O SETOR INTEIRO NUMA SÓ TELA -->
      <div style="display:flex; flex-direction:column; gap:0.85rem; margin-bottom:1.2rem;">
        ${REQUIRED_SENSOS.map(s => {
          const selected = level1SelectedScores[s.key] || 'bom';
          const opts = [
            { key: 'bom', label: '🟢 Bom', border: '#10b981', bg: 'rgba(16,185,129,0.3)' },
            { key: 'regular', label: '🟡 Regular', border: '#f59e0b', bg: 'rgba(245,158,11,0.3)' },
            { key: 'ruim', label: '🔴 Ruim', border: '#ef4444', bg: 'rgba(239,68,68,0.3)' },
          ];
          return `
            <div>
              <div style="font-size:0.85rem; font-weight:800; color:#e2e8f0; margin-bottom:0.35rem;">${s.name}</div>
              <div style="display:flex; gap:0.4rem;">
                ${opts.map(o => `
                  <button type="button" id="lvl1-opt-${s.key}-${o.key}" onclick="selectLevel1VoteOption('${s.key}', '${o.key}')" style="flex:1; padding:0.65rem 0.4rem; font-size:0.85rem; font-weight:700; border-radius:10px; cursor:pointer; touch-action:manipulation; border:2px solid ${selected === o.key ? o.border : 'rgba(255,255,255,0.12)'}; background:${selected === o.key ? o.bg : 'rgba(255,255,255,0.04)'}; color:${selected === o.key ? '#ffffff' : '#9ca3af'};">
                    ${o.label}
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-bottom:1.2rem;">
        <label style="font-size:0.8rem; font-weight:700; color:#9ca3af; display:block; margin-bottom:0.35rem;">
          📝 Observação / Apontamento de Campo (Opcional):
        </label>
        <input type="text" id="lvl1-comment-input" class="form-control" placeholder="Ex: Ferramentas fora do lugar na bancada..." style="width:100%; font-size:0.9rem; padding:0.65rem 0.85rem; border-radius:8px;">
      </div>

      <button type="button" class="btn btn-primary" onclick="submitLevel1DirectVote()" style="width:100%; padding:0.95rem; font-size:1.05rem; font-weight:800; border-radius:12px; background:linear-gradient(135deg, #10b981, #06b6d4); box-shadow:0 0 20px rgba(16,185,129,0.4); cursor:pointer;">
        ✅ CONFIRMAR E FECHAR O SETOR
      </button>

    </div>
  `;
}

window.selectLevel1VoteOption = function(sensoKey, opt) {
  level1SelectedScores[sensoKey] = opt;

  const stylesMap = {
    bom: { border: '#10b981', bg: 'rgba(16,185,129,0.3)' },
    regular: { border: '#f59e0b', bg: 'rgba(245,158,11,0.3)' },
    ruim: { border: '#ef4444', bg: 'rgba(239,68,68,0.3)' }
  };

  ['bom', 'regular', 'ruim'].forEach(o => {
    const btn = document.getElementById(`lvl1-opt-${sensoKey}-${o}`);
    if (!btn) return;
    if (o === opt) {
      btn.style.borderColor = stylesMap[o].border;
      btn.style.background = stylesMap[o].bg;
      btn.style.color = '#ffffff';
    } else {
      btn.style.borderColor = 'rgba(255,255,255,0.12)';
      btn.style.background = 'rgba(255,255,255,0.04)';
      btn.style.color = '#9ca3af';
    }
  });
};

// FECHA O SETOR INTEIRO DE UMA VEZ: 1 POST POR SENSO OBRIGATÓRIO (3 no total). Se algum já tinha
// sido votado por este usuário hoje (ex: via modal de moderação), o 409 daquele é só ignorado — os
// outros continuam sendo gravados normalmente.
window.submitLevel1DirectVote = async function() {
  if (!currentUser) return;

  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const todayIdxRaw = new Date().getDay();
  const currentDayCode = dayNames[todayIdxRaw] === 'DOM' ? 'SEG' : dayNames[todayIdxRaw];

  const assignment = getRotationAssignment(currentUser, currentDayCode);
  const sectorName = assignment.targetSector;

  const commentInput = document.getElementById('lvl1-comment-input');
  const commentText = commentInput ? commentInput.value.trim() : '';
  const scorePts = { bom: 3, regular: 2, ruim: 1 };
  const labelMap = { bom: '🟢 BOM', regular: '🟡 REGULAR', ruim: '🔴 RUIM' };

  const results = [];
  for (const s of REQUIRED_SENSOS) {
    const scoreChoice = level1SelectedScores[s.key] || 'bom';
    const boardKey = `${sectorName}_${s.key}_${currentDayCode}`;
    try {
      await apiFetch('/factory-board', {
        method: 'POST',
        body: { boardKey, sector: sectorName, senso: s.key, dayCode: currentDayCode, score: scoreChoice, points: scorePts[scoreChoice], comment: commentText }
      });
      results.push(`${s.name.split('. ')[1] || s.name}: ${labelMap[scoreChoice]}`);
    } catch (err) {
      if (err.status !== 409) {
        alert(`Não foi possível registrar ${s.name}: ${err.message}`);
        return;
      }
      // 409 = este usuário já tinha votado esse senso hoje (ex: pelo modal de moderação) — segue o jogo.
    }
  }

  const auditorName = currentUser.name;
  const originSector = currentUser.sector || 'Fábrica';
  const commentSuffix = commentText ? ` 💬 "${commentText}"` : '';
  await logActivity(`Fechou o Setor ${sectorName} (${results.join(' • ')}) no rodízio (por ${auditorName} - Origem: ${originSector})${commentSuffix}`);

  await refreshAllFromServer();
  level1SelectedScores = { seiri: 'bom', seiton: 'bom', seiso: 'bom' };
  renderLevel1DirectVotingScreen();
};

// ABRE A CAIXA DE VOTO DE QUALQUER CÉLULA DO QUADRO — PARA NÍVEL 1 REDIRECIONA PRO CARTÃO ÚNICO
// (ele só vota na célula do rodízio dele); NÍVEL 2/3 PODEM VOTAR EM QUALQUER CÉLULA PENDENTE PRA
// FECHAR BURACOS, E NÍVEL 2 (AUDITOR_SEMANAL) / NÍVEL 3 PODEM REMOVER UM VOTO QUE JULGAREM INCORRETO.
window.openVoteChoiceModal = function(sectorName, boardKey, sensoName, day) {
  const isLevel1 = (currentUser && (currentUser.level === 'diario' || currentUser.level === 'colaborador' || currentUser.role === 'colaborador' || currentUser.role === 'lider_diario'));
  if (isLevel1) {
    renderLevel1DirectVotingScreen();
    return;
  }
  if (!currentUser) return;

  const canModerate = (['administrador', 'auditor_semanal'].includes(currentUser.role) || ['senior', 'semanal'].includes(currentUser.level));
  currentVoteTarget = { sectorName, boardKey, sensoName, day };
  modalSelectedScore = 'bom';

  const summary = getBoardCellSummary(boardKey);
  const scoreLabel = { bom: '🟢 Bom', regular: '🟡 Regular', ruim: '🔴 Ruim' };

  const votesHtml = summary.votes.length === 0
    ? `<p style="font-size:0.85rem; color:var(--text-dim); margin:0.5rem 0;">Nenhum voto registrado ainda nesta célula hoje.</p>`
    : summary.votes.map(v => `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; padding:0.4rem 0; border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.8rem;">
          <span>👤 <strong>${v.name}</strong>: ${scoreLabel[v.score] || v.score}${v.comment ? ` — <em>"${v.comment}"</em>` : ''}</span>
          ${canModerate ? `<button type="button" class="btn btn-danger" style="padding:0.15rem 0.5rem; font-size:0.7rem; flex-shrink:0;" onclick="removeVoteFromModal(${v.id})">🗑️ Remover</button>` : ''}
        </div>
      `).join('');

  const modalHtml = `
    <div id="modal-vote-choice" class="login-overlay" style="display:flex; z-index:10001;">
      <div class="login-card" style="max-width:480px;">
        <div class="login-header">
          <h2>📋 ${sensoName}</h2>
          <p>Setor: <strong>${sectorName}</strong> • Dia: <strong>${day}</strong></p>
        </div>
        <div style="max-height:220px; overflow-y:auto; margin-bottom:1rem; text-align:left;">${votesHtml}</div>
        <div class="form-group" style="text-align:left;">
          <label>Registrar minha avaliação nesta célula</label>
          <div style="display:flex; gap:0.5rem; margin-top:0.4rem;" id="modal-vote-options">
            <button type="button" class="btn btn-secondary" data-opt="bom" onclick="selectVoteOptionInModal('bom')" style="flex:1;">🟢 Bom</button>
            <button type="button" class="btn btn-secondary" data-opt="regular" onclick="selectVoteOptionInModal('regular')" style="flex:1;">🟡 Regular</button>
            <button type="button" class="btn btn-secondary" data-opt="ruim" onclick="selectVoteOptionInModal('ruim')" style="flex:1;">🔴 Ruim</button>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem; margin-top:1rem;">
          <button type="button" class="btn btn-secondary" onclick="closeVoteChoiceModal()" style="flex:1;">Fechar</button>
          <button type="button" class="btn btn-primary" onclick="confirmVoteChoiceModal()" style="flex:1;">✅ Confirmar Voto</button>
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById('modal-vote-choice');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  selectVoteOptionInModal('bom');
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

window.selectVoteOptionInModal = function(opt) {
  modalSelectedScore = opt;
  document.querySelectorAll('#modal-vote-options button').forEach(btn => {
    if (btn.getAttribute('data-opt') === opt) {
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
    } else {
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
    }
  });
};

window.confirmVoteChoiceModal = async function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  if (!currentVoteTarget) return;

  const { sectorName, boardKey, sensoName, day } = currentVoteTarget;
  const sensoKey = boardKey.split('_')[boardKey.split('_').length - 2];
  const scorePts = { bom: 3, regular: 2, ruim: 1 };

  try {
    await apiFetch('/factory-board', {
      method: 'POST',
      body: { boardKey, sector: sectorName, senso: sensoKey, dayCode: day, score: modalSelectedScore, points: scorePts[modalSelectedScore] }
    });
  } catch (err) {
    if (err.status === 409) {
      alert('Você já avaliou esta célula hoje.');
      return;
    }
    alert('Não foi possível registrar o voto: ' + err.message);
    return;
  }

  const labelMap = { bom: '🟢 BOM', regular: '🟡 REGULAR', ruim: '🔴 RUIM' };
  await logActivity(`Avaliou (via quadro) ${sensoName} no Setor ${sectorName} como ${labelMap[modalSelectedScore]}`);
  await refreshAllFromServer();
  closeVoteChoiceModal();
};

// PODER DE MODERAÇÃO: NÍVEL 2 (AUDITOR VOLANTE/ENCARREGADO) E NÍVEL 3 PODEM REMOVER UM VOTO
// QUE JULGUEM TENDENCIOSO OU INCORRETO — o backend confere de novo o papel antes de aceitar.
window.removeVoteFromModal = async function(voteId) {
  if (!confirm('Remover este voto? Essa ação não pode ser desfeita.')) return;
  try {
    await apiFetch('/factory-board', { method: 'DELETE', body: { voteId } });
  } catch (err) {
    alert('Não foi possível remover o voto: ' + err.message);
    return;
  }
  await logActivity('Removeu um voto do quadro da fábrica (moderação Nível 2/3)');
  await refreshAllFromServer();
  if (currentVoteTarget) {
    openVoteChoiceModal(currentVoteTarget.sectorName, currentVoteTarget.boardKey, currentVoteTarget.sensoName, currentVoteTarget.day);
  }
};
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

  try {
    // Cria a conta (sempre nasce "colaborador" no servidor) e, em seguida, ajusta o nível/papel
    // escolhido no painel ADM — sem tocar no token de sessão do administrador que está cadastrando.
    await apiFetch('/auth-register', { method: 'POST', body: { name, username, password, sector } });
    await apiFetch('/users', {
      method: 'PATCH',
      body: { username, level, role: roleMap[level] || 'colaborador', sector, title: titleMap[level] }
    });
  } catch (err) {
    alert('Não foi possível cadastrar o colaborador: ' + err.message);
    return;
  }

  await logActivity(`✨ Cadastrou o colaborador "${name}" (${titleMap[level]}) direto pelo Painel ADM`);
  await refreshAllFromServer();

  if (nameInput) nameInput.value = '';
  if (userInput) userInput.value = '';
  if (passInput) passInput.value = '5s2026';

  alert(`🎉 Colaborador "${name}" cadastrado com sucesso e sincronizado em nuvem!`);
};

// FUNÇÃO GLOBAL DE LOGIN DIRETO IMPAK TTO — AGORA CONTRA O SERVIDOR, SEM SENHAS UNIVERSAIS DE ATALHO
window.handleLogin = async function(e) {
  if (e) e.preventDefault();

  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  const loginErr = document.getElementById('login-error');

  const u = uInput && uInput.value.trim() ? uInput.value.trim().toLowerCase() : '';
  const p = pInput && pInput.value.trim() ? pInput.value.trim() : '';

  if (!u || !p) {
    if (loginErr) {
      loginErr.style.display = 'block';
      loginErr.innerText = '⚠️ Informe usuário e senha.';
    }
    return false;
  }

  try {
    await performLogin(u, p);
    if (loginErr) loginErr.style.display = 'none';
    return true;
  } catch (err) {
    if (loginErr) {
      loginErr.style.display = 'block';
      loginErr.innerText = `⚠️ ${err.message}`;
    }
    return false;
  }
};

// AUTO-CADASTRO DE NOVOS INTEGRANTES — CADASTRA E JÁ AUTENTICA DE VERDADE CONTRA O SERVIDOR
async function handleSelfRegister(e) {
  if (e) e.preventDefault();

  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value.trim();
  const userSector = document.getElementById('reg-sector')?.value || 'Usinagem';

  if (!name || !username || !password) return;

  try {
    const { token, user } = await apiFetch('/auth-register', { method: 'POST', body: { name, username, password, sector: userSector } });
    authToken = token;
    currentUser = user;
    localStorage.setItem('5s_impaktto_token', authToken);
    localStorage.setItem('5s_impaktto_session', JSON.stringify(currentUser));
  } catch (err) {
    alert('Não foi possível concluir o cadastro: ' + err.message);
    return;
  }

  const loginOverlay = document.getElementById('login-overlay');
  if (loginOverlay) {
    loginOverlay.style.display = 'none';
    loginOverlay.classList.add('hidden');
  }

  await logActivity(`✨ Novo colaborador registrado (${name} - Setor: ${userSector} - Participação Aberta no 5S)`);

  try {
    await checkAuthSession();
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

window.handleChangePassword = async function(e) {
  if (e) e.preventDefault();

  const currentPassInput = document.getElementById('change-pass-current').value.trim();
  const newPassInput = document.getElementById('change-pass-new').value.trim();
  const confirmPassInput = document.getElementById('change-pass-confirm').value.trim();
  const errEl = document.getElementById('change-pass-error');

  if (!currentUser) return;

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

  try {
    await apiFetch('/auth-change-password', { method: 'POST', body: { currentPassword: currentPassInput, newPassword: newPassInput } });
  } catch (err) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.innerText = `⚠️ ${err.message}`;
    }
    return;
  }

  await logActivity(`🔑 O colaborador ${currentUser.name} alterou sua senha pessoal com sucesso`);
  closeChangePasswordModal();

  alert('🎉 Sua nova senha pessoal foi cadastrada com sucesso! Da próxima vez, utilize a sua nova senha.');
  checkAuthSession();
};

window.clearSystemSession = function() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  document.body.classList.remove('monitor-mode');
  localStorage.clear();
  authToken = null;
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

  // O servidor nunca devolve a senha (nem em hash) para o navegador, então não há mais como saber
  // por aqui se o usuário ainda está com a senha padrão — o aviso foi removido junto com essa checagem.
  const secAlert = document.getElementById('security-password-alert');
  if (secAlert) secAlert.style.display = 'none';

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
    }, 5000);
  }

  const monitorTvDashboard = document.getElementById('monitor-tv-dashboard');
  const mainContainer = document.querySelector('main.main-container');

  if (isMonitor) {
    // MODO MONITOR TV (GESTAO VISUAL 16:9 EM TEMPO REAL) — painel dedicado, não os cards padrão.
    document.body.classList.add('monitor-mode');
    activeFactorySectorFilter = 'ALL';

    if (mainContainer) mainContainer.style.display = 'none';
    if (monitorTvDashboard) monitorTvDashboard.style.display = 'flex';

    if (navTabsContainer) navTabsContainer.style.display = 'none';
    if (navBtnTools) navBtnTools.style.display = 'none';
    if (navBtnManual) navBtnManual.style.display = 'none';

    renderMonitorTvDashboard();

  } else {
    document.body.classList.remove('monitor-mode');
    if (mainContainer) mainContainer.style.display = 'block';
    if (monitorTvDashboard) monitorTvDashboard.style.display = 'none';

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
  authToken = null;
  localStorage.removeItem('5s_impaktto_session');
  localStorage.removeItem('5s_impaktto_token');
  location.reload();
};

// 7. RENDERIZAÇÃO DO PAINEL DE GESTÃO DE COLABORADORES E PODER DE EXCLUSÃO 1-CLICK NIVEL 3
function renderUserManagementTable() {
  const container = document.getElementById('user-management-table-container');
  if (!container) return;

  const usersList = Object.values(userDatabase);
  const todayDateStr = new Date().toISOString().split('T')[0];
  const dayNamesAdm = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const currentDayCodeAdm = dayNamesAdm[new Date().getDay()] === 'DOM' ? 'SEG' : dayNamesAdm[new Date().getDay()];

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
    const uAssignment = getRotationAssignment(u);
    const votedToday = REQUIRED_SENSOS.every(s => {
      const uBoardKey = `${uAssignment.targetSector}_${s.key}_${currentDayCodeAdm}`;
      return getBoardCellSummary(uBoardKey).votes.some(v => v.username === u.username);
    });

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
          🎯 ${uAssignment.targetSector}
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

window.resetUserDailyVote = async function(username) {
  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const currentDayCode = dayNames[new Date().getDay()] === 'DOM' ? 'SEG' : dayNames[new Date().getDay()];

  const uObj = userDatabase[username];
  const uName = uObj ? uObj.name : username;

  try {
    await apiFetch('/factory-board', { method: 'DELETE', body: { voterUsername: username, dayCode: currentDayCode } });
    alert(`🎉 O voto diário de "${uName}" foi LIBERADO com sucesso! Ele(a) já pode realizar um novo voto de teste agora.`);
  } catch (err) {
    alert('Não foi possível liberar o voto: ' + err.message);
  }
  await refreshAllFromServer();
};

window.updateUserLevel = async function(username, newLevel) {
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

  const levelText = {
    colaborador: 'Grupo 1 (Colaborador de Setor)',
    diario: 'Grupo 1 (Líder Diário de Setor)',
    semanal: 'Grupo 2 (Auditor Volante/Encarregado)',
    senior: 'Grupo 3 (Gerência & Diretoria)'
  };

  const userName = userDatabase[username].name;
  try {
    await apiFetch('/users', {
      method: 'PATCH',
      body: { username, level: newLevel, role: roleMap[newLevel] || 'colaborador', title: titleMap[newLevel] }
    });
  } catch (err) {
    alert('Não foi possível atualizar a classificação: ' + err.message);
    return;
  }

  await logActivity(`👤 Alterou classificação do integrante "${userName}" para ${levelText[newLevel]}`);
  await refreshAllFromServer();
  alert(`Classificação de "${userName}" atualizada para ${levelText[newLevel]}!`);
};

window.updateUserSector = async function(username, newSector) {
  if (!userDatabase[username]) return;

  const assignment = getRotationAssignment({ ...userDatabase[username], sector: newSector });
  let title;
  if (userDatabase[username].level === 'colaborador') {
    title = `Grupo 1: Colaborador (${newSector} ➔ ${assignment.targetSector})`;
  } else if (userDatabase[username].level === 'diario') {
    title = `Grupo 1: Líder de ${newSector} ➔ ${assignment.targetSector}`;
  }

  const userName = userDatabase[username].name;
  try {
    await apiFetch('/users', { method: 'PATCH', body: { username, sector: newSector, title } });
  } catch (err) {
    alert('Não foi possível atualizar o setor: ' + err.message);
    return;
  }

  await logActivity(`📍 Alterou setor do integrante "${userName}" para ${newSector}`);
  await refreshAllFromServer();
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
    try {
      await apiFetch('/users', { method: 'DELETE', body: { username } });
    } catch (err) {
      alert('Não foi possível excluir o usuário: ' + err.message);
      return;
    }

    await logActivity(`🗑️ Excluiu o acesso do colaborador "${targetName}" (${username})`);
    await refreshAllFromServer();
    checkAuthSession();

    alert(`🎉 O integrante "${targetName}" foi excluído com sucesso!`);
  }
};

// GRAVA UM EVENTO NO FEED DE ATIVIDADE — AGORA UMA LINHA REAL NO BANCO, NÃO MAIS UM ARRAY NO LOCALSTORAGE
async function logActivity(actionText) {
  const userLabel = currentUser ? currentUser.name : 'Usuário';
  try {
    await apiFetch('/activity-log', { method: 'POST', body: { userName: userLabel, action: actionText } });
  } catch (err) {
    console.error('Erro ao registrar atividade:', err);
  }
}

function renderActivityLogs() {
  const container = document.getElementById('activity-log-container');
  if (!container) return;

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

window.selectScore3Level = async function(sensoName, qNum, qKey, level) {
  clientAuditScores[qKey] = level; // atualização otimista — o servidor confirma logo em seguida

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

  const scorePts = { bom: 3, regular: 2, ruim: 1 };
  const senso = qKey.split('_')[0];
  try {
    await apiFetch('/audit-responses', { method: 'POST', body: { questionKey: qKey, senso, score: level, points: scorePts[level] } });
  } catch (err) {
    console.error('Erro ao salvar resposta da auditoria:', err);
  }

  const labelMap = { bom: '🟢 BOM', regular: '🟡 REGULAR', ruim: '🔴 RUIM' };
  await logActivity(`Avaliou o item ${sensoName.toUpperCase()} #${qNum} como ${labelMap[level]}`);
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

  // CÁLCULO DE KPIS EXECUTIVOS PARA CABEÇALHO DA AUDITORIA DA DIRETORIA — baseado nas 15 células
  // obrigatórias (5 setores x 3 sensos), não mais em "setor teve qualquer voto".
  const coverage = getDailyCoverage(currentDayCode);
  const coveragePct = Math.round((coverage.closedCells / coverage.totalCells) * 100);

  let overallPointsSum = 0;
  let overallPointsCount = 0;
  IMPAKTTO_SECTORS.forEach(sec => {
    REQUIRED_SENSOS.forEach(s => {
      const summary = getBoardCellSummary(`${sec}_${s.key}_${currentDayCode}`);
      if (summary.voteCount > 0) {
        overallPointsSum += summary.avgPoints;
        overallPointsCount++;
      }
    });
  });
  const overallScoreAvg = overallPointsCount > 0 ? Math.round((overallPointsSum / overallPointsCount) * 10) / 10 : 3.0;

  let html = `
    <!-- HEADER EXECUTIVO DE KPIS PARA A DIRETORIA & AUDITORIA SENAI -->
    <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9)); border: 1px solid var(--border-highlight); border-radius: 12px; padding: 0.85rem 1.1rem; margin-bottom: 1.1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);">
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <div style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; padding: 0.55rem 0.75rem; border-radius: 10px; text-align: center;">
          <span style="font-size: 0.7rem; font-weight: 800; color: #34d399; text-transform: uppercase; display: block;">DIA FECHADO</span>
          <span style="font-size: 1.25rem; font-weight: 800; color: #ffffff;">${coverage.closedCells}/${coverage.totalCells}</span>
        </div>
        <div>
          <span style="font-size: 0.88rem; font-weight: 800; color: #ffffff; display: block;">
            📊 Auditoria Diária 5S • IMPAK TTO Plásticos de Engenharia
          </span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            ${coverage.closedSectors} de ${coverage.totalSectors} Setores 100% Fechados Hoje (${currentDayCode}) • Cobertura: <strong>${coveragePct}%</strong>
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
    ${coverage.pendingCells.length > 0 ? `
    <div style="font-size:0.78rem; color:#fde047; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:0.5rem 0.85rem; margin-bottom:0.9rem;">
      ⏳ Pendente hoje: ${coverage.pendingCells.map(p => `${p.sector} (${p.senso.name.split('. ')[1] || p.senso.name})`).join(' • ')}
    </div>` : ''}
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
            const isComputed = COMPUTED_SENSOS.some(cs => cs.key === s.key);

            if (summary.voteCount === 0) {
              return `
                <td style="vertical-align:middle; padding:0.3rem 0.35rem;">
                  <button class="score-btn-factory" style="display:flex; align-items:center; justify-content:center; width:100%; box-sizing:border-box; padding:0.35rem 0.4rem; font-size:0.72rem; font-weight:600; cursor:${isComputed ? 'default' : 'pointer'}; background:rgba(255,255,255,0.05); color:#9ca3af; border:1px dashed rgba(255,255,255,0.2); border-radius:6px;" ${isComputed ? '' : `onclick="openVoteChoiceModal('${sec}', '${boardKey}', '${s.name}', '${currentDayCode}')"`} title="${isComputed ? 'Média dos 3 sensos obrigatórios — ainda sem base' : 'Pendente de avaliação no rodízio de hoje'}">
                    ${isComputed ? '🧮 Aguarda base' : '⚪ Pendente'}
                  </button>
                </td>
              `;
            }

            const iconMap = { bom: '🟢 Bom', regular: '🟡 Regular', ruim: '🔴 Ruim' };
            const countBadge = isComputed
              ? `<span style="background:rgba(0,0,0,0.4); padding:0.1rem 0.35rem; border-radius:10px; font-size:0.65rem; margin-left:0.25rem;">🧮</span>`
              : `<span style="background:rgba(0,0,0,0.4); padding:0.1rem 0.35rem; border-radius:10px; font-size:0.65rem; margin-left:0.25rem;">📊 ${summary.avgPoints} (${summary.voteCount}v)</span>`;

            return `
              <td style="vertical-align:middle; padding:0.3rem 0.2rem;">
                <button class="score-btn-factory selected" data-level="${summary.status}" style="display:flex; align-items:center; justify-content:center; width:100%; box-sizing:border-box; padding:0.35rem 0.4rem; font-size:0.75rem; font-weight:700; cursor:${isComputed ? 'default' : 'pointer'}; border:none;" ${isComputed ? '' : `onclick="openVoteChoiceModal('${sec}', '${boardKey}', '${s.name}', '${currentDayCode}')"`} title="${isComputed ? `Média automática dos 3 sensos obrigatórios: ${summary.avgPoints}` : `${summary.voteCount} voto(s) registrado(s). Média: ${summary.avgPoints}`}">
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
              <td style="vertical-align:middle; padding:0.4rem 0.35rem;">
                <span class="score-btn-factory" style="display:flex; align-items:center; justify-content:center; width:100%; box-sizing:border-box; padding:0.35rem 0.3rem; font-size:0.72rem; font-weight:600; background:rgba(255,255,255,0.05); color:#9ca3af; border:1px dashed rgba(255,255,255,0.2);">
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
            <td style="vertical-align:middle; padding:0.4rem 0.35rem;">
              <span class="score-btn-factory selected" data-level="${currentStatus}" style="display:flex; align-items:center; justify-content:center; width:100%; box-sizing:border-box; padding:0.35rem 0.3rem; font-size:0.75rem; font-weight:800; box-shadow: 0 0 10px rgba(0,0,0,0.4);">
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
      const isComputed = COMPUTED_SENSOS.some(cs => cs.key === s.key);
      const isTargetSenso = !isComputed && (selectedSector === assignment.targetSector);

      html += `
        <tr style="${isTargetSenso ? 'background: rgba(16,185,129,0.08);' : ''}">
          <td style="text-align:left; vertical-align:middle; padding: 0.85rem;">
            <span class="senso-badge-title badge-${s.key}" style="margin:0 0 0.25rem 0;">${s.name}</span>
            <div style="font-size:0.75rem; color:#9ca3af; line-height:1.25; font-weight: 500;">
              💡 ${s.desc}${isComputed ? ' <strong style="color:#7dd3fc;">(média dos 3 primeiros)</strong>' : ''}
            </div>
          </td>
          ${days.map(day => {
            const dayIdx = daysOrder.indexOf(day);
            const isFuture = (dayIdx > todayIndexInWeek);

            if (isFuture) {
              return `
                <td style="vertical-align:middle; padding:0.3rem 0.35rem; opacity:0.35;">
                  <button class="btn btn-secondary" style="width:100%; box-sizing:border-box; padding:0.3rem 0.5rem; font-size:0.75rem; cursor:not-allowed;" disabled>
                    ⚪ Aguardando
                  </button>
                </td>
              `;
            } else {
              const boardKey = `${selectedSector}_${s.key}_${day}`;
              const summary = getBoardCellSummary(boardKey);
              const clickAttr = isComputed ? '' : `onclick="openVoteChoiceModal('${selectedSector}', '${boardKey}', '${s.name}', '${day}')"`;

              if (summary.voteCount === 0) {
                return `
                  <td style="vertical-align:middle; padding:0.3rem 0.35rem; ${day === currentDayCode ? 'background:rgba(99,102,241,0.1);' : ''}">
                    <button class="btn btn-secondary" style="padding:0.35rem 0.4rem; font-size:0.8rem; font-weight:600; cursor:${isComputed ? 'default' : 'pointer'}; min-height:38px; width:100%; box-sizing:border-box; border-radius:8px; opacity:0.7;" ${clickAttr} title="${isComputed ? 'Média dos 3 sensos obrigatórios — ainda sem base' : 'Pendente de avaliação no rodízio de hoje'}">
                      ${isComputed ? '🧮 Aguarda base' : '⚪ Pendente'}
                    </button>
                  </td>
                `;
              }

              const iconMap = { bom: '🟢 Bom', regular: '🟡 Regular', ruim: '🔴 Ruim' };
              const countBadge = isComputed
                ? `<span style="background:rgba(0,0,0,0.4); padding:0.1rem 0.35rem; border-radius:10px; font-size:0.65rem; margin-left:0.25rem;">🧮</span>`
                : `<span style="background:rgba(0,0,0,0.4); padding:0.1rem 0.35rem; border-radius:10px; font-size:0.65rem; margin-left:0.25rem;">📊 ${summary.avgPoints} (${summary.voteCount}v)</span>`;

              return `
                <td style="vertical-align:middle; padding:0.3rem 0.35rem; ${day === currentDayCode ? 'background:rgba(99,102,241,0.1);' : ''}">
                  <button class="btn btn-secondary" style="padding:0.35rem 0.4rem; font-size:0.82rem; font-weight:800; cursor:${isComputed ? 'default' : 'pointer'}; min-height:38px; width:100%; box-sizing:border-box; border-radius:8px;" ${clickAttr} title="${isComputed ? `Média automática dos 3 sensos obrigatórios: ${summary.avgPoints}` : `Clique para abrir caixa de escolha de voto. Média: ${summary.avgPoints} (${summary.voteCount} votos)`}">
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

// EXPORTAÇÃO DO RELATÓRIO EXECUTIVO — antes era só window.print() puro, sem nenhum CSS de impressão,
// então o navegador tentava imprimir o tema escuro inteiro (texto claro em fundo escuro não sai no
// papel) e parecia "não fazer nada". Agora monta um relatório limpo, em fundo claro, e imprime só ele.
window.printExecutiveReport = function() {
  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const currentDayCode = dayNames[new Date().getDay()] === 'DOM' ? 'SEG' : dayNames[new Date().getDay()];
  const coverage = getDailyCoverage(currentDayCode);

  const globalScoreEl = document.getElementById('global-maturity-score');
  const globalStatusEl = document.getElementById('global-maturity-status');
  const globalScore = globalScoreEl ? globalScoreEl.innerText : '--';
  const globalStatus = globalStatusEl ? globalStatusEl.innerText : '';

  const sensoRows = SENSOS_LIST.map(s => {
    const el = document.getElementById(`score-${s.key}`);
    return `<tr><td style="padding:6px 4px; border-bottom:1px solid #ddd;">${s.name}</td><td style="padding:6px 4px; border-bottom:1px solid #ddd; text-align:right; font-weight:700;">${el ? el.innerText : '--'}</td></tr>`;
  }).join('');

  const statusLabel = { bom: 'Bom', regular: 'Regular', ruim: 'Ruim', pendente: 'Pendente' };
  const sectorRows = IMPAKTTO_SECTORS.map(sec => {
    let sum = 0, votedCount = 0;
    REQUIRED_SENSOS.forEach(s => {
      const summary = getBoardCellSummary(`${sec}_${s.key}_${currentDayCode}`);
      if (summary.voteCount > 0) { sum += summary.avgPoints; votedCount++; }
    });
    const status = votedCount === 0 ? 'pendente' : (sum / votedCount >= 2.5 ? 'bom' : (sum / votedCount >= 1.7 ? 'regular' : 'ruim'));
    return `<tr><td style="padding:6px 4px; border-bottom:1px solid #ddd;">${sec}</td><td style="padding:6px 4px; border-bottom:1px solid #ddd; text-align:right;">${votedCount}/3</td><td style="padding:6px 4px; border-bottom:1px solid #ddd; text-align:right; font-weight:700;">${statusLabel[status]}</td></tr>`;
  }).join('');

  const reportHtml = `
    <div id="print-report-root">
      <div style="display:flex; align-items:center; gap:14px; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:18px;">
        <img src="logo_impaktto.png" style="height:48px;">
        <div>
          <div style="font-size:19px; font-weight:800;">Relatório Executivo 5S — IMPAK TTO Plásticos de Engenharia</div>
          <div style="font-size:12px; color:#444;">Gerado em ${new Date().toLocaleString('pt-BR')} • Dia do rodízio: ${currentDayCode}</div>
        </div>
      </div>

      <h3 style="font-size:14px; text-transform:uppercase; letter-spacing:0.05em; color:#444; margin-bottom:4px;">Maturidade Global</h3>
      <p style="font-size:30px; font-weight:800; margin:2px 0 18px;">${globalScore} <span style="font-size:14px; font-weight:400; color:#444;">— ${globalStatus}</span></p>

      <h3 style="font-size:14px; text-transform:uppercase; letter-spacing:0.05em; color:#444; margin-bottom:4px;">Por Senso</h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom:18px;">${sensoRows}</table>

      <h3 style="font-size:14px; text-transform:uppercase; letter-spacing:0.05em; color:#444; margin-bottom:4px;">Cobertura do Rodízio (${currentDayCode})</h3>
      <p style="margin-bottom:8px;">${coverage.closedCells}/${coverage.totalCells} células fechadas • ${coverage.closedSectors}/${coverage.totalSectors} setores 100% fechados</p>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr><th style="text-align:left; padding:6px 4px; border-bottom:2px solid #111;">Setor</th><th style="text-align:right; padding:6px 4px; border-bottom:2px solid #111;">Sensos votados</th><th style="text-align:right; padding:6px 4px; border-bottom:2px solid #111;">Status</th></tr></thead>
        <tbody>${sectorRows}</tbody>
      </table>
    </div>
  `;

  const existing = document.getElementById('print-report-root');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', reportHtml);
  window.print();
};

window.addEventListener('afterprint', () => {
  const el = document.getElementById('print-report-root');
  if (el) el.remove();
});

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
  radarChartInstance = renderRadarChartInto('radarChart5S', radarChartInstance, scoresData);

  // Só instancia o gráfico do monitor quando o painel de TV está realmente visível — evita criar
  // um Chart.js num canvas escondido (display:none) pra todo mundo que não é o usuário monitor.
  const monitorRoot = document.getElementById('monitor-tv-dashboard');
  if (monitorRoot && monitorRoot.style.display !== 'none') {
    radarChartInstanceMonitor = renderRadarChartInto('radarChart5S-monitor', radarChartInstanceMonitor, scoresData);
  }
}

function renderRadarChartInto(canvasId, existingInstance, scoresData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return existingInstance;

  const labels = ['1. Utilização (Seiri)', '2. Organização (Seiton)', '3. Limpeza (Seiso)', '4. Padronização (Seiketsu)', '5. Disciplina (Shitsuke)'];

  if (existingInstance) {
    existingInstance.data.datasets[0].data = scoresData;
    existingInstance.update();
    return existingInstance;
  }

  return new Chart(canvas, {
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

// PAINEL DEDICADO DE TV/MONITOR — curadoria do essencial (score global, radar, cobertura do
// rodízio, status por setor, feed) num layout 16:9 fixo, sem rolagem.
function renderMonitorTvDashboard() {
  const root = document.getElementById('monitor-tv-dashboard');
  if (!root || root.style.display === 'none') return;

  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const dayFullNames = { SEG: 'Segunda-feira', TER: 'Terça-feira', QUA: 'Quarta-feira', QUI: 'Quinta-feira', SEX: 'Sexta-feira', SAB: 'Sábado' };
  const now = new Date();
  const currentDayCode = dayNames[now.getDay()] === 'DOM' ? 'SEG' : dayNames[now.getDay()];

  const dateEl = document.getElementById('monitor-tv-date');
  if (dateEl) dateEl.innerText = `${dayFullNames[currentDayCode] || currentDayCode} • ${now.toLocaleDateString('pt-BR')} • ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const globalScoreSrc = document.getElementById('global-maturity-score');
  const scoreEl = document.getElementById('monitor-tv-global-score');
  if (scoreEl) scoreEl.innerText = globalScoreSrc ? globalScoreSrc.innerText : '--%';

  const coverage = getDailyCoverage(currentDayCode);
  const coveragePct = Math.round((coverage.closedCells / coverage.totalCells) * 100);
  const fillEl = document.getElementById('monitor-tv-coverage-fill');
  if (fillEl) fillEl.style.width = `${coveragePct}%`;
  const coverageLabelEl = document.getElementById('monitor-tv-coverage-label');
  if (coverageLabelEl) coverageLabelEl.innerText = `${coverage.closedCells} / ${coverage.totalCells} células fechadas • ${coverage.closedSectors} / ${coverage.totalSectors} setores 100% completos`;

  // MATRIZ 5S x DEPARTAMENTO — mesmo padrão de informação do Quadro Geral Consolidado do admin
  // (status + nota + nº de votos, ou "calculado" pros 2 últimos sensos), sem nomes de quem votou.
  const statusLabel = { bom: '🟢 Bom', regular: '🟡 Regular', ruim: '🔴 Ruim', pendente: '⚪ Pendente' };
  const matrixEl = document.getElementById('monitor-tv-matrix');
  if (matrixEl) {
    const headRow = `
      <div class="monitor-tv-matrix-row head">
        <div></div>
        ${SENSOS_LIST.map(s => `<div class="monitor-tv-matrix-head-cell">${s.name.split('. ')[1] || s.name}</div>`).join('')}
      </div>
    `;
    const bodyRows = IMPAKTTO_SECTORS.map(sec => `
      <div class="monitor-tv-matrix-row">
        <div class="monitor-tv-matrix-dept">📍 ${sec}</div>
        ${SENSOS_LIST.map(s => {
          const isComputed = COMPUTED_SENSOS.some(cs => cs.key === s.key);
          const summary = getBoardCellSummary(`${sec}_${s.key}_${currentDayCode}`);
          const status = summary.voteCount > 0 ? summary.status : 'pendente';
          const detail = summary.voteCount === 0
            ? (isComputed ? 'aguarda base' : 'sem voto')
            : (isComputed ? `🧮 ${summary.avgPoints}` : `${summary.avgPoints} (${summary.voteCount}v)`);
          return `
            <div class="monitor-tv-matrix-cell" data-status="${status}">
              <span class="monitor-tv-matrix-cell-status">${statusLabel[status]}</span>
              <span class="monitor-tv-matrix-cell-detail">${detail}</span>
            </div>
          `;
        }).join('')}
      </div>
    `).join('');
    matrixEl.innerHTML = headRow + bodyRows;
  }
}

window.resetAudit = async function() {
  if (confirm('Deseja redefinir a auditoria da IMPAK TTO?')) {
    try {
      await apiFetch('/audit-responses', { method: 'DELETE' });
    } catch (err) {
      alert('Não foi possível redefinir a auditoria: ' + err.message);
      return;
    }
    clientAuditScores = {};
    await logActivity('Redefiniu todas as respostas da auditoria');
    renderAuditForms();
    calculateAuditResults();
  }
};

// MATRIZ GUT — agora compartilhada entre todos os dispositivos (antes era só local ao aparelho)
async function handleAddGUT(e) {
  if (e) e.preventDefault();
  const problem = document.getElementById('gut-problem').value;
  const g = parseInt(document.getElementById('gut-g').value);
  const u = parseInt(document.getElementById('gut-u').value);
  const t = parseInt(document.getElementById('gut-t').value);

  if (!problem) return;

  try {
    await apiFetch('/gut-matrix', { method: 'POST', body: { problem, g, u, t } });
  } catch (err) {
    alert('Não foi possível salvar o problema: ' + err.message);
    return;
  }

  await logActivity(`Adicionou o problema "${problem}" na Matriz GUT (Pontuação: ${g * u * t})`);
  document.getElementById('gut-problem').value = '';
  await refreshAllFromServer();
}

function renderGUTTable() {
  const tbody = document.getElementById('gut-table-body');
  if (!tbody) return;

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

window.removeGUT = async function(id) {
  const item = clientGutMatrix.find(i => i.id === id);
  try {
    await apiFetch('/gut-matrix', { method: 'DELETE', body: { id } });
  } catch (err) {
    alert('Não foi possível excluir: ' + err.message);
    return;
  }
  if (item) await logActivity(`Removeu o problema "${item.problem}" da Matriz GUT`);
  await refreshAllFromServer();
};

// KANBAN 5W2H — agora compartilhado entre todos os dispositivos (a chave localStorage errada em
// moveKanban que fazia o card "voltar" sozinho depois de recarregar deixa de existir)
async function handleAddKanban(e) {
  if (e) e.preventDefault();
  const title = document.getElementById('kanban-title').value;
  const senso = document.getElementById('kanban-senso').value;
  const owner = document.getElementById('kanban-owner').value;
  const dueDate = document.getElementById('kanban-date').value;

  if (!title) return;

  try {
    await apiFetch('/kanban-tasks', { method: 'POST', body: { title, senso, owner: owner || 'Não atribuído', dueDate: dueDate || 'A definir' } });
  } catch (err) {
    alert('Não foi possível criar a tarefa: ' + err.message);
    return;
  }

  await logActivity(`Criou a tarefa no Kanban: "${title}" (Resp: ${owner || 'Não atribuído'})`);
  document.getElementById('kanban-title').value = '';
  await refreshAllFromServer();
}

function renderKanban() {
  const cols = {
    'a-fazer': document.getElementById('kanban-col-todo'),
    'em-andamento': document.getElementById('kanban-col-doing'),
    'concluido': document.getElementById('kanban-col-done')
  };

  if (!cols['a-fazer']) return;
  Object.values(cols).forEach(col => col.innerHTML = '');

  clientKanbanTasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.innerHTML = `
      <div class="kanban-card-title">${task.title}</div>
      <div class="kanban-card-meta">
        <span>👤 ${task.owner}</span>
        <span>📅 ${task.dueDate}</span>
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

window.moveKanban = async function(id, dir) {
  const task = clientKanbanTasks.find(t => t.id === id);
  if (!task) return;

  const flow = ['a-fazer', 'em-andamento', 'concluido'];
  let currentIdx = flow.indexOf(task.status);

  if (dir === 'next' && currentIdx < 2) currentIdx++;
  if (dir === 'prev' && currentIdx > 0) currentIdx--;

  const newStatus = flow[currentIdx];
  try {
    await apiFetch('/kanban-tasks', { method: 'PATCH', body: { id, status: newStatus } });
  } catch (err) {
    alert('Não foi possível mover a tarefa: ' + err.message);
    return;
  }

  await logActivity(`Moveu a tarefa "${task.title}" para ${newStatus.toUpperCase()}`);
  await refreshAllFromServer();
};

window.deleteKanban = async function(id) {
  const task = clientKanbanTasks.find(t => t.id === id);
  try {
    await apiFetch('/kanban-tasks', { method: 'DELETE', body: { id } });
  } catch (err) {
    alert('Não foi possível excluir a tarefa: ' + err.message);
    return;
  }
  if (task) await logActivity(`Excluiu a tarefa "${task.title}" do Kanban`);
  await refreshAllFromServer();
};

// ISHIKAWA — agora compartilhado entre todos os dispositivos (antes era só local ao aparelho)
async function handleUpdateIshikawa(e) {
  if (e) e.preventDefault();
  const problem = document.getElementById('ishikawa-problem-input').value;
  const mType = document.getElementById('ishikawa-m-type').value;
  const cause = document.getElementById('ishikawa-cause-input').value;

  try {
    if (problem) await apiFetch('/ishikawa', { method: 'POST', body: { problem } });
    if (cause) {
      await apiFetch('/ishikawa', { method: 'POST', body: { categoria: mType, causa: cause } });
      await logActivity(`Adicionou a causa "${cause}" no Diagrama de Ishikawa (${mType.toUpperCase()})`);
    }
  } catch (err) {
    alert('Não foi possível salvar: ' + err.message);
    return;
  }

  document.getElementById('ishikawa-cause-input').value = '';
  await refreshAllFromServer();
}

function renderIshikawa() {
  const problemTitle = document.getElementById('ishikawa-effect-title');
  if (problemTitle) problemTitle.innerText = clientIshikawaData.problem || 'Sem problema definido';

  const mList = ['maoObra', 'metodo', 'maquina', 'material', 'meioAmbiente', 'medicao'];
  mList.forEach(m => {
    const el = document.getElementById(`ishikawa-list-${m}`);
    if (el) {
      el.innerHTML = (clientIshikawaData[m] || []).map(c => `<li>${c.causa}</li>`).join('') || '<li style="color:var(--text-dim)">Nenhuma causa anotada</li>';
    }
  });
}
