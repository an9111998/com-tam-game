/* ============================================================
   DỰNG NHANH MỘT VÁN GIỮA GAME — để soi giao diện mà không phải
   chơi lại từ ngày 1. Dán vào console:
     fetch('dev/scene.js').then(r => r.text()).then(eval)

   Nó tạo ngày 14 (cấp 3: có canh, có mang đi), mở sẵn mấy món,
   nhập đầy kho rồi mở cửa và cho hai khách vào.
   KHÔNG dùng trong bản deploy — thư mục dev/ bị .vercelignore chặn.
   ============================================================ */
(function () {
  S = fresh();
  S.coachDone = true;
  S.day = 14;
  ['khoqua', 'tratac', 'trachanh', 'heoquay', 'duiga', 'rauxao', 'cachien', 'baroi']
    .forEach(k => { if (ITEMS[k]) S.unlocked[k] = true });
  S.money = 4000000;
  S.cur = newRec(S.day);
  rollDay(14);
  S.wx = 'nang';
  R.plan = {
    com: 120, suon: 14, bi: 10, cha: 10, opla: 10, heoquay: 8, duiga: 8, rauxao: 8,
    cachien: 8, baroi: 8, mohanh: 20, trada: 14, nuocsuoi: 8, tratac: 8, trachanh: 8,
    khoaimo: 10, khoqua: 10, hop: 14, bodo: 14
  };
  doBuy();
  document.getElementById('splash').hidden = true;
  document.getElementById('modal').hidden = true;
  startDay();
  clearInterval(timer);                 /* đóng băng đồng hồ để soi cho kỹ */
  spawn(); spawn();
  console.log('Đã dựng ngày', S.day, '— cấp', level(), '— khách:', R.slots.filter(Boolean).length);
  return { day: S.day, lv: level(), khach: R.slots.filter(Boolean).map(c => c.name) };
})();
