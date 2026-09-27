/* ============================================================
   DATA — thực đơn, thời tiết, chợ, nâng cấp, sự kiện, lời thoại
   Một bảng phẳng khai báo bằng hàm curry: thêm món mới chỉ tốn
   đúng một dòng, và mọi chỗ khác trong game tự thấy món đó.
   ============================================================ */

/* [khoá, tên, tên ngắn, màu, hạn dùng (ngày), giá nhập, giá bán mặc định, giá mở khoá, họ món] */
const ITEMS = {};
const mk = (type, g) => (k, n, sn, c, life, cost, sell, unlock, fam) => {
  ITEMS[k] = { n, s: sn || n, type, g, c, life, cost, sell, unlock, fam: fam || g };
};

/* ---------- MÓN CHÍNH (12) ----------
   Hạn dùng ngắn là nguồn sức ép chính: thịt tươi để qua ngày là hỏng,
   nên mỗi sáng phải đoán hôm nay bán được bao nhiêu.
   Thứ tự xếp từ rẻ tới đắt để lộ trình mở khoá rõ ràng.               */
const MN = mk('mon', 'mon');
MN('bi',       'Bì',            'Bì',      '#e8d9a8', 2,  4000,  8000,       0, 'nguoi');
MN('opla',     'Trứng ốp la',   'Ốp la',   '#f7d764', 7,  4500,  8000,       0, 'nguoi');
MN('cha',      'Chả trứng',     'Chả',     '#e0a84e', 2,  7000, 12000,       0, 'nguoi');
MN('suon',     'Sườn nướng',    'Sườn',    '#a9642f', 2, 12000, 25000,       0, 'nuong');
MN('rauxao',   'Rau xào',       'Rau xào', '#6fa35a', 1,  5000, 10000,  120000, 'rau');
MN('cachien',  'Cá chiên',      'Cá',      '#c8a878', 2, 11000, 20000,  240000, 'bien');
MN('duiga',    'Đùi gà',        'Đùi gà',  '#c98a44', 2, 14000, 25000,  200000, 'quay');
MN('baroi',    'Ba rọi',        'Ba rọi',  '#d09a80', 2, 13000, 24000,  320000, 'nuong');
MN('heoquay',  'Heo quay',      'Heo quay','#b4703a', 1, 15000, 28000,  260000, 'quay');
MN('tomrim',   'Tôm rim',       'Tôm',     '#e8734f', 1, 18000, 32000,  420000, 'bien');
MN('mucxao',   'Mực xào',       'Mực',     '#e6dcd0', 1, 20000, 35000,  560000, 'bien');
MN('bonuong',  'Bò nướng',      'Bò',      '#8f4a35', 2, 22000, 38000,  700000, 'nuong');

/* ---------- CANH (2) — mở từ cấp 3 ---------- */
const CA = mk('canh', 'canh');
CA('khoaimo',  'Canh khoai mỡ', 'Khoai mỡ','#9b7fc0', 1,  3500,  8000,       0, 'canh');
CA('khoqua',   'Canh khổ qua',  'Khổ qua', '#7faa55', 1,  4500, 10000,  150000, 'canh');

/* ---------- NƯỚC (4) — mở từ cấp 2 ---------- */
const NU = mk('nuoc', 'nuoc');
NU('trada',    'Trà đá',        'Trà đá',  '#c89a5e', 1,  1000,  3000,       0, 'tra');
NU('nuocsuoi', 'Nước suối',     'Suối',    '#9ecbe8', 0,  3500,  8000,       0, 'chai');
NU('tratac',   'Trà tắc',       'Trà tắc', '#e8a844', 1,  3500, 10000,   80000, 'tra');
NU('trachanh', 'Trà chanh',     'Trà chanh','#dbe05e',1,  3800, 12000,  120000, 'tra');

/* ---------- PHỤ ---------- */
const PH = mk('phu', 'phu');
PH('mohanh',   'Mỡ hành',       'Mỡ hành', '#a8c96a', 2,  1500,  3000,       0, 'phu');

/* ---------- CƠM ----------
   Cơm tính theo muôi. Người chơi chạm nồi 1/2/3 lần, mỗi lần một muôi.
   Giá bán ba mức đặt riêng nên vẫn tự do định giá như mọi món khác.    */
ITEMS.com = { n: 'Cơm tấm', s: 'Cơm', type: 'com', g: 'com', c: '#f6ecd8', life: 1, cost: 1800, unlock: 0, fam: 'com' };

