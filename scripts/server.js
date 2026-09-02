#!/usr/bin/env node
/* server.js — minimal zero-dependency static file server for local / CI testing. */
const http = require('node:http');
const { readFile } = require('node:fs');
const { extname, join, normalize } = require('node:path');

const ROOT = join(__dirname, '..');
const PORT = process.env.PORT || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = normalize(join(ROOT, urlPath === '/' ? '/index.html' : urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`static server on http://127.0.0.1:${PORT}/`);
});
