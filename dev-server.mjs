import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const PORT = process.env.PORT || 8888;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.webmanifest': 'application/manifest+json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=UTF-8'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Endpoint informativo de rede para facilitar acesso no celular
  if (pathname === '/api/network-info') {
    const nets = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push({ interface: name, address: net.address });
        }
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ port: PORT, ips, primaryIp: ips[0]?.address || 'localhost' }));
    return;
  }

  // Handle Netlify Functions (/api/* or /.netlify/functions/*)
  const isFunction = pathname.startsWith('/.netlify/functions/') || pathname.startsWith('/api/');
  if (isFunction) {
    const fnName = pathname.replace(/^\/(\.netlify\/functions|api)\//, '').split('/')[0];
    const fnFile = path.join(__dirname, 'netlify', 'functions', `${fnName}.js`);

    if (!fs.existsSync(fnFile)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Função '${fnName}' não encontrada.` }));
      return;
    }

    try {
      // Read body if any
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const rawBody = Buffer.concat(buffers).toString('utf-8');

      // Convert query string parameters
      const queryStringParameters = {};
      for (const [k, v] of parsedUrl.searchParams.entries()) {
        queryStringParameters[k] = v;
      }

      // Convert headers to lowercase keys
      const headers = {};
      for (const [k, v] of Object.entries(req.headers)) {
        headers[k.toLowerCase()] = v;
      }

      const event = {
        httpMethod: req.method,
        path: pathname,
        queryStringParameters,
        headers,
        body: rawBody || null,
        isBase64Encoded: false
      };

      // Clear cache for live reload of functions
      const resolved = require.resolve(fnFile);
      delete require.cache[resolved];

      const mod = require(fnFile);
      const handler = mod.handler || mod.default;

      if (typeof handler !== 'function') {
        throw new Error(`Arquivo ${fnName}.js não exporta uma função 'handler' válida.`);
      }

      const result = await handler(event, {});
      const statusCode = result?.statusCode || 200;
      const respHeaders = result?.headers || {};
      
      // Default to JSON if not set and body looks like JSON
      if (!respHeaders['Content-Type'] && !respHeaders['content-type']) {
        respHeaders['Content-Type'] = 'application/json; charset=UTF-8';
      }

      res.writeHead(statusCode, respHeaders);
      res.end(result?.body || '');
      return;
    } catch (err) {
      console.error(`[Função ${fnName} Error]:`, err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Erro interno no servidor local' }));
      return;
    }
  }

  // Handle Static Files
  let safePath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.join(__dirname, safePath);

  // Security check: ensure within __dirname
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Acesso Negado');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Arquivo não encontrado: ' + safePath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    const headers = { 'Content-Type': contentType };

    // Service Worker header específico para permitir escopo raiz
    if (safePath === '/sw.js') {
      headers['Service-Worker-Allowed'] = '/';
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    res.writeHead(200, headers);
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Erro ao ler arquivo: ' + err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const localIps = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIps.push(net.address);
      }
    }
  }

  console.log(`\n=================================================`);
  console.log(`🚀 Portal 5S IMPAK TTO rodando com sucesso (PWA Ativo)!`);
  console.log(`💻 No Computador: http://localhost:${PORT}`);
  if (localIps.length > 0) {
    localIps.forEach(ip => {
      console.log(`📱 No Celular (mesmo Wi-Fi): http://${ip}:${PORT}`);
    });
  } else {
    console.log(`📱 No Celular: conecte na mesma rede Wi-Fi do computador`);
  }
  console.log(`📡 Backend Netlify Functions integrado ao Neon Postgres`);
  console.log(`=================================================\n`);
});

