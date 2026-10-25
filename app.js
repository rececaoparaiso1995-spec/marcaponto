const API='https://ponto-api.rececaoparaiso1995.workers.dev';
const $=document.getElementById('app');
const h=(t,p={},...k)=>{const e=document.createElement(t);for(const[a,v]of Object.entries(p))a.startsWith('on')?e.addEventListener(a.slice(2),v):e.setAttribute(a,v);e.append(...k.flat().filter(x=>x!=null&&x!==false));return e};
const btn=(t,f)=>h('button',{onclick:async()=>{try{await f()}catch(x){alert(x.message)}}},t);
const show=(...k)=>$.replaceChildren(...k);
const hm=t=>new Date(t).toLocaleTimeString('pt-PT',{timeZone:'Europe/Lisbon',hour:'2-digit',minute:'2-digit'});
let tok=sessionStorage.getItem('t'),me=null;
async function api(p,body,raw){const fd=body instanceof FormData;
 const r=await fetch(`${API}/api/${p}`,{method:body?'POST':'GET',headers:{...(tok&&{Authorization:'Bearer '+tok}),...(body&&!fd&&{'Content-Type':'application/json'})},body:body?(fd?body:JSON.stringify(body)):undefined});
 if(r.status===401&&tok){out();throw Error('Sessão expirada')}
 if(raw&&r.ok)return r.blob();const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.e||'Erro');return d}
function out(){sessionStorage.removeItem('t');tok=me=null;login()}
const head=()=>h('div',{class:'top'},h('b',{},me.name),btn('Sair',async()=>{await api('logout',{}).catch(()=>{});out()}));
function login(){const u=h('input',{placeholder:'Utilizador',autocomplete:'username',required:'',maxlength:40}),p=h('input',{type:'password',placeholder:'Password',autocomplete:'current-password',required:'',maxlength:200});
 show(h('h2',{},'Marcar Ponto'),h('form',{onsubmit:async e=>{e.preventDefault();try{const d=await api('login',{username:u.value,password:p.value});tok=d.token;sessionStorage.setItem('t',tok);me=d.user;me.role==='admin'?admin():user()}catch(x){alert(x.message)}}},u,p,h('button',{},'Entrar')))}
function activate(t){const p=h('input',{type:'password',placeholder:'Nova password (mín. 10)',minlength:10,maxlength:200,required:'',autocomplete:'new-password'}),p2=h('input',{type:'password',placeholder:'Repetir',required:'',autocomplete:'new-password'});
 show(h('h2',{},'Definir password'),h('form',{onsubmit:async e=>{e.preventDefault();if(p.value!==p2.value)return alert('Passwords diferentes');try{await api('activate',{token:t,password:p.value});alert('Password definida. Faça login.');login()}catch(x){alert(x.message)}}},p,p2,h('button',{},'Guardar')))}
