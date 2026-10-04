const CACHE_NAME='studyos-shell-v2';
const FALLBACK='./index.html';

self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE_NAME);
 const response=await fetch('./index.html');
 const html=await response.text();
 const assets=[FALLBACK,'./manifest.webmanifest','./assets/studyos-app.svg','./data/studyos.example.json','./onboarding.css?v=1'];
 for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
  const url=match[1];
  if(!/^(?:[a-z]+:|#|data:|\/\/)/i.test(url))assets.push(new URL(url,self.registration.scope).href);
 }
 await Promise.allSettled([...new Set(assets)].map(url=>cache.add(url)));
 await self.skipWaiting();
})()));

self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith('studyos-shell-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));

self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(FALLBACK,response.clone()));
   return response;
  }).catch(async()=>await caches.match(request)||await caches.match(FALLBACK)));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
  if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()));
  return response;
 })));
});
