// ── Portaal: Academy/Supabase-login + RBAC-launcher + offerte-flow ───────────
// Bouwt voort op het bestaande 9a-toegangsmodel: de fluctus-proxy valideert de
// Supabase-JWT en checkt user_app_access via POST /api/app-access/check.
// Niet-toegankelijke apps worden VERBORGEN (geen disabled).

const $ = (id) => document.getElementById(id);

// App-catalogus = de 9a-apps. url is configureerbaar; de eigenlijke inbedding
// van de simulator in deze app is de resterende integratiestap (workflow-taak).
const APP_CATALOG = [
  { id: 'simulator',   naam: 'Simulator',        ico: '⚡', beschrijving: 'Factuur → ontwerp → offerte + rapport.', url: '/apps/simulator.html' },
  // Congestie & Energiemarkt worden toegevoegd zodra ze in de app ingebed zijn.
  // { id: 'congestie',   naam: 'Congestie',    ico: '🌐', beschrijving: 'Netcongestie & load factor.',      url: '/apps/congestie.html' },
  // { id: 'energiemarkt',naam: 'Energiemarkt', ico: '📈', beschrijving: 'Marktdashboard spot & imbalance.', url: '/apps/energiemarkt.html' },
];

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
async function toegankelijkeApps(token) {
  const base = CFG.fluctusProxyUrl || '';
  const out = [];
  await Promise.all(APP_CATALOG.map(async (app) => {
    try {
      const r = await fetch(`${base}/api/app-access/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ app_id: app.id }),
      });
      if (!r.ok) return;
      const j = await r.json();
      if (j && (j.toegang || j.access || j.ok)) out.push(app);
    } catch (e) { /* verborgen bij fout */ }
  }));
  return out;
}

function renderLauncher(apps) {
  const host = $('apps'); host.innerHTML = '';
  if (!apps.length) {
    host.innerHTML = '<p class="notice">Je hebt nog geen toegang tot apps. Vraag toegang aan je manager.</p>';
    return;
  }
  apps.forEach(a => {
    const t = document.createElement('a');
    t.className = 'app-tile'; t.href = a.url;
    t.innerHTML = `<div class="ico">${a.ico}</div><h3>${a.naam}</h3><p class="notice">${a.beschrijving}</p>`;
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
