"use strict";
let state=null;
const $=id=>document.getElementById(id);
const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
function field(parent,label,value,onChange,multiline=false){const l=make("label");l.className="field";l.append(make("span",label));const el=make(multiline?"textarea":"input");el.value=value||"";el.addEventListener("input",()=>onChange(el.value));l.append(el);parent.append(l);}
function renderSchedule(){const host=$("schedule");host.replaceChildren();state.schedule.forEach(s=>{const item=make("div");item.className="item";item.append(make("strong",s.team));const row=make("div");row.className="row";field(row,"Giorni",s.days,v=>s.days=v);field(row,"Orario",s.time,v=>s.time=v);field(row,"Palestra",s.venue,v=>s.venue=v);item.append(row);host.append(item);});}
function renderItems(key,hostId,fields){const host=$(hostId);host.replaceChildren();state[key].forEach((item,index)=>{const section=make("div");section.className="item";const row=make("div");row.className="row";fields.forEach(([prop,label])=>field(row,label,item[prop],v=>item[prop]=v,prop==="description"));section.append(row);const remove=make("button","Rimuovi");remove.type="button";remove.className="secondary";remove.addEventListener("click",()=>{state[key].splice(index,1);renderItems(key,hostId,fields);});section.append(remove);host.append(section);});}
const configs={news:[["team","Squadra (es. Under 17; lascia vuoto per notizie generali)"],["title","Titolo"],["date","Data"],["description","Testo"]],documents:[["title","Titolo PDF"],["url","URL (./documents/nome.pdf)"]]};
const teams=["Seconda Divisione","Under 17","Under 15"];
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||"")&&!Number.isNaN(new Date(value+"T12:00:00").getTime());
const validTime=value=>!value||/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const validResult=value=>!value||/^[0-3]\s*[-–:]\s*[0-3]$/.test(value)&&(()=>{const n=value.split(/[-–:]/).map(x=>Number(x.trim()));return Math.max(...n)===3&&Math.min(...n)<3})();
function renderMatches(){
 const host=$("matches");host.replaceChildren();
 state.matches.forEach((item,index)=>{
  const section=make("div");section.className="item";
  const heading=make("strong",(item.id?"Gara #"+item.id+" · ":"")+(item.title||"Nuova partita"));section.append(heading);
  const row=make("div");row.className="row";
  const teamLabel=make("label");teamLabel.className="field";teamLabel.append(make("span","Categoria"));const teamSelect=make("select");
  for(const name of teams){const opt=make("option",name);opt.value=name;teamSelect.append(opt)}
  if(!teams.includes(item.team)){const opt=make("option",item.team||"Seleziona categoria");opt.value=item.team||"";teamSelect.prepend(opt)}
  teamSelect.value=item.team||"";teamSelect.addEventListener("change",()=>item.team=teamSelect.value);teamLabel.append(teamSelect);row.append(teamLabel);
  field(row,"Titolo incontro",item.title,v=>{item.title=v;heading.textContent=(item.id?"Gara #"+item.id+" · ":"")+v});
  field(row,"Data (AAAA-MM-GG)",item.date,v=>item.date=v);
  field(row,"Orario (HH:MM)",item.time,v=>item.time=v);
  field(row,"Squadra di casa",item.home,v=>item.home=v);
  field(row,"Squadra ospite",item.away,v=>item.away=v);
  field(row,"Palestra",item.venue,v=>item.venue=v);
  field(row,"Località",item.city,v=>item.city=v);
  field(row,"Risultato verificato (es. 3-1; lascia vuoto se non pubblicato)",item.result,v=>{if(v.trim())item.result=v.trim();else delete item.result});
  section.append(row);
  const remove=make("button","Rimuovi partita");remove.type="button";remove.className="secondary";remove.addEventListener("click",()=>{if(!window.confirm("Rimuovere questa partita dalla bozza?"))return;state.matches.splice(index,1);renderMatches()});section.append(remove);host.append(section);
 });
}

