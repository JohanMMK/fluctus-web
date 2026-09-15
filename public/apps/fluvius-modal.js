// fluvius-modal.js v1.1.0 (2026-09-15) — GEDEELDE actie-modal voor mandaat/EAN-acties.
// v1.1.0: actie "🚫 Analoge meter — geen mandaat (standaardprofiel)" (kind 'analoog' → POST /api/mandaat/geen-digitale-meter).
// Eén bron van waarheid voor "welke acties per status" + het uitvoeren ervan, gebruikt door zowel
// apps/fluvius-acties.html (volledige actielijst) als apps/projecten.html (acties per project).
// Classic script (geen module) → laadt via <script src>. Init met FLXModal.init({proxy, authHeaders, onDone, modalId}).
// Vereist in de pagina: een #<modalId>-overlay-element + de CSS-klassen .m-card/.m-act/.m-top/.m-x/.code/.sub.
(function(){
  var CTX = { proxy:'', authHeaders: async function(){ return {'Content-Type':'application/json'}; }, onDone: function(){}, modalId:'modal' };
  var FLUVIUS_AANVRAAG='https://mijn.fluvius.be/verbruik/dienstverlener?kbo=0848039623';
  var FLUVIUS_EIGEN='https://mijn.fluvius.be/verbruik/';
  var HUIDIG=null;
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function modalEl(){ return $(CTX.modalId); }
  function _chromeScheme(url){ return url.replace(/^https:\/\//,'googlechromes://').replace(/^http:\/\//,'googlechrome://'); }
  function sluit(){ var m=modalEl(); if(m){ m.style.display='none'; m.innerHTML=''; } }
  function kopieer(txt, btn){
    try{ navigator.clipboard.writeText(txt).then(function(){ if(btn){ var o=btn.textContent; btn.textContent='✓ gekopieerd'; setTimeout(function(){ btn.textContent=o; },1500); } }); }
    catch(e){ try{ prompt('Kopieer de link:', txt); }catch(_){} }
  }
  // Platform-bewust: op iPhone een «Open in Chrome» (googlechromes://); op Mac/desktop kan een webpagina géén andere
  // browser openen → geen misleidende knop, wel de tip "open dit dashboard in Chrome".
  function openFluvius(url, titel){
    var isIOS = /iP(hone|ad|od)/.test(navigator.userAgent||'');
    var m=modalEl(); if(!m) return;
    var chromeBtn = isIOS ? '<button class="m-act" onclick="_flxKopieerChrome(\''+_chromeScheme(url)+'\')">🌐 Open in Chrome</button>' : '';
    var tip = isIOS
      ? 'Tip: «Open in Chrome» opent Mijn Fluvius in de Chrome-app, waar u via itsme aangemeld bent.'
      : 'Op <b>Mac</b> opent «deze browser» in de browser waar dít dashboard draait (bv. Safari). Om in <b>Chrome</b> te werken — waar u bij Fluvius aangemeld bent én de Claude-extensie draait — open dit dashboard óók in Chrome, of zet Chrome als standaardbrowser. Dan werkt de aanvraag-flow via de extensie.';
    m.innerHTML='<div class="m-card" onclick="event.stopPropagation()">'+
      '<div class="m-top"><span>📶 '+esc(titel||'Open Mijn Fluvius')+'</span><button class="m-x" onclick="_flxSluit()">✕</button></div>'+
      '<div class="sub" style="margin:2px 0 12px;line-height:1.45">Open dit in de browser waar u <b>bij Fluvius bent aangemeld</b> (itsme).</div>'+
      '<a class="m-act" href="'+esc(url)+'" target="_blank" rel="noopener" style="text-decoration:none;box-sizing:border-box" onclick="setTimeout(_flxSluit,400)">🔗 Open Mijn Fluvius (deze browser)</a>'+
      chromeBtn+
      '<button class="m-act" onclick="_flxKopieer('+JSON.stringify(url)+',this)">📋 Kopieer link</button>'+
      '<div class="sub" style="margin-top:11px;line-height:1.5">'+tip+'</div>'+
      '</div>';
    m.style.display='flex';
  }
  function actiesVoor(it){
    var s=it.status, los=!!it.los, a=[];
    if(s==='wachtrij'){
      a.push({label:'📶 Open Mijn Fluvius — mandaat aanvragen', kind:'openAanvraag'});
      a.push({label:'✅ Markeer als aangevraagd', kind:'markAangevraagd'});
      a.push({label:'🚫 Analoge meter — geen mandaat (standaardprofiel)', kind:'analoog'});
      a.push({label:'✕ Annuleren', kind:'annuleer', danger:true});
    } else if(s==='aangevraagd'){
      a.push({label:'✅ Markeer als actief (goedgekeurd)', kind:'markActief'});
      a.push({label:'📨 Stuur nu een dringende reminder', kind:'reminder'});
      a.push({label:'🔎 Open Mijn Fluvius — status checken', kind:'openStatus'});
      a.push({label:'✕ Annuleren / vervallen', kind:'annuleer', danger:true});
    } else if(s==='adres_mismatch'){
      if(!los) a.push({label:'✅ Adres bevestigen (indienen)', kind:'adresOk'});
      a.push({label:'🔎 Open Mijn Fluvius — adres nakijken', kind:'openStatus'});
      a.push({label:'✕ Weigeren / annuleren', kind:'annuleer', danger:true});
    } else if(s==='actief'){
      a.push({label:'⬇️ Open Mijn Fluvius — kwartierdata downloaden', kind:'openEigen'});
      a.push({label:'📥 Markeer profiel geleverd', kind:'markGeleverd'});
      a.push({label:'🔎 Open Mijn Fluvius — status', kind:'openStatus'});
    } else if(s==='geleverd'){
      a.push({label:'⬇️ Open Mijn Fluvius — opnieuw downloaden', kind:'openEigen'});
      a.push({label:'↩️ Terug naar actief (correctie)', kind:'markActief'});
    } else {
      a.push({label:'🔎 Open Mijn Fluvius', kind:'openStatus'});
      a.push({label:'✅ Terug naar aangevraagd', kind:'markAangevraagd'});
    }
    if(los) a.push({label:'🔗 Koppel aan project…', kind:'koppel'});
    return a;
  }
  function openActie(it){
    if(!it) return; HUIDIG=it;
    var acts=actiesVoor(it);
    var titel=esc(it.klant||it.project_naam||(it.aanvrager&&it.aanvrager.naam)||'—');
    var m=modalEl(); if(!m) return;
    m.innerHTML='<div class="m-card" onclick="event.stopPropagation()">'+
      '<div class="m-top"><span>'+titel+(it.los?' <span class="sub" style="font-weight:400">(los)</span>':'')+'</span><button class="m-x" onclick="_flxSluit()">✕</button></div>'+
      '<div class="sub" style="margin:2px 0 12px"><span class="code">'+esc(it.ean)+'</span> · status <b>'+esc(it.status)+'</b>'+(it.partner?(' · '+esc(it.partner)):'')+(it.titularis_mail_masked?(' · titularis '+esc(it.titularis_mail_masked)):'')+'</div>'+
      acts.map(function(a){ return '<button class="m-act'+(a.danger?' danger':'')+'" onclick="_flxDoe(\''+a.kind+'\')">'+esc(a.label)+'</button>'; }).join('')+
      '</div>';
    m.style.display='flex';
  }
  async function postAct(path, body){
    try{
      var r=await fetch(CTX.proxy+path,{method:'POST',headers:await CTX.authHeaders(),body:JSON.stringify(body)});
      var j=await r.json().catch(function(){return {};});
      if(!r.ok){ alert('Kon niet: '+(j.error||r.status)); return; }
      sluit(); await CTX.onDone();
    }catch(e){ alert('Fout: '+e.message); }
  }
  async function patchStatus(it, patch){
    var url = it.los ? '/api/mandaat/los-patch' : '/api/mandaat/status';
    var body = it.los ? {ean:it.ean, patch:patch} : {project_id:it.project_id, ean:it.ean, patch:patch};
    await postAct(url, body);
  }
  async function doeActie(kind){
    var it=HUIDIG; if(!it) return;
    var pid=it.project_id||'';
    var _t=it.klant||it.project_naam||(it.aanvrager&&it.aanvrager.naam)||'Mijn Fluvius';
    if(kind==='openAanvraag'||kind==='openStatus'){ openFluvius(FLUVIUS_AANVRAAG, _t); return; }
    if(kind==='openEigen'){ openFluvius(FLUVIUS_EIGEN, _t); return; }
    if(kind==='markAangevraagd'){
      var ref=(prompt('Referentienummer (MijnFluvius-…), optioneel — laat leeg om over te slaan:')||'').trim();
      var mail=(prompt('Gemaskeerd titularis-mailadres (bv. x***@domein), optioneel:')||'').trim();
      var patch={status:'aangevraagd'}; if(ref) patch.referentienummer=ref; if(mail) patch.titularis_mail_masked=mail;
      await patchStatus(it,patch); return;
    }
    if(kind==='markActief'){ await patchStatus(it,{status:'actief'}); return; }
    if(kind==='markGeleverd'){ await patchStatus(it,{status:'geleverd', kwartierdata_aanwezig:true}); return; }
    if(kind==='annuleer'){ if(!confirm('Zeker annuleren voor EAN '+it.ean+'?')) return; await patchStatus(it,{status:'geannuleerd'}); return; }
    if(kind==='adresOk'){ await postAct('/api/mandaat/bevestig-adres',{project_id:pid, ean:it.ean, akkoord:true}); return; }
    if(kind==='reminder'){ await postAct('/api/mandaat/reminder-een',{ean:it.ean, project_id:pid||'LOS'}); return; }
    if(kind==='analoog'){ if(!confirm('EAN '+it.ean+' markeren als ANALOGE meter? Geen mandaat; de klant krijgt een mail dat de studie op een standaardprofiel loopt (verbruik+piek uit de factuur).')) return; await postAct('/api/mandaat/geen-digitale-meter',{ean:it.ean, project_id:pid||'LOS'}); return; }
    if(kind==='koppel'){ var p=((prompt('Koppel aan project-id (FLX-XXX-XXXX):')||'').trim().toUpperCase()); if(!/^FLX-/.test(p)){ if(p) alert('Ongeldig project-id.'); return; } await postAct('/api/mandaat/aanvraag',{project_id:p, eans:[it.ean]}); return; }
  }
  // Publieke API + globals voor de inline onclick-handlers in de gegenereerde modal-HTML.
  window.FLXModal = { init:function(cfg){ cfg=cfg||{}; if(cfg.proxy!=null) CTX.proxy=cfg.proxy; if(cfg.authHeaders) CTX.authHeaders=cfg.authHeaders; if(cfg.onDone) CTX.onDone=cfg.onDone; if(cfg.modalId) CTX.modalId=cfg.modalId; },
    acties: actiesVoor, open: openActie, openFluvius: openFluvius, sluit: sluit, AANVRAAG: FLUVIUS_AANVRAAG, EIGEN: FLUVIUS_EIGEN };
  window._flxDoe = function(kind){ doeActie(kind); };
  window._flxSluit = sluit;
  window._flxKopieer = kopieer;
  window._flxKopieerChrome = function(u){ try{ location.href=u; }catch(e){} };
  window._flxOpenFluvius = openFluvius;
})();
