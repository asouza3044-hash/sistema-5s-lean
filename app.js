/* ==========================================================================
   PORTAL DE CONSULTORIA 5S & QUALIDADE (PERSONALIZAÇÃO DE CLIENTES & LOGOS)
   ========================================================================== */

// Base de Dados Oficial de Perguntas dos 5 Sensos (50 Itens Oficiais)
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

// Base de Empresas Inicial com Logotipos e Subtítulos
const DEFAULT_COMPANIES = {
  impaktto: {
    id: 'impaktto',
    name: 'IMPAK TTO Plásticos de Engenharia',
    subtitle: 'Projeto de Implantação 5S & Lean - Parceria SENAI',
    logo: ''
  },
  sohipren: {
    id: 'sohipren',
    name: 'Sohipren S.A. Oleohidráulica',
    subtitle: 'Metodologia 5S & Gestão da Qualidade ISO 9001',
    logo: ''
  },
  logistica: {
    id: 'logistica',
    name: 'Empresa de Logística ABC',
    subtitle: 'Programa 5S & Excelência Operacional no Armazém',
    logo: ''
  }
};

// Base de Usuários Inicial
const DEFAULT_USERS = {
  admin: { username: 'admin', password: 'mestre5s', name: 'Consultor Mestre (Xandinho)', role: 'administrador', companyId: 'impaktto' },
  impaktto: { username: 'impaktto', password: '5s2026', name: 'Equipe Impaktto', role: 'cliente', companyId: 'impaktto' },
  senai: { username: 'senai', password: '5s2026', name: 'Equipe SENAI', role: 'cliente', companyId: 'impaktto' }
};

// Estado Global
let userDatabase = JSON.parse(localStorage.getItem('5s_user_database')) || DEFAULT_USERS;
let companyDatabase = JSON.parse(localStorage.getItem('5s_company_database')) || DEFAULT_COMPANIES;
let currentUser = JSON.parse(localStorage.getItem('5s_current_session')) || null;
let selectedClientId = JSON.parse(localStorage.getItem('5s_active_client_id')) || 'impaktto';

// Dados do Cliente Ativo
let clientAuditScores = {};
let clientGutMatrix = [];
let clientKanbanTasks = [];
let clientIshikawaData = {};
let clientActivityLogs = [];
let clientFactoryBoard = {};
let radarChartInstance = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  checkURLParams();
  checkAuthSession();
  populateCompanyDropdowns();

  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('register-form')?.addEventListener('submit', handleSelfRegister);
  document.getElementById('form-new-company')?.addEventListener('submit', handleAdminCreateCompany);
  document.getElementById('form-new-user')?.addEventListener('submit', handleCreateNewUser);
  document.getElementById('form-gut')?.addEventListener('submit', handleAddGUT);
  document.getElementById('form-kanban')?.addEventListener('submit', handleAddKanban);
  document.getElementById('form-ishikawa')?.addEventListener('submit', handleUpdateIshikawa);
});

// Checar Parâmetros de URL (?empresa=impaktto) e Travar a Empresa no Auto-Cadastro
function checkURLParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const companyParam = urlParams.get('empresa');
  
  const regCompanySelect = document.getElementById('reg-company-id');
  const regCompanyLockedName = document.getElementById('reg-company-locked-name');
  const regCompanyLockedId = document.getElementById('reg-company-locked-id');

  if (companyParam && companyDatabase[companyParam]) {
    selectedClientId = companyParam;
    const targetCompany = companyDatabase[companyParam];

    // Travar a empresa vinda do link sem opção de troca no cadastro
    if (regCompanySelect) regCompanySelect.style.display = 'none';
    if (regCompanyLockedName) {
      regCompanyLockedName.style.display = 'block';
      regCompanyLockedName.value = `🔒 ${targetCompany.name}`;
    }
    if (regCompanyLockedId) regCompanyLockedId.value = targetCompany.id;

    updateWelcomeBanner(companyParam);
  } else {
    if (regCompanySelect) regCompanySelect.style.display = 'block';
    if (regCompanyLockedName) regCompanyLockedName.style.display = 'none';
    updateWelcomeBanner(selectedClientId || 'impaktto');
  }
}

