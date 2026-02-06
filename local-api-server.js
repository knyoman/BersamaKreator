import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { onRequest as aiMatch } from './node-functions/ai-match/index.js';

// Polyfill for Context
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple .env parser
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      env[key.trim()] = values.join('=').trim();
    }
  });
  return env;
}

const env = { 
    ...loadEnv('./.env'), 
    ...loadEnv('./.env.local') 
};

// Create Server
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  console.log(`[Request] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Relaxed matching (ignores query params or trailing slash)
  if ((req.url === '/ai-match' || req.url.startsWith('/ai-match?')) && req.method === 'POST') {
    try {
      // Collect body
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const bodyText = Buffer.concat(buffers).toString();
      
      // Mock Context object like EdgeOne
      const context = {
        request: {
          method: req.method,
          headers: {
            get: (name) => req.headers[name.toLowerCase()]
          },
          json: async () => JSON.parse(bodyText || '{}')
        },
        env: env
      };

      // Call Function
      const response = await aiMatch(context);
      
      // Send Response
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      const responseText = await response.text();
      res.end(responseText);

    } catch (e) {
      console.error(e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  } else {
    // Debugging 404
    console.log(`[404] Route not matched: ${req.url}`);
    res.writeHead(404);
    res.end('Not Found. Try POST /ai-match');
  }
});

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`\n🚀 Local Testing Server running at http://localhost:${PORT}`);
  console.log(`👉 Endpoint: POST http://localhost:${PORT}/ai-match`);
});
