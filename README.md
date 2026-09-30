# MoorSafe website

Static site. No framework and no runtime download: every page is plain HTML that search engines and social previews can read
directly. A small script (`assets/site.js`) adds the size picker, size helper, quantity stepper and form handling.

## Editing

| What | Where |
| --- | --- |
| Page content | `src/pages/*.html` (body fragments, each starts with a `<!--META ... -->` block: title, description, path, schema) |
| Nav, footer, head tags, structured data, sitemap | `scripts/build.mjs` |
| Prices, email, form / payment endpoints, analytics | `site.config.json` |
| Shared styles and interactions | `assets/site.css`, `assets/site.js` |
| Redirects, cache and security headers | `vercel.json` |

After any edit run:

```
node scripts/build.mjs      # regenerates the root *.html, sitemap.xml, robots.txt
node scripts/check.mjs      # broken links / anchors / images, JSON-LD, duplicate titles, heading order
node scripts/dev.mjs        # local preview at http://localhost:3000 (clean URLs like Vercel)
```

The generated `*.html` files at the root are committed; Vercel serves the folder as-is (no build command). `src/`, `scripts/`
and `site.config.json` are excluded from deploys by `.vercelignore`.

`info-packet.html` is the one hand-kept page (a printable document rendered by `support.js` + `doc-page.js`). It is `noindex`.
Its prices are still typed inside that file; keep them in sync with `site.config.json`.

## Going live checklist

- The site is quote-only and single-size: one 400 lb anchor, no prices shown. `purchase: false` hides Buy buttons and the checkout page; `showPrices: false` makes the build fail if a dollar amount appears on any page. The old 3-size checkout fragment is kept in `src/pages/checkout.html` and needs updating before `purchase` is turned back on.
- `formEndpoint`: a form service URL (for example a Formspree endpoint). Until set, forms open the visitor's email app.
- `paymentEndpoint`: a server route that creates a Stripe Checkout session from `{ size, quantity }` and returns `{ url }`.
  Until set, checkout sends an order request by email and the button reads "Send order request".
- `analytics`: set `vercel` to `true` (after enabling Web Analytics in Vercel) or fill in `gaId`, then rebuild.
- Email on the site is `hello@moorsafe.com`; the domain is `moorsafesolutions.com`. Make sure that mailbox exists.
- In Google Search Console, add the domain, submit `https://moorsafesolutions.com/sitemap.xml`.
- Not yet on the site (waiting on answers): social proof, warranty, privacy policy, terms, shipping/returns policy.

## Assets

- `assets/og-image.png` (1200×630 share card) is generated from `scripts/og.html`; `assets/favicon.png` from `scripts/favicon.html`.
  Regenerate with Chrome headless `--screenshot` against the dev server.
- `uploads/video_water.mp4` (39 MB) is the home hero and `uploads/hero-video.mp4` / `anchor-loop.mp4` are 13-15 MB each.
  Compressing them (target 3-5 MB each) is the biggest remaining page-speed win.
