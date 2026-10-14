/* profiel-viz.js v1.0.0 (2026-10-14, Johan) — GEDEELDE WEERGAVE VAN EEN PROFIELANALYSE.
   Eén renderer voor de portaltegel Profiel-import (profiel-import.html) én de modal in het EK-adviseursbeeld (ek.html),
   zodat beide exact hetzelfde tonen: herkend formaat, dekking (gemeten/aangevuld), kerncijfers, typische week,
   heatmap maand × uur, volume per maand, afgeleide periodes en (prosument) de energiebalans-reconstructie.
   HEATMAP: maanden HORIZONTAAL (jan → dec, links → rechts), uren VERTICAAL (0u onder → 23u boven), groenladder =
   dezelfde kleuren als de heatmaps in de rapporten (klantrapport heatKleur).
   Invoer = de response van POST /api/profiel/analyse of GET /api/profiel/overzicht (server ≥ 15.294.0):
   { formaten:[…], types:{ afname:{coverage, preview}, injectie:{…} }, energiebalans, slp_profiel, pv_opts }.
   API: ProfielViz.css() · ProfielViz.render(j) → HTML (in een element met class "pvz") · ProfielViz.heat(hm) · ProfielViz.kleur(t). */
(function(){
  var MND=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  var MND1=['j','f','m','a','m','j','j','a','s','o','n','d'];
  var HCOL=['#1F3864','#5B8BD0','#8FB3E6','#E0A458','#7FB8A4','#C07AB8'];
  var HLAB=['gemeten','interpolatie (kort gat)','typische dag','SLP / PV-vorm','uurresolutie (verdeeld)','energiebalans'];
  var BRON={ builtin:['gekend formaat','p-ok'], registry:['uit registry (hergebruikt)','p-ok'], ai:['nieuw — spec door AI gebouwd','p-info'], heuristiek:['heuristiek — review aanbevolen','p-wacht'], manueel:['manuele toewijzing','p-ok'], opgeslagen:['bewaard profiel','p-ok'] };
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function nf(v,d){ if(v==null||v===''||isNaN(v)) return '—'; return Number(v).toLocaleString('nl-BE',{maximumFractionDigits:d==null?1:d, minimumFractionDigits:0}); }
  // Groenladder — identiek aan klantrapport.html heatKleur (rapport-heatmaps).
  function kleur(t){
    if(!(t>0)) return '#F2F5F8';
    var stops=[[234,247,238],[154,212,166],[5,176,80],[4,132,67],[11,61,36]];
    var x=Math.min(1,t)*(stops.length-1), i=Math.floor(x), f=x-i, a=stops[i], b=stops[Math.min(stops.length-1,i+1)];
    return 'rgb('+Math.round(a[0]+(b[0]-a[0])*f)+','+Math.round(a[1]+(b[1]-a[1])*f)+','+Math.round(a[2]+(b[2]-a[2])*f)+')';
  }
  var CSS_ID='pvz-css';
  function css(){
    if(document.getElementById(CSS_ID)) return;
    var s=document.createElement('style'); s.id=CSS_ID;
    s.textContent=
      '.pvz{color:#2A3140;font-size:13px;text-align:left}'+
      '.pvz .card{background:#fff;border:1px solid #dbe3ef;border-radius:12px;padding:14px 16px;margin-bottom:12px}'+
      '.pvz .card h2{font-size:15px;color:#1F3864;margin:0 0 10px}'+
      '.pvz .sub{font-size:11.5px;color:#5A6577}'+
      '.pvz .id{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#5A6577}'+
      '.pvz .pill{display:inline-block;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;white-space:nowrap}'+
      '.pvz .p-ok{background:#D1FAE5;color:#065f46}.pvz .p-wacht{background:#FEF3C7;color:#92610a}.pvz .p-mis{background:#FEE2E2;color:#9b1c1c}.pvz .p-neu{background:#EEF2F8;color:#42506a}.pvz .p-info{background:#E0ECFB;color:#1F3864}'+
      '.pvz .label-big{font-size:15px;font-weight:800;padding:6px 12px;border-radius:10px;display:inline-block}'+
      '.pvz .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:10px 0}'+
      '.pvz .kpi{background:#F7F9FD;border:1px solid #dbe3ef;border-radius:9px;padding:8px 10px}'+
      '.pvz .kpi b{display:block;font-size:16px;color:#1F3864}.pvz .kpi span{font-size:11px;color:#5A6577}'+
      '.pvz .stack{display:flex;height:14px;border-radius:7px;overflow:hidden;background:#eef2f8;margin:6px 0 4px}.pvz .stack div{height:100%}'+
      '.pvz .legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:#5A6577}'+
      '.pvz .legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}'+
      '.pvz .flags{background:#FEF2F2;border:1px solid #f5c2c2;color:#8a1c1c;border-radius:9px;padding:8px 12px;font-size:12.5px;margin:8px 0}'+
      '.pvz .warn-box{background:#FFF8EB;border:1px solid #f3dcae;color:#7a4a06;border-radius:9px;padding:8px 12px;font-size:12.5px;margin:8px 0}'+
      '.pvz .ok-box{background:#ECFDF5;border:1px solid #a7e3c4;color:#065f46;border-radius:9px;padding:10px 12px;font-size:13px;margin:8px 0}'+
      '.pvz table.per{width:100%;border-collapse:collapse;font-size:12px}.pvz table.per td,.pvz table.per th{text-align:left;padding:4px 6px;border-bottom:1px solid #dbe3ef}'+
      '.pvz table.per th{color:#12315E;font-size:11px;text-transform:uppercase}'+
      '.pvz .viz{display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-top:8px;align-items:start}'+
      '@media(max-width:760px){.pvz .viz{grid-template-columns:1fr}}'+
      '.pvz svg text{font-size:9px;fill:#5A6577}'+
      '.pvz details summary{cursor:pointer;font-size:12.5px;color:#12315E;font-weight:600;margin-top:6px}'+
      '.pvz .hm-leg{display:flex;align-items:center;gap:6px;font-size:10.5px;color:#5A6577;margin-top:3px}'+
      '.pvz .hm-leg .bar{flex:0 0 90px;height:8px;border-radius:4px;background:linear-gradient(90deg,#EAF7EE,#9AD4A6,#05B050,#048443,#0B3D24)}';
    document.head.appendChild(s);
  }
  function kpi(v,l){ return '<div class="kpi"><b>'+v+'</b><span>'+esc(l)+'</span></div>'; }

  // Heatmap: hm = vlakke array [12×24] (index m*24+h, gemiddeld kW). Maanden horizontaal, uren verticaal (0u onder).
  function heat(hm, titel){
    if(!hm||!hm.length) return '';
    var CW=22, CH=7, pL=24, pB=14, W=pL+12*CW, H=24*CH+pB, mx=0, g='';
    for(var k=0;k<hm.length;k++){ var v=+hm[k]||0; if(v>mx) mx=v; }
    if(!(mx>0)) mx=1;
    g+='<rect x="'+pL+'" y="0" width="'+(12*CW)+'" height="'+(24*CH)+'" fill="#F2F5F8"/>';
    for(var m=0;m<12;m++){
      for(var h=0;h<24;h++){ var val=+hm[m*24+h]||0, y=(23-h)*CH;
        g+='<rect x="'+(pL+m*CW)+'" y="'+y+'" width="'+(CW+0.4)+'" height="'+(CH+0.4)+'" fill="'+kleur(val/mx)+'"><title>'+MND[m]+' '+h+'u: '+nf(val,2)+' kW</title></rect>'; }
      g+='<text x="'+(pL+m*CW+CW/2)+'" y="'+(H-3)+'" text-anchor="middle">'+MND1[m]+'</text>';
    }
    [0,6,12,18,23].forEach(function(h){ g+='<text x="'+(pL-3)+'" y="'+((23-h)*CH+CH-0.5)+'" text-anchor="end">'+h+'u</text>'; });
    return '<div class="sub">'+esc(titel||'Gemiddeld kW per maand × uur')+'</div>'+
      '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Heatmap maand × uur">'+g+'</svg>'+
      '<div class="hm-leg"><span>laag</span><span class="bar"></span><span>hoog — max '+nf(mx,1)+' kW</span></div>';
  }
  // Dag-labels als DATUM (dd/mm) i.p.v. ma…zo: het profiel staat op een 2025-kalenderindex (maand/dag), terwijl de metingen
  //   uit een ander jaar kunnen komen — de weekdag van de index is dan niet die van de meting. De datum klopt altijd.
  function _weekLabels(van){
    var m=String(van||'').match(/^(\d{1,2})\/(\d{1,2})/); if(!m) return ['1','2','3','4','5','6','7'];
    var t=Date.UTC(2025,+m[2]-1,+m[1]), out=[];
    for(var k=0;k<7;k++){ var d=new Date(t+k*86400000); out.push(('0'+d.getUTCDate()).slice(-2)+'/'+('0'+(d.getUTCMonth()+1)).slice(-2)); }
    return out;
  }
  function week(pv){
    if(!pv||!pv.week_kw||!pv.week_kw.length) return '';
    var d=pv.week_kw, W=520, H=130, mx=Math.max.apply(null,d.concat([0.001]));
    var pts=d.map(function(v,i){ return (i/(d.length-1)*W).toFixed(1)+','+(H-12-v/mx*(H-26)).toFixed(1); }).join(' ');
    var days=_weekLabels(pv.week_van), g='';
    for(var k=0;k<7;k++){ var x=k*W/7; g+='<line x1="'+x+'" y1="12" x2="'+x+'" y2="'+(H-12)+'" stroke="#e6ecf5"/><text x="'+(x+3)+'" y="'+(H-1)+'">'+days[k]+'</text>'; }
    return '<div class="sub">Typische week vanaf '+esc(pv.week_van||'')+(pv.week_gemeten_pct!=null?' ('+pv.week_gemeten_pct+'% gemeten)':'')+' · kW</div>'+
      '<svg viewBox="0 0 '+W+' '+H+'" width="100%" preserveAspectRatio="none" role="img" aria-label="Typische week">'+g+
      '<polyline points="'+pts+'" fill="none" stroke="#05B050" stroke-width="1.6"/><text x="'+(W-2)+'" y="10" text-anchor="end">max '+nf(mx,1)+' kW</text></svg>';
  }
  function maand(mwh,pct){
    if(!mwh||!mwh.length) return '';
    pct=pct||[];
    var W=520, H=78, mx=Math.max.apply(null,mwh.concat([0.001])), bw=W/12, g='';
    mwh.forEach(function(v,i){ var h=v/mx*(H-24), x=i*bw+3, y=H-12-h, p=(pct[i]==null?100:pct[i]); var col=p>=90?'#05B050':(p>0?'#9AD4A6':'#E0A458');
      g+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+(bw-6).toFixed(1)+'" height="'+Math.max(0,h).toFixed(1)+'" rx="1.5" fill="'+col+'"><title>'+MND[i]+': '+nf(v,2)+' MWh · '+p+'% gemeten</title></rect>'+
        (v>0?'<text x="'+(x+(bw-6)/2).toFixed(1)+'" y="'+(y-2).toFixed(1)+'" text-anchor="middle" style="font-size:8px">'+nf(v,v<10?1:0)+'</text>':'')+
        '<text x="'+(x+(bw-6)/2).toFixed(1)+'" y="'+(H-2)+'" text-anchor="middle">'+MND[i]+'</text>'; });
    return '<div class="sub" style="margin-top:10px">Volume per maand in MWh (donkergroen = ≥ 90% gemeten · lichtgroen = deels · oranje = volledig afgeleid)</div>'+
      '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Volume per maand">'+g+'</svg>';
  }
  function renderType(t,x){
    var c=x.coverage||{}, onb=(c.flags&&c.flags.length), cls=onb?'p-mis':(c.label_type==='gemeten'?'p-ok':'p-wacht');
    var parts=[c.pct_gemeten,c.pct_interpolatie,c.pct_typische_dag,c.pct_slp,c.pct_uurresolutie,c.pct_energiebalans].map(function(p){ return +p||0; });
    var h='<div class="card"><h2>'+(t==='afname'?'Afname':'Injectie')+'</h2>'+(c.label?'<span class="label-big '+cls+'">'+esc(c.label)+'</span>':'');
    if(parts.some(function(p){ return p>0; })){
      h+='<div class="stack">'+parts.map(function(p,i){ return p>0?'<div title="'+HLAB[i]+' '+p+'%" style="width:'+p+'%;background:'+HCOL[i]+'"></div>':''; }).join('')+'</div>';
      h+='<div class="legend">'+parts.map(function(p,i){ return p>0?'<span><i style="background:'+HCOL[i]+'"></i>'+HLAB[i]+' '+nf(p)+'%</span>':''; }).join('')+'</div>';
    }
    if(onb) h+='<div class="flags">⚠ '+c.flags.map(esc).join('<br>⚠ ')+'</div>';
    var gm=(c.pct_gemeten!=null)?((+c.pct_gemeten||0)+(+c.pct_uurresolutie||0)):null;
    h+='<div class="kpis">'+kpi(nf(c.jaar_mwh,1)+' MWh','jaarvolume (12 mnd)')+kpi(nf(c.maandpiek_kw)+' kW','maandpiek (profiel)')+
      (c.maandpiek_kw_gemeten!=null?kpi(nf(c.maandpiek_kw_gemeten)+' kW','hoogste gemeten piek'):'')+
      (c.gemeten_span?kpi(esc(c.gemeten_span),'effectief gemeten'):'')+
      kpi('<span style="font-size:12px">'+esc(c.van||'—')+'<br>'+esc(c.tot||'—')+'</span>','venster van – tot')+
      (gm!=null?kpi(nf(gm)+' %','gemeten'+(c.drempel_pct!=null?' (drempel label '+(100-c.drempel_pct)+'%)':'')):'')+'</div>';
    var pv=x.preview||{};
    h+='<div class="viz"><div>'+week(pv)+'</div><div>'+heat(pv.heatmap_kw)+'</div></div>';
    h+=maand(c.maand_mwh,c.maand_pct_gemeten);
    if(c.periodes && c.periodes.length){
      h+='<details><summary>Afgeleide periodes ('+c.periodes.length+')</summary><table class="per"><tr><th>van</th><th>tot</th><th>methode</th><th>kwartieren</th></tr>'+
        c.periodes.map(function(p){ return '<tr><td>'+esc(p.van)+'</td><td>'+esc(p.tot)+'</td><td>'+esc(p.methode)+'</td><td>'+p.kwartieren+'</td></tr>'; }).join('')+'</table></details>';
    }
    return h+'</div>';
  }
  function formaten(j){
    var F=j.formaten||[]; if(!F.length) return '';
    var h='<div class="card"><h2>Herkend formaat</h2>';
    F.forEach(function(f){
      var b=BRON[f.bron]||[f.bron||'—','p-neu'], sk=f.spec_kort||{};
      var det=[];
      if(f.spec_naam) det.push(esc(f.spec_naam));
      if(f.resolutie_min) det.push(f.resolutie_min+' min');
      if(sk.unit!==undefined) det.push('eenheid '+esc(sk.unit||'per rij'));
      if(sk.timezone) det.push(sk.timezone==='utc'?'UTC→lokaal':'lokale tijd');
      if(sk.label==='end') det.push('tijdstempel = einde interval');
      if(sk.long_format) det.push('lang formaat (registers)');
      if(f.parse_rate!=null) det.push(nf(f.parse_rate)+'% rijen geparst');
      if(f.bevat&&f.bevat.length) det.push('bevat '+esc(f.bevat.join(' + ')));
      if(f.fingerprint) det.push('<span class="id">'+esc(f.fingerprint)+'</span>');
      h+='<div style="margin-bottom:8px"><b>'+esc(f.rol||'')+'</b>'+(f.bestand?' · '+esc(f.bestand):'')+' <span class="pill '+b[1]+'">'+esc(b[0])+'</span><div class="sub">'+det.join(' · ')+'</div>';
      if(f.manuele_review_aanbevolen) h+='<div class="warn-box">De AI-herkenning was niet beschikbaar; een heuristiek herkende het formaat. Controleer eenheid (kW vs kWh) en kolommen hieronder vóór je bevestigt.</div>';
      if(f.waarschuwingen && f.waarschuwingen.length) h+='<div class="warn-box">'+f.waarschuwingen.map(esc).join('<br>')+'</div>';
      h+='</div>';
    });
    if(j.slp_profiel) h+='<div class="sub">Aanvulling met standaardprofiel: <b>'+esc(j.slp_profiel)+'</b>'+(j.pv_opts&&j.pv_opts.pv_kwp?' · PV '+nf(j.pv_opts.pv_kwp)+' kWp':'')+'</div>';
    return h+'</div>';
  }
  function energiebalans(j){
    var e=j.energiebalans; if(!e||!e.pv) return '';
    var q=e.kwaliteit||{};
    return '<div class="card"><h2>Energiebalans-reconstructie (prosument)</h2><div class="sub">C = A + (P − I) · per kwartier S = min(C, P) · P gekalibreerd op de gemeten injectie.</div><div class="kpis">'+
      kpi(nf(e.pv.kwp_gekalibreerd)+' kWp','PV gekalibreerd (start '+nf(e.pv.kwp_start)+')')+kpi(nf(e.pv.jaarproductie_mwh)+' MWh','jaarproductie P')+
      kpi(nf(e.pv.verbruik_totaal_mwh)+' MWh','totaal verbruik C')+kpi(nf(e.pv.zelfconsumptie_pct)+' %','zelfconsumptie Z')+
      kpi(nf(q.injectie_afwijking_pct)+' %','restafwijking injectie')+kpi(nf(q.afname_afwijking_pct)+' %','restafwijking afname')+'</div>'+
      ((!j.pv_opts||!j.pv_opts.pv_kwp)?'<div class="warn-box">Geen kWp opgegeven — de reconstructie schat PV uit de injectie. Geef het echte kWp op en analyseer opnieuw voor een betrouwbaarder resultaat.</div>':'')+'</div>';
  }
  function render(j){
    css();
    var h=formaten(j);
    ['afname','injectie'].forEach(function(t){ if(j.types&&j.types[t]) h+=renderType(t,j.types[t]); });
    h+=energiebalans(j);
    return h;
  }
  window.ProfielViz={ versie:'1.0.0', css:css, render:render, renderType:renderType, formaten:formaten, energiebalans:energiebalans, heat:heat, week:week, maand:maand, kleur:kleur, esc:esc, nf:nf };
})();
