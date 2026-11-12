
document.getElementById("year").textContent=new Date().getFullYear();
const menuBtn=document.getElementById("menuBtn"),nav=document.getElementById("navLinks");
menuBtn.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuBtn.setAttribute("aria-expanded",String(open))});
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menuBtn.setAttribute("aria-expanded","false")}));
// Keep the compact mobile menu dismissible without changing the desktop icon rail.
const closeMobileNav=()=>{nav.classList.remove("open");menuBtn.setAttribute("aria-expanded","false")};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("open")){closeMobileNav();menuBtn.focus()}});
document.addEventListener("click",e=>{if(nav.classList.contains("open")&&!nav.contains(e.target)&&!menuBtn.contains(e.target))closeMobileNav()});
window.addEventListener("resize",()=>{if(window.innerWidth>760)closeMobileNav()});
fetch("./content/site.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Dati non disponibili");return r.json()}).then(data=>{
 const today=new Date().toLocaleDateString("sv-SE");
 const matches=Array.isArray(data.matches)?data.matches.filter(m=>m&&/^\d{4}-\d{2}-\d{2}$/.test(m.date||"")):[];
 const future=matches.filter(m=>m.date>=today).sort((a,b)=>(a.date+" "+(a.time||"")).localeCompare(b.date+" "+(b.time||"")));
 const news=Array.isArray(data.news)?data.news.filter(n=>n&&n.title).sort((a,b)=>(b.date||"").localeCompare(a.date||"")):[];
 const flashText=document.getElementById("heroFlashText"),flashLink=document.getElementById("heroFlashLink");
 const latest=document.getElementById("homeNewsLatest");
 if(news.length){
  const item=news[0];latest.replaceChildren();
  const tag=document.createElement("span");tag.className="eyebrow";tag.textContent="Ultima comunicazione";
  const h=document.createElement("h3");h.textContent=item.title;
  const p=document.createElement("p");p.textContent=item.description||"Leggi le ultime comunicazioni della Polisportiva.";
  const a=document.createElement("a");a.href="./news/";a.textContent="Tutte le news ↗";
  latest.append(tag,h,p,a);flashText.textContent=item.title;flashLink.href="./news/";
 }else if(future.length){
  const m=future[0],date=new Date(m.date+"T12:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"long"});
  flashText.textContent="Prossima gara · "+m.team+" · "+date+(m.time?" ore "+m.time:"");flashLink.href="./pallavolo/";
 }
 const root=document.getElementById("homeCalendars");root.replaceChildren();
 for(const team of ["Seconda Divisione","Under 17","Under 15"]){
  const m=future.find(x=>x.team===team),card=document.createElement("article");card.className="home-calendar-card";
  const h=document.createElement("h3");h.textContent=team;card.append(h);
  if(m){
   const date=document.createElement("p");date.className="home-calendar-date";date.textContent=new Date(m.date+"T12:00:00").toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"long"});
   const title=document.createElement("p");title.className="home-calendar-match";title.textContent=m.title||[m.home,m.away].filter(Boolean).join(" – ");
   const meta=document.createElement("p");meta.className="home-calendar-meta";meta.textContent=(m.time?"Ore "+m.time:"Orario da confermare")+(m.city?" · "+m.city:"");
   card.append(date,title,meta);
  }else{const p=document.createElement("p");p.className="home-calendar-meta";p.textContent="Prossima data da confermare";card.append(p)}
const gid=({"Seconda Divisione":"64638","Under 17":"64455","Under 15":"64371"})[team];const links=document.createElement("div");links.className="home-fipav-links";for(const [label,suffix] of [["Risultati FIPAV ↗",""],["Classifica FIPAV ↗","/classifica"]]){const link=document.createElement("a");link.href="https://public.fipavonline.it/gironi/"+gid+suffix;link.target="_blank";link.rel="noopener noreferrer";link.textContent=label;links.append(link)}card.append(links);root.append(card)
 }
}).catch(()=>{const root=document.getElementById("homeCalendars");root.querySelectorAll("p").forEach(p=>p.textContent="Calendario temporaneamente non disponibile")});

