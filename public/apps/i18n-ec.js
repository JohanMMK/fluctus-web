/* i18n-ec.js — Energie-Compas runtime vertaallaag (NL → FR)
   v0.2.0 (2026-10-09, Johan: "volledig FR") — SEGMENT-SJABLONEN i.p.v. woordvervanging.
     v0.1 vertaalde met losse woord-/substringvervangingen (EC_FR_DICT) → Franglais ("pointevermogen",
     "afnamepointeen", "Met des panneaux solaires … neemt u minder van het net af"). v0.2:
     • Elke tekstknoop wordt als GEHEEL segment opgezocht. Getallen worden eerst vervangen door {#} en
       maandnamen door {m} → één sjabloon dekt alle bedragen/datums. FR-tekst krijgt de getallen terug
       (FR-notatie: duizendtal met harde spatie, decimaal komma) en de FR-maandnaam.
     • Context-sleutel "segment|volgende tekst" voor korte fragmenten die afhangen van wat volgt
       (bv. "Een" + "passieve respons…" → "Une", maar "Een" + "digitale meter" → "Un").
     • GEEN gedeeltelijke vervanging meer: een onbekend segment blijft volledig NL (nooit gemengd) en wordt
       gelogd in window.EC_FR_MISSING (dekkingstest).
     • Taal: ?lang=fr (URL) of window.EC_LANG of KLANTRAPPORT_DATA.lang === 'fr'. NL blijft default en
       deze laag is dan een NO-OP (anti-regressie).
   Woordenboeken (geladen vóór dit script): window.EC_FR_SEG (fr-ec-seg.js, sjablonen) + window.EC_FR_EXACT
   (fr-ec-dict.js, oude exacte labels; enkel als vangnet). EC_FR_DICT/EC_FR_RULES worden NIET meer gebruikt.
   v0.2.2 (2026-10-09): samengestelde segmenten mogen op een slotpunt eindigen.
   v0.2.1 (2026-10-09): + samengestelde segmenten ("a · b · c" → per deel, enkel als alle delen gekend zijn) + regels
     EC_FR_FN [regex, fn] voor zinnen met vrije tekst (profielnaam, spanning, bron) — gevonden bij de live dekkingsscan van het EK-resultaatscherm.
   v0.1.0 (2026-10-04): eerste versie (substring-woordenboek). */
