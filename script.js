const STORAGE_KEY = "decria-community-posts-v1";
const TEAM_KEY = "decria-demo-team-v1";
const SESSION_KEY = "decria-demo-session-v1";
const starterPosts = [
 {id:"starter-1",title:"Monochrome",category:"Wallpapers PC",format:"4K / Desktop",description:"Tons escuros e luzes neon para dar outra vibe ao seu setup.",image:"",download:"",date:"2026-10-09",palette:0},
 {id:"starter-2",title:"Black & White",category:"Wallpapers Mobile",format:"Mobile",description:"Um visual minimalista com cores suaves para a tela do celular.",image:"",download:"",date:"2026-10-08",palette:1},
 {id:"starter-3",title:"Design Resources",category:"Recursos",format:"Pack de recursos",description:"Inspiração para organizar seu próximo projeto criativo.",image:"",download:"",date:"2026-10-07",palette:2},
 {id:"starter-4",title:"Pure Contrast",category:"Design",format:"Outro",description:"Paleta natural e composição limpa para projetos digitais.",image:"",download:"",date:"2026-10-06",palette:3},
 {id:"starter-5",title:"White Noise",category:"Wallpapers Mobile",format:"Mobile",description:"Gradientes e tons vibrantes para personalizar seu aparelho.",image:"",download:"",date:"2026-10-05",palette:4},
 {id:"starter-6",title:"TXD Visuals",category:"Inspiração",format:"Full HD",description:"Referência visual para quem curte o lado experimental do design.",image:"",download:"",date:"2026-10-04",palette:5}
];
let posts = loadPosts();
let activeCategory = "Todos";
let toastTimer;
const postGrid = document.getElementById("postGrid");
const modal = document.getElementById("adminModal");
const form = document.getElementById("postForm");
const toast = document.getElementById("toast");
document.getElementById("year").textContent = new Date().getFullYear();

