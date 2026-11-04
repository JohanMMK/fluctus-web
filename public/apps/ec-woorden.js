/* ec-woorden.js v1.0.0 (2026-11-04, Johan): WOORDENLIJST + (i)-UITLEG — gedeeld door het energierapport, EK en «Je profiel verdient meer».
   ECW.markeer(root)  → zet bij het EERSTE voorkomen van elke vakterm een klein (i)-knopje (enkel op het scherm, nooit in print/PDF);
                         een klik opent een venster met de uitleg in eenvoudige taal.
   ECW.gebruikt(root) → de vaktermen die in de tekst voorkomen (voor de woordenlijst achteraan).
   ECW.lijstHtml(lijst) → tabel «woord — wat het betekent» (drukt mee af).
   Enkel Nederlands; in FR/EN doet markeer niets (de lijst blijft NL tot er vertalingen zijn). */
(function(){
  if(window.ECW) return;
  var W=[
    { k:'kWh', re:/\bkWh\b/, t:'kWh (kilowattuur)', u:'Hoeveel stroom je verbruikt. Vergelijk het met liters water uit de kraan. Een wasmachine die één keer draait, gebruikt ongeveer 1 kWh.' },
    { k:'MWh', re:/\bMWh\b/, t:'MWh (megawattuur)', u:'1.000 kWh. Een gezin verbruikt ongeveer 3,5 MWh per jaar.' },
    { k:'kW', re:/\bkW\b/, t:'kW (kilowatt)', u:'Hoeveel stroom je op één moment gebruikt. Vergelijk het met hoe ver de kraan openstaat: hoe verder open, hoe meer water per seconde.' },
    { k:'kVA', re:/\bkVA\b/, t:'kVA', u:'Bijna hetzelfde als kW. De netbeheerder drukt je aansluiting en je toegangsvermogen uit in kVA: zoveel stroom mag je maximaal tegelijk nemen.' },
    { k:'kWp', re:/\bkWp\b/, t:'kWp (kilowattpiek)', u:'Hoe sterk zonnepanelen zijn bij volle zon. In België maakt 1 kWp ongeveer 900 kWh stroom per jaar.' },
    { k:'toegangsvermogen', re:/\btoegangsvermogen/i, t:'Toegangsvermogen', u:'Hoeveel vermogen je met de netbeheerder hebt afgesproken. Hoe hoger, hoe meer je elk jaar betaalt — ook als je het bijna nooit gebruikt.' },
    { k:'aansluiting', re:/\baansluiting\b/i, t:'Aansluiting', u:'De kabel en kast waarmee je gebouw aan het elektriciteitsnet hangt. Ze bepaalt hoeveel stroom je maximaal tegelijk kan nemen.' },
    { k:'netpiek', re:/\b(netpiek|piekvermogen)/i, t:'Netpiek', u:'Je hoogste verbruik op één moment. De netbeheerder meet het per kwartier.' },
    { k:'capaciteitstarief', re:/\bcapaciteitstarief/i, t:'Capaciteitstarief', u:'Een deel van je stroomfactuur dat afhangt van je hoogste piek van de maand. Eén hoge piek telt de hele maand mee.' },
    { k:'maximumtarief', re:/\bmaximumtarief/i, t:'Maximumtarief', u:'Een plafond op je netkosten per MWh. Zit je aan dat plafond, dan levert een lagere piek weinig op.' },
    { k:'verzwaring', re:/\bverzwar/i, t:'Verzwaring', u:'Je aansluiting groter laten maken door de netbeheerder. Dat kost eenmalig geld, en daarna betaal je elk jaar meer.' },
    { k:'injectie', re:/\binjecte?er|\binjectie/i, t:'Injectie', u:'Stroom die je terug op het net zet, bijvoorbeeld als je zonnepanelen meer maken dan je zelf gebruikt. Daarvoor krijg je meestal weinig terug.' },
    { k:'zelfconsumptie', re:/\bzelfconsumptie|\beigen verbruik/i, t:'Zelfconsumptie', u:'Je eigen zonnestroom zelf gebruiken in plaats van ze op het net te zetten. Dat is meestal het meest waard.' },
    { k:'dynamisch', re:/\bdynamisch(e)? (contract|tarief)/i, t:'Dynamisch contract', u:'Een contract waarbij de stroomprijs elk kwartier of elk uur verandert, volgens de markt. Wie slim verbruikt, betaalt minder.' },
    { k:'spotmarkt', re:/\bspotmarkt|\bspotprijs|\bday-ahead|\bintraday/i, t:'Spotmarkt', u:'De markt waar stroom per uur of per kwartier wordt verhandeld, voor vandaag en morgen. De prijs gaat de hele dag op en neer.' },
    { k:'arbitrage', re:/\barbitrage/i, t:'Arbitrage', u:'Stroom opslaan als ze goedkoop is en gebruiken als ze duur is. Het verschil is je winst.' },
    { k:'onbalans', re:/\bonbalans/i, t:'Onbalans', u:'Soms heeft het net net iets te veel of te weinig stroom. Wie dan op het juiste moment wat meer of minder verbruikt, helpt het net en kan daarvoor betaald worden. Dat regel je met je energieleverancier.' },
    { k:'EMS', re:/\bEMS\b|\bslimme sturing/i, t:'Slimme sturing (EMS)', u:'Een kastje met software dat elk kwartier beslist wanneer je batterij laadt, je wagens laden en je zonnestroom gebruikt wordt — op het goedkoopste moment.' },
    { k:'cycli', re:/\bcycli|\bcyclus/i, t:'Batterijcyclus', u:'Eén keer de batterij helemaal opladen en weer leegmaken. Een batterij kan duizenden cycli mee.' },
    { k:'loadfactor', re:/\bloadfactor/i, t:'Loadfactor', u:'Hoe goed je je aansluiting gebruikt: je jaarverbruik gedeeld door wat je aansluiting in een heel jaar zou kunnen leveren. Hoger is beter.' },
    { k:'terugverdientijd', re:/\bterugverdi/i, t:'Terugverdientijd', u:'Na hoeveel jaar de besparing de investering heeft terugbetaald.' },
    { k:'rendement', re:/\brendement/i, t:'Rendement', u:'Wat je investering gemiddeld per jaar opbrengt, in procent van wat je erin stak.' },
    { k:'IRR', re:/\bIRR\b|\binterne rentevoet/i, t:'IRR (interne rentevoet)', u:'De jaarlijkse opbrengst van een investering in procent, over de hele levensduur. Vergelijk het met de rente op een spaarrekening.' },
    { k:'investeringsaftrek', re:/\binvesteringsaftrek|\bthematische aftrek/i, t:'Verhoogde investeringsaftrek', u:'Een belastingvoordeel: je mag een deel van een energiezuinige investering extra aftrekken van je winst.' },
    { k:'bruto', re:/\bbruto\b|\bnetto-investering|\bnetto\b/i, t:'Bruto en netto investering', u:'Bruto is wat de installatie kost. Netto is dat bedrag min de kosten die je dankzij de installatie niet moet maken, zoals een verzwaring.' },
    { k:'laadpunt', re:/\b(AC|DC)-?(laad|snel)|\bsnellader/i, t:'AC- en DC-laadpunt', u:'AC is een gewone laadpaal (traag, bijvoorbeeld 11 kW). DC is een snellader (bijvoorbeeld 50 tot 150 kW).' }
  ];
  var CSS='.ecw-i{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;margin:0 0 0 3px;padding:0;border:1px solid currentColor;border-radius:50%;background:transparent;color:#5A6577;font:700 10px/1 Georgia,serif;font-style:italic;cursor:pointer;vertical-align:1px;opacity:.75}'+
    '.ecw-i:hover{opacity:1;color:#003A5D}'+
    '#ecw-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px}'+
    '#ecw-box{background:#fff;border-radius:12px;max-width:420px;width:100%;padding:18px 20px;box-shadow:0 12px 40px rgba(0,0,0,.25);font:15px/1.55 -apple-system,Segoe UI,Arial,sans-serif;color:#1E2B37}'+
    '#ecw-box h3{margin:0 0 8px;font-size:17px;color:#003A5D}#ecw-box button{margin-top:12px;border:0;background:#003A5D;color:#fff;border-radius:8px;padding:8px 14px;font:600 14px Arial,sans-serif;cursor:pointer}'+
    '.ecw-lijst{width:100%;border-collapse:collapse;font-size:12px;line-height:1.45}.ecw-lijst td{padding:6px 8px;border-bottom:1px solid #E2E8F0;vertical-align:top}.ecw-lijst td:first-child{font-weight:700;color:#003A5D;width:32%}'+
    '@media print{.ecw-i,#ecw-bg{display:none!important}}';
  function css(){ if(document.getElementById('ecw-css')) return; var s=document.createElement('style'); s.id='ecw-css'; s.textContent=CSS; document.head.appendChild(s); }
  function esc(x){ return String(x==null?'':x).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function vind(k){ for(var i=0;i<W.length;i++) if(W[i].k===k) return W[i]; return null; }
  function open(k){ var w=vind(k); if(!w) return; css(); sluit();
    var bg=document.createElement('div'); bg.id='ecw-bg'; bg.innerHTML='<div id="ecw-box" role="dialog" aria-modal="true"><h3>'+esc(w.t)+'</h3><div>'+esc(w.u)+'</div><button type="button">Sluiten</button></div>';
    bg.onclick=function(ev){ if(ev.target===bg || ev.target.tagName==='BUTTON') sluit(); }; document.body.appendChild(bg);
    try{ bg.querySelector('button').focus(); }catch(e){} }
  function sluit(){ var x=document.getElementById('ecw-bg'); if(x) x.remove(); }
  document.addEventListener('keydown',function(ev){ if(ev.key==='Escape') sluit(); });
  var SKIP=/^(SCRIPT|STYLE|BUTTON|INPUT|SELECT|TEXTAREA|OPTION|SVG|TITLE|H1|A)$/;
  function magNiet(el){ for(var n=el;n&&n.nodeType===1;n=n.parentNode){ if(SKIP.test(n.tagName)) return true; var c=n.classList; if(c&&(c.contains('noprint')||c.contains('ecw-geen')||c.contains('kop')||c.contains('a4-foot')||c.contains('ecw-lijst'))) return true; } return false; }
  function nl(){ var l=(window.EC_LANG||document.documentElement.lang||'nl').toLowerCase(); return l.indexOf('nl')===0; }
  function markeer(root, opt){ try{
    if(!nl()) return 0; css(); root=root||document.body; opt=opt||{}; var gedaan={}, n=0;
    (opt.al||[]).forEach(function(k){ gedaan[k]=1; });
    var tw=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes=[], x; while((x=tw.nextNode())) nodes.push(x);
    nodes.forEach(function(tn){ if(!tn.nodeValue || tn.nodeValue.length<3) return; var p=tn.parentNode; if(!p || magNiet(p)) return;
      for(var i=0;i<W.length;i++){ var w=W[i]; if(gedaan[w.k]) continue; var m=w.re.exec(tn.nodeValue); if(!m) continue;
        var eind=m.index+m[0].length, rest=tn.splitText(eind);
        var b=document.createElement('button'); b.type='button'; b.className='ecw-i noprint'; b.setAttribute('data-ecw',w.k); b.setAttribute('aria-label','Uitleg: '+w.t); b.title='Wat is '+w.t+'?'; b.textContent='i';
        b.onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); open(this.getAttribute('data-ecw')); };
        p.insertBefore(b, rest); gedaan[w.k]=1; n++; break; } });
    return n; }catch(e){ return 0; } }
  function gebruikt(root){ var t=((root||document.body).innerText||''); return W.filter(function(w){ return w.re.test(t); }); }
  function lijstHtml(lijst){ lijst=lijst||W; return '<table class="ecw-lijst"><tbody>'+lijst.map(function(w){ return '<tr><td>'+esc(w.t)+'</td><td>'+esc(w.u)+'</td></tr>'; }).join('')+'</tbody></table>'; }
  window.ECW={ W:W, markeer:markeer, gebruikt:gebruikt, lijstHtml:lijstHtml, open:open, css:css };
})();