(function () {
  var p; try { p = new URLSearchParams(location.search); } catch (e) { p = null; }
  var q = (p && (p.get('lang') || '')) || '';
  var dl = ''; try { dl = (window.KLANTRAPPORT_DATA && window.KLANTRAPPORT_DATA.lang) || ''; } catch (e) {}
  var LANG = (q || window.EC_LANG || dl || 'nl').toString().toLowerCase();
  if (LANG !== 'fr') LANG = 'nl';
  window.EC_LANG = LANG;
  window.EC_LOCALE = (LANG === 'fr') ? 'fr-BE' : 'nl-BE';

  var SEG = window.EC_FR_SEG || {};
  var EXACT = window.EC_FR_EXACT || {};
  var MISSING = window.EC_FR_MISSING = window.EC_FR_MISSING || new Set();
  var DONE = new Set();   // genormaliseerde FR-uitkomsten → niet opnieuw vertalen/loggen (observer ziet onze eigen wijzigingen)

  var MND = { januari:'janvier', februari:'février', maart:'mars', april:'avril', mei:'mai', juni:'juin', juli:'juillet',
    augustus:'août', september:'septembre', oktober:'octobre', november:'novembre', december:'décembre',
    jan:'janv.', feb:'févr.', mrt:'mars', apr:'avr.', jun:'juin', jul:'juil.', aug:'août', sep:'sept.', sept:'sept.',
    okt:'oct.', nov:'nov.', dec:'déc.' };
  var RE_M = new RegExp('\\b(' + Object.keys(MND).sort(function (a, b) { return b.length - a.length; }).join('|') + ')\\b', 'gi');
  var RE_N = /[-−+]?\d+(?:[.,]\d+)*/g;
  var NB = ' ';

  function norm(s) { return s.replace(/\s+/g, ' ').trim().replace(RE_N, '{#}').replace(RE_M, '{m}'); }
  // NL-getal → FR-notatie: duizendtalpunt → harde spatie (enkel als het echt duizendtallen zijn); decimaalkomma blijft.
  function fmtNum(t) {
    if (/^[-−+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) return t.replace(/\./g, NB);
    return t;
  }
  function maand(m) { var f = MND[m.toLowerCase()]; if (!f) return m; return (m.charAt(0) === m.charAt(0).toUpperCase()) ? f.charAt(0).toUpperCase() + f.slice(1) : f; }
  function vul(tpl, nums, mnds) {
    var i = 0, j = 0;
    return tpl.replace(/\{#\}|\{m\}/g, function (ph) {
      if (ph === '{#}') { var n = nums[i++]; return n == null ? '' : fmtNum(n); }
      var m = mnds[j++]; return m == null ? '' : maand(m);
    });
  }
  var PROF = { 'kantoor':'bureau', 'kantoor / diensten':'bureau / services', 'residentieel':'résidentiel', 'woning':'logement',
    'horeca':'horeca', 'school':'école', 'garage':'atelier / garage', 'werkplaats / garage':'atelier / garage',
    'opslag / magazijn':'stockage / entrepôt', 'opslag___magazijn':'stockage / entrepôt', 'landbouw':'agriculture', 'boer_melkvee':'agriculture (élevage laitier)',
    'industrie_voeding':'industrie / production', 'industrie / productie':'industrie / production',
    'retail_zonder_koeling':'commerce — sans réfrigération', 'retail_voeding_en_koeling':'commerce alimentaire — avec réfrigération' };

  var H = { zoek: function (x) { return zoek(x); }, num: function (x) { return fmtNum(x); }, prof: function (x) { return PROF[String(x).toLowerCase()] || zoek(x) || x; } };
  // v0.2.1: opzoeken zonder te loggen (voor delen van samengestelde segmenten).
  function zoek(core) {
    var key = norm(core);
    if (Object.prototype.hasOwnProperty.call(SEG, key)) {
      var nums = core.match(RE_N) || [], mnds = (core.replace(RE_N, ' ').match(RE_M)) || [];
      return vul(SEG[key], nums, mnds);
    }
    if (Object.prototype.hasOwnProperty.call(EXACT, core)) return EXACT[core];
    var lc = core.toLowerCase(); if (Object.prototype.hasOwnProperty.call(PROF, lc)) return PROF[lc];
    if (!/[A-Za-zÀ-ÿ]/.test(core)) return core;
    return null;
  }
  // Vertaal één tekstsegment; nxt = (genormaliseerde) tekst die erop volgt, voor context-sleutels.
  function trSeg(txt, nxt) {
    if (!txt) return txt;
    var core = txt.replace(/\s+/g, ' ').trim();
    if (!core) return txt;
    // v0.2.1: puur numerieke segmenten ("€ 10.821", "3.241.263 km", "1.234 kWh") → enkel FR-getalnotatie.
    if (!/[A-Za-zÀ-ÿ]/.test(core) || /^[€±≈~+\-−\s\d.,%×\/]*\s?(km|kW|kWh|MWh|kWc|kVA|GWh)?(\/(j|jaar|an))?\s*$/.test(core)) {
      var nn = txt.replace(RE_N, function (t) { return fmtNum(t); }).replace(/\/(j|jaar)\s*$/, '/an');
      return nn;
    }
    var lead = txt.match(/^\s*/)[0], trail = txt.match(/\s*$/)[0];
    // "(vervolg)" wordt na de vertaling door de her-paginering achter een (reeds FR) titel geplakt → "(suite)".
    var mv = core.match(/^(.*\S)\s*\(vervolg\)$/);
    if (mv) { var basis = trSeg(mv[1], null); var rv = (/\(suite\)$/.test(basis) ? basis : basis + ' (suite)'); DONE.add(norm(rv)); return lead + rv + trail; }
    var key = norm(core), tpl = null;
    if (DONE.has(key)) return txt;
    if (nxt != null) { var ck = key + '|' + nxt; if (Object.prototype.hasOwnProperty.call(SEG, ck)) tpl = SEG[ck]; }
    if (tpl == null && Object.prototype.hasOwnProperty.call(SEG, key)) tpl = SEG[key];
    if (tpl == null && Object.prototype.hasOwnProperty.call(EXACT, core)) { DONE.add(norm(EXACT[core])); return lead + EXACT[core] + trail; }
    if (tpl == null) {
      var mp = core.match(/^Standaardprofiel \(SLP\) — (.+)$/);
      if (mp) { var pr = PROF[mp[1].toLowerCase()] || mp[1]; return lead + 'Profil standard (SLP) — ' + pr + trail; }
    }
    if (tpl == null) {
      // v0.2.1: regels (fr-ec-seg.js EC_FR_FN) voor zinnen met vrije tekst (profielnaam, spanning, bron…)
      var FN = window.EC_FR_FN || [];
      for (var r = 0; r < FN.length; r++) { var mm = core.match(FN[r][0]); if (mm) { var rr = FN[r][1](mm, H); if (rr != null) { DONE.add(norm(rr)); return lead + rr + trail; } } }
      // v0.2.1: samengesteld segment "a · b · c" → elk deel apart (enkel als ALLE delen gekend zijn)
      if (core.indexOf(' · ') > 0) {
        var punt = /\.$/.test(core) ? '.' : '', kern = punt ? core.slice(0, -1) : core;   // slotpunt apart
        var dl = kern.split(' · '), uit = [], ok = true;
        for (var d = 0; d < dl.length; d++) { var t = zoek(dl[d].trim()); if (t == null) { ok = false; break; } uit.push(t); }
        if (ok) { var res2 = uit.join(' · ') + punt; DONE.add(norm(res2)); return lead + res2 + trail; }
      }
      if (/[a-zà-ÿ]{3,}/i.test(key.replace(/\{[#m]\}/g, ''))) MISSING.add(key); return txt;
    }
    var nums = core.match(RE_N) || [], mnds = (core.replace(RE_N, ' ').match(RE_M)) || [];
    var res = vul(tpl, nums, mnds); DONE.add(norm(res));
    return lead + res + trail;
  }

  function volgendeTekst(n) {
    var s = n.nextSibling;
    while (s && s.nodeType === 3 && !s.nodeValue.trim()) s = s.nextSibling;
    if (!s && n.parentNode && n.parentNode.nextSibling) s = n.parentNode.nextSibling;   // tekst in <b> → wat na de <b> komt
    if (!s) return null;
    var t = (s.nodeType === 3 ? s.nodeValue : (s.textContent || ''));
    return t ? norm(t) : null;
  }

  function EC_translate(root) {
    if (LANG !== 'fr' || !root) return;
    try {
      if (root.nodeType === 3) { var v0 = root.nodeValue; var t0 = trSeg(v0, volgendeTekst(root)); if (t0 !== v0) root.nodeValue = t0; return; }
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, jobs = [];
      while ((n = w.nextNode())) {
        var pa = n.parentNode; if (pa && (pa.nodeName === 'SCRIPT' || pa.nodeName === 'STYLE')) continue;
        if (pa && pa.closest && pa.closest('[data-i18n-skip]')) continue;
        var v = n.nodeValue;
        if (v && v.trim()) { var nv = trSeg(v, volgendeTekst(n)); if (nv !== v) jobs.push([n, nv]); }
      }
      jobs.forEach(function (j) { j[0].nodeValue = j[1]; });
      ['placeholder', 'title', 'aria-label'].forEach(function (a) {
        var els = root.querySelectorAll ? root.querySelectorAll('[' + a + ']') : [];
        Array.prototype.forEach.call(els, function (el) {
          var v = el.getAttribute(a); if (!v) return; var nv = trSeg(v, null); if (nv !== v) el.setAttribute(a, nv);
        });
      });
      if (root.querySelectorAll) Array.prototype.forEach.call(root.querySelectorAll('input[type=button],input[type=submit]'), function (el) {
        var v = el.value; if (!v) return; var nv = trSeg(v, null); if (nv !== v) el.value = nv; });
    } catch (e) {}
  }

  // HTML-string → vertaalde HTML-string (via een losse DOM-boom, zodat attributen/markup ongemoeid blijven).
  function EC_T_HTML(html) {
    if (LANG !== 'fr' || html == null) return html;
    try { var tp = document.createElement('template'); tp.innerHTML = String(html); EC_translate(tp.content); return tp.innerHTML; }
    catch (e) { return html; }
  }
  function EC_T(txt) { if (LANG !== 'fr' || txt == null) return txt; return trSeg(String(txt), null); }

  window.EC_T_HTML = EC_T_HTML;
  window.EC_T = EC_T;
  window.EC_translate = EC_translate;
  window.EC_norm = norm;

  // lang doorgeven aan interne links (zodat de hele flow FR blijft).
  function EC_propagateLang() {
    if (LANG !== 'fr') return;
    try {
      document.querySelectorAll('a[href]').forEach(function (a) {
        var h = a.getAttribute('href'); if (!h) return;
        if (/^(mailto:|tel:|#|https?:\/\/(?!app\.energie-compas\.eu))/i.test(h)) return;
        if (/[?&]lang=/.test(h)) return;
        var hi = h.indexOf('#'), base = hi >= 0 ? h.slice(0, hi) : h, frag = hi >= 0 ? h.slice(hi) : '';
        a.setAttribute('href', base + (base.indexOf('?') === -1 ? '?' : '&') + 'lang=fr' + frag);
      });
    } catch (e) {}
  }
  window.EC_propagateLang = EC_propagateLang;

  if (LANG === 'fr') {
    try { document.documentElement.setAttribute('lang', 'fr'); } catch (e) {}
    var start = function () {
      EC_translate(document.body);
      EC_propagateLang();
      try {
        var mo = new MutationObserver(function (muts) {
          for (var i = 0; i < muts.length; i++) {
            var mu = muts[i];
            if (mu.type === 'characterData') { var tn = mu.target; var nv0 = trSeg(tn.nodeValue || '', volgendeTekst(tn)); if (nv0 !== tn.nodeValue) tn.nodeValue = nv0; continue; }
            var a = mu.addedNodes; if (!a) continue;
            for (var j = 0; j < a.length; j++) {
              var nd = a[j];
              if (nd.nodeType === 1 || nd.nodeType === 3) EC_translate(nd);
            }
            if (mu.type === 'attributes' && mu.target && mu.attributeName) {
              var el = mu.target, an = mu.attributeName, av = el.getAttribute(an);
              if (av) { var tv = trSeg(av, null); if (tv !== av) el.setAttribute(an, tv); }
            }
          }
        });
        mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
        window.EC_OBS = mo;
      } catch (e) {}
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }
})();
