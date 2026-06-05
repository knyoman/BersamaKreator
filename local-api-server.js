import http from 'http';
import fs from 'fs';
import { onRequest as adCopyAgent } from './node-functions/ad-copy-agent/index.js';
import { onRequest as aiMatch } from './node-functions/ai-match/index.js';
import { onRequest as competitorAnalysisAgent } from './node-functions/competitor-analysis-agent/index.js';
import { onRequest as contentStrategyAgent } from './node-functions/content-strategy-agent/index.js';
import { onRequest as emailCampaignAgent } from './node-functions/email-campaign-agent/index.js';
import { onRequest as icpAgent } from './node-functions/icp-agent/index.js';
import { onRequest as influencerAiAssistant } from './node-functions/influencer-ai-assistant/index.js';
import { onRequest as marketingOpsAgent } from './node-functions/marketing-ops-agent/index.js';
import { onRequest as marketResearchAgent } from './node-functions/market-research-agent/index.js';
import { onRequest as socialPostAgent } from './node-functions/social-post-agent/index.js';

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;

    const equalsIndex = trimmedLine.indexOf('=');
    if (equalsIndex === -1) return;

    const key = trimmedLine.substring(0, equalsIndex).trim();
    const value = trimmedLine.substring(equalsIndex + 1).trim();
    if (key) env[key] = value;
  });

  return env;
}

const env = {
  ...loadEnv('./.env'),
  ...loadEnv('./.env.local'),
};

const PORT = Number(process.env.PORT || 8080);
const HOST = '127.0.0.1';
const LOCAL_API_ORIGIN = `http://${HOST}:${PORT}`;
const MAX_LOCAL_BODY_BYTES = 16 * 1024;
const LOCAL_ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
const LOCAL_ROUTES = new Map([
  ['/ad-copy-agent', adCopyAgent],
  ['/ai-match', aiMatch],
  ['/competitor-analysis-agent', competitorAnalysisAgent],
  ['/content-strategy-agent', contentStrategyAgent],
  ['/email-campaign-agent', emailCampaignAgent],
  ['/icp-agent', icpAgent],
  ['/influencer-ai-assistant', influencerAiAssistant],
  ['/marketing-ops-agent', marketingOpsAgent],
  ['/market-research-agent', marketResearchAgent],
  ['/social-post-agent', socialPostAgent],
]);
const getRouteLabels = () => Array.from(LOCAL_ROUTES.keys()).map((routePath) => `POST ${routePath}`);

const isLoopbackOrigin = (origin) => {
  try {
    const parsedOrigin = new URL(origin);
    return ['localhost', '127.0.0.1', '::1'].includes(parsedOrigin.hostname);
  } catch (error) {
    return false;
  }
};

const getCorsOrigin = (req) => {
  const origin = req.headers.origin;
  return LOCAL_ALLOWED_ORIGINS.has(origin) || isLoopbackOrigin(origin)
    ? origin
    : 'http://localhost:3000';
};

const getLocalRouteHandler = (req) => {
  const requestUrl = new URL(req.url, 'http://localhost');
  const normalizedPath = requestUrl.pathname.replace(/\/$/, '') || '/';
  return LOCAL_ROUTES.get(normalizedPath);
};

const collectRequestBody = async (req) => {
  const buffers = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_LOCAL_BODY_BYTES) {
      throw new Error('Ukuran request terlalu besar.');
    }

    buffers.push(chunk);
  }

  return Buffer.concat(buffers).toString();
};

const createFunctionRequest = (req, bodyText) => {
  const requestHeaders = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => requestHeaders.append(key, item));
      return;
    }

    if (value) {
      requestHeaders.set(key, value);
    }
  });

  return new Request(`${LOCAL_API_ORIGIN}${req.url}`, {
    method: req.method,
    headers: requestHeaders,
    body: bodyText || undefined,
  });
};

const sendFunctionResponse = async (res, response) => {
  const headers = Object.fromEntries(response.headers.entries());
  const responseText = await response.text();

  res.writeHead(response.status, headers);
  res.end(responseText);
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  console.log(`[local-api] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      routes: getRouteLabels(),
    }));
    return;
  }

  const routeHandler = getLocalRouteHandler(req);

  if (routeHandler && req.method === 'POST') {
    try {
      const bodyText = await collectRequestBody(req);

      const response = await routeHandler({
        request: createFunctionRequest(req, bodyText),
        env,
      });

      await sendFunctionResponse(res, response);
    } catch (error) {
      console.error('[local-api] Request gagal:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Request gagal diproses.' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end(`Endpoint tidak ditemukan. Gunakan ${getRouteLabels().join(', ')}, atau GET /health`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${HOST}:${PORT} sudah dipakai proses lain. Hentikan proses lama di port ${PORT}, lalu jalankan ulang npm run dev:all.`);
    process.exit(1);
  }

  console.error('[local-api] Server gagal berjalan:', error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Server testing lokal berjalan di http://${HOST}:${PORT}`);
  getRouteLabels().forEach((routeLabel) => {
    const [, routePath] = routeLabel.split(' ');
    console.log(`Endpoint: POST http://${HOST}:${PORT}${routePath}`);
  });
  console.log(`Health check: GET http://${HOST}:${PORT}/health`);
});
