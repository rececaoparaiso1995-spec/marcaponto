// Guarda só o "esqueleto" da app (index, app.js, style.css). Nunca toca em pedidos à API (outro domínio).
const C='ponto-shell';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin)return;
 if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(C).then(c=>c.put('./',y))}return x}).catch(()=>caches.match('./')));return}
 if(/\/(app\.js|style\.css)$/.test(u.pathname))e.respondWith(caches.open(C).then(async c=>{const hit=await c.match(r);if(hit)return hit;const x=await fetch(r);if(x.ok){for(const k of await c.keys())if(new URL(k.url).pathname===u.pathname)await c.delete(k);await c.put(r,x.clone())}return x}))});
