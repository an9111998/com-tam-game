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
   HÌNH TỪNG MÓN — khung 40×40

   Ba quy tắc rút ra sau lần vẽ đầu bị chê "món nào cũng như món nào":
   1. DÁNG phải khác nhau trước đã. Người ta nhận ra món qua bóng dáng
      chứ không qua màu. Sườn dẹt và rộng; đùi gà tròn và có xương; chả
      hình rẻ quạt; bì là búi sợi. Bản đầu vẽ cái gì cũng là khối bo
      tròn nâu nên sườn bị đọc thành đùi gà.
   2. Mỗi món có ĐÚNG MỘT dấu hiệu nhận dạng, vẽ cho rõ: vệt cháy của
      sườn, mặt trứng của chả, lớp da phồng của heo quay, vòng mực.
   3. Có khối: chuyển màu từ sáng xuống tối, một vệt bóng, và bóng đổ
      xuống mặt khay. Thiếu bóng đổ là hình dán chứ không phải đồ ăn.

   Mã chuyển màu đặt tên theo khoá món (`suon-g`) vì id trong SVG dùng
   chung toàn trang — trùng tên là hai món dùng nhầm màu của nhau.
   ============================================================ */

/* bóng đổ dùng chung, đặt dưới mọi món */
const shadow = (cx, cy, rx, o) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx * .22).toFixed(1)}" fill="#7a5a38" opacity="${o || .16}"/>`;

/* vệt bóng dầu vắt qua mặt món, thứ làm đồ ăn trông "ướt" */
const gloss = (d, o) => `<path d="${d}" stroke="#fff" stroke-width="1.6" fill="none"
  stroke-linecap="round" opacity="${o || .4}"/>`;

