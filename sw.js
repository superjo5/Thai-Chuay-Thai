const CACHE = 'khid-6040-v5';
const FILES = ['/', '/index.html', '/manifest.json', '/icon.png'];

// ติดตั้ง — cache ไฟล์ แต่ไม่ skipWaiting ทันที รอให้แอปสั่ง
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  // ไม่ skipWaiting ที่นี่ — รอแจ้งเตือนก่อน
});

// activate — ลบ cache เก่าออก
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch — network first สำหรับ html, cache first สำหรับอื่น
self.addEventListener('fetch', e => {
  var url = new URL(e.request.url);
  // index.html — network first เพื่อตรวจอัปเดต
  if(url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request).then(res => {
        var clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // ไฟล์อื่น — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(!res || res.status !== 200) return res;
        var clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});

// รับคำสั่ง skipWaiting จากแอป
self.addEventListener('message', e => {
  if(e.data === 'SKIP_WAITING') self.skipWaiting();
});