const RICE = [
  { id: 1, n: 'Ít cơm',           s: 'Ít',    scoop: 1, k: 'com1' },
  { id: 2, n: 'Cơm bình thường',  s: 'Vừa',   scoop: 2, k: 'com2' },
  { id: 3, n: 'Nhiều cơm',        s: 'Nhiều', scoop: 3, k: 'com3' }
];
const RICE_SELL = { com1: 8000, com2: 12000, com3: 16000 };
const riceOf = n => RICE.find(r => r.id === n) || RICE[1];

/* ---------- DỤNG CỤ MANG ĐI ----------
   Một phần mang đi tốn ĐÚNG hai thứ: hộp đựng và bộ dụng cụ
   (muỗng, đũa, ly, ống hút). Thiếu một trong hai là không gói được.   */
ITEMS.hop = { n: 'Hộp mang đi', s: 'Hộp', type: 'sup', g: 'sup', c: '#f0e4cc', life: 0, cost: 2000, unlock: 0, fam: 'sup' };
ITEMS.bodo = { n: 'Bộ muỗng đũa + ly ống hút', s: 'Bộ dụng cụ', type: 'sup', g: 'sup', c: '#dfe8ee', life: 0, cost: 1500, unlock: 0, fam: 'sup' };

const keysOf = t => Object.keys(ITEMS).filter(k => ITEMS[k].type === t);
const MAIN_KEYS = keysOf('mon');
const CANH_KEYS = keysOf('canh');
const DRINK_KEYS = keysOf('nuoc');
const SUP_KEYS = keysOf('sup');
/* mọi thứ nằm trong kho — cơm cũng là hàng phải nấu mỗi sáng */
const STOCK_KEYS = [...MAIN_KEYS, ...CANH_KEYS, ...DRINK_KEYS, 'mohanh', 'com', ...SUP_KEYS];

const iname = k => ITEMS[k] ? ITEMS[k].n : k;
const ishort = k => ITEMS[k] ? ITEMS[k].s : k;
const low = n => (n || '').toLowerCase();

/* ---------- NĂM KHU TRONG QUÁN ----------
   Vuốt ngang để đi giữa các khu. Gom theo tay người làm thật:
   nồi cơm một chỗ, khay món mặn một chỗ, nồi canh, thùng nước,
   góc gói mang đi. Nhờ vậy khay món mặn không bị lẫn với nước.      */
const STATIONS = [
  { id: 'com',  n: 'Nồi cơm',   i: 'rice',   lv: 1 },
  { id: 'mon',  n: 'Khay món',  i: 'plate',  lv: 1 },
  { id: 'canh', n: 'Nồi canh',  i: 'soup',   lv: 3 },
  { id: 'nuoc', n: 'Thùng nước',i: 'cup',    lv: 2 },
  { id: 'goi',  n: 'Gói mang đi', i: 'box',  lv: 3 }
];

/* ---------- HOẠT ẢNH TỪNG ĐỘNG TÁC ----------
   p: loại hạt · n: số hạt · a: kiểu bay · d: thời lượng (ms)
   Khoá bắt đầu bằng __ là động tác chung, không phải món.             */
const FXMAP = {
  __rice:  { p: 'grain',  n: 7,  a: 'fall',   d: 620,  lbl: 'Một muôi cơm' },
  __mon:   { p: 'steam',  n: 6,  a: 'rise',   d: 760 },
  __canh:  { p: 'drop',   n: 8,  a: 'rise',   d: 820,  lbl: 'Múc canh' },
  __nuoc:  { p: 'ice',    n: 7,  a: 'fall',   d: 780,  lbl: 'Thêm đá' },
  __mohanh:{ p: 'onion',  n: 9,  a: 'fall',   d: 820,  lbl: 'Chan mỡ hành' },
  __box:   { p: 'spark',  n: 6,  a: 'pop',    d: 700,  lbl: 'Gói xong' },
  __serve: { p: 'star',   n: 11, a: 'rise',   d: 1200 },
  __wrong: { p: 'puff',   n: 7,  a: 'pop',    d: 760 },
  __money: { p: 'coin',   n: 8,  a: 'rise',   d: 1000 },
  __thief: { p: 'puff',   n: 10, a: 'pop',    d: 900,  lbl: 'Chặn được!' }
};

/* giá bán mặc định — người chơi đổi được hết ở tab Giá */
const DEF_SELL = { ...RICE_SELL };
Object.keys(ITEMS).forEach(k => { if (ITEMS[k].sell) DEF_SELL[k] = ITEMS[k].sell });

/* ---------- KHI HẾT MÓN THÌ MỜI KHÁCH ĐỔI GÌ ----------
   Đổi trong cùng họ món trước (nướng đổi nướng, hải sản đổi hải sản)
   vì khách dễ chịu hơn nhiều so với bị đẩy sang món khác hẳn.        */
