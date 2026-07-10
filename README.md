# Fluctus web (P1) — publieke site + app-portal + offerte-automatisering

Unified app op **Railway**: serveert de publieke pagina's én het app-portal, met
de **Academy/Supabase-login** als toegangspoort en een **RBAC-launcher** die enkel
toont waar je recht op hebt (bouwt voort op het bestaande 9a-model). De
**offerte-flow** duwt naar **Odoo** (backoffice) volgens spec §5–6.

## Stack
- **Vite** (multi-page) → `dist/` · **Express** (`server/`) serveert `dist/` + de API.
- **Supabase** = auth (reuse Academy) + audit-trail van offertes.
- **fluctus-proxy (9a)** = RBAC: `POST /api/app-access/check` per app.
- **Odoo** = res.partner / sale.order (1 EAN) / account.move + betaallink (Mollie/Bancontact).
- **Brevo** = transactionele mail (aanvaarding / herinnering / betaald).

## Structuur
```
index/oplossingen/over-ons/contact.html   publieke pagina's (design + fluctus.css)
portal.html + src/portal.js               login-gate + RBAC-launcher + offerte-flow
src/site.js                               nav "Mijn Fluctus" + contactformulier
server/index.js                           Express: dist + /api
server/routes/offerte.js                  §5–6 aanvaarden + status
server/routes/webhook.js                  betaal-terugkoppeling → "betaald"
server/routes/contact.js                  contact → Supabase/Brevo/(crm.lead)
server/lib/odoo.js|supabase.js|brevo.js   integraties
```

## Lokaal
```bash
npm install
cp .env.example .env      # vul in
npm run dev               # vite (5173) + express (8080), /api geproxied
```

## Build + deploy (Railway)
```bash
npm run build             # → dist/
npm start                 # express serveert dist/ + api op $PORT
```
Zet alle variabelen uit `.env.example` als Railway-variabelen. `dist/` wordt in
de buildstap gegenereerd (Railway: build command `npm run build`, start `npm start`).

## Supabase-tabellen (SQL)
```sql
create table if not exists offertes (
  aanbod_id text primary key,
  product text, ean text, status text default 'aangeboden',
  klant_email text, klant_naam text, klant_vat text, pad text,
  aanvaard_documenthash text, aanvaard_ip text, aanvaard_tijdstip timestamptz,
  aanvaard_user_id uuid,
  odoo_partner_id bigint, odoo_order_id bigint, odoo_invoice_id bigint,
  betaallink text, aangemaakt_op timestamptz default now()
);
create table if not exists contact_leads (
  id bigint generated always as identity primary key,
  naam text, email text, telefoon text, bedrijf text, focus text, bericht text,
  bron text, aangemaakt_op timestamptz default now()
);
```
(Service-role schrijft server-side; RLS naar wens — de anon-key krijgt geen schrijfrecht.)

## Openstaande integratiestappen (bewust nog niet ingevuld — spec-conform)
- **Odoo:** voer `ODOO-SETUP-CHECKLIST.md` uit en vul de ID's/keys in.
- **App-inbedding (workflow-taak):** de launcher-tegels wijzen naar `/apps/<id>.html`.
  De eigenlijke inbedding van de **simulator** (nu Odoo-HTML-blok) in deze app is de
  resterende stap uit de Project-workflow rond app-bereikbaarheid + plaatsing.
- **Domein:** later (bouw draait voorlopig op de Railway-URL).
- **Brevo-templates:** template-ID's invullen voor de 3 triggers.
