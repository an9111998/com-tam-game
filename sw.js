/* ============================================================
   Service worker — cho phép cài lên màn hình chính và chơi offline.

   Nguyên tắc chọn chiến lược (quan trọng, đừng đổi bừa):
   - Trang HTML dùng NETWORK-FIRST. Nếu cache-first thì người chơi sẽ
     kẹt ở bản cũ mãi mãi, đây là cái bẫy kinh điển của service worker.
   - File tĩnh dùng STALE-WHILE-REVALIDATE: hiện ngay bản cache cho nhanh,
     đồng thời tải bản mới về dùng cho lần sau.
   - Font của Google dùng CACHE-FIRST để offline vẫn có chữ đẹp.

   DÙNG ĐÚNG MỘT CACHE, cố ý.
   Trước đây tách SHELL và RUNTIME thì sinh lỗi: caches.match() tìm trong
   MỌI cache nên luôn vớ phải bản cũ nằm ở SHELL, còn bản mới lại ghi vào
   RUNTIME — kết quả là file tĩnh không bao giờ cập nhật. Một cache duy nhất
   thì việc ghi đè mới thực sự thay được bản cũ.
   ============================================================ */

const VERSION = 'v1.1.0';
const CACHE = 'com-tam-' + VERSION;

/* những file tối thiểu để game chạy được khi mất mạng */
const SHELL_FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/art.js',
  './js/data.js',
  './js/game.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* cho trang chủ động yêu cầu bản mới tiếp quản ngay */
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

const isFont = u =>
  u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';

/* lưu vào cache, bỏ qua lỗi (ví dụ hết dung lượng) */
const put = (req, res) =>
  caches.open(CACHE).then(c => c.put(req, res)).catch(() => { });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* 1. Trang HTML: ưu tiên mạng, mất mạng mới lấy cache */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { put('./index.html', res.clone()); return res })
        .catch(() => caches.open(CACHE)
          .then(c => c.match('./index.html').then(r => r || c.match('./'))))
    );
    return;
  }

  /* 2. Font Google: có trong cache thì dùng luôn */
  if (isFont(url)) {
    e.respondWith(
      caches.open(CACHE).then(c => c.match(req).then(hit =>
        hit || fetch(req).then(res => { put(req, res.clone()); return res }).catch(() => hit)
      ))
    );
    return;
  }

  /* 3. File tĩnh cùng nguồn: trả cache ngay, âm thầm cập nhật nền.
        Tra cứu và ghi đè trên CÙNG một cache thì bản mới mới thay được bản cũ. */
  if (url.origin === location.origin) {
    e.respondWith(
      caches.open(CACHE).then(c => c.match(req).then(hit => {
        const net = fetch(req).then(res => {
          if (res && res.status === 200 && res.type === 'basic') put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      }))
    );
  }
});
