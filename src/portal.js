// portal.js v1.24.0 — 2026-10-24 — tegel «Campagne LinkedIn» voor alle managers (managerOnly; vlag alleenVoor blijft beschikbaar).
// portal.js v1.23.0 — 2026-10-24 — tegel «Campagne LinkedIn» enkel voor oekene@gmail.com en patrick@energie-compas.eu (vlag alleenVoor).
// portal.js v1.22.0 — 2026-10-24 — tegel «Campagne LinkedIn» (📅 /apps/campagne-li.html, managers; server ≥ 15.351.0).
// portal.js v1.21.0 — 2026-10-20 — «Mijn klanten» en «EnergieKompas» enkel nog voor managers (kwamen mee via de toegang energiekompas van Energie-Compas).
// portal.js v1.20.1 — 2026-10-16 — tegel 'gemeenteplan' heet nu «Lead Generator» (app_id/URL ongewijzigd); log-tegel «Lead Generator — opvolging». portal.js v1.20.0 — 2026-10-16 — Gemeenteplan = Lead Generator (kaart per gemeente i.p.v. mail) + managerOnly-tegel opvolging (/apps/leadgen-log.html). portal.js v1.19.1 — 2026-10-16 — tegel 'Contracten' enkel voor oekene@gmail.com. portal.js v1.19.0 — 2026-10-16 — managerOnly-tegel 'contracten' (📝 Contracten → /apps/contracten.html). portal.js v1.18.0 — 2026-10-16 — SNELLER INLOGGEN: tegels uit de laatste sessie meteen tonen (localStorage per gebruiker), één POST /api/app-access/bulk i.p.v. 1 check per tegel (fallback op de oude checks), render niet opnieuw bij INITIAL_SESSION/TOKEN_REFRESHED (zelfde gebruiker), config + Supabase-lib parallel laden. portal.js v1.17.0 — 2026-10-15 — manager-portal: niet-actieve tegels (Mijn klanten, EnergieKompas, Academy, Kamino, Laadplein, Thuisladen, EPC-campagne) onderaan onder een lijn «Minder gebruikt», gedempt; Academy niet meer automatisch (per gebruiker toe te kennen); gatedBy-tegels (Energie-Compas, Mijn klanten, Laadplein) ook apart toe te kennen. portal.js v1.16.0 — 2026-10-12 — managerOnly-tegel 'campagne' (📣 EPC-campagne → /apps/campagne.html). v1.15.0 — 2026-10-11 — tegel 'hulp' toont het aantal hulpvragen dat nog beantwoord moet worden (rode teller, via /api/ek/hulp-overzicht). v1.14.0 — 2026-10-11 — managerOnly-tegel 'hulp' (🙋 Hulpvragen → /apps/hulp.html). v1.13.0 — 2026-10-11 — managerOnly-tegel 'demo' (🎬 Demo → /apps/demo.html). v1.12.0 — 2026-09-26 (Europe/Brussels) — tegel 'Mijn klanten' (adviseur.html); + tegel 'Energie-Compas' (ek.html)
// ── Portaal: Academy/Supabase-login + RBAC-launcher + offerte-flow ───────────
// CHANGELOG (nieuwste bovenaan):
// v1.11.0 — 2026-09-23 — nieuwe tegel 'ek' (📊 Energie-Compas) → /apps/ek.html?prep=1: de snelle energie-analyse
//          met adviseur-link (deel een URL waarmee de klant het resultaat direct ziet). gatedBy:'energiekompas'
//          → zelfde toegang als de EnergieKompas-tegel, geen aparte app_id/grant. Additief; RBAC-filter ongewijzigd.
// v1.10.0 — 2026-09-22 — nieuwe managerOnly-tegel 'profiel-import' (📈 Profiel-import) → /apps/profiel-import.html:
//          verbruiks-/injectieprofiel (CSV/Excel, elk formaat) uploaden bij een FLX-project → gemeten profiel met
//          dekkingslabel (server v15.159.0). Additief: enkel een catalogus-rij bij; RBAC-filter ongewijzigd.
// v1.9.0 — 2026-09-14 — nieuwe managerOnly-tegel 'projecten' (📁 Projecten) → /apps/projecten.html: overzicht van
//          ALLE projecten met status/volgende-actie + archiveren. Additief: enkel een catalogus-rij bij; RBAC ongewijzigd.
// v1.8.0 — 2026-08-27 — Fase 3: nieuwe managerOnly-tegel 'mandaten' (🗂️ Mandaten) → /apps/mandaten.html,
//          manager-overzicht van de mandaat-wachtrij (status per EAN + adres-bevestigingen voor nazicht).
//          Additief: enkel een catalogus-rij bij; RBAC-filter (managerOnly) ongewijzigd.
// v1.7.0 — 2026-08-26 — Fase 2b (Johan-correctie). Nieuwe tegel 'energiekompas' (partner-gerichte schil,
//          particulier|bedrijf). Een partnermanager krijgt van de proxy (v15.95.0) automatisch app-toegang
//          tot ENKEL EnergieKompas → dat is de enige tool-tegel die hij ziet. De losse interne tools
//          (simulator/laadplein/kamino/thuisladen) verschijnen NIET meer automatisch voor die rol.
//          LET OP: /apps/energiekompas.html is de Fase 4-schil; er staat nu een holding-pagina zodat de
//          tegel niet in een 404 loopt.
// v1.6.0 — 2026-08-26 — Fase 2b (rollen & toegang). De launcher filtert nu expliciet op de nieuwe rollen:
//          • manager        → alle tegels (ongewijzigd).
//          • partnermanager → automatisch app-toegang via de proxy (komt via de gewone `verleend`-weg
//            binnen). Gebruikers (managerOnly) + Fluctus-interne apps blijven verborgen.
//          • adviseur       → zoals seller: enkel toegekende tools (grant-gebaseerd via user_app_access).
//          • klant          → GEEN tool-tegels. Een klant hoort in de scoped project-deeplink (Fase 2c),
//            niet in de tool-launcher; defensief tonen we hem enkel de 'altijd'-tegels (Academy).
//          Additief: enkel de filter in toegankelijkeApps() kreeg de klant-uitsluiting; geen andere wijziging.
// v1.5.0 — 2026-08-22 23:45 — Laadplein-tegel: 2e ronde knop 'W' (Wattkraft) links naast de bestaande info-'i'.
//          i = Jacops-video, W = Wattkraft-video. Additief: velden video2/video2Label/video2Title in de catalog,
//          extra knop-blok in renderLauncher() + .tile-info2-styling in ensureVideoUI(). i-logica ongewijzigd.
//          Wattkraft-video verwacht als Laadplein_WATTKRAFT.mp4 in JohanMMK/jacops-presentatie@main (jsDelivr).
// v1.4.x — 22-08 (Johan): tegelnaam "Betalend laadplein" → "Laadplein"; 23-08: productvideo achter info-i op
//          Laadplein + EIGEN toegangsrecht 'betaalplein' (gatedBy:'simulator' verwijderd).
// 22-08 (Johan): tegelnaam "Betalend laadplein" → "Laadplein". Interne id ('betaalplein') + flow (?flow=betaalplein) ongewijzigd.
// 21-08: Nieuwe tegel "Betalend laadplein" (id 'betaalplein') na Simulator → opent
//        /apps/simulator.html?flow=betaalplein (gefocuste flow: enkel betaalplein-rapport + kabeltracé).
//        Nieuw vlag gatedBy:'simulator' → de tegel volgt exact de toegang van de Simulator (managers altijd,
//        sellers zodra Simulator-toegang), zonder aparte app_id/proxy-grant. echte-filter sluit gatedBy-tegels
//        uit van de app-access/check; toegankelijkeApps() honoreert gatedBy.
// 18-08: Thuisladen-tegel heeft rechtsboven een info-i die de productvideo (JACOPS/E+Drive) in een
//        modal opent en start. Video-URL via jsDelivr uit repo JohanMMK/jacops-presentatie@main.
//        Additief: ensureVideoUI()/openVideoModal()/closeVideoModal() + 'video'-veld in de catalog.
// 16-08: Thuisladen-tegel toegevoegd aan APP_CATALOG (app_id 'thuisladen' → /apps/thuisladen.html),
//        net na Simulator. Gewone grantbare app: managers zien ze meteen, sellers via user_app_access.
// 26-07: Kamino-tegel toegevoegd aan APP_CATALOG (app_id 'kamino' → /apps/kamino.html).
//        Managers zien ze meteen (impliciet alle apps); sellers via een user_app_access-rij.
// Bouwt voort op het bestaande 9a-toegangsmodel: de fluctus-proxy valideert de
// Supabase-JWT en checkt user_app_access via POST /api/app-access/check.
// Niet-toegankelijke apps worden VERBORGEN (geen disabled).

