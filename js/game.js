/* ============================================================
   TIỆM CƠM TẤM — logic game
   Vanilla JS, không framework, lưu bằng localStorage.
   ============================================================ */

/* ---------- tiện ích ---------- */
const $ = id => document.getElementById(id);
const fmt = n => (Math.round(n / 100) / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'k';
const fmtBig = n => n >= 1e9 ? (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ'
  : n >= 1e6 ? (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' triệu' : fmt(n);
const rnd = a => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const wpick = (arr, w) => {
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i] }
  return arr[0];
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1000 = n => Math.max(1000, Math.round(n / 1000) * 1000);
const pct = v => Math.round((v - 1) * 100);

/* ---------- STATE ---------- */
let S, R = { mode: 'prep', tab: 'kho', plan: {}, st: 'com' }, tray, timer = null, uid = 0;

const newRec = d => ({
  day: d, sales: {}, tips: 0, ing: {}, waste: {}, spoil: { n: 0, v: 0 },
  rent: 0, util: 0, tax: 0, wage: 0, served: 0, lost: 0, starSum: 0, starN: 0,
  rush: 0, stolen: 0, lent: 0, back: 0, deadDebt: 0, interest: 0
});

function fresh() {
  const s = {
    money: CFG.startMoney, day: 1, stock: {}, unlocked: {}, upg: {},
    sell: { ...DEF_SELL }, reviews: [], served: 0, best: 0, totalRev: 0, totalProfit: 0,
    shopName: '', history: [], cur: newRec(1), yearRev: 0, taxYear: 0,
    market: {}, soldout: {}, debts: [], loans: [], regulars: [],
    paidBack: 0, deadDebt: 0, seenLv: 1, coachDone: false, vib: true,
    badPlan: mkBadPlan(1)
  };
  STOCK_KEYS.forEach(k => { s.stock[k] = []; s.market[k] = 1 });
  Object.keys(ITEMS).forEach(k => s.unlocked[k] = ITEMS[k].unlock === 0);
  return s;
}

const newTray = () => ({ rice: 0, mons: [], canh: null, drink: null, mohanh: false, togo: false, bodo: false, cost: 0, used: false });

/* ---------- KHO THEO MẺ, CÓ HẠN DÙNG ----------
   Mỗi lần nhập là một mẻ riêng có ngày hết hạn. Lấy hàng luôn lấy mẻ
   cũ nhất trước, cuối ngày mẻ quá hạn bị huỷ và tính vào lỗ. Đây là
   thứ tạo ra câu hỏi khó nhất của game: sáng nay nhập bao nhiêu?     */
function lifeOf(k) {
  const l = CFG.life[k];
  /* tủ kính giữ nóng giúp món mặn trụ thêm một ngày */
  return l && S.upg.tukinh && ITEMS[k].type === 'mon' ? l + 1 : l;
}
function addStock(k, q, st = S) {
  if (!q) return;
  const l = lifeOf(k), exp = l ? st.day + l - 1 : 99999;
  const b = st.stock[k].find(x => x.exp === exp);
  if (b) b.q += q; else { st.stock[k].push({ q, exp }); st.stock[k].sort((a, c) => a.exp - c.exp) }
}
const qty = k => (S.stock[k] || []).reduce((a, b) => a + b.q, 0);
function take(k, n = 1) {
  if (qty(k) < n) return false;
  while (n > 0) {
    const b = (S.stock[k] || []).find(x => x.q > 0);
    if (!b) return false;
    const u = Math.min(b.q, n); b.q -= u; n -= u;
  }
  S.stock[k] = S.stock[k].filter(x => x.q > 0);
  return true;
}
function expireStock() {
  const out = [];
  STOCK_KEYS.forEach(k => {
    let q = 0;
    S.stock[k] = (S.stock[k] || []).filter(b => { if (b.exp <= S.day) { q += b.q; return false } return true });
    if (q) out.push({ k, q, v: q * buyCost(k) });
  });
  return out;
}
const lifeTxt = k => { const l = lifeOf(k); return l ? (l === 1 ? 'Bán trong ngày' : 'Để được ' + l + ' ngày') : 'Không hết hạn' };
function soonExp(k) {
  const b = (S.stock[k] || []).find(x => x.q > 0);
  return b && b.exp < 99999 ? b.exp - S.day + 1 : null;
}
/* món coi như không bán được: hết hàng hoặc chủ quán tự treo bảng hết */
const off = k => qty(k) <= 0 || !!S.soldout[k];
const sellable = k => S.unlocked[k] && !off(k);

/* ---------- LƯU / TẢI ---------- */
function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)) } catch (e) { R.noStore = true } }
function loadFrom(d) {
  const f = fresh();
  S = {
    ...f, ...d, stock: { ...f.stock, ...d.stock }, sell: { ...f.sell, ...d.sell },
    unlocked: { ...f.unlocked, ...d.unlocked }, market: { ...f.market, ...d.market }
  };
  STOCK_KEYS.forEach(k => { if (!Array.isArray(S.stock[k])) S.stock[k] = []; if (!S.market[k]) S.market[k] = 1 });
  ['debts', 'loans', 'regulars', 'history', 'reviews'].forEach(k => { if (!Array.isArray(S[k])) S[k] = [] });
  if (!S.soldout) S.soldout = {};
  if (!d.cur) S.cur = newRec(S.day);
  if (S.evDay !== S.day) rollDay(S.day);
  if (!d.badPlan) S.badPlan = mkBadPlan(S.day);
  if (S.seenLv == null) S.seenLv = levelOf(Math.max(1, S.day - 1));
}
function load() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE) } catch (e) { }
  if (raw) { try { loadFrom(JSON.parse(raw)); return true } catch (e) { } }
  S = fresh(); return false;
}

/* ============================================================
   CHỢ ĐẦU MỐI — giá nhập trôi mỗi ngày
   Chợ đắt lên thì khách cũng biết và thông cảm, nên trần "chê đắt"
   nới theo. Đó là lúc phải tăng giá bán chứ không phải cắn lỗ.
   ============================================================ */
function rollMarket() {
  STOCK_KEYS.forEach(k => {
    const m = S.market[k] || 1;
    /* bước ngẫu nhiên, có lực kéo nhẹ về 1 để giá không trôi mãi một chiều */
    const next = m * (.955 + Math.random() * .1) + (1 - m) * .18;
    S.market[k] = Math.round(clamp(next, .74, 1.55) * 100) / 100;
  });
  S.mNews = null;
  if (S.day >= 3 && Math.random() < .42) {
    const n = rnd(MARKET_NEWS), up = Math.random() < .68;
    n.ks.forEach(k => {
      if (S.market[k] == null) return;
      S.market[k] = Math.round(clamp(S.market[k] * (up ? 1.16 + Math.random() * .2 : .84 - Math.random() * .1), .7, 1.7) * 100) / 100;
    });
    S.mNews = { t: n.t, up, ks: n.ks.filter(k => S.market[k] != null) };
  }
}
const mkt = k => S.market[k] || 1;
/* giá nhập hôm nay: giá gốc × chợ × (giảm giá nếu có sự kiện chợ sớm) */
const buyCost = k => Math.round(CFG.cost[k] * mkt(k) * (evIs('chosom') ? .75 : 1) / 100) * 100;
/* chỉ số chợ chung, lấy theo mấy món nặng tiền nhất trong đĩa cơm */
function mktIdx() {
  const ks = [...MAIN_KEYS, 'com', ...CANH_KEYS];
  const w = ks.reduce((a, k) => a + CFG.cost[k], 0);
  return ks.reduce((a, k) => a + mkt(k) * CFG.cost[k], 0) / w;
}
/* khách chịu giá cao hơn bao nhiêu khi chợ đắt */
const priceTol = () => clamp(1 + .6 * (mktIdx() - 1), .92, 1.42);
const capOf = () => Math.round(CFG.itemCap * priceTol());
/* Giá bán gợi ý theo chợ hôm nay — nút "Theo chợ" dùng đúng con số này.
   Phải chặn dưới trần chê đắt: giá do CHÍNH GAME gợi ý mà làm khách bỏ đi
   thì người chơi không thể tránh được. Đã từng xảy ra khi một món sốt giá
   riêng lẻ (chợ chung vẫn bình thường nên trần không nới theo). */
const suggest = k => Math.min(
  r1000(DEF_SELL[k] * (1 + .85 * (mkt(k) - 1))),
  Math.floor(capOf() / 1000) * 1000
);

/* ---------- KINH TẾ ---------- */
const sellMax = k => CFG.itemCap * 3;
const sv = k => { const v = +S.sell[k]; return isFinite(v) && v > 0 ? Math.min(v, sellMax(k)) : 0 };
const svDef = k => DEF_SELL[k] || 0;
const riceKey = n => 'com' + clamp(n || 0, 0, 3);

function price(o) {
  let p = o.rice ? sv(riceKey(o.rice)) : 0;
  (o.mons || []).forEach(k => p += sv(k));
  if (o.canh) p += sv(o.canh);
  if (o.drink) p += sv(o.drink);
  if (o.mohanh) p += sv('mohanh');
  return p;
}
function priceDef(o) {
  let p = o.rice ? svDef(riceKey(o.rice)) : 0;
  (o.mons || []).forEach(k => p += svDef(k));
  if (o.canh) p += svDef(o.canh);
  if (o.drink) p += svDef(o.drink);
  if (o.mohanh) p += svDef('mohanh');
  return p;
}
function unitCost(o) {
  let c = (o.rice || 0) * buyCost('com');
  (o.mons || []).forEach(k => c += buyCost(k));
  if (o.canh) c += buyCost(o.canh);
  if (o.drink) c += buyCost(o.drink);
  if (o.mohanh) c += buyCost('mohanh');
  if (o.togo) c += buyCost('hop') + buyCost('bodo');
  return c;
}
const priceIdx = o => price(o) / Math.max(1, priceDef(o) * priceTol());
const overCap = o => price(o) > CFG.priceCap * priceTol();
const orderPricey = o => priceIdx(o) > 1.3;
/* những món người chơi đang để giá cao tới mức khách quay lưng */
const pricyItems = () => Object.keys(DEF_SELL).filter(k => (k.startsWith('com') || S.unlocked[k]) && sv(k) > capOf());
const upgCount = () => UPG.filter(u => S.upg[u.id]).length;
const wageDay = () => STAFF.reduce((a, x) => a + (S.upg[x.id] ? CFG[x.wage] : 0), 0);
const fixed = () => ({ rent: CFG.rent, util: CFG.utilBase + upgCount() * CFG.utilPerUpg });
function rating() {
  const r = S.reviews.slice(0, 40);
  return r.length ? r.reduce((a, x) => a + x.s, 0) / r.length : 4;
}
const starStr = v => { const f = Math.round(v); return '★'.repeat(f) + '☆'.repeat(5 - f) };
const recRev = r => Object.values(r.sales).reduce((a, x) => a + x.a, 0) + r.tips;
const recCost = r => Object.values(r.ing).reduce((a, v) => a + v, 0) + r.rent + r.util + r.tax + r.wage
  + (r.bad || 0) + r.rush + r.stolen + r.deadDebt + r.interest;

/* ---------- CẤP ĐỘ ---------- */
const levelOf = d => { const L = CFG.levels; return d >= L.l4 ? 4 : d >= L.l3 ? 3 : d >= L.l2 ? 2 : 1 };
const level = () => levelOf(S.day);
const maxMon = () => level() >= 4 ? 3 : level() >= 2 ? 2 : 1;
const hasStation = id => { const s = STATIONS.find(x => x.id === id); return !!s && level() >= s.lv };
const stationList = () => STATIONS.filter(s => level() >= s.lv);
const dayLen = () => CFG.dayMin;
function gameClock() {
  const tot = dayLen() * 60, el = clamp(1 - R.t / tot, 0, 1), m = 6 * 60 + Math.floor(el * 480 / 5) * 5;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
const riceCap = () => CFG.riceBase + (S.upg.noicom ? CFG.ricePerUpg : 0);

/* ---------- THỜI TIẾT + SỰ KIỆN ---------- */
const wxKey = () => (R.running && R.wx) || S.wx || 'nang';
const wx = () => WEATHER[wxKey()] || WEATHER.nang;
const isRain = () => wxKey() === 'rao' || wxKey() === 'dam';
/* mái che kéo phần khách bị mưa cuốn đi về một nửa */
function wxMul() {
  const w = wx();
  return isRain() && S.upg.maiche ? 1 - (1 - w.mul) * .5 : w.mul;
}
const ev = () => S.evDay === S.day ? S.ev : null;
const evIs = id => { const e = ev(); return !!e && e.id === id };

function mkBadPlan(start) {
  const r = Math.random(), n = r < .35 ? 0 : r < .75 ? 1 : 2;
  const ids = BAD.map(b => b.id).sort(() => Math.random() - .5), days = [];
  for (let i = 0; i < n; i++) days.push({ day: start + 3 + Math.floor(Math.random() * 27), id: ids[i] });
  return { until: start + 30, days };
}
function rollDay(d) {
  S.evDay = d;
  rollMarket();
  S.wx = wpick(WX_KEYS, WX_W);
  /* hai ngày đầu để yên cho người chơi làm quen: nắng đẹp, không sự kiện */
  if (d <= 2) { S.wx = d === 1 ? 'nang' : 'mat'; S.ev = null; S.gift = null; S.badToday = null; S.mNews = null; return }
  const ids = Object.keys(EVS);
  S.ev = Math.random() < .6 ? { id: rnd(ids), k: rnd([...MAIN_KEYS, ...DRINK_KEYS].filter(k => S.unlocked[k])) } : null;
  const gp = GIFTS.filter(g => !g.need || g.need());
  S.gift = Math.random() < .13 && gp.length
    ? (() => { const g = rnd(gp); return { n: g.n, d: g.d, v: r1000(g.min + Math.random() * (g.max - g.min)) } })() : null;
  if (!S.badPlan || d > S.badPlan.until) S.badPlan = mkBadPlan(d);
  const hit = (S.badPlan.days || []).find(x => x.day === d);
  S.badToday = hit ? (() => { const b = BAD.find(y => y.id === hit.id); return { n: b.n, d: b.d, v: r1000(b.min + Math.random() * (b.max - b.min)) } })() : null;
}
function evText(e) {
  return e && EVS[e.id] ? EVS[e.id].d.replace('%', e.k && ITEMS[e.k] ? low(ITEMS[e.k].n) : 'một món') : '';
}

function traffic() {
  let t = 1;
  if (S.upg.bang) t *= 1.2;
  if (S.upg.fb) t *= 1.25;
  t *= wxMul();
  const e = ev(); if (e && EVS[e.id]) t *= EVS[e.id].mul;
  const rt = rating();
  t *= rt >= 4.5 ? 1.25 : rt >= 4 ? 1.1 : rt >= 3 ? .9 : .65;
  /* khách quen tin mình thì dắt thêm người tới */
  t *= 1 + Math.min(.25, S.regulars.filter(r => r.trust > .6).length * .03);
  return t;
}

/* ---------- ĐÁNH GIÁ ---------- */
function addReview(s, why, c) {
  const mon = c && c.order && (c.order.mons || []).length ? ITEMS[rnd(c.order.mons)].n : 'cơm tấm';
  const pool = TXT[why] || TXT.ok;
  let t = rnd(pool).replace(/\{mon\}/g, low(mon)).replace(/\{kh\}/g, c ? c.name : 'khách');
  t += rnd(TAIL[s] || ['']);
  S.reviews.unshift({ s, t, d: S.day, who: c ? c.name : genName() });
  if (S.reviews.length > 400) S.reviews.pop();
  S.revTotal = (S.revTotal || 0) + 1;
  if (R.today) R.today.stars.push(s);
}
/* chọn giới trước rồi mới chọn cách gọi, để không ra "Chị Duy" */
const genName = () => Math.random() < .55
  ? rnd(KH_XUNG_NU) + ' ' + rnd(KH_NU)
  : rnd(KH_XUNG_NAM) + ' ' + rnd(KH_NAM);
const revCount = () => Math.max(S.revTotal || 0, S.reviews.length);

/* ---------- RUNG + TOAST + MODAL ---------- */
function vib(p) {
  if (!S || !S.vib || !navigator.vibrate) return;
  try { navigator.vibrate(p) } catch (e) { }
}
let toastT = null;
function toast(msg, ms, cls) {
  const e = $('toast'); if (!e) return;
  e.className = cls || '';
  e.innerHTML = msg; e.hidden = false; e.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => { e.classList.remove('on'); setTimeout(() => e.hidden = true, 250) }, ms || 2400);
}
function ask(html, btns) {
  const c = $('card');
  c.innerHTML = html + `<div class="askrow">` +
    btns.map((b, i) => `<button class="${b[2] ? 'big' : 'sbtn'}" data-a="${i}">${b[0]}</button>`).join('') + `</div>`;
  $('modal').hidden = false;
  c.querySelectorAll('[data-a]').forEach(el => el.onclick = () => {
    $('modal').hidden = true; const f = btns[+el.dataset.a][1]; if (f) f();
  });
}

