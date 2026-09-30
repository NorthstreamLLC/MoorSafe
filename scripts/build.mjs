// Static site build: src/pages/**/*.html (body fragments) -> root *.html, plus sitemap.xml and robots.txt.
// Run:  node scripts/build.mjs        Output is committed; Vercel serves the folder as-is.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const cfg = JSON.parse(read('site.config.json'));
const SITE = cfg.siteUrl.replace(/\/$/, '');
const money = n => '$' + Number(n).toLocaleString('en-US');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const year = new Date().getFullYear();
const hash = f => crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 8);

/* ---------- navigation ---------- */
const NAV = [
  { k: 'solution', label: 'The Solution', href: '/solution#video' },
  { k: 'proof', label: 'Proof', href: '/solution#tests' },
  { k: 'pricing', label: 'Pricing', href: '/solution#buy' },
  { k: 'pros', label: 'For Pros', href: '/pros' },
  { k: 'faq', label: 'FAQ', href: '/faq' },
  { k: 'about', label: 'About', href: '/about' },
];
const MENU_EXTRA = [
  { k: 'blog', label: 'Journal', href: '/blog' },
  { k: 'contact', label: 'Contact', href: '/contact' },
];
const LOCAL = {
  index: { proof: '#proof', pricing: '#buy' },
  solution: { solution: '#video', proof: '#tests', pricing: '#buy' },
};
const navHtml = (active, name) => {
  const loc = LOCAL[name] || {};
  const a = (l, cls = '') => `<a href="${loc[l.k] || l.href}"${l.k === active ? ' aria-current="page"' : ''}${cls}>${l.label}</a>`;
  return `<nav class="nv" aria-label="Main"><div class="nv-pill">
  <a class="nv-logo" href="/" aria-label="MoorSafe home"><img src="/assets/logo-transparent.png" alt="MoorSafe" width="120" height="26"></a>
  <div class="nv-links">${NAV.map(l => a(l)).join('')}</div>
  <details class="nv-menu"><summary>Menu</summary><div class="nv-drop">${[...NAV, ...MENU_EXTRA].map(l => a(l)).join('')}</div></details>
  <a class="nv-buy" href="/checkout">Buy now</a>
</div></nav>`;
};
const footerHtml = () => `<footer style="background:#fff;padding:48px 24px 56px">
  <div style="max-width:1200px;margin:0 auto;border-top:1px solid #ECEDEE;padding-top:32px;display:grid;gap:28px;font-size:14px;color:#8A939D;font-weight:500">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap">
      <a href="/" aria-label="MoorSafe home"><img src="/assets/logo-transparent.png" alt="MoorSafe" width="103" height="22" style="height:22px;width:auto"></a>
      <nav aria-label="Footer" style="display:flex;gap:10px 24px;flex-wrap:wrap">
        <a href="/" style="color:#5A6673">Home</a><a href="/solution#video" style="color:#5A6673">The Solution</a><a href="/pros" style="color:#5A6673">For Pros</a><a href="/faq" style="color:#5A6673">FAQ</a><a href="/about" style="color:#5A6673">About</a><a href="/blog" style="color:#5A6673">Journal</a><a href="/contact" style="color:#5A6673">Contact</a><a href="/info-packet" style="color:#5A6673">Info packet</a><a href="mailto:${cfg.email}" style="color:#5A6673">${cfg.email}</a>
      </nav>
    </div>
    <div style="display:flex;justify-content:space-between;gap:12px 24px;flex-wrap:wrap"><span>© ${year} MoorSafe · Designed and made in Maine, USA · Patent pending</span><span>In memory of Capt. Gregory Smith, 1988–2025</span></div>
  </div>
</footer>`;

/* ---------- fragments ---------- */
const PAGE_SLUGS = { 'index.html': '/', 'solution.html': '/solution', 'about.html': '/about', 'blog.html': '/blog', 'checkout.html': '/checkout', 'info-packet.html': '/info-packet', 'pros.html': '/pros', 'faq.html': '/faq', 'contact.html': '/contact' };
const sizeRows = () => [300, 400, 500].map((w, i) => {
  const t = { 300: 'Boats up to ~30 ft', 400: 'Boats ~30–40 ft', 500: 'Boats 40 ft+ or exposed harbors' }[w];
  return `<button type="button" class="size-row${i === 0 ? ' is-on' : ''}" data-size="${w}" aria-pressed="${i === 0}"><span class="sz-l"><span class="sz-w">${w} lb</span><span class="sz-t">${t}</span></span><span class="sz-r"><span class="sz-p">${money(cfg.prices[w])}</span><span class="sz-dot" aria-hidden="true"></span></span></button>`;
}).join('\n        ');

