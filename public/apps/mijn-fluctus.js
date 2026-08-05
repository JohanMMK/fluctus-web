/* Fluctus — drop-in "terug naar Mijn Fluctus"-link voor elke app.
   Voeg toe met één regel vóór </body>:  <script src="/apps/mijn-fluctus.js"></script>
   Injecteert een zwevende pill linksonder die naar /portal.html gaat.
   Werkt op lichte én donkere pagina's; toont zich niet op de portal zelf. */
(function () {
  try {
    if (/portal\.html?$/i.test(location.pathname)) return; // niet op de portal zelf
    function add() {
      if (document.getElementById('mf-terug') || !document.body) return;
      var a = document.createElement('a');
      a.id = 'mf-terug';
      a.href = '/portal.html';
      a.textContent = '← Mijn Fluctus';
      a.setAttribute('aria-label', 'Terug naar Mijn Fluctus');
      var s = a.style;
      s.position = 'fixed'; s.left = '14px'; s.bottom = '14px'; s.zIndex = '2147483647';
      s.font = "600 13px -apple-system,'Segoe UI',Roboto,Arial,sans-serif";
      s.textDecoration = 'none'; s.color = '#fff';
      s.background = 'rgba(31,56,100,0.92)';
      s.border = '1px solid rgba(255,255,255,0.20)';
      s.borderRadius = '999px'; s.padding = '9px 15px';
      s.boxShadow = '0 4px 14px rgba(0,0,0,0.28)';
      s.backdropFilter = 'blur(4px)'; s.webkitBackdropFilter = 'blur(4px)';
      s.cursor = 'pointer'; s.lineHeight = '1';
      s.transition = 'background .15s, transform .15s';
      a.onmouseover = function () { s.background = 'rgba(5,176,80,0.95)'; s.transform = 'translateY(-1px)'; };
      a.onmouseout = function () { s.background = 'rgba(31,56,100,0.92)'; s.transform = 'none'; };
      document.body.appendChild(a);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
    else add();
  } catch (e) { /* stil */ }
})();