const $ = (id) => document.getElementById(id);

// App-catalogus = de 9a-apps. url is configureerbaar; de eigenlijke inbedding
// van de simulator in deze app is de resterende integratiestap (workflow-taak).
// Vlaggen:
//   altijd:true      → tegel altijd zichtbaar voor elke ingelogde gebruiker
//                      (geen app-access/check nodig).
//   managerOnly:true → tegel enkel voor managers (role==='manager').
//   extern:true      → opent in een nieuw tabblad (externe site).
// De 'echte' tools (kamino/simulator/gemeenteplan/thuisladen) worden per gebruiker
// gefilterd via de fluctus-proxy /api/app-access/check.
// Volgorde van de tegels op Mijn Fluctus (Johan 06-08):
//   1 Academy · 2 Energiemarkt · 3 Lead Generator (gemeenteplan) · 4 Kamino · 5 Simulator · 6 Thuisladen · 7 Gebruikers
const MGR_ENKEL = new Set(['adviseur', 'energiekompas']);   /* v1.21.0: oude tegels, niet voor adviseurs */
const APP_CATALOG = [
  { id: 'academy',     naam: 'Fluctus Academy',  ico: '🎓', beschrijving: 'Opleiding, modules en certificaten.', url: '/apps/academy.html' },   // v1.17.0 (Johan 15-10): niet meer automatisch — per gebruiker toe te kennen (Gebruikers-app)
  // Energiemarkt = gewone app: managers zien ze automatisch, verkopers enkel na
  // toekenning via de Gebruikers-tegel (app_id 'energiemarkt'). Ze werkt de
  // gedeelde marktdata bij die de simulator gebruikt.
  { id: 'energiemarkt', naam: 'Energiemarkt',    ico: '📈', beschrijving: 'Marktdata (spot & onbalans) — werkt de simulator-data bij.', url: '/apps/energiemarkt.html' },
  { id: 'gemeenteplan', naam: 'Lead Generator', ico: '🎯', beschrijving: 'Kies een gemeente → kaart met bedrijfsparkings en middenspanningscabines om nieuwe leads te vinden.', url: '/apps/gemeenteplan.html' },
  // EnergieKompas = de partner-gerichte schil (particulier | bedrijf, thema per partner). Een partnermanager
  // krijgt van de proxy (v15.95.0) automatisch toegang tot ENKEL deze app_id → het is de enige tool die hij ziet.
  // Managers zien ze impliciet; adviseurs/sellers enkel na toekenning. De onderliggende pagina is de Fase 4-schil.
  { id: 'energiekompas', naam: 'EnergieKompas',  ico: '🔆', beschrijving: 'Uw energie-advies in één schil: particulier of bedrijf → besparing, rendement en advies.', url: '/apps/energiekompas.html' },
  // v1.11.0 (23-09): Energie-Compas (ek.html) — de snelle energie-analyse. Opent in adviseur-prep (?prep=1): reken
  // door en kopieer een link waarmee de klant het resultaat DIRECT ziet (niet opnieuw uitrekenen). gatedBy:'energiekompas'
  // → exact dezelfde toegang als de EnergieKompas-tegel (managers + partnermanagers auto + toegekende adviseurs),
  // geen aparte app_id/proxy-grant nodig. Additief.
  { id: 'ek',          naam: 'Energie-Compas',   ico: '📊', beschrijving: 'Snelle energie-analyse → besparing & rendement in één scherm, met adviseur-link om het resultaat te delen.', url: '/apps/ek.html?prep=1', gatedBy: 'energiekompas' },
  // v1.12.0 (26-09): Mijn klanten (adviseur.html) — de adviseur nodigt klanten uit; zij sturen hun factuur → automatisch
  //   aan de adviseur gekoppeld. Zelfde toegang als Energie-Compas (managers + toegekende adviseurs).
  { id: 'adviseur',    naam: 'Mijn klanten',     ico: '👥', beschrijving: 'Nodig klanten uit voor een energie-analyse. Zij sturen hun factuur en worden automatisch aan u gekoppeld.', url: '/apps/adviseur.html', gatedBy: 'energiekompas' },
  { id: 'kamino',      naam: 'Kamino',           ico: '🧭', beschrijving: '4 vragen → antwoord + rapport. Uw pad naar maximale elektrificatie.', url: '/apps/kamino.html' },
  { id: 'simulator',   naam: 'Simulator',        ico: '⚡', beschrijving: 'Factuur → ontwerp → offerte + rapport.', url: '/apps/simulator.html' },
  // Betalend laadplein: dezelfde simulator in een gefocuste flow (?flow=betaalplein). Zelfde toegang als de
  // Simulator (gatedBy:'simulator') → geen aparte app_id/proxy-grant nodig. Eindigt in het ontwerpscherm met
  // enkel het betaalplein-rapport + kabeltracé.
  { id: 'betaalplein', naam: 'Laadplein', ico: '🔌', beschrijving: 'Bestaande aansluiting → laadplein: schat de laadsessies in, zie rendement + klantrapport.', url: '/apps/simulator.html?flow=betaalplein', video: 'https://cdn.jsdelivr.net/gh/JohanMMK/jacops-presentatie@main/Laadplein_JACOPS_EDrive.mp4', video2: 'https://cdn.jsdelivr.net/gh/JohanMMK/jacops-presentatie@main/Laadplein_WATTKRAFT.mp4', video2Label: 'W', video2Title: 'Bekijk de Wattkraft-video' },   // 22-08: tegelnaam 'Betalend laadplein' → 'Laadplein' (Johan); id/flow ongewijzigd. 23-08: productvideo achter info-i (zoals thuisladen) + EIGEN toegangsrecht 'betaalplein' (gatedBy:'simulator' verwijderd) zodat de Gebruikers-app Laadplein apart kan toekennen. 22-08 (v1.5.0): 2e knop 'W' naast de i → Wattkraft-versie van de laadplein-video (video2)
  { id: 'thuisladen',  naam: 'Thuisladen',       ico: '🏠', beschrijving: 'Cafetariaplan-laadpaal: PV/batterij thuis optimaliseren.', url: '/apps/thuisladen.html', video: 'https://cdn.jsdelivr.net/gh/JohanMMK/jacops-presentatie@main/Thuisladen_JACOPS_EDrive.mp4' },
  { id: 'gebruikers',  naam: 'Gebruikers',       ico: '👥', beschrijving: 'Toegang tot de tools beheren.', url: '/apps/gebruikers.html', managerOnly: true },
  // v1.8.0 (Fase 3): manager-overzicht van de mandaat-wachtrij (rec.mandaat) — status per EAN + adres-mismatches
  // die door klant/adviseur bevestigd zijn, voor manueel nazicht. Read-only, leest GET /api/mandaat/wachtrij.
  { id: 'mandaten',    naam: 'Mandaten',         ico: '🗂️', beschrijving: 'Mandaatstatus per EAN + adres-bevestigingen om na te kijken.', url: '/apps/mandaten.html', managerOnly: true },
  // v1.9.0 (Fase, 14-09): manager-cockpit — alle projecten met status/acties + archiveren. Read/manage via
  // /api/kamino/projecten-overzicht + /api/kamino/archiveer. Enkel managers (David/Johan).
  { id: 'projecten',   naam: 'Projecten',        ico: '📁', beschrijving: 'Alle projecten: status, volgende actie en archief — voor managers.', url: '/apps/projecten.html', managerOnly: true },
  // v1.10.0 (22-09): profiel-import — upload afname (+ injectie) in elk formaat → gemeten profiel bij het project (manager-only).
  { id: 'profiel-import', naam: 'Profiel-import', ico: '📈', beschrijving: 'Verbruiksprofiel (CSV/Excel, elk formaat) omzetten naar een gemeten profiel bij een project.', url: '/apps/profiel-import.html', managerOnly: true },
  { id: 'demo', naam: 'Demo', ico: '🎬', beschrijving: 'Demo klantbeleving: per bezoeker elke stap met tijdstip, interesse- en vlot-score.', url: '/apps/demo.html', managerOnly: true },   // 2026-10-11 (Johan): demo-overzicht
  { id: 'hulp', naam: 'Hulpvragen', ico: '🙋', beschrijving: 'Hulpvragen van klanten en demo-bezoekers: open, beantwoord of gebeld — beantwoorden in het project.', url: '/apps/hulp.html', managerOnly: true },   // 2026-10-11 (Johan): hulpvragen
  { id: 'contracten', naam: 'Contracten', ico: '📝', beschrijving: 'Samenwerkingsovereenkomsten (Brelco-model) opmaken, ter ondertekening sturen en digitaal laten tekenen.', url: '/apps/contracten.html', oekeneOnly: true },   // v1.19.0 (Johan 16-10): contracten — v1.19.1: enkel oekene
  { id: 'leadgen-log', naam: 'Lead Generator — opvolging', ico: '📋', beschrijving: 'Wie doet wat in de Lead Generator: geopende gemeenten, bekeken parkings, genoteerde leads.', url: '/apps/leadgen-log.html', managerOnly: true },   // 2026-10-16 (Johan): opvolging leadgenerator
  { id: 'campagne', naam: 'EPC-campagne', ico: '📣', beschrijving: 'Contacten (naam, mail, telefoon, leverancier/installateur, taal) bijhouden en de campagnemail met de brochure versturen.', url: '/apps/campagne.html', managerOnly: true },   // 2026-10-12 (Johan): EPC-campagne
  { id: 'campagne-li', naam: 'Campagne LinkedIn', ico: '📅', beschrijving: 'Campagnedashboard: wanneer wat posten, blogs publiceren, eerste reacties, ambassadeurs en hun acties, bronnen.', url: '/apps/campagne-li.html', managerOnly: true },   // 2026-10-24 (Johan): LinkedIn-campagne — v1.24.0: weer voor alle managers
  // Congestie wordt toegevoegd zodra ze in de app ingebed is.
  // { id: 'congestie',   naam: 'Congestie',    ico: '🌐', beschrijving: 'Netcongestie & load factor.',      url: '/apps/congestie.html' },
];

