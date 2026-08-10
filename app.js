/* ==========================================================================
   APLICAÇÃO MULTI-CLIENTE DE GESTÃO 5S E CONSULTORIA DA QUALIDADE
   ========================================================================== */

// Base de Dados Oficial de Pergunta dos 5 Sensos
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

// Base de Dados de Contas de Clientes / Usuários
const DEFAULT_USERS = {
  admin: { username: 'admin', password: 'master5s', name: 'Consultor Mestre (Xandinho)', role: 'admin' },
  sohipren: { username: 'sohipren', password: '5s2026', name: 'Sohipren Indústria', role: 'client' },
  logistica: { username: 'logistica', password: '5s2026', name: 'Empresa de Logística ABC', role: 'client' }
};

// Gerenciamento de Estado Global com Multi-Tenant
let userDatabase = JSON.parse(localStorage.getItem('5s_user_database')) || DEFAULT_USERS;
let currentUser = JSON.parse(localStorage.getItem('5s_current_session')) || null;
let selectedClientId = JSON.parse(localStorage.getItem('5s_active_client_id')) || null;

// Objetos de Dados do Cliente Ativo
let clientAuditScores = {};
let clientGutMatrix = [];
let clientKanbanTasks = [];
let clientIshikawaData = {};

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  checkAuthSession();

  // Event Listeners de formulários
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('form-new-client')?.addEventListener('submit', handleCreateNewClient);
  document.getElementById('form-gut')?.addEventListener('submit', handleAddGUT);
  document.getElementById('form-kanban')?.addEventListener('submit', handleAddKanban);
  document.getElementById('form-ishikawa')?.addEventListener('submit', handleUpdateIshikawa);
});

// Checagem de Sessão do Usuário
function checkAuthSession() {
  const loginOverlay = document.getElementById('login-overlay');
  
  if (!currentUser) {
    if (loginOverlay) loginOverlay.classList.remove('hidden');
    return;
  }

  if (loginOverlay) loginOverlay.classList.add('hidden');

  // Se for Admin e nenhum cliente foi selecionado ainda, define o primeiro cliente
  if (currentUser.role === 'admin') {
    selectedClientId = selectedClientId || 'sohipren';
    document.getElementById('admin-client-selector-container')?.style.setProperty('display', 'block');
    populateAdminClientDropdown();
  } else {
    selectedClientId = currentUser.username;
    document.getElementById('admin-client-selector-container')?.style.setProperty('display', 'none');
  }

  localStorage.setItem('5s_active_client_id', JSON.stringify(selectedClientId));
  
  // Atualizar cabeçalho
  const activeClientObj = userDatabase[selectedClientId] || currentUser;
  document.getElementById('active-client-name').innerText = `🏢 Cliente: ${activeClientObj.name}`;
  document.getElementById('logged-user-name').innerText = `👤 Logado como: ${currentUser.name}`;

  // Carregar dados isolados do cliente ativo
  loadClientData(selectedClientId);
}

// Fazer Login
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

// Fazer Logout
window.handleLogout = function() {
  currentUser = null;
  selectedClientId = null;
  localStorage.removeItem('5s_current_session');
  localStorage.removeItem('5s_active_client_id');
  location.reload();
};

// Povoar Dropdown do Admin para trocar de cliente
function populateAdminClientDropdown() {
  const select = document.getElementById('admin-client-select');
  if (!select) return;

  select.innerHTML = Object.values(userDatabase)
    .filter(u => u.role === 'client')
    .map(c => `<option value="${c.username}" ${c.username === selectedClientId ? 'selected' : ''}>${c.name}</option>`)
    .join('');
}

// Alternar Cliente pelo Admin
window.changeActiveClientAdmin = function(newClientId) {
  selectedClientId = newClientId;
  localStorage.setItem('5s_active_client_id', JSON.stringify(selectedClientId));
  checkAuthSession();
};

// Cadastrar Novo Cliente pelo Admin
function handleCreateNewClient(e) {
  e.preventDefault();
  const name = document.getElementById('new-client-name').value.trim();
  const username = document.getElementById('new-client-user').value.trim().toLowerCase();
  const password = document.getElementById('new-client-pass').value.trim();

  if (!username || !password || !name) return;

  userDatabase[username] = { username, password, name, role: 'client' };
  localStorage.setItem('5s_user_database', JSON.stringify(userDatabase));

  alert(`Cliente "${name}" cadastrado com sucesso! Usuário: ${username}`);
  document.getElementById('new-client-name').value = '';
  document.getElementById('new-client-user').value = '';
  document.getElementById('new-client-pass').value = '';

  populateAdminClientDropdown();
}