function loadPosts(){
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : starterPosts; }
  catch(e){ return starterPosts; }
}
function savePosts(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); } catch(e){ showToast("Não foi possível salvar neste navegador."); } }
function escapeHTML(value=""){ return String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function formatDate(date){ try { return new Date(date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}).replace(".",""); } catch(e){return date;} }
function artCover(post,index){
 const palette = Number.isInteger(post.palette) ? post.palette : index % 6;
 return `<div class="image-art palette-${palette}"><span class="art-index">DROP / ${String(index+1).padStart(2,"0")}</span><span class="art-word">${escapeHTML(post.title.split(/[ —-]/)[0].slice(0,18).toUpperCase())}</span></div>`;
}
function renderPosts(){
 const query = document.getElementById("searchInput").value.trim().toLowerCase();
 const sort = document.getElementById("sortSelect").value;
 let filtered = posts.filter(p=>(activeCategory==="Todos"||p.category===activeCategory) && (p.title+" "+p.description+" "+p.category).toLowerCase().includes(query));
 filtered.sort((a,b)=>sort==="newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
 document.getElementById("postCount").textContent=String(posts.length).padStart(2,"0");
 document.getElementById("emptyState").hidden=filtered.length!==0;
 postGrid.innerHTML=filtered.map((p)=>{
   const originalIndex=posts.findIndex(x=>x.id===p.id);
   const cover=p.image ? `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div style="display:none">${artCover(p,originalIndex)}</div>` : artCover(p,originalIndex);
   return `<article class="post-card"><div class="post-image">${cover}<span class="post-badge">${escapeHTML(p.format||"DROP")}</span></div><div class="post-body"><div class="post-meta"><span class="post-category">${escapeHTML(p.category)}</span><span>${formatDate(p.date)}</span></div><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description||"Uma nova publicação da comunidade DeCria.")}</p><div class="post-footer"><span class="format-tag">${escapeHTML(p.format||"Conteúdo criativo")}</span>${p.download?`<a class="download-link" href="${escapeHTML(p.download)}" target="_blank" rel="noopener noreferrer">Acessar / baixar ↗</a>`:`<span class="download-link disabled">Em breve</span>`}</div>${currentUser?`<div class="card-admin-actions">${["admin","editor","moderator"].includes(currentUser.role)?`<button class="mini-action" data-edit="${escapeHTML(p.id)}">Editar</button>`:""}${canDeletePosts()?`<button class="mini-action delete" data-delete="${escapeHTML(p.id)}">Excluir</button>`:""}</div>`:""}</div></article>`;
 }).join("");
}
function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2600);}
function openModal(){modal.hidden=false;document.body.style.overflow="hidden";}
function closeModal(){modal.hidden=true;document.body.style.overflow="";}
document.getElementById("openAdmin").addEventListener("click",()=>{if(!currentUser){showToast("Entre na conta para publicar.");return;}form.reset();delete form.dataset.editId;document.getElementById("modalTitle").innerHTML='Novo drop<span class="accent">.</span>';openModal();});
document.getElementById("bannerPublish").addEventListener("click",()=>document.getElementById("openAdmin").click());
document.getElementById("closeAdmin").addEventListener("click",closeModal);
document.getElementById("cancelAdmin").addEventListener("click",closeModal);
modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)closeModal();});
document.getElementById("searchInput").addEventListener("input",renderPosts);
document.getElementById("sortSelect").addEventListener("change",renderPosts);
document.getElementById("categoryList").addEventListener("click",e=>{
 const button=e.target.closest("[data-category]");if(!button)return;
 activeCategory=button.dataset.category;
 document.querySelectorAll(".category-chip").forEach(chip=>chip.classList.toggle("selected",chip===button));
 renderPosts();
});
postGrid.addEventListener("click",e=>{
 const del=e.target.closest("[data-delete]");
 const edit=e.target.closest("[data-edit]");
 if(del){
   if(!canDeletePosts()){showToast("Seu cargo não pode excluir posts.");return;}
   const post=posts.find(p=>p.id===del.dataset.delete);if(!post)return;
   if(confirm(`Excluir "${post.title}"?`)){posts=posts.filter(p=>p.id!==del.dataset.delete);savePosts();renderPosts();showToast("Drop excluído.");}
 }
 if(edit){
   if(!currentUser){showToast("Entre na conta para editar.");return;}
   const post=posts.find(p=>p.id===edit.dataset.edit);if(!post)return;
   form.elements.title.value=post.title;form.elements.category.value=post.category;form.elements.format.value=post.format||"Outro";
   form.elements.image.value=post.image||"";form.elements.description.value=post.description||"";form.elements.download.value=post.download||"";
   form.dataset.editId=post.id;document.getElementById("modalTitle").innerHTML='Editar drop<span class="accent">.</span>';openModal();
 }
});
form.addEventListener("submit",e=>{
 e.preventDefault();
 if(!currentUser){showToast("Entre na conta para publicar.");return;}
 if(form.dataset.editId&&!["admin","editor","moderator"].includes(currentUser.role)){showToast("Seu cargo não pode editar posts.");return;}
 const data=new FormData(form);
 const image=(data.get("image")||"").trim(), download=(data.get("download")||"").trim();
 const safeUrl=value=>{if(!value)return "";try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)?u.href:"";}catch(e){return "";}};
 const id=form.dataset.editId;
 const existing=id?posts.find(p=>p.id===id):null;
 const post={id:id||("post-"+Date.now()),title:data.get("title").trim(),category:data.get("category"),format:data.get("format"),image:safeUrl(image),description:data.get("description").trim(),download:safeUrl(download),date:existing?existing.date:new Date().toISOString().slice(0,10),palette:existing&&Number.isInteger(existing.palette)?existing.palette:Math.floor(Math.random()*6)};
 if(id){posts=posts.map(p=>p.id===id?post:p);showToast("Drop atualizado!");}
 else {posts.unshift(post);showToast("Drop publicado!");}
 savePosts();renderPosts();closeModal();form.reset();delete form.dataset.editId;
});
refreshAuthUI();