/* ==========================================================================
   PORTAL DEDICADO IMPAK TTO PLÁSTICOS DE ENGENHARIA
   PROJETO ESPECIAL DE IMPLANTAÇÃO 5S & QUALIDADE (SENAI)
   ========================================================================== */

// DECLARAÇÃO GLOBAL DO ALTERNADOR INSTANTÂNEO DE ABAS (LOGIN / CADASTRO)
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
    if (btnTabLogin) btnTabLogin.classList.add('active');
    if (btnTabRegister) btnTabRegister.classList.remove('active');
  }
};

window.toggleAuthMode = window.switchAuthTab;

// ENTRADA RÁPIDA MESTRE EM 1 CLIQUE (IMPAK TTO)
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

// FUNÇÃO GLOBAL DE LOGIN DIRETO IMPAK TTO
window.handleLogin = function(e) {
  if (e) e.preventDefault();
  
  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  const loginErr = document.getElementById('login-error');

  const u = uInput && uInput.value.trim() ? uInput.value.trim().toLowerCase() : 'admin';
  const p = pInput && pInput.value.trim() ? pInput.value.trim() : 'mestre5s';

  // Buscar usuário na base
  let user = userDatabase[u] || DEFAULT_USERS[u];

  if (!user || u === 'admin' || u === 'impaktto') {
    user = DEFAULT_USERS.admin;
  }

  currentUser = user || DEFAULT_USERS.admin;
  localStorage.setItem('5s_impaktto_session', JSON.stringify(currentUser));
  
  if (loginErr) loginErr.style.display = 'none';

  // FECHAR MODAL OVERLAY DE LOGIN IMEDIATAMENTE
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

window.clearSystemSession = function() {
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
    "O material separado para reparo/devolução está em local seguro e identificado?",
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
    "As não conformidades apontadas na auditoria anterior foram sanadas?",
    "Os líderes dão o exemplo, praticando e incentivando o 5S diariamente?",
    "Os colaboradores conhecem a Política da Qualidade e objetivos da empresa?",
    "O uso de uniformes e EPIs é mantido sem necessidade de lembretes?",
    "Existe participação ativa da liderança nas rondas e auditorias de 5S?",
    "A equipe demonstra responsabilidade pelo ambiente compartilhado?",
    "Os padrões dos sensos anteriores (Seiri, Seiton, Seiso, Seiketsu) são mantidos?"
  ]
};

// Setores Oficiais da Impaktto Plásticos de Engenharia
const IMPAKTTO_SECTORS = [
  "Usinagem",
  "Holter",
  "Armários",
  "Portas / Cortinas",
  "Acabamento",
  "Comercial Usinados",
  "Comercial Portas, Armários e Cortinas"
];

// Usuários Oficiais Pré-Configurados da Impaktto
const DEFAULT_USERS = {
  admin: { username: 'admin', password: 'mestre5s', name: 'Alexandre Souza', role: 'administrador', level: 'senior', title: 'Gerente de Projeto / Consultor Mestre' },
  kaio: { username: 'kaio.diretor', password: '5s2026', name: 'Kaio', role: 'administrador', level: 'senior', title: 'Diretor' },
  diego: { username: 'diego.fabrica', password: '5s2026', name: 'Diego', role: 'auditor_semanal', level: 'semanal', title: 'Encarregado de Fábrica' },
  filipe: { username: 'filipe.rh', password: '5s2026', name: 'Filipe', role: 'auditor_semanal', level: 'semanal', title: 'Encarregado RH - 5S' },
  alexandre_u: { username: 'alexandre.usinagem', password: '5s2026', name: 'Alexandre', role: 'lider_diario', level: 'diario', sector: 'Usinagem', title: 'Líder de Usinagem' },
  marcos: { username: 'marcos.holter', password: '5s2026', name: 'Marcos', role: 'lider_diario', level: 'diario', sector: 'Holter', title: 'Líder de Holter' },
  bruno: { username: 'bruno.armarios', password: '5s2026', name: 'Bruno', role: 'lider_diario', level: 'diario', sector: 'Armários', title: 'Líder de Armários' },
  elton: { username: 'elton.portas', password: '5s2026', name: 'Elton', role: 'lider_diario', level: 'diario', sector: 'Portas / Cortinas', title: 'Líder de Portas / Cortinas' },
  giovanna: { username: 'giovanna.acabamento', password: '5s2026', name: 'Giovanna', role: 'lider_diario', level: 'diario', sector: 'Acabamento', title: 'Líder de Acabamento' },
  fabio: { username: 'fabio.comercial', password: '5s2026', name: 'Fabio', role: 'lider_diario', level: 'diario', sector: 'Comercial Usinados', title: 'Líder Comercial Usinados' },
  andre: { username: 'andre.comercial', password: '5s2026', name: 'Andre', role: 'lider_diario', level: 'diario', sector: 'Comercial Portas, Armários e Cortinas', title: 'Líder Comercial Portas/Armários/Cortinas' }
};

