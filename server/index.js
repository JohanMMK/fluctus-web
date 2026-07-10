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
app.use(compression());
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
  app.use(express.static(DIST));
  // Nette 404 → val terug op de startpagina voor onbekende paden (marketing).
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not found' });
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.status(503).send('Frontend nog niet gebouwd — run `npm run build`.'));
}

app.listen(PORT, () => console.log(`[fluctus-web] luistert op :${PORT} (dist ${fs.existsSync(DIST) ? 'ok' : 'ontbreekt'})`));
