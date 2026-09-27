/* ============================================================
   TRÌNH MÔ PHỎNG — chạy sau mỗi lần sửa số
   Dán vào console của trang game:
     fetch('dev/sim.js').then(r => r.text()).then(eval)

   Nó chơi hộ một người chơi "làm đúng mọi thứ" qua N ngày: nhập hàng
   theo dự kiến, làm đúng phiếu, đưa khách ngay. Mục đích không phải
   xem ai thắng, mà để bắt hai loại lỗi im lặng:

   - impossible > 0 : game đang sinh phiếu mà người chơi KHÔNG THỂ làm
     đúng (thiếu khu, thiếu quyền, món chưa mở). Đây là lỗi nặng nhất
     vì game vẫn chạy bình thường, chỉ là không ai làm nổi.
   - lãi ngày tụt dần : số bị lệch, càng chơi càng lỗ.
   ============================================================ */
(function (DAYS) {
  DAYS = DAYS || 26;
  const out = [];
  let impossible = 0, swapNeeded = 0, riceOut = 0;

  const unlockedMains = () => MAIN_KEYS.filter(k => S.unlocked[k]);

  /* nhập hàng theo đúng con số game gợi ý cho người chơi */
  function buy() {
    const e = expected(), n = Math.max(8, e.parts);
    R.plan = {};
    R.plan.com = Math.max(0, Math.min(riceCap() - qty('com'), Math.round(n * 2.2)));
    const ms = unlockedMains();
    ms.forEach(k => R.plan[k] = Math.max(0, Math.ceil(n * 1.25 / ms.length) - qty(k)));
    if (level() >= 2) {
      R.plan.mohanh = Math.max(0, Math.ceil(n * .6) - qty('mohanh'));
      DRINK_KEYS.filter(k => S.unlocked[k]).forEach(k => R.plan[k] = Math.max(0, Math.ceil(n * .3) - qty(k)));
    }
    if (level() >= 3) {
      CANH_KEYS.filter(k => S.unlocked[k]).forEach(k => R.plan[k] = Math.max(0, Math.ceil(n * .3) - qty(k)));
      R.plan.hop = Math.max(0, Math.ceil(n * .4) - qty('hop'));
      R.plan.bodo = Math.max(0, Math.ceil(n * .4) - qty('bodo'));
    }
    /* không bao giờ tiêu quá 70% két — người chơi cẩn thận cũng làm vậy */
    let guard = 0;
    while (planTotal() > S.money * .7 && guard++ < 400) {
      const ks = Object.keys(R.plan).filter(k => R.plan[k] > 0).sort((a, b) => buyCost(b) - buyCost(a));
      if (!ks.length) break;
      R.plan[ks[0]]--;
    }
    doBuy();
  }

  /* mua thêm món khi có tiền dư, theo thứ tự rẻ trước */
  function invest() {
    [...MAIN_KEYS, ...CANH_KEYS, ...DRINK_KEYS]
      .filter(k => !S.unlocked[k]).sort((a, b) => ITEMS[a].unlock - ITEMS[b].unlock)
      .forEach(k => {
        if (S.money > ITEMS[k].unlock * 3) {
          S.money -= ITEMS[k].unlock; S.unlocked[k] = true; S.sell[k] = suggest(k);
        }
      });
    UPG.forEach(u => {
      if (!S.upg[u.id] && S.money > u.cost * 4) { S.money -= u.cost; S.upg[u.id] = true }
    });
    /* Nhân viên là gánh nặng lương mỗi ngày và trong bản mô phỏng họ
       KHÔNG giúp gì (sim tự làm tất cả tức thì), nên chỉ thuê khi quán
       đã lớn. Thuê sớm ở đây sẽ cho ra kết quả bi quan hơn thực tế. */
    STAFF.forEach(u => {
      if (!S.upg[u.id] && S.money > 3000000 && S.money > u.cost * 6) { S.money -= u.cost; S.upg[u.id] = true }
    });
  }

  /* làm đúng một phiếu. trả false nếu kho không cho phép làm đúng */
  function make(o) {
    tray = newTray();
    for (let i = 0; i < o.rice; i++) {
      if (!take('com')) { riceOut++; return false }
      tray.rice++; tray.cost += buyCost('com');
    }
    for (const k of o.mons) {
      if (!take(k)) { swapNeeded++; return false }
      tray.mons.push(k); tray.cost += buyCost(k);
    }
    if (o.mohanh) { if (!take('mohanh')) { swapNeeded++; return false } tray.mohanh = true }
    if (o.canh) { if (!take(o.canh)) { swapNeeded++; return false } tray.canh = o.canh }
    if (o.drink) { if (!take(o.drink)) { swapNeeded++; return false } tray.drink = o.drink }
    if (o.togo) {
      if (!take('hop') || !take('bodo')) { swapNeeded++; return false }
      tray.togo = true; tray.bodo = true;
    }
    tray.used = true;
    /* phiếu hợp lệ nhưng khay không khớp được = lỗi thiết kế, không phải hết hàng */
    if (!matches(tray, o)) { impossible++; return false }
    return true;
  }

  function playDay() {
    startDay();
    clearInterval(timer);
    let guard = 0;
    while (R.running && guard++ < 6000) {
      tick();
      if (!R.running) break;
      R.slots.forEach((c, i) => {
        if (!c) return;
        const j = c.done.indexOf(false);
        if (j < 0) return;
        if (make(c.orders[j])) serve(i);
        else { tray = newTray(); sendAway(c) }
      });
      if (R.thief) catchThief();
    }
    if (R.running) { R.slots = R.slots.map(() => null); R.t = 0; endDay() }
    /* đóng hộp thoại kết ngày để vòng sau chạy tiếp */
    const go = document.getElementById('go');
    document.getElementById('modal').hidden = true;
    if (go) { } /* không bấm, vì bấm sẽ vẽ lại màn chuẩn bị */
  }

  const t0 = performance.now();
  S = fresh(); S.coachDone = true; save();
  rollDay(1);
  for (let d = 0; d < DAYS; d++) {
    if (S.money < 0) { out.push({ day: S.day, note: 'phá sản' }); break }
    invest();
    buy();
    playDay();
    const r = S.history[S.history.length - 1];
    out.push({
      day: r.day, wx: r.wx, sold: r.served, lost: r.lost,
      star: r.starN ? +(r.starSum / r.starN).toFixed(2) : 0,
      rev: recRev(r), profit: recRev(r) - recCost(r), cash: S.money,
      lv: levelOf(r.day)
    });
  }

  const res = {
    impossible, swapNeeded, riceOut,
    cfg: cfgSelfCheck(),
    ms: Math.round(performance.now() - t0),
    days: out
  };
  console.table(out);
  console.log('impossible =', impossible, '(phải là 0)');
  console.log('cfgSelfCheck =', res.cfg.length ? res.cfg : 'OK');
  window.__sim = res;
  return res;
})(26);
