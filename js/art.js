/* ============================================================
   ART — hình vẽ SVG cho món, đĩa cơm, khách, icon và hạt hiệu ứng.
   Vẽ bằng SVG thay vì ảnh: phóng to không vỡ, đổi màu bằng một biến,
   và bản deploy không phải tải thêm file nào.
   ============================================================ */

/* nhạt / đậm hơn một màu hex, dùng để tạo khối cho hình phẳng */
function shade(hex, p) {
  const n = parseInt((hex || '#cccccc').slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (p > 0 ? (255 - v) * p : v * p))));
  return '#' + [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}

/* ============================================================
   BỘ ICON — SVG nét, giữ đúng một tông với phần còn lại
   ============================================================ */
const ICONS = {
  money: '<path d="M3 6h18v12H3z" rx="2"/><circle cx="12" cy="12" r="3.2"/><path d="M6 9v6M18 9v6"/>',
  rice: '<path d="M4 13c0-4 3.6-7 8-7s8 3 8 7"/><path d="M2.6 13h18.8l-1.6 6.4H4.2z"/><path d="M9 9.6c1-1.6 4-1.6 5 0"/>',
  plate: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>',
  soup: '<path d="M3.5 10h17c0 5.2-3.8 9-8.5 9S3.5 15.2 3.5 10z"/><path d="M9 6.4c0-1.4 1.4-1.4 1.4-2.8M14 6.4c0-1.4 1.4-1.4 1.4-2.8"/>',
  cup: '<path d="M6 7h12l-1.4 12.4H7.4z"/><path d="M6.6 11h10.8"/><path d="M14 3.6 12.6 7"/>',
  box: '<path d="M3.4 8.4 12 5l8.6 3.4-8.6 3.4z"/><path d="M3.4 8.4v7.2L12 19l8.6-3.4V8.4"/><path d="M12 11.8V19"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3.4 20c0-3.6 2.5-5.6 5.6-5.6s5.6 2 5.6 5.6"/><path d="M16 5.4a3.2 3.2 0 0 1 0 5.6M17.4 14.8c2 .7 3.2 2.5 3.2 5.2"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.4 2.2"/>',
  star: '<path d="M12 3.6l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6-4.5-4.2 6.1-.8z"/>',
  warn: '<path d="M12 4 21 19.4H3z"/><path d="M12 9.4v4.4M12 16.6v.1"/>',
  price: '<path d="M4 4h7.4l8.6 8.6-7.4 7.4L4 11.4z"/><circle cx="8.4" cy="8.4" r="1.6"/>',
  chart: '<path d="M4 20V10M10 20V5M16 20v-7M22 20H2"/>',
  chartup: '<path d="M3 17 9.5 10l4 3.6L21 6"/><path d="M21 11V6h-5"/>',
  chartdown: '<path d="M3 7 9.5 14l4-3.6L21 18"/><path d="M21 13v5h-5"/>',
  sun: '<circle cx="12" cy="12" r="4.4"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/>',
  rain: '<path d="M6.4 13a4.4 4.4 0 0 1 .6-8.7 5.4 5.4 0 0 1 10.1 1.3A3.9 3.9 0 0 1 17.6 13z"/><path d="M8.6 16.4 7.6 19M12 16.4 11 19M15.4 16.4 14.4 19"/>',
  cloud: '<path d="M6.4 17a4.4 4.4 0 0 1 .6-8.7 5.4 5.4 0 0 1 10.1 1.3A3.9 3.9 0 0 1 17.6 17z"/>',
  wind: '<path d="M3 8.6h10.4a2.8 2.8 0 1 0-2.8-2.8"/><path d="M3 13h14a2.8 2.8 0 1 1-2.8 2.8"/><path d="M3 17.4h6"/>',
  gift: '<path d="M3.6 8.6h16.8V12H3.6z"/><path d="M5 12v8h14v-8"/><path d="M12 8.6V20"/><path d="M12 8.6C9.4 8.6 7.6 7.4 7.6 6s2.6-1.6 4.4 2.6c1.8-4.2 4.4-4 4.4-2.6s-1.8 2.6-4.4 2.6z"/>',
  phone: '<path d="M7 2.6h10v18.8H7z"/><path d="M10.6 5.4h2.8M12 18.2v.1"/>',
  eye: '<path d="M2.6 12S6 6.4 12 6.4S21.4 12 21.4 12S18 17.6 12 17.6S2.6 12 2.6 12z"/><circle cx="12" cy="12" r="2.8"/>',
  bike: '<circle cx="6" cy="16.6" r="3.4"/><circle cx="18" cy="16.6" r="3.4"/><path d="M6 16.6 10 8h4l3 8.6M9 8h6"/>',
  shield: '<path d="M12 3.2 20 6v6c0 4.4-3.4 7.4-8 9-4.6-1.6-8-4.6-8-9V6z"/><path d="m8.6 12 2.4 2.4 4.4-4.6"/>',
  reload: '<path d="M20.4 12a8.4 8.4 0 1 1-2.8-6.2"/><path d="M20.8 4.4v4.8h-4.8"/>',
  lock: '<path d="M6 11h12v9.4H6z"/><path d="M8.6 11V8a3.4 3.4 0 0 1 6.8 0v3"/>',
  trash: '<path d="M4.6 7h14.8"/><path d="M6.6 7 7.6 20.4h8.8L17.4 7"/><path d="M9.6 7V4.6h4.8V7M10.4 10.6v6M13.6 10.6v6"/>',
  moon: '<path d="M20 14.6A8.6 8.6 0 0 1 9.4 4a8.6 8.6 0 1 0 10.6 10.6z"/>',
  bell: '<path d="M6.4 17.4c1.4-1.4 1.4-2.4 1.4-5.4a4.2 4.2 0 0 1 8.4 0c0 3 0 4 1.4 5.4z"/><path d="M10.4 19.6a1.8 1.8 0 0 0 3.2 0M12 5.4V3.4"/>',
  install: '<path d="M12 3.6v11"/><path d="m7.6 10.4 4.4 4.4 4.4-4.4"/><path d="M4.4 18.4v2h15.2v-2"/>',
  tools: '<path d="m4 18.4 8.6-8.6"/><path d="M9.6 6.4 7 3.8 4.4 6.4 7 9zM14.4 14.4l5.2 5.2M17 11.8a3.6 3.6 0 1 0 2.6-6"/>',
  book: '<path d="M4.6 4.6h6.8c1.6 0 2.6.8 2.6 2v13c0-1.2-1-2-2.6-2H4.6z"/><path d="M19.4 4.6h-5c-1 0-1.4.8-1.4 2v13c0-1.2.4-2 1.4-2h5z"/>',
  pen: '<path d="M16.4 3.6 20.4 7.6 8.6 19.4l-5 1 1-5z"/><path d="M14.4 5.6 18.4 9.6"/>',
  hand: '<path d="M8.6 11V5.6a1.7 1.7 0 0 1 3.4 0V11"/><path d="M12 10.4V8a1.7 1.7 0 0 1 3.4 0v3.4"/><path d="M15.4 11.4V9.6a1.7 1.7 0 0 1 3.4 0v5.8c0 3-2.4 5.2-5.6 5.2h-1.4c-3.2 0-5.6-2.2-5.6-5.2v-4.8"/>',
  swipe: '<path d="M12 4.6v9"/><path d="M8.6 8 12 4.6 15.4 8"/><path d="M5.4 17.4h13.2"/>',
  heart: '<path d="M12 20S3.6 14.6 3.6 9.2A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.4 2.6C20.4 14.6 12 20 12 20z"/>',
  check: '<path d="m5 12.6 4.4 4.4L19 6.6"/>',
  coin: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.4v9.2M9.6 9.6h4a1.8 1.8 0 0 1 0 3.6h-4h4.4a1.8 1.8 0 0 1 0 3.6H9.6"/>',
  receipt: '<path d="M5.6 3.6h12.8v16.8l-2.2-1.6-2.2 1.6-2.2-1.6-2.2 1.6-2.2-1.6z"/><path d="M8.6 8h6.8M8.6 12h6.8"/>',
  trophy: '<path d="M7.6 4.6h8.8v4.2a4.4 4.4 0 0 1-8.8 0z"/><path d="M7.6 5.6H4.8c0 2.8 1.4 4.2 3.2 4.4M16.4 5.6h2.8c0 2.8-1.4 4.2-3.2 4.4M12 13.2v3M8.6 20.4h6.8l-.8-4H9.4z"/>',
  pause: '<path d="M8.6 5.6v12.8M15.4 5.6v12.8"/>',
  calendar: '<path d="M4.6 6.6h14.8v13.8H4.6z"/><path d="M4.6 11h14.8M8.6 4v4M15.4 4v4"/>',
  fire: '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-4.6 5-6 5-10.4 2.6 1.4 3.4 4 3.4 5.6 1-.6 1.6-1.6 1.6-2.8 1.4 1.6 2 3.8 2 5.6 0 4-2.4 7.6-6 7.6z"/>',
  bag: '<path d="M5.6 8h12.8l1 12.4H4.6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  note: '<path d="M8.6 17.6V5.6l10-1.6v12"/><circle cx="6.4" cy="18" r="2.4"/><circle cx="16.4" cy="16.4" r="2.4"/>',
  /* chén mỡ hành: tô nhỏ có mấy cọng hành nổi trên mặt dầu */
  oil: '<path d="M3.6 10.6h16.8c0 4.4-3.8 7.8-8.4 7.8s-8.4-3.4-8.4-7.8z"/><path d="M8.4 7.4c0-1.2 1.2-1.2 1.2-2.4M14.6 7c0-1.2 1.2-1.2 1.2-2.4"/><ellipse cx="9.4" cy="13.4" rx="1.8" ry=".9"/><ellipse cx="14.4" cy="14.4" rx="1.8" ry=".9"/>',
  sound: '<path d="M4 9.4h3.4L12.6 5v14l-5.2-4.4H4z"/><path d="M16 9.4a3.6 3.6 0 0 1 0 5.2M18.6 6.8a7.2 7.2 0 0 1 0 10.4"/>',
  mute: '<path d="M4 9.4h3.4L12.6 5v14l-5.2-4.4H4z"/><path d="m16.4 9.6 4.4 4.8M20.8 9.6l-4.4 4.8"/>',
  vib: '<path d="M8 3.6h8v16.8H8z"/><path d="M4.6 8.6a5.6 5.6 0 0 0 0 6.8M19.4 8.6a5.6 5.6 0 0 1 0 6.8"/>',
  viboff: '<path d="M8 3.6h8v16.8H8z"/><path d="M4.6 10.6v2.8M19.4 10.6v2.8"/>'
};
function ic(n, cls) {
  const d = ICONS[n] || ICONS.check;
  return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

/* ============================================================
   HÌNH TỪNG MÓN — vẽ trong khung 40×40
   ============================================================ */
const ITEM_ART = {
  /* ---- món chính ---- */
  suon: c => `
    <path d="M7 22c-1-5 2-11 8-13 6-2 12 1 13 6 1 5-3 9-8 10-6 1-12-1-13-3z" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="1.4"/>
    <path d="M12 12c2 3 3 7 3 11M17 10c2 3 3 7 3 11M22 10c2 3 2 6 2 9" stroke="${shade(c, -.45)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M28 14c2-1 4 0 4 2s-2 3-4 2z" fill="#f4ead6" stroke="${shade(c, -.4)}" stroke-width="1.2"/>`,
  bi: c => `
    <ellipse cx="20" cy="24" rx="14" ry="9" fill="${shade(c, .3)}" stroke="${shade(c, -.25)}" stroke-width="1.2"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${8 + i * 2} ${26 - i} q6 -${4 + i} 14 -1" stroke="${shade(c, -.2)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`).join('')}
    <circle cx="14" cy="20" r="1.2" fill="#9a7a4e"/><circle cx="25" cy="22" r="1.2" fill="#9a7a4e"/>`,
  cha: c => `
    <path d="M6 26 14 10h14l6 16z" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="1.4"/>
    <path d="M8 22h24" stroke="${shade(c, -.3)}" stroke-width="1.3"/>
    <path d="M13 12h14l3 8H10z" fill="#f6d258" stroke="${shade(c, -.3)}" stroke-width="1.1"/>
    <circle cx="16" cy="24" r="1.3" fill="${shade(c, -.4)}"/><circle cx="24" cy="23" r="1.3" fill="${shade(c, -.4)}"/>`,
  opla: c => `
    <path d="M8 22c-2-6 3-12 9-12 7 0 8 4 12 5 4 1 5 6 1 9-5 4-20 4-22-2z" fill="#fffaf0" stroke="#e8d8b8" stroke-width="1.4"/>
    <circle cx="19" cy="19" r="6" fill="${c}" stroke="${shade(c, -.3)}" stroke-width="1.2"/>
    <ellipse cx="17" cy="17" rx="2" ry="1.4" fill="#fdf0a8"/>`,
  heoquay: c => `
    <path d="M6 16h28v12H6z" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="1.4"/>
    <path d="M6 22h28" stroke="${shade(c, -.25)}" stroke-width="1.2"/>
    <path d="M6 16c0-3 2-4 6-4h16c4 0 6 1 6 4z" fill="#f3d9a6" stroke="${shade(c, -.35)}" stroke-width="1.3"/>
    ${[9, 13, 17, 21, 25, 29].map(x => `<circle cx="${x}" cy="14.6" r="1" fill="${shade(c, -.2)}"/>`).join('')}
    <path d="M8 26h24" stroke="#f0ddc0" stroke-width="1.6"/>`,
  duiga: c => `
    <path d="M12 10c7-3 14 1 15 8 1 6-4 11-10 10-6-1-9-6-8-11 .4-3 1.4-5.6 3-7z" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="1.4"/>
    <path d="M13 26c-3 3-5 5-6 7" stroke="#f2e6cf" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M13 26c-3 3-5 5-6 7" stroke="#d8c7a8" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <circle cx="7" cy="33" r="2.8" fill="#f6ecd8" stroke="#d8c7a8" stroke-width="1.1"/>
    <path d="M18 14c3 1 5 3 6 6" stroke="${shade(c, -.45)}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  rauxao: c => `
    <path d="M6 28c4-10 12-16 22-18-2 10-8 17-17 19z" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="1.3"/>
    <path d="M10 27c6-7 11-11 17-14" stroke="${shade(c, -.4)}" stroke-width="1.3" fill="none"/>
    <path d="M22 30c3-6 7-9 12-10-1 6-5 10-10 11z" fill="${shade(c, .2)}" stroke="${shade(c, -.3)}" stroke-width="1.2"/>
    <circle cx="14" cy="14" r="2.4" fill="#e8b84e" stroke="#c99a30" stroke-width="1"/>`,
  cachien: c => `
    <path d="M6 20c5-7 14-9 20-5 3 2 5 4 6 5-1 1-3 3-6 5-6 4-15 2-20-5z" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="1.4"/>
    <path d="M32 20c2-3 4-4 4-4v8s-2-1-4-4z" fill="${shade(c, .15)}" stroke="${shade(c, -.3)}" stroke-width="1.2"/>
    <circle cx="13" cy="18" r="1.7" fill="#4a3b32"/>
    <path d="M18 14c2 4 2 8 0 12M23 15c2 3 2 7 0 10" stroke="${shade(c, -.35)}" stroke-width="1.2" fill="none"/>`,
  baroi: c => `
    <path d="M5 13h13c3 0 4 2 4 5s-1 5-4 5H5z" fill="${c}" stroke="${shade(c, -.3)}" stroke-width="1.3"/>
    <path d="M5 16.4h17M5 19.8h17" stroke="#fff6ee" stroke-width="1.8"/>
    <path d="M17 24h13c3 0 4 2 4 5s-1 5-4 5H17z" fill="${c}" stroke="${shade(c, -.3)}" stroke-width="1.3"/>
    <path d="M17 27.4h17M17 30.8h17" stroke="#fff6ee" stroke-width="1.8"/>`,
  mucxao: c => `
    <circle cx="13" cy="15" r="6.4" fill="none" stroke="${shade(c, -.3)}" stroke-width="3.4"/>
    <circle cx="26" cy="21" r="5.4" fill="none" stroke="${shade(c, -.3)}" stroke-width="3.2"/>
    <path d="M8 27c4-2 8-1 11 2 2 2 4 3 6 3" stroke="${shade(c, -.35)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M30 10c2 1 3 3 3 5" stroke="#6fa35a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <circle cx="20" cy="31" r="1.6" fill="#e8734f"/>`,
  tomrim: c => `
    <path d="M9 26c-3-5-1-11 5-13 5-2 10 1 11 6 1 4-1 7-4 8" fill="none" stroke="${c}" stroke-width="5.2" stroke-linecap="round"/>
    <path d="M9 26c-3-5-1-11 5-13 5-2 10 1 11 6" fill="none" stroke="${shade(c, -.3)}" stroke-width="1.2"/>
    <path d="M24 13c3-2 6-2 8 0-2 2-5 3-8 2z" fill="${shade(c, .2)}" stroke="${shade(c, -.25)}" stroke-width="1.1"/>
    <circle cx="26" cy="11.6" r="1.2" fill="#4a3b32"/>
    <path d="M12 30c2 2 5 3 8 2" stroke="${shade(c, -.2)}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  bonuong: c => `
    <path d="M5 14h14c3 0 4 2 4 4.4s-1 4.4-4 4.4H5z" fill="${c}" stroke="${shade(c, -.3)}" stroke-width="1.3"/>
    <path d="M18 25h14c3 0 4 2 4 4.4S35 34 32 34H18z" fill="${c}" stroke="${shade(c, -.3)}" stroke-width="1.3"/>
    <path d="M8 14v8.8M13 14v8.8M21 25v9M26 25v9" stroke="${shade(c, -.5)}" stroke-width="1.4"/>
    <path d="M27 12c3 0 5 2 5 4" stroke="#6fa35a" stroke-width="2" fill="none" stroke-linecap="round"/>`,

  /* ---- canh ---- */
  khoaimo: c => `
    <path d="M5 17h30c0 8-6 13-15 13S5 25 5 17z" fill="#f6f0e4" stroke="#ddcdb4" stroke-width="1.4"/>
    <path d="M7.4 19h25.2c-.6 6-5.4 9.4-12.6 9.4S8 25 7.4 19z" fill="${c}"/>
    <ellipse cx="20" cy="19.4" rx="12" ry="2.6" fill="${shade(c, .18)}"/>
    <path d="M14 12c0-2 2-2 2-4M20 11c0-2 2-2 2-4M26 12c0-2 2-2 2-4" stroke="#cfd8dd" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <circle cx="16" cy="20" r="1.5" fill="#6fa35a"/><circle cx="24" cy="21" r="1.5" fill="#6fa35a"/>`,
  khoqua: c => `
    <path d="M5 17h30c0 8-6 13-15 13S5 25 5 17z" fill="#f6f0e4" stroke="#ddcdb4" stroke-width="1.4"/>
    <path d="M7.4 19h25.2c-.6 6-5.4 9.4-12.6 9.4S8 25 7.4 19z" fill="${shade(c, .55)}"/>
    <circle cx="14" cy="21" r="3.6" fill="${c}" stroke="${shade(c, -.3)}" stroke-width="1.1"/>
    <circle cx="14" cy="21" r="1.5" fill="#e8d9a8"/>
    <circle cx="25" cy="22" r="3.2" fill="${c}" stroke="${shade(c, -.3)}" stroke-width="1.1"/>
    <circle cx="25" cy="22" r="1.3" fill="#e8d9a8"/>
    <path d="M17 12c0-2 2-2 2-4M24 12c0-2 2-2 2-4" stroke="#cfd8dd" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,

  /* ---- nước ---- */
  trada: c => `
    <path d="M11 9h18l-2.4 26h-13.2z" fill="#eef6fa" stroke="#c6d8e2" stroke-width="1.4"/>
    <path d="M12.4 15h15.2l-2 18h-11.2z" fill="${c}" opacity=".85"/>
    <rect x="14.6" y="17" width="5.4" height="5.4" rx="1" fill="#fff" opacity=".7"/>
    <rect x="21" y="23" width="5" height="5" rx="1" fill="#fff" opacity=".6"/>
    <path d="M26 6 23 14" stroke="#ef8fa0" stroke-width="2.4" stroke-linecap="round"/>`,
  nuocsuoi: c => `
    <path d="M16 5h8v4l2 3v22a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V12l2-3z" fill="#eef7fb" stroke="#bdd6e4" stroke-width="1.4"/>
    <path d="M15 17h10v14H15z" fill="${c}" opacity=".7"/>
    <rect x="15.4" y="4" width="9.2" height="3.4" rx="1.2" fill="#6fa8cc"/>
    <path d="M18 20v7" stroke="#fff" stroke-width="1.4" opacity=".8"/>`,
  tratac: c => `
    <path d="M11 9h18l-2.4 26h-13.2z" fill="#eef6fa" stroke="#c6d8e2" stroke-width="1.4"/>
    <path d="M12.4 14h15.2l-2 19h-11.2z" fill="${c}" opacity=".9"/>
    <circle cx="17" cy="22" r="3.2" fill="#f7c948" stroke="#d8a42c" stroke-width="1"/>
    <path d="M17 18.8v6.4M13.8 22h6.4" stroke="#fff3c8" stroke-width="1"/>
    <rect x="21" y="26" width="4.4" height="4.4" rx="1" fill="#fff" opacity=".6"/>
    <path d="M26 6 23 14" stroke="#7fb86a" stroke-width="2.4" stroke-linecap="round"/>`,
  trachanh: c => `
    <path d="M11 9h18l-2.4 26h-13.2z" fill="#eef6fa" stroke="#c6d8e2" stroke-width="1.4"/>
    <path d="M12.4 14h15.2l-2 19h-11.2z" fill="${c}" opacity=".8"/>
    <path d="M14 20a4.6 4.6 0 0 1 9.2 0z" fill="#e8f08e" stroke="#bcc84e" stroke-width="1"/>
    <path d="M18.6 20v-4.4M15 18l3.6 2M22.2 18l-3.6 2" stroke="#f6fbd0" stroke-width=".9"/>
    <path d="M25 24c2-1 3 0 3 2s-2 3-3 2" fill="#6fa35a"/>
    <path d="M26 6 23 14" stroke="#7fb86a" stroke-width="2.4" stroke-linecap="round"/>`,

  /* ---- phụ + cơm + dụng cụ ---- */
  mohanh: c => `
    <path d="M7 18h26c0 6-5 10-13 10S7 24 7 18z" fill="#f6f0e4" stroke="#ddcdb4" stroke-width="1.4"/>
    <path d="M9 19.6h22c-.6 4.6-4.6 7-11 7s-10.4-2.4-11-7z" fill="#f6dc9a"/>
    ${[[13, 21], [18, 23], [23, 21.4], [27, 23], [16, 24.6], [21, 25.4]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.1" fill="${c}" transform="rotate(${(x * 7) % 60 - 30} ${x} ${y})"/>`).join('')}
    <path d="M14 14c0-2 2-2 2-4M24 14c0-2 2-2 2-4" stroke="#cfd8dd" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  com: () => `
    <ellipse cx="20" cy="28" rx="15" ry="7" fill="#fbf6ec" stroke="#e0d2bb" stroke-width="1.4"/>
    <path d="M6.6 26c1-7 6.6-12 13.4-12s12.4 5 13.4 12c-3 2.6-8 4-13.4 4s-10.4-1.4-13.4-4z" fill="#fffdf7" stroke="#e6d9c4" stroke-width="1.3"/>
    ${[[14, 22], [20, 19], [26, 22], [17, 25], [23, 25], [20, 23.6]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.1" ry="1.3" fill="#f2e9d8" transform="rotate(${(x * 13) % 70 - 35} ${x} ${y})"/>`).join('')}
    <path d="M13 12c0-2 2-2 2-4M20 10c0-2 2-2 2-4M27 12c0-2 2-2 2-4" stroke="#d8e2e8" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  hop: c => `
    <path d="M6 15 20 10l14 5-14 5z" fill="${shade(c, .25)}" stroke="#cbb994" stroke-width="1.3"/>
    <path d="M6 15v12l14 5V20z" fill="${c}" stroke="#cbb994" stroke-width="1.3"/>
    <path d="M34 15v12l-14 5V20z" fill="${shade(c, -.1)}" stroke="#cbb994" stroke-width="1.3"/>
    <path d="M13 17.4v4" stroke="#cbb994" stroke-width="1.2"/>`,
  bodo: c => `
    <path d="M9 34 13 10" stroke="${shade(c, -.25)}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M13 34 17 10" stroke="${shade(c, -.25)}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M24 34v-13" stroke="#dfe8ee" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="24" cy="16" rx="4.2" ry="5.4" fill="#eef4f8" stroke="#c6d4de" stroke-width="1.2"/>
    <path d="M31 8v26" stroke="#ef8fa0" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M31 8 34 11" stroke="#ef8fa0" stroke-width="2.8" stroke-linecap="round"/>`
};
function itemArt(k, sz, cls) {
  const it = ITEMS[k] || {}, f = ITEM_ART[k];
  sz = sz || 34;
  return `<svg class="ia ${cls || ''}" viewBox="0 0 40 40" width="${sz}" height="${sz}" aria-hidden="true">${f ? f(it.c) : ''}</svg>`;
}

