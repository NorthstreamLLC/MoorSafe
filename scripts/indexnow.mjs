// Tells Bing (and other IndexNow search engines) which pages changed.
// Run after a deploy:  node scripts/indexnow.mjs            (all pages in sitemap.xml)
//                      node scripts/indexnow.mjs /map /faq  (only these paths)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'moorsafe.org';
const KEY = 'c6268f928dd5029dca686da302dd5c4d'; // the file /c6268f928dd5029dca686da302dd5c4d.txt in the site root must contain exactly this key

const args = process.argv.slice(2);
const urls = args.length
  ? args.map(p => `https://${HOST}${p.startsWith('/') ? p : '/' + p}`)
  : [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${urls.length} URLs submitted, response ${res.status} ${res.statusText}`);
if (!res.ok) process.exit(1);
