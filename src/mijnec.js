// mijnec.js v1.17.0 — 2026-10-24 — tegel «Campagne LinkedIn» enkel voor oekene@gmail.com en patrick@energie-compas.eu (vlag alleenVoor).
// mijnec.js v1.16.0 — 2026-10-24 — tegel «Campagne LinkedIn» (📅 /apps/campagne-li.html, managers; server ≥ 15.351.0).
// mijnec.js v1.15.0 — 2026-10-20 — «Mijn klanten» en «Energie-schil» enkel nog voor managers (adviseurs kregen ze mee via de toegang energiekompas van Energie-Compas).
// mijnec.js v1.14.0 — 2026-10-18 — tegel «Kompas-trechter» (managers, server ≥ 15.337.0).
// mijnec.js v1.13.0 — 2026-10-18 — /login?naar=/apps/… : na het aanmelden (of al aangemeld) meteen door naar het dossier (mailknop via de adviseur).
// mijnec.js v1.12.0 — 2026-10-16 — laag 1 en 2 volgen de server-toegang (rol-standaard + toekenning − per gebruiker uitgezet in Gebruikers; proxy ≥ 15.320.0).
// mijnec.js v1.11.0 — 2026-10-16 — MijnEC in drie lagen: (1) iedereen die inlogt: Energiemarkt + Projecten (eigen projecten); (2) erkende adviseurs: Lead Generator + Energie-Compas; (3) beheer enkel managers (David + Johan): Simulator, Gebruikers, Mandaten, Profiel-import, Demo, Hulpvragen, Lead Generator — opvolging, Contracten (oekene); daaronder «Minder gebruikt». Vereist proxy ≥ 15.316.0.
// mijnec.js v1.12.0 — 2026-10-18 — tegels vertaald (FR/EN: naam + beschrijving, TEGEL_TR). mijnec.js v1.10.1 — 2026-10-16 — tegel 'gemeenteplan' heet nu «Lead Generator» (app_id/URL ongewijzigd); log-tegel «Lead Generator — opvolging». mijnec.js v1.10.0 — 2026-10-16 — Gemeenteplan = Lead Generator (kaart per gemeente i.p.v. mail) + managerOnly-tegel opvolging (/apps/leadgen-log.html). mijnec.js v1.9.0 — 2026-10-16 — (1) tegel '📝 Contracten' enkel voor oekene@gmail.com (oekeneOnly); (2) SNELLER: tegels van de vorige keer meteen tonen (localStorage per gebruiker), één POST /api/app-access/bulk i.p.v. 1 check per tegel (fallback: oude checks), niet opnieuw renderen bij INITIAL_SESSION/TOKEN_REFRESHED, config + Supabase-lib parallel. mijnec.js v1.8.0 — 2026-10-15 — manager-portal: niet-actieve tegels onderaan onder een lijn «Minder gebruikt» (gedempt); Academy niet meer automatisch; Energie-Compas/Mijn klanten/Laadplein ook apart toe te kennen (Gebruikers v1.9). mijnec.js v1.7.0 — 2026-10-12 — managerOnly-tegel 'campagne' (📣 EPC-campagne → /apps/campagne.html). v1.6.0 — 2026-10-11 — tegel 'hulp' toont het aantal hulpvragen dat nog beantwoord moet worden (rode teller). v1.5.0 — 2026-10-11 — managerOnly-tegel 'hulp' (🙋 Hulpvragen → /apps/hulp.html). v1.4.0 — 2026-10-11 — managerOnly-tegel 'demo' (🎬 Demo → /apps/demo.html). v1.3.0 — 2026-10-10 — MijnEC portaal (Energie-Compas).
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
const MGR_ENKEL = new Set(['adviseur', 'energiekompas']);   /* v1.15.0: oude tegels, niet voor adviseurs */
const APP_CATALOG = [
  { id: 'ek',           naam: 'Energie-Compas',   ico: '📊', beschrijving: 'Snelle energie-analyse → besparing & rendement in één scherm, met adviseur-link om het resultaat te delen.', url: '/apps/ek.html?prep=1', gatedBy: 'energiekompas' },
  { id: 'adviseur',     naam: 'Mijn klanten',     ico: '👥', beschrijving: 'Nodig klanten uit voor een energie-analyse. Zij sturen hun factuur en worden automatisch aan jou gekoppeld.', url: '/apps/adviseur.html', gatedBy: 'energiekompas' },
  { id: 'energiekompas',naam: 'Energie-schil',    ico: '🔆', beschrijving: 'Je energie-advies in één schil: particulier of bedrijf → besparing, rendement en advies.', url: '/apps/energiekompas.html' },
  { id: 'academy',      naam: 'Academy',          ico: '🎓', beschrijving: 'Opleiding, modules en certificaten.', url: '/apps/academy.html' }   /* v1.8.0: niet meer automatisch — per gebruiker toe te kennen */,
  { id: 'energiemarkt', naam: 'Energiemarkt',     ico: '📈', beschrijving: 'Marktdata (spot & onbalans) — werkt de simulatiedata bij.', url: '/apps/energiemarkt.html' },
  { id: 'gemeenteplan', naam: 'Lead Generator',     ico: '🎯', beschrijving: 'Kies een gemeente → kaart met bedrijfsparkings en middenspanningscabines om nieuwe leads te vinden.', url: '/apps/gemeenteplan.html' },
  { id: 'kamino',       naam: 'Kamino',           ico: '🧭', beschrijving: '4 vragen → antwoord + rapport. Je pad naar maximale elektrificatie.', url: '/apps/kamino.html' },
  { id: 'simulator',    naam: 'Simulator',        ico: '⚡', beschrijving: 'Factuur → ontwerp → offerte + rapport.', url: '/apps/simulator.html', managerOnly: true },   // v1.11.0: beheer (David + Johan)
  { id: 'betaalplein',  naam: 'Laadplein',        ico: '🔌', beschrijving: 'Bestaande aansluiting → laadplein: schat de laadsessies in, zie rendement + klantrapport.', url: '/apps/simulator.html?flow=betaalplein' },
  { id: 'thuisladen',   naam: 'Thuisladen',       ico: '🏠', beschrijving: 'Cafetariaplan-laadpaal: PV/batterij thuis optimaliseren.', url: '/apps/thuisladen.html' },
  { id: 'gebruikers',   naam: 'Gebruikers',       ico: '👥', beschrijving: 'Toegang tot de tools beheren.', url: '/apps/gebruikers.html', managerOnly: true },
  { id: 'mandaten',     naam: 'Mandaten',         ico: '🗂️', beschrijving: 'Mandaatstatus per EAN + adres-bevestigingen om na te kijken.', url: '/apps/mandaten.html', managerOnly: true },
  { id: 'projecten',    naam: 'Projecten',        ico: '📁', beschrijving: 'Je projecten openen en opvolgen (managers: alle projecten, status, volgende actie en archief).', url: '/apps/projecten.html' },   // v1.11.0: voor iedereen (server toont enkel eigen projecten)
  { id: 'profiel-import', naam: 'Profiel-import', ico: '📉', beschrijving: 'Verbruiksprofiel (CSV/Excel, elk formaat) omzetten naar een gemeten profiel bij een project.', url: '/apps/profiel-import.html', managerOnly: true },
  { id: 'demo', naam: 'Demo', ico: '🎬', beschrijving: 'Demo klantbeleving: per bezoeker elke stap met tijdstip, interesse- en vlot-score.', url: '/apps/demo.html', managerOnly: true },   // 2026-10-11 (Johan): demo-overzicht
  { id: 'hulp', naam: 'Hulpvragen', ico: '🙋', beschrijving: 'Hulpvragen van klanten en demo-bezoekers: open, beantwoord of gebeld — beantwoorden in het project.', url: '/apps/hulp.html', managerOnly: true },   // 2026-10-11 (Johan): hulpvragen
  { id: 'contracten', naam: 'Contracten', ico: '📝', beschrijving: 'Samenwerkingsovereenkomsten (Brelco-model) opmaken, ter ondertekening sturen en digitaal laten tekenen.', url: '/apps/contracten.html', oekeneOnly: true },   // v1.9.0 (Johan 16-10): enkel oekene
  { id: 'leadgen-log', naam: 'Lead Generator — opvolging', ico: '📋', beschrijving: 'Wie doet wat in de Lead Generator: geopende gemeenten, bekeken parkings, genoteerde leads.', url: '/apps/leadgen-log.html', managerOnly: true },   // 2026-10-16 (Johan): opvolging leadgenerator
  { id: 'trechter', naam: 'Kompas-trechter', ico: '🧭', beschrijving: 'Hoeveel dossiers elke kompasfase bereikten (data → advies → offertes → bevestigd → sturing aan) en waar ze nu staan.', url: '/apps/trechter.html', managerOnly: true },   // 2026-10-18 (Johan): kompas-trechter
  { id: 'campagne', naam: 'EPC-campagne', ico: '📣', beschrijving: 'Contacten (naam, mail, telefoon, leverancier/installateur, taal) bijhouden en de campagnemail met de brochure versturen.', url: '/apps/campagne.html', managerOnly: true },   // 2026-10-12 (Johan): EPC-campagne
  { id: 'campagne-li', naam: 'Campagne LinkedIn', ico: '📅', beschrijving: 'Campagnedashboard: wanneer wat posten, blogs publiceren, eerste reacties, ambassadeurs en hun acties, bronnen.', url: '/apps/campagne-li.html', alleenVoor: ['oekene@gmail.com', 'patrick@energie-compas.eu'] },   // 2026-10-24 (Johan): LinkedIn-campagne
];

