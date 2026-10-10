'use strict';
// Zero dependency local HTTP server. Production on Netlify uses netlify/functions/*.mjs as functions.
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'public');
const dotenvPath = path.join(__dirname, '.env.local');
if (fs.existsSync(dotenvPath)) {
  fs.readFileSync(dotenvPath, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
  });
}
const generate = require('./api/generate');
const health = require('./api/health');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico':'image/x-icon' };
const server = http.createServer(async (req, res) => {
  res.status = (n) => { res.statusCode = n; return res; };
  res.json = (v) => { res.setHeader('Content-Type','application/json; charset=utf-8'); res.end(JSON.stringify(v)); return res; };
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/health') return health(req, res);
  if (pathname === '/api/generate') {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk.toString('utf8');
      if (raw.length > 15000) { res.status(413).json({error:'请求过大'}); return; }
    }
    try { req.body = JSON.parse(raw); } catch { return res.status(400).json({error:'JSON 格式错误。'}); }
    return generate(req, res);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode = 405; res.end('Method not allowed'); return; }
  const names = new Set(['/', '/index.html', '/styles.css', '/app.js', '/sample-report.js', '/assets/favicon.svg']);
  if (!names.has(pathname)) { res.statusCode = 404; res.end('Not found'); return; }
  const file = path.join(root, pathname === '/' ? 'index.html' : pathname.slice(1));
  res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control','no-cache');
  fs.createReadStream(file).pipe(res);
});
const port = Number(process.env.PORT) || 3000;
if (require.main === module) server.listen(port, '0.0.0.0', () => console.log(`\nBrandPilot AI is running at http://localhost:${port}\n`));
module.exports = server;