/* ---------- HOẠT ẢNH ---------- */
const lessMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
let fxTimers = [];
function fillParticles(layer, cfg) {
  const R0 = () => Math.random() * 2 - 1;
  for (let i = 0; i < cfg.n; i++) {
    const p = document.createElement('i');
    p.className = `fxp p-${cfg.p} fa-${cfg.a}`;
    p.style.setProperty('--x', (R0() * 34).toFixed(1) + 'px');
    p.style.setProperty('--y', (R0() * 26).toFixed(1) + 'px');
    p.style.setProperty('--dx', (R0() * 48).toFixed(1) + 'px');
    p.style.setProperty('--dy', (R0() * 34).toFixed(1) + 'px');
    p.style.setProperty('--rot', Math.round(R0() * 180) + 'deg');
    p.style.setProperty('--sz', (10 + Math.random() * 8).toFixed(1) + 'px');
    p.style.setProperty('--dur', (cfg.d / 1000).toFixed(2) + 's');
    p.style.animationDelay = (i * .05).toFixed(3) + 's';
    p.innerHTML = fxParticle(cfg.p, i);
    layer.appendChild(p);
  }
}
function fxDone(el, cfg) {
  fxTimers.push(setTimeout(() => el.remove(), cfg.d + cfg.n * 60 + 150));
  if (fxTimers.length > 60) fxTimers = fxTimers.slice(-30);
}
/** bắn hạt tại vị trí một phần tử; gắn vào body nên vẫn chạy dù vùng
 *  đó được vẽ lại ngay sau đó */
function burstAt(el, key) {
  const cfg = FXMAP[key];
  if (!cfg || lessMotion() || !el) return;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return;
  const layer = document.createElement('div');
  layer.className = 'fxlayer';
  layer.style.left = (r.left + r.width / 2) + 'px';
  layer.style.top = (r.top + r.height / 2) + 'px';
  fillParticles(layer, cfg);
  document.body.appendChild(layer);
  if (cfg.lbl) {
    const l = document.createElement('div');
    l.className = 'fxlbl';
    l.textContent = cfg.lbl;
    l.style.left = (r.left + r.width / 2) + 'px';
    l.style.top = (r.top - 6) + 'px';
    document.body.appendChild(l);
    fxTimers.push(setTimeout(() => l.remove(), 950));
  }
  fxDone(layer, cfg);
}
function clearFX() {
  fxTimers.forEach(clearTimeout); fxTimers = [];
  document.querySelectorAll('.fxlayer,.fxlbl,.flyer,.float').forEach(e => e.remove());
}
function fl(el, t, bad) {
  if (!el) return;
  const r = el.getBoundingClientRect(), f = document.createElement('div');
  f.className = 'float' + (bad ? ' bad' : '');
  f.textContent = t;
  f.style.left = (r.left + r.width / 2) + 'px';
  f.style.top = (r.top + 10) + 'px';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1100);
}

/** MÓN BAY TỪ KHAY VÀO ĐĨA — hoạt ảnh dịch chuyển giữa các món.
 *  Nhân bản hình món rồi cho bay theo đường cong tới giữa đĩa. */
function flyTo(fromEl, html) {
  if (!fromEl || lessMotion()) return;
  const to = $('plateBox');
  if (!to) return;
  const a = fromEl.getBoundingClientRect(), b = to.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'flyer';
  f.innerHTML = html;
  f.style.left = (a.left + a.width / 2) + 'px';
  f.style.top = (a.top + a.height / 2) + 'px';
  document.body.appendChild(f);
  const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
  const dy = (b.top + b.height * .58) - (a.top + a.height / 2);
  f.style.setProperty('--dx', dx.toFixed(0) + 'px');
  f.style.setProperty('--dy', dy.toFixed(0) + 'px');
  f.style.setProperty('--mx', (dx * .5).toFixed(0) + 'px');
  f.style.setProperty('--my', (dy * .5 - 54).toFixed(0) + 'px');
  requestAnimationFrame(() => f.classList.add('go'));
  fxTimers.push(setTimeout(() => f.remove(), 560));
}

/* ---------- VUỐT / CHẠM ----------
   Một chỗ duy nhất hiểu cử chỉ: vuốt bốn hướng và chạm. Nhờ vậy cả
   quầy, đĩa và thẻ khách dùng chung một cách hiểu, không lệch nhau.  */
function bindGest(el, h) {
  if (!el) return;
  let x0 = 0, y0 = 0, t0 = 0, on = false;
  const TH = 38;
  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    on = true; x0 = e.clientX; y0 = e.clientY; t0 = performance.now();
  });
  el.addEventListener('pointerup', e => {
    if (!on) return; on = false;
    const dx = e.clientX - x0, dy = e.clientY - y0, dt = performance.now() - t0;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (ax < TH && ay < TH) { if (dt < 700 && h.tap) h.tap(e); return }
    if (ax > ay) { if (dx < 0 && h.left) h.left(e); else if (dx > 0 && h.right) h.right(e) }
    else { if (dy < 0 && h.up) h.up(e); else if (dy > 0 && h.down) h.down(e) }
  });
  el.addEventListener('pointercancel', () => { on = false });
}

/* ---------- HEADER ---------- */
function head() {
  const h = $('hd'); if (!h) return;
  const w = wx();
  h.innerHTML = `
    <div class="hb"><span class="hl">${ic('money')}</span><b>${fmtBig(S.money)}</b></div>
    <div class="hb"><span class="hl">${ic('calendar')}</span><b>Ngày ${S.day}</b></div>
    ${R.running ? `<div class="hb"><span class="hl">${ic('clock')}</span><b>${gameClock()}</b></div>` : ''}
    <div class="hb wxb" style="--wc:${w.c}" title="${w.n}"><span class="hl">${ic(w.ic)}</span></div>
    <div class="hb"><span class="hl">${ic('star')}</span><b>${rating().toFixed(1).replace('.', ',')}</b></div>`;
}

/* ---------- LỚP THỜI TIẾT ----------
   Mưa và nắng phủ toàn màn hình, nằm ngoài khung game nên không ảnh
   hưởng tới thao tác. Số hạt mưa cố định, không sinh thêm mỗi khung. */
function paintWeather() {
  const e = $('wx'); if (!e) return;
  const k = wxKey();
  e.className = 'wx-' + k;
  if (lessMotion()) { e.innerHTML = ''; return }
  if (e.dataset.k === k) return;
  e.dataset.k = k;
  if (k === 'rao' || k === 'dam') {
    const n = k === 'dam' ? 46 : 28;
    e.innerHTML = Array.from({ length: n }, (_, i) =>
      `<i class="rd" style="left:${(i * 100 / n + Math.random() * 2).toFixed(1)}%;
        animation-delay:${(Math.random() * 1.2).toFixed(2)}s;
        animation-duration:${(.5 + Math.random() * .35).toFixed(2)}s;
        --h:${(12 + Math.random() * 14).toFixed(0)}px"></i>`).join('')
      + `<div class="wxglass"></div>`;
  } else if (k === 'gat') {
    e.innerHTML = `<div class="sunray"></div><div class="heat"></div>`;
  } else if (k === 'nang') {
    e.innerHTML = `<div class="sunray soft"></div>`;
  } else e.innerHTML = '';
}

/* ============================================================
   MÀN CHUẨN BỊ
   ============================================================ */
const TABS = [
  { id: 'kho', n: 'Kho', i: 'box' },
  { id: 'cho', n: 'Chợ & giá', i: 'price' },
  { id: 'quan', n: 'Quán', i: 'tools' },
  { id: 'no', n: 'Sổ nợ', i: 'book' },
  { id: 'danhgia', n: 'Khen', i: 'star' },
  { id: 'tongket', n: 'Sổ sách', i: 'chart' }
];

function renderPrep() {
  R.mode = 'prep'; R.running = false; R.wx = null;
  clearFX(); paintWeather();
  const pane = { kho: paneKho, cho: paneCho, quan: paneQuan, no: paneNo, danhgia: paneRev, tongket: paneSum }[R.tab] || paneKho;
  $('view').innerHTML = `
    <div class="prep">
      ${dayBanner()}
      <div class="tabs">${TABS.map(t => `<button class="tab${R.tab === t.id ? ' on' : ''}" data-tab="${t.id}">${ic(t.i)}<span>${t.n}</span></button>`).join('')}</div>
      <div class="pane">${pane()}</div>
      <button class="big open" id="openBtn">${ic('bell')} Mở cửa — ngày ${S.day}</button>
    </div>`;
  head();
  $('view').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { R.tab = b.dataset.tab; renderPrep() });
  $('openBtn').onclick = () => prepChecks();
  bindPane();
}

function dayBanner() {
  const w = wx(), e = ev(), parts = [];
  parts.push(`<div class="bn wxbn" style="--wc:${w.c}"><span>${ic(w.ic)}</span><div><b>${w.n}</b><i>${w.d}</i></div></div>`);
  if (e && EVS[e.id]) parts.push(`<div class="bn"><span>${ic(EVS[e.id].ic)}</span><div><b>${EVS[e.id].n}</b><i>${evText(e)}</i></div></div>`);
  if (S.mNews) parts.push(`<div class="bn${S.mNews.up ? ' warn' : ' good'}"><span>${ic(S.mNews.up ? 'chartup' : 'chartdown')}</span>
    <div><b>${S.mNews.t}</b><i>${S.mNews.ks.map(k => ishort(k) + ' ' + (pct(mkt(k)) >= 0 ? '+' : '') + pct(mkt(k)) + '%').join(' · ')}</i></div></div>`);
  const lv = level();
  if (S.seenLv < lv) parts.push(`<div class="bn lv"><span>${ic('trophy')}</span><div><b>Cấp ${lv}</b><i>${LV_TXT[lv]}</i></div></div>`);
  return parts.join('');
}

/* ---------- KHO ---------- */
const planTotal = () => Object.keys(R.plan).reduce((a, k) => a + R.plan[k] * buyCost(k), 0);

function stockRow(k) {
  const it = ITEMS[k], q = qty(k), p = R.plan[k] || 0, se = soonExp(k), m = mkt(k);
  if (!S.unlocked[k]) return `
    <div class="row lock" data-unlock="${k}">
      ${itemArt(k, 30)}
      <div class="rn"><b>${it.n}</b><i>${ic('lock')} Mở khoá ${fmtBig(it.unlock)}</i></div>
      <button class="sbtn" data-unlock="${k}">Mở</button>
    </div>`;
  const mv = pct(m);
  return `
    <div class="row">
      ${itemArt(k, 30)}
      <div class="rn"><b>${it.n}</b><i>Còn ${q} · ${lifeTxt(k)}${se != null ? ` · <em class="exp${se <= 1 ? ' hot' : ''}">mẻ cũ còn ${se} ngày</em>` : ''}</i></div>
      <div class="qty">
        <button class="qb" data-m="${k}">−</button>
        <span class="qn${p ? ' on' : ''}">${p}</span>
        <button class="qb" data-p="${k}">+</button>
      </div>
      <span class="pz">${fmt(buyCost(k))}${mv ? `<em class="${mv > 0 ? 'up' : 'dn'}">${mv > 0 ? '+' : ''}${mv}%</em>` : ''}</span>
    </div>`;
}

function paneKho() {
  const grp = [
    { n: 'Cơm — nấu theo muôi', keys: ['com'], i: 'rice' },
    { n: 'Món chính', keys: MAIN_KEYS, i: 'plate' },
    { n: 'Canh', keys: CANH_KEYS, i: 'soup', lv: 3 },
    { n: 'Nước', keys: DRINK_KEYS, i: 'cup', lv: 2 },
    { n: 'Mỡ hành', keys: ['mohanh'], i: 'oil', lv: 2 },
    { n: 'Dụng cụ mang đi', keys: SUP_KEYS, i: 'box', lv: 3 }
  ].filter(g => !g.lv || level() >= g.lv);
  const tot = planTotal(), exp = expected();
  const cook = (R.plan.com || 0) + qty('com');
  return `
    <div class="hint">${ic('warn')} Cơm tính theo <b>muôi</b>: ít 1 muôi, vừa 2, nhiều 3. Nồi nhà bạn nấu được
      <b>${riceCap()} muôi</b> mỗi ngày${cook > riceCap() ? ` — đang tính ${cook} muôi, quá nồi rồi` : ''}.
      Hôm nay chắc bán được khoảng <b>${exp.parts} phần</b>.</div>
    ${grp.map(g => `<h4>${ic(g.i)} ${g.n}</h4>` + g.keys.map(stockRow).join('')).join('')}
    <div class="buybar">
      <div>Tạm tính <b>${fmt(tot)}</b> · Két ${fmt(S.money)}</div>
      <button class="big" id="buyBtn" ${tot ? '' : 'disabled'}>Nhập hàng</button>
    </div>`;
}

/* Dự kiến hôm nay bán được bao nhiêu PHẦN. Người chơi nhập hàng theo
   con số này nên nó phải sát thực tế, và quan trọng hơn: KHÔNG ĐƯỢC
   tụt theo một ngày mưa. Lấy hôm qua làm mốc thì một ngày vắng sẽ khiến
   hôm sau nhập thiếu, hôm sau nữa lại càng thiếu — vòng xoáy đó làm
   người chơi lỗ mà không hiểu vì sao.
   Cách làm: lấy ba ngày gần nhất, chia lại cho thời tiết của chính
   ngày đó để ra sức bán "trung tính", rồi mới nhân thời tiết hôm nay. */
function expected() {
  const slots = S.upg.ban4 ? 5 : 3;
  const recent = S.history.filter(r => r.served > 0).slice(-3);
  const norm = r => r.served / ((WEATHER[r.wx] || WEATHER.nang).mul || 1);
  const base = recent.length ? Math.max(...recent.map(norm)) : slots * 5 * traffic() / wxMul();
  let p = base * wxMul() * (ev() && EVS[ev().id] ? EVS[ev().id].mul : 1) * 1.15;
  if (pricyItems().length) p *= .25;
  const cap = slots * 14 * (1 + (S.upg.nv1 ? .2 : 0) + (S.upg.nv2 ? .2 : 0));
  p = clamp(p, slots * 2, cap);
  return { parts: Math.round(p), rice: Math.round(p * 2.1) };
}