// v1.12.0 (Johan 18-10): tegels vertaald (FR/EN) — naam + beschrijving per app-id; NL blijft in APP_CATALOG.
//   FR/EN zonder merknamen van netbeheerder/agentschap (geen «Fluvius»/«VEKA»).
const TEGEL_TR = {
  ek:            { fr: ['Energie-Compas', 'Analyse énergétique rapide → économies et rendement en un écran, avec un lien conseiller pour partager le résultat.'], en: ['Energie-Compas', 'Quick energy analysis → savings and return on one screen, with an adviser link to share the result.'] },
  adviseur:      { fr: ['Mes clients', 'Invitez vos clients à une analyse énergétique. Ils envoient leur facture et sont automatiquement liés à vous.'], en: ['My customers', 'Invite customers to an energy analysis. They send their bill and are automatically linked to you.'] },
  energiekompas: { fr: ['Parcours énergie', 'Votre conseil énergétique en un parcours : particulier ou entreprise → économies, rendement et conseil.'], en: ['Energy journey', 'Your energy advice in one journey: household or company → savings, return and advice.'] },
  academy:       { fr: ['Academy', 'Formation, modules et certificats.'], en: ['Academy', 'Training, modules and certificates.'] },
  energiemarkt:  { fr: ['Marché de l’énergie', 'Données de marché (spot et déséquilibre) — met à jour les données de simulation.'], en: ['Energy market', 'Market data (spot and imbalance) — updates the simulation data.'] },
  gemeenteplan:  { fr: ['Lead Generator', 'Choisissez une commune → carte des parkings d’entreprise et des cabines moyenne tension pour trouver de nouveaux leads.'], en: ['Lead Generator', 'Choose a municipality → map of company car parks and medium-voltage substations to find new leads.'] },
  kamino:        { fr: ['Kamino', '4 questions → réponse + rapport. Votre chemin vers une électrification maximale.'], en: ['Kamino', '4 questions → answer + report. Your path to maximum electrification.'] },
  simulator:     { fr: ['Simulateur', 'Facture → conception → offre + rapport.'], en: ['Simulator', 'Bill → design → quote + report.'] },
  betaalplein:   { fr: ['Parc de recharge', 'Raccordement existant → parc de recharge : estimez les sessions, voyez le rendement + le rapport client.'], en: ['Charging hub', 'Existing connection → charging hub: estimate the sessions, see the return + customer report.'] },
  thuisladen:    { fr: ['Recharge à domicile', 'Borne via plan cafétéria : optimiser PV et batterie à la maison.'], en: ['Home charging', 'Cafeteria-plan charger: optimise PV and battery at home.'] },
  gebruikers:    { fr: ['Utilisateurs', 'Gérer l’accès aux outils.'], en: ['Users', 'Manage access to the tools.'] },
  mandaten:      { fr: ['Mandats', 'Statut des mandats par EAN + confirmations d’adresse à vérifier.'], en: ['Mandates', 'Mandate status per EAN + address confirmations to check.'] },
  projecten:     { fr: ['Projets', 'Ouvrir et suivre vos projets (gestionnaires : tous les projets, statut, prochaine action et archives).'], en: ['Projects', 'Open and follow up your projects (managers: all projects, status, next action and archive).'] },
  'profiel-import': { fr: ['Import de profil', 'Convertir un profil de consommation (CSV/Excel, tout format) en profil mesuré d’un projet.'], en: ['Profile import', 'Convert a consumption profile (CSV/Excel, any format) into a measured profile for a project.'] },
  demo:          { fr: ['Démo', 'Démo de l’expérience client : chaque étape par visiteur, avec horodatage et scores.'], en: ['Demo', 'Customer experience demo: every step per visitor, with timestamp and scores.'] },
  hulp:          { fr: ['Questions d’aide', 'Questions des clients : ouvertes, répondues ou rappelées — répondre dans le projet.'], en: ['Help requests', 'Customer questions: open, answered or called back — answer in the project.'] },
  contracten:    { fr: ['Contrats', 'Rédiger des conventions de collaboration, les envoyer et les faire signer numériquement.'], en: ['Contracts', 'Draft cooperation agreements, send them and have them signed digitally.'] },
  'leadgen-log': { fr: ['Lead Generator — suivi', 'Qui fait quoi dans le Lead Generator : communes ouvertes, parkings consultés, leads notés.'], en: ['Lead Generator — follow-up', 'Who does what in the Lead Generator: municipalities opened, car parks viewed, leads noted.'] },
  trechter:      { fr: ['Entonnoir boussole', 'Combien de dossiers ont atteint chaque étape (données → conseil → offres → confirmé → pilotage actif).'], en: ['Compass funnel', 'How many files reached each step (data → advice → quotes → confirmed → control on).'] },
  campagne:      { fr: ['Campagne EPC', 'Gérer les contacts et envoyer le mail de campagne avec la brochure.'], en: ['EPC campaign', 'Manage contacts and send the campaign e-mail with the brochure.'] },
  'campagne-li': { fr: ['Campagne LinkedIn', 'Tableau de bord : quoi publier et quand, blogs, premiers commentaires, ambassadeurs et leurs actions, sources.'], en: ['LinkedIn campaign', 'Dashboard: what to post and when, blogs, first comments, ambassadors and their actions, sources.'] },
};
function tegelTekst(a) { const L = _FR ? 'fr' : (_EN ? 'en' : null), x = L && TEGEL_TR[a.id] && TEGEL_TR[a.id][L]; return x ? { naam: x[0], beschrijving: x[1] } : { naam: a.naam, beschrijving: a.beschrijving }; }