// Carregar Dados Isolados do Cliente
function loadClientData(clientId) {
  clientAuditScores = JSON.parse(localStorage.getItem(`5s_audit_scores_${clientId}`)) || {};
  clientGutMatrix = JSON.parse(localStorage.getItem(`5s_gut_matrix_${clientId}`)) || [];
  clientKanbanTasks = JSON.parse(localStorage.getItem(`5s_kanban_tasks_${clientId}`)) || [
    { id: '1', title: 'Demarcar área de paletes no setor de Estoque', senso: 'seiton', status: 'todo', owner: 'Supervisão', date: '2026-08-20' },
    { id: '2', title: 'Treinamento de EPIs para Operadores', senso: 'seiketsu', status: 'doing', owner: 'Qualidade', date: '2026-08-15' }
  ];
  clientIshikawaData = JSON.parse(localStorage.getItem(`5s_ishikawa_${clientId}`)) || {
    problem: `Melhoria de Organização e Limpeza - ${userDatabase[clientId]?.name || 'Cliente'}`,
    maoObra: ['Falta de rotina diária de descarte'],
    metodo: ['Procedimento Operacional Padrão pendente'],
    maquina: ['Manutenção preventiva em atraso'],
    material: ['Sobras de materiais não identificados'],
    meioAmbiente: ['Iluminação deficiente na área fabril'],
    medicao: ['Falta de rondas semanais de 5S']
  };

  renderAuditForms();
  calculateAuditResults();
  renderGUTTable();
  renderKanban();
  renderIshikawa();
}

// Navegação entre Abas
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

// Renderizar Formulário de Auditoria 5S
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
      const currentScore = clientAuditScores[qKey] || 4;

      html += `
        <div class="audit-item">
          <div class="audit-item-text">
            <strong>${idx + 1}.</strong> ${qText}
          </div>
          <div class="score-options" data-qkey="${qKey}">
            ${[1, 2, 3, 4].map(s => `
              <button type="button" 
                      class="score-btn ${currentScore == s ? 'selected' : ''}" 
                      data-score="${s}"
                      onclick="selectScore('${qKey}', ${s})">
                ${s}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    });

    html += `</div>`;
  }

  container.innerHTML = html;
}

