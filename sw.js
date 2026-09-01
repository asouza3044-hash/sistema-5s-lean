// ============================================================================
// Service Worker - Portal 5S & Qualidade IMPAK TTO (PWA)
// ============================================================================

const CACHE_NAME = 'impaktto-5s-v1.0.2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/logo_impaktto.png',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Instalação do Service Worker e pré-cache dos assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usar cache.addAll tolerante a falhas pontuais
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn(`Falha no pré-cache de ${url}:`, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de Fetch
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Ignorar requisições não-GET
  if (req.method !== 'GET') {
    return;
  }

  // 2. Chamadas de API (Netlify Functions / Backend Neon): SEMPRE Network-First (dados dinâmicos)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Modo offline: não foi possível conectar ao servidor. Verifique a rede.',
            offline: true
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }

  // 3. Recursos estáticos locais (HTML, CSS, JS, Imagens, Fontes): Network First com Cache Fallback
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // Se a resposta for válida, atualiza o cache em segundo plano
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhar, busca no cache
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se for navegação de página e falhar tudo, retorna a página inicial
          if (req.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Conteúdo offline não disponível', { status: 503 });
        });
      })
  );
});