// Academy-URL. Standaard same-origin (/apps/academy.html) → deelt de Supabase-
// sessie met de portal, dus geen tweede login (single sign-on). Kan overschreven
// worden via /api/config → academyUrl (bv. een externe URL; dan vervalt SSO).
function academyUrl() { return (CFG && CFG.academyUrl) || '/apps/academy.html'; }

let CFG = null;
let sb = null;       // Supabase client
let SESSION = null;

async function loadConfig() {
  const r = await fetch('/api/config');
  CFG = await r.json();
}

function injectSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = resolve; s.onerror = () => reject(new Error('Supabase-lib kon niet laden'));
    document.head.appendChild(s);
  });
}

async function initAuth() {
  await injectSupabase();   // v1.18.0: al parallel met loadConfig gestart → hier meestal meteen klaar
  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) {
    $('login-msg').textContent = 'Supabase nog niet geconfigureerd op de server (.env).';
    return;
  }
  sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  const { data } = await sb.auth.getSession();
  SESSION = data.session;
  // v1.18.0: enkel opnieuw renderen als de GEBRUIKER wisselt (login/logout) — niet bij INITIAL_SESSION of
  //   TOKEN_REFRESHED (dat vuurde de hele tegel-check 2–3× af).
  sb.auth.onAuthStateChange((_e, s) => { SESSION = s; const uid = (s && s.user && s.user.id) || null; if (uid !== _renderUid) render(); });
  render();
}

