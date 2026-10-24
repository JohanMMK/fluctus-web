// ── Fluctus web (P1) — unified Express-server op Railway ─────────────────────
// Serveert de gebouwde Vite-frontend (publieke pagina's + portal) én de API
// (offerte-flow + Odoo, contactformulier). Auth/RBAC leunt op de bestaande
// fluctus-proxy (9a) en Supabase; Odoo blijft de backoffice.

import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import offerteRouter from './routes/offerte.js';
import webhookRouter from './routes/webhook.js';
import contactRouter from './routes/contact.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 8080;

const app = express();
app.set('trust proxy', true);   // Railway-proxy → req.hostname uit X-Forwarded-Host (host-routing)
app.use(compression());

// ── Energie-Compas site (energie-compas.eu) ──────────────────────────────────
// De EC-site staat in dist/ec/ met internationale bestandsnamen (start/contact/login).
// Voor de EC-hosts serveren we die op de ROOT met clean URLs (/ → start, /contact, /login);
// alle andere hosts (o.a. fluctus.net, app.energie-compas.eu) houden de bestaande flow.
const EC_HOSTS = new Set(['energie-compas.eu', 'www.energie-compas.eu']);
app.use(express.json({ limit: '12mb' }));

// Publieke runtime-config voor de frontend (geen rebuild nodig bij env-wijziging).
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    fluctusProxyUrl: process.env.FLUCTUS_PROXY_URL || '',
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use('/api/offerte', offerteRouter);
app.use('/api/offerte', webhookRouter);   // POST /api/offerte/webhook
app.use('/api/contact', contactRouter);

