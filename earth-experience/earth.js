/* APD Isola Earth Lab — original CesiumJS implementation.
   Real georeferenced OpenStreetMap building footprints, not invented houses.
   OSM footprints are extruded with approximate heights if missing.
   No Google Earth imagery or proprietary 3D assets are copied. */
(function(){
'use strict';
const status=document.getElementById('status'),btn=document.getElementById('apd'),nav=document.getElementById('sections');
if(!window.Cesium){status.textContent='Impossibile caricare il motore 3D';return;}
const C=window.Cesium;
const LAT=42.5035,LON=13.6574;
const view={destination:C.Cartesian3.fromDegrees(LON, LAT-0.008, 1350),orientation:{heading:C.Math.toRadians(0),pitch:C.Math.toRadians(-43),roll:0}};
let viewer;
try{
 const imagery=new C.OpenStreetMapImageryProvider({url:'https://tile.openstreetmap.org/'});
 viewer=new C.Viewer('map',{imageryProvider:imagery,baseLayerPicker:false,animation:false,timeline:false,homeButton:false,geocoder:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,shouldAnimate:false,skyBox:false,skyAtmosphere:false,terrainProvider:new C.EllipsoidTerrainProvider()});
}catch(err){status.textContent='Errore inizializzazione mappa 3D';console.error(err);return;}
viewer.scene.globe.enableLighting=false;
viewer.scene.globe.depthTestAgainstTerrain=false;
viewer.scene.backgroundColor=C.Color.fromCssColorString('#1d3242');
viewer.scene.screenSpaceCameraController.minimumZoomDistance=130;
viewer.scene.screenSpaceCameraController.maximumZoomDistance=4500;
viewer.scene.screenSpaceCameraController.enableLook=true;
viewer.scene.screenSpaceCameraController.enableTilt=true;
viewer.scene.screenSpaceCameraController.enableRotate=true;
viewer.camera.setView(view);
const reset=()=>viewer.camera.flyTo({...view,duration:1.5});
document.getElementById('reset').addEventListener('click',reset);
btn.addEventListener('click',()=>{const open=btn.getAttribute('aria-expanded')!=='true';btn.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);nav.inert=!open;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){btn.setAttribute('aria-expanded','false');nav.classList.remove('open');nav.inert=true;}});
let clamping=false;
viewer.camera.moveEnd.addEventListener(()=>{
 if(clamping)return;
 const pos=C.Cartographic.fromCartesian(viewer.camera.positionWC);if(!pos)return;
 const lat=C.Math.toDegrees(pos.latitude),lon=C.Math.toDegrees(pos.longitude);
 if(Math.abs(lat-LAT)>.019||Math.abs(lon-LON)>.026){clamping=true;viewer.camera.flyTo({destination:C.Cartesian3.fromDegrees(Math.max(LON-.023,Math.min(LON+.023,lon)),Math.max(LAT-.016,Math.min(LAT+.016,lat)),Math.max(160,Math.min(3200,pos.height))),duration:.6,complete:()=>{clamping=false},cancel:()=>{clamping=false}});}
});
const endpoints=['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter'];
const query='[out:json][timeout:25];(way["building"](42.498,13.649,42.509,13.666););out geom;';
const parseHeight=(tags,id)=>{let h=Number.parseFloat(tags.height);if(!Number.isFinite(h)||h<=0){const levels=Number.parseFloat(tags['building:levels']);h=Number.isFinite(levels)&&levels>0?levels*3:6+(id%4)*1.6;}return Math.max(2,Math.min(h,45));};
async function buildings(){
 status.textContent='RECUPERO DELLE SAGOME REALI DEGLI EDIFICI…';
 for(const endpoint of endpoints){try{
  const response=await fetch(endpoint+'?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const data=await response.json();let count=0;
  for(const way of data.elements||[]){
   if(!way.tags?.building||!Array.isArray(way.geometry)||way.geometry.length<4)continue;
   const positions=[];for(const p of way.geometry){positions.push(p.lon,p.lat);}
   const height=parseHeight(way.tags,Math.abs(way.id));
   viewer.entities.add({name:way.tags.name||'Edificio mappato',polygon:{hierarchy:C.Cartesian3.fromDegreesArray(positions),height:0,extrudedHeight:height,material:C.Color.fromCssColorString(count%5===0?'#e4d5c4':'#c9b7a4'),outline:true,outlineColor:C.Color.fromCssColorString('#806e5c'),shadows:C.ShadowMode.DISABLED}});
   count++;
  }
  if(count<10)throw new Error('Copertura cartografica insufficiente');
  status.textContent=count+' EDIFICI GEOGRAFICI REALI · ALTEZZE PARZIALMENTE STIMATE';
  return;
 }catch(err){console.warn('OSM request unavailable',err);}}
 status.textContent='EDIFICI NON DISPONIBILI · VISUALIZZAZIONE CARTOGRAFICA';
}
buildings();
})();