/* ---------- CHỢ & GIÁ ---------- */
function priceRow(k) {
  const isRice = k.startsWith('com') && k !== 'com';
  if (!isRice && !S.unlocked[k]) return '';
  const nm = isRice ? riceOf(+k.slice(3)).n : ITEMS[k].n;
  const v = sv(k), sg = suggest(k), bad = v > capOf();
  const cost = isRice ? buyCost('com') * (+k.slice(3)) : buyCost(k);
  return `
    <div class="row">
      ${itemArt(isRice ? 'com' : k, 30)}
      <div class="rn"><b>${nm}</b><i>Nhập ${fmt(cost)} · theo chợ nên bán ${fmt(sg)}${bad ? ` · <em class="exp hot">đắt quá</em>` : ''}</i></div>
      <input class="pin" type="number" inputmode="numeric" data-sell="${k}" value="${v}" step="1000">
    </div>`;
}
function paneCho() {
  const idx = mktIdx(), up = pct(idx), tol = capOf();
  const movers = STOCK_KEYS.filter(k => S.unlocked[k] && Math.abs(pct(mkt(k))) >= 8)
    .sort((a, b) => mkt(b) - mkt(a)).slice(0, 6);
  return `
    <div class="hint ${up > 6 ? 'warn' : ''}">${ic(up >= 0 ? 'chartup' : 'chartdown')}
      Chợ hôm nay ${up === 0 ? 'y như hôm qua' : (up > 0 ? `<b>đắt hơn ${up}%</b>` : `<b>rẻ hơn ${-up}%</b>`)}.
      ${up > 6 ? `Khách ngoài chợ cũng thấy vậy nên đang <b>thông cảm</b>: giờ bán tới <b>${fmt(tol)}</b> một món mới bị chê đắt.
        Chợ lên thì giá bán phải lên, đừng cắn lỗ.` : `Khách sẽ chê đắt nếu một món vượt <b>${fmt(tol)}</b>.`}</div>
    ${movers.length ? `<h4>${ic('price')} Biến động đáng chú ý</h4>
      <div class="mkt">${movers.map(k => {
    const v = pct(mkt(k));
    return `<div class="mk ${v > 0 ? 'up' : 'dn'}">${itemArt(k, 26)}<b>${ishort(k)}</b><em>${v > 0 ? '+' : ''}${v}%</em></div>`;
  }).join('')}</div>` : ''}
    <button class="sbtn wide" id="autoPrice">${ic('reload')} Đặt lại toàn bộ giá bán theo chợ hôm nay</button>
    <h4>${ic('rice')} Cơm</h4>${RICE.map(r => priceRow(r.k)).join('')}
    <h4>${ic('plate')} Món chính</h4>${MAIN_KEYS.map(priceRow).join('')}
    ${level() >= 3 ? `<h4>${ic('soup')} Canh</h4>${CANH_KEYS.map(priceRow).join('')}` : ''}
    ${level() >= 2 ? `<h4>${ic('cup')} Nước</h4>${DRINK_KEYS.map(priceRow).join('')}
      <h4>${ic('oil')} Mỡ hành</h4>${priceRow('mohanh')}` : ''}`;
}

/* ---------- QUÁN: nâng cấp + nhân viên ---------- */
function paneQuan() {
  const card = (u, isStaff) => {
    const owned = !!S.upg[u.id];
    return `
      <div class="upcard${owned ? ' own' : ''}">
        <span class="upi">${ic(u.i)}</span>
        <div class="upn"><b>${u.n}</b><i>${u.d}${isStaff ? ` · lương ${fmt(CFG[u.wage])}/ngày` : ''}</i></div>
        ${owned ? `<span class="tag">${ic('check')} có</span>` : `<button class="sbtn" data-upg="${u.id}">${fmt(u.cost)}</button>`}
      </div>`;
  };
  return `
    <div class="hint">${ic('tools')} Trang bị làm quán chạy mượt hơn nhưng tiền điện nước tăng
      <b>${fmt(CFG.utilPerUpg)}</b> mỗi thứ. Nhân viên thì ăn lương mỗi ngày, kể cả ngày vắng khách.</div>
    <h4>${ic('people')} Nhân viên</h4>${STAFF.map(s => card(s, true)).join('')}
    <h4>${ic('tools')} Trang bị</h4>${UPG.map(u => card(u)).join('')}`;
}

/* ---------- SỔ NỢ: cho khách vay + mình vay ---------- */
function paneNo() {
  const owed = S.debts.reduce((a, d) => a + d.amt, 0);
  const debt = S.loans.reduce((a, l) => a + l.amt, 0);
  const bank = S.loans.find(l => l.kind === 'bank'), hot = S.loans.find(l => l.kind === 'hot');
  return `
    <div class="hint">${ic('book')} Khách quen hết tiền có thể xin ghi nợ. Cho vay thì được lòng người ta —
      họ quay lại và dắt thêm khách — nhưng cũng có người không trả. Người hay ghé và trả đúng hẹn thì đáng tin hơn.</div>
    <h4>${ic('hand')} Khách đang nợ mình — ${fmt(owed)}</h4>
    ${S.debts.length ? S.debts.map(d => `
      <div class="row">
        ${custSVG(d.look, d.late ? 'sad' : 'idle', { w: 34 })}
        <div class="rn"><b>${d.who}</b><i>${d.late ? `<em class="exp hot">trễ ${d.late} ngày</em> · ` : `hẹn trả ngày ${d.due} · `}tin cậy ${Math.round(d.trust * 100)}%</i></div>
        <span class="pz">${fmt(d.amt)}</span>
      </div>`).join('')
      : `<p class="empty">Chưa ai nợ. ${level() >= 3 ? 'Khách quen sẽ hỏi khi họ bí tiền.' : 'Từ cấp 3 khách quen mới hỏi vay.'}</p>`}
    ${S.paidBack || S.deadDebt ? `<p class="note">Đã thu lại ${fmt(S.paidBack || 0)} · mất trắng ${fmt(S.deadDebt || 0)}</p>` : ''}

    <h4>${ic('money')} Mình đang vay — ${fmt(debt)}</h4>
    <div class="row">
      <span class="upi">${ic('receipt')}</span>
      <div class="rn"><b>Vay ngân hàng</b><i>Tối đa ${fmt(CFG.bankMax)} · lãi ${CFG.bankRate}%/năm</i></div>
      ${bank ? `<button class="sbtn" data-pay="bank">Trả ${fmt(bank.amt)}</button>`
      : `<button class="sbtn" data-loan="bank">Vay</button>`}
    </div>
    <div class="row">
      <span class="upi">${ic('fire')}</span>
      <div class="rn"><b>Vay nóng ngoài</b><i>Tối đa ${fmt(CFG.hotMax)} · lãi ${CFG.hotRate}%/năm, nhận liền</i></div>
      ${hot ? `<button class="sbtn" data-pay="hot">Trả ${fmt(hot.amt)}</button>`
      : `<button class="sbtn" data-loan="hot">Vay</button>`}
    </div>
    ${debt ? `<p class="note">Mỗi ngày trả lãi ${fmt(dayInterest())}. Két âm là phá sản, nhớ chừa tiền.</p>` : ''}

    ${S.regulars.length ? `<h4>${ic('heart')} Khách quen</h4>
      <div class="regs">${S.regulars.slice(0, 12).map(r => `
        <div class="reg" title="${r.visits} lần ghé">${custSVG(r.look, r.trust > .6 ? 'happy' : 'idle', { w: 38, regular: r.trust > .6 })}
          <b>${r.name.split(' ').slice(-1)[0]}</b><em>${Math.round(r.trust * 100)}%</em></div>`).join('')}</div>` : ''}`;
}
const dayInterest = () => Math.round(S.loans.reduce((a, l) => a + l.amt * l.rate / 100 / 360, 0));
/* tiền hàng đã nhập của ngày gần nhất — thước đo vốn lưu động cần giữ */
function lastIngSpend() {
  const r = [...S.history].reverse().find(x => Object.keys(x.ing || {}).length);
  return r ? Object.values(r.ing).reduce((a, v) => a + v, 0) : 0;
}

/* ---------- ĐÁNH GIÁ ---------- */
function paneRev() {
  const rt = rating();
  return `
    <div class="ratebox">
      <b>${rt.toFixed(1).replace('.', ',')}</b>
      <span class="stars">${starStr(rt)}</span>
      <i>${revCount()} lời khách để lại · tính theo 40 lời gần nhất</i>
    </div>
    ${S.reviews.length ? S.reviews.slice(0, 40).map(r => `
      <div class="rev s${r.s}">
        <div class="rvh"><b>${r.who}</b><span>${starStr(r.s)}</span></div>
        <p>${r.t}</p><i>ngày ${r.d}</i>
      </div>`).join('') : `<p class="empty">Chưa có ai nhận xét. Bán ngày đầu đi rồi biết.</p>`}`;
}

/* ---------- SỔ SÁCH ---------- */
function paneSum() {
  const h = [...S.history].reverse().slice(0, 14);
  const tot = S.history.reduce((a, r) => a + recRev(r) - recCost(r), 0);
  return `
    <div class="kpis">
      <div><b>${S.served}</b><span>phần đã bán</span></div>
      <div><b>${fmtBig(Math.max(0, tot))}</b><span>lãi tích luỹ</span></div>
      <div><b>${S.best || S.day}</b><span>ngày trụ được</span></div>
    </div>
    ${h.length ? `<h4>${ic('chart')} 14 ngày gần nhất</h4>
      <div class="hist">${h.map(r => {
      const p = recRev(r) - recCost(r);
      return `<div class="hrow"><span>Ngày ${r.day}</span>
        <span>${r.served} phần</span>
        <span>${r.starN ? (r.starSum / r.starN).toFixed(1).replace('.', ',') + '★' : '–'}</span>
        <span class="${p < 0 ? 'neg' : 'pos'}">${p < 0 ? '−' : '+'}${fmt(Math.abs(p))}</span></div>`;
    }).join('')}</div>` : `<p class="empty">Chưa có ngày nào xong.</p>`}
    <h4>${ic('receipt')} Chi phí cố định mỗi ngày</h4>
    <div class="ledger">
      <div><span>Thuê mặt bằng</span><span>${fmt(CFG.rent)}</span></div>
      <div><span>Điện nước gas</span><span>${fmt(fixed().util)}</span></div>
      ${wageDay() ? `<div><span>Lương nhân viên</span><span>${fmt(wageDay())}</span></div>` : ''}
      ${dayInterest() ? `<div><span>Lãi vay</span><span>${fmt(dayInterest())}</span></div>` : ''}
      <div class="tot"><span>Mỗi ngày phải gánh</span><span>${fmt(CFG.rent + fixed().util + wageDay() + dayInterest())}</span></div>
    </div>
    <button class="sbtn wide" id="resetBtn">${ic('trash')} Xoá tiến trình, chơi lại từ đầu</button>`;
}

/* ---------- SỰ KIỆN TRONG MÀN CHUẨN BỊ ---------- */
function bindPane() {
  const v = $('view');
  v.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
    const k = b.dataset.p;
    R.plan[k] = (R.plan[k] || 0) + (k === 'com' ? 10 : 1);
    vib(8); renderPrep();
  });
  v.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    const k = b.dataset.m;
    R.plan[k] = Math.max(0, (R.plan[k] || 0) - (k === 'com' ? 10 : 1));
    vib(8); renderPrep();
  });
  v.querySelectorAll('[data-unlock]').forEach(b => b.onclick = () => unlockItem(b.dataset.unlock));
  v.querySelectorAll('[data-upg]').forEach(b => b.onclick = () => buyUpg(b.dataset.upg));
  v.querySelectorAll('[data-sell]').forEach(i => i.onchange = () => {
    S.sell[i.dataset.sell] = clamp(Math.round(+i.value || 0), 0, sellMax());
    save(); renderPrep();
  });
  v.querySelectorAll('[data-loan]').forEach(b => b.onclick = () => askLoan(b.dataset.loan));
  v.querySelectorAll('[data-pay]').forEach(b => b.onclick = () => payLoan(b.dataset.pay));
  const bb = $('buyBtn'); if (bb) bb.onclick = doBuy;
  const ap = $('autoPrice'); if (ap) ap.onclick = () => {
    Object.keys(DEF_SELL).forEach(k => S.sell[k] = suggest(k));
    save(); toast('Đã đặt lại giá bán theo chợ hôm nay'); vib(14); renderPrep();
  };
  const rb = $('resetBtn'); if (rb) rb.onclick = () => ask(
    `<div class="pbig">${ic('warn')}</div><h2>Chơi lại từ đầu?</h2><p>Toàn bộ tiến trình sẽ mất.</p>`,
    [['Thôi', null], ['Xoá và chơi lại', () => { S = fresh(); save(); renderPrep() }, 1]]);
}

function doBuy() {
  const tot = planTotal();
  if (!tot) return;
  if (tot > S.money) { toast('Không đủ tiền. Bớt lại chút hoặc vào Sổ nợ vay tạm'); vib(60); return }
  const rice = (R.plan.com || 0) + qty('com');
  if (rice > riceCap()) {
    toast(`Nồi cơm chỉ nấu được ${riceCap()} muôi. Mua nồi to hơn ở tab Quán nhé`); vib(60); return;
  }
  Object.keys(R.plan).forEach(k => {
    if (!R.plan[k]) return;
    addStock(k, R.plan[k]);
    S.cur.ing[k] = (S.cur.ing[k] || 0) + R.plan[k] * buyCost(k);
    /* nhập lại thì tự hạ bảng "hết món" xuống */
    if (S.soldout[k]) delete S.soldout[k];
  });
  S.money -= tot; R.plan = {};
  save(); sfx('buy'); vib(18); toast('Đã nhập hàng ' + fmt(tot)); renderPrep();
}

function unlockItem(k) {
  const c = ITEMS[k].unlock;
  if (S.money < c) { toast('Cần ' + fmt(c) + ' để mở ' + low(ITEMS[k].n)); vib(60); return }
  /* Cảnh báo khi mở khoá ăn hết vốn nhập hàng. Mở nhiều món một lúc còn
     làm khách tản ra nhiều món hơn, nên cùng số hàng lại dễ hết lẻ tẻ —
     hai thứ cộng lại đủ làm sập cả tuần mà không hiện lỗi gì. */
  const spent = lastIngSpend();
  const left = S.money - c;
  const tight = spent && left < spent * 1.6;
  ask(`<div class="pbig">${itemArt(k, 64)}</div><h2>Mở ${ITEMS[k].n}?</h2>
    <p>Tốn <b>${fmt(c)}</b> tiền học món và dụng cụ. Sau đó nhập hàng như mọi món khác,
       giá nhập hôm nay ${fmt(buyCost(k))}.</p>
    ${tight ? `<p class="lvup warn">${ic('warn')} Mở xong chỉ còn <b>${fmt(left)}</b>, mà hôm qua
      nhập hàng đã tốn <b>${fmt(spent)}</b>. Thiếu vốn nhập là hết món giữa buổi,
      rồi hôm sau càng ít tiền nhập. Nên để dành thêm một, hai ngày.</p>` : ''}`,
    [['Thôi', null], ['Mở món', () => {
      S.money -= c; S.unlocked[k] = true;
      if (!S.sell[k]) S.sell[k] = suggest(k);
      save(); sfx('unlock'); vib([14, 40, 14]); toast('Mở khoá ' + ITEMS[k].n); renderPrep();
    }, 1]]);
}

function buyUpg(id) {
  const u = [...UPG, ...STAFF].find(x => x.id === id);
  if (!u || S.upg[id]) return;
  if (S.money < u.cost) { toast('Chưa đủ tiền'); vib(60); return }
  ask(`<div class="pbig">${ic(u.i)}</div><h2>${u.n}</h2><p>${u.d}</p>
    ${u.wage ? `<p class="note">Lương <b>${fmt(CFG[u.wage])}</b> mỗi ngày, trả cả ngày vắng khách.</p>`
      : `<p class="note">Điện nước tăng thêm <b>${fmt(CFG.utilPerUpg)}</b> mỗi ngày.</p>`}`,
    [['Thôi', null], [u.wage ? 'Thuê ' + fmt(u.cost) : 'Mua ' + fmt(u.cost), () => {
      S.money -= u.cost; S.upg[id] = true;
      save(); sfx('unlock'); vib([14, 40, 14]); toast(u.n + ' xong!'); renderPrep();
    }, 1]]);
}

/* ---------- VAY VỐN ---------- */
function askLoan(kind) {
  const max = kind === 'bank' ? CFG.bankMax : CFG.hotMax;
  const rate = kind === 'bank' ? CFG.bankRate : CFG.hotRate;
  ask(`<div class="pbig">${ic(kind === 'bank' ? 'receipt' : 'fire')}</div>
    <h2>${kind === 'bank' ? 'Vay ngân hàng' : 'Vay nóng'}</h2>
    <p>Lãi <b>${rate}%/năm</b>, tính mỗi ngày <b>${fmt(Math.round(max * rate / 100 / 360))}</b> nếu vay hết mức.
      ${kind === 'hot' ? 'Nhận tiền liền nhưng lãi cắt cổ — chỉ nên dùng khi bí thật.' : 'Duyệt trong ngày.'}</p>
    <div class="loanpick">${[.25, .5, 1].map(f => `<button class="sbtn" data-amt="${Math.round(max * f)}">${fmt(max * f)}</button>`).join('')}</div>`,
    [['Thôi', null]]);
  $('card').querySelectorAll('[data-amt]').forEach(b => b.onclick = () => {
    const amt = +b.dataset.amt;
    S.loans.push({ kind, amt, rate, day: S.day });
    S.money += amt; save(); $('modal').hidden = true;
    sfx('buy'); toast('Đã vay ' + fmt(amt)); renderPrep();
  });
}
function payLoan(kind) {
  const l = S.loans.find(x => x.kind === kind);
  if (!l) return;
  if (S.money < l.amt) { toast('Chưa đủ tiền trả hết. Cứ bán tiếp đã'); vib(60); return }
  S.money -= l.amt; S.loans = S.loans.filter(x => x !== l);
  save(); toast('Trả xong nợ ' + (kind === 'bank' ? 'ngân hàng' : 'nóng')); renderPrep();
}