function updateWelcomeBanner(companyId) {
  const company = companyDatabase[companyId] || companyDatabase['impaktto'];
  const welcomeTitle = document.getElementById('welcome-company-title');
  const welcomeSub = document.getElementById('welcome-company-subtitle');

  if (welcomeTitle) welcomeTitle.innerText = company.name;
  if (welcomeSub) welcomeSub.innerText = company.subtitle || 'Projeto de Implantação 5S & Qualidade';
}

function populateCompanyDropdowns() {
  const regSelect = document.getElementById('reg-company-id');
  if (regSelect) {
    regSelect.innerHTML = Object.values(companyDatabase)
      .map(c => `<option value="${c.id}">${c.name}</option>`)
      .join('') + `<option value="nova_empresa">+ Cadastrar Nova Empresa</option>`;
  }
}

window.toggleAuthMode = function(mode) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const btnTabLogin = document.getElementById('auth-tab-login');
  const btnTabRegister = document.getElementById('auth-tab-register');

  if (mode === 'register') {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    btnTabLogin.classList.remove('active');
    btnTabRegister.classList.add('active');
  } else {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    btnTabLogin.classList.add('active');
    btnTabRegister.classList.remove('active');
  }
};

window.handleRegCompanyChange = function(val) {
  const newCompanyInputContainer = document.getElementById('reg-new-company-container');
  if (val === 'nova_empresa') {
    newCompanyInputContainer.style.display = 'block';
  } else {
    newCompanyInputContainer.style.display = 'none';
    updateWelcomeBanner(val);
  }
};

function handleSelfRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  
  // Obter a empresa travada do link ou a selecionada no dropdown
  const lockedId = document.getElementById('reg-company-locked-id').value;
  let companyId = lockedId || document.getElementById('reg-company-id').value;
  
  const newCompanyName = document.getElementById('reg-new-company-name').value.trim();
  const username = document.getElementById('reg-username').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value.trim();

  if (!name || !username || !password) return;

  if (companyId === 'nova_empresa') {
    if (!newCompanyName) {
      alert('Por favor, informe o nome da nova empresa.');
      return;
    }
    companyId = username.split('.')[1] || username;
    companyDatabase[companyId] = { id: companyId, name: newCompanyName, subtitle: 'Projeto de Implantação 5S & Qualidade' };
    localStorage.setItem('5s_company_database', JSON.stringify(companyDatabase));
  }

  if (userDatabase[username]) {
    alert('Este nome de usuário já está em uso. Escolha outro usuário (ex: joao.impaktto).');
    return;
  }

  const newUser = { username, password, name, role: 'cliente', companyId };
  userDatabase[username] = newUser;
  localStorage.setItem('5s_user_database', JSON.stringify(userDatabase));

  currentUser = newUser;
  localStorage.setItem('5s_current_session', JSON.stringify(currentUser));
  checkAuthSession();

  logActivity(`Novo participante entrou na auditoria de campo (${name})`);
}

function handleAdminCreateCompany(e) {
  e.preventDefault();
  const name = document.getElementById('admin-comp-name').value.trim();
  const code = document.getElementById('admin-comp-code').value.trim().toLowerCase().replace(/\s+/g, '-');
  const subtitle = document.getElementById('admin-comp-subtitle').value.trim();

  if (!name || !code) return;

  companyDatabase[code] = {
    id: code,
    name: name,
    subtitle: subtitle || 'Projeto de Implantação 5S & Qualidade',
    logo: ''
  };

  localStorage.setItem('5s_company_database', JSON.stringify(companyDatabase));
  populateCompanyDropdowns();
  populateAdminClientDropdown();

  const generatedLink = `${window.location.origin}${window.location.pathname}?empresa=${code}`;
  
  document.getElementById('generated-link-display').style.display = 'block';
  document.getElementById('generated-link-input').value = generatedLink;

  alert(`Empresa "${name}" cadastrada com sucesso! Link personalizado gerado!`);
}

