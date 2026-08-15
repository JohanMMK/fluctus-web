// ── Portaal: Academy/Supabase-login + RBAC-launcher + offerte-flow ───────────
// 26-07: Kamino-tegel toegevoegd aan APP_CATALOG (app_id 'kamino' → /apps/kamino.html).
//        Managers zien ze meteen (impliciet alle apps); sellers via een user_app_access-rij.
// Bouwt voort op het bestaande 9a-toegangsmodel: de fluctus-proxy valideert de
// Supabase-JWT en checkt user_app_access via POST /api/app-access/check.
// Niet-toegankelijke apps worden VERBORGEN (geen disabled).

// 09-08: 'i'-infoknop per tegel → wervende modal (waarde · gebruik · wat gebeurt · CX). Zie TEGEL_INFO + openTegelInfo onderaan.
const $ = (id) => document.getElementById(id);

// App-catalogus = de 9a-apps. url is configureerbaar; de eigenlijke inbedding
// van de simulator in deze app is de resterende integratiestap (workflow-taak).
// Vlaggen:
//   altijd:true      → tegel altijd zichtbaar voor elke ingelogde gebruiker
//                      (geen app-access/check nodig).
//   managerOnly:true → tegel enkel voor managers (role==='manager').
//   extern:true      → opent in een nieuw tabblad (externe site).
// De 'echte' tools (kamino/simulator/gemeenteplan) worden per gebruiker
// gefilterd via de fluctus-proxy /api/app-access/check.
// Volgorde van de tegels op Mijn Fluctus (Johan 06-08):
//   1 Jacops-presentatie · 2 Academy · 3 Energiemarkt · 4 Gemeenteplan · 5 Kamino · 6 Simulator · 7 Gebruikers
const APP_CATALOG = [
  // Jacops-presentatie: statische map (index.html + 7 MP4's) op GitHub Pages,
  // zodat de fluctus-web-repo licht blijft. GRANTBAAR: enkel zichtbaar voor
  // verkopers aan wie je ze toekent (via de Gebruikers-tegel, app_id 'jacops');
  // managers zien ze automatisch. Opent in een nieuw tabblad (presenteren).
  // ↓ pas deze URL aan naar waar je de map effectief pusht.
  //   Eigen Pages-repo 'jacops-presentatie' (files in de root, branch main).
  { id: 'jacops',      naam: 'Jacops-presentatie', ico: '🎬', beschrijving: 'Meer mogelijk met hetzelfde net — de Jacops-presentatie.', url: 'https://johanmmk.github.io/jacops-presentatie/index.html', extern: true },
  { id: 'academy',     naam: 'Fluctus Academy',  ico: '🎓', beschrijving: 'Opleiding, modules en certificaten.', url: '/apps/academy.html', altijd: true },
  // Energiemarkt = gewone app: managers zien ze automatisch, verkopers enkel na
  // toekenning via de Gebruikers-tegel (app_id 'energiemarkt'). Ze werkt de
  // gedeelde marktdata bij die de simulator gebruikt.
  { id: 'energiemarkt', naam: 'Energiemarkt',    ico: '📈', beschrijving: 'Marktdata (spot & onbalans) — werkt de simulator-data bij.', url: '/apps/energiemarkt.html' },
  { id: 'gemeenteplan', naam: 'Gemeenteplan', ico: '🗺️', beschrijving: 'Laadplan per gemeente → mail met PPTX + PDF.', url: '/apps/gemeenteplan.html' },
  { id: 'kamino',      naam: 'Kamino',           ico: '🧭', beschrijving: '4 vragen → antwoord + rapport. Uw pad naar maximale elektrificatie.', url: '/apps/kamino.html' },
  { id: 'simulator',   naam: 'Simulator',        ico: '⚡', beschrijving: 'Factuur → ontwerp → offerte + rapport.', url: '/apps/simulator.html' },
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
let USER_ROLE = 'seller';   // rol van de ingelogde gebruiker (uit app-access/check)

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
  const echte = APP_CATALOG.filter((a) => !a.altijd && !a.managerOnly);
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
  USER_ROLE = role;   // onthouden voor renderLauncher (o.a. manager-doorklik Jacops)
  // In catalogus-volgorde teruggeven: echte apps met toegang, altijd-apps,
  // en manager-only apps enkel voor managers.
  return APP_CATALOG.filter((a) => {
    if (a.altijd) return true;
    if (a.managerOnly) return role === 'manager';
    return verleend.has(a.id);
  });
}

