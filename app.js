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
const head=()=>h('div',{class:'top'},h('b',{},me.name),h('span',{},btn('Mudar password',()=>pw(me.role==='admin'?admin:user)),btn('Sair',async()=>{await api('logout',{}).catch(()=>{});out()})));
function pw(back){const o=h('input',{type:'password',placeholder:'Password atual',autocomplete:'current-password',required:''}),n=h('input',{type:'password',placeholder:'Nova (mín. 10)',minlength:10,maxlength:200,required:'',autocomplete:'new-password'}),n2=h('input',{type:'password',placeholder:'Repetir nova',required:'',autocomplete:'new-password'});
 show(head(),h('h3',{},'Mudar password'),h('form',{onsubmit:async e=>{e.preventDefault();if(n.value!==n2.value)return alert('Passwords diferentes');try{await api('password',{old:o.value,new:n.value});alert('Password alterada');back()}catch(x){alert(x.message)}}},o,n,n2,h('button',{},'Guardar')),btn('Voltar',back))}
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
function dcal(id,name){const box=h('div'),td=new Date().toLocaleDateString('sv-SE');let m=td.slice(0,7);
 const go=n=>{const[y,mo]=m.split('-').map(Number),d=new Date(y,mo-1+n,1);m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');box.load()};
 box.load=async()=>{try{const d=await api(`deptmonth/${id}?m=${m}`),by={};d.r.forEach(x=>(by[x.day]=by[x.day]||[]).push(x));const[y,mo]=m.split('-').map(Number),n=new Date(y,mo,0).getDate(),f=(new Date(y,mo-1,1).getDay()+6)%7;
  const g=h('div',{class:'g w'},...'Seg Ter Qua Qui Sex Sáb Dom'.split(' ').map(x=>h('b',{},x)),...Array(f).fill(0).map(()=>h('i')));
  for(let i=1;i<=n;i++){const ds=`${m}-${String(i).padStart(2,'0')}`,L=by[ds]||[];g.append(h('div',{class:'d dd'+(ds===td?' now':'')},h('b',{},i),...L.filter(x=>x.type==='T').map(x=>h('small',{class:'T'},`${x.name} ${x.start||''}-${x.end||''}`)),...L.filter(x=>x.type==='V').map(x=>h('small',{class:'V'},`Férias: ${x.name}`))))}
  box.replaceChildren(h('h3',{},name),h('div',{class:'nav'},btn('◀',()=>go(-1)),h('b',{},m),btn('▶',()=>go(1))),h('div',{style:'overflow-x:auto'},g))}catch(x){alert(x.message)}};
 box.load();return box}
function certs(uid,adm){const box=h('div'),t=h('input',{placeholder:'Título (ex: Formação HACCP)',maxlength:80}),f=h('input',{type:'file',accept:'image/*,application/pdf'});
 const open=async x=>{const u=URL.createObjectURL(await api('cert/'+x.id,null,true));if(x.mime==='application/pdf'){const a=h('a',{href:u,download:'certificado.pdf'});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),9e3)}else document.body.append(h('img',{class:'ph',src:u,onclick:e=>{e.target.remove();URL.revokeObjectURL(u)}}))};
 const ld=async()=>{const d=await api('certs/'+uid);box.replaceChildren(h('h3',{},'Certificados de formação'),...d.r.map(x=>h('div',{},new Date(x.ts).toLocaleDateString('pt-PT')+' · '+x.title+' ',btn('Abrir',()=>open(x)),btn('Apagar',async()=>{if(confirm('Apagar?')){await api(`cert/${x.id}/del`,{});ld()}}))),...(adm?[]:[h('p',{},t,f,btn('Enviar',async()=>{const file=f.files[0];if(!file||!t.value.trim())throw Error('Indique título e ficheiro');
  let bl=file;if(file.type==='application/pdf'){if(file.size>5e5)throw Error('PDF até 500KB')}else bl=await shrink(file);
  const fd=new FormData();fd.append('title',t.value);fd.append('file',bl,file.type==='application/pdf'?'c.pdf':'c.jpg');await api('certs',fd);t.value='';f.value='';ld()}))]))};
 ld().catch(x=>alert(x.message));return box}
const pos=()=>new Promise((ok,no)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>ok(p.coords),()=>no(Error('Ative a localização no telemóvel/browser para marcar ponto')),{enableHighAccuracy:true,timeout:15000,maximumAge:0}):no(Error('Localização indisponível')));
function user(){const st=h('p'),b=h('button',{class:'big',onclick:async()=>{try{const g=await pos();await api('punch',{kind:b.dataset.k,lat:g.latitude,lng:g.longitude,acc:g.accuracy});await t();c.load()}catch(x){alert(x.message)}}}),c=cal(me.id,false);
 async function t(){const d=await api('today'),l=d.p.at(-1),k=l&&l.kind==='in'?'out':'in';b.dataset.k=k;b.textContent=k==='in'?'Marcar ENTRADA':'Marcar SAÍDA';st.textContent=d.p.map(x=>(x.kind==='in'?'E ':'S ')+hm(x.ts)).join(' · ')||'Sem marcações hoje'}
 const vr=h('div'),a=h('input',{type:'date'}),z=h('input',{type:'date'});
 async function lv(){const d=await api('vr');vr.replaceChildren(...d.r.map(x=>h('div',{},`${x.d1} → ${x.d2}: ${{pend:'pendente',ok:'aprovado',no:'recusado',can:'cancelado'}[x.st]} `,x.st==='pend'&&btn('Cancelar',async()=>{await api(`vr/${x.id}/cancel`,{});lv()}))))}
 show(head(),h('p',{},b),st,c,h('h3',{},'Pedir férias'),h('p',{},a,z,btn('Pedir',async()=>{await api('vr',{from:a.value,to:z.value});lv()})),vr,certs(me.id,false));t().catch(()=>{});lv().catch(()=>{})}
