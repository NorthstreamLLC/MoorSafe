// Local preview server that behaves like Vercel with cleanUrls (/solution -> solution.html). Usage: node scripts/dev.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.ico': 'image/x-icon' };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/') && p.length > 1) p = p.slice(0, -1);
  if (p === '/favicon.ico') p = '/assets/favicon.png';
  const cands = p === '/' ? ['index.html'] : [p.slice(1), p.slice(1) + '.html', p.slice(1) + '/index.html'];
  const file = cands.map(c => path.join(ROOT, c)).find(f => f.startsWith(ROOT) && fs.existsSync(f) && fs.statSync(f).isFile());
  if (!file) { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(fs.existsSync(path.join(ROOT, '404.html')) ? fs.readFileSync(path.join(ROOT, '404.html')) : 'Not found'); return; }
  const size = fs.statSync(file).size, type = TYPES[path.extname(file)] || 'application/octet-stream';
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Number(range[2]) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(file).pipe(res);
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