/* ============================================================
   ĐĨA CƠM ĐANG LÀM — vẽ lại theo đúng những gì đã cho vào khay.
   Đây là phản hồi chính của game: nhìn đĩa là biết còn thiếu gì.
   ============================================================ */
const MON_SLOT = [[74, 96], [122, 92], [100, 128]];

function plateSVG(t) {
  const rice = t.rice ? riceOf(t.rice) : null;
  const rw = rice ? [0, 26, 33, 40][rice.scoop] : 0;
  const rh = rice ? [0, 15, 19, 24][rice.scoop] : 0;
  const togo = !!t.togo;

  const mons = (t.mons || []).map((k, i) => {
    const p = MON_SLOT[i] || MON_SLOT[2];
    return `<g class="pl-i" style="--i:${i}" transform="translate(${p[0]} ${p[1]}) scale(1.15)">
      <g transform="translate(-20 -20)">${ITEM_ART[k] ? ITEM_ART[k](ITEMS[k].c) : ''}</g></g>`;
  }).join('');

  return `<svg class="plate${togo ? ' togo' : ''}" viewBox="0 0 200 170" aria-hidden="true">
    <ellipse cx="100" cy="150" rx="86" ry="14" fill="#000" opacity=".07"/>
    ${togo ? `
      <path d="M22 62h156l-10 78H32z" fill="#f4e8d2" stroke="#d3bf9c" stroke-width="2.4"/>
      <path d="M22 62 100 44l78 18-78 16z" fill="#fbf3e2" stroke="#d3bf9c" stroke-width="2.4"/>
      <path d="M100 78v62" stroke="#e2d2b4" stroke-width="2"/>`
    : `
      <ellipse cx="100" cy="108" rx="88" ry="42" fill="#fffdf8" stroke="#e3d5bd" stroke-width="2.6"/>
      <ellipse cx="100" cy="106" rx="72" ry="33" fill="#fdf8ee" stroke="#ece0cc" stroke-width="1.8"/>`}

    ${rice ? `<g class="pl-i pl-rice" style="--i:0">
      <ellipse cx="${togo ? 68 : 66}" cy="${togo ? 112 : 110}" rx="${rw}" ry="${rh * .5}" fill="#f0e6d4"/>
      <path d="M${66 - rw} ${110} q${rw * .35} -${rh * 1.5} ${rw} -${rh * .2} q${rw * .65} -${rh * 1.3} ${rw} ${rh * .2} z"
        transform="translate(${togo ? 2 : 0} ${togo ? 2 : 0})" fill="#fffdf7" stroke="#e8dcc6" stroke-width="1.6"/>
      ${[[52, 104], [66, 99], [78, 104], [60, 108], [73, 108]].slice(0, rice.scoop * 2).map(([x, y]) =>
      `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.4" fill="#f3ebdc" transform="rotate(${(x * 11) % 60 - 30} ${x} ${y})"/>`).join('')}
    </g>` : ''}

    ${t.mohanh ? `<g class="pl-i pl-mh" style="--i:1">
      ${[[56, 100], [66, 96], [75, 101], [62, 105], [71, 106], [58, 94]].map(([x, y], i) =>
      `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="1.7" fill="#a8c96a" transform="rotate(${i * 37 % 70 - 35} ${x} ${y})"/>`).join('')}
      <ellipse cx="66" cy="101" rx="16" ry="8" fill="#f6dc9a" opacity=".45"/>
    </g>` : ''}

    ${mons}

    ${t.canh ? `<g class="pl-i" style="--i:3" transform="translate(166 122) scale(1.05)">
      <g transform="translate(-20 -20)">${ITEM_ART[t.canh](ITEMS[t.canh].c)}</g></g>` : ''}
    ${t.drink ? `<g class="pl-i" style="--i:4" transform="translate(30 66) scale(1.05)">
      <g transform="translate(-20 -20)">${ITEM_ART[t.drink](ITEMS[t.drink].c)}</g></g>` : ''}
    ${togo && t.bodo ? `<g class="pl-i" style="--i:5" transform="translate(168 62) scale(.92)">
      <g transform="translate(-20 -20)">${ITEM_ART.bodo(ITEMS.bodo.c)}</g></g>` : ''}
  </svg>`;
}