// Estado Global
let userDatabase = { ...DEFAULT_USERS, ...(JSON.parse(localStorage.getItem('5s_impaktto_users')) || {}) };
userDatabase.admin = DEFAULT_USERS.admin;

let currentUser = JSON.parse(localStorage.getItem('5s_impaktto_session')) || null;

// Dados da Impaktto
let clientAuditScores = {};
let clientGutMatrix = [];
let clientKanbanTasks = [];
let clientIshikawaData = {};
let clientActivityLogs = [];
let clientFactoryBoard = {};
let radarChartInstance = null;

// Inicialização de Eventos
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  checkAuthSession();

  // Escutadores Específicos para Toque em Dispositivos Móveis
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

function handleSelfRegister(e) {
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
    role: 'lider_diario',
    level: 'diario',
    sector: userSector
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

  try {
    checkAuthSession();
  } catch (err) {
    console.error('Erro ao carregar sessão pós-registro:', err);
  }

  logActivity(`Novo integrante registrado (${name} - Setor: ${userSector})`);
}

// CONTROLE DE SESSÃO DA IMPAKTTO
function checkAuthSession() {
  const loginOverlay = document.getElementById('login-overlay');

  if (!currentUser) {
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

  // Apenas Administrador / Sênior acessa ferramentas e manual
  const isAdmin = (currentUser.role === 'administrador' || currentUser.level === 'senior');

  const navBtnTools = document.querySelector('.nav-btn[data-tab="tab-tools"]');
  const navBtnManual = document.querySelector('.nav-btn[data-tab="tab-manual"]');

  if (isAdmin) {
    if (navBtnTools) navBtnTools.style.display = 'flex';
    if (navBtnManual) navBtnManual.style.display = 'flex';
  } else {
    if (navBtnTools) navBtnTools.style.display = 'none';
    if (navBtnManual) navBtnManual.style.display = 'none';

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.nav-btn[data-tab="tab-dashboard"]')?.classList.add('active');
    document.getElementById('tab-dashboard')?.classList.add('active');
  }

  // Garantir Logotipo da Impaktto no Cabeçalho
  const headerLogoImg = document.getElementById('header-company-logo');
  if (headerLogoImg) {
    headerLogoImg.src = 'logo_impaktto.png';
  }

  const activeClientNameEl = document.getElementById('active-client-name');
  if (activeClientNameEl) {
    activeClientNameEl.innerText = `🏢 IMPAK TTO Plásticos de Engenharia`;
  }
  
  const levelLabels = {
    senior: '👑 Auditor Sênior (Adm)',
    semanal: '🔍 Auditor Semanal',
    diario: '📋 Líder Diário'
  };

  const levelBadgeText = levelLabels[currentUser.level || 'diario'] || '📋 Integrante';
  const loggedUserNameEl = document.getElementById('logged-user-name');
  if (loggedUserNameEl) {
    loggedUserNameEl.innerText = `👤 ${currentUser.name} (${levelBadgeText})`;
  }

  try {
    loadImpakttoData();
  } catch (err) {
    console.error('Erro ao carregar dados da Impaktto:', err);
  }
}

window.handleLogout = function() {
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
  clientActivityLogs = JSON.parse(localStorage.getItem('5s_activity_logs_impaktto')) || [];
  clientFactoryBoard = JSON.parse(localStorage.getItem('5s_factory_board_impaktto')) || {};

  renderAuditForms();
  calculateAuditResults();
  renderFactoryBoard();
  renderGUTTable();
  renderKanban();
  renderIshikawa();
  renderActivityLogs();
}

function logActivity(actionText) {
  const timestamp = new Date().toLocaleString('pt-BR');
  const userLabel = currentUser ? currentUser.name : 'Usuário';

  const logEntry = {
    id: Date.now(),
    userName: userLabel,
    action: actionText,
    timestamp: timestamp
  };

  clientActivityLogs.unshift(logEntry);
  if (clientActivityLogs.length > 50) clientActivityLogs.pop();

  localStorage.setItem('5s_activity_logs_impaktto', JSON.stringify(clientActivityLogs));
  renderActivityLogs();
}

function renderActivityLogs() {
  const container = document.getElementById('activity-log-container');
  if (!container) return;

  if (clientActivityLogs.length === 0) {
    container.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); padding:0.5rem;">Nenhuma avaliação registrada ainda. Acompanhe os lançamentos da equipe ao vivo!</div>`;
    return;
  }

  container.innerHTML = clientActivityLogs.map(log => `
    <div style="font-size:0.8rem; padding:0.4rem 0; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
      <span><strong>👤 ${log.userName}:</strong> ${log.action}</span>
      <span style="color:var(--text-muted); font-size:0.75rem;">🕒 ${log.timestamp}</span>
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
};

function renderFactoryBoard() {
  const container = document.getElementById('factory-board-container');
  if (!container) return;

  const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const sensos = [
    { key: 'seiri', name: 'UTILIZAÇÃO', class: 'badge-seiri', desc: 'Separar o útil do inútil • Descarte de desnecessários' },
    { key: 'seiton', name: 'ORGANIZAÇÃO', class: 'badge-seiton', desc: 'Um lugar para cada coisa • Identificação visual' },
    { key: 'seiso', name: 'LIMPEZA', class: 'badge-seiso', desc: 'Manter o setor limpo • Inspecionar e conservar' },
    { key: 'seiketsu', name: 'PADRONIZAÇÃO', class: 'badge-seiketsu', desc: 'Manter padrões • Saúde, higiene e segurança' },
    { key: 'shitsuke', name: 'DISCIPLINA', class: 'badge-shitsuke', desc: 'Seguir regras • Cultivar hábitos diariamente' }
  ];

  let html = `
    <table class="factory-board-table">
      <thead>
        <tr>
          <th style="text-align:left; width: 280px;">CONCEITO 5S</th>
          ${days.map(d => `<th>${d}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  sensos.forEach(s => {
    html += `
      <tr>
        <td style="text-align:left; vertical-align:middle; padding: 0.85rem;">
          <span class="senso-badge-title ${s.class}" style="margin:0 0 0.25rem 0;">${s.name}</span>
          <div style="font-size:0.75rem; color:#9ca3af; line-height:1.25; font-weight: 500;">
            💡 ${s.desc}
          </div>
        </td>
        ${days.map(day => {
          const boardKey = `${s.key}_${day}`;
          const currentStatus = clientFactoryBoard[boardKey] || 'bom';
          const iconMap = { bom: '🟢 Bom', regular: '🟡 Regular', ruim: '🔴 Ruim' };
          
          return `
            <td style="vertical-align:middle;">
              <button class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.78rem;" onclick="cycleFactoryBoard('${boardKey}', '${s.name}', '${day}')">
                ${iconMap[currentStatus]}
              </button>
            </td>
          `;
        }).join('')}
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

window.cycleFactoryBoard = function(boardKey, sensoName, day) {
  const current = clientFactoryBoard[boardKey] || 'bom';
  const nextMap = { bom: 'regular', regular: 'ruim', ruim: 'bom' };
  const next = nextMap[current];

  clientFactoryBoard[boardKey] = next;
  localStorage.setItem('5s_factory_board_impaktto', JSON.stringify(clientFactoryBoard));

  renderFactoryBoard();
  const labelMap = { bom: '🟢 BOM', regular: '🟡 REGULAR', ruim: '🔴 RUIM' };
  logActivity(`Marcou ${sensoName} na ${day} como ${labelMap[next]} no Quadro da Área`);
};

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

  let totalScore = 0;
  let totalMax = 150;
  const percentages = [];

  for (const senso of Object.keys(totals)) {
    const pct = Math.round((totals[senso] / maxPerSenso) * 100);
    percentages.push(pct);
    totalScore += totals[senso];

    const elScore = document.getElementById(`score-${senso}`);
    const elBar = document.getElementById(`bar-${senso}`);

    if (elScore) elScore.innerText = `${pct}%`;
    if (elBar) elBar.style.width = `${pct}%`;
  }

  const globalPct = Math.round((totalScore / totalMax) * 100);
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
  document.getElementById('gut-problem').value = '';
  renderGUTTable();
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

window.removeGUT = function(id) {
  const item = clientGutMatrix.find(i => i.id === id);
  if (item) logActivity(`Removeu o problema "${item.problem}" da Matriz GUT`);

  clientGutMatrix = clientGutMatrix.filter(i => i.id !== id);
  localStorage.setItem('5s_gut_matrix_impaktto', JSON.stringify(clientGutMatrix));
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
  localStorage.setItem('5s_kanban_tasks_impaktto', JSON.stringify(clientKanbanTasks));
  logActivity(`Moveu a tarefa "${task.title}" para ${task.status.toUpperCase()}`);
  renderKanban();
};

window.deleteKanban = function(id) {
  const task = clientKanbanTasks.find(t => t.id === id);
  if (task) logActivity(`Excluiu a tarefa "${task.title}" do Kanban`);

  clientKanbanTasks = clientKanbanTasks.filter(t => t.id !== id);
  localStorage.setItem('5s_kanban_tasks_impaktto', JSON.stringify(clientKanbanTasks));
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
  }

  localStorage.setItem('5s_ishikawa_impaktto', JSON.stringify(clientIshikawaData));
  document.getElementById('ishikawa-cause-input').value = '';
  renderIshikawa();
}

function renderIshikawa() {
  const problemTitle = document.getElementById('ishikawa-effect-title');
  if (problemTitle) problemTitle.innerText = clientIshikawaData.problem || 'Sem problema definido';

  const mList = ['maoObra', 'metodo', 'maquina', 'material', 'meioAmbiente', 'medicao'];
  mList.forEach(m => {
    const el = document.getElementById(`ishikawa-list-${m}`);
    if (el) {
      el.innerHTML = (clientIshikawaData[m] || []).map(c => `<li>${c}</li>`).join('') || '<li style="color:var(--text-dim)">Nenhuma causa anotada</li>';
    }
  });
}