const imgSize = f => {
  try {
    const b = fs.readFileSync(path.join(ROOT, f));
    if (b.slice(1, 4).toString() === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (b[0] === 0xff && b[1] === 0xd8) { let i = 2; while (i < b.length) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + b.readUInt16BE(i + 2); } }
  } catch { /* missing image: leave as is */ }
  return null;
};

const tok = html => html.replace(/{{price(300|400|500)}}/g, (_, w) => money(cfg.prices[w])).split('{{email}}').join(cfg.email);

function fix(html, { firstImgEager }) {
  html = html.replace(/<!--@sizes-->/g, sizeRows());
  html = html.replace(/\{\{price(300|400|500)\}\}/g, (_, w) => money(cfg.prices[w]));
  html = html.split('{{paymentNote}}').join(cfg.paymentEndpoint
    ? 'You’ll finish payment on our secure payment page. Card details are entered there, never on this site.'
    : 'Online payment is coming soon. Send your order request and we’ll confirm size, shipping and payment with you by email before anything ships.');
  html = html.split('{{submitLabel}}').join(cfg.paymentEndpoint ? 'Continue to secure payment' : 'Send order request');
  html = html.split('{{email}}').join(cfg.email).split('{{year}}').join(String(year)).split('{{site}}').join(SITE);
  html = html.replace(/(src|href|poster)="((?:assets|uploads)\/)/g, '$1="/$2');
  html = html.replace(/href="([a-z-]+)\.html([?#][^"]*)?"/g, (m, n, h = '') => {
    const s = PAGE_SLUGS[n + '.html']; if (!s) return m;
    return `href="${s}${h}"`;
  });
  let seen = 0;
  html = html.replace(/<img\b([^>]*)>/g, (m, a) => {
    const src = (a.match(/\ssrc="([^"]*)"/) || [])[1];
    if (!/\salt=/.test(a)) a += ' alt=""';
    if (src && src.startsWith('/') && !/\swidth=/.test(a)) { const d = imgSize(src.slice(1)); if (d) a += ` width="${d[0]}" height="${d[1]}"`; }
    if (!(firstImgEager && seen === 0) && !/\sloading=/.test(a)) a += ' loading="lazy" decoding="async"';
    seen++;
    return `<img${a}>`;
  });
  html = html.replace(/<video\b([^>]*)>/g, (m, a) => {
    a = a.replace(/\spreload="[^"]*"/, '');
    // Only the hero autoplays on load. Other videos start when scrolled near (see site.js) so they don't all download up
    // front, and they show their plain box background rather than a poster image while waiting.
    if (!/data-hero-video/.test(a)) a = a.replace(/\sautoplay(="[^"]*")?/, '').replace(/\sposter="[^"]*"/, '') + ' data-lazy-play';
    return `<video${a} preload="metadata">`;
  });
  return html;
}