/* ---------- KIỂM TRA TRƯỚC KHI MỞ CỬA ---------- */
function prepChecks() {
  const warn = [];
  if (qty('com') < 10) warn.push('Chưa có cơm — không có cơm thì không bán được phần nào');
  if (MAIN_KEYS.filter(sellable).length === 0) warn.push('Không còn món chính nào để bán');
  if (level() >= 3 && MAIN_KEYS.filter(sellable).length < 2) warn.push('Chỉ còn một món chính, hết là phải mời khách đổi');
  const pi = pricyItems();
  if (pi.length) warn.push('Giá ' + pi.slice(0, 3).map(k => low(k.startsWith('com') && k !== 'com' ? riceOf(+k.slice(3)).n : ITEMS[k].n)).join(', ') + ' cao quá, 80% khách sẽ bỏ đi');
  if (!warn.length) { startDay(); return }
  ask(`<div class="pbig">${ic('warn')}</div><h2>Mở cửa luôn?</h2>
    ${warn.map(w => `<p>· ${w}</p>`).join('')}`,
    [['Để mình sửa', null], ['Cứ mở cửa', startDay, 1]]);
}

/* ============================================================
   MÀN BÁN HÀNG
   ============================================================ */
function startDay() {
  /* Bản ghi của ngày phải luôn khớp với ngày đang chơi. Lệch nhau thì
     sổ sách cuối ngày ghi sai số ngày và mọi thống kê sau đó lệch theo. */
  if (!S.cur || S.cur.day !== S.day) S.cur = newRec(S.day);
  R = {
    mode: 'play', running: true, paused: false, t: dayLen() * 60,
    slots: Array.from({ length: S.upg.ban4 ? 5 : 3 }, () => null),
    focus: null, st: 'com', spawnT: 1.5, tk: 0, wx: S.wx, wxTurn: false,
    rush: [], thief: null, thiefAt: thiefSchedule(), coach: S.coachDone ? -1 : 0,
    today: { served: 0, lost: 0, wrong: 0, rev: 0, tips: 0, cogs: 0, stars: [], priceLost: 0, swap: 0, stolen: 0, rush: 0, lent: 0, riceUsed: 0 },
    plan: {}, tab: R.tab
  };
  tray = newTray();
  clearFX();
  renderPlay();
  clearInterval(timer);
  timer = setInterval(tick, 100);
  sfx('open');
  vib(20);
}

/* giờ kẻ trộm ghé, nằm trong khoảng giữa buổi cho đỡ đoán trước */
function thiefSchedule() {
  if (S.day < 5) return null;
  if (Math.random() > .45) return null;
  const tot = dayLen() * 60;
  return tot * (.25 + Math.random() * .5);
}

function renderPlay() {
  $('view').innerHTML = `
    <div class="play">
      <div class="lane" id="lane"></div>
      <div class="scene" id="scene">
        ${shopBackSVG()}
        <div class="stage" id="stage"></div>
        <div class="thiefbox" id="thiefbox"></div>
      </div>
      <div class="stbar" id="stbar"></div>
      <div class="plateZone">
        <div class="ticket" id="ticket"></div>
        <div class="plateBox" id="plateBox"></div>
        <div class="platebtns">
          <button class="sbtn" id="dumpBtn">${ic('trash')} Bỏ làm lại</button>
          <button class="big go" id="serveBtn">${ic('hand')} Đưa khách</button>
        </div>
        <i class="swipetip">${ic('swipe')} Vuốt đĩa lên để đưa · vuốt xuống để bỏ</i>
      </div>
      <div class="playbar">
        <button class="sbtn" id="pauseBtn">${ic('pause')}</button>
        <button class="sbtn" id="sndBtn" aria-label="Tiếng">${ic(SND ? 'sound' : 'mute')}</button>
        <button class="sbtn" id="vibBtn" aria-label="Rung">${ic(S.vib ? 'vib' : 'viboff')}</button>
        <span class="pinfo" id="pinfo"></span>
      </div>
      <div class="coach" id="coach" hidden></div>
    </div>`;
  paintWeather();
  renderStBar(); renderStage(); renderLane(); renderPlate();
  $('pauseBtn').onclick = pauseGame;
  $('sndBtn').onclick = () => { toggleSnd(); $('sndBtn').innerHTML = ic(SND ? 'sound' : 'mute') };
  $('vibBtn').onclick = () => {
    S.vib = !S.vib; save(); $('vibBtn').innerHTML = ic(S.vib ? 'vib' : 'viboff');
    vib(20); toast(S.vib ? 'Đã bật rung' : 'Đã tắt rung');
  };
  $('dumpBtn').onclick = dumpTray;
  $('serveBtn').onclick = () => serveFocus();

  /* vuốt ngang trên cả khu quầy để đi giữa các khu món */
  bindGest($('scene'), { left: () => stepStation(1), right: () => stepStation(-1) });
  /* vuốt lên đĩa là đưa khách, vuốt xuống là bỏ làm lại */
  bindGest($('plateBox'), { up: () => serveFocus(), down: () => dumpTray(), tap: () => nextFocus() });
  head(); renderCoach();
}

/* ---------- thanh chọn khu ---------- */
function renderStBar() {
  const b = $('stbar'); if (!b) return;
  const list = stationList();
  b.innerHTML = list.map(s => `<button class="stb${R.st === s.id ? ' on' : ''}" data-st="${s.id}">
      ${ic(s.i)}<span>${s.n}</span>${stNeed(s.id) ? '<em class="dot"></em>' : ''}</button>`).join('');
  b.querySelectorAll('[data-st]').forEach(x => x.onclick = () => goStation(x.dataset.st));
}
/* khu này còn việc phải làm cho đơn đang chọn — chấm đỏ nhắc người chơi */
function stNeed(id) {
  const c = focusCust(); if (!c) return false;
  const o = c.order; if (!o) return false;
  if (id === 'com') return tray.rice !== o.rice || (!!o.mohanh !== !!tray.mohanh);
  if (id === 'mon') return [...tray.mons].sort().join() !== [...o.mons].sort().join();
  if (id === 'canh') return (o.canh || null) !== (tray.canh || null);
  if (id === 'nuoc') return (o.drink || null) !== (tray.drink || null);
  if (id === 'goi') return !!o.togo !== !!tray.togo || (o.togo && !tray.bodo);
  return false;
}
function stepStation(d) {
  const list = stationList(), i = list.findIndex(s => s.id === R.st);
  const j = clamp(i + d, 0, list.length - 1);
  if (j === i) return;
  goStation(list[j].id, d);
}
function goStation(id, dir) {
  if (R.st === id) return;
  const list = stationList();
  const from = list.findIndex(s => s.id === R.st), to = list.findIndex(s => s.id === id);
  R.st = id;
  renderStBar();
  renderStage(dir || (to > from ? 1 : -1));
  vib(8); sfx('slide');
  coachCheck();
}

/* ---------- KHU MÓN — nội dung thay đổi theo khu đang đứng ---------- */
function renderStage(dir) {
  const st = $('stage'); if (!st) return;
  const body = { com: stageCom, mon: stageMon, canh: stageCanh, nuoc: stageNuoc, goi: stageGoi }[R.st] || stageCom;
  st.innerHTML = `<div class="stpanel${dir ? (dir > 0 ? ' in-l' : ' in-r') : ''}">${body()}</div>`;
  st.querySelectorAll('[data-tapk]').forEach(b => b.onclick = () => tapItem(b.dataset.tapk, b));
  const pot = st.querySelector('#ricePot');
  if (pot) pot.onclick = () => tapRice(pot);
  const mh = st.querySelector('#mhBowl');
  if (mh) mh.onclick = () => tapMoHanh(mh);
  st.querySelectorAll('[data-rush]').forEach(b => b.onclick = () => rushBuy(b.dataset.rush));
  st.querySelectorAll('[data-so]').forEach(b => b.onclick = () => toggleSoldout(b.dataset.so));
}

/* Khu của bạn múc cơm: nồi cơm và chén mỡ hành nằm CÙNG một khu, đúng
   như phân việc của nhân viên 1. Gộp lại còn giúp cả khu vừa một màn
   hình điện thoại, không phải cuộn trong lúc khách đang chờ.          */
function stageCom() {
  const c = focusCust(), o = c && c.order, want = o ? o.rice : 0;
  const left = qty('com'), lv2 = level() >= 2;
  return `
    <div class="sthead">${ic('rice')} Nồi cơm${lv2 ? ' + mỡ hành' : ''} <em>còn ${left} muôi</em></div>
    <div class="ricearea">
      <button class="pot${left <= 0 ? ' out' : ''}" id="ricePot" ${left <= 0 ? 'disabled' : ''}>
        <span class="potart">${itemArt('com', 74)}</span>
        <b>Chạm để múc</b>
        <em>${tray.rice ? riceOf(tray.rice).s + ' — ' + tray.rice + ' muôi' : 'chưa có cơm'}</em>
      </button>
      <div class="ricehelp">
        ${RICE.map(r => `<div class="rh${tray.rice === r.id ? ' on' : ''}${want === r.id ? ' want' : ''}">
          <b>${r.id} lần</b><span>${r.n}</span>${want === r.id ? `<em>${ic('hand')} khách gọi</em>` : ''}</div>`).join('')}
        ${lv2 ? `<button class="rh mhrh${tray.mohanh ? ' on' : ''}${off('mohanh') ? ' out' : ''}"
            id="mhBowl" ${off('mohanh') ? 'disabled' : ''}>
          ${itemArt('mohanh', 24)}<span>${tray.mohanh ? 'Đã chan mỡ hành' : 'Chan mỡ hành'}</span>
          <em>${off('mohanh') ? 'hết' : qty('mohanh')}</em>
          ${o && o.mohanh && !tray.mohanh ? `<span class="wantdot"></span>` : ''}</button>` : ''}
      </div>
    </div>
    ${left <= 0 ? `<div class="hint warn">${ic('warn')} Hết cơm! ${rushBtn('com', 'Nấu thêm nồi cơm')}</div>` : ''}
    ${lv2 && off('mohanh') ? `<div class="hint warn">${ic('warn')} Hết mỡ hành. ${rushBtn('mohanh', 'Chạy mua mỡ hành')}</div>` : ''}`;
}

function monBtn(k) {
  const q = qty(k), out = off(k), sel = tray.mons.filter(x => x === k).length;
  const c = focusCust(), want = c && c.order ? c.order.mons.filter(x => x === k).length : 0;
  return `<button class="dish${sel ? ' on' : ''}${out ? ' out' : ''}${want > sel ? ' want' : ''}"
      data-tapk="${k}" ${out ? 'disabled' : ''}>
    ${itemArt(k, 46)}
    <b>${ITEMS[k].s}</b>
    <em>${out ? (S.soldout[k] ? 'treo bảng' : 'hết') : 'còn ' + q}</em>
    ${sel ? `<span class="badge">${sel}</span>` : ''}
    ${want > sel ? `<span class="wantdot"></span>` : ''}
  </button>`;
}

function stageMon() {
  const ks = MAIN_KEYS.filter(k => S.unlocked[k]);
  const outs = ks.filter(off);
  return `
    <div class="sthead">${ic('plate')} Khay món mặn <em>chạm để gắp vào đĩa</em></div>
    <div class="dishes">${ks.map(monBtn).join('')}</div>
    ${outs.length ? `<div class="hint warn">${ic('warn')} Hết: <b>${outs.map(ishort).join(', ')}</b>.
      Khách đã gọi rồi thì mời họ đổi món ở thẻ khách, hoặc chạy chợ gấp.
      <div class="rushrow">${outs.slice(0, 3).map(k => rushBtn(k, 'Mua ' + low(ITEMS[k].s))).join('')}</div></div>` : ''}
    ${/* Bảng "hết món" chỉ hiện từ cấp 2. Cấp 1 mới có bốn món và chưa có
          gì để cân đo, thêm hàng nút này chỉ làm màn đầu rối hơn. */
    level() >= 2 ? `<div class="sooff">${ks.filter(k => qty(k) > 0).map(k => `
      <button class="sochip${S.soldout[k] ? ' on' : ''}" data-so="${k}">${S.soldout[k] ? ic('lock') : ic('check')}${ishort(k)}</button>`).join('')}</div>
    <i class="stnote">Bấm vào tên món ở hàng trên để <b>treo bảng hết món</b> — khách sẽ không gọi món đó nữa.</i>` : ''}`;
}

function stageCanh() {
  const ks = CANH_KEYS.filter(k => S.unlocked[k]);
  return `
    <div class="sthead">${ic('soup')} Nồi canh <em>mỗi phần một chén</em></div>
    <div class="dishes pair">${ks.map(k => {
    const out = off(k), sel = tray.canh === k;
    const c = focusCust(), want = c && c.order && c.order.canh === k;
    return `<button class="dish${sel ? ' on' : ''}${out ? ' out' : ''}${want && !sel ? ' want' : ''}" data-tapk="${k}" ${out ? 'disabled' : ''}>
        ${itemArt(k, 56)}<b>${ITEMS[k].s}</b><em>${out ? 'hết' : 'còn ' + qty(k)}</em>
        ${want && !sel ? '<span class="wantdot"></span>' : ''}</button>`;
  }).join('')}</div>
    ${ks.filter(off).length ? `<div class="hint warn">${ic('warn')} Hết canh.
      <div class="rushrow">${ks.filter(off).map(k => rushBtn(k, 'Mua ' + low(ITEMS[k].s))).join('')}</div></div>` : ''}`;
}

function stageNuoc() {
  const ks = DRINK_KEYS.filter(k => S.unlocked[k]);
  return `
    <div class="sthead">${ic('cup')} Thùng nước <em>${wx().drink > 1.2 ? 'trời nắng, nước bán chạy' : 'rót cho khách'}</em></div>
    <div class="dishes">${ks.map(k => {
    const out = off(k), sel = tray.drink === k;
    const c = focusCust(), want = c && c.order && c.order.drink === k;
    return `<button class="dish${sel ? ' on' : ''}${out ? ' out' : ''}${want && !sel ? ' want' : ''}" data-tapk="${k}" ${out ? 'disabled' : ''}>
        ${itemArt(k, 46)}<b>${ITEMS[k].s}</b><em>${out ? 'hết' : 'còn ' + qty(k)}</em>
        ${want && !sel ? '<span class="wantdot"></span>' : ''}</button>`;
  }).join('')}</div>
    ${ks.filter(off).length ? `<div class="hint warn">${ic('warn')} Hết nước.
      <div class="rushrow">${ks.filter(off).map(k => rushBtn(k, 'Mua ' + low(ITEMS[k].s))).join('')}</div></div>` : ''}`;
}