function render(){renderSchedule();Object.entries(configs).forEach(([key,fields])=>renderItems(key,key,fields));renderMatches();}
async function init(){try{const r=await fetch("../content/site.json",{cache:"no-store"});if(!r.ok)throw Error("Impossibile leggere il file");state=await r.json();for(const key of ["schedule","news","matches","documents"])if(!Array.isArray(state[key]))state[key]=[];render();$("status").textContent="Contenuti caricati. Puoi iniziare a modificarli.";}catch(e){$("status").textContent="Errore nel caricamento. Apri questa pagina dal sito pubblicato su GitHub Pages, non come file locale.";document.querySelectorAll("button").forEach(b=>b.disabled=true);}}
[["addNews","news"],["addMatch","matches"],["addDoc","documents"]].forEach(([id,key])=>$(id).addEventListener("click",()=>{state[key].push({});if(key==="matches")renderMatches();else renderItems(key,key,configs[key]);}));
$("download").addEventListener("click",()=>{if(!state)return;for(const d of state.documents){if(d.url&&!(/^https:\/\//.test(d.url)||/^\.\/documents\/[a-zA-Z0-9_.-]+\.pdf$/.test(d.url))){$("status").textContent="URL documento non valido: usa un indirizzo https:// oppure ./documents/nome.pdf";return;}}if(!validateContent())return;const blob=new Blob([JSON.stringify(state,null,2)+"\n"],{type:"application/json"});const url=URL.createObjectURL(blob);const a=make("a");a.href=url;a.download="site.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$("status").textContent="File scaricato. Per pubblicarlo devi ancora aggiornarlo su GitHub e confermare il commit.";});
init();
function checkContent(){
  const errors=[];
  if(!state||typeof state!=="object")return ["Nessun contenuto caricato."];
  for(const key of ["schedule","news","matches","documents"]){if(!Array.isArray(state[key]))errors.push("Il campo "+key+" deve essere un elenco.");}
  if(errors.length)return errors;
  const expected=["Seconda Divisione","Under 17","Under 15","Minivolley"];
  for(const team of expected)if(!state.schedule.some(s=>s.team===team))errors.push("Manca la squadra "+team+".");
  for(const [key,label] of [["news","Notizie"],["matches","Partite"]]){
    state[key].forEach((item,i)=>{if(!item.title||!item.title.trim())errors.push(label+" #"+(i+1)+": inserisci un titolo.");});
  }
  const ids=new Set();
  state.matches.forEach((m,i)=>{
    const label="Partita #"+(i+1)+": ";
    if(!teams.includes(m.team))errors.push(label+"seleziona una categoria valida.");
    if(!validDate(m.date))errors.push(label+"data non valida, usa AAAA-MM-GG.");
    if(!validTime(m.time))errors.push(label+"orario non valido, usa HH:MM.");
    if(!validResult(m.result))errors.push(label+"risultato non valido; usa 3-0, 3-1, 3-2 o il risultato inverso.");
    if(m.id){const id=String(m.id);if(ids.has(id))errors.push(label+"ID gara duplicato ("+id+").");ids.add(id)}
  });
  state.documents.forEach((d,i)=>{
    if(!d.title||!d.title.trim())errors.push("Documento #"+(i+1)+": manca il titolo.");
    if(!d.url||!(/^https:\/\//.test(d.url)||/^\.\/documents\/[a-zA-Z0-9_.-]+\.pdf$/.test(d.url)))errors.push("Documento #"+(i+1)+": URL non valido. Usa https:// o ./documents/nome.pdf");
  });
  return errors;
}
function validateContent(){
  const errors=checkContent(),node=$("validation");
  node.classList.toggle("error",errors.length>0);
  node.textContent=errors.length?"Correggi questi problemi prima di pubblicare:\n• "+errors.join("\n• "):"Controllo superato. Ricorda di verificare anche date, orari e risultati con la segreteria.";
  return !errors.length;
}
function updatePreview(){if(!state)return;$("preview").textContent=JSON.stringify(state,null,2);}
$("validate").addEventListener("click",()=>{validateContent();updatePreview();});
$("copyJson").addEventListener("click",async()=>{
  if(!validateContent())return;
  const value=JSON.stringify(state,null,2)+"\n";
  try{await navigator.clipboard.writeText(value);$("status").textContent="JSON copiato. Apri GitHub, sostituisci il contenuto del file e conferma il commit per pubblicare.";}
  catch(e){$("status").textContent="Copia automatica non disponibile. Usa Scarica site.json oppure copia il testo nell'anteprima.";updatePreview();}
});
$("importJson").addEventListener("change",async e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  if(file.size>1024*1024){$("status").textContent="File troppo grande (massimo 1 MB).";return;}
  try{
    const candidate=JSON.parse(await file.text());
    if(!candidate||typeof candidate!=="object"||Array.isArray(candidate))throw Error("Formato non valido");
    for(const key of ["schedule","news","matches","documents"])if(!Array.isArray(candidate[key]))throw Error("Manca l'elenco "+key);
    state=candidate;render();validateContent();updatePreview();$("status").textContent="Bozza importata localmente: non è ancora pubblicata.";
  }catch(err){$("status").textContent="Importazione non riuscita: "+err.message;}
  e.target.value="";
});
