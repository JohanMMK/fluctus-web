// ── Portaal: Academy/Supabase-login + RBAC-launcher + offerte-flow ───────────
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
//   1 Academy · 2 Energiemarkt · 3 Gemeenteplan · 4 Kamino · 5 Simulator · 6 Thuisladen · 7 Gebruikers
const APP_CATALOG = [
  { id: 'academy',     naam: 'Fluctus Academy',  ico: '🎓', beschrijving: 'Opleiding, modules en certificaten.', url: '/apps/academy.html', altijd: true },
  // Energiemarkt = gewone app: managers zien ze automatisch, verkopers enkel na
  // toekenning via de Gebruikers-tegel (app_id 'energiemarkt'). Ze werkt de
  // gedeelde marktdata bij die de simulator gebruikt.
  { id: 'energiemarkt', naam: 'Energiemarkt',    ico: '📈', beschrijving: 'Marktdata (spot & onbalans) — werkt de simulator-data bij.', url: '/apps/energiemarkt.html' },
  { id: 'gemeenteplan', naam: 'Gemeenteplan', ico: '🗺️', beschrijving: 'Laadplan per gemeente → mail met PPTX + PDF.', url: '/apps/gemeenteplan.html' },
  { id: 'kamino',      naam: 'Kamino',           ico: '🧭', beschrijving: '4 vragen → antwoord + rapport. Uw pad naar maximale elektrificatie.', url: '/apps/kamino.html' },
  { id: 'simulator',   naam: 'Simulator',        ico: '⚡', beschrijving: 'Factuur → ontwerp → offerte + rapport.', url: '/apps/simulator.html' },
  // Betalend laadplein: dezelfde simulator in een gefocuste flow (?flow=betaalplein). Zelfde toegang als de
  // Simulator (gatedBy:'simulator') → geen aparte app_id/proxy-grant nodig. Eindigt in het ontwerpscherm met
  // enkel het betaalplein-rapport + kabeltracé.
  { id: 'betaalplein', naam: 'Laadplein', ico: '🔌', beschrijving: 'Bestaande aansluiting → laadplein: schat de laadsessies in, zie rendement + klantrapport.', url: '/apps/simulator.html?flow=betaalplein', gatedBy: 'simulator' },   // 22-08: tegelnaam 'Betalend laadplein' → 'Laadplein' (Johan); id/flow ongewijzigd
  { id: 'thuisladen',  naam: 'Thuisladen',       ico: '🏠', beschrijving: 'Cafetariaplan-laadpaal: PV/batterij thuis optimaliseren.', url: '/apps/thuisladen.html', video: 'https://cdn.jsdelivr.net/gh/JohanMMK/jacops-presentatie@main/Thuisladen_JACOPS_EDrive.mp4' },
  { id: 'gebruikers',  naam: 'Gebruikers',       ico: '👥', beschrijving: 'Toegang tot de tools beheren.', url: '/apps/gebruikers.html', managerOnly: true },
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
  await injectSupabase();
  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) {
    $('login-msg').textContent = 'Supabase nog niet geconfigureerd op de server (.env).';
    return;
  }
  sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  const { data } = await sb.auth.getSession();
  SESSION = data.session;
  sb.auth.onAuthStateChange((_e, s) => { SESSION = s; render(); });
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
async function toegankelijkeApps(token) {
  const base = CFG.fluctusProxyUrl || '';
  const echte = APP_CATALOG.filter((a) => !a.altijd && !a.managerOnly && !a.gatedBy);
  const verleend = new Set();
  let role = 'seller';
  await Promise.all(echte.map(async (app) => {
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
  return APP_CATALOG.filter((a) => {
    if (a.altijd) return true;
    if (a.managerOnly) return role === 'manager';
    if (a.gatedBy) return role === 'manager' || verleend.has(a.gatedBy);   // zelfde toegang als de gating-app
    return verleend.has(a.id);
  });
}

function renderLauncher(apps) {
  const host = $('apps'); host.innerHTML = '';
  if (!apps.length) {
    host.innerHTML = '<p class="notice">Je hebt nog geen toegang tot apps. Vraag toegang aan je manager.</p>';
    return;
  }
  ensureVideoUI();
  apps.forEach(a => {
    const t = document.createElement('a');
    t.className = 'app-tile';
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

async function render() {
  const loggedIn = !!SESSION;
  $('gate').classList.toggle('hidden', loggedIn);
  $('app').classList.toggle('hidden', !loggedIn);
  $('portal-logout').classList.toggle('hidden', !loggedIn);
  if (!loggedIn) { $('portal-user').textContent = ''; return; }

  const user = SESSION.user || {};
  $('portal-user').textContent = user.email || '';
  $('hi-naam').textContent = user.email ? (', ' + user.email.split('@')[0]) : '';

  renderLauncher(await toegankelijkeApps(SESSION.access_token));
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
  try { await loadConfig(); await initAuth(); }
  catch (e) { $('login-msg').textContent = 'Init-fout: ' + e.message; }
});