// v1.11.0 (Johan 16-10): MijnEC in drie lagen boven «Minder gebruikt»:
//   laag 1 = iedereen die inlogt (geverifieerd mailadres): Energiemarkt, Projecten (server toont enkel eigen projecten);
//   laag 2 = erkende adviseurs (profiel in Gebruikers / contract-domein) + managers: Lead Generator, Energie-Compas;
//   laag 3 = beheer, enkel managers (David + Johan): Simulator, Gebruikers, Mandaten, Profiel-import, Demo, Hulpvragen,
//            Lead Generator — opvolging (+ Contracten enkel oekene). Daaronder ongewijzigd: «Minder gebruikt».
const LAAG = { energiemarkt: 1, projecten: 1, gemeenteplan: 2, ek: 2, simulator: 3, gebruikers: 3, mandaten: 3, 'profiel-import': 3, demo: 3, hulp: 3, contracten: 3, 'leadgen-log': 3 };
const LAAG_LABEL = { 2: _t('Adviseurs', 'Conseillers', 'Advisers'), 3: _t('Beheer', 'Gestion', 'Management'), 4: _t('Minder gebruikt', 'Moins utilisé', 'Less used') };
function laagVan(a) { return LAAG[a.id] || (NIET_ACTIEF.has(a.id) ? 4 : 3); }

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
  // v1.9.0: enkel opnieuw renderen als de gebruiker wisselt (niet bij INITIAL_SESSION/TOKEN_REFRESHED)
  sb.auth.onAuthStateChange((_e, s) => { SESSION = s; const uid = (s && s.user && s.user.id) || null; if (uid !== _renderUid) render(); });
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

