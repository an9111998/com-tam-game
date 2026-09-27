/* ============================================================
   Sinh icon PWA — chạy: node dev/make-icons.js
   Tự vẽ và tự đóng gói PNG bằng zlib, không cần thư viện ngoài
   (canvas/sharp không có sẵn trên máy nào cũng chạy được).
   Hình vẽ tả đúng cái quán bán: đĩa cơm tấm sườn + mỡ hành.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ---------- hình, toạ độ 0..1 so với cạnh ảnh ---------- */
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/* xoay điểm quanh tâm hình để làm được vệt cháy chéo trên miếng sườn */
function local(s, x, y) {
  let dx = x - s.cx, dy = y - s.cy;
  if (s.rot) {
    const c = Math.cos(-s.rot), n = Math.sin(-s.rot);
    [dx, dy] = [dx * c - dy * n, dx * n + dy * c];
  }
  return [dx, dy];
}
function inside(s, x, y) {
  const [dx, dy] = local(s, x, y);
  if (s.t === 'ellipse') return (dx / s.rx) ** 2 + (dy / s.ry) ** 2 <= 1;
  if (s.t === 'rrect') {
    const ax = Math.abs(dx) - (s.rx - s.r), ay = Math.abs(dy) - (s.ry - s.r);
    if (ax <= 0 || ay <= 0) return Math.abs(dx) <= s.rx && Math.abs(dy) <= s.ry;
    return ax * ax + ay * ay <= s.r * s.r;
  }
  return false;
}

/* nền: ô vuông bo góc mềm, tông cơm nóng */
const bgRound = { t: 'rrect', cx: .5, cy: .5, rx: .5, ry: .5, r: .22, c: '#ffefd6' };
const bgFull = { t: 'rrect', cx: .5, cy: .5, rx: .5, ry: .5, r: 0, c: '#ffefd6' };

const CONTENT = [
  /* đĩa: vành hơi sẫm nằm sau, lòng đĩa trắng ngà nằm trước */
  { t: 'ellipse', cx: .5, cy: .60, rx: .425, ry: .255, c: '#e8d4b4' },
  { t: 'ellipse', cx: .5, cy: .585, rx: .395, ry: .228, c: '#fffdf7' },
  { t: 'ellipse', cx: .5, cy: .585, rx: .318, ry: .172, c: '#fdf7ec' },

  /* ụ cơm bên trái */
  { t: 'ellipse', cx: .375, cy: .565, rx: .152, ry: .105, c: '#f1e7d4' },
  { t: 'ellipse', cx: .375, cy: .535, rx: .148, ry: .092, c: '#fffdf7' },
  { t: 'ellipse', cx: .335, cy: .512, rx: .036, ry: .020, c: '#f4ecdd', rot: .5 },
  { t: 'ellipse', cx: .405, cy: .505, rx: .036, ry: .020, c: '#f4ecdd', rot: -.4 },
  { t: 'ellipse', cx: .372, cy: .552, rx: .036, ry: .020, c: '#f4ecdd', rot: .2 },

  /* mỡ hành rắc trên cơm */
  { t: 'ellipse', cx: .341, cy: .530, rx: .030, ry: .014, c: '#8fb87a', rot: .35 },
  { t: 'ellipse', cx: .399, cy: .523, rx: .030, ry: .014, c: '#7faa68', rot: -.5 },
  { t: 'ellipse', cx: .370, cy: .500, rx: .028, ry: .013, c: '#9cc287', rot: .1 },

  /* miếng sườn nướng bên phải, có vệt cháy cạnh */
  { t: 'ellipse', cx: .635, cy: .560, rx: .175, ry: .128, c: '#8e5226' },
  { t: 'ellipse', cx: .635, cy: .548, rx: .168, ry: .120, c: '#ac6a31' },
  { t: 'rrect', cx: .578, cy: .548, rx: .012, ry: .098, r: .012, c: '#7c4319', rot: .22 },
  { t: 'rrect', cx: .640, cy: .545, rx: .012, ry: .104, r: .012, c: '#7c4319', rot: .22 },
  { t: 'rrect', cx: .700, cy: .552, rx: .012, ry: .092, r: .012, c: '#7c4319', rot: .22 },
  { t: 'ellipse', cx: .612, cy: .505, rx: .060, ry: .026, c: '#c07f42', rot: -.16 },

  /* chén nước mắm nho nhỏ ở góc, chấm đỏ cho có điểm nhấn */
  { t: 'ellipse', cx: .805, cy: .430, rx: .088, ry: .060, c: '#f0ddbe' },
  { t: 'ellipse', cx: .805, cy: .424, rx: .072, ry: .046, c: '#c98a3e' },
  { t: 'ellipse', cx: .800, cy: .418, rx: .020, ry: .012, c: '#e2705f' },

  /* ba vệt khói mảnh bay lên từ đĩa cơm nóng */
  { t: 'rrect', cx: .415, cy: .288, rx: .015, ry: .064, r: .015, c: '#e4d3b6', rot: -.30 },
  { t: 'rrect', cx: .505, cy: .250, rx: .015, ry: .078, r: .015, c: '#e9dabf', rot: .10 },
  { t: 'rrect', cx: .595, cy: .286, rx: .015, ry: .066, r: .015, c: '#e4d3b6', rot: .30 }
];

/* ---------- vẽ ra mảng RGBA, lấy mẫu 3×3 cho viền mịn ---------- */
function render(size, maskable) {
  const shapes = [maskable ? bgFull : bgRound];
  /* icon maskable bị khoét tròn nên nội dung phải thu vào vùng an toàn giữa */
  const k = maskable ? .78 : 1;
  CONTENT.forEach(s => {
    const o = { ...s };
    ['cx', 'cy'].forEach(p => o[p] = .5 + (s[p] - .5) * k);
    ['rx', 'ry', 'r'].forEach(p => { if (o[p] != null) o[p] = s[p] * k });
    shapes.push(o);
  });

  const px = Buffer.alloc(size * size * 4);
  const SS = 3, inv = 1 / (SS * SS);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = (x + (sx + .5) / SS) / size, fy = (y + (sy + .5) / SS) / size;
          let col = null;
          for (let i = shapes.length - 1; i >= 0; i--) {
            if (inside(shapes[i], fx, fy)) { col = shapes[i].c; break }
          }
          if (col) { const [cr, cg, cb] = hex(col); r += cr; g += cg; b += cb; a += 255 }
        }
      }
      const o = (y * size + x) * 4;
      px[o] = Math.round(r * inv); px[o + 1] = Math.round(g * inv);
      px[o + 2] = Math.round(b * inv); px[o + 3] = Math.round(a * inv);
    }
  }
  return px;
}

/* ---------- đóng gói PNG ---------- */
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return buf => {
    let c = -1;
    for (const b of buf) c = t[(c ^ b) & 255] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;                      /* 8 bit, RGBA */
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;                 /* filter none */
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
[[512, 'icon-512.png', false], [192, 'icon-192.png', false], [180, 'icon-180.png', false], [512, 'icon-maskable.png', true]]
  .forEach(([sz, name, mask]) => {
    const f = path.join(out, name);
    fs.writeFileSync(f, png(sz, render(sz, mask)));
    console.log(name, fs.statSync(f).size + ' bytes');
  });
