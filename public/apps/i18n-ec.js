/* i18n-ec.js — Energie-Compas runtime vertaallaag (NL → FR)
   v0.1.0 (2026-10-04, Johan: volledige FR-build EK-trio)

   FILOSOFIE
   - NL is en blijft de default. Deze laag is een NO-OP tenzij ?lang=fr (of window.EC_LANG==='fr').
     Zo kan FR live zonder enig risico voor de bestaande NL-flow (anti-regressie).
   - Vertaling gebeurt op de HTML-STRING (EC_T_HTML) én via een DOM-pass (EC_translate):
       • EC_T_HTML(html): past eerst RULES toe (regex over de volle HTML — kan <b> en getallen
         overspannen, voor dynamische zinnen), daarna DICT op de pure tekst tussen de tags
         (>tekst<), zodat attributen/tagnamen/urls/klassen nooit geraakt worden.
       • EC_translate(node): zelfde logica op bestaande DOM-tekstknopen + enkele attributen.
   - Woordenboek: window.EC_FR_DICT  = { "NL exact fragment": "FR fragment", ... }
                  window.EC_FR_RULES = [ { re:/NL.../, fr:"FR $1 ..." }, ... ]  (voor dynamische zinnen)
   - Alles wat NIET in DICT/RULES zit, valt netjes terug op NL (graceful) — nooit een lege string.
*/
(function () {
  var p; try { p = new URLSearchParams(location.search); } catch (e) { p = null; }
  var q = (p && (p.get('lang') || '')) || '';
  var LANG = (window.EC_LANG || q || 'nl').toString().toLowerCase();
  if (LANG !== 'fr') LANG = 'nl';
  window.EC_LANG = LANG;
  window.EC_LOCALE = (LANG === 'fr') ? 'fr-BE' : 'nl-BE';

  // Woordenboeken (door de pagina geladen vóór dit script, of leeg = enkel fallback):
  //  • EC_FR_EXACT : { "NL": "FR" } — matcht enkel als het HELE segment (getrimd) gelijk is (korte labels).
  //  • EC_FR_DICT  : { "NL": "FR" } — substring-vervanging binnen een segment (zinnen/fragmenten).
  //  • EC_FR_RULES : [ {re,fr} ]    — regex over de volle HTML (dynamische zinnen met markup/getallen).
  var EXACT = window.EC_FR_EXACT || {};
  var DICT = window.EC_FR_DICT || {};
  var RULES = window.EC_FR_RULES || [];
  // DICT-sleutels langste eerst → voorkomt dat een korte sleutel een langere deels kapotmaakt.
  var KEYS = Object.keys(DICT).sort(function (a, b) { return b.length - a.length; });

  // Vertaal één stuk pure tekst (tussen tags).
  function trSeg(txt) {
    if (!txt) return txt;
    var trimmed = txt.trim();
    if (trimmed && Object.prototype.hasOwnProperty.call(EXACT, trimmed)) {
      // behoud omringende witruimte
      return txt.replace(trimmed, EXACT[trimmed]);
    }
    var out = txt;
    for (var i = 0; i < KEYS.length; i++) {
      var k = KEYS[i];
      if (out.indexOf(k) !== -1) out = out.split(k).join(DICT[k]);
    }
    return out;
  }

  // Vertaal een volledige HTML-string.
  function EC_T_HTML(html) {
    if (LANG !== 'fr' || html == null) return html;
    var s = String(html);
    // 1) dynamische zinnen (mogen markup/getallen overspannen)
    for (var i = 0; i < RULES.length; i++) {
      try { s = s.replace(RULES[i].re, RULES[i].fr); } catch (e) {}
    }
    // 2) labels/zinnen zonder markup: enkel de tekst tussen tags, attributen blijven ongemoeid
    s = s.replace(/>([^<]+)</g, function (m, t) { return '>' + trSeg(t) + '<'; });
    return s;
  }

  // Vertaal plain tekst (geen markup).
  function EC_T(txt) { if (LANG !== 'fr' || txt == null) return txt; return trSeg(String(txt)); }

  // DOM-pass: bestaande tekstknopen + enkele attributen.
  function EC_translate(root) {
    if (LANG !== 'fr' || !root) return;
    try {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var n, jobs = [];
      while ((n = w.nextNode())) {
        var v = n.nodeValue;
        if (v && v.trim()) { var nv = trSeg(v); if (nv !== v) jobs.push([n, nv]); }
      }
      jobs.forEach(function (j) { j[0].nodeValue = j[1]; });
      ['placeholder', 'title', 'aria-label'].forEach(function (a) {
        var els = root.querySelectorAll ? root.querySelectorAll('[' + a + ']') : [];
        Array.prototype.forEach.call(els, function (el) {
          var v = el.getAttribute(a); if (!v) return; var nv = trSeg(v); if (nv !== v) el.setAttribute(a, nv);
        });
      });
    } catch (e) {}
  }

  window.EC_T_HTML = EC_T_HTML;
  window.EC_T = EC_T;
  window.EC_translate = EC_translate;

  // lang doorgeven aan interne links (zodat de hele flow FR blijft).
  function EC_propagateLang() {
    if (LANG !== 'fr') return;
    try {
      document.querySelectorAll('a[href]').forEach(function (a) {
        var h = a.getAttribute('href'); if (!h) return;
        if (/^(mailto:|tel:|#|https?:\/\/(?!app\.energie-compas\.eu))/i.test(h)) return;
        if (/[?&]lang=/.test(h)) return;
        a.setAttribute('href', h + (h.indexOf('?') === -1 ? '?' : '&') + 'lang=fr');
      });
    } catch (e) {}
  }
  window.EC_propagateLang = EC_propagateLang;

  if (LANG === 'fr') {
    try { document.documentElement.setAttribute('lang', 'fr'); } catch (e) {}
    document.addEventListener('DOMContentLoaded', function () {
      EC_translate(document.body);
      EC_propagateLang();
      // Observer: vang alles wat ná de eerste render in de DOM komt (ek.html herberekent, modals, enz.)
      try {
        var mo = new MutationObserver(function (muts) {
          for (var i = 0; i < muts.length; i++) {
            var a = muts[i].addedNodes; if (!a) continue;
            for (var j = 0; j < a.length; j++) {
              var nd = a[j];
              if (nd.nodeType === 1) EC_translate(nd);
              else if (nd.nodeType === 3) { var nv = trSeg(nd.nodeValue || ''); if (nv !== nd.nodeValue) nd.nodeValue = nv; }
            }
          }
        });
        mo.observe(document.body, { childList: true, subtree: true });
        window.EC_OBS = mo;
      } catch (e) {}
    });
  }
})();
