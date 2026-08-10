/* ==========================================================================
   APLICAÇÃO INTERATIVA DE GESTÃO 5S E FERRAMENTAS DA QUALIDADE
   ========================================================================== */

// Base de Dados Oficial de Pergunta dos 5 Sensos (Extraídas dos formulários de auditoria corporativos)
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

// Estado Global da Aplicação
const AppState = {
  auditScores: JSON.parse(localStorage.getItem('5s_audit_scores')) || {},
  gutMatrix: JSON.parse(localStorage.getItem('5s_gut_matrix')) || [],
  kanbanTasks: JSON.parse(localStorage.getItem('5s_kanban_tasks')) || [
    { id: '1', title: 'Identificar caixa de ferramentas da Montagem', senso: 'seiton', status: 'todo', owner: 'Rodrigo', date: '2026-08-15' },
    { id: '2', title: 'Eliminar vazamento de ar na Máquina 03', senso: 'seiso', status: 'doing', owner: 'Carlos', date: '2026-08-12' },
    { id: '3', title: 'Treinamento de EPIs para o Estoque', senso: 'seiketsu', status: 'done', owner: 'Ana', date: '2026-08-10' }
  ],
  ishikawaData: JSON.parse(localStorage.getItem('5s_ishikawa')) || {
    problem: 'Acúmulo de cavacos e sujeira na bancada da Fábrica',
    maoObra: ['Falta de hábito de limpar ao término'],
    metodo: ['Procedimento de limpeza semanal em vez de diário'],
    maquina: ['Exaustor com filtro saturado'],
    material: ['Óleo de corte de baixa qualidade'],
    meioAmbiente: ['Iluminação deficiente na área traseira'],
    medicao: ['Falta de checklist de liberação de máquina']
  }
};

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  renderAuditForms();
  calculateAuditResults();
  renderGUTTable();
  renderKanban();
  renderIshikawa();

  // Event Listeners dos formulários
  document.getElementById('form-gut')?.addEventListener('submit', handleAddGUT);
  document.getElementById('form-kanban')?.addEventListener('submit', handleAddKanban);
  document.getElementById('form-ishikawa')?.addEventListener('submit', handleUpdateIshikawa);
});

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
      const currentScore = AppState.auditScores[qKey] || 4; // Padrão 4 (Ótimo)

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
  AppState.auditScores[qKey] = score;
  localStorage.setItem('5s_audit_scores', JSON.stringify(AppState.auditScores));

  // Atualizar UI dos botões
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
  const maxPerSenso = 40; // 10 perguntas * 4 pontos máx

  for (const senso of Object.keys(AUDIT_QUESTIONS)) {
    for (let i = 0; i < 10; i++) {
      const qKey = `${senso}_${i}`;
      const score = AppState.auditScores[qKey] !== undefined ? AppState.auditScores[qKey] : 4;
      totals[senso] += score;
    }
  }

  let totalScore = 0;
  let totalMax = 200; // 5 sensos * 40 pontos

  for (const senso of Object.keys(totals)) {
    const pct = Math.round((totals[senso] / maxPerSenso) * 100);
    totalScore += totals[senso];

    // Atualizar métricas na tela
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

// Resposta Rápida para Resetar Auditoria
window.resetAudit = function() {
  if (confirm('Deseja redefinir todas as respostas da auditoria para o padrão?')) {
    AppState.auditScores = {};
    localStorage.removeItem('5s_audit_scores');
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
  AppState.gutMatrix.push({ id: Date.now(), problem, g, u, t, score });
  localStorage.setItem('5s_gut_matrix', JSON.stringify(AppState.gutMatrix));

  document.getElementById('gut-problem').value = '';
  renderGUTTable();
}

function renderGUTTable() {
  const tbody = document.getElementById('gut-table-body');
  if (!tbody) return;

  // Ordenar por maior pontuação (GUT)
  AppState.gutMatrix.sort((a, b) => b.score - a.score);

  if (AppState.gutMatrix.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 1rem;">Nenhum problema cadastrado na Matriz GUT.</td></tr>`;
    return;
  }

  tbody.innerHTML = AppState.gutMatrix.map((item, idx) => `
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
  AppState.gutMatrix = AppState.gutMatrix.filter(i => i.id !== id);
  localStorage.setItem('5s_gut_matrix', JSON.stringify(AppState.gutMatrix));
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

  AppState.kanbanTasks.push({
    id: Date.now().toString(),
    title,
    senso,
    status: 'todo',
    owner: owner || 'Não atribuído',
    date: date || 'A definir'
  });

  localStorage.setItem('5s_kanban_tasks', JSON.stringify(AppState.kanbanTasks));
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

  AppState.kanbanTasks.forEach(task => {
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

    if (cols[task.status]) {
      cols[task.status].appendChild(card);
    }
  });
}

window.moveKanban = function(id, dir) {
  const task = AppState.kanbanTasks.find(t => t.id === id);
  if (!task) return;

  const flow = ['todo', 'doing', 'done'];
  let currentIdx = flow.indexOf(task.status);

  if (dir === 'next' && currentIdx < 2) currentIdx++;
  if (dir === 'prev' && currentIdx > 0) currentIdx--;

  task.status = flow[currentIdx];
  localStorage.setItem('5s_kanban_tasks', JSON.stringify(AppState.kanbanTasks));
  renderKanban();
};

window.deleteKanban = function(id) {
  AppState.kanbanTasks = AppState.kanbanTasks.filter(t => t.id !== id);
  localStorage.setItem('5s_kanban_tasks', JSON.stringify(AppState.kanbanTasks));
  renderKanban();
};

// ==========================================================================
// FERRAMENTA: ISHIKAWA (ESPINHA DE PEIXE)
// ==========================================================================
function handleUpdateIshikawa(e) {
  e.preventDefault();
  const problem = document.getElementById('ishikawa-problem-input').value;
  const mType = document.getElementById('ishikawa-m-type').value;
  const cause = document.getElementById('ishikawa-cause-input').value;

  if (problem) AppState.ishikawaData.problem = problem;
  if (cause && AppState.ishikawaData[mType]) {
    AppState.ishikawaData[mType].push(cause);
  }

  localStorage.setItem('5s_ishikawa', JSON.stringify(AppState.ishikawaData));
  document.getElementById('ishikawa-cause-input').value = '';
  renderIshikawa();
}

function renderIshikawa() {
  const problemTitle = document.getElementById('ishikawa-effect-title');
  if (problemTitle) problemTitle.innerText = AppState.ishikawaData.problem;

  const mList = ['maoObra', 'metodo', 'maquina', 'material', 'meioAmbiente', 'medicao'];
  mList.forEach(m => {
    const el = document.getElementById(`ishikawa-list-${m}`);
    if (el) {
      el.innerHTML = (AppState.ishikawaData[m] || []).map(c => `<li>${c}</li>`).join('') || '<li style="color:var(--text-dim)">Nenhuma causa anotada</li>';
    }
  });
}