function admin(){const list=h('div'),det=h('div'),link=t=>prompt('Envie este link ao utilizador (válido 48h):',location.origin+location.pathname+'#invite='+t);
const pr=h('div');async function lp(){const d=await api('vr/all');pr.replaceChildren(h('h3',{},`Pedidos de férias (${d.r.length})`),...d.r.map(x=>h('div',{},`${x.name}: ${x.d1} → ${x.d2} `,btn('Aprovar',async()=>{await api(`vr/${x.id}/decide`,{ok:1});lp()}),btn('Recusar',async()=>{await api(`vr/${x.id}/decide`,{ok:0});lp()}))))}
 async function ref(){const[d,e]=await Promise.all([api('users'),api('depts')]),ds=e.r,opts=u=>{const s=h('select',{onchange:async()=>{try{await api(`users/${u.id}/dept`,{dept:s.value?Number(s.value):null});ref()}catch(x){alert(x.message)}}},h('option',{value:''},'Sem departamento'),...ds.map(x=>h('option',{value:x.id},x.name)));s.value=u.dept||'';return s};
  const row=u=>h('tr',{},h('td',{},`${u.name} (${u.username})`+(u.role==='admin'?' ★':'')+(u.pending?' [pendente]':'')+(u.active?'':' [inativo]')),
   h('td',{},btn('Ver',()=>sel(u)),u.role==='user'&&btn('Convite/Repor',async()=>link((await api(`users/${u.id}/invite`,{})).token)),u.role==='user'&&btn(u.active?'Desativar':'Ativar',async()=>{await api(`users/${u.id}/active`,{active:u.active?0:1});ref()}),opts(u)));
  const grp=(t,id,us)=>h('div',{},h('h4',{},`${t} (${us.length}) `,id&&btn('Ver horário',()=>det.replaceChildren(dcal(id,t))),id&&btn('Apagar dept.',async()=>{if(confirm('Apagar departamento? Os utilizadores ficam sem departamento.')){await api(`depts/${id}/del`,{});ref()}})),h('table',{},...us.map(row)));
  list.replaceChildren(...ds.map(x=>grp(x.name,x.id,d.users.filter(u=>u.dept===x.id))),grp('Sem departamento',0,d.users.filter(u=>!u.dept)))}
 function sel(u){const f=h('input',{type:'file',accept:'.csv,.txt'}),a=h('input',{type:'date'}),z=h('input',{type:'date'});
  det.replaceChildren(h('h3',{},u.name),cal(u.id,true),certs(u.id,true),
   h('p',{},h('b',{},'Horário (CSV: data,tipo,inicio,fim — tipo T/F/V): '),f,btn('Enviar',async()=>{if(!f.files[0]||f.files[0].size>2e5)throw Error('Ficheiro inválido');
    const L=(await f.files[0].text()).replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim()),rows=L.map(l=>l.split(/[;,\t]/).map(x=>x.trim())).map(r=>{const m=r[0].match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)r[0]=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;return r}).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r[0])).map(([day,type,start,end])=>({day,type:(type||'').toUpperCase(),start:start||null,end:end||null}));
    if(!rows.length)throw Error('Nenhuma linha válida no ficheiro');for(let i=0;i<rows.length;i+=400)await api('schedule/'+u.id,{rows:rows.slice(i,i+400)});alert(rows.length+' de '+L.length+' linhas gravadas');sel(u)})),
   h('p',{},h('b',{},'Férias: '),a,z,btn('Marcar',async()=>{const d=await api('vacation/'+u.id,{from:a.value,to:z.value});alert(d.n+' dias de férias');sel(u)})))}
 const nm=h('input',{placeholder:'Nome',maxlength:60}),un=h('input',{placeholder:'utilizador',maxlength:30});
 const dn=h('input',{placeholder:'Novo departamento',maxlength:40});show(head(),pr,h('h3',{},'Novo utilizador'),h('div',{},nm,un,btn('Criar',async()=>{const d=await api('users',{name:nm.value,username:un.value});nm.value=un.value='';link(d.token);ref()})),h('h3',{},'Departamentos e utilizadores'),h('div',{},dn,btn('Criar departamento',async()=>{await api('depts',{name:dn.value});dn.value='';ref()})),list,det);ref().catch(x=>alert(x.message));lp().catch(()=>{})}
(async()=>{const m=location.hash.match(/^#invite=([\w-]{20,})$/);if(m){history.replaceState(null,'',location.pathname);return activate(m[1])}
 if(tok)try{me=await api('me');return me.role==='admin'?admin():user()}catch{}login()})();
