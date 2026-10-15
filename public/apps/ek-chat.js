/* ek-chat.js v1.0.0 — 2026-10-15 (Johan): zwevende knop «💬 Gesprek» + chat-modal voor de hulpvraag (server ≥ 15.303.0).
   Zelfstandig (o.a. klantrapport.html). Verschijnt enkel als het dossier al een hulpgesprek heeft.
   Gebruik: EKChat.init({ token, api?, lang?, plek?: 'links'|'rechts', hoogte?: px vanaf onder }).
   Endpoints: GET /api/ek/hulp-chat?token= · POST /api/ek/hulp-bericht {token,id,tekst,bel}.
   Zelfde «gezien»-sleutel als ek.html (localStorage EK_HULP_GEZIEN_<token>) → badge «nieuw» blijft consistent. */
(function(){
  'use strict';
  if (window.EKChat) return;
  var C = { token:'', api:'https://lucid-amazement-production.up.railway.app', lang:'nl', plek:'links', hoogte:64 }, HULP = [], poll = null, achter = null;
  var T = {
    nl:{ fab:'💬 Gesprek', t:'Gesprek met onze adviseur', jij:'Jij', ek:'Adviseur Energie-Compas', ph:'Typ je bericht…', s:'Verstuur', x:'Sluiten', bel:'Bel mij terug',
      info:'Een adviseur antwoordt hier zo snel mogelijk. Je krijgt ook een mail zodra er een antwoord is.', dicht:'Dit gesprek is afgesloten. Stuur een bericht om het opnieuw te openen.',
      gebeld:'We namen telefonisch contact met jou op.', gesl:'Gesprek afgesloten', nieuw:'nieuwe vraag', leeg:'Schrijf een bericht of vink «Bel mij terug» aan.', nok:'Versturen lukte niet — probeer het opnieuw.', badge:'nieuw' },
    fr:{ fab:'💬 Conversation', t:'Conversation avec notre conseiller', jij:'Vous', ek:'Conseiller Energie-Compas', ph:'Votre message…', s:'Envoyer', x:'Fermer', bel:'Rappelez-moi',
      info:'Un conseiller répond ici dès que possible. Vous recevez aussi un e-mail dès qu’il y a une réponse.', dicht:'Cette conversation est clôturée. Envoyez un message pour la rouvrir.',
      gebeld:'Nous vous avons contacté par téléphone.', gesl:'Conversation clôturée', nieuw:'nouvelle question', leeg:'Écrivez un message ou cochez « Rappelez-moi ».', nok:'L’envoi a échoué — réessayez.', badge:'nouveau' },
    en:{ fab:'💬 Chat', t:'Conversation with our adviser', jij:'You', ek:'Energie-Compas adviser', ph:'Type your message…', s:'Send', x:'Close', bel:'Call me back',
      info:'An adviser replies here as soon as possible. You also get an e-mail when there is an answer.', dicht:'This conversation is closed. Send a message to reopen it.',
      gebeld:'We contacted you by phone.', gesl:'Conversation closed', nieuw:'new question', leeg:'Write a message or tick «Call me back».', nok:'Sending failed — please try again.', badge:'new' }
  };
  function t(k){ var d=T[C.lang]||T.nl; return d[k]!=null?d[k]:T.nl[k]; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function p2(n){ return (n<10?'0':'')+n; }
  function dt(ts){ var d=new Date(+ts); if(isNaN(d.getTime())) return ''; return p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear()+' '+p2(d.getHours())+':'+p2(d.getMinutes()); }
  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function lijst(){ return HULP.slice().sort(function(a,c){ return (+a.ts||0)-(+c.ts||0); }); }
  function B(x){ if(x.berichten&&x.berichten.length) return x.berichten; var r=[]; if(x.commentaar||x.terugbellen) r.push({ ts:x.ts, van:'klant', tekst:x.commentaar||'', bel:x.terugbellen }); if(x.antwoord) r.push({ ts:x.beantwoord_ts, van:'ek', soort:'mail', tekst:x.antwoord }); else if(x.status==='gebeld') r.push({ ts:x.beantwoord_ts, van:'ek', soort:'gebeld', tekst:'' }); return r; }
  function sleutel(){ return lijst().map(function(x){ return x.id+':'+B(x).length+':'+(x.status||''); }).join('|'); }
  function nieuw(){ var L=lijst(), lt=L[L.length-1]; if(!lt) return false; var b=B(lt), m=b[b.length-1]; return !!(m && m.van==='ek' && m.soort!=='gesloten' && lsGet('EK_HULP_GEZIEN_'+C.token)!==sleutel()); }
  function css(){
    if(document.getElementById('ekc2-css')) return;
    var s=document.createElement('style'); s.id='ekc2-css';
    s.textContent=
      '#ekc2-fab{position:fixed;'+(C.plek==='rechts'?'right:14px':'left:16px')+';bottom:'+C.hoogte+'px;z-index:9997;display:inline-flex;align-items:center;gap:6px;background:#05b050;color:#fff;border:0;border-radius:999px;padding:10px 16px;font:600 14px Poppins,-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 6px 18px rgba(5,176,80,.35);cursor:pointer}'+
      '#ekc2-fab:hover{background:#048443}#ekc2-fab .b{background:#E5484D;color:#fff;border-radius:999px;font-size:11px;padding:1px 7px;font-weight:700}'+
      '#ekc2-ov{position:fixed;inset:0;z-index:10050;background:rgba(15,28,48,.45);display:flex;align-items:center;justify-content:center;padding:16px}'+
      '#ekc2-ov .k{background:#fff;border-radius:18px;max-width:520px;width:100%;max-height:92vh;overflow:auto;box-shadow:0 20px 60px rgba(13,21,38,.25);padding:22px 22px 18px;font:15px/1.55 Poppins,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#14203a;text-align:left}'+
      '#ekc2-ov h3{margin:0 0 6px;font-size:20px;font-weight:700;color:#14203a}'+
      '#ekc2-ov textarea{width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid #D6E0EC;border-radius:9px;font:inherit;margin:4px 0}'+
      '#ekc2-ov .a{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px}'+
      '#ekc2-ov .btn{border:0;background:#05b050;color:#fff;font-weight:600;padding:10px 20px;border-radius:999px;cursor:pointer;font:600 15px Poppins,-apple-system,Segoe UI,Roboto,Arial,sans-serif}#ekc2-ov .btn.g{background:#fff;color:#05b050;border:2px solid #05b050;padding:8px 18px}'+
      '@media print{#ekc2-fab,#ekc2-ov{display:none!important}}';
    document.head.appendChild(s);
  }
  function chatHtml(){
    var L=lijst(), h='';
    L.forEach(function(x,i){
      if(i>0) h+='<div style="text-align:center;font-size:11.5px;color:#9AA5B8;margin:6px 0">— '+esc(t('nieuw'))+' · '+esc(dt(x.ts))+' —</div>';
      B(x).forEach(function(m){
        var ek=(m.van==='ek');
        if(ek && (m.soort==='gebeld'||m.soort==='gesloten')){ h+='<div style="text-align:center;font-size:12.5px;color:'+(m.soort==='gebeld'?'#1E7A42':'#6B7689')+'">'+(m.soort==='gebeld'?'📞 '+esc(t('gebeld')):'✔ '+esc(t('gesl')))+' · '+esc(dt(m.ts))+'</div>'; return; }
        var wie=ek?t('ek'):((m.wie&&m.wie.naam&&m.wie.rol&&m.wie.rol!=='klant')?m.wie.naam:t('jij'));
        h+='<div style="display:flex;justify-content:'+(ek?'flex-start':'flex-end')+'"><div style="max-width:85%;border-radius:14px;padding:8px 12px;'+(ek?'background:#F4F7FB;border-left:4px solid #05B050':'background:#e6f6ec')+'">'+
          '<div style="font-size:11.5px;color:#6B7689;margin-bottom:2px">'+esc(wie)+' · '+esc(dt(m.ts))+'</div>'+
          (m.tekst?'<div style="white-space:pre-wrap;font-size:14.5px">'+esc(m.tekst)+'</div>':'')+
          (m.bel?'<div style="font-size:12px;color:#B45309;margin-top:2px">📞 '+esc(t('bel'))+'</div>':'')+'</div></div>';
      });
    });
    return h;
  }
  function fab(){
    css();
    var f=document.getElementById('ekc2-fab');
    if(!HULP.length){ if(f) f.remove(); return; }
    if(!f){ f=document.createElement('button'); f.type='button'; f.id='ekc2-fab'; f.setAttribute('data-nolog','1'); f.onclick=open; document.body.appendChild(f); }
    f.innerHTML=esc(t('fab'))+(nieuw()?' <span class="b">'+esc(t('badge'))+'</span>':'');
  }
  function teken(){
    var l=document.getElementById('ekc2-lijst'); if(!l) return;
    l.innerHTML=chatHtml(); l.scrollTop=l.scrollHeight;
    var L=lijst(), lt=L[L.length-1], dicht=!!(lt&&(lt.status==='gebeld'||lt.status==='gesloten'));
    var i=document.getElementById('ekc2-info'); if(i) i.textContent=t(dicht?'dicht':'info');
    lsSet('EK_HULP_GEZIEN_'+C.token, sleutel()); fab();
  }
  async function haal(){
    try{ var r=await fetch(C.api+'/api/ek/hulp-chat?token='+encodeURIComponent(C.token)+'&cb='+Date.now(),{ cache:'no-store' }); var j=await r.json();
      if(!(j&&j.ok&&Array.isArray(j.hulp))) return false; var oud=sleutel(); HULP=j.hulp; fab(); return sleutel()!==oud; }catch(e){ return false; }
  }
  function sluit(){ var o=document.getElementById('ekc2-ov'); if(o) o.remove(); if(poll){ clearInterval(poll); poll=null; } }
  function open(){
    css(); sluit();
    var o=document.createElement('div'); o.id='ekc2-ov';
    o.innerHTML='<div class="k" role="dialog" aria-modal="true"><h3>'+esc(t('t'))+'</h3>'+
      '<div id="ekc2-lijst" style="max-height:48vh;overflow:auto;padding:4px 2px;margin:6px 0 8px;display:flex;flex-direction:column;gap:8px"></div>'+
      '<div id="ekc2-info" style="font-size:12.5px;color:#6B7689;margin-bottom:4px"></div>'+
      '<textarea id="ekc2-tx" rows="3" placeholder="'+esc(t('ph'))+'"></textarea>'+
      '<label style="display:flex;gap:8px;align-items:center;margin:4px 0;font-weight:600;font-size:14px"><input type="checkbox" id="ekc2-b"> '+esc(t('bel'))+'</label>'+
      '<div id="ekc2-st" style="font-size:13px;min-height:1.2em"></div>'+
      '<div class="a"><button type="button" class="btn g" id="ekc2-x">'+esc(t('x'))+'</button><button type="button" class="btn" id="ekc2-s">'+esc(t('s'))+'</button></div></div>';
    document.body.appendChild(o);
    o.addEventListener('click', function(e){ if(e.target===o) sluit(); });
    document.getElementById('ekc2-x').onclick=sluit;
    document.getElementById('ekc2-s').onclick=async function(){
      var st=document.getElementById('ekc2-st'), ta=document.getElementById('ekc2-tx'), tx=(ta.value||'').trim(), bel=document.getElementById('ekc2-b').checked, bt=this;
      if(!tx && !bel){ st.style.color='#8a5a00'; st.textContent=t('leeg'); return; }
      bt.disabled=true; st.textContent='';
      try{ var L=lijst(), lt=L[L.length-1];
        var r=await fetch(C.api+'/api/ek/hulp-bericht',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token:C.token, id:lt?lt.id:undefined, tekst:tx, bel:bel }) });
        var j=await r.json().catch(function(){return{};}); if(!r.ok||!j.ok) throw new Error('x');
        HULP=j.hulp||HULP; ta.value=''; document.getElementById('ekc2-b').checked=false; teken();
      }catch(e){ st.style.color='#8a1f1f'; st.textContent=t('nok'); }
      bt.disabled=false;
    };
    teken();
    poll=setInterval(async function(){ if(!document.getElementById('ekc2-lijst')){ clearInterval(poll); poll=null; return; } if(await haal()) teken(); }, 20000);
  }
  async function init(o){
    o=o||{}; if(!o.token) return; C.token=String(o.token); if(o.api) C.api=String(o.api).replace(/\/+$/,'');
    var l=String(o.lang||'nl').slice(0,2); C.lang=(l==='fr'||l==='en')?l:'nl'; if(o.plek) C.plek=o.plek; if(o.hoogte!=null) C.hoogte=+o.hoogte;
    if(Array.isArray(o.hulp)){ HULP=o.hulp; fab(); } else { await haal(); }
    if(!achter) achter=setInterval(function(){ try{ if(document.visibilityState!=='visible' || document.getElementById('ekc2-lijst')) return; if(!HULP.some(function(x){ return x.status==='open'; })) return; haal(); }catch(e){} }, 60000);
  }
  window.EKChat={ init:init, open:open, vernieuw:haal };
})();