const FAM_NEAR = {
  nuong: ['nuong', 'quay', 'nguoi'],
  quay: ['quay', 'nuong', 'nguoi'],
  nguoi: ['nguoi', 'nuong', 'quay'],
  bien: ['bien', 'nuong', 'quay'],
  rau: ['rau', 'nguoi', 'bien'],
  canh: ['canh'],
  tra: ['tra', 'chai'],
  chai: ['chai', 'tra'],
  /* mỡ hành không có gì thay được: hết là hết, chỉ còn cách chạy chợ */
  phu: ['phu']
};

/* ---------- THỜI TIẾT ----------
   mul: khách ghé · drink: khách gọi nước · canh: khách gọi canh
   togo: khách gọi mang đi · pat: mức kiên nhẫn                        */
const WEATHER = {
  mat: {
    n: 'Trời mát', ic: 'cloud', c: '#b8cdd8', mul: 1.0, drink: 1.0, canh: 1.15, togo: 1.0, pat: 1.1,
    d: 'Se se mát, ngày bán dễ chịu nhất'
  },
  nang: {
    n: 'Nắng đẹp', ic: 'sun', c: '#f4c95d', mul: 1.08, drink: 1.25, canh: .95, togo: 1.0, pat: 1.0,
    d: 'Trời trong, khách ghé đều tay'
  },
  gat: {
    n: 'Nắng gắt', ic: 'sun', c: '#ef9d3f', mul: 1.22, drink: 1.75, canh: .6, togo: 1.15, pat: .78,
    d: 'Nắng cháy da: đông khách, ai cũng gọi thêm nước đá, nhưng ngồi chờ là nổi nóng'
  },
  rao: {
    n: 'Mưa rào', ic: 'rain', c: '#8fb0cc', mul: .78, drink: .7, canh: 1.4, togo: 1.55, pat: 1.15,
    d: 'Mưa bất chợt: vắng hơn nhưng nhiều người gọi mang đi'
  },
  dam: {
    n: 'Mưa dầm', ic: 'rain', c: '#7e93a8', mul: .6, drink: .5, canh: 1.7, togo: 1.85, pat: 1.25,
    d: 'Mưa cả buổi: khách thưa hẳn, bù lại đơn mang đi và canh nóng bán chạy'
  }
};
const WX_KEYS = Object.keys(WEATHER);
/* trọng số để ngày nào cũng có thời tiết, mưa ít gặp hơn nắng */
const WX_W = [20, 30, 20, 18, 12];

/* ---------- SỰ KIỆN NGÀY ---------- */
const EVS = {
  cuoituan: { n: 'Cuối tuần',          d: 'Khách rảnh rỗi, đông hơn 25% và hay gọi thêm món',    ic: 'people', mul: 1.25 },
  tanca:    { n: 'Công nhân tan ca',   d: 'Giữa buổi có một tốp ghé cùng lúc, gọi mang đi nhiều', ic: 'clock',  mul: 1.1 },
  le:       { n: 'Ngày lễ',            d: 'Khách đông gấp đôi và tiền dư trả rất thoáng tay',     ic: 'gift',   mul: 1.9 },
  tiktok:   { n: 'Có người review',    d: 'Một bạn quay clip ghé quán: làm tốt được 3 lời khen, làm dở thì ngược lại', ic: 'star', mul: 1.05 },
  chosom:   { n: 'Chợ sớm rẻ',         d: 'Nhập % rẻ hơn 25% trong hôm nay',                      ic: 'price',  mul: 1 },
  hot:      { n: 'Món đang được khen', d: 'Hôm nay % được gọi nhiều gấp đôi, nhớ chuẩn bị đủ',    ic: 'chart',  mul: 1.05 },
  matdien:  { n: 'Mất điện',           d: 'Quạt không chạy, khách nóng nực nên mất kiên nhẫn nhanh hơn', ic: 'warn', mul: .9 },
  hocsinh:  { n: 'Học sinh thi',       d: 'Trưa nay phụ huynh mua mang đi rất nhiều',             ic: 'box',    mul: 1.15 }
};

/* ---------- CHỢ ĐẦU MỐI ----------
   Giá nhập trôi mỗi ngày theo bước ngẫu nhiên, thỉnh thoảng có món
   sốt giá hẳn. Khi chợ đắt thì khách CŨNG biết, nên trần chê đắt nới
   ra — đó là lúc nên tăng giá bán, không phải cắn lỗ.                */
