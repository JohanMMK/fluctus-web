/* ============================================================================
 * FLUCTUS RAPPORT-PDF  v1.0.0  — herbruikbare drop-in voor élk Fluctus-rapport
 * Voeg toe met één regel vlak vóór </body>:
 *     <script src="/apps/fluctus-rapport-pdf.js"></script>
 * (jsPDF + html2canvas worden automatisch geladen als ze nog niet aanwezig zijn.)
 *
 * Wat het doet:
 *  - Zet het projectnummer (FLX-…) in de voettekst van elke pagina (.a4-foot / .foot).
 *  - Voegt een "Print"- en "PDF opslaan"-knop toe (rechtsonder, verborgen bij print).
 *  - PDF opslaan → lokale download + upload naar de Supabase-bucket via /api/rapport-opslaan.
 *      • Same-origin rapport (bv. factuurrapport.html): upload rechtstreeks met het sb-JWT uit localStorage.
 *      • Blob-rapport (bv. het inline SolarActive-rapport): lukt de directe upload niet, dan gaat de PDF via
 *        postMessage naar het openende venster (de simulator), dat wél het token heeft en de upload doet.
 *
 * Metadata (project-id / type / klant) leest het uit, in volgorde:
 *   window.FLUCTUS_RAPPORT_META = { project_id, type, klant }  →  losse globals  →  sessionStorage-payloads.
 * ========================================================================== */
