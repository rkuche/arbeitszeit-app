const CACHE='arbeitszeit-v6-2-2-target';
const BUILD='6.2.2-target';
const INDEX=new URL('./index.html',self.registration.scope).href;
const ASSETS=['./manifest.webmanifest','./icon-192.png','./icon-512.png'];
async function isBuild(response){return response.ok&&(await response.clone().text()).includes('name="app-build" content="'+BUILD+'"');}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const index=await fetch(INDEX,{cache:'reload'});
  if(!await isBuild(index))throw new Error('App build not available yet');
  await cache.put(INDEX,index);
  await cache.addAll(ASSETS.map(url=>new Request(new URL(url,self.registration.scope),{cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(k=>k.startsWith('arbeitszeit-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||!request.url.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(request.mode==='navigate'){
      try{const response=await fetch(request,{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);if(await isBuild(response))await cache.put(INDEX,response.clone()).catch(()=>{});return response;}
      catch(error){return await cache.match(INDEX)||Response.error();}
    }
    try{return await fetch(request);}catch(error){return await cache.match(request)||Response.error();}
  })());
});