const MARKET_NEWS = [
  { t: 'Heo hơi lên giá', ks: ['suon', 'baroi', 'heoquay', 'bi', 'cha'] },
  { t: 'Gà vào mùa thiếu hàng', ks: ['duiga'] },
  { t: 'Biển động, hàng về ít', ks: ['tomrim', 'mucxao', 'cachien'] },
  { t: 'Trứng tăng giá', ks: ['opla', 'cha'] },
  { t: 'Rau củ lên giá sau mưa', ks: ['rauxao', 'khoaimo', 'khoqua', 'mohanh'] },
  { t: 'Bò nhập khan hàng', ks: ['bonuong'] },
  { t: 'Đá và nước ngọt lên giá dịp nóng', ks: ['trada', 'nuocsuoi', 'tratac', 'trachanh'] },
  { t: 'Gạo tấm lên giá', ks: ['com'] }
];

/* ---------- BA KIỂU KHÁCH KHÓ ---------- */
const QUIRKS = {
  vasoi: {
    n: 'Đang vội', i: 'clock', c: '#e88a6a',
    d: 'Kiên nhẫn chỉ bằng 55% bình thường — làm nhanh còn kịp'
  },
  kho: {
    n: 'Khó tính', i: 'warn', c: '#d99a4e',
    d: 'Chấm sao khắt khe: chậm một chút hay sai một món là trừ thẳng'
  },
  doiy: {
    n: 'Hay đổi ý', i: 'reload', c: '#a98cc0',
    d: 'Đang chờ có thể đổi món giữa chừng, nhớ xem lại phiếu'
  }
};

/* ---------- NÂNG CẤP ---------- */
const UPG = [
  { id: 'ban4',   n: 'Kê thêm bàn',          d: 'Nhận cùng lúc 5 khách thay vì 3 — thứ đáng mua sớm nhất', cost: 700000, i: 'people' },
  { id: 'bang',   n: 'Bảng hiệu đèn LED',    d: 'Thêm 20% khách ghé',                                   cost: 400000,  i: 'sun' },
  { id: 'fb',     n: 'Đăng bài Facebook',    d: 'Thêm 25% khách ghé',                                   cost: 600000,  i: 'phone' },
  { id: 'maiche', n: 'Mái che trước quán',   d: 'Trời mưa chỉ vắng một nửa so với bình thường',          cost: 850000,  i: 'rain' },
  { id: 'quat',   n: 'Quạt hơi nước',        d: 'Khách chịu chờ lâu hơn 25%, nắng gắt cũng đỡ',          cost: 550000,  i: 'wind' },
  { id: 'tukinh', n: 'Tủ kính giữ nóng',     d: 'Món mặn để được thêm 1 ngày, đỡ phải bỏ',               cost: 1100000, i: 'box' },
  { id: 'noicom', n: 'Nồi cơm điện to',      d: 'Mỗi lần nấu được thêm 40 muôi cơm',                     cost: 480000,  i: 'rice' },
  { id: 'cam',    n: 'Camera an ninh',       d: 'Trộm ban đêm gần như không còn, và dễ bắt trộm ban ngày', cost: 900000, i: 'eye' },
  { id: 'ketsat', n: 'Két sắt',              d: 'Bị trộm thì mất ít hơn nhiều',                          cost: 700000,  i: 'money' },
  { id: 'xecho',  n: 'Xe máy chở hàng',      d: 'Chạy chợ gấp nhanh gấp đôi và đỡ bị hớ giá',            cost: 950000,  i: 'bike' }
];

/* ---------- NHÂN VIÊN ----------
   Chia việc đúng như quán thật: một bạn đứng nồi cơm, một bạn đứng
   khay món. Thuê cả hai thì người chơi chỉ còn việc chốt đơn.        */
const STAFF = [
  { id: 'nv1', n: 'Bạn múc cơm', d: 'Tự múc cơm đúng khẩu phần và chan mỡ hành khi phiếu có', cost: 420000, wage: 'wage1', i: 'rice' },
  { id: 'nv2', n: 'Bạn múc món', d: 'Tự gắp món mặn, múc canh và rót nước cho đơn đang làm',   cost: 780000, wage: 'wage2', i: 'plate' },
  { id: 'baove', n: 'Anh bảo vệ', d: 'Trông xe và chặn trộm giúp bạn, cả ngày lẫn đêm',        cost: 600000, wage: 'wage3', i: 'shield' }
];