// Selecionar Nota da Pergunta
window.selectScore = function(qKey, score) {
  clientAuditScores[qKey] = score;
  localStorage.setItem(`5s_audit_scores_${selectedClientId}`, JSON.stringify(clientAuditScores));

  const optionsDiv = document.querySelector(`.score-options[data-qkey="${qKey}"]`);
  if (optionsDiv) {
    optionsDiv.querySelectorAll('.score-btn').forEach(btn => {
      if (parseInt(btn.getAttribute('data-score')) === score) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  calculateAuditResults();
};

// Calcular Resultados e Nível de Maturidade 5S
function calculateAuditResults() {
  const totals = { seiri: 0, seiton: 0, seiso: 0, seiketsu: 0, shitsuke: 0 };
  const maxPerSenso = 40;

  for (const senso of Object.keys(AUDIT_QUESTIONS)) {
    for (let i = 0; i < 10; i++) {
      const qKey = `${senso}_${i}`;
      const score = clientAuditScores[qKey] !== undefined ? clientAuditScores[qKey] : 4;
      totals[senso] += score;
    }
  }

  let totalScore = 0;
  let totalMax = 200;

  for (const senso of Object.keys(totals)) {
    const pct = Math.round((totals[senso] / maxPerSenso) * 100);
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
}

// Resetar Auditoria do Cliente Ativo
window.resetAudit = function() {
  if (confirm(`Deseja redefinir a auditoria do cliente "${userDatabase[selectedClientId]?.name}"?`)) {
    clientAuditScores = {};
    localStorage.removeItem(`5s_audit_scores_${selectedClientId}`);
    renderAuditForms();
    calculateAuditResults();
  }
};

// ==========================================================================
// FERRAMENTA: MATRIZ GUT
// ==========================================================================
function handleAddGUT(e) {
  e.preventDefault();
  const problem = document.getElementById('gut-problem').value;
  const g = parseInt(document.getElementById('gut-g').value);
  const u = parseInt(document.getElementById('gut-u').value);
  const t = parseInt(document.getElementById('gut-t').value);

  if (!problem) return;

  const score = g * u * t;
  clientGutMatrix.push({ id: Date.now(), problem, g, u, t, score });
  localStorage.setItem(`5s_gut_matrix_${selectedClientId}`, JSON.stringify(clientGutMatrix));

  document.getElementById('gut-problem').value = '';
  renderGUTTable();
}

function renderGUTTable() {
  const tbody = document.getElementById('gut-table-body');
  if (!tbody) return;

  clientGutMatrix.sort((a, b) => b.score - a.score);

  if (clientGutMatrix.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 1rem;">Nenhum problema cadastrado para este cliente.</td></tr>`;
    return;
  }

  tbody.innerHTML = clientGutMatrix.map((item, idx) => `
    <tr>
      <td><strong>#${idx + 1}</strong></td>
      <td>${item.problem}</td>
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
  clientGutMatrix = clientGutMatrix.filter(i => i.id !== id);
  localStorage.setItem(`5s_gut_matrix_${selectedClientId}`, JSON.stringify(clientGutMatrix));
  renderGUTTable();
};

// ==========================================================================
// FERRAMENTA: KANBAN 5W2H
// ==========================================================================
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
    status: 'todo',
    owner: owner || 'Não atribuído',
    date: date || 'A definir'
  });

  localStorage.setItem(`5s_kanban_tasks_${selectedClientId}`, JSON.stringify(clientKanbanTasks));
  document.getElementById('kanban-title').value = '';
  renderKanban();
}

function renderKanban() {
  const cols = {
    todo: document.getElementById('kanban-col-todo'),
    doing: document.getElementById('kanban-col-doing'),
    done: document.getElementById('kanban-col-done')
  };

  if (!cols.todo) return;
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
      <div style="margin-top: 0.5rem; display: flex; gap: 0.25rem; justify-content: flex-end;">
        ${task.status !== 'todo' ? `<button class="btn btn-secondary" style="padding:0.15rem 0.4rem; font-size:0.7rem;" onclick="moveKanban('${task.id}', 'prev')">←</button>` : ''}
        ${task.status !== 'done' ? `<button class="btn btn-primary" style="padding:0.15rem 0.4rem; font-size:0.7rem;" onclick="moveKanban('${task.id}', 'next')">→</button>` : ''}
        <button class="btn btn-danger" style="padding:0.15rem 0.4rem; font-size:0.7rem;" onclick="deleteKanban('${task.id}')">✕</button>
      </div>
    `;

    if (cols[task.status]) cols[task.status].appendChild(card);
  });
}

window.moveKanban = function(id, dir) {
  const task = clientKanbanTasks.find(t => t.id === id);
  if (!task) return;

  const flow = ['todo', 'doing', 'done'];
  let currentIdx = flow.indexOf(task.status);

  if (dir === 'next' && currentIdx < 2) currentIdx++;
  if (dir === 'prev' && currentIdx > 0) currentIdx--;

  task.status = flow[currentIdx];
  localStorage.setItem(`5s_kanban_tasks_${selectedClientId}`, JSON.stringify(clientKanbanTasks));
  renderKanban();
};

window.deleteKanban = function(id) {
  clientKanbanTasks = clientKanbanTasks.filter(t => t.id !== id);
  localStorage.setItem(`5s_kanban_tasks_${selectedClientId}`, JSON.stringify(clientKanbanTasks));
  renderKanban();
};

// ==========================================================================
// FERRAMENTA: ISHIKAWA 6M
// ==========================================================================
function handleUpdateIshikawa(e) {
  e.preventDefault();
  const problem = document.getElementById('ishikawa-problem-input').value;
  const mType = document.getElementById('ishikawa-m-type').value;
  const cause = document.getElementById('ishikawa-cause-input').value;

  if (problem) clientIshikawaData.problem = problem;
  if (cause && clientIshikawaData[mType]) {
    clientIshikawaData[mType].push(cause);
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