window.copyGeneratedLink = function() {
  const input = document.getElementById('generated-link-input');
  if (input) {
    input.select();
    navigator.clipboard.writeText(input.value);
    alert('Link copiado com sucesso! Você já pode colar e enviar no WhatsApp ou E-mail!');
  }
};

function checkAuthSession() {
  const loginOverlay = document.getElementById('login-overlay');

  if (!currentUser) {
    if (loginOverlay) loginOverlay.classList.remove('hidden');
    return;
  }

  if (loginOverlay) loginOverlay.classList.add('hidden');

  const isAdmin = (currentUser.role === 'administrador');

  const navBtnTools = document.querySelector('.nav-btn[data-tab="tab-tools"]');
  const navBtnManual = document.querySelector('.nav-btn[data-tab="tab-manual"]');
  const adminClientSelector = document.getElementById('admin-client-selector-container');
  const adminAddUserCard = document.getElementById('admin-add-user-card');

  if (isAdmin) {
    selectedClientId = selectedClientId || 'impaktto';
    if (adminClientSelector) adminClientSelector.style.display = 'block';
    if (adminAddUserCard) adminAddUserCard.style.display = 'block';
    if (navBtnTools) navBtnTools.style.display = 'flex';
    if (navBtnManual) navBtnManual.style.display = 'flex';
    populateAdminClientDropdown();
  } else {
    selectedClientId = currentUser.companyId || 'impaktto';
    if (adminClientSelector) adminClientSelector.style.display = 'none';
    if (adminAddUserCard) adminAddUserCard.style.display = 'none';
    
    if (navBtnTools) navBtnTools.style.display = 'none';
    if (navBtnManual) navBtnManual.style.display = 'none';

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.nav-btn[data-tab="tab-dashboard"]')?.classList.add('active');
    document.getElementById('tab-dashboard')?.classList.add('active');
  }

  localStorage.setItem('5s_active_client_id', JSON.stringify(selectedClientId));
  
  const activeCompanyObj = companyDatabase[selectedClientId] || { name: 'Empresa Impaktto' };
  document.getElementById('active-client-name').innerText = `🏢 Empresa: ${activeCompanyObj.name}`;
  document.getElementById('logged-user-name').innerText = `👤 ${currentUser.name} ${isAdmin ? '(Consultor Mestre)' : '(Inspetor de Fábrica)'}`;

  loadClientData(selectedClientId);
}

