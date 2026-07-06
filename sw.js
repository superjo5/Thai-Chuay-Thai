const CACHE = 'khid-6040-v4';
const FILES = ['/', '/index.html', '/manifest.json', '/icon.png'];

// ติดตั้ง — cache ไฟล์ทั้งหมด
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  // อย่ารอ SW เก่า — activate ทันที
  self.skipWaiting();
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

// fetch — cache first, fallback network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      // ถ้ามี cache ใช้เลย (ออฟไลน์ได้)
      if(cached) return cached;
      // ถ้าไม่มี fetch จาก network แล้ว cache ไว้
      return fetch(e.request).then(res => {
        if(!res || res.status !== 200) return res;
        var clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});

// แจ้ง client ว่ามีอัปเดท
self.addEventListener('message', e => {
  if(e.data === 'SKIP_WAITING') self.skipWaiting();
});