// Passwordless via e-mailcode — identiek aan de Academy (signInWithOtp + verifyOtp).
function toonCodeStap(aan) {
  $('stap-code').classList.toggle('hidden', !aan);
  $('btn-verify').classList.toggle('hidden', !aan);
  $('btn-opnieuw').classList.toggle('hidden', !aan);
  $('btn-code').classList.toggle('hidden', aan);
  $('login-email').readOnly = aan;
}

async function sendCode() {
  const email = $('login-email').value.trim();
  if (!email) { $('login-msg').textContent = 'Vul je e-mailadres in.'; return; }
  $('btn-code').disabled = true;
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  $('btn-code').disabled = false;
  if (error) { $('login-msg').textContent = 'Kon geen code sturen: ' + error.message; return; }
  toonCodeStap(true);
  $('login-msg').textContent = 'We hebben je een code gemaild. Vul ze hierboven in.';
  $('login-code').focus();
}

async function verifyCode() {
  const email = $('login-email').value.trim();
  const token = $('login-code').value.trim();
  if (!token) { $('login-msg').textContent = 'Vul de code uit je e-mail in.'; return; }
  $('btn-verify').disabled = true;
  // Zelfde fallback-logica als de Academy: eerst 'email'-OTP, anders 'signup'.
  let res = await sb.auth.verifyOtp({ email, token, type: 'email' });
  if (res.error) res = await sb.auth.verifyOtp({ email, token, type: 'signup' });
  $('btn-verify').disabled = false;
  if (res.error) { $('login-msg').textContent = 'Code klopt niet of is verlopen: ' + res.error.message; return; }
  $('login-msg').textContent = '';   // onAuthStateChange → render()
}

