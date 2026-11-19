import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const host=document.getElementById('ballStage'),canvas=document.getElementById('ballCanvas'),toggle=document.getElementById('ballToggle'),close=document.getElementById('ballClose'),menu=document.getElementById('ballMenu'),status=document.getElementById('ballStatus');
if(host&&canvas&&toggle&&close&&menu){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){host.classList.add('no-webgl');status.textContent='Menu interattivo disponibile';}
 if(renderer){
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,0,11.5);
  const ambient=new THREE.AmbientLight(0x7f9ec4,2.1);scene.add(ambient);
  const key=new THREE.PointLight(0xffb45f,75);key.position.set(3,4,6);scene.add(key);
  const fill=new THREE.PointLight(0x4c86dc,42);fill.position.set(-5,-2,4);scene.add(fill);
  const rig=new THREE.Group();scene.add(rig);
  const pieces=[],radius=2.12,TAU=Math.PI*2;
  const navy=new THREE.MeshPhysicalMaterial({color:0x163759,metalness:.18,roughness:.43,clearcoat:1,clearcoatRoughness:.18,side:THREE.DoubleSide});
  const ivory=new THREE.MeshPhysicalMaterial({color:0xf0ece1,metalness:.1,roughness:.48,clearcoat:.85,side:THREE.DoubleSide});
  const gold=new THREE.LineBasicMaterial({color:0xe9ac65,transparent:true,opacity:.88});
  for(let i=0;i<6;i++){
   const a=i*TAU/6,pivot=new THREE.Group();
   for(let band=0;band<5;band++){
    const phi=.09+band*(Math.PI-.18)/5,span=(Math.PI-.18)/5;
    const geo=new THREE.SphereGeometry(radius,18,9,a+.014,TAU/6-.028,phi+.008,span-.016);
    const material=((band+i)%3===0)?navy:ivory;
    const mesh=new THREE.Mesh(geo,material);pivot.add(mesh);
    const seams=new THREE.LineSegments(new THREE.EdgesGeometry(geo,25),new THREE.LineBasicMaterial({color:0xc99a62,transparent:true,opacity:.36}));
    pivot.add(seams);
   }
   rig.add(pivot);pieces.push({pivot,a});
  }
  const center=new THREE.Mesh(new THREE.SphereGeometry(.17,24,16),new THREE.MeshPhysicalMaterial({color:0xd7ad71,metalness:.65,roughness:.25}));rig.add(center);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(2.55,.012,8,130),new THREE.MeshBasicMaterial({color:0xe3a765,transparent:true,opacity:.7}));halo.rotation.x=1.14;scene.add(halo);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:(()=>{const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,174,83,.48)');g.addColorStop(.4,'rgba(255,174,83,.15)');g.addColorStop(1,'rgba(255,174,83,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})(),transparent:true,depthWrite:false}));glow.scale.set(7.5,7.5,1);glow.position.z=-1.1;scene.add(glow);
  let open=false,openness=0,last=performance.now(),active=true,raf=0,scrollProgress=0;
  const setOpen=value=>{open=value;host.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));menu.inert=!(open||scrollProgress>.49);close.hidden=!open;status.textContent=open?'Scegli uno spicchio per esplorare':'Tocca la palla per aprire il mondo APD';};
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=w<680?13.6:11.5;camera.updateProjectionMatrix();};
  new ResizeObserver(resize).observe(host);resize();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));raycaster.setFromCamera(pointer,camera);if(raycaster.intersectObjects(rig.children,true).length)setOpen(!open)});
  toggle.addEventListener('click',()=>setOpen(!open));close.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)setOpen(false)});
  const hero=document.getElementById("inizio");const updateScroll=()=>{const range=Math.max(1,hero.offsetHeight-innerHeight);scrollProgress=Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/range));hero.style.setProperty("--scene-progress",scrollProgress.toFixed(4));if(scrollProgress>.49&&!open){host.classList.add("scroll-open");menu.inert=false;}else if(!open){host.classList.remove("scroll-open");menu.inert=true;}};window.addEventListener("scroll",updateScroll,{passive:true});updateScroll();
  const tick=now=>{if(!active)return;const dt=Math.min((now-last)/1000,.05);last=now;const scrollOpen=Math.max(0,Math.min(1,(scrollProgress-.32)/.42));openness+=((open?1:scrollOpen)-openness)*Math.min(1,dt*(reduced?18:3.8));const eased=openness*openness*(3-2*openness);
   pieces.forEach(({pivot,a},i)=>{pivot.position.set(Math.cos(a+.52)*eased*.95,Math.sin(a+.52)*eased*.95,Math.sin(a*2)*eased*.28);pivot.rotation.set(Math.sin(a)*eased*.24,Math.cos(a)*eased*.24,(i%2?1:-1)*eased*.12)});
   if(!reduced&&!open&&scrollProgress<.38)rig.rotation.y+=dt*.12;rig.rotation.x+=(Math.sin(now*.00036)*.09-rig.rotation.x)*Math.min(1,dt*1.3);
   rig.rotation.y+=(scrollProgress*.38-rig.rotation.y)*Math.min(1,dt*.32);rig.scale.setScalar(1+scrollProgress*.22-eased*.10);camera.position.z+=( (host.clientWidth<680?13.6:11.5)-scrollProgress*1.2-camera.position.z)*Math.min(1,dt*2);halo.rotation.z+=reduced?0:dt*.055;halo.material.opacity=.35+Math.sin(now*.001)*.12;
   renderer.render(scene,camera);raf=requestAnimationFrame(tick)};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){active=false;cancelAnimationFrame(raf)}else{active=true;last=performance.now();raf=requestAnimationFrame(tick)}});
  if(reduced){rig.rotation.y=.15}raf=requestAnimationFrame(tick);
 }
 if(!renderer){toggle.addEventListener('click',()=>{const open=!host.classList.contains('is-open');host.classList.toggle('is-open',open);menu.inert=!open;toggle.setAttribute('aria-expanded',String(open));close.hidden=!open});close.addEventListener('click',()=>{host.classList.remove('is-open');menu.inert=true;close.hidden=true})}
}
