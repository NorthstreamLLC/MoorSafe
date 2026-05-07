# MoorSafe — Website

A six-page marketing site for MoorSafe, the patent-pending Maine-built mooring anchor.

## Pages

- `index.html` — Home (hero with self-hosted video, problem framing, product preview, test results, Made in Maine, CTA)
- `product.html` — The Anchor (showcase, how it works, specs)
- `why.html` — Why MoorSafe (chain wrap problem, consequences, full test results)
- `about.html` — About (founder Scott Karkos, Captain Smith memorial, team, Maine roots)
- `blog.html` — Journal (placeholder cards for future posts)
- `contact.html` — Contact (form + direct contact info)

## Design system

Modern Maine-pride craftsmanship aesthetic:

- **Background:** warm cream (`#F5EFE3`) with subtle linen texture
- **Primary navy:** deep harbor (`#0E2436`)
- **Accents:** manila rope (`#B68A4E`), buoy red (`#B43A2D`), sea green (`#2D6A77`)
- **Typography:** Playfair Display for headlines (classic editorial serif), Inter for body, Source Serif for blockquotes

All design tokens live at the top of `styles.css` under `:root` — change colors in one place and they cascade everywhere.

## Assets you need to drop into `assets/`

The pages reference these files. Save real photos with these exact filenames so they "just work":

| Filename | Where it appears | Notes |
|---|---|---|
| `logo.png` | Browser tab favicon | Square logo, ideally transparent PNG, 256×256+ |
| `hero-poster.jpg` | Home hero (shown while video loads) | Wide landscape, 1920×1080+ recommended |
| `hero-video.mp4` | Home hero background | Compress hard — aim for under 6 MB. Will move to YouTube once domain is sorted. |
| `anchor-product.jpg` | Home + product preview | The MoorSafe anchor on white or in studio lighting |
| `anchor-hero.jpg` | Product page large showcase | Best product shot you have, landscape 16:9 |
| `anchor-detail.jpg` | Product page specs section | Close-up of the three-bar geometry |
| `chain-wrap-1.jpg` | Why MoorSafe page | The "before" — a chain wrapped around a traditional stem. Most powerful photo on the site. |
| `maine-shop.jpg` | Home Made-in-Maine section | Manufacturing / workshop / craftsmanship shot |
| `scott-portrait.jpg` | About page founder | Scott Karkos headshot |
| `captain-smith.jpg` | About page memorial | Captain Smith photo — handle with care |

Drop them straight into `Moorsafe Website/assets/` with the filenames above. If your photo has a different name, either rename it or tell me what it's actually called.

## Video hosting (interim)

The hero is set up for a **self-hosted MP4** (`assets/hero-video.mp4`) since you don't have a domain yet. Once you've got the domain and YouTube channel set up, we'll swap the `<video>` tag for a YouTube `<iframe>` — it's a 30-second swap. For now:

- Compress aggressively (HandBrake "Web Optimized" preset, or [bitmovin.com](https://bitmovin.com/) free encoder) — target 5–8 MB
- Keep it short (15–30 seconds works best for autoplay loops)
- No audio (it's muted on autoplay anyway, and silence saves bytes)

## Preview locally

Double-click `index.html` and it'll open in your browser. For the video to autoplay reliably, run a local server:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Things to swap before launch

These are placeholders the site uses until you give me the real values:

- `hello@moorsafe.com` — replace once you have a real email address
- "Maine, USA" — replace with city/town once you're comfortable making it public
- Team bios on `about.html` — currently shows just initials and names; we'll add real photos and bios when you're ready
- Blog post stubs — currently 6 "Coming soon" cards. We'll write real ones when there's news.

## Deploying when you're ready

Same setup as Jill's site:

1. Buy the domain (you mentioned waiting — common options: GoDaddy, Cloudflare, Namecheap. Cloudflare is the cleanest if you don't need their other services.)
2. Push this folder to a new GitHub repo (`NorthstreamLLC/moorsafe-website` or similar)
3. Connect Vercel to the repo
4. Add the domain in Vercel, copy DNS records to your registrar
5. SSL provisions automatically; site is live

If you want to host this locally for now and only deploy once it's polished, that's totally fine — everything will keep working when we eventually deploy.