async function toegankelijkeApps(token, email) {
  const base = CFG.fluctusProxyUrl || '';
  const echte = APP_CATALOG.filter((a) => !a.altijd && !a.managerOnly && !a.oekeneOnly && !a.alleenVoor);   // v1.8.0: ook gatedBy-tegels apart checken
  const verleend = new Set();
  let role = 'seller', isAdv = false, isMgr = false;   // v1.11.0: adviseur/manager-vlag uit de bulk-respons (proxy ≥ 15.316.0)
  // v1.9.0: één bulk-request (proxy ≥ 15.306.0); lukt dat niet → de oude check per tegel.
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
        if (j.user) { isAdv = !!j.user.adviseur; isMgr = !!j.user.manager; }
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
  if (role === 'manager') isMgr = true;
  return APP_CATALOG.filter((a) => {
    if (a.alleenVoor) return a.alleenVoor.includes(String(email || '').toLowerCase());   // 2026-10-24
    if (a.oekeneOnly) return String(email || '').toLowerCase() === 'oekene@gmail.com';   // v1.9.0
    const laag = laagVan(a);   // v1.11.0
    if (MGR_ENKEL.has(a.id)) return role === 'manager' || isMgr;   /* v1.15.0 (Johan 20-10) */
    if (laag === 1) return isMgr || verleend.has(a.id);          // iedereen die inlogt (v1.12.0: tenzij in Gebruikers uitgezet — server beslist)
    if (laag === 2) return isMgr || verleend.has(a.id);          // erkende adviseurs (rol-standaard) of toegekend, tenzij uitgezet
    if (laag === 3) return isMgr;                                 // beheer: enkel managers
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
  // v1.11.0 (Johan 16-10): tegels per laag (1 iedereen · 2 adviseurs · 3 beheer · 4 minder gebruikt), met een lijn + label
  //   tussen de lagen (enkel als er erboven al tegels staan). Laag 4 blijft gedempt.
  const gesorteerd = [];
  [1, 2, 3, 4].forEach((l) => {
    const deel = apps.filter((a) => laagVan(a) === l);
    if (!deel.length) return;
    if (gesorteerd.length) gesorteerd.push({ _scheiding: true, label: LAAG_LABEL[l] || '' });
    deel.forEach((a) => gesorteerd.push(a));
  });
  apps = gesorteerd;
  apps.forEach((a) => {
    if (a._scheiding) {
      const sep = document.createElement('div');
      sep.style.cssText = 'grid-column:1/-1;display:flex;align-items:center;gap:12px;margin:10px 0 0;color:#8a94a6;font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase';
      sep.innerHTML = '<span style="flex:1;height:1px;background:#d9dee7"></span><span>' + a.label + '</span><span style="flex:1;height:1px;background:#d9dee7"></span>';
      host.appendChild(sep);
      return;
    }
    const t = document.createElement('a');
    t.className = 'app-tile'; t.dataset.app = a.id;   // v1.6.0: data-app voor tellers
    t.href = (a.id === 'academy') ? academyUrl() : a.url;
    if (a.extern) { t.target = '_blank'; t.rel = 'noopener'; }
    const _tt = tegelTekst(a);   // v1.12.0: FR/EN
    t.innerHTML = `<div class="ico">${a.ico}</div><h3>${_tt.naam}</h3><p>${_tt.beschrijving}</p>`;
    if (laagVan(a) === 4) { t.style.opacity = '.6'; t.style.background = '#f7f8fa'; }
    host.appendChild(t);
  });
}

// v1.9.0: tegel-cache per gebruiker (enkel app-id's; toegang wordt altijd opnieuw gecontroleerd).
let _renderUid = null;
let _renderNr = 0;
function tegelsUitCache(uid, email) {
  try {
    const ids = JSON.parse(localStorage.getItem('EC_MIJNEC_TEGELS_' + uid) || 'null');
    if (!Array.isArray(ids)) return null;
    return ids.map((id) => APP_CATALOG.find((a) => a.id === id)).filter((a) => a && (!a.oekeneOnly || String(email || '').toLowerCase() === 'oekene@gmail.com') && (!a.alleenVoor || a.alleenVoor.includes(String(email || '').toLowerCase())));
  } catch (e) { return null; }
}
function tegelsInCache(uid, apps) {
  try { localStorage.setItem('EC_MIJNEC_TEGELS_' + uid, JSON.stringify(apps.map((a) => a.id))); } catch (e) { /* geen opslag */ }
}

// v1.13.0 (Johan 18-10): doorverwijzing na het aanmelden — /login?naar=/apps/ek.html?case=… (mailknop die via de adviseur
//   bij de klant komt). Enkel relatieve /apps/-paden (geen open redirect). Al aangemeld → meteen door.
function naarPad() {
  try { const n = new URLSearchParams(location.search).get('naar') || '';
    return (/^\/apps\/[A-Za-z0-9_.\-\/]+\.html(\?[^#\s]*)?$/.test(n) && n.indexOf('//') < 0) ? n : null; } catch (e) { return null; }
}
async function render() {
  const loggedIn = !!SESSION;
  const naar = naarPad();
  if (loggedIn && naar) { location.replace(naar); return; }
  if (!loggedIn && naar && !$('login-msg').textContent) $('login-msg').textContent = _t('Meld je aan om je dossier te openen — je krijgt een code per mail.', 'Connectez-vous pour ouvrir votre dossier — vous recevrez un code par e-mail.', 'Sign in to open your file — you will receive a code by e-mail.');
  $('gate').classList.toggle('hidden', loggedIn);
  $('app').classList.toggle('hidden', !loggedIn);
  $('portal-logout').classList.toggle('hidden', !loggedIn);
  if (!loggedIn) { _renderUid = null; _renderNr++; $('portal-user').textContent = ''; return; }
  const user = SESSION.user || {};
  $('portal-user').textContent = user.email || '';
  $('hi-naam').textContent = user.email ? (', ' + user.email.split('@')[0]) : '';
  // v1.9.0: tegels van de vorige keer meteen tonen, daarna bijwerken met de echte toegang.
  const uid = user.id || '';
  _renderUid = uid;
  const nr = ++_renderNr;
  const vorige = tegelsUitCache(uid, user.email);
  if (vorige && vorige.length) { renderLauncher(vorige); hulpTeller(SESSION.access_token); }
  const apps = await toegankelijkeApps(SESSION.access_token, user.email);
  if (nr !== _renderNr || !SESSION) return;
  const nieuw = apps.map((a) => a.id).join(',');
  if (!vorige || vorige.map((a) => a.id).join(',') !== nieuw) { renderLauncher(apps); hulpTeller(SESSION.access_token); }
  tegelsInCache(uid, apps);
}

window.addEventListener('DOMContentLoaded', async () => {
  $('btn-code').onclick = sendCode;
  $('btn-verify').onclick = verifyCode;
  $('btn-opnieuw').onclick = resetLogin;
  $('portal-logout').onclick = logout;
  $('login-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') verifyCode(); });
  $('login-email').addEventListener('keydown', (e) => { if (e.key === 'Enter' && $('stap-code').classList.contains('hidden')) sendCode(); });
  try { const lib = injectSupabase().catch((e) => e); await loadConfig(); const fout = await lib; if (fout instanceof Error) throw fout; await initAuth(); }   // v1.9.0: parallel
  catch (e) { $('login-msg').textContent = T.initFout + e.message; }
});