// ── Statische frontend (Vite build) ──
if (fs.existsSync(DIST)) {
  const DIST_EC = path.join(DIST, 'ec');
  // 2026-10-09 (Johan): HTML-pagina's (o.a. /apps/ek.html, /apps/klantrapport.html, EC-site) NOOIT uit de browsercache
  // of back/forward-cache → altijd de laatst gedeployde versie en een vers dossier. Gehashte assets (/assets/…) blijven cachebaar.
  // send/express.static overschrijven een reeds gezette Cache-Control niet.
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/') && (req.path.endsWith('.html') || !path.extname(req.path))) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });
  // 2026-10-16 (Johan): MijnEC = het enige portaal. (a) app.energie-compas.eu (apps + klantlinks) toont nooit de Fluctus-site/portal:
  //   elk extensieloos pad, /index.html en /portal.html → www.energie-compas.eu (zelfde pad; /portal.html → /login).
  //   (b) Op de EC-hosts zelf: /portal.html → /login en /index.html → / (anders serveerde static de Fluctus-pagina's).
  app.use((req, res, next) => {
    const host = String(req.hostname || '').toLowerCase();
    if (req.path.startsWith('/api/')) return next();
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    if (host === 'app.energie-compas.eu') {
      if (req.path === '/portal.html') return res.redirect(302, 'https://www.energie-compas.eu/login');
      if (req.path === '/index.html') return res.redirect(302, 'https://www.energie-compas.eu/' + qs);
      if (!path.extname(req.path)) return res.redirect(302, 'https://www.energie-compas.eu' + req.path + qs);
    }
    if (EC_HOSTS.has(host)) {
      if (req.path === '/portal.html') return res.redirect(302, '/login');
      if (req.path === '/index.html') return res.redirect(302, '/' + qs);
    }
    next();
  });
  // 2026-10-24 (Johan): LINKEDIN-CAMPAGNE — /blog en /blog/<slug> server-side gevuld uit fluctus-proxy (GET /api/blog…),
  //   zodat LinkedIn de juiste titel/beeld toont (og-tags); /d/<code>/<post> = klik uit de ambassadeursmail → proxy
  //   (meet de klik) → LinkedIn met de tekst klaar. Enkel op de EC-hosts.
  const PROXY_URL = (process.env.FLUCTUS_PROXY_URL || 'https://lucid-amazement-production.up.railway.app').replace(/\/+$/, '');
  const EC_WWW = 'https://www.energie-compas.eu';
  const escH = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const absB = (b) => (!b ? `${EC_WWW}/ec-img/campagne/b00-basis.jpg` : (/^https?:/.test(b) ? b : EC_WWW + b));
  async function proxyJson(pad) {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 6000);
    try { const r = await fetch(PROXY_URL + pad, { signal: ac.signal, cache: 'no-store' }); const j = await r.json().catch(() => ({})); return { status: r.status, j }; }
    finally { clearTimeout(t); }
  }
  function blogPagina(v) {
    const f = path.join(DIST_EC, 'blog.html'); if (!fs.existsSync(f)) return null;
    let h = fs.readFileSync(f, 'utf8');
    const map = { __EC_TITEL__: escH(v.titel), __EC_BESCHRIJVING__: escH(v.beschrijving), __EC_OG_TITEL__: escH(v.ogTitel || v.titel), __EC_OG_BESCHRIJVING__: escH(v.beschrijving),
      __EC_OG_BEELD__: escH(absB(v.beeld)), __EC_OG_URL__: escH(v.url), __EC_H1__: escH(v.h1), __EC_KERN__: v.kern, __EC_INHOUD__: v.inhoud };
    for (const [k, w] of Object.entries(map)) h = h.split(k).join(w);
    return h;
  }
  const KERN_STD = 'Zon en wind leveren gratis energie. Wat ertussen staat, is ons net. Wie zijn aansluiting beter gebruikt, haalt meer energie uit minder vermogen: hij bespaart structureel, oogst stabiel rendement en maakt ruimte vrij voor al zijn buren. Jezelf helpen helpt iedereen.';
  app.use(async (req, res, next) => {
    const host = String(req.hostname || '').toLowerCase();
    if (!EC_HOSTS.has(host) || req.path.startsWith('/api/')) return next();
    const dm = req.path.match(/^\/d\/([A-Za-z0-9_-]{1,40})\/([A-Za-z0-9_-]{1,60})\/?$/);
    if (dm) return res.redirect(302, `${PROXY_URL}/api/c/${encodeURIComponent(dm[1])}/${encodeURIComponent(dm[2])}`);
    const bm = req.path.match(/^\/blog(?:\/([^\/]+))?\/?$/);
    if (!bm) return next();
    try {
      if (!bm[1]) {   // overzicht
        const { j } = await proxyJson('/api/blog');
        const lijst = (j && j.blogs) || [];
        const kern = escH((j && j.kern) || KERN_STD) + (lijst.some((b) => b.basis) ? ` <a href="/blog/${escH((lijst.find((b) => b.basis) || {}).slug)}">Lees de basis →</a>` : '');
        const inhoud = lijst.length
          ? '<div class="blog-lijst">' + lijst.map((b) => `<a class="blog-kaart" href="/blog/${encodeURIComponent(b.slug)}">${b.banner ? `<img src="${escH(b.banner)}" alt="" loading="lazy">` : ''}<div><h3>${escH(b.titel)}</h3><p>${escH(b.lead)}</p>${b.datum ? `<p class="dt">${escH(b.datum.split('-').reverse().join('/'))}</p>` : ''}</div></a>`).join('') + '</div>'
          : '<p>De eerste berichten verschijnen binnenkort.</p>';
        const html = blogPagina({ titel: 'Blog — Energie-Compas', beschrijving: 'Hoe je je aansluiting beter gebruikt: voor je eigen rendement en voor al je buren.', h1: 'Jezelf helpen helpt iedereen', url: `${EC_WWW}/blog`, beeld: '/ec-img/campagne/b00-basis.jpg', kern, inhoud });
        if (!html) return next();
        res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.send(html);
      }
      const slug = decodeURIComponent(bm[1]);
      const { status, j } = await proxyJson('/api/blog/' + encodeURIComponent(slug));
      if (status !== 200 || !j || !j.blog) {
        const html = blogPagina({ titel: 'Niet gevonden — Energie-Compas', beschrijving: '', h1: 'Dit bericht verschijnt binnenkort', url: `${EC_WWW}/blog`, beeld: '', kern: escH(KERN_STD), inhoud: '<p>Dit bericht is (nog) niet gepubliceerd.</p><p><a class="blog-terug" href="/blog">← Alle berichten</a></p>' });
        res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8'); return res.send(html || 'Niet gevonden');
      }
      const b = j.blog;
      const kern = escH(j.kern || KERN_STD) + (j.basis && j.basis !== b.slug ? ` <a href="/blog/${escH(j.basis)}">Lees de basis →</a>` : '');
      const inhoud = `<article class="blog-art">${b.banner ? `<img class="banner" src="${escH(b.banner)}" alt="">` : ''}${b.html || (b.lead ? `<p>${escH(b.lead)}</p>` : '')}`
        + `<div class="blog-cta"><a class="btn" href="/contact">Wat betekent dit voor jou? Vraag je gratis analyse</a><a class="btn ghost" href="/ambassadeur">Ben je adviseur? Word ambassadeur</a></div>`
        + `<p><a class="blog-terug" href="/blog">← Alle berichten</a></p></article>`;
      const html = blogPagina({ titel: `${b.titel} — Energie-Compas`, ogTitel: b.titel, beschrijving: b.lead || '', h1: b.titel, url: `${EC_WWW}/blog/${encodeURIComponent(b.slug)}`, beeld: b.banner, kern, inhoud });
      if (!html) return next();
      res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.send(html);
    } catch (e) {
      console.warn('[blog]', e.message);
      return next();
    }
  });
  // Host-routing voor de Energie-Compas-site: clean URLs op de root van energie-compas.eu.
  app.use((req, res, next) => {
    const host = String(req.hostname || '').toLowerCase();
    if (!EC_HOSTS.has(host)) return next();            // andere host → gewone Fluctus-flow
    if (req.path.startsWith('/api/')) return next();    // API ongemoeid
    if (!path.extname(req.path)) {                      // extensieloos pad → EC-pagina (clean URL)
      const rel = req.path.replace(/^\/+/, '').replace(/\/+$/, '');   // '', 'contact', 'fr', 'fr/contact'
      // Franstalige tak: /fr → fr/start, /fr/contact, /fr/login (map dist/ec/fr/)
      // 2026-10-10 (Johan): + Engelstalige tak /en (map dist/ec/en/), zelfde patroon als /fr.
      const taal = (rel === 'fr' || rel.startsWith('fr/')) ? 'fr' : ((rel === 'en' || rel.startsWith('en/')) ? 'en' : null);
      if (taal) {
        const sub = (rel === taal) ? 'start' : rel.slice(3);
        if (!sub.includes('..')) {
          const ff = path.join(DIST_EC, taal, sub + '.html');
          if (fs.existsSync(ff)) return res.sendFile(ff);
        }
        return res.sendFile(path.join(DIST_EC, taal, 'start.html'));   // onbekend → start in die taal
      }
      const name = (rel === '') ? 'start' : rel;
      if (!name.includes('..')) {
        const f = path.join(DIST_EC, name + '.html');
        if (fs.existsSync(f)) return res.sendFile(f);
      }
      return res.sendFile(path.join(DIST_EC, 'start.html'));   // onbekend → start
    }
    if (req.path.endsWith('.html')) {                   // expliciete .html → uit de EC-map
      const f = path.join(DIST_EC, path.basename(req.path));
      if (fs.existsSync(f)) return res.sendFile(f);
    }
    return next();                                      // assets (css/js/img/apps) → static(DIST)
  });
  app.use(express.static(DIST));
  // Nette 404 → val terug op de startpagina voor onbekende paden (marketing), host-bewust.
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not found' });
    const host = String(req.hostname || '').toLowerCase();
    if (EC_HOSTS.has(host)) {
      const relc = req.path.replace(/^\/+/, '');
      if (relc === 'fr' || relc.startsWith('fr/')) return res.sendFile(path.join(DIST_EC, 'fr', 'start.html'));
      if (relc === 'en' || relc.startsWith('en/')) return res.sendFile(path.join(DIST_EC, 'en', 'start.html'));
      return res.sendFile(path.join(DIST_EC, 'start.html'));
    }
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.status(503).send('Frontend nog niet gebouwd — run `npm run build`.'));
}

app.listen(PORT, () => console.log(`[fluctus-web] luistert op :${PORT} (dist ${fs.existsSync(DIST) ? 'ok' : 'ontbreekt'})`));