function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('login-username').value.trim().toLowerCase();
  const p = document.getElementById('login-password').value.trim();

  const user = userDatabase[u];

  if (user && user.password === p) {
    currentUser = user;
    localStorage.setItem('5s_current_session', JSON.stringify(currentUser));
    document.getElementById('login-error').style.display = 'none';
    checkAuthSession();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

window.handleLogout = function() {
  currentUser = null;
  selectedClientId = null;
  localStorage.removeItem('5s_current_session');
  localStorage.removeItem('5s_active_client_id');
  location.reload();
};

function populateAdminClientDropdown() {
  const select = document.getElementById('admin-client-select');
  if (!select) return;

  select.innerHTML = Object.values(companyDatabase)
    .map(c => `<option value="${c.id}" ${c.id === selectedClientId ? 'selected' : ''}>${c.name}</option>`)
    .join('');
}

window.changeActiveClientAdmin = function(newClientId) {
  selectedClientId = newClientId;
  localStorage.setItem('5s_active_client_id', JSON.stringify(selectedClientId));
  checkAuthSession();
};

function handleCreateNewUser(e) {
  e.preventDefault();
  const companyName = document.getElementById('new-company-name').value.trim();
  const name = document.getElementById('new-user-name').value.trim();
  const username = document.getElementById('new-user-name-user').value.trim().toLowerCase();
  const password = document.getElementById('new-user-pass').value.trim();

  if (!username || !password || !name) return;

  const companyId = username.split('.')[1] || username;

  if (!companyDatabase[companyId]) {
    companyDatabase[companyId] = { id: companyId, name: companyName || name };
    localStorage.setItem('5s_company_database', JSON.stringify(companyDatabase));
  }

  userDatabase[username] = { username, password, name, role: 'cliente', companyId };
  localStorage.setItem('5s_user_database', JSON.stringify(userDatabase));

  alert(`Usuário registrado!\nNome: ${name}\nUsuário: ${username}`);
  document.getElementById('new-company-name').value = '';
  document.getElementById('new-user-name').value = '';
  document.getElementById('new-user-name-user').value = '';
  document.getElementById('new-user-pass').value = '';

  populateCompanyDropdowns();
  populateAdminClientDropdown();
}

function loadClientData(clientId) {
  clientAuditScores = JSON.parse(localStorage.getItem(`5s_audit_scores_${clientId}`)) || {};
  clientGutMatrix = JSON.parse(localStorage.getItem(`5s_gut_matrix_${clientId}`)) || [];
  clientKanbanTasks = JSON.parse(localStorage.getItem(`5s_kanban_tasks_${clientId}`)) || [
    { id: '1', title: 'Demarcar corredores de circulação no chão de fábrica', senso: 'seiton', status: 'a-fazer', owner: 'Manutenção', date: '2026-08-20', createdBy: 'Consultor Mestre' },
    { id: '2', title: 'Implantar quadro shadowboard para ferramentas de usinagem', senso: 'seiri', status: 'em-andamento', owner: 'Liderança Fábrica', date: '2026-08-15', createdBy: 'Equipe SENAI' }
  ];
  clientIshikawaData = JSON.parse(localStorage.getItem(`5s_ishikawa_${clientId}`)) || {
    problem: `Auditoria de Campo 5S - ${companyDatabase[clientId]?.name || 'Impaktto'}`,
    maoObra: ['Rotina de limpeza diária a estruturar'],
    metodo: ['Procedimentos visuais de organização nas bancadas'],
    maquina: ['Identificação dos pontos de lubrificação'],
    material: ['Triagem de insumos no estoque intermediário'],
    meioAmbiente: ['Organização de fiação elétrica e pneumática'],
    medicao: ['Rondas semanais da Comissão de Qualidade']
  };
  clientActivityLogs = JSON.parse(localStorage.getItem(`5s_activity_logs_${clientId}`)) || [];
  clientFactoryBoard = JSON.parse(localStorage.getItem(`5s_factory_board_${clientId}`)) || {};

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

  localStorage.setItem(`5s_activity_logs_${selectedClientId}`, JSON.stringify(clientActivityLogs));
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
  localStorage.setItem(`5s_audit_scores_${selectedClientId}`, JSON.stringify(clientAuditScores));

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
    { key: 'seiri', name: 'Utilização', class: 'badge-seiri' },
    { key: 'seiton', name: 'Organização', class: 'badge-seiton' },
    { key: 'seiso', name: 'Limpeza', class: 'badge-seiso' },
    { key: 'seiketsu', name: 'Padronização', class: 'badge-seiketsu' },
    { key: 'shitsuke', name: 'Disciplina', class: 'badge-shitsuke' }
  ];

  let html = `
    <table class="factory-board-table">
      <thead>
        <tr>
          <th style="text-align:left;">CONCEITO 5S</th>
          ${days.map(d => `<th>${d}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  sensos.forEach(s => {
    html += `
      <tr>
        <td style="text-align:left;"><span class="senso-badge-title ${s.class}" style="margin:0;">${s.name}</span></td>
        ${days.map(day => {
          const boardKey = `${s.key}_${day}`;
          const currentStatus = clientFactoryBoard[boardKey] || 'bom';
          const iconMap = { bom: '🟢 Bom', regular: '🟡 Regular', ruim: '🔴 Ruim' };
          
          return `
            <td>
              <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="cycleFactoryBoard('${boardKey}', '${s.name}', '${day}')">
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
  localStorage.setItem(`5s_factory_board_${selectedClientId}`, JSON.stringify(clientFactoryBoard));

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
  if (confirm(`Deseja redefinir a auditoria de "${companyDatabase[selectedClientId]?.name}"?`)) {
    clientAuditScores = {};
    localStorage.removeItem(`5s_audit_scores_${selectedClientId}`);
    logActivity('Redefiniu todas as respostas da auditoria');
    renderAuditForms();
    calculateAuditResults();
  }
};

// MATRIZ GUT
function handleAddGUT(e) {
  e.preventDefault();
  const problem = document.getElementById('gut-problem').value;
  const g = parseInt(document.getElementById('gut-g').value);
  const u = parseInt(document.getElementById('gut-u').value);
  const t = parseInt(document.getElementById('gut-t').value);

  if (!problem) return;

  const score = g * u * t;
  const item = { id: Date.now(), problem, g, u, t, score, createdBy: currentUser ? currentUser.name : 'Usuário' };
  clientGutMatrix.push(item);
  localStorage.setItem(`5s_gut_matrix_${selectedClientId}`, JSON.stringify(clientGutMatrix));

  logActivity(`Adicionou o problema "${problem}" na Matriz GUT (Pontuação: ${score})`);
  document.getElementById('gut-problem').value = '';
  renderGUTTable();
}

function renderGUTTable() {
  const tbody = document.getElementById('gut-table-body');
  if (!tbody) return;

  clientGutMatrix.sort((a, b) => b.score - a.score);

  if (clientGutMatrix.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 1rem;">Nenhum problema cadastrado para esta empresa.</td></tr>`;
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
  localStorage.setItem(`5s_gut_matrix_${selectedClientId}`, JSON.stringify(clientGutMatrix));
  renderGUTTable();
};

// KANBAN 5W2H
function handleAddKanban(e) {
  e.preventDefault();
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

  localStorage.setItem(`5s_kanban_tasks_${selectedClientId}`, JSON.stringify(clientKanbanTasks));
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
  localStorage.setItem(`5s_kanban_tasks_${selectedClientId}`, JSON.stringify(clientKanbanTasks));
  logActivity(`Moveu a tarefa "${task.title}" para ${task.status.toUpperCase()}`);
  renderKanban();
};

window.deleteKanban = function(id) {
  const task = clientKanbanTasks.find(t => t.id === id);
  if (task) logActivity(`Excluiu a tarefa "${task.title}" do Kanban`);

  clientKanbanTasks = clientKanbanTasks.filter(t => t.id !== id);
  localStorage.setItem(`5s_kanban_tasks_${selectedClientId}`, JSON.stringify(clientKanbanTasks));
  renderKanban();
};

// ISHIKAWA
function handleUpdateIshikawa(e) {
  e.preventDefault();
  const problem = document.getElementById('ishikawa-problem-input').value;
  const mType = document.getElementById('ishikawa-m-type').value;
  const cause = document.getElementById('ishikawa-cause-input').value;

  if (problem) clientIshikawaData.problem = problem;
  if (cause && clientIshikawaData[mType]) {
    clientIshikawaData[mType].push(cause);
    logActivity(`Adicionou a causa "${cause}" no Diagrama de Ishikawa (${mType.toUpperCase()})`);
  }

  localStorage.setItem(`5s_ishikawa_${selectedClientId}`, JSON.stringify(clientIshikawaData));
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
