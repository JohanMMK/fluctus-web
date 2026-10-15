// mijnec.js v1.8.0 — 2026-10-15 — manager-portal: niet-actieve tegels onderaan onder een lijn «Minder gebruikt» (gedempt); Academy niet meer automatisch; Energie-Compas/Mijn klanten/Laadplein ook apart toe te kennen (Gebruikers v1.9). mijnec.js v1.7.0 — 2026-10-12 — managerOnly-tegel 'campagne' (📣 EPC-campagne → /apps/campagne.html). v1.6.0 — 2026-10-11 — tegel 'hulp' toont het aantal hulpvragen dat nog beantwoord moet worden (rode teller). v1.5.0 — 2026-10-11 — managerOnly-tegel 'hulp' (🙋 Hulpvragen → /apps/hulp.html). v1.4.0 — 2026-10-11 — managerOnly-tegel 'demo' (🎬 Demo → /apps/demo.html). v1.3.0 — 2026-10-10 — MijnEC portaal (Energie-Compas).
// v1.3.0 (Johan): + Engels (/en/login → <html lang="en">); de taal gaat mee naar /api/auth/otp-request → aanmeldcode-mail in NL/FR/EN.
// v1.1.0 (Johan): login-OTP via proxy /api/auth/otp-request (Graph, EC-branded mail van noreply@energie-compas.eu);
//   valt terug op sb.auth.signInWithOtp bij endpoint-fout. Géén Supabase "Mijn Fluctus"-mail meer bij normale flow.
// Deelt het RBAC-toegangscontract met de bestaande portal.js: Supabase-JWT +
// POST /api/app-access/check op de proxy. Managers zien alle tegels; anderen enkel
// de toegekende. Bewust EC-branded en ZONDER enige merkverwijzing naar de coöperatie.
// Losse module (raakt portal.js niet), zodat het bestaande portaal ongewijzigd blijft.

const $ = (id) => document.getElementById(id);

// v1.2.0: taalbewuste statusmeldingen (NL standaard, FR op /fr/login — <html lang="fr">).
const _LANG = (document.documentElement.lang || 'nl').toLowerCase().slice(0, 2);
const _FR = _LANG === 'fr', _EN = _LANG === 'en';
const _t = (nl, fr, en) => (_FR ? fr : (_EN ? en : nl));
const T = {
  nietGeconfig: _t('Inloggen nog niet geconfigureerd op de server.', 'Connexion pas encore configurée sur le serveur.', 'Login is not yet configured on the server.'),
  vulEmail:     _t('Vul je e-mailadres in.', 'Saisissez votre adresse e-mail.', 'Please enter your e-mail address.'),
  geenCode:     _t('Kon geen code sturen: ', "Impossible d'envoyer un code : ", 'Could not send a code: '),
  codeGemaild:  _t('We hebben je een code gemaild. Vul ze hierboven in.', 'Nous vous avons envoyé un code par e-mail. Saisissez-le ci-dessus.', 'We have e-mailed you a code. Enter it above.'),
  vulCode:      _t('Vul de code uit je e-mail in.', 'Saisissez le code reçu par e-mail.', 'Enter the code from your e-mail.'),
  codeFout:     _t('Code klopt niet of is verlopen: ', 'Code incorrect ou expiré : ', 'The code is incorrect or has expired: '),
  geenApps:     _t('Je hebt nog geen toegang tot apps. Vraag toegang aan je manager.', "Vous n'avez encore accès à aucune application. Demandez l'accès à votre gestionnaire.", 'You do not have access to any apps yet. Ask your manager for access.'),
  initFout:     _t('Init-fout: ', "Erreur d'initialisation : ", 'Initialisation error: '),
};