/* ---------- QUÀ / SỰ CỐ ---------- */
const GIFTS = [
  { n: 'Khách quen gửi quà quê',   d: 'Cô khách ruột mang cho ít đồ quê, còn dúi thêm tiền lì xì', min: 50000, max: 180000 },
  { n: 'Trả lại ví khách để quên', d: 'Bạn giữ giúp chiếc ví, khách quay lại hậu tạ',             min: 80000, max: 250000 },
  { n: 'Bán vỏ lon, thùng giấy',   d: 'Dọn kho bán ve chai được chút tiền',                        min: 20000, max: 60000 },
  { n: 'Quán được lên báo khu',    d: 'Trang ăn uống của khu viết bài, khách kéo tới',             min: 200000, max: 320000, need: () => upgCount() >= 2 },
  { n: 'Nhận đặt tiệc cơ quan',    d: 'Một cơ quan gần đó đặt suất trưa, trả trước',               min: 250000, max: 600000, need: () => S.day >= 12 },
  { n: 'Nhãn nước ngọt tài trợ',   d: 'Quán đông và được khen nhiều nên có nhãn hàng tài trợ tủ lạnh', min: 400000, max: 700000, need: () => S.reviews.length >= 20 && rating() >= 4.5 },
  { n: 'Chợ trả lại tiền hàng',    d: 'Lô hàng hôm trước giao thiếu, chủ vựa hoàn lại',            min: 50000, max: 200000 },
  { n: 'Khách trả nợ kèm cảm ơn',  d: 'Một người từng xin ghi nợ quay lại trả cả gốc lẫn chút quà', min: 60000, max: 220000, need: () => (S.paidBack || 0) > 0 }
];

const BAD = [
  { id: 'gas',   n: 'Hết gas giữa buổi',  d: 'Bình gas cạn đúng giờ cao điểm, phải gọi đổi gấp',  min: 60000,  max: 180000 },
  { id: 'vo',    n: 'Vỡ chồng đĩa',       d: 'Một chồng đĩa rơi, phải mua bù',                    min: 40000,  max: 130000 },
  { id: 'dien',  n: 'Hoá đơn điện tăng',  d: 'Chạy tủ lạnh và quạt nhiều nên tiền điện vọt lên',  min: 50000,  max: 190000 },
  { id: 'phuong',n: 'Phường nhắc lấn lề', d: 'Bị nhắc vì kê bàn ra lề đường, đóng phí',           min: 80000,  max: 220000 },
  { id: 'chuot', n: 'Chuột vào kho',      d: 'Chuột gặm mất ít hàng trong kho',                    min: 40000,  max: 160000 }
];

/* ---------- TRỘM ----------
   Ban ngày: kẻ trộm lảng vảng, chạm vào là chặn được. Ban đêm: cạy
   cửa, chỉ camera / két sắt / bảo vệ đỡ được.                        */
const THIEF_DAY = [
  { n: 'Có người thò tay vào két tiền!', w: 'két' },
  { n: 'Có người tính bê nồi cơm đi!',   w: 'nồi cơm' },
  { n: 'Có người lấy điện thoại trên bàn!', w: 'điện thoại' },
  { n: 'Có người dắt xe khách ra khỏi quán!', w: 'xe khách' }
];

/* ---------- TÊN KHÁCH ---------- */
const KH_NU = ['An', 'Ánh', 'Châu', 'Chi', 'Dung', 'Duyên', 'Giang', 'Hà', 'Hân', 'Hằng', 'Hiền', 'Hoa', 'Hương',
  'Huyền', 'Lan', 'Linh', 'Ly', 'Mai', 'My', 'Nga', 'Ngân', 'Ngọc', 'Nhi', 'Nhung', 'Như', 'Phượng', 'Quyên',
  'Quỳnh', 'Tâm', 'Thanh', 'Thảo', 'Thu', 'Thuỳ', 'Trang', 'Trâm', 'Trúc', 'Uyên', 'Vân', 'Vy', 'Yến'];
const KH_NAM = ['Bảo', 'Bình', 'Cường', 'Đạt', 'Dũng', 'Duy', 'Dương', 'Đức', 'Hải', 'Hiếu', 'Hoàng', 'Huy',
  'Hùng', 'Khang', 'Khoa', 'Kiên', 'Lâm', 'Long', 'Minh', 'Nam', 'Nghĩa', 'Phát', 'Phong', 'Phúc', 'Quân',
  'Sơn', 'Tài', 'Thành', 'Thịnh', 'Tiến', 'Trí', 'Trung', 'Tú', 'Tuấn', 'Tùng', 'Việt', 'Vinh', 'Vũ'];
/* Cách gọi thân mật của người Sài Gòn, ghép trước tên cho ra không khí
   quán lề đường. Phải tách theo giới: ghép bừa sẽ ra "Chị Duy", "Cô Tuấn"
   — sai kiểu mà người Việt nào đọc cũng thấy ngay. */
const KH_XUNG_NU = ['Chị', 'Cô', 'Dì', 'Em', 'Bạn', 'Bác'];
const KH_XUNG_NAM = ['Anh', 'Chú', 'Bác', 'Em', 'Bạn'];

