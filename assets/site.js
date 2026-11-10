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
    const data=await response.json();
    const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=value||"";return el;};
    const schedule=document.getElementById("scheduleList");
    if(Array.isArray(data.schedule)&&data.schedule.length){
      schedule.replaceChildren();
      data.schedule.forEach(s=>{const row=make("div","info-row");row.append(make("strong","",s.team),make("span","",s.days||"Giorni da confermare"),make("span","",s.time||"Orario da confermare"),make("span","",s.venue||"Palestra da confermare"));schedule.append(row);});
    }
    const renderCards=(id,items,empty)=>{const box=document.getElementById(id);if(!Array.isArray(items)||!items.length)return;box.replaceChildren();items.filter(i=>i&&i.title).slice(0,8).forEach(i=>{const item=make("div","");item.append(make("strong","",i.title),make("p","",i.description||i.date||""));box.append(item);});if(!box.children.length)box.textContent=empty;};
    renderCards("matches",data.matches,"Calendario in aggiornamento");
    renderCards("updates",data.news,"Notizie in aggiornamento");
    const basket=document.getElementById("basketSlots");if(basket&&Array.isArray(data.basketSlots)&&data.basketSlots.length){basket.replaceChildren();data.basketSlots.forEach(s=>{const row=make("div","info-row");row.append(make("strong","",s.day),make("span","",s.activity),make("span","",s.start+"–"+s.end),make("span","",s.type==="gare"?"Fascia gare, non gara confermata":s.type));basket.append(row);});document.getElementById("basketNote").textContent=[data.basketVenue,data.basketScheduleNote].filter(Boolean).join(" · ");}const docs=document.getElementById("documentsList");
    if(Array.isArray(data.documents)&&data.documents.length){
      docs.replaceChildren();
      data.documents.forEach(d=>{if(!d.title||!d.url)return;const url=String(d.url);if(!(/^https:\/\//.test(url)||/^\.\/documents\/[a-zA-Z0-9_.-]+\.pdf$/.test(url)))return;const row=make("div","resource");row.append(make("strong","",d.title));const a=make("a","","Scarica documento ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";row.append(a);docs.append(row);});
      if(!docs.children.length)docs.append(make("div","empty","Documenti in aggiornamento."));
    }
  }catch(err){console.warn("Contenuti non caricati:",err);}
}
loadClubContent();