function stageGoi() {
  const c = focusCust(), want = c && c.order ? c.order.togo : false;
  return `
    <div class="sthead">${ic('box')} Góc gói mang đi <em>${want ? 'khách này gọi mang đi' : 'khách này ăn tại quán'}</em></div>
    <div class="dishes pair">
      <button class="dish${tray.togo ? ' on' : ''}${off('hop') ? ' out' : ''}${want && !tray.togo ? ' want' : ''}"
        data-tapk="hop" ${off('hop') ? 'disabled' : ''}>
        ${itemArt('hop', 56)}<b>Hộp</b><em>${off('hop') ? 'hết' : 'còn ' + qty('hop')}</em>
        ${want && !tray.togo ? '<span class="wantdot"></span>' : ''}</button>
      <button class="dish${tray.bodo ? ' on' : ''}${off('bodo') ? ' out' : ''}${want && tray.togo && !tray.bodo ? ' want' : ''}"
        data-tapk="bodo" ${off('bodo') ? 'disabled' : ''}>
        ${itemArt('bodo', 56)}<b>Bộ dụng cụ</b><em>${off('bodo') ? 'hết' : 'còn ' + qty('bodo')}</em>
        ${want && tray.togo && !tray.bodo ? '<span class="wantdot"></span>' : ''}</button>
    </div>
    <i class="stnote">Một phần mang đi cần <b>hộp</b> và <b>một bộ muỗng đũa + ly ống hút</b>.
      Thiếu bộ dụng cụ thì khách về tới nhà mới biết, và sẽ nhớ chuyện đó.</i>
    ${['hop', 'bodo'].filter(off).length ? `<div class="hint warn">${ic('warn')} Hết dụng cụ.
      <div class="rushrow">${['hop', 'bodo'].filter(off).map(k => rushBtn(k, 'Mua ' + low(ITEMS[k].s))).join('')}</div></div>` : ''}`;
}

const rushBtn = (k, lbl) => {
  const on = R.rush.some(r => r.k === k);
  return `<button class="sbtn rush" data-rush="${k}" ${on ? 'disabled' : ''}>
    ${ic('bike')} ${on ? 'Đang trên đường…' : lbl + ' ' + fmt(rushPrice(k) * rushQty(k))}</button>`;
};
const rushQty = k => k === 'com' ? 30 : 8;
const rushPrice = k => Math.round(buyCost(k) * (S.upg.xecho ? 1.3 : CFG.rushCost) / 100) * 100;

/* ---------- HẾT MÓN, CÁCH 1: CHẠY CHỢ GẤP ----------
   Trả giá cao hơn và phải chờ hàng về. Có xe máy thì nhanh và đỡ hớ. */
function rushBuy(k) {
  if (!R.running) return;
  if (R.rush.some(r => r.k === k)) return;
  const n = rushQty(k), cost = rushPrice(k) * n;
  if (S.money < cost) { toast('Không đủ tiền chạy chợ'); vib(60); return }
  S.money -= cost;
  R.today.rush += cost;
  const sec = CFG.rushSec * (S.upg.xecho ? .5 : 1);
  R.rush.push({ k, n, t: sec });
  sfx('bike'); vib(16);
  toast(`Chạy chợ mua ${low(ITEMS[k].s)} — về sau ${Math.round(sec)} giây`, 2600);
  renderStage(); head();
}
function rushTick(dt) {
  if (!R.rush.length) return;
  let done = false;
  R.rush = R.rush.filter(r => {
    r.t -= dt;
    if (r.t > 0) return true;
    addStock(r.k, r.n);
    S.cur.ing[r.k] = (S.cur.ing[r.k] || 0) + 0;   /* tiền đã tính vào mục chạy chợ */
    if (S.soldout[r.k]) delete S.soldout[r.k];
    toast(`Hàng về: ${ITEMS[r.k].n} +${r.n}`, 2200);
    sfx('arrive'); vib(14); done = true;
    return false;
  });
  if (done) { renderStage(); renderLane() }
}

/* ---------- HẾT MÓN, CÁCH 2: TREO BẢNG ----------
   Treo bảng là chủ động bỏ món khỏi thực đơn: khách không gọi nữa nên
   không sinh ra đơn không làm được. Đổi lại quán mất một lựa chọn.   */
function toggleSoldout(k) {
  if (S.soldout[k]) { delete S.soldout[k]; toast('Hạ bảng, bán lại ' + low(ITEMS[k].n)) }
  else { S.soldout[k] = 1; toast('Đã treo bảng hết ' + low(ITEMS[k].n)) }
  vib(10); renderStage(); renderLane();
}

/* ---------- CHẠM MÓN ---------- */
function tapItem(k, el) {
  if (!R.running || R.paused) return;
  const it = ITEMS[k];
  if (it.type === 'mon') {
    if (tray.mons.length >= maxMon()) { toast(`Cấp ${level()} chỉ gắp ${maxMon()} món mỗi phần`); vib(50); return }
    if (!take(k)) { toast('Hết ' + low(it.n)); vib(60); return }
    tray.mons.push(k); spend(k);
    flyTo(el, itemArt(k, 44)); burstAt(el, '__mon'); sfx('pick'); vib(10);
  } else if (it.type === 'canh') {
    if (tray.canh === k) return;
    if (!take(k)) { toast('Hết ' + low(it.n)); vib(60); return }
    if (tray.canh) refund(tray.canh);
    tray.canh = k; spend(k);
    flyTo(el, itemArt(k, 44)); burstAt(el, '__canh'); sfx('soup'); vib(10);
  } else if (it.type === 'nuoc') {
    if (tray.drink === k) return;
    if (!take(k)) { toast('Hết ' + low(it.n)); vib(60); return }
    if (tray.drink) refund(tray.drink);
    tray.drink = k; spend(k);
    flyTo(el, itemArt(k, 44)); burstAt(el, '__nuoc'); sfx('ice'); vib(10);
  } else if (k === 'hop') {
    if (tray.togo) return;
    if (!take('hop')) { toast('Hết hộp'); vib(60); return }
    tray.togo = true; spend('hop');
    burstAt(el, '__box'); sfx('box'); vib([10, 30, 10]);
  } else if (k === 'bodo') {
    if (tray.bodo) return;
    if (!take('bodo')) { toast('Hết bộ dụng cụ'); vib(60); return }
    tray.bodo = true; spend('bodo');
    burstAt(el, '__box'); sfx('pick'); vib(10);
  }
  tray.used = true;
  renderStage(); renderStBar(); renderPlate(); coachCheck();
}

/* Chạm nồi cơm: mỗi lần một muôi. 1 = ít, 2 = bình thường, 3 = nhiều. */
function tapRice(el) {
  if (!R.running || R.paused) return;
  if (tray.rice >= 3) { toast('Đầy rồi. Vuốt đĩa xuống để bỏ làm lại'); vib(50); return }
  if (!take('com')) {
    toast('Hết cơm! Nấu thêm nồi nữa đi'); vib([60, 40, 60]);
    if (S.soldout.com !== 1) { }
    renderStage(); return;
  }
  tray.rice++; tray.used = true; spend('com'); R.today.riceUsed++;
  burstAt(el, '__rice'); sfx('scoop'); vib(tray.rice === 1 ? 12 : tray.rice === 2 ? [10, 30, 10] : [10, 25, 10, 25, 10]);
  renderStage(); renderStBar(); renderPlate(); coachCheck();
}
function tapMoHanh(el) {
  if (!R.running || R.paused) return;
  if (tray.mohanh) return;
  if (!take('mohanh')) { toast('Hết mỡ hành'); vib(60); return }
  tray.mohanh = true; tray.used = true; spend('mohanh');
  burstAt(el, '__mohanh'); sfx('pour'); vib(12);
  renderStage(); renderStBar(); renderPlate(); coachCheck();
}
function spend(k) { const c = buyCost(k); tray.cost += c; R.today.cogs += c; S.cur.ing[k] = (S.cur.ing[k] || 0) + 0 }
/* đổi ý giữa chừng: món cũ bỏ đi, coi như hao */
function refund(k) { addStock(k, 0); R.today.wasted = (R.today.wasted || 0) + 1 }

function dumpTray() {
  if (!tray.used && !tray.rice) return;
  const r = S.cur; r.spoil.n++; r.spoil.v += tray.cost;
  tray = newTray();
  sfx('dump'); vib(30);
  toast('Đã bỏ đĩa, làm lại từ đầu');
  renderStage(); renderStBar(); renderPlate();
}

/* ---------- ĐĨA + PHIẾU ---------- */
function renderPlate() {
  const b = $('plateBox'); if (!b) return;
  b.innerHTML = plateSVG(tray) + `<div class="pval">${tray.used || tray.rice ? 'Đang làm ' + fmt(price(tray)) : 'Đĩa trống'}</div>`;
  renderTicket();
}
function ticketLine(ok, icn, txt) {
  return `<span class="tl${ok ? ' ok' : ''}">${ic(ok ? 'check' : icn)}${txt}</span>`;
}
function renderTicket() {
  const t = $('ticket'); if (!t) return;
  const c = focusCust();
  if (!c) { t.innerHTML = `<i class="tempty">Chạm vào một khách phía trên để lấy đơn</i>`; return }
  const o = c.order, n = c.orders.length, doneN = c.done.filter(Boolean).length;
  t.innerHTML = `
    <div class="tkh">${custSVG(c.look, moodOf(c), { w: 30, regular: c.regular })}
      <b>${c.name}</b>
      ${n > 1 ? `<em>phần ${doneN + 1}/${n}</em>` : ''}
      ${c.quirk ? `<em class="qk" style="--qc:${QUIRKS[c.quirk].c}">${ic(QUIRKS[c.quirk].i)}${QUIRKS[c.quirk].n}</em>` : ''}
    </div>
    <div class="tlines">
      ${ticketLine(tray.rice === o.rice, 'rice', riceOf(o.rice).n)}
      ${o.mons.map(k => ticketLine(tray.mons.filter(x => x === k).length >= o.mons.filter(x => x === k).length, 'plate', ITEMS[k].s)).join('')}
      ${o.mohanh ? ticketLine(tray.mohanh, 'oil', 'Mỡ hành') : ''}
      ${o.canh ? ticketLine(tray.canh === o.canh, 'soup', ITEMS[o.canh].s) : ''}
      ${o.drink ? ticketLine(tray.drink === o.drink, 'cup', ITEMS[o.drink].s) : ''}
      ${o.togo ? ticketLine(tray.togo && tray.bodo, 'box', 'Mang đi') : ticketLine(!tray.togo, 'plate', 'Ăn tại quán')}
    </div>`;
}

/* ---------- HÀNG KHÁCH ---------- */
const focusCust = () => R.slots.find(c => c && c.id === R.focus) || R.slots.find(Boolean) || null;
function nextFocus() {
  const list = R.slots.filter(Boolean);
  if (!list.length) return;
  const i = list.findIndex(c => c.id === R.focus);
  R.focus = list[(i + 1) % list.length].id;
  renderLane(); renderPlate(); renderStage(); renderStBar();
}
function moodOf(c) {
  const r = c.pat / c.max;
  return r > .7 ? 'idle' : r > .45 ? 'idle' : r > .22 ? 'sad' : 'angry';
}

function renderLane() {
  const l = $('lane'); if (!l) return;
  const list = R.slots.map((c, i) => c ? custCard(c, i) : `<div class="seat"><i>${ic('people')}<span>bàn trống</span></i></div>`);
  l.innerHTML = list.join('');
  l.querySelectorAll('[data-fc]').forEach(el => {
    const id = +el.dataset.fc;
    bindGest(el, {
      tap: () => { R.focus = id; vib(8); renderLane(); renderPlate(); renderStage(); renderStBar() },
      up: () => { R.focus = id; serveFocus() }
    });
  });
  l.querySelectorAll('[data-swap]').forEach(b => b.onclick = e => { e.stopPropagation(); offerSwap(+b.dataset.swap) });
  l.querySelectorAll('[data-lend]').forEach(b => b.onclick = e => { e.stopPropagation(); offerLend(+b.dataset.lend) });
}

function custCard(c, i) {
  const r = clamp(c.pat / c.max, 0, 1);
  const o = c.order, miss = stuckItems(c);
  const n = c.orders.length, doneN = c.done.filter(Boolean).length;
  return `
    <div class="cust${R.focus === c.id ? ' on' : ''}${miss.length ? ' stuck' : ''}" data-fc="${c.id}">
      <div class="cwho">
        ${custSVG(c.look, moodOf(c), { w: 44, regular: c.regular })}
        <div class="cn"><b>${c.name}</b>
          <i>${c.regular ? ic('heart') + ' khách quen' : 'khách mới'}${n > 1 ? ` · ${doneN}/${n} phần` : ''}</i></div>
      </div>
      <div class="cord">
        <span>${riceOf(o.rice).s}</span>
        ${o.mons.map(k => `<span>${ishort(k)}</span>`).join('')}
        ${o.mohanh ? '<span>mỡ hành</span>' : ''}
        ${o.canh ? `<span>${ishort(o.canh)}</span>` : ''}
        ${o.drink ? `<span>${ishort(o.drink)}</span>` : ''}
        ${o.togo ? `<span class="togo">${ic('box')}mang đi</span>` : ''}
      </div>
      ${miss.length ? `<button class="cbtn warn" data-swap="${c.id}">${ic('reload')} Hết ${low(ishort(miss[0]))} — mời đổi món</button>` : ''}
      ${c.wantLoan && !c.loanAsked ? `<button class="cbtn lend" data-lend="${c.id}">${ic('hand')} Xin nợ ${fmt(c.wantLoan.amt)}</button>` : ''}
      <div class="patbar"><div style="width:${r * 100}%;background:${r > .6 ? '#8fb87a' : r > .3 ? '#f2c14e' : '#e2705f'}"></div></div>
    </div>`;
}

/* món trong phiếu mà kho không còn — nguồn của cơ chế mời đổi món */
function stuckItems(c) {
  const o = c.order; if (!o) return [];
  const need = [];
  o.mons.forEach(k => { if (tray.mons.filter(x => x === k).length < o.mons.filter(x => x === k).length && qty(k) <= 0) need.push(k) });
  if (o.canh && tray.canh !== o.canh && qty(o.canh) <= 0) need.push(o.canh);
  if (o.drink && tray.drink !== o.drink && qty(o.drink) <= 0) need.push(o.drink);
  if (o.togo && !tray.togo && qty('hop') <= 0) need.push('hop');
  if (o.rice > tray.rice && qty('com') <= 0) need.push('com');
  return [...new Set(need)];
}

/* ---------- HẾT MÓN, CÁCH 3: MỜI KHÁCH ĐỔI MÓN ----------
   Đổi trong cùng họ món và bớt 10% thì phần lớn khách đồng ý. Khách
   quen dễ chịu hơn, khách đang vội thì khó. Bị từ chối thì mất khách
   nhưng nhẹ hơn nhiều so với để họ ngồi chờ tới lúc cạn kiên nhẫn.  */
function subFor(k) {
  const fam = ITEMS[k].fam, near = FAM_NEAR[fam] || [fam];
  const pool = Object.keys(ITEMS).filter(x => ITEMS[x].type === ITEMS[k].type && x !== k && sellable(x) && qty(x) > 0);
  for (const f of near) {
    const hit = pool.filter(x => ITEMS[x].fam === f);
    if (hit.length) return rnd(hit);
  }
  return pool.length ? rnd(pool) : null;
}
function offerSwap(id) {
  const c = R.slots.find(x => x && x.id === id);
  if (!c || !R.running) return;
  const miss = stuckItems(c);
  if (!miss.length) return;
  const k = miss[0];
  if (k === 'com' || k === 'hop') {
    ask(`<div class="pbig">${ic('warn')}</div><h2>Hết ${low(iname(k))}</h2>
      <p>${k === 'com' ? 'Không có cơm thì không ra được phần nào.' : 'Không có hộp thì không gói mang đi được.'}
        Chạy chợ gấp ở khu tương ứng, hoặc xin lỗi trả khách.</p>`,
      [['Để mình chạy chợ', null], ['Xin lỗi, trả khách', () => sendAway(c), 1]]);
    return;
  }
  const sub = subFor(k);
  if (!sub) {
    ask(`<div class="pbig">${ic('warn')}</div><h2>Không còn gì để đổi</h2>
      <p>Hết <b>${iname(k)}</b> mà cũng không còn món nào cùng loại để mời đổi.</p>`,
      [['Thôi', null], ['Xin lỗi, trả khách', () => sendAway(c), 1]]);
    return;
  }
  const disc = Math.round(sv(sub) * .1 / 1000) * 1000;
  ask(`<div class="pbig">${itemArt(sub, 64)}</div>
    <h2>Mời ${c.name} đổi món</h2>
    <p>Hết <b>${iname(k)}</b>. Mời đổi sang <b>${iname(sub)}</b>${disc ? `, bớt <b>${fmt(disc)}</b> cho phải phép` : ''}?</p>
    <p class="note">${c.regular ? 'Khách quen thường dễ chịu chuyện này.' : ''}
      ${c.quirk === 'vasoi' ? 'Khách đang vội, chưa chắc chịu.' : ''}</p>`,
    [['Không mời', null],
    ['Mời đổi món', () => doSwap(c, k, sub, disc), 1]]);
}
function doSwap(c, k, sub, disc) {
  let p = .6 + (c.regular ? .2 : 0) + (rating() >= 4.3 ? .1 : 0) - (c.quirk === 'vasoi' ? .25 : 0) - (c.quirk === 'kho' ? .15 : 0);
  p += clamp(c.pat / c.max, 0, 1) * .15;
  if (Math.random() > clamp(p, .15, .95)) {
    toast(c.name + ' không chịu đổi, đi mất');
    addReview(Math.random() < .5 ? 2 : 3, 'soldout', c);
    sendAway(c, true);
    return;
  }
  const o = c.order;
  if (ITEMS[k].type === 'mon') o.mons = o.mons.map(x => x === k ? sub : x);
  else if (ITEMS[k].type === 'canh') o.canh = sub;
  else if (ITEMS[k].type === 'nuoc') o.drink = sub;
  c.disc = (c.disc || 0) + disc;
  c.swapped = true;
  R.today.swap++;
  c.pat = Math.min(c.max, c.pat + c.max * .12);   /* được mời đổi tử tế thì bớt sốt ruột */
  sfx('ok'); vib([10, 40, 10]);
  toast(c.name + ' đồng ý đổi sang ' + low(iname(sub)));
  renderLane(); renderPlate(); renderStage(); renderStBar();
}
function sendAway(c, quiet) {
  const i = R.slots.indexOf(c);
  if (i < 0) return;
  R.slots[i] = null; R.today.lost++;
  if (!quiet) addReview(3, 'soldout', c);
  if (R.focus === c.id) R.focus = null;
  sfx('leave'); renderLane(); renderPlate();
}