function resetLogin() {
  toonCodeStap(false);
  $('login-code').value = '';
  $('login-msg').textContent = '';
}

async function logout() { await sb.auth.signOut(); }

// RBAC: per app checken via de bestaande fluctus-proxy (9a). Managers → alle apps.
// 'altijd'-tegels (Academy) tonen we altijd; 'managerOnly'-tegels (Gebruikers)
// enkel voor managers. De rol lezen we uit het antwoord van app-access/check.
// v1.15.0 / v1.6.0 (Johan 11-10): teller op de tegel «🙋 Hulpvragen» — aantal hulpvragen dat nog beantwoord moet worden
async function hulpTeller(token) {
  try {
    const tile = document.querySelector('.app-tile[data-app="hulp"]'); if (!tile) return;
    const base = (CFG && CFG.fluctusProxyUrl) || '';
    const r = await fetch(`${base}/api/ek/hulp-overzicht?cb=${Date.now()}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
    if (!r.ok) return;
    const j = await r.json(); const V = (j && j.vragen) || [];
    const open = V.filter((v) => v.status === 'open').length, bel = V.filter((v) => v.status === 'open' && v.terugbellen).length;
    let b = tile.querySelector('.tile-teller');
    if (!b) { b = document.createElement('span'); b.className = 'tile-teller'; tile.style.position = 'relative'; tile.appendChild(b); }
    b.style.cssText = 'position:absolute;top:10px;right:10px;border-radius:999px;padding:3px 10px;font-weight:800;font-size:12.5px;line-height:1.4;'
      + (open ? 'background:#C0392B;color:#fff;box-shadow:0 2px 8px rgba(192,57,43,.35)' : 'background:#E6F6EC;color:#0a7d3c');
    b.textContent = open ? `${open} te beantwoorden` : '✔ niets open';
    b.title = open ? `${open} open hulpvra${open === 1 ? 'ag' : 'gen'}${bel ? ` — waarvan ${bel} terugbellen` : ''}` : 'Alle hulpvragen beantwoord';
  } catch (e) { /* stil */ }
}

async function toegankelijkeApps(token, email) {
  const base = CFG.fluctusProxyUrl || '';
  const echte = APP_CATALOG.filter((a) => !a.altijd && !a.managerOnly && !a.oekeneOnly && !a.alleenVoor);   // v1.17.0: ook gatedBy-tegels apart checken (eigen toekenning)
  const verleend = new Set();
  let role = 'seller';
  // v1.18.0: één bulk-request (proxy ≥ 15.306.0); lukt dat niet → de oude check per tegel.
  let bulkOk = false;
  try {
    const r = await fetch(`${base}/api/app-access/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ app_ids: echte.map((a) => a.id) }),
    });
    if (r.ok) {
      const j = await r.json();
      if (j && j.toegang) {
        bulkOk = true;
        if (j.user && j.user.role) role = j.user.role;
        Object.keys(j.toegang).forEach((id) => { if (j.toegang[id]) verleend.add(id); });
      }
    }
  } catch (e) { /* fallback hieronder */ }
  if (!bulkOk) await Promise.all(echte.map(async (app) => {
    try {
      const r = await fetch(`${base}/api/app-access/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ app_id: app.id }),
      });
      if (!r.ok) return;
      const j = await r.json();
      if (j && j.user && j.user.role) role = j.user.role;
      if (j && (j.toegang || j.access || j.ok)) verleend.add(app.id);
    } catch (e) { /* verborgen bij fout */ }
  }));
  // In catalogus-volgorde teruggeven: echte apps met toegang, altijd-apps,
  // en manager-only apps enkel voor managers.
  // v1.6.0 (Fase 2b): een KLANT hoort niet in de tool-launcher (zijn pad = scoped
  // project-deeplink, Fase 2c) → toon hem defensief enkel de 'altijd'-tegels, ook
  // als er per ongeluk een app-grant op zijn account zou staan.
  return APP_CATALOG.filter((a) => {
    if (a.alleenVoor) return a.alleenVoor.includes(String(email || '').toLowerCase());   // 2026-10-24
    if (a.oekeneOnly) return String(email || '').toLowerCase() === 'oekene@gmail.com';   // v1.19.1
    if (MGR_ENKEL.has(a.id)) return role === 'manager';   /* v1.21.0 (Johan 20-10) */
    if (a.altijd) return true;
    if (role === 'klant') return false;
    if (a.managerOnly) return role === 'manager';
    if (a.gatedBy) return role === 'manager' || verleend.has(a.id) || verleend.has(a.gatedBy);   // v1.17.0: eigen toekenning OF die van de gating-app
    return verleend.has(a.id);   // partnermanager: de proxy verleent de klant-toolset → komt hier binnen
  });
}

// v1.17.0 (Johan 15-10): niet-actieve tegels — onderaan, onder de lijn «Minder gebruikt».
const NIET_ACTIEF = new Set(['adviseur', 'energiekompas', 'academy', 'kamino', 'betaalplein', 'thuisladen', 'campagne']);

function renderLauncher(apps) {
  const host = $('apps'); host.innerHTML = '';
  if (!apps.length) {
    host.innerHTML = '<p class="notice">Je hebt nog geen toegang tot apps. Vraag toegang aan je manager.</p>';
    return;
  }
  ensureVideoUI();
  // v1.17.0 (Johan 15-10): minder gebruikte tegels onderaan, onder een scheidingslijn en gedempt (enkel in de
  //   manager-portal; adviseurs/partners zien hun tegels ongewijzigd).
  const isManager = apps.some((a) => a.managerOnly || a.oekeneOnly);
  const actief = isManager ? apps.filter((a) => !NIET_ACTIEF.has(a.id)) : apps;
  const passief = isManager ? apps.filter((a) => NIET_ACTIEF.has(a.id)) : [];
  if (passief.length && actief.length) {
    apps = actief.concat([{ _scheiding: true }], passief);
  }
  apps.forEach(a => {
    if (a._scheiding) {
      const sep = document.createElement('div');
      sep.style.cssText = 'grid-column:1/-1;display:flex;align-items:center;gap:12px;margin:10px 0 0;color:#8a94a6;font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase';
      sep.innerHTML = '<span style="flex:1;height:1px;background:#d9dee7"></span><span>Minder gebruikt</span><span style="flex:1;height:1px;background:#d9dee7"></span>';
      host.appendChild(sep);
      return;
    }
    const t = document.createElement('a');
    t.className = 'app-tile'; t.dataset.app = a.id;   // v1.15.0: data-app voor tellers
    t.href = (a.id === 'academy') ? academyUrl() : a.url;
    if (a.extern) { t.target = '_blank'; t.rel = 'noopener'; }
    t.innerHTML = `<div class="ico">${a.ico}</div><h3>${a.naam}</h3><p class="notice">${a.beschrijving}</p>`;
    // Info-i rechtsboven: opent de productvideo in een modal (navigeert niet naar de app).
    if (a.video) {
      t.style.position = 'relative';
      const info = document.createElement('button');
      info.className = 'tile-info';
      info.type = 'button';
      info.textContent = 'i';
      info.title = 'Bekijk de video';
      info.setAttribute('aria-label', 'Bekijk de video');
      info.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openVideoModal(a.video, a.naam); });
      t.appendChild(info);
    }
    // 2e videoknop (bv. 'W' = Wattkraft) links naast de info-i: opent een alternatieve productvideo.
    if (a.video2) {
      t.style.position = 'relative';
      const alt = document.createElement('button');
      alt.className = a.video ? 'tile-info tile-info2' : 'tile-info';
      alt.type = 'button';
      alt.textContent = a.video2Label || 'W';
      alt.title = a.video2Title || 'Bekijk de video';
      alt.setAttribute('aria-label', a.video2Title || 'Bekijk de video');
      alt.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openVideoModal(a.video2, (a.video2Label === 'W' ? a.naam + ' · Wattkraft' : a.naam)); });
      t.appendChild(alt);
    }
    if (isManager && NIET_ACTIEF.has(a.id)) { t.style.opacity = '.6'; t.style.background = '#f7f8fa'; }
    host.appendChild(t);
  });
}

// ── Productvideo-modal (info-i op de tegel) ──
function ensureVideoUI() {
  if (document.getElementById('tlvid-style')) return;
  const st = document.createElement('style'); st.id = 'tlvid-style';
  st.textContent = `
    .app-tile .tile-info{position:absolute;top:10px;right:10px;width:26px;height:26px;border-radius:50%;
      border:1.5px solid #1F3864;background:#fff;color:#1F3864;font-weight:800;font-style:italic;
      font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1;cursor:pointer;
      display:flex;align-items:center;justify-content:center;padding:0;z-index:3;transition:all .15s}
    .app-tile .tile-info:hover{background:#1F3864;color:#fff;transform:scale(1.08)}
    /* 2e videoknop ('W' = Wattkraft) links naast de info-i */
    .app-tile .tile-info2{right:42px;border-color:#12315E;color:#12315E;font-style:normal;
      font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:14px}
    .app-tile .tile-info2:hover{background:#12315E;color:#fff}
    .tlvid-bg{position:fixed;inset:0;background:rgba(15,22,40,.82);display:none;align-items:center;
      justify-content:center;z-index:9999;padding:24px}
    .tlvid-bg.open{display:flex}
    .tlvid-box{background:#0b1526;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5);
      width:min(960px,94vw);overflow:hidden}
    .tlvid-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;color:#fff;
      font-weight:700;font-size:14px}
    .tlvid-close{background:none;border:none;color:#cfe0ff;font-size:22px;cursor:pointer;line-height:1;padding:2px 8px}
    .tlvid-close:hover{color:#fff}
    .tlvid-box video{display:block;width:100%;max-height:78vh;background:#000}
  `;
  document.head.appendChild(st);
  const bg = document.createElement('div'); bg.className = 'tlvid-bg'; bg.id = 'tlvid-bg';
  bg.innerHTML = `<div class="tlvid-box" role="dialog" aria-modal="true">
      <div class="tlvid-head"><span id="tlvid-title">Video</span>
        <button class="tlvid-close" id="tlvid-close" aria-label="Sluiten">&times;</button></div>
      <video id="tlvid-el" controls playsinline preload="metadata"></video>
    </div>`;
  document.body.appendChild(bg);
  const close = () => closeVideoModal();
  bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
  document.getElementById('tlvid-close').addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
function openVideoModal(url, naam) {
  ensureVideoUI();
  const bg = document.getElementById('tlvid-bg');
  const vid = document.getElementById('tlvid-el');
  document.getElementById('tlvid-title').textContent = (naam ? naam + ' — ' : '') + 'productvideo';
  if (vid.getAttribute('src') !== url) vid.setAttribute('src', url);
  bg.classList.add('open');
  try { vid.currentTime = 0; const p = vid.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}
function closeVideoModal() {
  const bg = document.getElementById('tlvid-bg'); const vid = document.getElementById('tlvid-el');
  if (vid) { try { vid.pause(); } catch (e) {} }
  if (bg) bg.classList.remove('open');
}

// v1.18.0: tegel-cache per gebruiker (enkel de app-id's; toegang wordt altijd opnieuw gecontroleerd).
let _renderUid = null;
let _renderNr = 0;
function tegelsUitCache(uid) {
  try {
    const ids = JSON.parse(localStorage.getItem('FLX_PORTAL_TEGELS_' + uid) || 'null');
    if (!Array.isArray(ids)) return null;
    return ids.map((id) => APP_CATALOG.find((a) => a.id === id)).filter((a) => a && !a.oekeneOnly && !a.alleenVoor);   // v1.19.1: oekene-tegel nooit uit cache tonen
  } catch (e) { return null; }
}
function tegelsInCache(uid, apps) {
  try { localStorage.setItem('FLX_PORTAL_TEGELS_' + uid, JSON.stringify(apps.map((a) => a.id))); } catch (e) { /* geen opslag */ }
}

async function render() {
  const loggedIn = !!SESSION;
  $('gate').classList.toggle('hidden', loggedIn);
  $('app').classList.toggle('hidden', !loggedIn);
  $('portal-logout').classList.toggle('hidden', !loggedIn);
  if (!loggedIn) { _renderUid = null; _renderNr++; $('portal-user').textContent = ''; return; }

  const user = SESSION.user || {};
  $('portal-user').textContent = user.email || '';
  $('hi-naam').textContent = user.email ? (', ' + user.email.split('@')[0]) : '';

  // v1.18.0: tegels van de vorige keer meteen tonen, daarna bijwerken met de echte toegang.
  const uid = user.id || '';
  _renderUid = uid;
  const nr = ++_renderNr;
  const vorige = tegelsUitCache(uid);
  if (vorige && vorige.length) { renderLauncher(vorige); hulpTeller(SESSION.access_token); }
  else $('apps').innerHTML = '<p class="notice">Je apps worden geladen…</p>';
  const apps = await toegankelijkeApps(SESSION.access_token, user.email);
  if (nr !== _renderNr || !SESSION) return;   // intussen opnieuw gerenderd of uitgelogd
  const nieuw = apps.map((a) => a.id).join(',');
  if (!vorige || vorige.map((a) => a.id).join(',') !== nieuw) { renderLauncher(apps); hulpTeller(SESSION.access_token); }
  tegelsInCache(uid, apps);
  initOfferteUit();  // toon offerte-paneel indien ?aanbod=...
}

// ── Offerte-flow ──
function offerteContext() {
  const q = new URLSearchParams(window.location.search);
  return {
    aanbod_id: q.get('aanbod') || q.get('aanbod_id') || '',
    product: q.get('product') || '',
    ean: q.get('ean') || '',
    tvt_jaar: q.get('tvt') ? Number(q.get('tvt')) : undefined,
  };
}

function initOfferteUit() {
  const ctx = offerteContext();
  if (!ctx.aanbod_id) return;                 // enkel tonen bij een concreet aanbod
  $('offerte').classList.remove('hidden');
  if (ctx.product) $('of-product').value = ctx.product;
  if (ctx.ean) $('of-ean').value = ctx.ean;
  const u = (SESSION && SESSION.user) || {};
  if (u.email && !$('of-email').value) $('of-email').value = u.email;
  $('of-betaal').onclick = () => verstuurOfferte('A', ctx);
  $('of-later').onclick = () => verstuurOfferte('B', ctx);
}

async function verstuurOfferte(pad, ctx) {
  const msg = $('of-msg');
  if (!$('of-akkoord').checked) { msg.textContent = 'Vink de aanvaarding aan om verder te gaan.'; return; }
  const ean = $('of-ean').value.trim();
  const email = $('of-email').value.trim();
  if (!ean || !email) { msg.textContent = 'EAN en e-mail zijn verplicht.'; return; }
  msg.textContent = 'Bezig…';
  const body = {
    aanbod_id: ctx.aanbod_id,
    product: $('of-product').value,
    ean,
    tvt_jaar: ctx.tvt_jaar,
    pad,
    klant: {
      name: $('of-naam').value.trim(), company_name: $('of-bedrijf').value.trim(),
      email, vat: $('of-vat').value.trim(),
    },
    audit: { documenthash: ctx.aanbod_id, tijdstip: new Date().toISOString() },
  };
  try {
    const r = await fetch('/api/offerte/aanvaarden', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SESSION.access_token}` },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) { msg.textContent = 'Fout: ' + (j.error || r.status); return; }
    $('of-status').classList.remove('hidden');
    $('of-status-val').textContent = j.status || 'in behandeling';
    if (pad === 'A' && j.betaallink) {
      msg.textContent = 'Doorverwijzen naar de betaling…';
      window.location.href = j.betaallink;
    } else {
      msg.textContent = 'Aanvaard. Je ontvangt de factuur met betaallink per e-mail — de order blijft in behandeling tot betaald.';
    }
  } catch (e) { msg.textContent = 'Netwerkfout: ' + e.message; }
}

// ── Wiring ──
window.addEventListener('DOMContentLoaded', async () => {
  $('btn-code').onclick = sendCode;
  $('btn-verify').onclick = verifyCode;
  $('btn-opnieuw').onclick = resetLogin;
  $('portal-logout').onclick = logout;
  // Enter in het codeveld = inloggen.
  $('login-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') verifyCode(); });
  $('login-email').addEventListener('keydown', (e) => { if (e.key === 'Enter' && $('stap-code').classList.contains('hidden')) sendCode(); });
  try { const lib = injectSupabase().catch((e) => e); await loadConfig(); const fout = await lib; if (fout instanceof Error) throw fout; await initAuth(); }   // v1.18.0: parallel
  catch (e) { $('login-msg').textContent = 'Init-fout: ' + e.message; }
});