(function(){
  'use strict';
  function _laad(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=function(){rej(new Error('kon '+src+' niet laden'));}; document.head.appendChild(s); }); }
  async function _libs(){
    if(!window.html2canvas) await _laad('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    if(!window.jspdf)       await _laad('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }
  function _meta(){
    var m = window.FLUCTUS_RAPPORT_META || {};
    var pid = m.project_id || window.FLUCTUS_PROJECT_ID || '';
    var type = m.type || window.FLUCTUS_RAPPORT_TYPE || 'rapport';
    var klant = m.klant || '';
    if(!pid){ ['FLUCTUS_ONTWERP_RAPPORT','FLUCTUS_RAPPORT','FLUCTUS_FACTUURRAPPORT'].forEach(function(k){
      if(pid) return; try{ var d=JSON.parse(sessionStorage.getItem(k)||'null'); if(d&&d.project_id){ pid=d.project_id; if(!klant)klant=d.klant||''; } }catch(e){} }); }
    return { pid:pid, type:type, klant:klant };
  }
  var M=_meta();
  // projectnummer in de voettekst van elke pagina
  if(M.pid){ Array.prototype.forEach.call(document.querySelectorAll('.a4-foot, .foot'), function(f){
    var sp=f.querySelector('span:last-child')||f; if(sp.textContent.indexOf('Projectnr')<0){ sp.textContent='Projectnr. '+M.pid+' · '+sp.textContent; } }); }
  // knoppenbalk
  var css=document.createElement('style');
  css.textContent='#fdpdf-bar{position:fixed;right:16px;bottom:16px;z-index:99999;display:flex;gap:8px;font-family:Helvetica,Arial,sans-serif}'+
    '#fdpdf-bar button{font-size:12px;font-weight:700;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.22)}'+
    '#fdpdf-save{background:#05B050;color:#fff}#fdpdf-print{background:#fff;color:#1F3864;border:1px solid #D5DBE3}'+
    '@media print{#fdpdf-bar{display:none}}';
  document.head.appendChild(css);
  var bar=document.createElement('div'); bar.id='fdpdf-bar';
  bar.innerHTML='<button id="fdpdf-print">🖨️ Print</button><button id="fdpdf-save">⬇ PDF opslaan</button>';
  document.body.appendChild(bar);
  document.getElementById('fdpdf-print').onclick=function(){ window.print(); };
  var btn=document.getElementById('fdpdf-save');

  function bearer(){ try{ for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i);
    if(/^sb-.+-auth-token$/.test(k)){ var v=JSON.parse(localStorage.getItem(k)||'null');
      return (v&&(v.access_token||(v.currentSession&&v.currentSession.access_token)))||null; } } }catch(e){} return null; }

  async function buildPdf(){
    await _libs();
    if(!window.jspdf||!window.html2canvas) throw new Error('PDF-bibliotheken niet geladen (internet?)');
    var pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
    var pages=document.querySelectorAll('.a4');
    if(pages.length<1) pages=document.querySelectorAll('.pg');
    if(pages.length>=1){
      for(var i=0;i<pages.length;i++){
        var c=await window.html2canvas(pages[i],{scale:2,backgroundColor:'#ffffff',logging:false,useCORS:true});
        var h=c.height*210/c.width;
        if(h<=298){ if(i>0)pdf.addPage(); pdf.addImage(c.toDataURL('image/jpeg',0.92),'JPEG',0,0,210,h); }
        else { _sliceNaarPaginas(pdf, c, i>0); }   // lange pagina → in A4-stukken snijden
      }
    } else {
      var cB=await window.html2canvas(document.body,{scale:2,backgroundColor:'#ffffff',logging:false,useCORS:true,ignoreElements:function(el){return el.id==='fdpdf-bar';}});
      _sliceNaarPaginas(pdf, cB, false);
    }
    return pdf;
  }
  // snijdt één (lang) canvas in opeenvolgende A4-pagina's
  function _sliceNaarPaginas(pdf, canvas, nieuwePaginaEerst){
    var pxPerMm=canvas.width/210, pageHpx=Math.floor(297*pxPerMm), y=0, eerste=true;
    while(y<canvas.height){
      var sliceH=Math.min(pageHpx, canvas.height-y);
      var tmp=document.createElement('canvas'); tmp.width=canvas.width; tmp.height=sliceH;
      tmp.getContext('2d').drawImage(canvas,0,y,canvas.width,sliceH,0,0,canvas.width,sliceH);
      if(!eerste || nieuwePaginaEerst) pdf.addPage();
      pdf.addImage(tmp.toDataURL('image/jpeg',0.92),'JPEG',0,0,210,sliceH/pxPerMm);
      y+=sliceH; eerste=false;
    }
  }

  function fname(){ return ((M.klant||'rapport')+'_'+M.type+(M.pid?'_'+M.pid:'')).replace(/[^A-Za-z0-9._-]/g,'_')+'.pdf'; }

  async function upload(b64){
    var payload={ project:M.klant||M.pid, project_id:M.pid, type:M.type, filenaam:fname(), pdf_base64:b64 };
    var tok=bearer();
    // 1) directe upload (same-origin rapport met token)
    if(tok){ try{
      var r=await fetch('/api/rapport-opslaan',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},body:JSON.stringify(payload)});
      var j={}; try{ j=await r.json(); }catch(e){}
      if(r.ok) return {ok:true}; if(!(window.opener||window.parent!==window)) return {ok:false,error:j.error||('HTTP '+r.status)};
    }catch(e){ if(!(window.opener||window.parent!==window)) return {ok:false,error:e.message}; } }
    // 2) terugval: laat het openende venster (simulator) uploaden
    if(window.opener||window.parent!==window){
      return await new Promise(function(res){
        function onMsg(e){ if(e.data&&e.data.type==='fluctus-rapport-saved'){ window.removeEventListener('message',onMsg); res(e.data.ok?{ok:true}:{ok:false,error:e.data.error}); } }
        window.addEventListener('message',onMsg);
        (window.opener||window.parent).postMessage({type:'fluctus-rapport-pdf', payload:payload},'*');
        setTimeout(function(){ res({ok:false,error:'geen antwoord van de app'}); }, 20000);
      });
    }
    return {ok:false, error:'niet ingelogd'};
  }

  btn.onclick=async function(){
    btn.disabled=true; var o=btn.textContent;
    try{
      btn.textContent='PDF genereren…';
      var pdf=await buildPdf();
      pdf.save(fname());
      btn.textContent='Opslaan in Supabase…';
      var b64=pdf.output('datauristring').split(',')[1];
      var res=await upload(b64);
      btn.textContent = res.ok ? '✓ Opgeslagen in Supabase' : ('PDF gedownload · upload: '+(res.error||'mislukt'));
    }catch(e){ btn.textContent='Fout: '+((e&&e.message)||e); }
    setTimeout(function(){ btn.disabled=false; btn.textContent=o; }, 5000);
  };
})();