const ITEM_ART = {
  /* ---------- MÓN CHÍNH ---------- */

  /* Sườn cốt lết: DẸT, RỘNG, không xương. Chính cục xương ở bản trước
     làm nó bị nhìn thành đùi gà. Vệt cháy chéo + viền mỡ xăn. */
  suon: () => `
    <defs>
      <linearGradient id="suon-g" x1=".2" y1="0" x2=".7" y2="1">
        <stop offset="0" stop-color="#dd9247"/><stop offset=".5" stop-color="#b3652b"/>
        <stop offset="1" stop-color="#83441a"/>
      </linearGradient>
    </defs>
    ${shadow(20, 30.5, 14)}
    <path d="M6.2 19.4c-.6-5.2 3-9.8 8.8-10.9 5.2-1 9.4.5 12.5 3.1 3.6 3 5.6 6.7 4.5 9.8-1.1 3.6-5.2 5.7-10.4 6.2-6.2.6-11.4-1.5-14-4.6-.9-1.1-1.3-2.3-1.4-3.6z"
      fill="url(#suon-g)" stroke="#68360f" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M6.4 21c2.1 2.6 6.2 4.2 11.4 4 5.2-.2 9.3-1.9 11.8-4.4-.2 3.1-4.4 5.6-9.8 6.1-6.2.6-11.4-1.5-13.4-5.7z"
      fill="#5c2f0d" opacity=".32"/>
    <path d="M11.6 9.6c1.1 4.2 1.7 9.3 1.3 15.1M18.4 8.7c.4 4.8.4 10.4-.4 16.2M24.9 10.8c-.6 4.4-1 9.3-1.4 13.7"
      stroke="#4f2708" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>
    <path d="M27.6 11.4c2.8 1.5 4.4 3.6 4.8 5.7.4 2.1-.4 3.8-1.7 5 .4-3.6-.9-7.4-3.1-10.7z"
      fill="#eec08a" stroke="#83441a" stroke-width=".9"/>
    ${gloss('M9 15.6c3-3.6 8.2-5.4 13.8-4.8', .45)}`,

  /* Bì: búi sợi thật, nhiều sợi mảnh chồng nhau + hạt thính rang. */
  bi: () => `
    <defs><linearGradient id="bi-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7ebc8"/><stop offset="1" stop-color="#d7ba7e"/></linearGradient></defs>
    ${shadow(20, 29.5, 13)}
    <path d="M7.2 24.6c0-4.8 5.9-8.8 12.8-8.8s12.8 4 12.8 8.8c0 3-5.9 5-12.8 5S7.2 27.6 7.2 24.6z" fill="url(#bi-g)"/>
    ${Array.from({ length: 15 }, (_, i) => {
    const y = 14.6 + (i % 8) * 1.75, x0 = 6.6 + (i % 3) * 2.4, w = 19 + (i % 4) * 3.4;
    const c = ['#c39c58', '#efdfb6', '#dcc389', '#cfae6e'][i % 4];
    return `<path d="M${x0} ${(y + 5).toFixed(1)} q${(w / 2).toFixed(1)} -${4 + (i % 3)} ${w} ${(i % 2) ? 1.2 : -1.2}"
        stroke="${c}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  }).join('')}
    ${[[12, 21], [19.4, 18.8], [26, 22], [16, 25], [24, 25.6], [21, 23]].map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r=".95" fill="#936c37"/>`).join('')}`,

  /* Chả trứng: rẻ quạt, mặt trứng bóng vàng ở trên, thân có mộc nhĩ đen
     và miến trong — ba dấu hiệu để nhận ra ngay. */
  cha: () => `
    <defs>
      <linearGradient id="cha-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#eaba58"/><stop offset="1" stop-color="#c3852c"/></linearGradient>
      <linearGradient id="cha-t" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffdd67"/><stop offset="1" stop-color="#efb638"/></linearGradient>
    </defs>
    ${shadow(20, 29.5, 12)}
    <path d="M8.6 27.4 14.4 11.4h11.2l5.8 16z" fill="url(#cha-g)" stroke="#8c5a1a" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M14.4 11.4h11.2l1.7 4.6H12.7z" fill="url(#cha-t)" stroke="#8c5a1a" stroke-width="1"/>
    <path d="M13.2 17.3h13.6" stroke="#a5701f" stroke-width=".8" opacity=".55"/>
    ${[[15, 21], [23.4, 20], [19, 24.2], [26, 24], [12.6, 25]].map(([x, y], i) =>
    `<ellipse cx="${x}" cy="${y}" rx="${(1.7 + (i % 2) * .5).toFixed(1)}" ry="1.15" fill="#3f2c1c"
        opacity=".82" transform="rotate(${i * 34 - 40} ${x} ${y})"/>`).join('')}
    ${[[18, 18.4], [25, 22], [14, 23]].map(([x, y]) =>
    `<ellipse cx="${x}" cy="${y}" rx="1.5" ry=".85" fill="#f6e7c2" opacity=".75"/>`).join('')}
    ${gloss('M15.2 13h9.6', .65)}`,

  /* Trứng ốp la: lòng trắng méo tự nhiên, viền rán vàng giòn, lòng đỏ
     nổi khối có chấm sáng. */
  opla: () => `
    <defs>
      <radialGradient id="opla-y" cx=".36" cy=".32" r=".72">
        <stop offset="0" stop-color="#ffd85c"/><stop offset=".65" stop-color="#f7b92c"/><stop offset="1" stop-color="#dd9412"/>
      </radialGradient>
    </defs>
    ${shadow(20, 28.5, 14)}
    <path d="M7.4 21.6c-2.2-6.2 2.6-12.4 9.2-12.6 4.4-.1 6.2 2.2 10 3.1 4.6 1.1 6.6 6.4 2.4 9.9-2.6 2.2-6.4 3-10.4 3-4.8 0-9.6-.8-11.2-3.4z"
      fill="#fffdf6" stroke="#e8d09a" stroke-width="1.2"/>
    <path d="M8.8 22.8c2.4 2 7 2.8 11.4 2.6 4-.2 7.6-1.2 9.6-3-1 2.6-5 4.4-10.6 4.4-5 0-8.8-1.4-10.4-4z"
      fill="#f3e2ba" opacity=".7"/>
    <circle cx="19.2" cy="18.4" r="6.4" fill="url(#opla-y)" stroke="#cf8a10" stroke-width="1"/>
    <ellipse cx="16.8" cy="16" rx="2.2" ry="1.5" fill="#fff3ae" opacity=".85"/>
    ${gloss('M10.4 15.2c2-3 5-4.6 8.4-4.8', .5)}`,

  /* Heo quay: khối vuông ba lớp — da phồng rộp ở trên, mỡ trắng, thịt
     hồng. Lớp da rỗ là dấu hiệu không lẫn với món nào. */
  heoquay: () => `
    <defs>
      <linearGradient id="hq-skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f6c977"/><stop offset="1" stop-color="#d79a3c"/></linearGradient>
      <linearGradient id="hq-meat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d59074"/><stop offset="1" stop-color="#a45f45"/></linearGradient>
    </defs>
    ${shadow(20, 30, 13)}
    <path d="M7 15.6h26v9.2c0 2-1 3.4-3 3.4H10c-2 0-3-1.4-3-3.4z" fill="url(#hq-meat)" stroke="#7d422c" stroke-width="1.1"/>
    <rect x="7" y="15.6" width="26" height="3.4" fill="#f7ece0" opacity=".92"/>
    <path d="M7 15.6c0-3.4 2-5 6.6-5h12.8c4.6 0 6.6 1.6 6.6 5z" fill="url(#hq-skin)" stroke="#a9701e" stroke-width="1.1"/>
    ${[9.6, 13, 16.4, 19.8, 23.2, 26.6, 30].map((x, i) =>
    `<circle cx="${x}" cy="${12.8 + (i % 2) * 1.1}" r="${.85 + (i % 3) * .2}" fill="#b4791f" opacity=".75"/>`).join('')}
    <path d="M12.4 19v9.2M20 19v9.2M27.6 19v9.2" stroke="#8a4e35" stroke-width=".8" opacity=".5"/>
    ${gloss('M10 12.4c4-1.6 9-2 13-1.4', .55)}`,

  /* Đùi gà: TRÒN, có xương lòi ra — giờ xương là dấu hiệu riêng của nó,
     không còn đụng với sườn nữa. */
  duiga: () => `
    <defs><radialGradient id="dg-g" cx=".36" cy=".3" r=".78">
      <stop offset="0" stop-color="#e3a95c"/><stop offset=".6" stop-color="#bd7c31"/><stop offset="1" stop-color="#8d531b"/>
    </radialGradient></defs>
    ${shadow(22, 30.5, 12)}
    <path d="M13.2 28.8c-4.2-2.1-5.8-7.2-3.7-11.9C11.9 11.8 17.2 8.4 22.8 8.8c6.2.4 10.1 4.8 10.1 10.3 0 5.8-4.8 10.3-11 10.5-3.5.1-6.3-.2-8.7-.8z"
      fill="url(#dg-g)" stroke="#71400f" stroke-width="1.2"/>
    <path d="M12.8 28.4c-2.7 2.1-4.6 3.7-5.6 5.2" stroke="#f8efdd" stroke-width="4.8" stroke-linecap="round"/>
    <path d="M12.8 28.4c-2.7 2.1-4.6 3.7-5.6 5.2" stroke="#cdb995" stroke-width="1" fill="none" stroke-linecap="round"/>
    <circle cx="6.4" cy="34.2" r="3" fill="#fdf7ea" stroke="#cdb995" stroke-width="1"/>
    ${[[20, 16.6], [26.4, 20.6], [17.4, 22.6], [24, 25.8], [21.6, 20]].map(([x, y], i) =>
    `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="1.05" fill="#66380c" opacity=".42" transform="rotate(${i * 38} ${x} ${y})"/>`).join('')}
    ${gloss('M17.6 12.6c4-1.4 8 .4 9.8 4', .45)}`,

  /* Rau xào: mấy cọng rau muống còn nguyên cọng và lá, bóng dầu, có
     lát tỏi. Dáng dài và mảnh, không lẫn với khối thịt. */
  rauxao: () => `
    ${shadow(20, 29.5, 13)}
    <path d="M6.6 26.4c3.4-7.6 9.4-13 17.4-16.2-1 8.4-6 15.2-13.4 18z" fill="#4f8f3c" stroke="#33682a" stroke-width="1"/>
    <path d="M10.6 25.6c4.4-6.2 9-10.4 14.2-13.4" stroke="#3d7a2e" stroke-width="1.1" fill="none"/>
    <path d="M20.4 28.6c2.6-6.4 7-10.4 13-12-1.2 6.8-5.6 11.4-11.4 12.8z" fill="#6aa94f" stroke="#3d7a2e" stroke-width="1"/>
    <path d="M23.6 27.6c3-4.4 6.2-7.2 9.4-8.6" stroke="#4f8f3c" stroke-width="1" fill="none"/>
    <path d="M7.6 28.4c5-1 10-1.2 15.4-.4" stroke="#7cbb5c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    ${[[14.6, 15.4], [24.4, 21], [11, 22.6]].map(([x, y], i) =>
    `<ellipse cx="${x}" cy="${y}" rx="2.3" ry="1.5" fill="#f4e4bd" stroke="#cfae6e" stroke-width=".8"
        transform="rotate(${i * 42 - 25} ${x} ${y})"/>`).join('')}
    ${gloss('M11 22c3.4-4.6 7-8 11-10.2', .3)}`,

  /* Cá chiên: con cá nguyên, vảy vàng giòn, có mắt, vây và đuôi xoè. */
  cachien: () => `
    <defs><linearGradient id="ca-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8bf7e"/><stop offset="1" stop-color="#b98a45"/></linearGradient></defs>
    ${shadow(19, 29, 13)}
    <path d="M30.6 19.8c2.4-3 5-4.4 5-4.4v9.4s-2.6-1.6-5-4.2z" fill="#dfae6d" stroke="#8d6428" stroke-width="1"/>
    <path d="M5.4 19.8c4.6-6.8 13.4-9 20-5.2 3.2 1.9 5.2 3.9 6.2 5.2-1 1.3-3 3.3-6.2 5.2-6.6 3.8-15.4 1.6-20-5.2z"
      fill="url(#ca-g)" stroke="#8d6428" stroke-width="1.2"/>
    <path d="M16.6 13.4c1.6 3.8 1.6 8.8 0 12.8M21.8 14.6c1.4 3.2 1.4 7 0 10.2" stroke="#9a6d2c" stroke-width="1" fill="none" opacity=".8"/>
    <path d="M13.6 12.6c2 .4 3.6 1.4 4.6 2.6-2 .2-3.8-.6-4.6-2.6zM13.6 27c2-.4 3.6-1.4 4.6-2.6-2-.2-3.8.6-4.6 2.6z" fill="#d3a15c"/>
    <circle cx="10.6" cy="18.2" r="2" fill="#fffdf6"/><circle cx="10.6" cy="18.2" r="1.05" fill="#3a2a18"/>
    <path d="M7.4 21.6c1.4 1.2 3 1.8 4.6 2" stroke="#8d6428" stroke-width=".9" fill="none"/>
    ${gloss('M12 15c4-2.4 9-2.6 13 .2', .4)}`,

  /* Ba rọi: ba lát nằm chồng, mỗi lát thấy rõ lớp mỡ trắng xen thịt. */
  baroi: () => `
    <defs><linearGradient id="br-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e2a48a"/><stop offset="1" stop-color="#b97158"/></linearGradient></defs>
    ${shadow(20, 30, 13)}
    ${[[5.6, 11.4, 22], [8.4, 17.6, 23], [6.6, 23.8, 25]].map(([x, y, w], i) => `
      <g>
        <rect x="${x}" y="${y}" width="${w}" height="6.2" rx="3.1" fill="url(#br-g)" stroke="#8a4a35" stroke-width="1"/>
        <rect x="${x + 1}" y="${y + 1.5}" width="${w - 2}" height="1.3" rx=".65" fill="#fdf1e6" opacity=".92"/>
        <rect x="${x + 1}" y="${y + 3.6}" width="${w - 2}" height="1.1" rx=".55" fill="#fdf1e6" opacity=".78"/>
      </g>`).join('')}
    ${gloss('M8 13.4h16', .35)}`,

  /* Tôm rim: hai con tôm cong, có râu, đuôi xoè, thân đỏ bóng nước rim. */
  tomrim: () => `
    <defs><linearGradient id="tom-g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f5875c"/><stop offset="1" stop-color="#cf4f2c"/></linearGradient></defs>
    ${shadow(20, 30, 13)}
    ${[[0, 0, 1], [13, 7, .82]].map(([dx, dy, s]) => `
      <g transform="translate(${dx} ${dy}) scale(${s})">
        <path d="M8.6 24.6c-3.4-5-1.6-11.6 4.4-13.8 5-1.8 9.8.6 11.2 5.2" fill="none" stroke="url(#tom-g)" stroke-width="5.6" stroke-linecap="round"/>
        <path d="M8.6 24.6c-3.4-5-1.6-11.6 4.4-13.8 5-1.8 9.8.6 11.2 5.2" fill="none" stroke="#a63a1c" stroke-width="1" opacity=".55"/>
        <path d="M23.4 13.4c2.8-1.8 5.6-1.6 7.4.4-2 1.8-4.8 2.6-7.6 1.6z" fill="#f2a77c" stroke="#a63a1c" stroke-width=".8"/>
        <circle cx="24.6" cy="11.4" r="1.1" fill="#3a2118"/>
        <path d="M25.6 9.4c2.4-1.6 4.6-2 6.4-1.6M25.2 8.6c1.6-2 3.4-3 5-3.2" stroke="#c8623c" stroke-width=".8" fill="none" stroke-linecap="round"/>
        <path d="M10.4 26.6c1.6 1.8 3.6 2.6 5.8 2.4" stroke="#d9633c" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </g>`).join('')}`,

  /* Mực xào: vòng mực trắng ngà xen ớt chuông và hành lá — vòng tròn
     rỗng là dấu hiệu riêng, không món nào khác có. */
  mucxao: () => `
    ${shadow(20, 29.5, 13)}
    ${[[12.6, 16.4, 6.2], [25.4, 21.4, 5.2], [17.4, 25, 4.4]].map(([cx, cy, r]) => `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#efe4d6" stroke-width="3.4"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#c9b9a4" stroke-width="1"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 1.7}" fill="none" stroke="#d8cab4" stroke-width=".7"/>`).join('')}
    <path d="M6.6 22.6c3-1.4 5.8-.6 8 1.8" stroke="#e4d7c4" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M28.6 11.4c2.2.8 3.6 2.4 4 4.6" stroke="#5f9c46" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M8.4 12.6c2 .4 3.4 1.6 4.2 3.4" stroke="#e05a3c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    ${[[31, 25], [9.4, 27.4]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.3" fill="#e05a3c" opacity=".9"/>`).join('')}
    ${gloss('M9.4 13.6c2.6 1 4.4 2.6 5.4 4.6', .35)}`,

  /* Bò nướng: lát mỏng cháy cạnh, giữa còn hồng, rắc mè. */
  bonuong: () => `
    <defs><linearGradient id="bo-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8f5136"/><stop offset=".5" stop-color="#6b3421"/><stop offset="1" stop-color="#492015"/>
    </linearGradient></defs>
    ${shadow(20, 30, 13)}
    ${[[6, 12.4, 23, -6], [9.4, 19, 22, 4], [7, 25.2, 24, -3]].map(([x, y, w, rot], i) => `
      <g transform="rotate(${rot} ${x + w / 2} ${y + 3})">
        <rect x="${x}" y="${y}" width="${w}" height="6" rx="3" fill="url(#bo-g)" stroke="#33150c" stroke-width="1"/>
        <rect x="${x + 3}" y="${y + 2.2}" width="${w - 6}" height="1.8" rx=".9" fill="#c4705a" opacity=".55"/>
        <path d="M${x + 5} ${y}v6M${x + 11} ${y}v6M${x + 17} ${y}v6" stroke="#2a1009" stroke-width="1.2" opacity=".55"/>
      </g>`).join('')}
    ${[[13, 15], [22, 21], [16, 27], [26, 17]].map(([x, y]) =>
    `<ellipse cx="${x}" cy="${y}" rx="1" ry=".62" fill="#f7eedb" opacity=".85"/>`).join('')}
    <path d="M28.6 9.6c2.2.6 3.6 2 4 4" stroke="#5f9c46" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,

  /* ---------- CANH ---------- */

  /* Tô canh khoai mỡ: nước tím đặc, có vụn khoai và hành lá, khói bay. */
  khoaimo: () => `
    <defs><linearGradient id="km-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a985cc"/><stop offset="1" stop-color="#7b5aa3"/></linearGradient></defs>
    ${shadow(20, 31, 13)}
    <path d="M9 8.6c0-1.6 1.6-1.6 1.6-3.4M16 7.6c0-1.6 1.6-1.6 1.6-3.4M23 8.6c0-1.6 1.6-1.6 1.6-3.4"
      stroke="#cdd8de" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M4.6 15.6h30.8c0 8.4-6.2 13.6-15.4 13.6S4.6 24 4.6 15.6z" fill="#fdf8ee" stroke="#d9c6a8" stroke-width="1.3"/>
    <ellipse cx="20" cy="15.8" rx="15.4" ry="3.6" fill="#ece0cd"/>
    <ellipse cx="20" cy="16" rx="13.4" ry="3" fill="url(#km-g)"/>
    <path d="M7.2 17.4c1.8 5 6.4 8 12.8 8s11-3 12.8-8c-.8 6.6-6 10.6-12.8 10.6S8 24 7.2 17.4z" fill="url(#km-g)"/>
    ${[[14.6, 15.4], [24, 16.4], [19, 14.8]].map(([x, y]) =>
    `<ellipse cx="${x}" cy="${y}" rx="1.9" ry="1" fill="#67a04c"/>`).join('')}
    <ellipse cx="14.6" cy="14.6" rx="3.4" ry="1.4" fill="#fff" opacity=".22"/>`,

  /* Tô canh khổ qua: lát khổ qua có vòng ruột và răng cưa bên ngoài. */
  khoqua: () => `
    ${shadow(20, 31, 13)}
    <path d="M11 8.2c0-1.6 1.6-1.6 1.6-3.4M20 7.4c0-1.6 1.6-1.6 1.6-3.4M28 8.6c0-1.6 1.6-1.6 1.6-3.4"
      stroke="#cdd8de" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M4.6 15.6h30.8c0 8.4-6.2 13.6-15.4 13.6S4.6 24 4.6 15.6z" fill="#fdf8ee" stroke="#d9c6a8" stroke-width="1.3"/>
    <ellipse cx="20" cy="15.8" rx="15.4" ry="3.6" fill="#ece0cd"/>
    <ellipse cx="20" cy="16" rx="13.4" ry="3" fill="#cfe0b4"/>
    <path d="M7.2 17.4c1.8 5 6.4 8 12.8 8s11-3 12.8-8c-.8 6.6-6 10.6-12.8 10.6S8 24 7.2 17.4z" fill="#cfe0b4"/>
    ${[[14.2, 16.4, 4], [25, 17.4, 3.4]].map(([cx, cy, r]) => `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#79a94e" stroke="#4f7d30" stroke-width="1"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 1.5}" fill="#e9dfa8"/>
      ${[0, 1, 2, 3, 4, 5].map(i => {
      const a = i * Math.PI / 3, x2 = (cx + Math.cos(a) * r).toFixed(1), y2 = (cy + Math.sin(a) * r).toFixed(1);
      return `<circle cx="${x2}" cy="${y2}" r=".8" fill="#5f8f3c"/>`;
    }).join('')}`).join('')}
    <ellipse cx="14" cy="14.4" rx="3" ry="1.2" fill="#fff" opacity=".25"/>`,

  /* ---------- NƯỚC ---------- */

  trada: () => `
    <defs><linearGradient id="td-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d4a469"/><stop offset="1" stop-color="#a46f36"/></linearGradient></defs>
    ${shadow(20, 36.5, 9, .13)}
    <path d="M26.4 5.4 22.6 15" stroke="#ef8fa0" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M10.6 8.4h18.8l-2.6 27.2H13.2z" fill="#eef7fb" stroke="#bdd7e4" stroke-width="1.3"/>
    <path d="M12.2 14.6h15.6l-2.1 19.4H14.3z" fill="url(#td-g)" opacity=".9"/>
    ${[[14.6, 16.6, 5.6, -8], [20.6, 22.6, 5, 12], [15.4, 27.4, 4.6, 6]].map(([x, y, s, r]) =>
    `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="1.1" fill="#fff" opacity=".62" transform="rotate(${r} ${x + s / 2} ${y + s / 2})"/>`).join('')}
    <path d="M12.6 10.4h14.8" stroke="#fff" stroke-width="1.4" opacity=".75"/>
    ${gloss('M14.4 17.6 13.4 31', .35)}`,

  nuocsuoi: () => `
    ${shadow(20, 36.5, 8, .13)}
    <path d="M16.4 4.4h7.2v3.8l2 3v22.6a2 2 0 0 1-2 2h-7.2a2 2 0 0 1-2-2V11.2l2-3z"
      fill="#eef8fc" stroke="#b7d4e4" stroke-width="1.3"/>
    <path d="M15 16.4h10v17.6H15z" fill="#a8d5ec" opacity=".75"/>
    <rect x="15.6" y="3.2" width="8.8" height="3.6" rx="1.4" fill="#5f9dc4"/>
    <rect x="14.8" y="19" width="10.4" height="7" rx="1.2" fill="#fff" opacity=".92"/>
    <path d="M16.4 21h7.2M16.4 23h5.4" stroke="#7fb6d4" stroke-width="1.1" stroke-linecap="round"/>
    ${gloss('M17.6 12 17 32', .55)}`,

  tratac: () => `
    ${shadow(20, 36.5, 9, .13)}
    <path d="M26.4 5.4 22.6 15" stroke="#7cb86a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M10.6 8.4h18.8l-2.6 27.2H13.2z" fill="#eef7fb" stroke="#bdd7e4" stroke-width="1.3"/>
    <path d="M12.2 13.6h15.6l-2.1 20.4H14.3z" fill="#eda63c" opacity=".92"/>
    <circle cx="17.4" cy="22.4" r="3.6" fill="#f9cf50" stroke="#d8a422" stroke-width="1"/>
    <path d="M17.4 18.8v7.2M13.8 22.4h7.2M14.9 19.9l5 5M19.9 19.9l-5 5" stroke="#fff3c8" stroke-width=".85"/>
    <rect x="21.4" y="26.4" width="4.6" height="4.6" rx="1.1" fill="#fff" opacity=".55"/>
    ${gloss('M14.2 16.4 13.4 30', .35)}`,

  trachanh: () => `
    ${shadow(20, 36.5, 9, .13)}
    <path d="M26.4 5.4 22.6 15" stroke="#7cb86a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M10.6 8.4h18.8l-2.6 27.2H13.2z" fill="#eef7fb" stroke="#bdd7e4" stroke-width="1.3"/>
    <path d="M12.2 13.6h15.6l-2.1 20.4H14.3z" fill="#dce86a" opacity=".85"/>
    <path d="M13.6 21.6a5.2 5.2 0 0 1 10.4 0z" fill="#ecf5a0" stroke="#b9c94e" stroke-width="1"/>
    <path d="M18.8 21.6v-5.2M14.6 19.2l4.2 2.4M23 19.2l-4.2 2.4" stroke="#f8fcd8" stroke-width=".9"/>
    <path d="M24.6 25.4c2.4-1.2 3.8 0 3.6 2.2-.2 2.2-2.4 3-3.6 2z" fill="#5f9c46"/>
    <path d="M25 25.8c.6 1.4.6 2.6 0 3.8" stroke="#3f7530" stroke-width=".8" fill="none"/>
    ${gloss('M14.2 16.4 13.4 30', .35)}`,

  /* ---------- CƠM, MỠ HÀNH, DỤNG CỤ ---------- */

  /* Chén mỡ hành: dầu vàng sóng sánh, hành lá xanh nổi lên, có bóng. */
  mohanh: () => `
    ${shadow(20, 29.5, 12)}
    <path d="M6.4 16.4h27.2c0 6.6-5.4 10.8-13.6 10.8S6.4 23 6.4 16.4z" fill="#fdf8ee" stroke="#d9c6a8" stroke-width="1.3"/>
    <ellipse cx="20" cy="16.6" rx="13.6" ry="3.2" fill="#ece0cd"/>
    <ellipse cx="20" cy="16.8" rx="11.8" ry="2.7" fill="#f4d67f"/>
    <path d="M8.6 18c1.6 4.2 5.6 6.6 11.4 6.6s9.8-2.4 11.4-6.6c-.8 5.6-5.4 8.8-11.4 8.8S9.4 23.6 8.6 18z" fill="#f4d67f"/>
    ${[[13.4, 17.4, 25], [18.6, 19.4, -20], [24.4, 17.8, 40], [21.4, 15.6, -35], [15.6, 20.6, 12], [26, 20.4, -15]].map(([x, y, r]) =>
    `<ellipse cx="${x}" cy="${y}" rx="2.3" ry="1.05" fill="#5f9c46" transform="rotate(${r} ${x} ${y})"/>`).join('')}
    <ellipse cx="14.6" cy="15.4" rx="3.2" ry="1.2" fill="#fff" opacity=".4"/>`,

  /* Cơm tấm: ụ cơm hạt gãy, có hạt rời quanh chân, khói bay lên. */
  com: () => `
    ${shadow(20, 30.5, 14)}
    <path d="M12.6 9.6c0-1.8 1.8-1.8 1.8-3.8M20 8.4c0-1.8 1.8-1.8 1.8-3.8M27.4 9.6c0-1.8 1.8-1.8 1.8-3.8"
      stroke="#d6e1e7" stroke-width="1.7" fill="none" stroke-linecap="round" opacity=".9"/>
    <ellipse cx="20" cy="28.4" rx="14.4" ry="3.4" fill="#f3ebdb"/>
    <path d="M6.4 26.4c1.2-7.8 6.8-13 13.6-13s12.4 5.2 13.6 13c-3.2 2.6-8.2 4-13.6 4s-10.4-1.4-13.6-4z"
      fill="#fffdf8" stroke="#e4d7c0" stroke-width="1.2"/>
    ${[[13.6, 22.4, 22], [20, 18.6, -14], [26.2, 22.2, 32], [16.6, 25.4, -30], [23.4, 25.2, 15], [20, 22.8, 48], [10.6, 25.6, -10], [29.4, 25.4, 20]]
      .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.25" fill="#f2e9d6" stroke="#e6dac4" stroke-width=".5" transform="rotate(${r} ${x} ${y})"/>`).join('')}
    ${[[7.4, 29.4], [32, 29.2], [11, 30.4]].map(([x, y]) =>
    `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="1" fill="#f6efe0" stroke="#e6dac4" stroke-width=".5"/>`).join('')}
    <ellipse cx="15.4" cy="18.6" rx="4.4" ry="2" fill="#fff" opacity=".55"/>`,

  hop: () => `
    ${shadow(20, 33, 13)}
    <path d="M6.4 14.6 20 9.4l13.6 5.2L20 19.8z" fill="#fbf3e2" stroke="#c9b48c" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M6.4 14.6v13.2L20 33V19.8z" fill="#f0e3c8" stroke="#c9b48c" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M33.6 14.6v13.2L20 33V19.8z" fill="#e3d3b2" stroke="#c9b48c" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M12.6 17.2v4.2" stroke="#c9b48c" stroke-width="1.1"/>
    <rect x="23.4" y="22.4" width="7.4" height="4.4" rx="1" fill="#fdf8ec" opacity=".85" transform="rotate(-8 27 24.6)"/>
    ${gloss('M9 15.6 19 12', .5)}`,

  bodo: () => `
    ${shadow(20, 35.5, 11, .13)}
    <path d="M8.6 34 12.6 8.6" stroke="#c9a06a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M12.6 34 16.6 8.6" stroke="#b98f59" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M23.6 34V20.4" stroke="#e4ecf2" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M23.6 34V20.4" stroke="#bccdd8" stroke-width="1" stroke-linecap="round" fill="none"/>
    <ellipse cx="23.6" cy="15.4" rx="4.4" ry="5.6" fill="#f2f7fa" stroke="#bccdd8" stroke-width="1.2"/>
    <ellipse cx="22.2" cy="13.4" rx="1.6" ry="2.2" fill="#fff" opacity=".9"/>
    <path d="M31.4 7.4v27" stroke="#ef8fa0" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M31.4 7.4 34.6 10.6" stroke="#ef8fa0" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M31.4 14v6" stroke="#fff" stroke-width="1" opacity=".6"/>`
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
