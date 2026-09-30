// QA for the built site: internal links, #anchors, image files, JSON-LD, duplicate titles/descriptions. Run: node scripts/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['src', 'scripts', 'node_modules', '.git', 'assets', 'uploads'].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) pages.push(p);
  }
})(ROOT);

const urlToFile = u => {
  u = u.split('#')[0].split('?')[0];
  if (u === '/' || u === '') return path.join(ROOT, 'index.html');
  const c = [u.slice(1), u.slice(1) + '.html'].map(x => path.join(ROOT, x));
  return c.find(f => fs.existsSync(f) && fs.statSync(f).isFile());
};
const ids = {};
const idsOf = f => ids[f] ??= new Set([...fs.readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
const redirects = new Set((JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).redirects || []).map(r => r.source));

const errs = [], titles = new Map(), descs = new Map();
for (const f of pages) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const html = fs.readFileSync(f, 'utf8');
  const noindex = /name="robots" content="noindex/.test(html);
  const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1], d = (html.match(/name="description" content="([^"]*)"/) || [])[1];
  if (!t) errs.push(`${rel}: no <title>`); else if (!noindex) { if (titles.has(t)) errs.push(`${rel}: duplicate title with ${titles.get(t)}`); titles.set(t, rel); }
  if (!d) errs.push(`${rel}: no meta description`); else if (!noindex) { if (descs.has(d)) errs.push(`${rel}: duplicate description with ${descs.get(d)}`); descs.set(d, rel); }
  if (!/rel="canonical"/.test(html)) errs.push(`${rel}: no canonical`);
  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { errs.push(`${rel}: invalid JSON-LD (${e.message})`); } }
  // headings
  const hs = [...html.matchAll(/<h([1-6])\b/g)].map(m => +m[1]);
  for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) { errs.push(`${rel}: heading jumps h${hs[i - 1]} -> h${hs[i]}`); break; }
  // links
  for (const m of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(u)) continue;
    if (u.startsWith('#')) { if (u.length > 1 && !idsOf(f).has(u.slice(1))) errs.push(`${rel}: missing anchor ${u}`); continue; }
    if (!u.startsWith('/')) { errs.push(`${rel}: relative URL ${u}`); continue; }
    const target = urlToFile(u);
    if (!target) { if (!redirects.has(u.split('#')[0].split('?')[0])) errs.push(`${rel}: broken link ${u}`); continue; }
    const h = u.split('#')[1];
    if (h && target.endsWith('.html') && !idsOf(target).has(h)) errs.push(`${rel}: ${u} -> anchor #${h} not found`);
  }
}
console.log(`Checked ${pages.length} pages.`);
console.log(errs.length ? 'PROBLEMS:\n - ' + errs.join('\n - ') : 'No problems found.');
process.exitCode = errs.length ? 1 : 0;
