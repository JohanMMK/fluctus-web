/* Fluctus — drop-in terugknop voor elke app.
   v2.0.0 (2026-10-15, Johan): de oude zwevende «← Mijn Fluctus»-pill (linksonder → /portal.html) is vervangen door
   «← Naar MijnEC» rechtsboven in de huisstijl van energie-compas.eu (zie mijnec-knop.js). Heeft de pagina zelf al
   een .mijnec-knop, dan wordt er niets extra toegevoegd. */
(function () {
  try {
    if (/portal\.html?$/i.test(location.pathname)) return; // niet op de portal zelf
    if (document.querySelector('script[src*="mijnec-knop.js"]')) return; // pagina laadt de knop al zelf
    var s = document.createElement('script');
    s.src = '/apps/mijnec-knop.js?v=1.0.0';
    s.setAttribute('data-vast', '1');
    (document.head || document.documentElement).appendChild(s);
  } catch (e) { /* stil */ }
})();
