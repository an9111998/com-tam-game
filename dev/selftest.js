/* ============================================================
   TỰ KIỂM CÁC LUỒNG — chạy sau mỗi lần sửa giao diện
     fetch('dev/selftest.js').then(r => r.text()).then(eval)

   Không kiểm tra cái đẹp, chỉ kiểm tra "bấm vào có nổ hay không":
   mọi tab, mọi khu món, mọi hộp thoại đều phải dựng được. Phần lớn lỗi
   đã gặp là loại này — một khoá sai tên làm cả màn trắng xoá.
   ============================================================ */
(function () {
  const fails = [], done = [];
  const ok = (name, fn) => {
    try { fn(); done.push(name) }
    catch (e) { fails.push(name + ' → ' + e.message) }
  };
  const has = (name, sel) => {
    if (!document.querySelector(sel)) fails.push(name + ' → không thấy ' + sel);
  };

  /* ---------- dựng một ván cấp 4 cho đủ mọi thứ mở ra ---------- */
  S = fresh(); S.coachDone = true; S.day = 22; S.money = 9000000;
  Object.keys(ITEMS).forEach(k => S.unlocked[k] = true);
  [...UPG, ...STAFF].forEach(u => S.upg[u.id] = true);
  rollDay(22);
  document.getElementById('splash').hidden = true;
  document.getElementById('modal').hidden = true;

  /* ---------- 1. mọi tab màn chuẩn bị ---------- */
  TABS.forEach(t => ok('tab ' + t.id, () => {
    R.tab = t.id; renderPrep();
    if (!document.querySelector('.pane').innerHTML.trim()) throw new Error('pane rỗng');
  }));

  /* ---------- 2. nhập hàng + mở cửa ---------- */
  ok('nhập hàng', () => {
    R.plan = {};
    STOCK_KEYS.forEach(k => R.plan[k] = k === 'com' ? 140 : 12);
    doBuy();
    if (qty('suon') < 1) throw new Error('kho vẫn rỗng');
  });
  ok('mở cửa', () => { startDay(); clearInterval(timer); has('màn bán', '#plateBox') });

  /* ---------- 3. mọi khu món ---------- */
  ok('có khách', () => { spawn(); if (!R.slots.filter(Boolean).length) throw new Error('không ai vào') });
  stationList().forEach(s => ok('khu ' + s.id, () => {
    goStation(s.id);
    if (!document.querySelector('.stpanel').innerHTML.trim()) throw new Error('khu rỗng');
  }));

  /* ---------- 4. làm đúng một phiếu mang đi rồi giao ---------- */
  ok('phần mang đi', () => {
    const c = R.slots.filter(Boolean)[0];
    R.focus = c.id;
    c.orders = [{ rice: 3, mons: ['suon', 'cha'], mohanh: true, canh: 'khoqua', drink: 'tratac', togo: true }];
    c.done = [false]; c.order = c.orders[0];
    tray = newTray();
    tapRice(); tapRice(); tapRice(); tapMoHanh();
    tapItem('suon'); tapItem('cha'); tapItem('khoqua'); tapItem('tratac');
    tapItem('hop'); tapItem('bodo');
    if (!matches(tray, c.order)) throw new Error('khay không khớp phiếu mang đi');
    const before = S.money;
    serve(R.slots.indexOf(c));
    if (S.money <= before) throw new Error('giao xong mà không thu được tiền');
  });

  /* ---------- 5. hết món thì mời đổi món ---------- */
  ok('mời đổi món', () => {
    spawn();
    const c = R.slots.filter(Boolean)[0];
    R.focus = c.id;
    c.orders = [{ rice: 2, mons: ['bonuong'], mohanh: false, canh: null, drink: null, togo: false }];
    c.done = [false]; c.order = c.orders[0];
    S.stock.bonuong = [];                       /* vừa hết bò nướng */
    tray = newTray();
    if (!stuckItems(c).length) throw new Error('không nhận ra là đã hết món');
    const sub = subFor('bonuong');
    if (!sub) throw new Error('không tìm được món để mời đổi');
    doSwap(c, 'bonuong', sub, 2000);
    if (c.order.mons[0] === 'bonuong' && !R.slots.every(x => x !== c)) throw new Error('đổi món không ăn');
  });

  /* ---------- 6. chạy chợ gấp ---------- */
  ok('chạy chợ gấp', () => {
    S.stock.tomrim = [];
    rushBuy('tomrim');
    if (!R.rush.length) throw new Error('không đặt được chuyến chợ');
    R.rush[0].t = 0; rushTick(.1);
    if (qty('tomrim') <= 0) throw new Error('hàng không về');
  });

  /* ---------- 7. treo bảng hết món ---------- */
  ok('treo bảng hết món', () => {
    toggleSoldout('cachien');
    if (!off('cachien')) throw new Error('treo bảng không có tác dụng');
    for (let i = 0; i < 40; i++) {
      const o = genOrder();
      if (o && o.mons.includes('cachien')) throw new Error('vẫn còn khách gọi món đã treo bảng');
    }
    toggleSoldout('cachien');
  });

  /* ---------- 8. trộm ---------- */
  ok('trộm ban ngày', () => {
    S.upg.baove = false;
    spawnThief();
    if (!R.thief) throw new Error('trộm không hiện ra');
    has('nút chặn trộm', '#thiefBtn');
    catchThief();
    if (R.thief) throw new Error('chặn rồi mà vẫn còn');
    S.upg.baove = true;
  });
  ok('mất tiền nếu không chặn', () => {
    S.upg.baove = false; R.thiefDone = false;
    spawnThief();
    if (!R.thief) { S.upg.baove = true; return }
    const before = S.money;
    R.thief.t = 0; thiefTick(.1);
    if (S.money >= before) throw new Error('không chặn mà cũng không mất gì');
    S.upg.baove = true;
  });

  /* ---------- 9. cho khách vay ---------- */
  ok('cho vay tiền', () => {
    spawn();
    const c = R.slots.filter(Boolean)[0];
    c.wantLoan = { amt: 120000, why: 'thử', days: 3 };
    const before = S.money, n = S.debts.length;
    doLend(c);
    if (S.debts.length !== n + 1) throw new Error('không vào sổ nợ');
    if (S.money !== before - 120000) throw new Error('tiền không trừ đúng');
  });
  ok('thu nợ khi tới hẹn', () => {
    S.debts.forEach(d => { d.due = S.day; d.trust = 1 });
    const r = settleDebts();
    if (r.paid <= 0) throw new Error('tin cậy 100% mà vẫn không ai trả');
  });
  ok('nợ xấu', () => {
    S.debts = [{ id: 1, who: 'Thử', look: 0, amt: 90000, due: S.day, trust: 0, tries: 2, late: 2 }];
    const r = settleDebts();
    if (r.dead <= 0 && S.debts.length) throw new Error('nợ quá 3 lần mà không thành nợ xấu');
  });

  /* ---------- 10. thời tiết đổi giữa buổi ---------- */
  ok('đổi thời tiết', () => {
    R.wxTurn = false; R.t = dayLen() * 60 * .5; R.wx = 'nang';
    const old = R.wx;
    for (let i = 0; i < 2000 && R.wx === old; i++) { R.wxTurn = false; wxTick() }
    paintWeather();
    if (!document.getElementById('wx').className.startsWith('wx-')) throw new Error('lớp thời tiết không đổi');
  });

  /* ---------- 11. kết ngày ---------- */
  ok('kết ngày', () => {
    const d = S.day;
    R.slots = R.slots.map(() => null); R.t = 0;
    endDay();
    if (!document.getElementById('go')) throw new Error('không có nút sang ngày mới');
    if (S.money >= 0 && S.day !== d + 1) throw new Error('không sang được ngày mới');
    document.getElementById('modal').hidden = true;
  });
  ok('về màn chuẩn bị', () => { renderPrep(); has('màn chuẩn bị', '#openBtn') });

  /* ---------- 12. hộp thoại ---------- */
  ok('hộp thoại vay vốn', () => { askLoan('bank'); has('chọn mức vay', '[data-amt]'); document.getElementById('modal').hidden = true });
  ok('hộp thoại nâng cấp', () => { S.upg.cam = false; buyUpg('cam'); has('nút mua', '.askrow .big'); document.getElementById('modal').hidden = true; S.upg.cam = true });
  ok('hướng dẫn', () => { showTour(0); has('bước hướng dẫn', '.card h2'); document.getElementById('modal').hidden = true });

  const cfg = cfgSelfCheck();
  const res = { pass: done.length, fail: fails.length, fails, cfg };
  console.log(fails.length ? '✗ ' + fails.join('\n✗ ') : '✓ tất cả ' + done.length + ' phép thử đều xong');
  console.log('cfgSelfCheck =', cfg.length ? cfg : 'OK');
  window.__selftest = res;
  return res;
})();
