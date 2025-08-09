const CACHE_NAME = 'culinary-static-v1';
const ASSETS = [
  '/', '/index.html', '/style.css', '/script.js'
];
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(
    caches.match(e.request).then(res=> res || fetch(e.request).then(r=>{
      const clone = r.clone();
      caches.open(CACHE_NAME).then(c=>c.put(e.request, clone));
      return r;
    }).catch(()=> caches.match('/index.html')))
  );
});