/* ---------- structured data ---------- */
const orgNode = () => ({
  '@type': 'Organization', '@id': SITE + '/#org', name: 'MoorSafe', url: SITE + '/', email: cfg.email,
  logo: { '@type': 'ImageObject', url: SITE + '/assets/logo-transparent.png' },
  description: 'MoorSafe makes a mushroom mooring anchor with a conical, patent-pending design that prevents chain wrap. Designed and made in Maine.',
  address: { '@type': 'PostalAddress', addressRegion: 'ME', addressCountry: 'US' },
  founder: [{ '@type': 'Person', name: 'Scott Karkos' }, { '@type': 'Person', name: 'Captain Gregory Smith' }],
});
const productNode = () => ({
  '@type': 'Product', '@id': SITE + '/#product', name: 'MoorSafe Mooring Anchor',
  description: 'A mushroom mooring anchor with three symmetrical bars forming a cone above the stem, so mooring chain cannot wrap. Available in 300, 400 and 500 lb. Cast-iron base with welded steel bars. Designed and made in Maine.',
  image: SITE + cfg.ogImage, brand: { '@id': SITE + '/#org' }, material: 'Cast iron and steel', color: 'Safety orange',
  offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: String(cfg.prices[300]), highPrice: String(cfg.prices[500]), offerCount: 3, url: SITE + '/solution#buy' },
});
const crumbNode = (pageUrl, title, extra) => {
  const items = [{ name: 'Home', url: SITE + '/' }, ...(extra || []), { name: title, url: SITE + pageUrl }];
  return { '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })) };
};

/* ---------- head ---------- */
function headHtml(m, url, css, js) {
  const canon = SITE + (url === '/' ? '/' : url);
  const title = esc(m.title), desc = esc(m.description);
  const og = SITE + (m.ogImage || cfg.ogImage);
  const graph = [];
  if (url === '/') graph.push(orgNode(), { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'MoorSafe', publisher: { '@id': SITE + '/#org' } }, productNode());
  else graph.push({ ...orgNode() });
  for (const s of m.schema || []) graph.push(s === 'product' ? productNode() : s);
  if (url !== '/' && !m.noCrumbs) graph.push(crumbNode(url, m.crumb || m.title.split(' | ')[0].split(' — ')[0], m.crumbParents));
  const ld = tok(JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }));
  const an = cfg.analytics || {};
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canon}">
<meta name="robots" content="${m.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">
<meta name="theme-color" content="#0B1F33">
<meta property="og:site_name" content="MoorSafe">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="${m.ogType || 'website'}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${og}">
${m.ogImage ? '' : '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'}
<meta property="og:image:alt" content="${esc(m.ogAlt || 'The MoorSafe mooring anchor: a mushroom anchor with a three-bar cone that prevents chain wrap')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${og}">
${m.ogType === 'article' ? `<meta property="article:published_time" content="${m.published}">\n` : ''}<link rel="icon" href="/assets/favicon.png" type="image/png" sizes="512x512">
<link rel="apple-touch-icon" href="/assets/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${css}">
${(m.preload || []).map(p => `<link rel="preload" as="image" href="${p}" fetchpriority="high">`).join('\n')}
<script type="application/ld+json">${ld}</script>
${an.vercel ? '<script defer src="/_vercel/insights/script.js"></script>' : ''}${an.gaId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${an.gaId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${an.gaId}');</script>` : ''}`;
}

/* ---------- build ---------- */
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []);
}
const css = hash('assets/site.css'), js = hash('assets/site.js');
const pagesDir = path.join(ROOT, 'src', 'pages');
const sitemap = [];
const problems = [];
for (const file of walk(pagesDir)) {
  const rel = path.relative(pagesDir, file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');
  const mm = raw.match(/^<!--META\s*([\s\S]*?)-->\s*/);
  if (!mm) { problems.push(rel + ': missing META block'); continue; }
  const meta = JSON.parse(mm[1]);
  const name = rel.replace(/\.html$/, '');
  const url = meta.path || (name === 'index' ? '/' : '/' + name);
  const body = fix(raw.slice(mm[0].length), { firstImgEager: !!meta.eagerFirstImage });
  const active = meta.nav || name.split('/')[0];
  const mobileBar = ''; // the home page fragment carries its own #mobile-buy bar
  const clientCfg = JSON.stringify({ email: cfg.email, prices: cfg.prices, formEndpoint: cfg.formEndpoint, paymentEndpoint: cfg.paymentEndpoint });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${headHtml(meta, url, css, js)}
</head>
<body${meta.bodyClass ? ` class="${meta.bodyClass}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
${navHtml(active, name)}
<main id="main">
${body}
</main>
${footerHtml()}${mobileBar}
<script>window.MOORSAFE=${clientCfg};</script>
<script src="/assets/site.js?v=${js}" defer></script>
</body>
</html>
`;
  // sanity checks
  const h1s = (body.match(/<h1\b/g) || []).length;
  if (h1s !== 1) problems.push(`${rel}: ${h1s} <h1> elements (want exactly 1)`);
  if (meta.title.length > 65) problems.push(`${rel}: title is ${meta.title.length} chars (>65)`);
  if (meta.description.length < 70 || meta.description.length > 165) problems.push(`${rel}: description is ${meta.description.length} chars`);
  const noAlt = (body.match(/<img\b(?![^>]*\salt=")[^>]*>/g) || []).length; if (noAlt) problems.push(`${rel}: ${noAlt} <img> without alt`);
  if (/\{\{/.test(html)) problems.push(`${rel}: unresolved {{ }} token`);
  const out = path.join(ROOT, name + '.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  if (!meta.noindex) sitemap.push({ url, lastmod: meta.published || meta.modified, priority: meta.priority });
}

const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  sitemap.sort((a, b) => a.url.length - b.url.length).map(s => `  <url><loc>${SITE}${s.url === '/' ? '/' : s.url}</loc>${s.lastmod ? `<lastmod>${s.lastmod}</lastmod>` : ''}${s.priority ? `<priority>${s.priority}</priority>` : ''}</url>`).join('\n') + `\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${sitemap.length} indexable pages + noindex pages.`);
if (problems.length) { console.log('\nCHECKS:\n - ' + problems.join('\n - ')); process.exitCode = 0; }