// App-catalogus — zelfde app_id's en gating als het bestaande portaal (managers
// bepalen de toegang per gebruiker). Enkel de zichtbare namen zijn merk-neutraal.
// Vlaggen: altijd | managerOnly | gatedBy | extern | video.
const APP_CATALOG = [
  { id: 'ek',           naam: 'Energie-Compas',   ico: '📊', beschrijving: 'Snelle energie-analyse → besparing & rendement in één scherm, met adviseur-link om het resultaat te delen.', url: '/apps/ek.html?prep=1', gatedBy: 'energiekompas' },
  { id: 'adviseur',     naam: 'Mijn klanten',     ico: '👥', beschrijving: 'Nodig klanten uit voor een energie-analyse. Zij sturen hun factuur en worden automatisch aan jou gekoppeld.', url: '/apps/adviseur.html', gatedBy: 'energiekompas' },
  { id: 'energiekompas',naam: 'Energie-schil',    ico: '🔆', beschrijving: 'Je energie-advies in één schil: particulier of bedrijf → besparing, rendement en advies.', url: '/apps/energiekompas.html' },
  { id: 'academy',      naam: 'Academy',          ico: '🎓', beschrijving: 'Opleiding, modules en certificaten.', url: '/apps/academy.html' }   /* v1.8.0: niet meer automatisch — per gebruiker toe te kennen */,
  { id: 'energiemarkt', naam: 'Energiemarkt',     ico: '📈', beschrijving: 'Marktdata (spot & onbalans) — werkt de simulatiedata bij.', url: '/apps/energiemarkt.html' },
  { id: 'gemeenteplan', naam: 'Gemeenteplan',     ico: '🗺️', beschrijving: 'Laadplan per gemeente → mail met PPTX + PDF.', url: '/apps/gemeenteplan.html' },
  { id: 'kamino',       naam: 'Kamino',           ico: '🧭', beschrijving: '4 vragen → antwoord + rapport. Je pad naar maximale elektrificatie.', url: '/apps/kamino.html' },
  { id: 'simulator',    naam: 'Simulator',        ico: '⚡', beschrijving: 'Factuur → ontwerp → offerte + rapport.', url: '/apps/simulator.html' },
  { id: 'betaalplein',  naam: 'Laadplein',        ico: '🔌', beschrijving: 'Bestaande aansluiting → laadplein: schat de laadsessies in, zie rendement + klantrapport.', url: '/apps/simulator.html?flow=betaalplein' },
  { id: 'thuisladen',   naam: 'Thuisladen',       ico: '🏠', beschrijving: 'Cafetariaplan-laadpaal: PV/batterij thuis optimaliseren.', url: '/apps/thuisladen.html' },
  { id: 'gebruikers',   naam: 'Gebruikers',       ico: '👥', beschrijving: 'Toegang tot de tools beheren.', url: '/apps/gebruikers.html', managerOnly: true },
  { id: 'mandaten',     naam: 'Mandaten',         ico: '🗂️', beschrijving: 'Mandaatstatus per EAN + adres-bevestigingen om na te kijken.', url: '/apps/mandaten.html', managerOnly: true },
  { id: 'projecten',    naam: 'Projecten',        ico: '📁', beschrijving: 'Alle projecten: status, volgende actie en archief — voor managers.', url: '/apps/projecten.html', managerOnly: true },
  { id: 'profiel-import', naam: 'Profiel-import', ico: '📉', beschrijving: 'Verbruiksprofiel (CSV/Excel, elk formaat) omzetten naar een gemeten profiel bij een project.', url: '/apps/profiel-import.html', managerOnly: true },
  { id: 'demo', naam: 'Demo', ico: '🎬', beschrijving: 'Demo klantbeleving: per bezoeker elke stap met tijdstip, interesse- en vlot-score.', url: '/apps/demo.html', managerOnly: true },   // 2026-10-11 (Johan): demo-overzicht
  { id: 'hulp', naam: 'Hulpvragen', ico: '🙋', beschrijving: 'Hulpvragen van klanten en demo-bezoekers: open, beantwoord of gebeld — beantwoorden in het project.', url: '/apps/hulp.html', managerOnly: true },   // 2026-10-11 (Johan): hulpvragen
  { id: 'campagne', naam: 'EPC-campagne', ico: '📣', beschrijving: 'Contacten (naam, mail, telefoon, leverancier/installateur, taal) bijhouden en de campagnemail met de brochure versturen.', url: '/apps/campagne.html', managerOnly: true },   // 2026-10-12 (Johan): EPC-campagne
];

function academyUrl() { return (CFG && CFG.academyUrl) || '/apps/academy.html'; }

let CFG = null, sb = null, SESSION = null;

async function loadConfig() { const r = await fetch('/api/config'); CFG = await r.json(); }

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
    $('login-msg').textContent = T.nietGeconfig;
    return;
  }
  sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  const { data } = await sb.auth.getSession();
  SESSION = data.session;
  sb.auth.onAuthStateChange((_e, s) => { SESSION = s; render(); });
  render();
}

function toonCodeStap(aan) {
  $('stap-code').classList.toggle('hidden', !aan);
  $('btn-verify').classList.toggle('hidden', !aan);
  $('btn-opnieuw').classList.toggle('hidden', !aan);
  $('btn-code').classList.toggle('hidden', aan);
  $('login-email').readOnly = aan;
}

