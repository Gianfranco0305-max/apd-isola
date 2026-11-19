import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const canvas=document.getElementById('scene'),menu=document.getElementById('petals'),hit=document.getElementById('ballAction'),close=document.getElementById('close'),loading=document.getElementById('loading'),error=document.getElementById('error'),background=document.getElementById('photoWorld');
let renderer;try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch(e){error.hidden=false;loading.remove();throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.set(0,0,12);
scene.add(new THREE.HemisphereLight(0xdbeeff,0x263b50,2.1));
const key=new THREE.DirectionalLight(0xffd3a3,3.4);key.position.set(-4,6,8);scene.add(key);
const rim=new THREE.PointLight(0x8baed4,40,20);rim.position.set(5,-2,4);scene.add(rim);
const world=new THREE.Group();scene.add(world);
const ball=new THREE.Group();world.add(ball);
const white=new THREE.MeshPhysicalMaterial({color:0xf0e9dd,metalness:.05,roughness:.42,clearcoat:.75,clearcoatRoughness:.22,side:THREE.DoubleSide});
const blue=new THREE.MeshPhysicalMaterial({color:0x173450,metalness:.14,roughness:.36,clearcoat:.85,side:THREE.DoubleSide});
const seam=new THREE.LineBasicMaterial({color:0xc4a47e,transparent:true,opacity:.5});
const parts=[],TAU=Math.PI*2,R=1.85;
for(let sector=0;sector<6;sector++){
 const a=sector*TAU/6,pivot=new THREE.Group();
 for(let band=0;band<7;band++){
  const phi=.015+band*(Math.PI-.03)/7,span=(Math.PI-.03)/7;
  const g=new THREE.SphereGeometry(R,24,12,a+.005,TAU/6-.01,phi+.004,span-.008);
  const panel=new THREE.Mesh(g,((band+sector)%5===0||((band+sector)%5===1&&band%2===0))?blue:white);
  pivot.add(panel);
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(g,38),seam);pivot.add(outline);
 }
 ball.add(pivot);parts.push({pivot,a});
}
const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,2),new THREE.MeshStandardMaterial({color:0x122a3c,roughness:.45,metalness:.35}));ball.add(core);
const halo=new THREE.Mesh(new THREE.TorusGeometry(2.32,.013,8,160),new THREE.MeshBasicMaterial({color:0xffc38b,transparent:true,opacity:.62}));halo.rotation.x=1.18;world.add(halo);
const halo2=new THREE.Mesh(new THREE.TorusGeometry(2.45,.008,8,160),new THREE.MeshBasicMaterial({color:0xb4d4e9,transparent:true,opacity:.3}));halo2.rotation.set(.9,.3,.2);world.add(halo2);
const makeGlow=()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,191,120,.32)');g.addColorStop(.45,'rgba(255,191,120,.10)');g.addColorStop(1,'rgba(255,191,120,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)};
const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlow(),transparent:true,depthWrite:false}));glow.position.z=-1.4;glow.scale.set(7,7,1);world.add(glow);
let opened=false,openAmount=0,yaw=0,pitch=0,targetYaw=0,targetPitch=0,zoom=12,last=performance.now(),down=null,moved=false,raf=0,active=true;
const setOpen=v=>{opened=v;menu.classList.toggle('open',v);menu.inert=!v;close.hidden=!v;hit.disabled=v;document.getElementById('instruction').textContent=v?'SCEGLI UNA SEZIONE':'TRASCINA PER ESPLORARE · TOCCA LA PALLA'};
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<700?52:40;camera.updateProjectionMatrix();zoom=w<700?13.5:12}addEventListener('resize',resize);resize();
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
function ballClicked(x,y){const rect=canvas.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2);ray.setFromCamera(pointer,camera);return ray.intersectObjects(parts.flatMap(p=>p.pivot.children),false).length>0}
canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};moved=false;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;targetYaw+=dx*.003;targetPitch=Math.max(-.22,Math.min(.22,targetPitch+dy*.002));down={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointerup',e=>{if(!moved&&ballClicked(e.clientX,e.clientY))setOpen(!opened);down=null});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(9.7,Math.min(15.5,zoom+e.deltaY*.005))},{passive:false});
hit.addEventListener('click',()=>setOpen(true));close.addEventListener('click',()=>setOpen(false));addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(t){if(!active)return;const dt=Math.min(.05,(t-last)/1000);last=t;openAmount+=(Number(opened)-openAmount)*Math.min(1,dt*(reduced?30:3));const v=openAmount*openAmount*(3-2*openAmount);
parts.forEach(({pivot,a},i)=>{pivot.position.set(Math.cos(a+.52)*v*1.4,Math.sin(a+.52)*v*1.2,Math.sin(a*2)*v*.55);pivot.rotation.set(Math.sin(a)*v*.18,Math.cos(a)*v*.18,(i%2?1:-1)*v*.13)});
if(!opened&&!reduced)targetYaw+=dt*.09;
yaw+=(targetYaw-yaw)*Math.min(1,dt*2);pitch+=(targetPitch-pitch)*Math.min(1,dt*2);
ball.rotation.set(pitch,yaw,0);ball.scale.setScalar(1-v*.10);halo.rotation.z+=reduced?0:dt*.07;
camera.position.z+=(zoom-camera.position.z)*Math.min(1,dt*2);
background.style.transform='translate3d('+(-Math.sin(yaw*.25)*1.2)+'%,'+(-pitch*2.5)+'%,0) scale(1.07)';
renderer.render(scene,camera);raf=requestAnimationFrame(frame)}
document.addEventListener('visibilitychange',()=>{active=!document.hidden;if(active){last=performance.now();raf=requestAnimationFrame(frame)}else cancelAnimationFrame(raf)});
raf=requestAnimationFrame(frame);setTimeout(()=>{loading.classList.add('hide');setTimeout(()=>loading.remove(),1000)},850);
