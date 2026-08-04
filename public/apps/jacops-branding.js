/* ============================================================================
 * jacops-branding.js  v2.0.0  — JACOPS-huisstijl drop-in voor de Fluctus-rapporten
 * Look & feel op basis van de Jacops-memo (rood-dominant): wit "JACOPS." op rood,
 * vette rode uppercase titels, rode categorie-balk, groot rood hero-blok met gouden
 * accent, KPI-rij (rood + groen), genummerde actie-sporen. E+Drive-beeldmerk ENKEL in
 * het T4-rapport (merk:'edrive'); T1/T2/T3 zijn puur Jacops.
 *
 * Activeren: ?stijl=jacops  (of window.__STIJL_JACOPS=1 voor blob-rapporten).
 * API: FluctusJacops.apply(o)  (meerpagina .a4 + #rapport)
 *      FluctusJacops.applySingle(o)  (eenpagina .pg, bv. SolarActive)
 *   o = { merk:'jacops'|'edrive', eyebrow, titel, klant, projectId,
 *         tabs:[...], hero:{groot, naar?, eenheid?, klein?},
 *         kpis:[{l,v,s,groen?}], actie:{componenten:[{naam,detail,capex?}], totaalLabel, totaal, instap?} }
 * ========================================================================== */
(function(){
  'use strict';
  var LOGO = window.FLUCTUS_EDRIVE_LOGO || '';
  var R='#E83020', RD='#C6261A', G='#1E7F4F', GD='#17663F', GOLD='#F2A900', INK='#232323', GREY='#7A7A77';
  function active(){ try{ if(window.__STIJL_JACOPS) return true; }catch(e){} try{ return /(^|[?&])stijl=jacops(&|$)/.test(location.search||''); }catch(e){ return false; } }
  function esc(x){ return String(x==null?'':x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  var CSS = ''
  /* palette-swap: Fluctus-vars → Jacops (rood-dominant) */
  + ':root{--blauw:'+R+';--blauw-l:'+RD+';--groen:'+G+';--groen-d:'+GD+';--oranje:'+RD+';--oranje-l:'+GOLD+';--grijs:'+GREY+';--lijn:#E4E4E0;--bg:#F7F6F4;--zwart:'+INK+';--rood:#B0201A;}'
  + '.box.oranje{background:#FBEDEB!important;border-color:rgba(232,48,32,.25)!important}'
  + '.flow .node .n.big{color:'+RD+'!important}'
  + '.flow .node.start{background:#FBEDEB!important;border-color:rgba(232,48,32,.55)!important}'
  + '.mgmt-banner{background:linear-gradient(90deg,'+RD+','+GOLD+')!important}'
  + '.mgmt{border-color:rgba(232,48,32,.55)!important;background:#FCF3F2!important}.mgmt h4{color:'+RD+'!important}'
  /* tabel-totaalrijen (o.a. de Bill of Materials) volgden een hardgecodeerde blauwe tint → naar Jacops-rood */
  + 'tfoot td{background:rgba(232,48,32,.06)!important;border-top-color:'+R+'!important}'
  + 'table.bom tfoot .bom-tot td{background:rgba(232,48,32,.12)!important;border-top-color:'+R+'!important}'
  + 'tr[style*="#eef2f8"] td,td[style*="#eef2f8"]{background:rgba(232,48,32,.06)!important}'
  /* logo-band per pagina */
  + '.a4-foot.jc{align-items:center;gap:8px}'
  + '.a4-foot .jc-jbox{background:'+R+';color:#fff;font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:10px;letter-spacing:-.3px;padding:2px 6px;border-radius:3px;white-space:nowrap}'
  + '.a4-foot .jc-el{height:4.6mm;display:block}'
  + '.a4-foot .jc-mid{flex:1;text-align:center}'
  /* ---------- voorpagina (memo-stijl) ---------- */
  + '.a4.jc-cover{padding:0;display:flex;flex-direction:column;background:#fff;font-family:Helvetica,Arial,sans-serif}'
  + '.jc-top{display:flex;align-items:center;gap:6mm;padding:11mm 15mm 0}'
  + '.jc-jbox{background:'+R+';color:#fff;font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:20px;letter-spacing:-.6px;padding:2.6mm 4mm;border-radius:1.6mm;line-height:1}'
  + '.jc-eyebrow{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:'+GREY+';font-weight:700}'
  + '.jc-el-top{margin-left:auto;height:8mm;display:block}'
  + '.jc-title{padding:5mm 15mm 5mm;font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:29px;line-height:1.05;color:'+R+';text-transform:uppercase;letter-spacing:-.3px}'
  + '.jc-tabs{background:'+R+';color:#fff;display:flex;flex-wrap:wrap;gap:0 22px;padding:3mm 15mm}'
  + '.jc-tabs span{font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}'
  + '.jc-hero{background:'+R+';color:#fff;text-align:center;padding:9mm 15mm 8mm;border-top:1px solid rgba(255,255,255,.18)}'
  + '.jc-hero .g{font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:38px;letter-spacing:-.5px;line-height:1}'
  + '.jc-hero .g .ar{color:#fff;font-weight:400;margin:0 6px}'
  + '.jc-hero .g .go{color:'+GOLD+'}'
  + '.jc-hero .k{font-size:11px;color:#FFD9D3;margin-top:3.5mm;max-width:78%;margin-left:auto;margin-right:auto;line-height:1.4}'
  + '.jc-kpirow{display:flex;padding:8mm 15mm 3mm}'
  + '.jc-kc{flex:1;padding:0 5mm;border-left:1px solid #E4E4E0}.jc-kc:first-child{border-left:0;padding-left:0}'
  + '.jc-kc .v{font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:25px;color:'+R+';line-height:1}'
  + '.jc-kc.gr .v{color:'+G+'}'
  + '.jc-kc .c{font-size:9.5px;color:'+GREY+';margin-top:2.5mm;line-height:1.35}'
  + '.jc-kc .c b{color:'+INK+'}'
  + '.jc-sec{padding:5mm 15mm 0}'
  + '.jc-sec-t{font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:15px;color:'+R+';text-transform:uppercase;letter-spacing:.01em;margin-bottom:3mm}'
  + '.jc-acts{display:flex;flex-direction:column;gap:0}'
  + '.jc-act{display:flex;gap:4mm;align-items:baseline;border-top:2px solid #E4E4E0;padding:2.4mm 0}'
  + '.jc-act .n{width:5.5mm;height:5.5mm;border-radius:50%;background:'+R+';color:#fff;font-weight:800;font-size:10px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;align-self:center}'
  + '.jc-act .nm{font-weight:800;font-size:11px;color:'+INK+';min-width:42mm}'
  + '.jc-act .dt{font-size:10px;color:#55524F;flex:1}'
  + '.jc-act .cx{font-weight:800;font-size:11px;color:'+R+';white-space:nowrap}'
  + '.jc-total{margin:4mm 15mm 0;background:'+R+';color:#fff;padding:4mm 5mm;display:flex;justify-content:space-between;align-items:center;border-radius:1.6mm}'
  + '.jc-total .k{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#FFD9D3;font-weight:700}'
  + '.jc-total .b{font-size:11px;color:#FFD9D3;margin-top:1mm}'
  + '.jc-total .amt{font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:26px}'
  + '.jc-foot{margin-top:auto;background:'+INK+';color:#B8B8B4;padding:5mm 15mm;display:flex;justify-content:space-between;align-items:flex-end}'
  + '.jc-foot .h{color:'+R+';font-weight:800;font-size:9px;letter-spacing:.06em;margin-bottom:1.5mm}'
  + '.jc-foot .l{font-size:8.5px;line-height:1.5}.jc-foot .l b{color:#fff}'
  + '.jc-foot .jacS{background:'+R+';color:#fff;font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:13px;padding:1.6mm 2.6mm;border-radius:1mm;display:inline-block}'
  + '.jc-foot .chip{display:inline-block;background:#fff;padding:1.6mm 2.6mm;border-radius:1mm;margin-bottom:2mm}.jc-foot .chip img{height:5mm;display:block}'
  /* ---------- eenpagina (.pg, SolarActive) ---------- */
  + '.jc-inline{margin:-28px -34px 16px}.jc-inline .jc-cover-inner{background:#fff}'
  + '.jc-inline.jc-botwrap{margin:16px -34px -28px}'
  + '.jc-inline .jc-top{padding:8mm 15mm 0}.jc-inline .jc-title{padding:4mm 15mm 4mm;font-size:24px}'
  + '.pg h1{color:'+R+'}.pg h2{color:'+R+';border-bottom-color:rgba(232,48,32,.3)}'
  + '.pg .t{background:#FCF3F2;border-color:rgba(232,48,32,.35)}.pg .t .l{color:'+R+'}.pg .t .v{color:'+INK+'}'
  + '.pg .concl{background:#EAF7EE;border-color:rgba(30,127,79,.4)}.pg .concl b{color:'+GD+'}'
  + '.pg th{color:'+R+'}'
  + '@media print{.a4.jc-cover{break-after:page;page-break-after:always}}';

  function injectCSS(){ if(document.getElementById('jc-css')) return; var s=document.createElement('style'); s.id='jc-css'; s.textContent=CSS; document.head.appendChild(s); }

  function topHTML(o){
    var el=(o.merk==='edrive'&&LOGO)?'<img class="jc-el-top" src="'+LOGO+'" alt="E+ Drive">':'';
    return '<div class="jc-top"><span class="jc-jbox">JACOPS.</span>'
      + '<span class="jc-eyebrow">'+esc([o.eyebrow||'Voorstel', o.projectId?('Projectnr. '+o.projectId):''].filter(Boolean).join(' · '))+'</span>'
      + el + '</div>';
  }
  function titleHTML(o){ return '<div class="jc-title">'+esc(o.titel||'Energievoorstel')+'</div>'; }
  function tabsHTML(o){ var t=(o.tabs||[]); if(!t.length) return ''; return '<div class="jc-tabs">'+t.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>'; }
  function heroHTML(o){ var h=o.hero||{}; if(!h.groot) return '';
    var mid = h.naar ? ('<span class="go">'+esc(h.groot)+'</span> <span class="ar">→</span> <span class="go">'+esc(h.naar)+'</span>') : ('<span class="go">'+esc(h.groot)+'</span>');
    return '<div class="jc-hero"><div class="g">'+mid+(h.eenheid?' '+esc(h.eenheid):'')+'</div>'+(h.klein?'<div class="k">'+esc(h.klein)+'</div>':'')+'</div>';
  }
  function kpirowHTML(o){ var k=(o.kpis||[]).slice(0,4); if(!k.length) return '';
    return '<div class="jc-kpirow">'+k.map(function(x){ return '<div class="jc-kc'+(x.groen?' gr':'')+'"><div class="v">'+esc(x.v)+'</div><div class="c"><b>'+esc(x.l)+'</b>'+(x.s?'<br>'+esc(x.s):'')+'</div></div>'; }).join('')+'</div>';
  }
  function actieHTML(o){ var A=o.actie||{}, comp=A.componenten||[]; var total=(A.totaal!=null?A.totaal:A.capexTotaal)||''; var lbl=A.totaalLabel||'Totale investering (CAPEX)';
    if(!comp.length && !total) return '';
    var rows=comp.map(function(c,i){ return '<div class="jc-act"><span class="n">'+(i+1)+'</span><div class="nm">'+esc(c.naam)+'</div><div class="dt">'+esc(c.detail||'')+'</div>'+(c.capex?'<div class="cx">'+esc(c.capex)+'</div>':'')+'</div>'; }).join('');
    var instap=A.instap?'<div class="b">Instapniveau (eerste groeistap): '+esc(A.instap)+'</div>':'';
    return '<div class="jc-sec"><div class="jc-sec-t">Voorgestelde actie</div></div>'
      + (rows?'<div class="jc-acts" style="padding:0 15mm">'+rows+'</div>':'')
      + (total?'<div class="jc-total"><div><div class="k">'+esc(lbl)+'</div>'+instap+'</div><div class="amt">'+esc(total)+'</div></div>':'');
  }
  function footHTML(o){
    var chip=(o.merk==='edrive'&&LOGO)?'<span class="chip"><img src="'+LOGO+'" alt="E+ Drive"></span><br>':'';
    var platform=(o.merk==='edrive')?'geïntegreerd in het E+Drive-aanbod, met Jacops als installatie- en servicepartner.'
                                     :'met Jacops als installatie- en servicepartner.';
    return '<div class="jc-foot"><div><div class="h">'+(o.merk==='edrive'?'E+Drive · Kamino':'Kamino')+'</div>'
      + '<div class="l"><b>Een platform van Fluctus.net CVSO</b> · BE 0757.494.180<br>'+platform+'</div></div>'
      + '<div style="text-align:right">'+chip+'<span class="jacS">JACOPS.</span></div></div>';
  }
  function coverHTML(o){ o=o||{}; return topHTML(o)+titleHTML(o)+tabsHTML(o)+heroHTML(o)+kpirowHTML(o)+actieHTML(o)+footHTML(o); }

  // logo-band op elke inhoudspagina (rood JACOPS-blokje; E+Drive-beeldmerk enkel bij merk 'edrive')
  function brandFooters(root, o){
    var foots=(root||document).querySelectorAll('.a4:not(.jc-cover) .a4-foot');
    Array.prototype.forEach.call(foots,function(f){
      if(f.classList.contains('jc')) return; f.classList.add('jc');
      var spans=f.querySelectorAll('span'); if(spans.length) spans[0].className='jc-mid';
      if(o&&o.merk==='edrive'&&LOGO){ var img=document.createElement('img'); img.className='jc-el'; img.src=LOGO; img.alt='E+Drive'; f.insertBefore(img,f.firstChild); }
      var jb=document.createElement('span'); jb.className='jc-jbox'; jb.textContent='JACOPS.'; f.appendChild(jb);
    });
  }

  function apply(o){
    if(!active()) return false; o=o||{}; injectCSS();
    var root=document.getElementById('rapport')||document.body;
    var first=root.querySelector('.a4');
    var cover=document.createElement('div'); cover.className='a4 jc-cover'; cover.innerHTML=coverHTML(o);
    if(first) root.insertBefore(cover, first); else root.appendChild(cover);
    brandFooters(root, o);
    return true;
  }
  function applySingle(o){
    if(!active()) return false; o=o||{}; injectCSS();
    var pg=document.querySelector('.pg')||document.body;
    var head=document.createElement('div'); head.className='jc-inline';
    head.innerHTML='<div class="jc-cover-inner">'+topHTML(o)+titleHTML(o)+tabsHTML(o)+heroHTML(o)+kpirowHTML(o)+actieHTML(o)+'</div>';
    pg.insertBefore(head, pg.firstChild);
    var foot=document.createElement('div'); foot.className='jc-inline jc-botwrap'; foot.innerHTML=footHTML(o);
    pg.appendChild(foot);
    return true;
  }

  window.FluctusJacops={ active:active, apply:apply, applySingle:applySingle, injectCSS:injectCSS, coverHTML:coverHTML, brandFooters:brandFooters, LOGO:LOGO };
})();