const OPEN = ['Cho', 'Bán cho', 'Làm cho', 'Cho mình', 'Cho con'];
const ENDS = [' nha!', ' nhé!', '.', ' nghe!', ' đi bạn!', ' ơi!'];

/* ---------- LỜI KHÁCH NÓI ----------
   {mon} = tên món · {kh} = tên khách                                */
const TXT = {
  great: [
    'Sườn nướng thơm phức, cơm nóng hổi, quá đúng ý',
    'Ăn ở đây mấy năm rồi, {mon} vẫn ngon như ngày đầu',
    'Cơm dẻo mỡ hành thơm, nước mắm chua ngọt vừa miệng',
    'Quán làm nhanh mà đâu ra đó, phục vụ dễ thương nữa',
    'Đĩa cơm đầy đặn, giá này là quá đáng tiền',
    '{mon} ở đây hơn mấy chỗ đông khách ngoài kia',
    'Ăn xong no tới chiều, mai ghé nữa',
    'Canh nóng uống vô là tỉnh cả người',
    'Trưa nào cũng ghé, chưa lần nào thất vọng',
    'Gói mang đi kỹ càng, về tới nhà cơm còn nóng',
    'Bì thái mỏng, chả chắc thịt, chuẩn cơm tấm Sài Gòn',
    'Chủ quán nhớ cả khẩu phần cơm của mình luôn',
    'Nhìn khay món bóng bẩy là biết làm có tâm',
    'Đúng vị tuổi thơ, ăn miếng đầu là nhớ liền'
  ],
  ok: [
    'Ổn, {mon} vừa miệng',
    'Cơm được, no bụng là mừng',
    'Đủ món đủ vị, không có gì để chê',
    'Tạm ổn, mai chắc ghé lại',
    'Làm gọn gàng, ăn thấy ngon'
  ],
  meh: [
    'Cũng được nhưng chờ hơi lâu',
    'Bình thường thôi, chưa có gì đặc biệt',
    'Cơm ổn mà đợi mệt',
    'Được, mà giá hơi cao so với đĩa cơm này'
  ],
  bad: [
    'Chờ quá lâu, cơm nguội hết rồi',
    '{mon} làm chưa tới, hơi thất vọng',
    'Đợi mãi mới tới lượt, chắc mình tìm chỗ khác',
    'Không hài lòng, lần sau cân nhắc'
  ],
  wait: [
    'Đợi dài cổ mới có cơm',
    'Quán đông mà làm chậm quá',
    'Chờ hơi lâu, mong lần sau nhanh hơn',
    'Đói bụng mà ngồi cả buổi'
  ],
  wrong: [
    'Mình gọi {mon} mà đưa món khác',
    'Nhầm đơn rồi bạn ơi',
    'Khẩu phần cơm không đúng như mình nói',
    'Quên mỡ hành của mình rồi'
  ],
  pricey: [
    'Cơm ngon nhưng giá cao quá',
    'Đắt hơn mấy quán quanh đây nhiều',
    'Giá này thì mình phải cân nhắc lại',
    'Ngon thật nhưng ví mình không theo nổi'
  ],
  cheap: [
    'Giá mềm mà đĩa cơm đầy, quá hời',
    'Rẻ hơn chỗ khác mà ngon hơn hẳn',
    'Giá này là thương khách rồi'
  ],
  timeout: [
    'Đợi mãi không ai lấy đơn, mình đi chỗ khác',
    'Chờ hết nổi, thôi đi ăn quán bên',
    'Không ai ra tiếp, thất vọng'
  ],
  soldout: [
    'Hết {mon} rồi mà bảng còn treo',
    'Tới nơi mới biết không còn {mon}'
  ],
  swapped: [
    'Hết món mình gọi nhưng được đổi món khác, cũng ổn',
    'Được mời đổi món, ăn thấy cũng ngon',
    'Hết {mon} mà chủ quán khéo mời đổi nên không phiền'
  ],
  togo: [
    'Gói mang đi thiếu muỗng đũa rồi bạn',
    'Hộp bị rỉ nước ra túi'
  ]
};
const TAIL = { 5: ['', ' 👍', ' ❤️', ' ✨'], 4: ['', ' 👍', ' 🙂'], 3: ['', ' 😐'], 2: ['', ' 😞'], 1: ['', ' 😞', ' 💔'] };
const MOOD = {
  great: 'pos', cheap: 'pos', ok: 'ok', meh: 'mid', wait: 'mid', swapped: 'ok',
  pricey: 'mid', bad: 'neg', wrong: 'neg', timeout: 'neg', soldout: 'neg', togo: 'neg'
};

