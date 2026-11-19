import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const canvas=document.getElementById('worldCanvas'),loading=document.getElementById('loading'),menu=document.getElementById('worldMenu'),back=document.getElementById('back'),enter=document.getElementById('enter'),fallback=document.getElementById('fallback');
let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){loading.remove();fallback.hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;renderer.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x71889d);scene.fog=new THREE.FogExp2(0x72869b,.012);
const camera=new THREE.PerspectiveCamera(48,1,.1,250);camera.position.set(0,2.5,14);camera.lookAt(0,1,0);
const hemi=new THREE.HemisphereLight(0xe5f2ff,0x1a2432,2.2);scene.add(hemi);const sun=new THREE.DirectionalLight(0xffd4a2,3.4);sun.position.set(-9,17,-12);scene.add(sun);const key=new THREE.PointLight(0xffb861,90,35);key.position.set(3,6,6);scene.add(key);
const panorama=new THREE.TextureLoader().load('../assets/38DE58D1-6DEC-4EFF-9882-09D9C83B0A3E.jpg',()=>{loading.classList.add('done');setTimeout(()=>loading.remove(),900)},undefined,()=>loading.classList.add('done'));panorama.colorSpace=THREE.SRGBColorSpace;
const sky=new THREE.Mesh(new THREE.SphereGeometry(110,64,32),new THREE.MeshBasicMaterial({map:panorama,side:THREE.BackSide,depthWrite:false}));sky.scale.x=-1;sky.rotation.y=Math.PI*.52;scene.add(sky);
const groundGeo=new THREE.PlaneGeometry(210,210,100,100);groundGeo.rotateX(-Math.PI/2);const pos=groundGeo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);const d=Math.hypot(x,z);const h=Math.sin(x*.21)*Math.cos(z*.18)*.55+Math.sin(x*.055+z*.075)*1.5+Math.max(0,(d-12)*.038)*Math.sin(x*.11);pos.setY(i,h-5)}groundGeo.computeVertexNormals();const ground=new THREE.Mesh(groundGeo,new THREE.MeshStandardMaterial({color:0x34485a,roughness:1,flatShading:true}));scene.add(ground);
const stars=new THREE.BufferGeometry(),coords=[];for(let i=0;i<400;i++){const a=Math.random()*Math.PI*2,r=20+Math.random()*65;coords.push(Math.cos(a)*r,Math.random()*30+8,Math.sin(a)*r)}stars.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xe5d3b4,size:.14,transparent:true,opacity:.5})));
const assembly=new THREE.Group();assembly.position.y=1;scene.add(assembly);
const ivory=new THREE.MeshPhysicalMaterial({color:0xf3eee3,metalness:.08,roughness:.34,clearcoat:.85,clearcoatRoughness:.16,side:THREE.DoubleSide}),navy=new THREE.MeshPhysicalMaterial({color:0x102a4b,metalness:.22,roughness:.31,clearcoat:.9,side:THREE.DoubleSide}),gold=new THREE.LineBasicMaterial({color:0xd9b076,transparent:true,opacity:.75});
const panels=[],R=2.55,TAU=Math.PI*2;
for(let sector=0;sector<6;sector++){const a=sector*TAU/6,pivot=new THREE.Group();for(let band=0;band<6;band++){const phi=.055+band*(Math.PI-.11)/6,delta=(Math.PI-.11)/6;const geo=new THREE.SphereGeometry(R,20,10,a+.009,TAU/6-.018,phi+.007,delta-.014);const m=new THREE.Mesh(geo,(band+sector)%4===0?navy:ivory);pivot.add(m);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geo,35),gold);pivot.add(edge)}assembly.add(pivot);panels.push({pivot,a})}
const inner=new THREE.Mesh(new THREE.IcosahedronGeometry(.75,2),new THREE.MeshPhysicalMaterial({color:0x0c2036,metalness:.5,roughness:.2,clearcoat:1}));assembly.add(inner);
const ring=new THREE.Mesh(new THREE.TorusGeometry(3.55,.017,8,180),new THREE.MeshBasicMaterial({color:0xf7bf76,transparent:true,opacity:.65}));ring.rotation.x=1.16;ring.position.y=1;scene.add(ring);
const aura=new THREE.PointLight(0xf5a859,85,13);aura.position.set(0,1,1);scene.add(aura);
let opened=false,amount=0,angleX=0,angleY=0,targetX=0,targetY=0,zoom=14,down=null,dragged=false,last=performance.now();
const setOpen=v=>{opened=v;menu.classList.toggle('open',v);menu.inert=!v;back.hidden=!v;enter.style.pointerEvents=v?'none':'auto';};
const resize=()=>{const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<700?61:48;camera.updateProjectionMatrix();zoom=w<700?17:14;};
addEventListener('resize',resize);resize();
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();const onBall=(x,y)=>{const rect=canvas.getBoundingClientRect();mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);return raycaster.intersectObjects(panels.flatMap(p=>p.pivot.children),false).length>0};
canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};dragged=false;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)+Math.abs(dy)>4)dragged=true;targetY+=dx*.005;targetX=Math.max(-.6,Math.min(.6,targetX+dy*.004));down={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointerup',e=>{if(!dragged&&onBall(e.clientX,e.clientY))setOpen(!opened);down=null});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(9,Math.min(21,zoom+e.deltaY*.008))},{passive:false});
enter.addEventListener('click',()=>setOpen(!opened));back.addEventListener('click',()=>setOpen(false));document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let raf=0,active=true;
function frame(t){if(!active)return;const dt=Math.min(.05,(t-last)/1000);last=t;amount+=(Number(opened)-amount)*Math.min(1,dt*(reduced?20:2.6));const v=amount*amount*(3-2*amount);
panels.forEach(({pivot,a},i)=>{pivot.position.set(Math.cos(a+.5)*v*1.75,Math.sin(a+.5)*v*1.55,Math.sin(a*2)*v*.9);pivot.rotation.set(Math.sin(a)*v*.25,Math.cos(a)*v*.22,(i%2?1:-1)*v*.16)});
if(!opened&&!reduced)targetY+=dt*.075;angleX+=(targetX-angleX)*Math.min(1,dt*2.6);angleY+=(targetY-angleY)*Math.min(1,dt*2.6);assembly.rotation.set(angleX,angleY,0);assembly.scale.setScalar(1-v*.13);
ring.rotation.z+=reduced?0:dt*.08;ring.material.opacity=.4+Math.sin(t*.0013)*.18;
const z=zoom+(opened?1.5:0);camera.position.z+=(z-camera.position.z)*Math.min(1,dt*2);camera.position.x+=(Math.sin(angleY*.14)*1.2-camera.position.x)*Math.min(1,dt*1.4);camera.lookAt(0,1,0);
renderer.render(scene,camera);raf=requestAnimationFrame(frame)}
document.addEventListener('visibilitychange',()=>{active=!document.hidden;if(active){last=performance.now();raf=requestAnimationFrame(frame)}else cancelAnimationFrame(raf)});raf=requestAnimationFrame(frame);
setTimeout(()=>loading.classList.add('done'),5000);