async function shrink(f){const b=await createImageBitmap(f),s=Math.min(1,1280/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=b.width*s;c.height=b.height*s;c.getContext('2d').drawImage(b,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,'image/jpeg',.6))}
function cal(uid,adm){const box=h('div'),td=new Date().toLocaleDateString('sv-SE');let m=td.slice(0,7);
 const go=n=>{const[y,mo]=m.split('-').map(Number),d=new Date(y,mo-1+n,1);m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');box.load()};
 const just=ds=>{const i=h('input',{type:'file',accept:'image/*',onchange:async()=>{try{const f=i.files[0];if(!f)return;const fd=new FormData();fd.append('day',ds);fd.append('file',await shrink(f),'j.jpg');await api('justify',fd);box.load()}catch(x){alert(x.message)}}});i.click()};
 const photo=async id=>{const u=URL.createObjectURL(await api('justif/'+id,null,true));document.body.append(h('img',{class:'ph',src:u,onclick:e=>{e.target.remove();URL.revokeObjectURL(u)}}))};
const edit=async(ds,p)=>{const cur=[];for(let i=0;i<p.length;i+=2)cur.push(hm(p[i].ts)+'-'+(p[i+1]?hm(p[i+1].ts):''));
  const v=prompt(`Marcações de ${ds}: entrada-saída (ex: 09:00-13:00 14:00-18:00). Vazio apaga tudo.`,cur.join(' '));if(v===null)return;
  const list=[];for(const pr of v.trim().split(/\s+/).filter(Boolean)){const[e,x]=pr.split('-');list.push({kind:'in',time:e});if(x)list.push({kind:'out',time:x})}
  await api('punches/'+uid,{day:ds,p:list});box.load()};
 box.load=async()=>{try{const d=await api(`month/${uid}?m=${m}`),[y,mo]=m.split('-').map(Number),n=new Date(y,mo,0).getDate(),f=(new Date(y,mo-1,1).getDay()+6)%7;
  const g=h('div',{class:'g'},...'Seg Ter Qua Qui Sex Sáb Dom'.split(' ').map(x=>h('b',{},x)),...Array(f).fill(0).map(()=>h('i')));
  for(let i=1;i<=n;i++){const ds=`${m}-${String(i).padStart(2,'0')}`,s=d.s[ds],p=d.p.filter(x=>x.day===ds),j=d.j[ds],miss=s&&s.type==='T'&&ds<td&&!p.length;
   g.append(h('div',{class:'d '+(miss?(j?'J':'X'):s?s.type:'')+(ds===td?' now':'')},h('b',{},i),
    s&&h('small',{},s.type==='T'?(s.start||'')+'-'+(s.end||''):s.type==='F'?'Folga':'Férias'),
    ...p.map(x=>h('small',{},(x.kind==='in'?'E ':'S ')+hm(x.ts))),adm&&btn('✎',()=>edit(ds,p)),
    miss&&(j?(adm?btn('Ver foto',()=>photo(j)):h('small',{},'Justificada')):(adm?h('small',{},'Falta'):btn('Justificar',()=>just(ds))))))}
  box.replaceChildren(h('div',{class:'nav'},btn('◀',()=>go(-1)),h('b',{},m),btn('▶',()=>go(1))),g)}catch(x){alert(x.message)}};
 box.load();return box}
function user(){const st=h('p'),b=h('button',{class:'big',onclick:async()=>{try{await api('punch',{kind:b.dataset.k});await t();c.load()}catch(x){alert(x.message)}}}),c=cal(me.id,false);
 async function t(){const d=await api('today'),l=d.p.at(-1),k=l&&l.kind==='in'?'out':'in';b.dataset.k=k;b.textContent=k==='in'?'Marcar ENTRADA':'Marcar SAÍDA';st.textContent=d.p.map(x=>(x.kind==='in'?'E ':'S ')+hm(x.ts)).join(' · ')||'Sem marcações hoje'}
 show(head(),h('p',{},b),st,c);t().catch(()=>{})}
function admin(){const list=h('div'),det=h('div'),link=t=>prompt('Envie este link ao utilizador (válido 48h):',location.origin+location.pathname+'#invite='+t);
 async function ref(){const d=await api('users');list.replaceChildren(h('table',{},...d.users.map(u=>h('tr',{},h('td',{},`${u.name} (${u.username})`+(u.role==='admin'?' ★':'')+(u.pending?' [pendente]':'')+(u.active?'':' [inativo]')),
  h('td',{},btn('Ver',()=>sel(u)),u.role==='user'&&btn('Convite/Repor',async()=>link((await api(`users/${u.id}/invite`,{})).token)),u.role==='user'&&btn(u.active?'Desativar':'Ativar',async()=>{await api(`users/${u.id}/active`,{active:u.active?0:1});ref()}))))))}
 function sel(u){const f=h('input',{type:'file',accept:'.csv,.txt'}),a=h('input',{type:'date'}),z=h('input',{type:'date'});
  det.replaceChildren(h('h3',{},u.name),cal(u.id,true),
   h('p',{},h('b',{},'Horário (CSV: data,tipo,inicio,fim — tipo T/F/V): '),f,btn('Enviar',async()=>{if(!f.files[0]||f.files[0].size>2e5)throw Error('Ficheiro inválido');
    const L=(await f.files[0].text()).replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim()),rows=L.map(l=>l.split(/[;,\t]/).map(x=>x.trim())).map(r=>{const m=r[0].match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)r[0]=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;return r}).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r[0])).map(([day,type,start,end])=>({day,type:(type||'').toUpperCase(),start:start||null,end:end||null}));
    if(!rows.length)throw Error('Nenhuma linha válida no ficheiro');for(let i=0;i<rows.length;i+=400)await api('schedule/'+u.id,{rows:rows.slice(i,i+400)});alert(rows.length+' de '+L.length+' linhas gravadas');sel(u)})),
   h('p',{},h('b',{},'Férias: '),a,z,btn('Marcar',async()=>{const d=await api('vacation/'+u.id,{from:a.value,to:z.value});alert(d.n+' dias de férias');sel(u)})))}
 const nm=h('input',{placeholder:'Nome',maxlength:60}),un=h('input',{placeholder:'utilizador',maxlength:30});
 show(head(),h('h3',{},'Novo utilizador'),h('div',{},nm,un,btn('Criar',async()=>{const d=await api('users',{name:nm.value,username:un.value});nm.value=un.value='';link(d.token);ref()})),list,det);ref().catch(x=>alert(x.message))}
(async()=>{const m=location.hash.match(/^#invite=([\w-]{20,})$/);if(m){history.replaceState(null,'',location.pathname);return activate(m[1])}
 if(tok)try{me=await api('me');return me.role==='admin'?admin():user()}catch{}login()})();