function renderLauncher(apps) {
  const host = $('apps'); host.innerHTML = '';
  if (!apps.length) {
    host.innerHTML = '<p class="notice">Je hebt nog geen toegang tot apps. Vraag toegang aan je manager.</p>';
    return;
  }
  apps.forEach(a => {
    const t = document.createElement('a');
    t.className = 'app-tile';
    let href = (a.id === 'academy') ? academyUrl() : a.url;
    // Jacops-presentatie: managers mogen vrij doorklikken (?manager=1);
    // verkopers moeten elke film uitkijken.
    if (a.id === 'jacops' && USER_ROLE === 'manager') {
      href += (href.indexOf('?') >= 0 ? '&' : '?') + 'manager=1';
    }
    t.href = href;
    if (a.extern) { t.target = '_blank'; t.rel = 'noopener'; }
    t.style.position = 'relative';
    const infoBtn = TEGEL_INFO[a.id]
      ? `<button class="tile-i" title="Wat is dit?" aria-label="Info over ${a.naam}" onclick="event.preventDefault();event.stopPropagation();openTegelInfo('${a.id}');return false;">i</button>`
      : '';
    t.innerHTML = `${infoBtn}<div class="ico">${a.ico}</div><h3>${a.naam}</h3><p class="notice">${a.beschrijving}</p>`;
    host.appendChild(t);
  });
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

// ── Tegel-info: wervende "i"-modal per tegel (waarde · gebruik · wat gebeurt · CX) ──────────
const TEGEL_INFO = {
  kamino: { titel: 'Kamino', ico: '🧭',
    waarde: `In vier vragen weet je meteen waar bij deze klant het meeste geld zit — zonder een offerte te forceren. Je opent het gesprek met inzicht, niet met een prijs.`,
    gebruik: `Kies de vraag die de klant bezighoudt (contract, zonnepanelen, batterij of laadplein), geef factuur of verbruik in en klik. Meerdere vragen? Ze delen dezelfde gegevens.`,
    gebeurt: `Kamino draait op de achtergrond dezelfde rekenmotor als de Simulator, op het échte verbruik, en levert per vraag een kerncijfer plus een rapport.`,
    cx: `De klant krijgt in enkele minuten een helder antwoord, zwart-op-wit. Jij komt binnen als adviseur die rekent, niet als verkoper die duwt.` },
  simulator: { titel: 'Simulator', ico: '⚡',
    waarde: `Van factuur tot volledig onderbouwd voorstel: batterij, PV, aansluiting en laadplein in één berekening — met een rapport dat de klant zelf kan verifiëren.`,
    gebruik: `Laad de factuur op (of vul manueel in), kies het verbruiksprofiel, laat het ontwerp doorrekenen en genereer de offerte en het rapport.`,
    gebeurt: `De motor simuleert je verbruik op echte spot- en onbalansdata, dimensioneert de installatie en berekent rendement en terugverdientijd.`,
    cx: `Elke euro is herleidbaar. De klant krijgt geen “geloof ons”, maar cijfers die kloppen — dat wint vertrouwen en verkort de beslissing.` },
  energiemarkt: { titel: 'Energiemarkt', ico: '📈',
    waarde: `Voel de markt: waar staan de spot- en onbalansprijzen vandaag, en waarom slim sturen loont.`,
    gebruik: `Open het dashboard om de actuele markt te bekijken. Het houdt tegelijk de data vers waarop je studies in Kamino en de Simulator rekenen.`,
    gebeurt: `Live day-ahead- en onbalansdata worden opgehaald en bijgewerkt voor de rekentools.`,
    cx: `Je onderbouwt je verhaal met de markt van vandaag, niet met een oude vuistregel — dat maakt indruk.` },
  gemeenteplan: { titel: 'Gemeenteplan', ico: '🗺️',
    waarde: `Een kant-en-klaar laadplan per gemeente om lokaal meteen het gesprek te openen.`,
    gebruik: `Kies de gemeente. Je krijgt een plan met kaart en laadbehoefte, klaar om te versturen als PPTX en PDF.`,
    gebeurt: `De tool bundelt de laadbehoefte-data tot een presentatie plus rapport en mailt ze.`,
    cx: `Je komt bij een gemeente of lokale speler binnen met een concreet plan in plaats van een blanco blad.` },
  academy: { titel: 'Fluctus Academy', ico: '🎓',
    waarde: `Alles om als adviseur meteen sterk te staan: het verhaal, de scripts en de cijfers achter het aanbod.`,
    gebruik: `Doorloop de modules op je eigen tempo en sluit af met een certificaat.`,
    gebeurt: `Je vordering en behaalde certificaten worden bijgehouden.`,
    cx: `Je stapt met vertrouwen naar de klant omdat je het model écht begrijpt — dat voelt de klant.` },
  jacops: { titel: 'Jacops-presentatie', ico: '🎬',
    waarde: `Het volledige elektrificatie- en laadpleinverhaal in beeld — ideaal om een prospect warm te maken.`,
    gebruik: `Speel de presentatie af vóór of tijdens het gesprek. (Als manager klik je vrij door; adviseurs kijken de films uit.)`,
    gebeurt: `Een reeks korte films neemt de klant mee van probleem naar oplossing.`,
    cx: `De klant ziet en voelt het verhaal; jij hoeft niet alles zelf uit te leggen.` },
  gebruikers: { titel: 'Gebruikers', ico: '👥',
    waarde: `Grip op wie welke tool mag gebruiken — zonder tussenkomst van IT.`,
    gebruik: `Nodig een adviseur uit, ken tegels toe, pas rol of status aan, of verwijder een account.`,
    gebeurt: `De uitnodiging, de toegang en het account worden meteen in orde gezet (met een lokale audit-export bij verwijderen).`,
    cx: `Een nieuwe adviseur is in een minuut operationeel; jij houdt het overzicht. (Enkel voor managers.)` }
};

function _tegelInfoStyle() {
  if (document.getElementById('tegel-info-style')) return;
  const s = document.createElement('style'); s.id = 'tegel-info-style';
  s.textContent = `
  .tile-i{position:absolute;top:8px;right:10px;width:22px;height:22px;border-radius:50%;border:1px solid #C9D2E0;
    background:#fff;color:#1F3864;font-weight:800;font-family:Georgia,serif;font-style:italic;font-size:13px;
    line-height:20px;text-align:center;cursor:pointer;padding:0;z-index:2;opacity:.75}
  .tile-i:hover{opacity:1;background:#EFF6FF;border-color:#93C5FD}
  .tegel-modal-ov{position:fixed;inset:0;background:rgba(31,56,100,.45);display:flex;align-items:center;
    justify-content:center;z-index:9999;padding:20px}
  .tegel-modal{background:#fff;max-width:520px;width:100%;border-radius:14px;overflow:hidden;
    box-shadow:0 18px 50px rgba(16,24,40,.28);font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}
  .tegel-modal .kop{background:#1F3864;color:#fff;padding:16px 20px;display:flex;align-items:center;gap:10px}
  .tegel-modal .kop .e{font-size:22px}
  .tegel-modal .kop h3{margin:0;font-size:17px;font-weight:700}
  .tegel-modal .body{padding:16px 20px 6px}
  .tegel-modal .sec{margin:0 0 13px}
  .tegel-modal .sec .l{font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:#1E7F4F;font-weight:800;margin:0 0 3px}
  .tegel-modal .sec p{margin:0;font-size:13.5px;line-height:1.55;color:#243}
  .tegel-modal .vt{padding:12px 20px 18px;text-align:right}
  .tegel-modal .vt button{background:#1F3864;color:#fff;border:0;border-radius:9px;padding:9px 18px;font-weight:700;cursor:pointer}
  `;
  document.head.appendChild(s);
}
function sluitTegelInfo(){ const o = document.getElementById('tegel-info-ov'); if (o) o.remove(); document.removeEventListener('keydown', _tegelInfoEsc); }
function _tegelInfoEsc(e){ if (e.key === 'Escape') sluitTegelInfo(); }
function openTegelInfo(id){
  const d = TEGEL_INFO[id]; if (!d) return;
  _tegelInfoStyle(); sluitTegelInfo();
  const esc = (x)=>String(x==null?'':x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const sec = (l,t)=>`<div class="sec"><p class="l">${l}</p><p>${esc(t)}</p></div>`;
  const ov = document.createElement('div'); ov.className='tegel-modal-ov'; ov.id='tegel-info-ov';
  ov.innerHTML = `<div class="tegel-modal" role="dialog" aria-modal="true">
    <div class="kop"><span class="e">${d.ico||'ℹ️'}</span><h3>${esc(d.titel)}</h3></div>
    <div class="body">
      ${sec('Wat het je brengt', d.waarde)}
      ${sec('Hoe je het gebruikt', d.gebruik)}
      ${sec('Wat er gebeurt', d.gebeurt)}
      ${sec('De ervaring', d.cx)}
    </div>
    <div class="vt"><button type="button" onclick="sluitTegelInfo()">Sluiten</button></div>
  </div>`;
  ov.addEventListener('click', (e)=>{ if (e.target === ov) sluitTegelInfo(); });
  document.body.appendChild(ov);
  document.addEventListener('keydown', _tegelInfoEsc);
}
