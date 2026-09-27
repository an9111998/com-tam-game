/* ============================================================
   Server tĩnh cho lúc làm việc — chạy: node dev/serve.js [cổng]

   Khác python -m http.server ở một điểm quan trọng: trả
   Cache-Control: no-store. Trình duyệt giữ lại css/js cũ là cái bẫy
   tốn thời gian nhất khi sửa game — sửa xong tải lại vẫn thấy bản cũ
   rồi đi tìm lỗi ở chỗ không có lỗi.
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = +process.argv[2] || 8190;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, rel === '/' ? 'index.html' : rel);
  /* không cho đi ra ngoài thư mục dự án */
  if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  fs.readFile(f, (e, data) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404 ' + rel); return }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(PORT, () => console.log('http://localhost:' + PORT));
