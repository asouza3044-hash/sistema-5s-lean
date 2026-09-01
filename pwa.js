// ============================================================================
// PWA & Acesso Mobile - Portal 5S & Qualidade IMPAK TTO
// ============================================================================

let deferredPrompt = null;
let currentMobileUrl = window.location.origin;

// 1. REGISTRO DO SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('✓ Service Worker do 5S IMPAK TTO registrado com escopo:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ Falha ao registrar o Service Worker:', err);
      });
  });
}

// 2. CAPTURA DO EVENTO DE INSTALAÇÃO DO PWA (ANDROID & DESKTOP CHROME/EDGE)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('💡 Evento beforeinstallprompt capturado. PWA pronto para instalação!');
  showPwaInstallPrompts(true);
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  showPwaInstallPrompts(false);
  console.log('🎉 PWA do Portal 5S instalado com sucesso no dispositivo!');
});

function showPwaInstallPrompts(visible) {
  const loginBtn = document.getElementById('btn-pwa-install-login');
  const headerBtn = document.getElementById('btn-pwa-install-header');
  const display = visible ? 'inline-flex' : 'none';

  if (loginBtn) loginBtn.style.display = display;
  if (headerBtn) headerBtn.style.display = display;
}

// 3. DISPARAR PROMPT DE INSTALAÇÃO AO CLICAR NO BOTÃO
async function triggerPwaInstall() {
  if (!deferredPrompt) {
    // Se o navegador não disparou o prompt automático (ex: iOS ou já instalado), abre o modal de instruções
    openMobileAccessModal();
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`Resultado da instalação PWA: ${outcome}`);
  deferredPrompt = null;
  showPwaInstallPrompts(false);
}

const OFFICIAL_NETLIFY_URL = 'https://qualidade-5s-impaktto.netlify.app';

// 4. MODAL DE ACESSO MOBILE & QR CODE
async function openMobileAccessModal() {
  const modal = document.getElementById('modal-mobile-access');
  if (!modal) return;

  modal.style.display = 'flex';

  // Se já estiver em produção (Netlify) ou com link oficial definido:
  if (window.location.hostname.includes('netlify.app') || window.location.origin.includes('impaktto')) {
    currentMobileUrl = window.location.origin;
  } else {
    // No ambiente de desenvolvimento, prioriza o link oficial Netlify ou IP local
    currentMobileUrl = OFFICIAL_NETLIFY_URL;
  }


  // Atualizar campo de URL e imagem do QR Code
  const inputUrl = document.getElementById('mobile-network-url');
  if (inputUrl) {
    inputUrl.value = currentMobileUrl;
  }

  const qrImg = document.getElementById('mobile-qr-code-img');
  if (qrImg) {
    // Gerar QR Code de alta precisão
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentMobileUrl)}&margin=4`;
    qrImg.src = qrApi;
  }
}

function closeMobileAccessModal(event) {
  if (event && event.target && event.target.id !== 'modal-mobile-access') {
    return;
  }
  const modal = document.getElementById('modal-mobile-access');
  if (modal) modal.style.display = 'none';
}

function copyMobileUrl() {
  const input = document.getElementById('mobile-network-url');
  if (!input) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(input.value);
  } else {
    input.select();
    document.execCommand('copy');
  }

  const feedback = document.getElementById('copy-feedback');
  if (feedback) {
    feedback.style.display = 'block';
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 2500);
  }
}

async function forceReloadNewVersion() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        await r.unregister();
      }
    }
  } catch (e) {
    console.warn('Erro ao limpar cache:', e);
  }
  // Força recarregamento com timestamp novo para furar cache do iPhone/Safari
  const cleanUrl = window.location.origin + window.location.pathname;
  window.location.href = cleanUrl + '?reload=' + Date.now();
}

// Disponibilizar no escopo global para onclicks
window.triggerPwaInstall = triggerPwaInstall;
window.openMobileAccessModal = openMobileAccessModal;
window.closeMobileAccessModal = closeMobileAccessModal;
window.copyMobileUrl = copyMobileUrl;
window.forceReloadNewVersion = forceReloadNewVersion;

