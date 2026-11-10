"use strict";
const menuBtn=document.getElementById("menuBtn"),nav=document.getElementById("navLinks");menuBtn.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuBtn.setAttribute("aria-expanded",String(open));});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menuBtn.setAttribute("aria-expanded","false");}));
document.querySelectorAll("[data-sport]").forEach(a=>a.addEventListener("click",()=>{document.getElementById("sportSelect").value=a.dataset.sport;}));
const search=document.getElementById("faqSearch"),faqs=[...document.querySelectorAll(".faq")];search.addEventListener("input",()=>{const q=search.value.toLocaleLowerCase("it").trim();let shown=0;faqs.forEach(el=>{const ok=el.textContent.toLocaleLowerCase("it").includes(q);el.hidden=!ok;if(ok)shown++;});document.getElementById("faqEmpty").hidden=shown>0;});
document.getElementById("contactForm").addEventListener("submit",e=>{e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;const d=new FormData(f);const subject="Richiesta APD Isola — "+d.get("sport");const body=["Nome: "+d.get("name"),"Email: "+d.get("email"),"Telefono: "+(d.get("phone")||"Non indicato"),"Interesse: "+d.get("sport"),"","Messaggio:",""+d.get("message")].join("\n");const link="mailto:apd.isolags@gmail.com?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);document.getElementById("mailHelp").textContent="Si sta aprendo il programma email. Ricorda di premere Invia; se non si apre, scrivi a apd.isolags@gmail.com.";window.location.href=link;});
document.getElementById("year").textContent=new Date().getFullYear();
if("IntersectionObserver"in window){const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");io.unobserve(e.target);}})},{threshold:.08});document.querySelectorAll(".reveal").forEach(e=>io.observe(e));}else document.querySelectorAll(".reveal").forEach(e=>e.classList.add("visible"));

async function loadClubContent(){
  try{
    const response=await fetch("./content/site.json",{cache:"no-store"});
    if(!response.ok)throw Error("Contenuti non disponibili");
    const data=await response.json();if(data.fees){const f=data.fees;if(Array.isArray(f.monthly)&&Array.isArray(f.quarterly)&&Array.isArray(f.fullNineMonths))feePrices={monthly:f.monthly,quarterly:f.quarterly,full:f.fullNineMonths};updateFee();}
    const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=value||"";return el;};
    const schedule=document.getElementById("scheduleList");
    if(Array.isArray(data.schedule)&&data.schedule.length){
      schedule.replaceChildren();
      data.schedule.forEach(s=>{const row=make("div","training-overview");row.dataset.team=s.team;const header=make("div","training-overview-head");header.append(make("strong","",s.team));const slugs={"Seconda Divisione":"seconda-divisione","Under 17":"under-17","Under 15":"under-15","Minivolley":"minivolley"};if(slugs[s.team]){const link=make("a","training-detail-link","Scheda squadra ↗");link.href="./squadre/"+slugs[s.team]+"/";header.append(link);}row.append(header);const grid=make("div","training-overview-grid");if(Array.isArray(s.sessions)&&s.sessions.length){s.sessions.forEach(session=>{const card=make("div","training-overview-slot");card.append(make("span","training-overview-day",session.day));card.append(make("strong","training-overview-time",session.start&&session.end?session.start+" – "+session.end:"Da confermare"));if(session.note)card.append(make("small","",session.note));grid.append(card);});}else grid.append(make("span","", "Orari da confermare"));row.append(grid);const venue=make("p","training-overview-venue","Palestra: "+(s.venue||"da confermare"));row.append(venue);schedule.append(row);});applyScheduleFilter();
    }
    const renderCards=(id,items,empty)=>{const box=document.getElementById(id);if(!Array.isArray(items)||!items.length)return;box.replaceChildren();items.filter(i=>i&&i.title).slice(0,8).forEach(i=>{const item=make("div","");item.append(make("strong","",i.title),make("p","",i.description||i.date||""));box.append(item);});if(!box.children.length)box.textContent=empty;};
    const matchHost=document.getElementById("matches");const categories=[["Seconda Divisione","seconda-divisione"],["Under 17","under-17"],["Under 15","under-15"]];const fixtures=Array.isArray(data.matches)?data.matches:[];const today=new Date().toLocaleDateString("sv-SE");const dateLabel=value=>/^\\d{4}-\\d{2}-\\d{2}$/.test(value||"")?new Date(value+"T12:00:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"}):value||"Data da confermare";matchHost.replaceChildren();categories.forEach(([team,slug])=>{const panel=make("article","match-category-panel");panel.append(make("span","match-category-kicker","CALENDARIO GARE"));panel.append(make("h3","match-category-title",team));const list=fixtures.filter(x=>x&&x.team===team&&x.date).sort((a,b)=>a.date.localeCompare(b.date));const future=list.filter(x=>x.date>=today);const past=list.filter(x=>x.date<today).reverse();const visible=[...future,...past].slice(0,4);if(!visible.length){panel.append(make("div","empty","Calendario in aggiornamento."));}visible.forEach(x=>{const card=make("div","match-fixture");const when=make("div","match-fixture-when");when.append(make("strong","",dateLabel(x.date)));when.append(make("span","",x.time?"Ore "+x.time:"Orario da confermare"));card.append(when);card.append(make("strong","match-fixture-teams",x.title||[x.home,x.away].filter(Boolean).join(" – ")));card.append(make("p","match-fixture-place",(x.home&&x.home.toUpperCase().includes("ISOLA VOLLEY")?"In casa":"In trasferta")+(x.city?" · "+x.city:"")));if(x.result)card.append(make("strong","match-fixture-result","Risultato: "+x.result));else if(x.date<today)card.append(make("small","match-fixture-past","Risultato non pubblicato"));panel.append(card);});const link=make("a","match-category-all","Tutte le partite "+team+" ↗");link.href="./squadre/"+slug+"/#partite";panel.append(link);matchHost.append(panel);});
    renderCards("updates",data.news,"Notizie in aggiornamento");
    const docs=document.getElementById("documentsList");
    if(Array.isArray(data.documents)&&data.documents.length){
      docs.replaceChildren();
      data.documents.forEach(d=>{if(!d.title||!d.url)return;const url=String(d.url);if(!(/^https:\/\//.test(url)||/^\.\/documents\/[a-zA-Z0-9_.-]+\.pdf$/.test(url)))return;const row=make("div","resource");row.append(make("strong","",d.title));const a=make("a","","Scarica documento ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";row.append(a);docs.append(row);});
      if(!docs.children.length)docs.append(make("div","empty","Documenti in aggiornamento."));
    }
  }catch(err){console.warn("Contenuti non caricati:",err);}
}
loadClubContent();


let feePrices={monthly:[45,80,105],quarterly:[120,210,270],full:[315,540,675]};
function updateFee(){const n=Number(document.getElementById("feeChildren").value),plan=document.getElementById("feePlan").value,amount=feePrices[plan][n-1],months={monthly:1,quarterly:3,full:9}[plan];document.getElementById("feeTotal").textContent=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(amount);document.getElementById("feeEquivalent").textContent=months===1?"Importo mensile complessivo per "+n+" "+(n===1?"figlio":"figli"):"Equivalente mensile complessivo: "+new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(amount/months)+" (totale formula diviso "+months+" mesi).";}
["feeChildren","feePlan"].forEach(id=>document.getElementById(id).addEventListener("change",updateFee));updateFee();

/* Sportello famiglie: navigazione assistita senza memorizzazione di dati personali */
const smartNeed=document.getElementById("smartNeed");
const smartTeam=document.getElementById("smartTeam");
const smartTeamBox=document.getElementById("smartTeamBox");
const smartFeedback=document.getElementById("smartFeedback");
function syncSmart(){smartTeamBox.hidden=smartNeed.value!=="join";smartFeedback.textContent=smartNeed.value==="join"?"La segreteria confermerà gruppo, disponibilità e modalità di iscrizione.":"Ti porteremo direttamente alla sezione richiesta.";}
smartNeed.addEventListener("change",syncSmart);syncSmart();
document.getElementById("smartGo").addEventListener("click",()=>{
  const need=smartNeed.value,team=smartTeam.value;
  if(need==="join"){
    const sport=document.getElementById("sportSelect");
    sport.value=team==="none"?"Informazioni generali":"Pallavolo – "+team;
    const message=document.querySelector('#contactForm textarea[name="message"]');
    if(!message.value.trim())message.value=team==="none"?"Vorrei informazioni sui gruppi di pallavolo disponibili e sulle modalità di iscrizione.":"Vorrei informazioni sul gruppo "+team+", sugli allenamenti e sulle modalità di iscrizione.";
    document.getElementById("contatti").scrollIntoView({behavior:"smooth"});
    smartFeedback.textContent="Richiesta preparata: completa i dati e invia l'email dalla sezione contatti.";
    return;
  }
  const targets={schedule:"orari",fees:"quote",docs:"documenti",contact:"contatti"};
  const target=document.getElementById(targets[need]);
  if(target)target.scrollIntoView({behavior:"smooth"});
});
function applyScheduleFilter(){const select=document.getElementById("scheduleFilter");if(!select)return;const value=select.value;document.querySelectorAll("#scheduleList [data-team]").forEach(row=>{row.hidden=value!=="all"&&row.dataset.team!==value;});}
document.getElementById("scheduleFilter").addEventListener("change",applyScheduleFilter);