/* ============================================================
   KHÁCH — người ngồi chờ. 6 dáng × 5 tâm trạng, ghép từ mảnh nhỏ.
   ============================================================ */
const LOOKS = [
  { hair: 'short', c: '#4a3b32', shirt: '#8fb8d8' },
  { hair: 'bun', c: '#3a2f28', shirt: '#ef9bb0' },
  { hair: 'long', c: '#2f2620', shirt: '#a8c99a' },
  { hair: 'cap', c: '#3a2f28', shirt: '#f2c14e' },
  { hair: 'short', c: '#5a4a3a', shirt: '#c9a9d4' },
  { hair: 'long', c: '#4a3b32', shirt: '#e8a86a' }
];

function face(mood) {
  const eye = mood === 'angry' ? `<path d="M15 21l5 2M37 23l5-2" stroke="#4a3b32" stroke-width="2.2" stroke-linecap="round"/>`
    : mood === 'sad' ? `<circle cx="18" cy="23" r="2.2" fill="#4a3b32"/><circle cx="39" cy="23" r="2.2" fill="#4a3b32"/><path d="M14 19l6 2M43 19l-6 2" stroke="#4a3b32" stroke-width="1.6" stroke-linecap="round"/>`
      : mood === 'happy' ? `<path d="M14 23q4-5 8 0M35 23q4-5 8 0" stroke="#4a3b32" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
        : `<circle cx="18" cy="22" r="2.6" fill="#4a3b32"/><circle cx="39" cy="22" r="2.6" fill="#4a3b32"/>`;
  const mouth = mood === 'angry' ? `<path d="M22 34q7-5 14 0" stroke="#b9635c" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    : mood === 'sad' ? `<path d="M23 34q6-4 12 0" stroke="#b9635c" stroke-width="2" fill="none" stroke-linecap="round"/>`
      : mood === 'happy' ? `<path d="M22 30q7 8 14 0" stroke="#b9635c" stroke-width="2.4" fill="#fff" stroke-linecap="round"/>`
        : `<path d="M24 31q5 3 10 0" stroke="#b9635c" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const blush = (mood === 'happy' || mood === 'love')
    ? `<ellipse cx="13" cy="29" rx="4.4" ry="2.6" fill="#f2a8b4" opacity=".6"/><ellipse cx="44" cy="29" rx="4.4" ry="2.6" fill="#f2a8b4" opacity=".6"/>` : '';
  return eye + mouth + blush;
}

function hair(kind, c) {
  if (kind === 'bun') return `<path d="M8 22C8 10 18 4 28.5 4S49 10 49 22c0-8-8-11-20.5-11S8 14 8 22z" fill="${c}"/>
    <circle cx="28.5" cy="3" r="6" fill="${c}"/>`;
  if (kind === 'long') return `<path d="M6 24C6 10 16 3 28.5 3S51 10 51 24v20c-3 2-6-2-6-10 0-10-6-14-16.5-14S12 24 12 34c0 8-3 12-6 10z" fill="${c}"/>`;
  if (kind === 'cap') return `<path d="M7 20C7 9 17 3 28.5 3S50 9 50 20H7z" fill="${c}"/>
    <path d="M50 20c8 0 12 2 12 5H44z" fill="${shade(c, -.2)}"/>`;
  return `<path d="M8 23C8 11 17 4 28.5 4S49 11 49 23c-2-7-9-10-20.5-10S10 16 8 23z" fill="${c}"/>`;
}

/** kh: chỉ số dáng (0..5) · mood: idle|happy|sad|angry · opt.w bề rộng */
function custSVG(kh, mood, opt) {
  const L = LOOKS[kh % LOOKS.length], o = opt || {};
  return `<svg class="pers${o.cls ? ' ' + o.cls : ''}" viewBox="0 0 58 72" width="${o.w || 56}" aria-hidden="true">
    <path d="M6 72c0-12 10-19 23-19s23 7 23 19z" fill="${o.shirt || L.shirt}"/>
    <path d="M22 54h13v6H22z" fill="#f0cfae"/>
    <ellipse cx="28.5" cy="30" rx="21" ry="22" fill="#f6d9b8"/>
    ${hair(L.hair, L.c)}
    ${face(mood || 'idle')}
    ${o.regular ? `<path d="M40 60l4 8 4-8z" fill="#f2c14e"/>` : ''}
  </svg>`;
}

/** kẻ trộm — cố ý khác hẳn khách: áo tối, khẩu trang, mũ lưỡi trai */
function thiefSVG() {
  return `<svg class="thief-svg" viewBox="0 0 58 72" width="56" aria-hidden="true">
    <path d="M6 72c0-12 10-19 23-19s23 7 23 19z" fill="#4d4a57"/>
    <ellipse cx="28.5" cy="30" rx="21" ry="22" fill="#e8c6a4"/>
    <path d="M7 20C7 9 17 3 28.5 3S50 9 50 20H7z" fill="#2f3340"/>
    <path d="M50 20c8 0 12 2 12 5H44z" fill="#22262f"/>
    <path d="M8 32h41v10c0 5-8 9-20.5 9S8 47 8 42z" fill="#5b6a7a"/>
    <circle cx="19" cy="25" r="2.8" fill="#2f2620"/><circle cx="38" cy="25" r="2.8" fill="#2f2620"/>
    <path d="M12 19l8 3M45 19l-8 3" stroke="#2f2620" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

/* ============================================================
   CẢNH QUÁN — ba lớp xếp sau nhau cho có chiều sâu.
   Lớp sau (tường, bảng menu) đứng yên, lớp giữa (quầy kính) nhận
   thao tác, lớp trước (đĩa) nổi lên trên cùng.
   ============================================================ */
function shopBackSVG() {
  return `<svg class="scene-back" viewBox="0 0 400 180" preserveAspectRatio="none" aria-hidden="true">
    <rect width="400" height="180" fill="#f7e9d2"/>
    <path d="M0 0h400v16H0z" fill="#e8d3b2"/>
    ${[40, 120, 200, 280, 360].map(x => `<rect x="${x}" y="16" width="2" height="164" fill="#efdcc0"/>`).join('')}
    <g class="fan">
      <circle cx="200" cy="10" r="4" fill="#c7b193"/>
      <ellipse cx="200" cy="10" rx="46" ry="5" fill="#d9c5a6" opacity=".9"/>
      <ellipse cx="200" cy="10" rx="5" ry="30" fill="#d9c5a6" opacity=".5"/>
    </g>
    <g>
      <rect x="248" y="30" width="136" height="86" rx="6" fill="#fffaf0" stroke="#d9c09a" stroke-width="3"/>
      <path d="M258 46h116M258 60h96M258 74h108M258 88h84M258 102h64" stroke="#e5d3b6" stroke-width="5" stroke-linecap="round"/>
      <rect x="264" y="20" width="104" height="14" rx="7" fill="#e07a5f"/>
    </g>
    <g>
      <rect x="20" y="44" width="80" height="58" rx="5" fill="#fdf3e2" stroke="#d9c09a" stroke-width="3"/>
      <circle cx="60" cy="66" r="12" fill="#f4c95d"/>
      <path d="M32 88h56" stroke="#e5d3b6" stroke-width="6" stroke-linecap="round"/>
    </g>
    <rect x="126" y="60" width="90" height="46" rx="4" fill="#f2e0c4" stroke="#dcc39e" stroke-width="2.4"/>
    <path d="M136 74h70M136 86h52" stroke="#e0caa6" stroke-width="5" stroke-linecap="round"/>
  </svg>`;
}

/* ============================================================
   HẠT HIỆU ỨNG
   ============================================================ */
const FX_KINDS = ['grain', 'steam', 'drop', 'ice', 'onion', 'spark', 'star', 'puff', 'coin'];
const FX_SVG = {
  grain: '<svg viewBox="0 0 12 12"><ellipse cx="6" cy="6" rx="5" ry="3" fill="#fffdf7" stroke="#e8dcc6"/></svg>',
  steam: '<svg viewBox="0 0 12 12"><path d="M6 11c0-3 3-3 3-5.5S6 3 6 1" stroke="#cfd8dd" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  drop: '<svg viewBox="0 0 12 12"><path d="M6 1c3 4 4 5.4 4 7a4 4 0 0 1-8 0c0-1.6 1-3 4-7z" fill="#9dc4de"/></svg>',
  ice: '<svg viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="#e6f3fa" stroke="#bcd9ea"/></svg>',
  onion: '<svg viewBox="0 0 12 12"><ellipse cx="6" cy="6" rx="5" ry="2.4" fill="#a8c96a"/></svg>',
  spark: '<svg viewBox="0 0 12 12"><path d="M6 0l1.4 4.6L12 6l-4.6 1.4L6 12l-1.4-4.6L0 6l4.6-1.4z" fill="#f2c14e"/></svg>',
  star: '<svg viewBox="0 0 12 12"><path d="M6 .8l1.7 3.5 3.8.5-2.8 2.6.7 3.8L6 9.4 2.6 11.2l.7-3.8L.5 4.8l3.8-.5z" fill="#f4c95d"/></svg>',
  puff: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="#d8ccbb" opacity=".8"/></svg>',
  coin: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="#f2c14e" stroke="#d8a42c"/><path d="M6 3.2v5.6" stroke="#b98a22" stroke-width="1.4"/></svg>'
};
function fxParticle(kind, i) {
  return FX_SVG[kind] || FX_SVG.spark;
}
