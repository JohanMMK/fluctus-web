/* ec-stat.js v1.0.0 (2026-10-30, Johan): webstatistiek energie-compas.eu zonder cookies.
   Telt paginabezoek, herkomst (bron via ?s=, ?a= of de verwijzende site) en kliks op de belangrijkste knoppen.
   Bewaart niets in de browser en stuurt geen persoonsgegevens: enkel pad, bron, verwijzende host en knoplabel.
   De server telt unieke bezoekers per dag met een dagelijks wisselende, niet-bewaarde hash. */
(function () {
  try {
    var q = new URLSearchParams(location.search);
    var bron = q.get('s') || (q.get('a') ? 'amb' : '') || q.get('utm_source') || '';
    var ref = '';
    try {
      if (document.referrer) {
        var h = new URL(document.referrer).hostname;
        ref = (h === location.hostname) ? 'intern' : h;
      }
    } catch (e) {}
    var P = null, wacht = [];
    function stuur(o) {
      o.p = location.pathname; o.s = bron; o.r = ref;
      if (!P) { wacht.push(o); return; }
      var u = P + '/api/stat/hit', b = JSON.stringify(o);
      try { if (navigator.sendBeacon && navigator.sendBeacon(u, b)) return; } catch (e) {}
      try { fetch(u, { method: 'POST', body: b, keepalive: true, mode: 'no-cors' }).catch(function () {}); } catch (e) {}
    }
    function klaar(p) { P = p; var w = wacht; wacht = []; for (var i = 0; i < w.length; i++) stuur(w[i]); }
    fetch('/api/config').then(function (r) { return r.json(); })
      .then(function (c) { klaar(String(c.fluctusProxyUrl || 'https://lucid-amazement-production.up.railway.app').replace(/\/+$/, '')); })
      .catch(function () { klaar('https://lucid-amazement-production.up.railway.app'); });
    stuur({ t: 'v' });
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a') : null; if (!a) return;
      var h = a.getAttribute('href') || '', c = '';
      if (/^mailto:dossier@/i.test(h)) c = 'mail-dossier';
      else if (/\/contact(\b|$|\?|#)/.test(h)) c = 'contact';
      else if (/\/ambassadeur/.test(h)) c = 'ambassadeur';
      else if (/^\/(fr\/|en\/)?login|\/mijnec/i.test(h)) c = 'login';
      else if (/^\/blog\//.test(h)) c = 'blog';
      if (c) stuur({ t: 'c', c: c });
    }, true);
    document.addEventListener('submit', function () { stuur({ t: 'c', c: 'formulier' }); }, true);
  } catch (e) {}
})();
