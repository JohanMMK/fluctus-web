// mijnec-knop.js v1.0.0 — 2026-10-15 (Johan) — één knop «← Naar MijnEC» in de huisstijl van energie-compas.eu
// (Poppins, groene pill #05b050 → hover #048443), rechtsboven in elke app. Vervangt de oude «← Mijn Fluctus»-links.
//   Gebruik: <a class="mijnec-knop" href="https://www.energie-compas.eu/login">← Naar MijnEC</a> + dit script.
//   Op energie-compas.eu wordt de link relatief (/login) zodat de sessie op hetzelfde domein blijft.
//   data-vast="1" op het script-element: zet een vaste knop rechtsboven als de pagina er zelf geen heeft.
(function(){
  'use strict';
  var URL_EC = /energie-compas\.eu$/i.test(location.hostname) ? '/login' : 'https://www.energie-compas.eu/login';
  var me = document.currentScript;
  function css(){
    if (document.getElementById('mijnec-knop-css')) return;
    if (!document.querySelector('link[href*="family=Poppins"]')) {
      var f = document.createElement('link'); f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap';
      document.head.appendChild(f);
    }
    var s = document.createElement('style'); s.id = 'mijnec-knop-css';
    s.textContent =
      'a.mijnec-knop{display:inline-flex;align-items:center;gap:6px;background:#05b050;color:#fff!important;' +
      'padding:7px 16px;border-radius:999px;font-family:Poppins,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
      'font-weight:600;font-size:13px;line-height:1.2;letter-spacing:0;text-decoration:none!important;white-space:nowrap;' +
      'border:none;box-shadow:0 2px 8px rgba(5,176,80,.25);transition:background .18s,transform .18s;margin-left:auto}' +
      'a.mijnec-knop:hover{background:#048443;color:#fff!important;transform:translateY(-1px)}' +
      'a.mijnec-knop.hidden{display:none!important}' +
      'a.mijnec-knop.vast{position:fixed;top:10px;right:14px;z-index:9000}' +
      '@media print{a.mijnec-knop{display:none!important}}';
    document.head.appendChild(s);
  }
  function init(){
    css();
    var knoppen = document.querySelectorAll('a.mijnec-knop');
    for (var i = 0; i < knoppen.length; i++) knoppen[i].setAttribute('href', URL_EC);
    if (!knoppen.length && me && me.getAttribute('data-vast') === '1') {
      var a = document.createElement('a'); a.className = 'mijnec-knop vast'; a.href = URL_EC; a.textContent = '← Naar MijnEC';
      document.body.appendChild(a);
    }
  }
  window.MIJNEC_URL = URL_EC;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