/* ---------- CHO VAY ----------
   Khách quen bí tiền hỏi nợ. Cho vay là mất tiền ngay và có thể mất
   luôn, nhưng người ta nhớ ơn: quay lại thường hơn và dắt thêm khách.
   Từ chối không bị phạt nặng — đây là lựa chọn thật, không phải bẫy.  */
function offerLend(id) {
  const c = R.slots.find(x => x && x.id === id);
  if (!c || !c.wantLoan) return;
  const L = c.wantLoan, reg = regOf(c.name);
  const trust = reg ? reg.trust : .45;
  ask(`<div class="pbig">${custSVG(c.look, 'sad', { w: 84, regular: c.regular })}</div>
    <h2>${c.name} xin nợ ${fmt(L.amt)}</h2>
    <p>"Cho ${low(c.name.split(' ')[0])} ghi nợ bữa nay nghe, ${L.why}."</p>
    <p class="note">${ic('people')} Đã ghé <b>${reg ? reg.visits : 1}</b> lần · tin cậy <b>${Math.round(trust * 100)}%</b>
      · hẹn trả sau <b>${L.days} ngày</b></p>
    <p class="note">${trust >= .65 ? 'Người này trước giờ trả đúng hẹn.'
      : trust <= .35 ? 'Chưa quen lắm, cho vay là hên xui.' : 'Cũng hay ghé, chưa nợ lần nào.'}</p>`,
    [['Xin lỗi, không được', () => {
      c.loanAsked = true;
      c.pat = Math.max(1, c.pat - c.max * .08);
      toast(c.name + ' hơi buồn nhưng vẫn ngồi ăn');
      renderLane();
    }],
    ['Cho nợ ' + fmt(L.amt), () => doLend(c), 1]]);
}
function doLend(c) {
  const L = c.wantLoan;
  c.loanAsked = true; c.lent = true;
  const reg = touchRegular(c);
  S.debts.push({
    id: ++uid, who: c.name, look: c.look, amt: L.amt,
    due: S.day + L.days, trust: reg.trust, tries: 0, late: 0
  });
  R.today.lent += L.amt;
  S.cur.lent = (S.cur.lent || 0) + L.amt;
  S.money -= L.amt;
  c.pat = Math.min(c.max, c.pat + c.max * .2);
  reg.trust = clamp(reg.trust + .05, 0, 1);
  sfx('coin'); vib([14, 50, 14]);
  const el = document.querySelector(`[data-fc="${c.id}"]`);
  burstAt(el, '__money');
  toast(c.name + ' cảm ơn quá trời, hẹn ' + L.days + ' ngày trả');
  head(); renderLane();
}

/* ---------- KHÁCH QUEN ---------- */
const regOf = name => S.regulars.find(r => r.name === name);
function touchRegular(c) {
  let r = regOf(c.name);
  if (!r) { r = { name: c.name, look: c.look, trust: .45, visits: 0 }; S.regulars.push(r) }
  r.visits++;
  if (S.regulars.length > 40) S.regulars.sort((a, b) => b.visits - a.visits).length = 40;
  return r;
}

/* ---------- SO KHỚP + GIAO ĐĨA ---------- */
function matches(t, o) {
  if (t.rice !== o.rice) return false;
  if ([...t.mons].sort().join() !== [...o.mons].sort().join()) return false;
  if (!!t.mohanh !== !!o.mohanh) return false;
  if ((t.canh || null) !== (o.canh || null)) return false;
  if ((t.drink || null) !== (o.drink || null)) return false;
  if (!!t.togo !== !!o.togo) return false;
  return true;
}
function serveFocus() {
  const c = focusCust();
  if (!c) { toast('Chưa có khách nào để đưa'); return }
  serve(R.slots.indexOf(c));
}

function serve(i) {
  if (!R.running || R.paused) return;
  const c = R.slots[i];
  if (!c) return;
  if (!tray.rice) { toast('Chưa múc cơm — chạm nồi cơm đã'); vib(50); return }
  const el = document.querySelector(`[data-fc="${c.id}"]`);
  const j = c.orders.findIndex((o, k) => !c.done[k] && matches(tray, o));
  if (j < 0) {
    c.wrong++; R.today.wrong++;
    c.pat = Math.max(.5, c.pat - c.max * .28);
    if (el) { el.classList.add('angry'); setTimeout(() => el.classList.remove('angry'), 340) }
    fl(el, 'Sai đơn rồi!', true);
    sfx('wrong'); vib([70, 60, 70]);
    burstAt(el, '__wrong');
    const r = S.cur; r.spoil.n++; r.spoil.v += tray.cost;
    tray = newTray();
    renderStage(); renderStBar(); renderPlate(); renderLane(); head();
    return;
  }
  const o = c.orders[j];
  /* mang đi mà quên bộ dụng cụ: vẫn bán được nhưng khách sẽ nhớ */
  const noKit = !!o.togo && !tray.bodo;
  let p = price(o) - (c.disc || 0);
  c.disc = 0;
  S.money += p; R.today.rev += p; S.totalRev += p;
  recSale(o); R.today.served++; S.served++;
  c.done[j] = true;
  if (noKit) c.noKit = true;
  tray = newTray();

  const left = c.done.filter(x => !x).length;
  if (left) {
    c.order = c.orders[c.done.indexOf(false)];
    fl(el, `+${fmt(p)} · còn ${left} phần`, false);
    sfx('serve'); vib(20);
    burstAt(el, '__serve');
    renderLane(); renderStage(); renderStBar(); renderPlate(); head();
    toast('Xong một phần, làm tiếp phần kế');
    coachCheck();
    return;
  }
  /* xong cả bàn */
  const rv = stars(c);
  const tipBase = Math.round((c.pat / c.max) * 4) * 1000 * c.orders.length;
  const tip = Math.round(tipBase * (c.regular ? 1.2 : 1) * (evIs('le') ? 2 : 1) * (rv.s >= 5 ? 1.4 : 1));
  if (tip > 0) { S.cur.tips += tip; S.money += tip; S.totalRev += tip; R.today.tips += tip }
  addReview(rv.s, rv.why, c);
  if (evIs('tiktok') && !R.tikDone && rv.s >= 4) { R.tikDone = true; addReview(5, 'great', c); addReview(5, 'great', c) }
  else if (evIs('tiktok') && !R.tikDone && rv.s <= 2) { R.tikDone = true; addReview(1, 'bad', c); addReview(2, 'bad', c) }
  const reg = touchRegular(c);
  if (rv.s >= 4) reg.trust = clamp(reg.trust + .04, 0, 1);
  fl(el, `+${fmt(p + tip)}  ${'★'.repeat(rv.s)}`, false);
  sfx('serve'); vib(rv.s >= 5 ? [15, 40, 15, 40, 25] : 22);
  if (rv.s >= 5) setTimeout(() => sfx('star'), 220);
  burstAt(el, '__serve');
  R.slots[i] = null;
  if (R.focus === c.id) R.focus = null;
  renderLane(); renderStage(); renderStBar(); renderPlate(); head();
  coachCheck();
}

function recSale(o) {
  const sl = S.cur.sales, add = (k, a) => { const x = sl[k] = sl[k] || { q: 0, a: 0 }; x.q++; x.a += a };
  add(riceKey(o.rice), sv(riceKey(o.rice)));
  o.mons.forEach(k => add(k, sv(k)));
  if (o.canh) add(o.canh, sv(o.canh));
  if (o.drink) add(o.drink, sv(o.drink));
  if (o.mohanh) add('mohanh', sv('mohanh'));
}

/* ---------- CHẤM SAO: bắt đầu 5, trừ dần ---------- */
function stars(c) {
  const w = 1 - c.pat / c.max;
  const idx = c.orders.reduce((a, o) => a + priceIdx(o), 0) / c.orders.length;
  const pricey = c.orders.some(orderPricey);
  let s = 5, why = 'great';
  if (w > .5) { s--; why = 'wait' }
  if (w > (S.upg.quat ? .9 : .82)) { s--; why = 'wait' }
  if (w > .96) s--;
  if (pricey) { s--; why = 'pricey' }
  if (c.wrong) { s -= c.wrong; why = 'wrong' }
  if (c.noKit) { s--; why = 'togo' }
  if (c.quirk === 'kho') {
    if (w > .4 || c.wrong) s--;
    if (s >= 5 && Math.random() < .5) s = 4;
  }
  if (Math.random() < .12) s--;                 /* nhiễu nhẹ, tránh đoán trước được */
  if (c.swapped && s < 5) { s++; if (why === 'great') why = 'swapped' }
  if (c.lent && s < 5) s++;                     /* được giúp lúc bí thì rộng lòng */
  if (c.regular && why === 'great' && s < 5) s++;
  if (!pricey && idx < .88 && s < 5) { s++; if (why === 'great') why = 'cheap' }
  s = clamp(s, 1, 5);
  if (why === 'great' || (why === 'cheap' && s < 4)) why = s >= 5 ? 'great' : s === 4 ? 'ok' : s === 3 ? 'meh' : 'bad';
  return { s, why };
}

/* ---------- SINH PHIẾU ---------- */
function genOrder() {
  const lv = level(), w = wx();
  const mons = MAIN_KEYS.filter(sellable);
  if (!mons.length || qty('com') <= 0) return null;
  const hotK = evIs('hot') && sellable(ev().k) && Math.random() < .5 ? ev().k : null;

  const rice = wpick([1, 2, 3], [.26, .48, .26]);
  const n = lv >= 4 ? wpick([1, 2, 3], [.5, .34, .16]) : lv >= 2 ? wpick([1, 2], [.62, .38]) : 1;
  const pick = [];
  const pool = mons.slice().sort(() => Math.random() - .5);
  if (hotK) pick.push(hotK);
  for (const k of pool) {
    if (pick.length >= Math.min(n, maxMon())) break;
    if (!pick.includes(k)) pick.push(k);
  }
  const canhs = CANH_KEYS.filter(sellable);
  const drinks = DRINK_KEYS.filter(sellable);
  return {
    rice,
    mons: pick,
    mohanh: lv >= 2 && sellable('mohanh') && Math.random() < .55,
    canh: lv >= 3 && canhs.length && Math.random() < clamp(.34 * w.canh, 0, .8) ? rnd(canhs) : null,
    drink: lv >= 2 && drinks.length && Math.random() < clamp(.42 * w.drink, 0, .92) ? wpick(drinks, drinks.map(k => k === 'trada' ? 3 : 1)) : null,
    togo: lv >= 3 && sellable('hop') && sellable('bodo') && Math.random() < clamp(.22 * (w.togo || 1) * (evIs('hocsinh') || evIs('tanca') ? 1.5 : 1), 0, .75)
  };
}

function pickQuirk() {
  if (S.day < 3) return null;
  let p = .2 + Math.min(.12, (S.day - 3) * .004);
  if (wxKey() === 'gat') p *= 1.3;
  if (Math.random() >= p) return null;
  return wpick(['vasoi', 'kho', 'doiy'], [1, 1, 1]);
}

/* Khách hay đổi ý: chỉ đổi sang thứ CÒN HÀNG, để không tự tay tạo ra
   đơn không thể làm — người chơi không tránh được thì thành phạt vô lý. */
function quirkChange(c) {
  const o = c.order;
  if (c.changed || !o) return;
  c.changed = true;
  const mons = MAIN_KEYS.filter(k => sellable(k) && !o.mons.includes(k));
  let what = null;
  if (mons.length && o.mons.length) {
    const i = Math.floor(Math.random() * o.mons.length), gone = o.mons[i];
    o.mons[i] = rnd(mons);
    what = `đổi ${low(iname(gone))} thành ${low(iname(o.mons[i]))}`;
  } else if (level() >= 2 && sellable('mohanh')) {
    o.mohanh = !o.mohanh;
    what = o.mohanh ? 'muốn thêm mỡ hành' : 'thôi không lấy mỡ hành';
  } else if (level() >= 3 && sellable('hop') && sellable('bodo')) {
    o.togo = !o.togo;
    what = o.togo ? 'đổi sang mang đi' : 'đổi sang ăn tại quán';
  } else return;
  if (tray.used || tray.rice) dumpTray();
  toast(c.name + ' đổi ý: ' + what, 3200);
  vib([30, 40, 30]);
  renderLane(); renderPlate(); renderStBar();
}

function spawn() {
  const i = R.slots.findIndex(s => !s);
  if (i < 0) return;
  if (qty('com') <= 0) {
    if (!R.riceWarn || performance.now() - R.riceWarn > 9000) {
      R.riceWarn = performance.now();
      toast('Hết cơm nên không nhận khách được — nấu thêm ở khu Nồi cơm', 3000);
    }
    return;
  }
  const pi = pricyItems();
  if (pi.length && Math.random() < .8) {
    R.today.priceLost++;
    if (Math.random() < .07) addReview(rnd([1, 2, 2]), 'pricey', null);
    if (!R.pricyT || performance.now() - R.pricyT > 8000) {
      R.pricyT = performance.now();
      const k = pi[0];
      toast('Khách xem bảng giá, chê ' + low(k.startsWith('com') && k !== 'com' ? riceOf(+k.slice(3)).n : ITEMS[k].n) + ' đắt quá rồi đi', 2600);
    }
    return;
  }
  const lv = level();
  const nParts = lv >= 4 ? wpick([1, 2, 3, 4], [.6, .24, .11, .05])
    : lv >= 3 && (evIs('cuoituan') || evIs('le')) && Math.random() < .25 ? 2 : 1;
  const orders = [];
  for (let n = 0; n < nParts; n++) { const o = genOrder(); if (o) orders.push(o) }
  if (!orders.length) return;
  if ((orders.some(overCap) && Math.random() < .6) || (orders.some(orderPricey) && Math.random() < .35)) {
    R.today.priceLost++; toast('Có khách chê đắt, bỏ đi'); return;
  }
  /* khách quen hay quay lại: đã có sổ khách quen thì ưu tiên gọi họ */
  const regs = S.regulars.filter(r => r.visits >= 2);
  const back = regs.length && Math.random() < clamp(.18 + regs.length * .02, 0, .5) ? rnd(regs) : null;
  const name = back ? back.name : genName();
  const look = back ? back.look : ri(0, 5);
  const quirk = pickQuirk();
  let max = 62 * (S.upg.quat ? 1.25 : 1) * wx().pat * (evIs('matdien') ? .8 : 1);
  max *= 1 + .7 * (nParts - 1);
  max *= 1 + .18 * orders.reduce((a, o) => a + o.mons.length - 1 + (o.canh ? 1 : 0) + (o.togo ? 1 : 0), 0) / nParts;
  if (quirk === 'vasoi') max *= .55;

  const c = {
    id: ++uid, name, look, regular: !!back || (!!regOf(name) && regOf(name).visits >= 2),
    quirk, orders, done: orders.map(() => false), order: orders[0],
    pat: max, max, wrong: 0, born: performance.now(), disc: 0
  };
  /* khách quen bí tiền hỏi nợ — chỉ từ cấp 3, và không hỏi liên tục */
  if (level() >= 3 && c.regular && !R.lendAsked && Math.random() < .16) {
    R.lendAsked = true;
    const reg = regOf(name);
    c.wantLoan = {
      amt: r1000(clamp(CFG.lendCap * (.3 + Math.random() * .7), 50000, Math.max(50000, S.money * .4))),
      why: rnd(LOAN_WHY), days: ri(2, 5)
    };
    if (reg) c.wantLoan.amt = r1000(c.wantLoan.amt * (reg.trust > .6 ? .8 : 1.1));
  }
  R.slots[i] = c;
  if (R.focus == null) R.focus = c.id;
  sfx('arrive'); vib(12);
  /* vẽ lại cả khu món nữa: dấu "khách gọi" nằm trong khu, không có
     bước này thì khách mới tới mà khay vẫn chỉ dẫn theo khách cũ */
  renderLane(); renderStage(); renderStBar(); renderPlate();
}