/* ---------- LÝ DO KHÁCH XIN GHI NỢ / VAY ----------
   Cho vay là quyết định thật: được lòng khách quen nhưng có thể mất
   tiền. Người đáng tin xin ít, người lạ mặt xin nhiều.               */
const LOAN_WHY = [
  'quên ví ở nhà, mai ghé trả',
  'chưa tới ngày lãnh lương',
  'con nhỏ đang nằm viện',
  'xe hư đang gửi tiệm sửa',
  'mất điện thoại nên không chuyển khoản được',
  'cuối tháng túng quá, mượn bạn ít bữa',
  'vừa mất việc, đang chạy tìm chỗ mới',
  'gom tiền đóng học cho con'
];

/* ---------- CẤP ĐỘ ---------- */
const LV_TXT = {
  1: 'Chỉ có cơm và một món mặn — làm quen tay trước đã',
  2: 'Mở mỡ hành và nước uống, khách bắt đầu gọi hai món',
  3: 'Mở canh và đơn mang đi; khách quen bắt đầu hỏi ghi nợ',
  4: 'Khách đi cả nhóm, gọi tới ba món và nhiều phần một lúc'
};

/* ---------- HƯỚNG DẪN MÀN ĐẦU ----------
   Không dạy hết một lúc: mỗi bước chỉ một việc, và chỉ hiện ở ngày 1.
   want là điều kiện hoàn thành, kiểm bằng chính trạng thái khay.     */
const COACH = [
  { id: 'rice', t: 'Chạm nồi cơm để múc', d: 'Chạm <b>1 lần</b> là ít cơm, <b>2 lần</b> là bình thường, <b>3 lần</b> là nhiều cơm. Xem phiếu của khách để múc đúng.', at: 'com' },
  { id: 'mon', t: 'Vuốt sang khay món', d: 'Vuốt ngang trên quầy hoặc chạm vào ô <b>Khay món</b> phía dưới để đi qua khay món mặn.', at: 'mon' },
  { id: 'pick', t: 'Chạm món khách gọi', d: 'Chạm vào món trong khay, món sẽ bay vào đĩa. Gắp sai thì vuốt đĩa xuống để làm lại.', at: 'mon' },
  { id: 'serve', t: 'Vuốt đĩa lên để đưa khách', d: 'Xong rồi thì <b>vuốt đĩa lên</b> — hoặc bấm nút Đưa khách. Khách chờ càng ít thì càng nhiều sao.', at: 'any' }
];

const TOUR = [
  { i: 'rice', t: 'Cơm tấm bán từ sáng', d: 'Một ngày trong game dài 4 phút thật, từ 6 giờ sáng tới 2 giờ chiều. Sáng nào cũng phải nhập hàng và nấu cơm trước khi mở cửa.' },
  { i: 'plate', t: 'Làm đúng phiếu khách', d: 'Mỗi khách có một phiếu: mấy muôi cơm, món mặn nào, có mỡ hành không, canh và nước gì, ăn tại quán hay mang đi. Làm đủ rồi vuốt đĩa lên là xong.' },
  { i: 'rain', t: 'Trời mưa trời nắng', d: 'Nắng gắt thì đông khách và bán chạy nước đá. Mưa thì vắng hơn nhưng nhiều người gọi mang đi và gọi canh nóng. Thời tiết đổi được giữa buổi.' },
  { i: 'price', t: 'Chợ lên thì giá bán phải lên', d: 'Giá nhập ngoài chợ thay đổi mỗi ngày. Chợ đắt thì khách cũng biết và thông cảm — cứ tăng giá bán, đừng cắn lỗ.' },
  { i: 'shield', t: 'Coi chừng mất đồ', d: 'Thỉnh thoảng có người lảng vảng ở két tiền. Chạm vào họ là chặn được. Thuê anh bảo vệ thì khỏi phải để mắt nữa.' }
];

/* ---------- CẤU HÌNH ---------- */
const SAVE = 'ctShop1', OWNER_SAVE = 'ctOwner';
const GAME_VERSION = '1.0';

