/* ============================================================
   THE WEATHER MACHINE — shared behaviour (v8 luminous)
   - STATE → DOM ([data-state]) + updated date
   - nav: stick on scroll + mobile toggle
   - reveal choreography
   - rendered current field (ambient, every page)
   - home network graph (only where #graph exists)
   Motion settles then rests; mobile freezes; reduced-motion static.
   ============================================================ */
(() => {
  const S = window.STATE || {};
  document.querySelectorAll('[data-state]').forEach(el=>{ const k=el.getAttribute('data-state'); if(S[k]!=null) el.textContent=S[k]; });
  const upd=document.getElementById('updated'); if(upd&&S.updated) upd.textContent="UPDATED "+S.updated.replace(/-/g,'·');

  const STILL = /[?&]still/.test(location.search);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || STILL;
  const small  = matchMedia('(max-width: 860px)').matches;

  const nav=document.querySelector('.nav');
  if(nav){ addEventListener('scroll',()=>nav.classList.toggle('stuck',scrollY>40),{passive:true}); nav.classList.toggle('stuck',scrollY>40);
    const tg=nav.querySelector('.navtoggle'), rs=nav.querySelector('.routes');
    if(tg&&rs){ tg.addEventListener('click',()=>rs.classList.toggle('open')); rs.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>rs.classList.remove('open'))); } }

  if(!reduce){ const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:0.12});
    document.querySelectorAll('.rv').forEach(el=>io.observe(el)); }
  else document.querySelectorAll('.rv').forEach(el=>el.classList.add('in'));

  /* ---- rendered current field (ambient water) ---- */
  (() => {
    const f=document.getElementById('field'); if(!f) return; const fx=f.getContext('2d');
    let fw,fh,P=[],blobs=[],fr,fl=innerWidth,ft,vis=true;
    const flow=(x,y,t)=> Math.sin(x*0.0016+t*0.07)+Math.cos(y*0.0021-t*0.05)+0.5*Math.sin((x+y)*0.0013+t*0.04);
    function fsize(){ const d=Math.min(devicePixelRatio||1,small?1.5:2); fw=innerWidth; fh=innerHeight;
      f.width=fw*d; f.height=fh*d; fx.setTransform(d,0,0,d,0,0);
      const n=small?70:190; P=[]; for(let i=0;i<n;i++){ const x=Math.random()*fw,y=Math.random()*fh; P.push({x,y,px:x,py:y,sp:0.4+Math.random()*0.9,w:0.6+Math.random()*1.3}); }
      blobs=[]; const b=small?2:4; for(let i=0;i<b;i++) blobs.push({x:Math.random()*fw,y:fh*(0.02+Math.random()*0.3),r:120+Math.random()*180,v:0.06+Math.random()*0.08}); }
    function fdraw(ms){ const t=ms*0.001; fx.clearRect(0,0,fw,fh);
      for(const bl of blobs){ bl.x+=bl.v; if(bl.x-bl.r>fw) bl.x=-bl.r; const g=fx.createRadialGradient(bl.x,bl.y,0,bl.x,bl.y,bl.r);
        g.addColorStop(0,'rgba(255,255,255,0.14)'); g.addColorStop(1,'rgba(255,255,255,0)'); fx.fillStyle=g; fx.beginPath(); fx.arc(bl.x,bl.y,bl.r,0,6.283); fx.fill(); }
      fx.lineCap='round';
      for(const q of P){ const a=flow(q.x,q.y,t); q.px=q.x; q.py=q.y; q.x+=Math.cos(a)*q.sp; q.y+=Math.sin(a)*q.sp*0.8;
        if(q.x<-6||q.x>fw+6||q.y<-6||q.y>fh+6){ q.x=Math.random()*fw; q.y=Math.random()*fh; q.px=q.x; q.py=q.y; }
        const edge=Math.min(1,q.x/(fw*0.42)), depth=0.10+0.16*(q.y/fh);
        fx.strokeStyle=`rgba(${180-80*(q.y/fh)|0},240,255,${(0.05+depth*edge).toFixed(3)})`;
        fx.lineWidth=q.w; fx.beginPath(); fx.moveTo(q.px,q.py); fx.lineTo(q.x,q.y); fx.stroke(); }
      if(!reduce&&!small&&vis) fr=requestAnimationFrame(fdraw); }
    addEventListener('resize',()=>{ if(innerWidth===fl)return; clearTimeout(ft); ft=setTimeout(()=>{ fl=innerWidth; fsize(); if(reduce||small) fdraw(0); },200); },{passive:true});
    document.addEventListener('visibilitychange',()=>{ vis=!document.hidden; if(vis&&!reduce&&!small) fr=requestAnimationFrame(fdraw); });
    fsize(); if(reduce||small){ for(let i=0;i<60;i++) fdraw(i*16); } else fr=requestAnimationFrame(fdraw);
  })();

  /* ---- home network graph ---- */
  (() => {
    const cv=document.getElementById('graph'); if(!cv) return; const ctx=cv.getContext('2d');
    const tip=document.getElementById('tip');
    const COL={ aqua:[17,182,218], green:[8,192,138], magenta:[255,45,135], dim:[120,160,176] };
    const N=[
      {id:'harness',label:'Execution harness',sub:(S.gate||'certified'),route:'machine/#harness',c:'green',tx:0.50,ty:0.87,r:0},
      {id:'fill',label:'First live trade',sub:(S.firstFill||'pending'),route:'state/',c:'magenta',tx:0.53,ty:0.16,r:7},
      {id:'method',label:'Correction loop',sub:'how it learns',route:'method/',c:'aqua',tx:0.25,ty:0.40,r:5.5},
      {id:'champ',label:'Strategy #1 — champion',sub:'in forward validation',route:'machine/',c:'aqua',tx:0.52,ty:0.46,r:6},
      {id:'shadow',label:'Shadow streams',sub:'evidence before risk',route:'machine/#streams',c:'aqua',tx:0.77,ty:0.42,r:5.5},
      {id:'findings',label:'Findings',sub:'tested foundations',route:'measured/',c:'green',tx:0.30,ty:0.66,r:5.5},
      {id:'alloc',label:'Allocator',sub:'the destination',route:'trajectory/',c:'dim',tx:0.75,ty:0.64,r:5},
    ];
    const idx=Object.fromEntries(N.map((n,i)=>[n.id,i]));
    const E=[['method','champ'],['champ','shadow'],['champ','fill'],['method','findings'],['shadow','findings'],['champ','findings'],['alloc','champ'],['alloc','shadow']];
    const SUB=['method','champ','shadow','findings','alloc','fill'];
    let W,H,DPR,raf,t0=null,settled=false,hover=-1,lastW=innerWidth,rt;
    const ease=x=>1-Math.pow(1-x,3); const noise=(a,b)=>Math.sin(a*0.7+b)*0.6+Math.sin(a*1.7-b*1.3)*0.4;
    function size(){ DPR=Math.min(devicePixelRatio||1,small?1.5:2); const r=cv.getBoundingClientRect(); W=r.width; H=r.height;
      cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
      N.forEach(n=>{ n.X=n.tx*W; n.Y=n.ty*H; if(n.sx===undefined){ n.sx=W*(0.2+Math.random()*0.6); n.sy=H*(0.1+Math.random()*0.8); n.ph=Math.random()*6.28; } n.x=n.X; n.y=n.Y; }); }
    const rgb=(c,a)=>`rgba(${COL[c][0]},${COL[c][1]},${COL[c][2]},${a})`;
    const drk=(c,a)=>`rgba(${COL[c][0]*0.55|0},${COL[c][1]*0.55|0},${COL[c][2]*0.55|0},${a})`;
    function bead(n,p,t){ const pulse=n.c==='magenta'?(1+0.07*Math.sin(t*1.6)):1; const rr=n.r*pulse, a=(n.c==='dim'?0.7:1)*p;
      const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,rr*3.4); g.addColorStop(0,rgb(n.c,0.34*a)); g.addColorStop(0.5,rgb(n.c,0.12*a)); g.addColorStop(1,rgb(n.c,0));
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(n.x,n.y,rr*3.4,0,6.283); ctx.fill();
      ctx.fillStyle='rgba(7,40,55,0.16)'; ctx.beginPath(); ctx.ellipse(n.x,n.y+rr*0.9,rr*0.95,rr*0.5,0,0,6.283); ctx.fill();
      const bg=ctx.createRadialGradient(n.x-rr*0.4,n.y-rr*0.5,rr*0.1,n.x,n.y,rr); bg.addColorStop(0,`rgba(255,255,255,${0.95*a})`); bg.addColorStop(0.35,rgb(n.c,a)); bg.addColorStop(1,drk(n.c,a));
      ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(n.x,n.y,rr,0,6.283); ctx.fill();
      ctx.strokeStyle=drk(n.c,0.5*a); ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle=`rgba(255,255,255,${0.9*a})`; ctx.beginPath(); ctx.ellipse(n.x-rr*0.34,n.y-rr*0.42,rr*0.28,rr*0.18,-0.5,0,6.283); ctx.fill(); }
    function draw(ts){ if(t0===null) t0=ts; const t=(ts-t0)/1000; const p=reduce?1:ease(Math.min(1,t/1.5)); ctx.clearRect(0,0,W,H);
      N.forEach(n=>{ const dr=(settled&&!reduce&&!small)?noise(t*0.5,n.ph)*1.4:0; n.x=n.sx+(n.X-n.sx)*p+dr; n.y=n.sy+(n.Y-n.sy)*p+(settled?Math.cos(t*0.4+n.ph)*1.0:0); });
      const hy=N[idx.harness].ty*H;
      const dw=ctx.createLinearGradient(0,H*0.5,0,H); dw.addColorStop(0,'rgba(10,90,114,0)'); dw.addColorStop(1,'rgba(7,50,66,0.45)'); ctx.fillStyle=dw; ctx.fillRect(0,H*0.5,W,H*0.5);
      const bgd=ctx.createLinearGradient(0,hy-40,0,hy+34); bgd.addColorStop(0,'rgba(8,200,138,0)'); bgd.addColorStop(0.6,'rgba(8,220,150,0.16)'); bgd.addColorStop(1,'rgba(8,200,138,0)');
      ctx.fillStyle=bgd; ctx.fillRect(0,hy-40,W,74); ctx.strokeStyle='rgba(8,220,150,0.6)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(W*0.10,hy); ctx.lineTo(W*0.90,hy); ctx.stroke();
      ctx.lineWidth=1; SUB.forEach(id=>{ const n=N[idx[id]]; ctx.strokeStyle=`rgba(8,150,120,${0.14*p})`; ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(n.x,hy); ctx.stroke(); });
      E.forEach(([a,b])=>{ const na=N[idx[a]],nb=N[idx[b]]; ctx.strokeStyle=`rgba(12,110,140,${0.30*p})`; ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y); ctx.stroke(); });
      if(settled&&!reduce){ const a=N[idx.method],b=N[idx.champ]; const ff=(t*0.16)%2; if(ff<1){ const pp=ease(ff); const x=a.x+(b.x-a.x)*pp,y=a.y+(b.y-a.y)*pp;
        const gg=ctx.createRadialGradient(x,y,0,x,y,8); gg.addColorStop(0,'rgba(17,182,218,0.5)'); gg.addColorStop(1,'rgba(17,182,218,0)'); ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(x,y,8,0,6.283); ctx.fill(); } }
      N.forEach((n,i)=>{ if(n.id==='harness') return; bead(n,p,t); if(i===hover){ ctx.strokeStyle=rgb(n.c,0.8); ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(n.x,n.y,n.r+7,0,6.283); ctx.stroke(); } });
      if(!settled&&p>=1){ settled=true; if(small||reduce) return; } if(reduce) return; if(small&&settled) return; raf=requestAnimationFrame(draw); }
    function nodeAt(mx,my){ for(let i=0;i<N.length;i++){ const n=N[i]; if(n.id==='harness') continue; if((mx-n.x)**2+(my-n.y)**2<(n.r+9)**2) return i; } return -1; }
    cv.addEventListener('pointermove',e=>{ const r=cv.getBoundingClientRect(); const mx=e.clientX-r.left,my=e.clientY-r.top; const h=nodeAt(mx,my); cv.style.cursor=h>=0?'pointer':'default';
      if(h!==hover){ hover=h; if(!small&&!reduce&&!raf) raf=requestAnimationFrame(draw); }
      if(h>=0){ const n=N[h]; tip.innerHTML=n.label+' &nbsp;<span class="st">'+n.sub+'</span>'; tip.style.left=n.x+'px'; tip.style.top=n.y+'px'; tip.style.opacity=1; } else tip.style.opacity=0; },{passive:true});
    cv.addEventListener('pointerleave',()=>{ hover=-1; tip.style.opacity=0; });
    cv.addEventListener('click',e=>{ const r=cv.getBoundingClientRect(); const h=nodeAt(e.clientX-r.left,e.clientY-r.top); if(h>=0) location.href=N[h].route; });
    addEventListener('resize',()=>{ if(innerWidth===lastW) return; clearTimeout(rt); rt=setTimeout(()=>{ lastW=innerWidth; size(); if(reduce||small){ settled=false; t0=null; draw(performance.now()); } },200); },{passive:true});
    size(); raf=requestAnimationFrame(draw);
  })();
})();
