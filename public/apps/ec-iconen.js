/* ec-iconen.js v1.1.0 (documenticonen doc/markt/off/bank/aftrek, klikbare tegels id/dim/title) · v1.0.0 (2026-10-30, Johan) — VISUELE BOUWSTENEN voor rapporten en EK: iconen (zonnepanelen, batterij,
   laadplein, EMS), kerncijfer-tegels en een terugverdienbalk. Eén bron voor klantrapport, offerte-, bank- en studierapport,
   «Je profiel verdient meer» (markt.html) en EK.
   Kleuren via CSS-variabelen, zodat white-label vanzelf meegaat:
     --eci-acc (accent, standaard #05B050) · --eci-ink (donker, standaard #14203a) · --eci-l (licht accent, standaard #EAF7EF)
   De host zet ze op :root (bv. klantrapport: --eci-acc:var(--accent)). Geen externe afhankelijkheden; ES5. */
(function(){
  if(window.ECI) return;
  var CSS=''+
  '.eci-tg{display:grid;gap:12px;grid-template-columns:repeat(var(--eci-n,3),minmax(0,1fr))}'+
  '.eci-t{border:1px solid #E3E8EF;border-radius:16px;padding:12px 8px 10px;text-align:center;background:linear-gradient(180deg,var(--eci-l,#EAF7EF),#fff 72%);break-inside:avoid}'+
  '.eci-t svg{width:76px;height:76px;display:block;margin:0 auto 4px}'+
  '.eci-t b{display:block;font-weight:700;font-size:14px;color:var(--eci-ink,#14203a);line-height:1.25}'+
  '.eci-t>span{display:block;font-size:11.5px;color:#5A6577;line-height:1.35;margin-top:1px}.eci-t>span span{display:inline}'+
  '.eci-ink{fill:var(--eci-ink,#14203a)}.eci-acc{fill:var(--eci-acc,#05B050)}.eci-wit{fill:#fff}.eci-zon{fill:#F2B705}'+
  '.eci-lijn{fill:none;stroke:var(--eci-ink,#14203a)}.eci-zonl{stroke:#F2B705}.eci-paneel{stroke:#fff;opacity:.55}'+
  '.eci-kp{display:grid;gap:12px;grid-template-columns:repeat(var(--eci-n,3),minmax(0,1fr))}'+
  '.eci-k{border:1px solid #E3E8EF;border-radius:16px;padding:12px 8px;text-align:center;background:#fff;break-inside:avoid}'+
  '.eci-k .k{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#5A6577}'+
  '.eci-k .v{font-weight:800;font-size:25px;color:var(--eci-ink,#14203a);line-height:1.15;margin:3px 0 1px;white-space:nowrap}'+
  '.eci-k .s{font-size:11.5px;color:#5A6577;line-height:1.3}'+
  '.eci-k.a{background:var(--eci-acc,#05B050);border-color:var(--eci-acc,#05B050)}.eci-k.a .k,.eci-k.a .s{color:#fff;opacity:.92}.eci-k.a .v{color:#fff}'+
  '.eci-pb{border:1px solid #E3E8EF;border-radius:14px;padding:10px 14px;break-inside:avoid}'+
  '.eci-pb .t{display:flex;justify-content:space-between;gap:10px;font-size:11.5px;color:#5A6577;margin-bottom:5px}'+
  '.eci-bar{height:18px;border-radius:9px;background:#F1F4F8;position:relative;overflow:hidden;display:flex}'+
  '.eci-bar i{display:block;height:100%}.eci-bar .r{background:#F3B4AE}.eci-bar .g{background:var(--eci-acc,#05B050)}.eci-bar .b{background:#7FB3E8}'+
  '.eci-pb .lg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:11px;color:#5A6577;margin-top:5px}'+
  '.eci-pb .lg span:before{content:"";display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:-1px;background:var(--c)}'+
  '.eci-klein .eci-t{padding:7px 6px 6px;border-radius:12px}.eci-klein .eci-t svg{width:44px;height:44px;margin-bottom:2px}.eci-klein .eci-t b{font-size:12.5px}.eci-klein .eci-t>span{font-size:10.5px}'+
  '.eci-klik{cursor:pointer;transition:transform .12s,box-shadow .12s}.eci-klik:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(15,23,42,.10)}.eci-dim{opacity:.55}.eci-dim.eci-klik:hover{transform:none;box-shadow:none}'+
  '.eci-slot{position:relative}.eci-slot:after{content:"🔒";position:absolute;top:6px;right:8px;font-size:14px}'+
  '@media (max-width:560px){.eci-t svg{width:52px;height:52px}.eci-t b{font-size:12px}.eci-t>span{font-size:10.5px}.eci-k .v{font-size:18px}.eci-k .k{font-size:9px;letter-spacing:.04em}.eci-tg,.eci-kp{gap:6px}}';
  function zorgCss(){ try{ if(document.getElementById('eci-css')) return; var s=document.createElement('style'); s.id='eci-css'; s.textContent=CSS; (document.head||document.documentElement).appendChild(s); }catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var I={
    pv:function(){ return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="eci-zon" cx="78" cy="18" r="10"/><g class="eci-zonl" stroke-width="3" stroke-linecap="round"><line x1="78" y1="2" x2="78" y2="5"/><line x1="94" y1="18" x2="91" y2="18"/><line x1="89" y1="7" x2="87" y2="9"/></g><polygon class="eci-ink" points="14,40 70,40 82,78 6,78"/><g class="eci-paneel" stroke-width="1.6"><line x1="33" y1="40" x2="31" y2="78"/><line x1="52" y1="40" x2="56" y2="78"/><line x1="10" y1="59" x2="76" y2="59"/></g><rect class="eci-ink" x="40" y="78" width="6" height="12"/><rect class="eci-ink" x="28" y="88" width="30" height="4" rx="2"/></svg>'; },
    bat:function(pct){ var p=Math.max(10,Math.min(100,+pct||75)), h=Math.round(52*p/100); return '<svg viewBox="0 0 100 100" aria-hidden="true"><rect class="eci-lijn" x="22" y="18" width="56" height="74" rx="9" stroke-width="5"/><rect class="eci-ink" x="38" y="8" width="24" height="10" rx="3"/><rect class="eci-acc" x="30" y="'+(84-h)+'" width="40" height="'+h+'" rx="4"/><path class="eci-wit" d="M52 34 L42 56 H50 L46 72 L60 48 H52 Z"/></svg>'; },
    lp:function(){ return '<svg viewBox="0 0 100 100" aria-hidden="true"><rect class="eci-ink" x="18" y="14" width="40" height="74" rx="7"/><rect class="eci-acc" x="25" y="22" width="26" height="18" rx="3"/><path class="eci-wit" d="M40 48 L33 62 H39 L36 74 L46 58 H40 Z"/><path class="eci-lijn" d="M58 40 C76 40 80 48 80 60 V74" stroke-width="5" stroke-linecap="round"/><rect class="eci-acc" x="74" y="74" width="12" height="12" rx="3"/><rect class="eci-ink" x="10" y="86" width="56" height="6" rx="3"/></svg>'; },
    ems:function(){ return '<svg viewBox="0 0 100 100" aria-hidden="true"><rect class="eci-ink" x="14" y="20" width="72" height="50" rx="8"/><polyline class="eci-lijn" points="22,56 36,44 48,50 62,32 78,40" stroke="#fff" style="stroke:#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle class="eci-acc" cx="62" cy="32" r="5"/><rect class="eci-ink" x="40" y="70" width="20" height="10"/><rect class="eci-ink" x="28" y="80" width="44" height="6" rx="3"/></svg>'; },
    // documenten (EK «Je documenten»)
    doc:function(){ return '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="eci-ink" d="M24 8 H62 L80 26 V92 H24 Z"/><path class="eci-acc" d="M62 8 V26 H80 Z"/><rect class="eci-wit" x="33" y="38" width="38" height="5" rx="2"/><rect class="eci-wit" x="33" y="50" width="38" height="5" rx="2"/><rect class="eci-wit" x="33" y="62" width="26" height="5" rx="2"/><rect class="eci-acc" x="33" y="74" width="16" height="10" rx="2"/><rect class="eci-acc" x="53" y="70" width="8" height="14" rx="2"/><rect class="eci-acc" x="65" y="66" width="8" height="18" rx="2"/></svg>'; },
    markt:function(){ return '<svg viewBox="0 0 100 100" aria-hidden="true"><rect class="eci-ink" x="10" y="14" width="80" height="62" rx="9"/><polyline class="eci-lijn" points="20,62 34,50 46,56 60,34 80,44" style="stroke:#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle class="eci-acc" cx="60" cy="34" r="7"/><rect class="eci-acc" x="22" y="82" width="56" height="8" rx="4"/></svg>'; },
    off:function(){ return '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="eci-ink" d="M24 8 H62 L80 26 V92 H24 Z"/><path class="eci-acc" d="M62 8 V26 H80 Z"/><rect class="eci-wit" x="33" y="36" width="38" height="5" rx="2"/><rect class="eci-wit" x="33" y="48" width="30" height="5" rx="2"/><circle class="eci-acc" cx="62" cy="72" r="14"/><path d="M55 72 L60 77 L70 66" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'; },
    bank:function(){ return '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon class="eci-ink" points="50,8 90,30 10,30"/><rect class="eci-ink" x="12" y="30" width="76" height="6"/><rect class="eci-acc" x="20" y="40" width="9" height="34"/><rect class="eci-acc" x="38" y="40" width="9" height="34"/><rect class="eci-acc" x="54" y="40" width="9" height="34"/><rect class="eci-acc" x="72" y="40" width="9" height="34"/><rect class="eci-ink" x="10" y="76" width="80" height="8" rx="2"/><rect class="eci-ink" x="6" y="86" width="88" height="6" rx="2"/></svg>'; },
    aftrek:function(){ return '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="eci-ink" d="M24 8 H62 L80 26 V92 H24 Z"/><path class="eci-acc" d="M62 8 V26 H80 Z"/><circle class="eci-acc" cx="40" cy="48" r="7"/><circle class="eci-acc" cx="64" cy="74" r="7"/><line x1="66" y1="44" x2="38" y2="78" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>'; },
    gen:function(){ return '<svg viewBox="0 0 100 100" aria-hidden="true"><rect class="eci-ink" x="12" y="34" width="70" height="44" rx="6"/><rect class="eci-acc" x="20" y="42" width="22" height="14" rx="2"/><rect class="eci-ink" x="64" y="20" width="8" height="16"/><circle class="eci-wit" cx="62" cy="62" r="8"/><rect class="eci-ink" x="16" y="78" width="10" height="8"/><rect class="eci-ink" x="68" y="78" width="10" height="8"/></svg>'; }
  };
  /* tegels(lijst[, opt]) — lijst: [{ soort:'pv'|'bat'|'lp'|'ems'|'gen', titel, sub, pct, slot }] */
  function tegels(L, opt){ zorgCss(); L=(L||[]).filter(Boolean); if(!L.length) return '';
    return '<div class="eci-tg'+(opt&&opt.klein?' eci-klein':'')+'" style="--eci-n:'+L.length+(opt&&opt.style?';'+opt.style:'')+'">'+L.map(function(x){
      var ic=I[x.soort]?I[x.soort](x.pct):'';
      return '<div class="eci-t'+(x.slot?' eci-slot':'')+(x.dim?' eci-dim':'')+(x.id?' eci-klik':'')+'"'+(x.id?' id="'+esc(x.id)+'" role="button" tabindex="0"':'')+(x.title?' title="'+esc(x.title)+'"':'')+'>'+ic+'<b>'+(x.titelHtml||esc(x.titel))+'</b>'+(x.sub||x.subHtml?'<span>'+(x.subHtml||esc(x.sub))+'</span>':'')+'</div>';
    }).join('')+'</div>'; }
  /* kpis(lijst[, opt]) — lijst: [{ k, v, s, accent }] (k/v/s platte tekst; kHtml/vHtml/sHtml mogen HTML zijn) */
  function kpis(L, opt){ zorgCss(); L=(L||[]).filter(Boolean); if(!L.length) return '';
    return '<div class="eci-kp" style="--eci-n:'+L.length+(opt&&opt.style?';'+opt.style:'')+'">'+L.map(function(x){
      return '<div class="eci-k'+(x.accent?' a':'')+'"><div class="k">'+(x.kHtml||esc(x.k))+'</div><div class="v">'+(x.vHtml||esc(x.v))+'</div>'+((x.s||x.sHtml)?'<div class="s">'+(x.sHtml||esc(x.s))+'</div>':'')+'</div>';
    }).join('')+'</div>'; }
  /* terugverdien({ tvt, n, kop, rechts, lblTerug, lblWinst }) — balk: rood tot de terugverdientijd, accent daarna (horizon n jaar) */
  function terugverdien(o){ zorgCss(); o=o||{}; var n=Math.max(1,+o.n||15), t=+o.tvt;
    if(!(t>=0)) return '';
    var r=Math.max(0,Math.min(100,t/n*100));
    return '<div class="eci-pb"'+(o.style?' style="'+o.style+'"':'')+'><div class="t"><span>'+(o.kop||'')+'</span><span>'+(o.rechts||'')+'</span></div>'+
      '<div class="eci-bar"><i class="r" style="width:'+r.toFixed(1)+'%"></i><i class="g" style="width:'+(100-r).toFixed(1)+'%"></i></div>'+
      '<div class="lg"><span style="--c:#F3B4AE">'+(o.lblTerug||'')+'</span><span style="--c:var(--eci-acc,#05B050)">'+(o.lblWinst||'')+'</span></div></div>'; }
  /* verdeling({ delen:[{ lbl, w, kleur:'g'|'b'|'r' }], kop, rechts }) — één gestapelde balk (bv. energie vs netkosten) */
  function verdeling(o){ zorgCss(); o=o||{}; var D=(o.delen||[]).filter(function(x){ return +x.w>0; }); var tot=D.reduce(function(s,x){ return s+(+x.w); },0); if(!(tot>0)) return '';
    return '<div class="eci-pb"'+(o.style?' style="'+o.style+'"':'')+'>'+((o.kop||o.rechts)?'<div class="t"><span>'+(o.kop||'')+'</span><span>'+(o.rechts||'')+'</span></div>':'')+
      '<div class="eci-bar">'+D.map(function(x){ return '<i class="'+(x.kleur||'g')+'" style="width:'+(x.w/tot*100).toFixed(1)+'%"></i>'; }).join('')+'</div>'+
      '<div class="lg">'+D.map(function(x){ return '<span style="--c:'+({g:'var(--eci-acc,#05B050)',b:'#7FB3E8',r:'#F3B4AE'}[x.kleur||'g'])+'">'+x.lbl+'</span>'; }).join('')+'</div></div>'; }
  window.ECI={ versie:'1.1.0', icoon:I, tegels:tegels, kpis:kpis, terugverdien:terugverdien, verdeling:verdeling, css:zorgCss };
})();
