/* ============================================================
   THE WEATHER MACHINE — shared behaviour
   - wires ALL STATE fields into the DOM ([data-state])
   - nav: stick on scroll + mobile toggle
   - reveal choreography (restrained, eased)
   - sky canvas (clouds/sun) where #sky exists
   - space-colonization ROOTS where #roots exists (soil pages + home)
   Motion is restrained: roots GROW IN once, then settle.
   ============================================================ */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small  = matchMedia('(max-width: 760px)').matches;
  const S = window.STATE || {};

  /* ---- STATE → DOM (no status text hardcoded in markup) ---- */
  document.querySelectorAll('[data-state]').forEach(el=>{
    const k = el.getAttribute('data-state');
    if(S[k] != null) el.textContent = S[k];
  });
  const upd = document.getElementById('updated');
  if(upd && S.updated) upd.textContent = "UPDATED " + S.updated.replace(/-/g,'·');
  if(S.name) document.title = (document.title ? document.title : S.name);

  /* ---- nav ---- */
  const nav = document.querySelector('.nav');
  if(nav){
    addEventListener('scroll', ()=> nav.classList.toggle('stuck', scrollY > 40), {passive:true});
    nav.classList.toggle('stuck', scrollY > 40);
    const toggle = nav.querySelector('.navtoggle'), links = nav.querySelector('.navlinks');
    if(toggle && links){
      toggle.addEventListener('click', ()=> links.classList.toggle('open'));
      links.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> links.classList.remove('open')));
    }
  }

  /* ---- reveal ---- */
  if(!reduce){
    const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:0.12});
    document.querySelectorAll('.rv').forEach(el=>io.observe(el));
  } else document.querySelectorAll('.rv').forEach(el=>el.classList.add('in'));

  /* ============================================================
     SKY — restrained drifting clouds + gentle sun
     ============================================================ */
  (() => {
    const c=document.getElementById('sky'); if(!c) return;
    const ctx=c.getContext('2d'); let W,H,DPR,clouds=[],sun=0,raf,vis=true;
    function size(){
      DPR=Math.min(devicePixelRatio||1, small?1.5:2);
      W=innerWidth; H=innerHeight; c.width=W*DPR; c.height=H*DPR; c.style.width=W+'px'; c.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0);
      const n=small?4:6; clouds=[];
      for(let i=0;i<n;i++){ const puff=[]; const m=3+((Math.random()*3)|0);
        for(let k=0;k<m;k++) puff.push({dx:(Math.random()-0.5)*150,dy:(Math.random()-0.5)*38,r:40+Math.random()*70});
        clouds.push({x:Math.random()*W,y:H*(0.06+Math.random()*0.34),v:0.05+Math.random()*0.09,s:0.7+Math.random()*0.7,puff}); }
    }
    function draw(ms){
      const t=ms*0.001; ctx.clearRect(0,0,W,H);
      sun+=0.004; const sb=0.5+0.5*Math.sin(sun);
      const sx=W*0.8,sy=H*0.14,sr=Math.min(W,H)*0.55, g=ctx.createRadialGradient(sx,sy,0,sx,sy,sr);
      g.addColorStop(0,`rgba(255,236,196,${0.28*(0.6+0.4*sb)})`); g.addColorStop(0.45,'rgba(255,233,194,0.09)'); g.addColorStop(1,'rgba(255,233,194,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      for(const cl of clouds){ cl.x+=cl.v*(reduce?0:1); if(cl.x-170>W) cl.x=-170;
        const fade=Math.max(0,1-cl.y/(H*0.5));
        for(const p of cl.puff){ const px=cl.x+p.dx*cl.s,py=cl.y+p.dy*cl.s,pr=p.r*cl.s,gg=ctx.createRadialGradient(px,py,0,px,py,pr);
          gg.addColorStop(0,`rgba(250,252,255,${0.5*fade})`); gg.addColorStop(1,'rgba(250,252,255,0)');
          ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(px,py,pr,0,6.283); ctx.fill(); } }
      if(!reduce&&vis) raf=requestAnimationFrame(draw);
    }
    addEventListener('resize',()=>{ size(); if(reduce) draw(0); },{passive:true});
    document.addEventListener('visibilitychange',()=>{ vis=!document.hidden; if(vis&&!reduce) raf=requestAnimationFrame(draw); });
    size(); if(reduce) draw(0); else raf=requestAnimationFrame(draw);
  })();

  /* ============================================================
     ROOTS — space-colonization network (the foundations).
     Branching roots reach from the treeline toward a dense
     attractor field; built once, grown in once (eased), then
     settle to faint ambient + bloom pulse. Matte, depth via
     shadow + taper + highlight — not neon.
     ============================================================ */
  (() => {
    const c=document.getElementById('roots'); if(!c) return;
    const ctx=c.getContext('2d');
    const LEAF=[123,200,144], LEAF_DEEP=[60,122,86], MOSS=[154,211,166];
    const FLOWERS={poppy:[255,122,69],gold:[255,194,75],bloom:[238,122,168],iris:[164,136,232]};
    const isHome = document.body.classList.contains('elev-home');
    let W,H,DPR,nodes=[],maxDepth=1,blooms=[],raf,vis=true,built=false;
    let growStart=-1, GROW_MS=2600, g=0;
    const easeInOut=x=>x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
    const mix=(A,B,t)=>[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t];

    function build(){
      DPR=Math.min(devicePixelRatio||1, small?1.5:2);
      W=innerWidth; H=innerHeight; c.width=W*DPR; c.height=H*DPR; c.style.width=W+'px'; c.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0);
      const AREA=W*H;
      const STEP=small?8:7, ATTR=small?86:58, KILL=small?15:13, MAXIT=800, DENS=small?1700:1100;
      const NA=Math.min(small?520:1500, Math.max(150, Math.round(AREA/DENS)));
      const CAP=Math.min(small?340:860, Math.round(NA*0.9));
      const attr=[]; for(let i=0;i<NA;i++) attr.push({x:Math.random()*W*1.02-W*0.01, y:Math.random()*H});
      nodes=[]; const seeds=small?4:6;
      for(let s=0;s<seeds;s++) nodes.push({x:W*(0.16+0.68*(s+0.5)/seeds)+(Math.random()-0.5)*60, y:-6, parent:-1, depth:0});
      const A2=ATTR*ATTR, K2=KILL*KILL; let it=0;
      while(attr.length && nodes.length<CAP && it++<MAXIT){
        const infl=new Map();
        for(const a of attr){ let best=-1,bd=A2;
          for(let ni=0;ni<nodes.length;ni++){ const dx=a.x-nodes[ni].x,dy=a.y-nodes[ni].y,d2=dx*dx+dy*dy; if(d2<bd){bd=d2;best=ni;} }
          if(best>=0){ const n=nodes[best]; let e=infl.get(best); if(!e){e={x:0,y:0,n:0};infl.set(best,e);}
            const dx=a.x-n.x,dy=a.y-n.y,d=Math.hypot(dx,dy)||1; e.x+=dx/d; e.y+=dy/d; e.n++; } }
        if(!infl.size) break;
        infl.forEach((e,ni)=>{ const n=nodes[ni]; let dx=e.x/e.n, dy=e.y/e.n+0.42; const d=Math.hypot(dx,dy)||1;
          if(nodes.length<CAP) nodes.push({x:n.x+dx/d*STEP, y:n.y+dy/d*STEP, parent:ni, depth:n.depth+1}); });
        for(let ai=attr.length-1;ai>=0;ai--){ const a=attr[ai];
          for(let ni=0;ni<nodes.length;ni++){ const dx=a.x-nodes[ni].x,dy=a.y-nodes[ni].y; if(dx*dx+dy*dy<K2){ attr.splice(ai,1); break; } } }
      }
      const child=new Array(nodes.length).fill(0);
      for(const n of nodes) if(n.parent>=0) child[n.parent]++;
      const leaves=new Array(nodes.length).fill(0);
      for(let i=nodes.length-1;i>=0;i--){ if(child[i]===0) leaves[i]+=1; if(nodes[i].parent>=0) leaves[nodes[i].parent]+=leaves[i]; }
      maxDepth=1; for(const n of nodes) if(n.depth>maxDepth) maxDepth=n.depth;
      nodes.forEach((n,i)=>{ n.thick=Math.min(3.4,0.55+Math.sqrt(leaves[i])*0.62); n.dNorm=n.depth/maxDepth;
        n.tStart=n.depth/(maxDepth+1); n.tEnd=(n.depth+1)/(maxDepth+1);
        n.swayPh=Math.random()*6.28; n.swayAmp=0.35+n.dNorm*0.9; n.curl=(Math.random()<0.5?-1:1)*(0.06+Math.random()*0.06); n.leaf=child[i]===0; });
      blooms=[]; const tips=nodes.map((n,i)=>({n,i})).filter(o=>o.n.leaf && o.n.depth>maxDepth*0.45);
      for(let k=tips.length-1;k>0;k--){ const j=(Math.random()*(k+1))|0; [tips[k],tips[j]]=[tips[j],tips[k]]; }
      const pal=['gold','bloom','poppy','gold','bloom','iris','gold'], BMAX=small?4:7;
      for(let k=0;k<Math.min(BMAX,tips.length);k++) blooms.push({ni:tips[k].i, hue:FLOWERS[pal[k%pal.length]], ph:Math.random()*6.28, r:small?5:6.5});
      built=true;
    }
    function pos(n,t){ if(reduce||g<1) return [n.x,n.y];
      return [n.x+Math.sin(t*0.22+n.swayPh)*n.swayAmp*0.9, n.y+Math.cos(t*0.18+n.swayPh)*n.swayAmp*0.5]; }
    function draw(ms){
      const t=ms*0.001;
      if(growStart>=0 && !reduce) g=Math.min(1, easeInOut(Math.min(1,(ms-growStart)/GROW_MS)));
      ctx.clearRect(0,0,W,H); if(!built){ if(!reduce&&vis) raf=requestAnimationFrame(draw); return; }
      ctx.lineCap='round'; ctx.lineJoin='round';
      for(let i=0;i<nodes.length;i++){ const n=nodes[i]; if(n.parent<0) continue;
        const frac=g>=1?1:Math.max(0,Math.min(1,(g-n.tStart)/(n.tEnd-n.tStart))); if(frac<=0) continue;
        const p=nodes[n.parent], a=pos(p,t), b0=pos(n,t), bx=a[0]+(b0[0]-a[0])*frac, by=a[1]+(b0[1]-a[1])*frac;
        const mx=(a[0]+bx)/2+(a[1]-by)*n.curl, my=(a[1]+by)/2+(bx-a[0])*n.curl;
        const col=mix(LEAF_DEEP, n.dNorm<0.55?LEAF:MOSS, n.dNorm);
        ctx.strokeStyle='rgba(8,5,2,0.42)'; ctx.lineWidth=n.thick+1.3;
        ctx.beginPath(); ctx.moveTo(a[0]+0.6,a[1]+1.2); ctx.quadraticCurveTo(mx+0.6,my+1.2,bx+0.6,by+1.2); ctx.stroke();
        ctx.strokeStyle=`rgba(${col[0]|0},${col[1]|0},${col[2]|0},0.92)`; ctx.lineWidth=n.thick;
        ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.quadraticCurveTo(mx,my,bx,by); ctx.stroke();
        if(n.thick>1.5){ ctx.strokeStyle='rgba(196,236,205,0.13)'; ctx.lineWidth=Math.max(0.5,n.thick*0.4);
          ctx.beginPath(); ctx.moveTo(a[0]-0.5,a[1]-0.8); ctx.quadraticCurveTo(mx-0.5,my-0.8,bx-0.5,by-0.8); ctx.stroke(); } }
      for(const bl of blooms){ const n=nodes[bl.ni]; if(!n||g<n.tEnd) continue;
        const xy=pos(n,t), pul=reduce?0.85:(0.6+0.4*Math.sin(t*1.25+bl.ph)), col=bl.hue, R=bl.r;
        const gg=ctx.createRadialGradient(xy[0],xy[1],0,xy[0],xy[1],R*2.4);
        gg.addColorStop(0,`rgba(${col[0]},${col[1]},${col[2]},${0.34*pul})`); gg.addColorStop(0.5,`rgba(${col[0]},${col[1]},${col[2]},${0.10*pul})`); gg.addColorStop(1,`rgba(${col[0]},${col[1]},${col[2]},0)`);
        ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(xy[0],xy[1],R*2.4,0,6.283); ctx.fill();
        ctx.fillStyle=`rgba(${Math.min(255,col[0]+70)},${Math.min(255,col[1]+60)},${Math.min(255,col[2]+60)},${0.9*pul})`;
        ctx.beginPath(); ctx.arc(xy[0],xy[1],1.7,0,6.283); ctx.fill(); }
      if(reduce) return; if(vis) raf=requestAnimationFrame(draw);
    }
    function startGrow(){ if(growStart<0 && !reduce) growStart=performance.now(); }
    if(isHome){
      c.style.opacity=0; c.style.transition='opacity .4s ease';
      addEventListener('scroll', ()=>{ const o=Math.max(0,Math.min(1,(scrollY/innerHeight-0.45)/0.5)); c.style.opacity=o.toFixed(3); if(o>0.04) startGrow(); }, {passive:true});
    } else { c.style.opacity=1; startGrow(); }
    addEventListener('resize',()=>{ const grown=g>=1; build(); if(grown){ growStart=performance.now()-GROW_MS; g=1; } if(reduce) draw(0); },{passive:true});
    document.addEventListener('visibilitychange',()=>{ vis=!document.hidden; if(vis&&!reduce) raf=requestAnimationFrame(draw); });
    build(); if(reduce){ g=1; draw(0); } else raf=requestAnimationFrame(draw);
  })();
})();
