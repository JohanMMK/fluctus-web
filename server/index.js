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
  // Host-routing voor de Energie-Compas-site: clean URLs op de root van energie-compas.eu.
  app.use((req, res, next) => {
    const host = String(req.hostname || '').toLowerCase();
    if (!EC_HOSTS.has(host)) return next();            // andere host → gewone Fluctus-flow
    if (req.path.startsWith('/api/')) return next();    // API ongemoeid
    if (!path.extname(req.path)) {                      // extensieloos pad → EC-pagina (clean URL)
      const rel = req.path.replace(/^\/+/, '').replace(/\/+$/, '');   // '', 'contact', 'fr', 'fr/contact'
      // Franstalige tak: /fr → fr/start, /fr/contact, /fr/login (map dist/ec/fr/)
      if (rel === 'fr' || rel.startsWith('fr/')) {
        const sub = (rel === 'fr') ? 'start' : rel.slice(3);
        if (!sub.includes('..')) {
          const ff = path.join(DIST_EC, 'fr', sub + '.html');
          if (fs.existsSync(ff)) return res.sendFile(ff);
        }
        return res.sendFile(path.join(DIST_EC, 'fr', 'start.html'));   // onbekend FR → FR-start
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
      return res.sendFile(path.join(DIST_EC, 'start.html'));
    }
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.status(503).send('Frontend nog niet gebouwd — run `npm run build`.'));
}

app.listen(PORT, () => console.log(`[fluctus-web] luistert op :${PORT} (dist ${fs.existsSync(DIST) ? 'ok' : 'ontbreekt'})`));