/* ---------- NHÂN VIÊN TỰ LÀM ----------
   Chia đúng việc: NV1 đứng nồi cơm và mỡ hành, NV2 đứng khay món,
   nồi canh và thùng nước. Người chơi vẫn là người chốt đơn.          */
function staffTick(dt) {
  const c = focusCust();
  if (!c || !c.order) return;
  const o = c.order;
  if (S.upg.nv1) {
    R.nv1 = (R.nv1 || 0) - dt;
    if (R.nv1 <= 0) {
      R.nv1 = 1.6 + Math.random() * .8;
      if (tray.rice < o.rice && qty('com') > 0) {
        take('com'); tray.rice++; tray.used = true; spend('com'); R.today.riceUsed++;
        burstAt(document.querySelector('#ricePot') || $('plateBox'), '__rice');
        renderStage(); renderStBar(); renderPlate();
        return;
      }
      if (o.mohanh && !tray.mohanh && qty('mohanh') > 0) {
        take('mohanh'); tray.mohanh = true; tray.used = true; spend('mohanh');
        renderStage(); renderStBar(); renderPlate();
      }
    }
  }
  if (S.upg.nv2) {
    R.nv2 = (R.nv2 || 0) - dt;
    if (R.nv2 <= 0) {
      R.nv2 = 2 + Math.random() * 1;
      const needMon = o.mons.find(k => tray.mons.filter(x => x === k).length < o.mons.filter(x => x === k).length && qty(k) > 0);
      if (needMon && tray.mons.length < maxMon()) {
        take(needMon); tray.mons.push(needMon); tray.used = true; spend(needMon);
        renderStage(); renderStBar(); renderPlate();
        return;
      }
      if (o.canh && tray.canh !== o.canh && qty(o.canh) > 0) {
        take(o.canh); tray.canh = o.canh; tray.used = true; spend(o.canh);
        renderStage(); renderStBar(); renderPlate();
        return;
      }
      if (o.drink && tray.drink !== o.drink && qty(o.drink) > 0) {
        take(o.drink); tray.drink = o.drink; tray.used = true; spend(o.drink);
        renderStage(); renderStBar(); renderPlate();
      }
    }
  }
}

/* ---------- TRỘM ----------
   Ban ngày kẻ trộm hiện ra vài giây, chạm vào là chặn. Thuê bảo vệ thì
   phần lớn bị chặn sẵn, khỏi phải để mắt.                            */
function spawnThief() {
  const what = rnd(THIEF_DAY);
  if (S.upg.baove && Math.random() < .88) {
    toast(ic('shield') + ' Anh bảo vệ chặn kịp một kẻ lảng vảng', 2600);
    sfx('block');
    return;
  }
  const amt = r1000(ri(40000, 220000) * (S.upg.ketsat ? .35 : 1));
  R.thief = { id: ++uid, what: what.w, amt, t: S.upg.cam ? 3.8 : 2.6 };
  const b = $('thiefbox');
  if (b) {
    b.innerHTML = `<button class="thief" id="thiefBtn">${thiefSVG()}<span>${ic('warn')} Chặn!</span></button>`;
    $('thiefBtn').onclick = catchThief;
  }
  toast(ic('warn') + ' ' + what.n + ' Chạm vào hắn ngay!', 2600, 'bad');
  sfx('alarm'); vib([60, 80, 60, 80, 120]);
  document.body.classList.add('alarm');
}
function catchThief() {
  if (!R.thief) return;
  const el = $('thiefBtn');
  burstAt(el, '__thief');
  sfx('block'); vib([20, 50, 20]);
  const bonus = Math.random() < .3 ? r1000(ri(10000, 40000)) : 0;
  if (bonus) { S.money += bonus; toast('Chặn được! Hắn rơi cả ' + fmt(bonus) + ' xuống đất', 2800) }
  else toast('Chặn được! Hắn chạy mất rồi', 2400);
  clearThief();
  head();
}
function clearThief() {
  R.thief = null;
  const b = $('thiefbox'); if (b) b.innerHTML = '';
  document.body.classList.remove('alarm');
}
function thiefTick(dt) {
  if (R.thiefAt != null && R.t <= R.thiefAt && !R.thief && !R.thiefDone) {
    R.thiefDone = true; spawnThief();
    return;
  }
  if (!R.thief) return;
  R.thief.t -= dt;
  if (R.thief.t > 0) return;
  const amt = Math.min(S.money, R.thief.amt);
  S.money -= amt; R.today.stolen += amt;
  toast(ic('warn') + ' Mất ' + fmt(amt) + ' — hắn lấy ' + R.thief.what + ' rồi chạy', 3400, 'bad');
  sfx('lose'); vib([120, 60, 120]);
  clearThief(); head();
}

/* Giãn cách giữa hai khách, tính bằng giây trước khi nhân thời tiết và
   nhịp trong ngày. Cấp 1 thưa hẳn để người chơi kịp làm quen tay; càng
   lên cấp khách càng dồn, và đó chính là lúc cần thuê người. */
const spawnGap = () => [9, 9, 7.4, 6.1, 5.1][level()] || 6;

/* ---------- NHỊP KHÁCH TRONG NGÀY ----------
   Cơm tấm có hai đợt: đợt ăn sáng và đợt trưa. Giữa hai đợt thì thưa,
   đó là lúc để người chơi kịp nấu thêm hay chạy chợ.                 */
function rushMul() {
  const el = 1 - R.t / (dayLen() * 60);
  if (el < .06) return .85;
  if (el < .26) return 1.5;     /* đợt ăn sáng */
  if (el < .42) return .6;
  if (el < .5) return .85;
  if (el < .78) return 1.55;    /* đợt cơm trưa */
  if (el < .9) return .9;
  return .6;
}

/* ---------- THỜI TIẾT ĐỔI GIỮA BUỔI ---------- */
function wxTick() {
  const tot = dayLen() * 60, el = 1 - R.t / tot;
  if (R.wxTurn || el < .35 || el > .72) return;
  if (Math.random() > .012) return;         /* xét mỗi 100ms, ra chừng 1/3 số ngày */
  R.wxTurn = true;
  const now = wxKey();
  const to = isRain() ? wpick(['mat', 'nang'], [2, 1]) : wpick(['rao', 'dam', 'mat'], [3, 1, 2]);
  if (to === now) return;
  R.wx = to;
  paintWeather(); head();
  const w = WEATHER[to];
  toast(ic(w.ic) + ' Trời đổi: <b>' + w.n + '</b>. ' + w.d, 3800);
  sfx(to === 'rao' || to === 'dam' ? 'rain' : 'shine');
  vib([20, 60, 20]);
}

/* ---------- VÒNG LẶP ---------- */
function tick() {
  const dt = .1;
  R.t -= dt; R.spawnT -= dt;
  if (R.spawnT <= 0 && R.t > 5) {
    spawn();
    R.spawnT = spawnGap() / traffic() / rushMul() * (.75 + Math.random() * .5);
  }
  wxTick();
  rushTick(dt);
  thiefTick(dt);
  staffTick(dt);

  let ch = false;
  R.slots.forEach(c => { if (c && c.quirk === 'doiy' && !c.changed && c.pat < c.max * .7) quirkChange(c) });
  R.slots.forEach((c, i) => {
    if (!c) return;
    c.pat -= dt;
    if (c.pat <= 0) {
      R.slots[i] = null; R.today.lost++;
      const st = Math.random() < .3 ? 2 : 1;
      addReview(st, 'timeout', c);
      if (R.focus === c.id) R.focus = null;
      ch = true; sfx('leave'); vib(40);
      toast(c.name + ' chờ hết nổi, bỏ đi và để lại ' + st + ' sao');
    }
  });
  const tot = dayLen() * 60;
  if (evIs('tanca') && !R.burstDone && R.t < tot * .5) {
    R.burstDone = true; toast('Một tốp công nhân tan ca ghé cùng lúc!');
    for (let n = 0; n < 3; n++) spawn();
    R.spawnT = 2.5;
  }
  if (R.t <= 0 && !R.closing) { R.closing = true; toast('14:00 — hết giờ bán, làm nốt cho khách đang chờ', 3800) }
  if (R.closing && !R.slots.some(Boolean)) { endDay(); return }
  if (ch) { renderLane(); renderPlate(); renderStBar() }
  else if (R.tk = (R.tk || 0) + 1, R.tk % 4 === 0) updBars();
  const pi = $('pinfo');
  if (pi) pi.innerHTML = `${R.today.served} phần · ${fmt(R.today.rev + R.today.tips)}${R.rush.length ? ` · ${ic('bike')} ${Math.ceil(R.rush[0].t)}s` : ''}`;
  head();
}
function updBars() {
  R.slots.filter(Boolean).forEach(c => {
    const el = document.querySelector(`[data-fc="${c.id}"] .patbar div`);
    if (!el) return;
    const r = clamp(c.pat / c.max, 0, 1);
    el.style.width = (r * 100) + '%';
    el.style.background = r > .6 ? '#8fb87a' : r > .3 ? '#f2c14e' : '#e2705f';
  });
}

function pauseGame() {
  if (!R.running || R.paused) return;
  R.paused = true; clearInterval(timer);
  ask(`<div class="pbig">${ic('clock')}</div><h2>Nghỉ tay</h2>
    <p>${gameClock()} — đã bán ${R.today.served} phần, thu ${fmt(R.today.rev + R.today.tips)}</p>`,
    [['Dọn dẹp đóng cửa', () => { R.slots = R.slots.map(() => null); R.t = 0; endDay() }],
    ['Bán tiếp', resumeGame, 1]]);
}
function resumeGame() {
  if (!R.running || !R.paused) return;
  R.paused = false; clearInterval(timer); timer = setInterval(tick, 100); head();
}

/* ---------- HƯỚNG DẪN MÀN ĐẦU ----------
   Chỉ hiện ở ngày 1 và chỉ một việc mỗi lần. Xong là không bao giờ
   quay lại, nên không làm phiền người chơi cũ.                       */
function renderCoach() {
  const box = $('coach'); if (!box) return;
  if (R.coach == null || R.coach < 0 || R.coach >= COACH.length) { box.hidden = true; return }
  const s = COACH[R.coach];
  box.hidden = false;
  box.innerHTML = `<span class="cnum">${R.coach + 1}/${COACH.length}</span>
    <div><b class="ctt">${ic('hand')} ${s.t}</b><i>${s.d}</i></div>
    <button class="cskip" id="cskip">Bỏ qua</button>`;
  $('cskip').onclick = () => { R.coach = -1; S.coachDone = true; save(); renderCoach(); document.querySelectorAll('.coachon').forEach(e => e.classList.remove('coachon')) };
  document.querySelectorAll('.coachon').forEach(e => e.classList.remove('coachon'));
  if (s.at === 'com' && R.st === 'com') { const p = $('ricePot'); if (p) p.classList.add('coachon') }
  if (s.at === 'mon' && R.st !== 'mon') {
    const t = document.querySelector('[data-st="mon"]'); if (t) t.classList.add('coachon');
  }
  if (s.id === 'serve') { const p = $('plateBox'); if (p) p.classList.add('coachon') }
}
function coachCheck() {
  if (R.coach == null || R.coach < 0) return;
  const s = COACH[R.coach];
  const c = focusCust();
  let ok = false;
  if (s.id === 'rice') ok = tray.rice > 0;
  else if (s.id === 'mon') ok = R.st === 'mon';
  else if (s.id === 'pick') ok = tray.mons.length > 0;
  else if (s.id === 'serve') ok = R.today.served > 0;
  if (!ok) { renderCoach(); return }
  R.coach++;
  if (R.coach >= COACH.length) {
    R.coach = -1; S.coachDone = true; save();
    toast('Vậy là biết bán rồi! Cứ thế làm cho hết ngày nhé', 3200);
  }
  renderCoach();
}

