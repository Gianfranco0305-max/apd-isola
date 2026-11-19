import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const canvas=document.getElementById('worldCanvas'),loading=document.getElementById('loading'),menu=document.getElementById('worldMenu'),back=document.getElementById('back'),enter=document.getElementById('enter'),fallback=document.getElementById('fallback');
let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){loading.remove();fallback.hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;renderer.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x71889d);scene.fog=new THREE.FogExp2(0x72869b,.003);
const camera=new THREE.PerspectiveCamera(48,1,.1,250);camera.position.set(0,2.5,14);camera.lookAt(0,1,0);
const hemi=new THREE.HemisphereLight(0xe5f2ff,0x1a2432,2.2);scene.add(hemi);const sun=new THREE.DirectionalLight(0xffd4a2,3.4);sun.position.set(-9,17,-12);scene.add(sun);const key=new THREE.PointLight(0xffb861,90,35);key.position.set(3,6,6);scene.add(key);
const panorama=new THREE.TextureLoader().load('../assets/38DE58D1-6DEC-4EFF-9882-09D9C83B0A3E.jpg',()=>{loading.classList.add('done');setTimeout(()=>loading.remove(),900)},undefined,()=>loading.classList.add('done'));panorama.colorSpace=THREE.SRGBColorSpace;
const sky=new THREE.Mesh(new THREE.SphereGeometry(110,64,32),new THREE.MeshBasicMaterial({map:panorama,side:THREE.BackSide,depthWrite:false}));sky.rotation.y=Math.PI*.05;scene.add(sky);
const groundGeo=new THREE.PlaneGeometry(210,210,100,100);groundGeo.rotateX(-Math.PI/2);const pos=groundGeo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);const d=Math.hypot(x,z);const h=Math.sin(x*.21)*Math.cos(z*.18)*.55+Math.sin(x*.055+z*.075)*1.5+Math.max(0,(d-12)*.038)*Math.sin(x*.11);pos.setY(i,h-5)}groundGeo.computeVertexNormals();const ground=new THREE.Mesh(groundGeo,new THREE.MeshStandardMaterial({color:0x34485a,roughness:1,flatShading:true}));ground.position.y=-17;scene.add(ground);
// Geographic town layer: OpenStreetMap geometry, centered on Isola del Gran Sasso.
// OSM buildings and roads are real mapped footprints; heights are estimated where absent.
// If OSM is unreachable, the world remains usable with a clearly non-geographic fallback.
const town=new THREE.Group();town.position.set(0,-2.0,-8.2);scene.add(town);const townPlinth=new THREE.Mesh(new THREE.BoxGeometry(32,.2,21),new THREE.MeshStandardMaterial({color:0x4c5d61,roughness:1}));townPlinth.position.set(0,-2.92,-11);scene.add(townPlinth);
const townMat=new THREE.MeshStandardMaterial({color:0xc7b5a2,roughness:.93,flatShading:true});
const townMat2=new THREE.MeshStandardMaterial({color:0xe0cdb4,roughness:.94,flatShading:true});
const roofMat=new THREE.MeshStandardMaterial({color:0x935a45,roughness:.91});
const streetMat=new THREE.LineBasicMaterial({color:0xd8c7b2,transparent:true,opacity:.62});
const coordsCenter={lat:42.5035,lon:13.6574}, metersPerLat=111195,metersPerLon=111195*Math.cos(coordsCenter.lat*Math.PI/180);
const townScale=.028; // approx 1 world unit per 26 m
const project=(lon,lat)=>new THREE.Vector2((lon-coordsCenter.lon)*metersPerLon*townScale,(lat-coordsCenter.lat)*metersPerLat*townScale);
const shapeArea=points=>{let a=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];a+=p.x*q.y-q.x*p.y}return Math.abs(a)/2};
const addBuilding=(points,height,index)=>{if(points.length<3||shapeArea(points)<.001)return;
 const shape=new THREE.Shape();shape.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)shape.lineTo(points[i].x,points[i].y);shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1});
 // Map XY footprint to horizontal XZ and extrude upward.
 geo.rotateX(Math.PI/2);
 const mesh=new THREE.Mesh(geo,index%3?townMat:townMat2);town.add(mesh);
 const roof=new THREE.Mesh(new THREE.ShapeGeometry(shape),roofMat);roof.rotation.x=Math.PI/2;roof.position.y=height+.012;town.add(roof);
};
const addRoad=points=>{if(points.length<2)return;const vertices=[];for(const p of points)vertices.push(p.x,.025,-p.y);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));town.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p.x,.04,p.y))),streetMat))};
let osmBuildings=0,osmRoads=0;
const osmStatus=document.createElement('div');osmStatus.id='geoStatus';osmStatus.setAttribute('aria-live','polite');osmStatus.textContent='RICOSTRUZIONE GEOGRAFICA IN CARICAMENTO';document.getElementById('world').appendChild(osmStatus);
async function loadTown(){
 const query='[out:json][timeout:20];(way["building"](42.4980,13.6490,42.5090,13.6660);way["highway"](42.4980,13.6490,42.5090,13.6660););out geom;';
 const endpoints=['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter'];
 for(const endpoint of endpoints){try{
  const response=await fetch(endpoint+'?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(13000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();if(!Array.isArray(data.elements))throw Error('Invalid map data');
  for(const e of data.elements){if(!e.geometry?.length)continue;
   const pts=e.geometry.map(p=>project(p.lon,p.lat));
   if(e.tags?.building){const h=Math.max(.12,Math.min(1.3,parseFloat(e.tags.height)*townScale||parseFloat(e.tags['building:levels'])*.12||.25+(osmBuildings%4)*.07));addBuilding(pts,h,osmBuildings++);}
   else if(e.tags?.highway){addRoad(pts);osmRoads++;}
  }
  if(osmBuildings<10)throw Error('Insufficient mapped buildings');
  visibleVillage.visible=false;villageLabel.textContent='EDIFICI E STRADE OPENSTREETMAP · ALTEZZE STIMATE';osmStatus.textContent='GEOMETRIA CARTOGRAFICA CARICATA';
  return;
 }catch(e){/* retry next free OSM endpoint */}}
 osmStatus.textContent='ANTEPRIMA ARTISTICA · DATI GEOGRAFICI NON DISPONIBILI';
 // Deterministic abstract fallback, never presented as an exact town map.
 for(let i=0;i<135;i++){const angle=i*2.39996,r=Math.sqrt(i)*.54;const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
  const w=.13+(i%5)*.035,d=.14+(i%4)*.04;
  addBuilding([new THREE.Vector2(x-w,z-d),new THREE.Vector2(x+w,z-d),new THREE.Vector2(x+w,z+d),new THREE.Vector2(x-w,z+d)],.2+(i%5)*.06,i);
 }
}
loadTown();


// V4: immediately visible illustrative streetscape, independent of remote APIs.
// These buildings are an artistic placeholder, NOT a geographic reconstruction.
const visibleVillage=new THREE.Group();visibleVillage.position.set(0,-2.1,-8.2);scene.add(visibleVillage);
const wallColors=[0xd5c0a4,0xe2cdb0,0xbca58e,0xede0c6],roofs=[0x874b37,0xa86243,0x68463e];
for(let i=0;i<108;i++){
 const row=Math.floor(i/18),col=i%18;
 const x=(col-8.5)*.78+(row%2)*.22,z=(row-2.5)*1.03;
 if(Math.abs(x)<2.7&&row<4)continue;
 const w=.36+(i%3)*.09,d=.43+(i%4)*.065,ht=.55+(i%7)*.14;
 const wall=new THREE.Mesh(new THREE.BoxGeometry(w,ht,d),new THREE.MeshStandardMaterial({color:wallColors[i%4],roughness:.95}));
 wall.position.set(x,ht/2,z);visibleVillage.add(wall);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.78,.30,4),new THREE.MeshStandardMaterial({color:roofs[i%3],roughness:.9}));
 roof.rotation.y=Math.PI/4;roof.position.set(x,ht+.14,z);visibleVillage.add(roof);
}
const villageBase=new THREE.Mesh(new THREE.BoxGeometry(17,.12,8),new THREE.MeshStandardMaterial({color:0x6e776f,roughness:1}));villageBase.position.set(0,-.12,0);visibleVillage.add(villageBase);
const villageLabel=document.createElement('div');villageLabel.id='villageDisclaimer';villageLabel.textContent='ANTEPRIMA 3D ARTISTICA · EDIFICI REALI IN ELABORAZIONE';document.getElementById('world').appendChild(villageLabel);

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
const z=zoom+(opened?1.5:0);camera.position.z+=(z-camera.position.z)*Math.min(1,dt*2);camera.position.x+=(Math.sin(angleY*.32)*2.6-camera.position.x)*Math.min(1,dt*1.4);camera.position.y+=(2.5+Math.sin(angleX)*1.5-camera.position.y)*Math.min(1,dt*1.4);camera.lookAt(0,1,0);
renderer.render(scene,camera);raf=requestAnimationFrame(frame)}
document.addEventListener('visibilitychange',()=>{active=!document.hidden;if(active){last=performance.now();raf=requestAnimationFrame(frame)}else cancelAnimationFrame(raf)});raf=requestAnimationFrame(frame);
setTimeout(()=>loading.classList.add('done'),5000);