const DEFAULT_CONFIG = {
  ownerPin: '2468',
  dayMin: 4,                  /* phút thật cho một ngày (06:00–14:00 trong game) */
  startMoney: 600000,
  wage1: 150000, wage2: 220000, wage3: 170000,
  rent: 85000,                /* thuê mặt bằng mỗi ngày */
  utilBase: 38000,            /* điện nước gas cơ bản */
  utilPerUpg: 9000,
  /* Hai trần này phải luôn CAO HƠN giá gợi ý, nếu không người chơi bị
     khách chê đắt chỉ vì mở khoá món xịn — xem phần tự kiểm tra cuối file. */
  priceCap: 200000,           /* một phần vượt mức này thì 60% khách bỏ đi */
  itemCap: 60000,             /* một món vượt mức này: chê mắc, vắng 80% */
  riceBase: 120,              /* số muôi cơm mỗi nồi */
  ricePerUpg: 60,
  bankMax: 1500000, bankRate: 22, hotMax: 3000000, hotRate: 45,
  lendCap: 400000,            /* cho vay tối đa mỗi lần */
  rushCost: 1.6,              /* hệ số giá khi chạy chợ gấp giữa buổi */
  rushSec: 24,                /* giây chờ hàng về */
  taxThreshold: 1000000000, vat: 3, pit: 1.5,
  levels: { l2: 4, l3: 10, l4: 20 },
  cost: {}, life: {}
};
Object.keys(ITEMS).forEach(k => {
  DEFAULT_CONFIG.cost[k] = ITEMS[k].cost;
  DEFAULT_CONFIG.life[k] = ITEMS[k].life;
});

let CFG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
try {
  const o = JSON.parse(localStorage.getItem(OWNER_SAVE));
  if (o) CFG = { ...CFG, ...o, levels: { ...CFG.levels, ...o.levels }, cost: { ...CFG.cost, ...o.cost }, life: { ...CFG.life, ...o.life } };
} catch (e) { }
function saveCfg() { try { localStorage.setItem(OWNER_SAVE, JSON.stringify(CFG)) } catch (e) { } }

/* ---------- TỰ KIỂM TRA CẤU HÌNH ----------
   Để nguyên giá gợi ý thì người chơi KHÔNG BAO GIỜ được bị chê đắt.
   Hàm này chạy lúc khởi động và in cảnh báo ra console nếu lệch.     */
function cfgSelfCheck() {
  const bad = [];
  Object.keys(DEF_SELL).forEach(k => {
    if (DEF_SELL[k] > CFG.itemCap) bad.push(`giá gợi ý ${k} (${DEF_SELL[k]}) vượt trần chê đắt itemCap (${CFG.itemCap})`);
  });
  /* phần đắt nhất có thể gọi ở cấp 4: cơm nhiều + 3 món đắt nhất + canh + nước đắt nhất + mỡ hành */
  const top3 = MAIN_KEYS.map(k => DEF_SELL[k]).sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);
  const worst = DEF_SELL.com3 + top3
    + Math.max(...CANH_KEYS.map(k => DEF_SELL[k]))
    + Math.max(...DRINK_KEYS.map(k => DEF_SELL[k])) + DEF_SELL.mohanh;
  if (worst > CFG.priceCap) bad.push(`phần đắt nhất theo giá gợi ý (${worst}) vượt priceCap (${CFG.priceCap})`);

  MAIN_KEYS.concat(CANH_KEYS, DRINK_KEYS, ['mohanh']).forEach(k => {
    if (DEF_SELL[k] <= CFG.cost[k]) bad.push(`giá gợi ý ${k} không đủ bù giá nhập`);
    if (!FAM_NEAR[ITEMS[k].fam]) bad.push(`họ món "${ITEMS[k].fam}" của ${k} không có trong FAM_NEAR`);
  });
  STOCK_KEYS.forEach(k => { if (!ITEMS[k]) bad.push(`STOCK_KEYS có khoá lạ: ${k}`) });
  STATIONS.forEach(s => { if (!ICONS[s.i]) bad.push(`khu ${s.id} dùng icon không có: ${s.i}`) });
  [...UPG, ...STAFF].forEach(u => { if (!ICONS[u.i]) bad.push(`nâng cấp ${u.id} dùng icon không có: ${u.i}`) });
  MAIN_KEYS.concat(CANH_KEYS, DRINK_KEYS, ['mohanh', 'com', ...SUP_KEYS]).forEach(k => {
    if (!ITEM_ART[k]) bad.push(`thiếu hình cho ${k} trong ITEM_ART`);
  });
  Object.keys(FXMAP).forEach(k => { if (!FX_KINDS.includes(FXMAP[k].p)) bad.push(`FXMAP ${k} dùng loại hạt lạ: ${FXMAP[k].p}`) });
  WX_KEYS.forEach(k => { if (!ICONS[WEATHER[k].ic]) bad.push(`thời tiết ${k} dùng icon không có: ${WEATHER[k].ic}`) });
  Object.keys(EVS).forEach(k => { if (!ICONS[EVS[k].ic]) bad.push(`sự kiện ${k} dùng icon không có: ${EVS[k].ic}`) });
  if (WX_KEYS.length !== WX_W.length) bad.push('WX_W không cùng độ dài với WX_KEYS');
  if (bad.length) console.warn('[cấu hình] ' + bad.join('\n[cấu hình] '));
  return bad;
}