/* ---------- KẾT NGÀY ---------- */
function endDay() {
  clearInterval(timer); R.running = false;
  clearThief(); clearFX();
  const T = R.today, r = S.cur, fc = fixed();
  R.slots.forEach(c => { if (c) T.lost++ });

  /* hàng quá hạn bị huỷ */
  const waste = expireStock();
  waste.forEach(x => r.waste[x.k] = { q: x.q, v: x.v });

  r.rent = fc.rent; r.util = fc.util; r.served = T.served; r.lost = T.lost + T.priceLost;
  r.starSum = T.stars.reduce((a, b) => a + b, 0); r.starN = T.stars.length;
  r.wage = wageDay(); r.rush = T.rush; r.stolen = T.stolen;
  r.interest = dayInterest();
  r.wx = wxKey(); r.ev = ev() ? { id: ev().id } : null;

  /* sổ nợ: ai tới hẹn thì xét trả */
  const back = settleDebts();
  r.back = back.paid; r.deadDebt = back.dead;
  S.money += back.paid;

  /* quà và sự cố */
  if (S.gift) { r.gift = S.gift.v; S.money += S.gift.v }
  if (S.badToday) { r.bad = S.badToday.v; S.money -= S.badToday.v }

  /* trộm ban đêm: chỉ camera, két sắt hay bảo vệ mới đỡ được */
  let night = 0;
  const pNight = S.upg.baove ? .01 : S.upg.cam ? .015 : .05;
  if (S.day >= 6 && Math.random() < pNight) {
    /* Có trần cứng: mất một đêm không được phép xoá sạch công của cả tuần.
       Quán càng lớn thì mất càng nhiều, nhưng chỉ tới một mức nhất định. */
    const base = Math.min(S.money * .06, 220000) + ri(20000, 90000);
    night = Math.min(S.money, r1000(base * (S.upg.ketsat ? .3 : 1)));
    S.money -= night; r.stolen += night;
  }

  /* thuế: mô phỏng hộ kinh doanh, chỉ thu khi doanh thu năm vượt ngưỡng */
  const yi = Math.floor((S.day - 1) / 360);
  if (S.taxYear !== yi) { S.taxYear = yi; S.yearRev = 0 }
  const rev = recRev(r), before = S.yearRev;
  S.yearRev += rev;
  const taxable = Math.max(0, S.yearRev - Math.max(CFG.taxThreshold, before));
  r.tax = Math.round(taxable * (CFG.vat + CFG.pit) / 100);

  S.money -= r.rent + r.util + r.tax + r.wage + r.interest;
  const cost = recCost(r), profit = rev - cost;
  const avg = r.starN ? r.starSum / r.starN : 0;
  const wv = waste.reduce((a, x) => a + x.v, 0);
  S.history.push(r);
  if (S.history.length > 400) S.history.shift();
  S.totalProfit = (S.totalProfit || 0) + profit;

  const broke = S.money < 0;
  if (!broke) {
    S.best = Math.max(S.best || 0, S.day);
    S.seenLv = level();
    S.day++; S.cur = newRec(S.day);
    /* sang ngày mới thì bảng "hết món" tự hạ, hàng mới nhập lại từ đầu */
    S.soldout = {};
    rollDay(S.day);
  }
  save();
  const nextLv = !broke && levelOf(S.day) > levelOf(S.day - 1) ? levelOf(S.day) : 0;
  sfx(broke ? 'broke' : 'dayEnd');
  if (nextLv) setTimeout(() => sfx('levelUp'), 650);

  const W = WEATHER[r.wx] || WEATHER.nang;
  $('card').innerHTML = `
    <div class="pbig">${broke ? ic('warn') : ic('moon')}</div>
    <h2>${broke ? 'Dẹp quán' : 'Hết ngày ' + (broke ? r.day : S.day - 1)}</h2>
    <div class="kpis">
      <div><b>${r.served}</b><span>phần bán</span></div>
      <div><b>${r.lost}</b><span>khách mất</span></div>
      <div><b>${avg ? avg.toFixed(1).replace('.', ',') : '–'}</b><span>sao</span></div>
    </div>
    <div class="ledger">
      <div><span>${ic('price')} Doanh thu</span><span class="pos">+${fmt(rev)}</span></div>
      <div><span>${ic('box')} Chi phí</span><span class="neg">−${fmt(cost)}</span></div>
      <div><span class="wl">${ic('box')} Tiền hàng đã nhập</span><span class="wl">${fmt(Object.values(r.ing).reduce((a, v) => a + v, 0))}</span></div>
      <div><span class="wl">Mặt bằng + điện nước</span><span class="wl">${fmt(r.rent + r.util)}</span></div>
      ${r.wage ? `<div><span class="wl">${ic('people')} Lương</span><span class="wl">${fmt(r.wage)}</span></div>` : ''}
      ${r.interest ? `<div><span class="wl">${ic('receipt')} Lãi vay</span><span class="wl">${fmt(r.interest)}</span></div>` : ''}
      ${r.rush ? `<div><span class="wl">${ic('bike')} Chạy chợ gấp</span><span class="wl">${fmt(r.rush)}</span></div>` : ''}
      ${r.stolen ? `<div><span class="wl">${ic('warn')} Bị mất trộm</span><span class="wl">${fmt(r.stolen)}</span></div>` : ''}
      ${r.lent ? `<div><span class="wl">${ic('hand')} Cho khách nợ</span><span class="wl">${fmt(r.lent)}</span></div>` : ''}
      ${r.back ? `<div><span class="wl">${ic('coin')} Khách trả nợ</span><span class="wl">+${fmt(r.back)}</span></div>` : ''}
      ${r.deadDebt ? `<div><span class="wl">${ic('trash')} Nợ mất trắng</span><span class="wl">${fmt(r.deadDebt)}</span></div>` : ''}
      ${r.bad ? `<div><span class="wl">${ic('warn')} ${S.badToday ? S.badToday.n : 'Sự cố'}</span><span class="wl">${fmt(r.bad)}</span></div>` : ''}
      ${r.gift ? `<div><span class="wl">${ic('gift')} ${S.gift ? S.gift.n : 'Quà'}</span><span class="wl">+${fmt(r.gift)}</span></div>` : ''}
      ${r.spoil.n ? `<div><span class="wl">${ic('trash')} ${r.spoil.n} đĩa bỏ phí</span><span class="wl">${fmt(r.spoil.v)}</span></div>` : ''}
      ${wv ? `<div><span class="wl">${ic('trash')} Trong đó bỏ vì hỏng: ${waste.map(x => ishort(x.k) + ' ' + x.q).join(', ')}</span><span class="wl">${fmt(wv)}</span></div>` : ''}
      <div class="tot"><span>${ic('chart')} Lãi</span><span class="${profit < 0 ? 'neg' : 'pos'}">${profit < 0 ? '−' : '+'}${fmt(Math.abs(profit))}</span></div>
      <div class="tot"><span>${ic('money')} Két</span><span>${fmtBig(S.money)}</span></div>
    </div>
    ${night ? `<p class="lvup warn">${ic('warn')} Đêm qua bị cạy cửa, mất ${fmt(night)}.
       ${S.upg.baove ? '' : 'Thuê bảo vệ hoặc gắn camera đi.'}</p>` : ''}
    ${T.swap ? `<p class="note">${ic('reload')} Đã mời ${T.swap} khách đổi món khi hết hàng — nhờ vậy không mất khách.</p>` : ''}
    ${broke ? `<p>${ic('trophy')} Trụ được ${S.best || 0} ngày</p><button class="big" id="go">Mở lại quán</button>`
      : `<p class="lvup">${ic(WEATHER[S.wx].ic)} Ngày mai: <b>${WEATHER[S.wx].n}</b>. ${WEATHER[S.wx].d}</p>
         ${S.mNews ? `<p class="lvup ${S.mNews.up ? 'warn' : ''}">${ic(S.mNews.up ? 'chartup' : 'chartdown')} <b>${S.mNews.t}</b>${S.mNews.up ? ' — xem lại giá bán ở tab Chợ' : ''}</p>` : ''}
         ${S.ev ? `<p class="lvup">${ic(EVS[S.ev.id].ic)} <b>${EVS[S.ev.id].n}</b>. ${evText(S.ev)}</p>` : ''}
         ${nextLv ? `<p class="lvup">${ic('trophy')} Cấp ${nextLv}: ${low(LV_TXT[nextLv])}</p>` : ''}
         <button class="big" id="go">Ngày ${S.day} →</button>`}`;
  $('modal').hidden = false;
  $('go').onclick = () => {
    $('modal').hidden = true;
    if (broke) { const n = S.shopName, v = S.vib; S = fresh(); S.shopName = n; S.vib = v; S.coachDone = true; save() }
    R.tab = 'kho'; R.plan = {}; renderPrep(); window.scrollTo(0, 0);
  };
}

/* Xét sổ nợ: tới hẹn thì phần lớn người ta trả. Trễ quá ba lần thì coi
   như mất — và người đó tụt hẳn độ tin cậy, lần sau đừng cho vay nữa. */
function settleDebts() {
  let paid = 0, dead = 0;
  S.debts = S.debts.filter(d => {
    if (S.day < d.due) return true;
    const p = clamp(.5 + d.trust * .45, .2, .95);
    if (Math.random() < p) {
      const thanks = Math.random() < .35 ? r1000(d.amt * .05) : 0;
      paid += d.amt + thanks;
      S.paidBack = (S.paidBack || 0) + d.amt;
      const r = regOf(d.who); if (r) r.trust = clamp(r.trust + .18, 0, 1);
      return false;
    }
    d.tries++; d.late = (d.late || 0) + 1; d.due = S.day + 1;
    const r = regOf(d.who); if (r) r.trust = clamp(r.trust - .12, 0, 1);
    if (d.tries >= 3) {
      dead += d.amt; S.deadDebt = (S.deadDebt || 0) + d.amt;
      if (r) r.trust = clamp(r.trust - .3, 0, 1);
      return false;
    }
    return true;
  });
  return { paid, dead };
}

/* ============================================================
   ÂM THANH — tổng hợp hết bằng Web Audio, không dùng file nào.
   Mặc định TẮT. Bấm nút loa ở màn bán để bật, lựa chọn được nhớ lại.
   ============================================================ */
let SND = (() => { try { return localStorage.getItem('ctSound') === 'on' } catch (e) { return false } })();
let actx = null, auMaster = null;

function auCtx() {
  if (!SND) return null;
  try {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      auMaster = actx.createGain();
      auMaster.gain.value = .5;
      auMaster.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch (e) { return null }
}
function tone(f, at, dur, type, vol, to) {
  const c = auCtx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol || .18, t + .012);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(auMaster); o.start(t); o.stop(t + dur + .02);
}
function noise(at, dur, freq, q, vol) {
  const c = auCtx(); if (!c) return;
  const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(); s.buffer = b;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
  const g = c.createGain(); g.gain.value = vol || .12;
  s.connect(f); f.connect(g); g.connect(auMaster);
  s.start(c.currentTime + at);
}
const SFX = {
  pick: () => tone(660, 0, .09, 'triangle', .14),
  scoop: () => { noise(0, .12, 900, 1.2, .1); tone(420, .02, .1, 'sine', .1) },
  pour: () => noise(0, .3, 1400, .8, .07),
  soup: () => { tone(320, 0, .14, 'sine', .12); noise(.04, .16, 700, 1, .07) },
  ice: () => { noise(0, .1, 2600, 2, .09); noise(.07, .1, 3100, 2, .07) },
  box: () => { noise(0, .12, 500, 1.4, .1); tone(520, .06, .1, 'square', .07) },
  serve: () => { tone(523, 0, .12, 'triangle', .16); tone(784, .09, .16, 'triangle', .14) },
  star: () => { tone(880, 0, .1, 'sine', .12); tone(1175, .08, .14, 'sine', .11) },
  wrong: () => { tone(220, 0, .18, 'sawtooth', .12, 130); noise(.02, .15, 300, .8, .08) },
  arrive: () => { tone(587, 0, .1, 'sine', .12); tone(740, .07, .12, 'sine', .1) },
  leave: () => tone(330, 0, .22, 'sine', .1, 190),
  coin: () => { tone(1046, 0, .08, 'triangle', .13); tone(1318, .06, .12, 'triangle', .11) },
  buy: () => { tone(440, 0, .09, 'square', .1); tone(660, .07, .12, 'square', .09) },
  unlock: () => { tone(523, 0, .1, 'triangle', .13); tone(659, .08, .1, 'triangle', .12); tone(880, .16, .16, 'triangle', .11) },
  open: () => { tone(392, 0, .12, 'sine', .13); tone(523, .1, .14, 'sine', .12); tone(659, .2, .2, 'sine', .11) },
  dayEnd: () => { tone(659, 0, .14, 'sine', .12); tone(523, .12, .16, 'sine', .11); tone(392, .26, .24, 'sine', .1) },
  levelUp: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .08, .16, 'triangle', .12)) },
  broke: () => { tone(300, 0, .4, 'sawtooth', .12, 90) },
  slide: () => noise(0, .07, 1800, 1.6, .05),
  dump: () => { noise(0, .22, 400, .7, .1); tone(200, .04, .2, 'sine', .08, 120) },
  bike: () => { tone(160, 0, .3, 'sawtooth', .08, 240); noise(.05, .3, 600, .6, .05) },
  alarm: () => { [0, .18, .36].forEach(t => tone(880, t, .12, 'square', .13)) },
  block: () => { tone(300, 0, .1, 'square', .12); tone(500, .08, .12, 'square', .1) },
  lose: () => { tone(260, 0, .3, 'sawtooth', .13, 110); noise(.05, .25, 250, .7, .08) },
  rain: () => noise(0, .8, 900, .5, .07),
  shine: () => { tone(784, 0, .16, 'sine', .11); tone(1046, .12, .2, 'sine', .1) },
  ok: () => tone(700, 0, .1, 'sine', .12)
};
function sfx(n) { if (!SND) return; const f = SFX[n]; if (f) try { f() } catch (e) { } }
function toggleSnd() {
  SND = !SND;
  try { localStorage.setItem('ctSound', SND ? 'on' : 'off') } catch (e) { }
  if (SND) { auCtx(); sfx('ok') } else if (actx) { try { actx.close() } catch (e) { } actx = null; auMaster = null }
  toast(SND ? 'Đã bật tiếng' : 'Đã tắt tiếng');
}

/* ============================================================
   CÀI LÊN MÁY
   ============================================================ */
let deferredPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; refreshInstallBtn() });
addEventListener('appinstalled', () => { deferredPrompt = null; refreshInstallBtn() });
const isInstalled = () =>
  (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const ua = () => navigator.userAgent || '';
const isIOS = () => /iphone|ipad|ipod/i.test(ua()) ||
  (/Macintosh/.test(ua()) && navigator.maxTouchPoints > 1);
const canOfferInstall = () => !isInstalled() && (!!deferredPrompt || isIOS());
function refreshInstallBtn() {
  const b = $('installBtn');
  if (b) b.hidden = !canOfferInstall();
}
function doInstall() {
  if (deferredPrompt) {
    /* prompt() đòi phải có cử chỉ người dùng thật; gọi ngoài ngữ cảnh đó
       thì trình duyệt ném lỗi, bắt lại rồi chỉ dẫn tay cho người chơi */
    try {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => { deferredPrompt = null; refreshInstallBtn() }).catch(() => { });
      return;
    } catch (e) { }
  }
  installHelp();
}
function installHelp() {
  const ios = isIOS();
  const steps = ios
    ? [['Bấm nút Chia sẻ', 'Hình vuông có mũi tên đi lên, ở thanh dưới Safari'],
    ['Chọn "Thêm vào MH chính"', 'Kéo xuống một chút là thấy'],
    ['Bấm Thêm', 'Icon quán cơm sẽ nằm ở màn hình chính']]
    : [['Mở menu trình duyệt', 'Ba chấm ở góc phải'],
    ['Chọn "Cài ứng dụng"', 'Có thể ghi là "Thêm vào màn hình chính"'],
    ['Xác nhận Cài đặt', 'Xong là chơi như một app']];
  ask(`<div class="pbig">${ic('install')}</div><h2>Cài lên màn hình chính</h2>
    <p>Cài rồi thì game chạy toàn màn hình, không thanh địa chỉ, và <b>mất mạng vẫn chơi được</b>.</p>
    <div class="steps">${steps.map((s, i) => `
      <div class="step-row"><span class="stepn">${i + 1}</span>${s[0]}<p>${s[1]}</p></div>`).join('')}</div>`,
    [['Để sau', null], ['Mình hiểu rồi', null, 1]]);
}

/* ---------- MÀN CHÀO ---------- */
function showSplash() {
  const had = !!S.history.length || S.day > 1;
  $('splash').hidden = false;
  $('splash').innerHTML = `
    <div class="sp">
      <div class="spart">
        ${itemArt('suon', 76)}${itemArt('com', 96)}${itemArt('trada', 70)}
      </div>
      <h1>Tiệm Cơm Tấm</h1>
      <p>Múc cơm, gắp món, chan mỡ hành.<br>Mưa hay nắng cũng phải bán cho kịp.</p>
      <button class="big" id="spGo">${had ? 'Bán tiếp — ngày ' + S.day : 'Mở quán'}</button>
      ${had ? `<button class="sbtn" id="spNew">Chơi lại từ đầu</button>` : ''}
      <button class="instbtn" id="installBtn" hidden>${ic('install')}Cài lên màn hình chính</button>
      <i class="ver">v${GAME_VERSION}</i>
    </div>`;
  $('spGo').onclick = () => { $('splash').hidden = true; if (!had && !S.coachDone) showTour(); else renderPrep() };
  const nb = $('spNew');
  if (nb) nb.onclick = () => ask(`<div class="pbig">${ic('warn')}</div><h2>Chơi lại từ đầu?</h2><p>Toàn bộ tiến trình hiện tại sẽ mất.</p>`,
    [['Thôi', null], ['Xoá và chơi lại', () => { S = fresh(); save(); $('splash').hidden = true; showTour() }, 1]]);
  $('installBtn').onclick = doInstall;
  refreshInstallBtn();
}

function showTour(k) {
  k = k || 0;
  if (k >= TOUR.length) {
    if (canOfferInstall()) {
      ask(`<div class="pbig">${ic('install')}</div>
        <h2>Chơi cho đã hơn nhé?</h2>
        <p>Cài game lên màn hình chính thì chạy <b>toàn màn hình</b>, không thanh địa chỉ,
           và <b>mất mạng vẫn chơi được</b>. Tiến trình vẫn giữ nguyên.</p>`,
        [['Để sau', renderPrep], ['Cài lên máy', () => { doInstall(); renderPrep() }, 1]]);
      return;
    }
    renderPrep(); return;
  }
  const x = TOUR[k];
  ask(`<div class="pbig">${ic(x.i)}</div><h2>${x.t}</h2><p>${x.d}</p><i class="step">${k + 1}/${TOUR.length}</i>`,
    [[k < TOUR.length - 1 ? 'Tiếp' : 'Vào quán', () => showTour(k + 1), 1]]);
}

/* ---------- BOOT ---------- */
function boot() {
  load();
  tray = newTray();
  cfgSelfCheck();
  head();
  paintWeather();
  showSplash();
}
document.addEventListener('DOMContentLoaded', boot);