async function sendCode() {
  const email = $('login-email').value.trim();
  if (!email) { $('login-msg').textContent = T.vulEmail; return; }
  $('btn-code').disabled = true;
  // v1.1.0: vraag de 6-cijfercode via de proxy (Graph, Energie-Compas-branded mail van noreply@energie-compas.eu).
  // Valt terug op de Supabase-eigen OTP als het endpoint onbereikbaar is, zodat inloggen nooit volledig stukgaat.
  const base = (CFG && CFG.fluctusProxyUrl) || '';
  let okEndpoint = false;
  try {
    const r = await fetch(`${base}/api/auth/otp-request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, lang: _LANG }),   // v1.3.0: aanmeldcode-mail in de taal van de pagina
    });
    okEndpoint = r.ok;
  } catch (e) { okEndpoint = false; }
  if (!okEndpoint) {
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) { $('btn-code').disabled = false; $('login-msg').textContent = T.geenCode + error.message; return; }
  }
  $('btn-code').disabled = false;
  toonCodeStap(true);
  $('login-msg').textContent = T.codeGemaild;
  $('login-code').focus();
}

async function verifyCode() {
  const email = $('login-email').value.trim();
  const token = $('login-code').value.trim();
  if (!token) { $('login-msg').textContent = T.vulCode; return; }
  $('btn-verify').disabled = true;
  let res = await sb.auth.verifyOtp({ email, token, type: 'email' });
  if (res.error) res = await sb.auth.verifyOtp({ email, token, type: 'signup' });
  $('btn-verify').disabled = false;
  if (res.error) { $('login-msg').textContent = T.codeFout + res.error.message; return; }
  $('login-msg').textContent = '';
}

function resetLogin() { toonCodeStap(false); $('login-code').value = ''; $('login-msg').textContent = ''; }
async function logout() { await sb.auth.signOut(); }

// RBAC — zelfde contract als het bestaande portaal (POST /api/app-access/check).
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

async function toegankelijkeApps(token) {
  const base = CFG.fluctusProxyUrl || '';
  const echte = APP_CATALOG.filter((a) => !a.altijd && !a.managerOnly);   // v1.8.0: ook gatedBy-tegels apart checken
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
  return APP_CATALOG.filter((a) => {
    if (a.altijd) return true;
    if (role === 'klant') return false;
    if (a.managerOnly) return role === 'manager';
    if (a.gatedBy) return role === 'manager' || verleend.has(a.id) || verleend.has(a.gatedBy);   // v1.8.0: eigen toekenning OF gating-app
    return verleend.has(a.id);
  });
}

// v1.8.0 (Johan 15-10): niet-actieve tegels (Mijn klanten, Energie-schil, Academy, Kamino, Laadplein, Thuisladen, EPC-campagne).
const NIET_ACTIEF = new Set(['adviseur', 'energiekompas', 'academy', 'kamino', 'betaalplein', 'thuisladen', 'campagne']);

function renderLauncher(apps) {
  const host = $('apps'); host.innerHTML = '';
  if (!apps.length) {
    host.innerHTML = '<p class="notice">' + T.geenApps + '</p>';
    return;
  }
  // v1.8.0 (Johan 15-10): minder gebruikte tegels onderaan onder een lijn, gedempt — enkel in de manager-portal.
  const isManager = apps.some((a) => a.managerOnly);
  if (isManager) {
    const actief = apps.filter((a) => !NIET_ACTIEF.has(a.id)), passief = apps.filter((a) => NIET_ACTIEF.has(a.id));
    if (actief.length && passief.length) apps = actief.concat([{ _scheiding: true }], passief);
  }
  apps.forEach((a) => {
    if (a._scheiding) {
      const sep = document.createElement('div');
      sep.style.cssText = 'grid-column:1/-1;display:flex;align-items:center;gap:12px;margin:10px 0 0;color:#8a94a6;font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase';
      sep.innerHTML = '<span style="flex:1;height:1px;background:#d9dee7"></span><span>' + _t('Minder gebruikt', 'Moins utilisé', 'Less used') + '</span><span style="flex:1;height:1px;background:#d9dee7"></span>';
      host.appendChild(sep);
      return;
    }
    const t = document.createElement('a');
    t.className = 'app-tile'; t.dataset.app = a.id;   // v1.6.0: data-app voor tellers
    t.href = (a.id === 'academy') ? academyUrl() : a.url;
    if (a.extern) { t.target = '_blank'; t.rel = 'noopener'; }
    t.innerHTML = `<div class="ico">${a.ico}</div><h3>${a.naam}</h3><p>${a.beschrijving}</p>`;
    if (isManager && NIET_ACTIEF.has(a.id)) { t.style.opacity = '.6'; t.style.background = '#f7f8fa'; }
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
  hulpTeller(SESSION.access_token);   // v1.6.0
}

window.addEventListener('DOMContentLoaded', async () => {
  $('btn-code').onclick = sendCode;
  $('btn-verify').onclick = verifyCode;
  $('btn-opnieuw').onclick = resetLogin;
  $('portal-logout').onclick = logout;
  $('login-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') verifyCode(); });
  $('login-email').addEventListener('keydown', (e) => { if (e.key === 'Enter' && $('stap-code').classList.contains('hidden')) sendCode(); });
  try { await loadConfig(); await initAuth(); }
  catch (e) { $('login-msg').textContent = T.initFout + e.message; }
});
