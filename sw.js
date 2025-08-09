
const CACHE = 'culinary-final-v1';
const ASSETS = ['/', '/index.html', '/style.css', '/script.js', '/images/hero.jpg'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); });
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request).then(resp=>{ const cc=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request, cc)); return resp; }).catch(()=>caches.match('/index.html'))));
});
