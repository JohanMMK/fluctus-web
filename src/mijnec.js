// mijnec.js v1.2.0 — 2026-10-02 — MijnEC portaal (Energie-Compas).
// v1.1.0 (Johan): login-OTP via proxy /api/auth/otp-request (Graph, EC-branded mail van noreply@energie-compas.eu);
//   valt terug op sb.auth.signInWithOtp bij endpoint-fout. Géén Supabase "Mijn Fluctus"-mail meer bij normale flow.
// Deelt het RBAC-toegangscontract met de bestaande portal.js: Supabase-JWT +
// POST /api/app-access/check op de proxy. Managers zien alle tegels; anderen enkel
// de toegekende. Bewust EC-branded en ZONDER enige merkverwijzing naar de coöperatie.
// Losse module (raakt portal.js niet), zodat het bestaande portaal ongewijzigd blijft.

const $ = (id) => document.getElementById(id);

// v1.2.0: taalbewuste statusmeldingen (NL standaard, FR op /fr/login — <html lang="fr">).
const _FR = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
const T = {
  nietGeconfig: _FR ? 'Connexion pas encore configurée sur le serveur.' : 'Inloggen nog niet geconfigureerd op de server.',
  vulEmail:     _FR ? 'Saisissez votre adresse e-mail.' : 'Vul je e-mailadres in.',
  geenCode:     _FR ? "Impossible d'envoyer un code : " : 'Kon geen code sturen: ',
  codeGemaild:  _FR ? 'Nous vous avons envoyé un code par e-mail. Saisissez-le ci-dessus.' : 'We hebben je een code gemaild. Vul ze hierboven in.',
  vulCode:      _FR ? 'Saisissez le code reçu par e-mail.' : 'Vul de code uit je e-mail in.',
  codeFout:     _FR ? 'Code incorrect ou expiré : ' : 'Code klopt niet of is verlopen: ',
  geenApps:     _FR ? "Vous n'avez encore accès à aucune application. Demandez l'accès à votre gestionnaire." : 'Je hebt nog geen toegang tot apps. Vraag toegang aan je manager.',
  initFout:     _FR ? "Erreur d'initialisation : " : 'Init-fout: ',
};

// App-catalogus — zelfde app_id's en gating als het bestaande portaal (managers
// bepalen de toegang per gebruiker). Enkel de zichtbare namen zijn merk-neutraal.
// Vlaggen: altijd | managerOnly | gatedBy | extern | video.
const APP_CATALOG = [
  { id: 'ek',           naam: 'Energie-Compas',   ico: '📊', beschrijving: 'Snelle energie-analyse → besparing & rendement in één scherm, met adviseur-link om het resultaat te delen.', url: '/apps/ek.html?prep=1', gatedBy: 'energiekompas' },
  { id: 'adviseur',     naam: 'Mijn klanten',     ico: '👥', beschrijving: 'Nodig klanten uit voor een energie-analyse. Zij sturen hun factuur en worden automatisch aan u gekoppeld.', url: '/apps/adviseur.html', gatedBy: 'energiekompas' },
  { id: 'energiekompas',naam: 'Energie-schil',    ico: '🔆', beschrijving: 'Uw energie-advies in één schil: particulier of bedrijf → besparing, rendement en advies.', url: '/apps/energiekompas.html' },
  { id: 'academy',      naam: 'Academy',          ico: '🎓', beschrijving: 'Opleiding, modules en certificaten.', url: '/apps/academy.html', altijd: true },
  { id: 'energiemarkt', naam: 'Energiemarkt',     ico: '📈', beschrijving: 'Marktdata (spot & onbalans) — werkt de simulatiedata bij.', url: '/apps/energiemarkt.html' },
  { id: 'gemeenteplan', naam: 'Gemeenteplan',     ico: '🗺️', beschrijving: 'Laadplan per gemeente → mail met PPTX + PDF.', url: '/apps/gemeenteplan.html' },
  { id: 'kamino',       naam: 'Kamino',           ico: '🧭', beschrijving: '4 vragen → antwoord + rapport. Uw pad naar maximale elektrificatie.', url: '/apps/kamino.html' },
  { id: 'simulator',    naam: 'Simulator',        ico: '⚡', beschrijving: 'Factuur → ontwerp → offerte + rapport.', url: '/apps/simulator.html' },
  { id: 'betaalplein',  naam: 'Laadplein',        ico: '🔌', beschrijving: 'Bestaande aansluiting → laadplein: schat de laadsessies in, zie rendement + klantrapport.', url: '/apps/simulator.html?flow=betaalplein' },
  { id: 'thuisladen',   naam: 'Thuisladen',       ico: '🏠', beschrijving: 'Cafetariaplan-laadpaal: PV/batterij thuis optimaliseren.', url: '/apps/thuisladen.html' },
  { id: 'gebruikers',   naam: 'Gebruikers',       ico: '👥', beschrijving: 'Toegang tot de tools beheren.', url: '/apps/gebruikers.html', managerOnly: true },
  { id: 'mandaten',     naam: 'Mandaten',         ico: '🗂️', beschrijving: 'Mandaatstatus per EAN + adres-bevestigingen om na te kijken.', url: '/apps/mandaten.html', managerOnly: true },
  { id: 'projecten',    naam: 'Projecten',        ico: '📁', beschrijving: 'Alle projecten: status, volgende actie en archief — voor managers.', url: '/apps/projecten.html', managerOnly: true },
  { id: 'profiel-import', naam: 'Profiel-import', ico: '📉', beschrijving: 'Verbruiksprofiel (CSV/Excel, elk formaat) omzetten naar een gemeten profiel bij een project.', url: '/apps/profiel-import.html', managerOnly: true },
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
      body: JSON.stringify({ email }),
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
  return APP_CATALOG.filter((a) => {
    if (a.altijd) return true;
    if (role === 'klant') return false;
    if (a.managerOnly) return role === 'manager';
    if (a.gatedBy) return role === 'manager' || verleend.has(a.gatedBy);
    return verleend.has(a.id);
  });
}

function renderLauncher(apps) {
  const host = $('apps'); host.innerHTML = '';
  if (!apps.length) {
    host.innerHTML = '<p class="notice">' + T.geenApps + '</p>';
    return;
  }
  apps.forEach((a) => {
    const t = document.createElement('a');
    t.className = 'app-tile';
    t.href = (a.id === 'academy') ? academyUrl() : a.url;
    if (a.extern) { t.target = '_blank'; t.rel = 'noopener'; }
    t.innerHTML = `<div class="ico">${a.ico}</div><h3>${a.naam}</h3><p>${a.beschrijving}</p>`;
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
