# Tiệm Cơm Tấm

Game mô phỏng quán cơm tấm lề đường Sài Gòn. Múc cơm, gắp món, chan mỡ hành,
gói mang đi — giữa trời mưa nắng, giá chợ lên xuống và thỉnh thoảng có người
lảng vảng ở két tiền.

Chạy trên trình duyệt điện thoại, không cần mạng sau lần mở đầu, cài được lên
màn hình chính như một app.

**Chơi thử:** <https://com-tam.vercel.app>
**Mã nguồn:** <https://github.com/an9111998/com-tam-game>

```bash
node dev/serve.js 8190     # rồi mở http://localhost:8190
```

> Project Vercel `com-tam` đã nối với repo này, nhánh production là `main`,
> nên **push là tự deploy**. Không cần bước nào thêm.

---

## 1. Có gì trong này

| File | Nội dung | Dòng |
| --- | --- | --- |
| `index.html` | Khung trang, nạp 3 file js, khai báo PWA | 70 |
| `css/style.css` | Toàn bộ giao diện + hoạt ảnh | ~770 |
| `js/art.js` | Hình SVG 21 món, dĩa cơm động, khách, icon, hạt hiệu ứng | ~380 |
| `js/data.js` | Thực đơn, thời tiết, chợ, nâng cấp, lời khách, cấu hình, `cfgSelfCheck()` | ~460 |
| `js/game.js` | Trạng thái, vòng lặp, tương tác, kinh tế, âm thanh | ~2100 |
| `sw.js` | Service worker (offline + cài lên máy) | 102 |
| `manifest.webmanifest` + `icons/` | PWA metadata + 4 icon PNG | — |
| `vercel.json` | Header cache cho deploy | — |
| `dev/` | Công cụ kiểm tra, **không** đi vào bản deploy | — |

Bản deploy thuần tĩnh, không build step, không backend.

### Công cụ trong `dev/`

| Chạy | Để làm gì |
| --- | --- |
| `node dev/serve.js 8190` | Server tĩnh trả `no-store` — sửa file là thấy ngay |
| `node dev/make-icons.js` | Vẽ lại 4 icon PNG (tự đóng gói PNG, không cần thư viện) |
| `fetch('dev/sim.js').then(r=>r.text()).then(eval)` | Mô phỏng 26 ngày — **chạy sau mỗi lần sửa số** |
| `fetch('dev/selftest.js').then(r=>r.text()).then(eval)` | 29 phép thử luồng — chạy sau mỗi lần sửa giao diện |
| `fetch('dev/scene.js').then(r=>r.text()).then(eval)` | Dựng nhanh ván giữa game để soi giao diện |

**Hai chỉ số phải luôn đạt:**

- `sim` → `impossible = 0`. Khác 0 là game đang sinh phiếu mà người chơi **không thể**
  làm đúng. Đây là loại lỗi nặng nhất vì game vẫn chạy bình thường, chỉ là không ai làm nổi.
- `selftest` → `fail = 0` và `cfgSelfCheck()` trả mảng rỗng.

Số liệu tham chiếu lần chạy cuối: `impossible 0`, cfg `OK`, selftest `29/29`,
lãi ngày 1 **≈ 270k** → ngày 26 **≈ 1,5 triệu**, không ngày nào lỗ.

> Khi sửa code mà tải lại vẫn thấy bản cũ: mở kèm `?nosw` để bỏ service worker.
> Nó dùng stale-while-revalidate nên lúc đang sửa sẽ trả file cũ.

---

## 2. Một ngày bán hàng

Một ngày = **4 phút thật**, từ 06:00 tới 14:00 trong game — đúng giờ quán cơm tấm.
Khách vào theo hai đợt: đợt ăn sáng và đợt cơm trưa. Giữa hai đợt thì thưa, đó là
lúc để chạy chợ hay nấu thêm cơm.

**Buổi sáng (màn chuẩn bị)** — 6 tab:

| Tab | Việc |
| --- | --- |
| Kho | Nhập hàng, nấu cơm theo vá, mở khoá món mới |
| Chợ & giá | Xem giá chợ hôm nay, tự đặt giá bán, hoặc bấm một nút đặt lại theo chợ |
| Quán | Thuê nhân viên, mua trang bị |
| Sổ nợ | Ai đang nợ mình, mình đang vay ai, danh sách khách quen |
| Khen | Đánh giá của khách |
| Sổ sách | Lãi lỗ 14 ngày gần nhất, chi phí cố định mỗi ngày |

**Trong buổi bán**, quầy chia làm 5 khu, **vuốt ngang** để đi giữa các khu:

| Khu | Có gì | Mở từ |
| --- | --- | --- |
| Nồi cơm | Nồi cơm + chén mỡ hành | cấp 1 |
| Khay món | 12 món mặn | cấp 1 |
| Nồi canh | 2 loại canh | cấp 3 |
| Thùng nước | 4 loại nước | cấp 2 |
| Gói mang đi | Hộp + bộ muỗng đũa & ly ống hút | cấp 3 |

---

## 3. Thực đơn

**Món chính (12):** bì · trứng ốp la · chả trứng · sườn nướng · rau xào · cá chiên ·
đùi gà · ba rọi · heo quay · tôm rim · mực xào · bò nướng

**Canh (2):** canh khoai mỡ · canh khổ qua

**Nước (4):** trà đá · nước suối · trà tắc · trà chanh

**Phụ:** mỡ hành

**Cơm — ba mức, tính theo số lần chạm nồi:**

| Chạm | Khẩu phần | Muôi cơm |
| --- | --- | --- |
| 1 lần | Ít cơm | 1 |
| 2 lần | Cơm bình thường | 2 |
| 3 lần | Nhiều cơm | 3 |

**Mang đi:** một phần cần **hộp** *và* **một bộ muỗng đũa + ly ống hút**. Thiếu bộ
dụng cụ thì vẫn bán được — nhưng khách về tới nhà mới biết, và sẽ nhớ chuyện đó
khi để lại đánh giá.

---

## 4. Tương tác

Thiết kế cho ngón tay trên điện thoại, không phải con chuột.

| Cử chỉ | Ở đâu | Làm gì |
| --- | --- | --- |
| **Chạm** nồi cơm | khu Nồi cơm | mỗi lần một vá: 1 ít · 2 vừa · 3 nhiều |
| **Chạm** món | khay món / canh / nước | món bay vào dĩa kèm hoạt ảnh |
| **Vuốt ngang** | cả vùng quầy | đổi khu, có hoạt ảnh trượt |
| **Vuốt lên** | dĩa đang làm | đưa khách |
| **Vuốt xuống** | dĩa đang làm | bỏ dĩa, làm lại |
| **Chạm** | thẻ khách | chọn khách để lấy đơn |
| **Vuốt lên** | thẻ khách | đưa dĩa cho đúng khách đó |
| **Chạm** | kẻ trộm | chặn hắn lại |

**Rung** theo từng việc, không rung bừa: một nhịp ngắn khi múc vá cơm đầu,
hai nhịp ở vá thứ hai, ba nhịp ở vá thứ ba — nên cảm nhận được khẩu phần
mà không cần nhìn. Rung dài khi sai đơn, rung dồn khi có trộm. Tắt được bằng
nút ở thanh dưới.

Mọi cử chỉ đều **có nút thay thế** (Đưa khách / Bỏ làm lại / ô chọn khu) để ai
không quen vuốt vẫn chơi được, và để còn dùng được bằng chuột.

---

## 5. Bảy cơ chế chính

### Thời tiết — và nó đổi giữa buổi

Năm kiểu: trời mát, nắng đẹp, nắng gắt, mưa rào, mưa dầm. Mỗi kiểu kéo bốn thứ
cùng lúc:

| | khách ghé | gọi nước | gọi canh | mang đi | kiên nhẫn |
| --- | --- | --- | --- | --- | --- |
| Trời mát | 1,00 | 1,00 | 1,15 | 1,00 | 1,10 |
| Nắng đẹp | 1,08 | 1,25 | 0,95 | 1,00 | 1,00 |
| Nắng gắt | 1,22 | **1,75** | 0,60 | 1,15 | **0,78** |
| Mưa rào | 0,78 | 0,70 | 1,40 | **1,55** | 1,15 |
| Mưa dầm | **0,60** | 0,50 | **1,70** | **1,85** | 1,25 |

Nắng gắt là con dao hai lưỡi: đông khách và trà đá bán chạy, nhưng ai ngồi chờ
cũng nổi nóng. Mưa thì vắng, bù lại nhiều đơn mang đi và canh nóng.

Khoảng một phần ba số ngày, trời **đổi giữa buổi** — đang nắng thì mưa rào ập
xuống. Hàng đã nhập theo dự báo sáng nay bỗng lệch hết. Mái che kéo phần khách
bị mưa cuốn đi về một nửa.

### Chợ lên thì giá bán lên

Giá nhập mỗi món trôi mỗi ngày theo bước ngẫu nhiên có lực kéo về 1, cộng thêm
tin sốt giá: *"Heo hơi lên giá"*, *"Biển động, hàng về ít"*, *"Rau củ lên giá sau mưa"*.

Điểm cốt lõi: **khách ngoài chợ cũng biết giá lên**. Khi chỉ số chợ tăng, trần
"chê mắc" nới theo — chợ mắc 30% thì khách chịu giá cao hơn ~18%. Nên lúc chợ lên
là lúc phải tăng giá bán, không phải lúc cắn lỗ. Tab Chợ nói thẳng con số đó và
có một nút đặt lại toàn bộ giá bán theo chợ hôm nay.

### Hết món — ba cách xử lý

Khách sẽ không bao giờ gọi món đã hết (phiếu chỉ sinh từ hàng còn trong kho), nên
tình huống khó là món hết **sau khi** đã nhận đơn. Lúc đó thẻ khách đổi màu và có
ba đường ra:

1. **Mời khách đổi món** — đổi trong cùng họ món (nướng đổi nướng, hải sản đổi
   hải sản) và bớt 10% cho phải phép. Khách quen dễ chịu hơn, khách đang vội thì
   khó. Đồng ý thì họ còn bớt sốt ruột; từ chối thì mất khách nhưng nhẹ hơn nhiều
   so với để họ ngồi chờ tới lúc cạn kiên nhẫn.
2. **Chạy chợ gấp** — trả giá cao hơn 60% và phải chờ hàng về. Có xe máy thì
   nhanh gấp đôi và đỡ bị hớ giá.
3. **Treo bảng hết món** — chủ động bỏ món khỏi thực đơn. Khách không gọi nữa
   nên không sinh ra đơn không làm được. Đổi lại quán mất một lựa chọn.

Hết cơm thì nặng hơn: không nhận được khách nào cho tới khi nấu thêm nồi.

### Cho vay tiền

Từ cấp 3, khách quen bí tiền sẽ hỏi ghi nợ — *"quên ví ở nhà"*, *"chưa tới ngày
lãnh lương"*, *"con nhỏ đang nằm viện"*. Cho vay là mất tiền ngay và có thể mất
luôn. Bù lại:

- họ nhớ ơn, độ tin cậy tăng, quay lại thường hơn và dắt thêm khách
- phần đó được thêm một sao
- trả đúng hẹn thì tin cậy tăng mạnh, lần sau xin ít hơn

Tới hẹn, khả năng trả tính theo độ tin cậy. Trễ ba lần là **nợ mất trắng** và
người đó tụt hẳn tin cậy — lần sau đừng cho vay nữa. Tất cả nằm ở tab Sổ nợ,
cạnh phần vay ngân hàng (22%/năm) và vay nóng (45%/năm) cho chính mình.

Từ chối **không** bị phạt nặng. Đây là lựa chọn thật, không phải bẫy.

### Trộm — và anh bảo vệ

Từ ngày 5, khoảng 45% số ngày có người lảng vảng: thò tay vào két, tính bê nồi
cơm, lấy điện thoại trên bàn, dắt xe khách. Hắn hiện ra trong quầy, màn hình
nháy đỏ, điện thoại rung dồn — **chạm vào hắn trong 2,6 giây** là chặn được
(3,8 giây nếu có camera), thỉnh thoảng hắn còn rơi cả tiền. Không chặn kịp thì
mất từ vài chục tới vài trăm nghìn.

Ban đêm là chuyện khác: 5% số đêm bị cạy cửa, chỉ camera / két sắt / bảo vệ mới
đỡ được. Mất một đêm có trần cứng — không được phép xoá sạch công của cả tuần.

Thuê **anh bảo vệ** thì 88% bị chặn sẵn, khỏi phải để mắt. Đó là thứ người ta
trả lương để khỏi phải lo.

### Nhân viên — chia việc như quán thật

| Người | Làm gì | Lương/ngày |
| --- | --- | --- |
| Bạn múc cơm | Tự múc đúng khẩu phần và chan mỡ hành khi phiếu có | 150k |
| Bạn múc món | Tự gắp món mặn, múc canh, rót nước | 220k |
| Anh bảo vệ | Giữ xe và chặn trộm, cả ngày lẫn đêm | 170k |

Thuê cả hai bạn thì người chơi chỉ còn việc chốt đơn — và đó chính là cách để
theo kịp khi khách dồn ở cấp 4.

### Cấp độ — mở dần từng khái niệm

| Cấp | Ngày | Mở thêm |
| --- | --- | --- |
| 1 | 1 | Cơm + một món mặn. Chỉ 2 khu, 4 món, giãn cách khách 9 giây |
| 2 | 4 | Mỡ hành, nước uống, khách gọi 2 món |
| 3 | 10 | Canh, đơn mang đi, khách quen hỏi ghi nợ |
| 4 | 20 | Khách đi nhóm gọi tới 4 phần, mỗi phần tới 3 món |

Khách dồn dần theo cấp: giãn cách 9 → 7,4 → 6,1 → 5,1 giây. Cấp 1 thưa hẳn để
làm quen tay.

---

## 6. Hướng dẫn màn đầu

Hai lớp, cả hai chỉ hiện một lần:

1. **5 thẻ giới thiệu** trước khi vào quán: giờ bán, phiếu khách, mưa nắng,
   chợ lên giá, coi chừng mất đồ.
2. **Chỉ dẫn từng bước ngay trong lúc bán**, mỗi bước một việc, và bước nào thì
   viền sáng đúng chỗ cần chạm:
   - chạm nồi cơm để múc
   - vuốt sang khay món
   - chạm món khách gọi
   - vuốt dĩa lên để đưa khách

   Bước tự chuyển khi làm xong, có nút Bỏ qua, và xong là không bao giờ hiện lại.

Ngày 1 và 2 cố ý **không có** sự kiện, không tin sốt giá, trời nắng đẹp rồi
trời mát. Khách khó tính xuất hiện từ ngày 3, trộm từ ngày 5.

---

## 7. Chấm sao

Bắt đầu **5 sao rồi trừ dần** — dễ đọc, dễ chỉnh:

```
chờ quá 50% kiên nhẫn        → −1
chờ quá 82% (có quạt: 90%)   → −1
chờ quá 96%                  → −1
giá mắc                      → −1
sai đơn                      → −số lần sai
mang đi mà thiếu bộ dụng cụ  → −1
khách khó tính, chờ quá 40%  → −1, và rất khó được 5 sao
random 12%                   → −1   (nhiễu nhẹ, tránh đoán trước được)
được mời đổi món tử tế       → +1
được cho ghi nợ              → +1
khách quen, phục vụ tốt      → +1
giá rẻ mà chưa 5 sao         → +1
```

Điểm hiển thị chỉ tính **40 đánh giá gần nhất** → một ngày tệ không đóng đinh
vĩnh viễn.

---

## 8. Quyết định thiết kế — đừng đổi mà không cân nhắc

**Vanilla JS, không framework, không build step.** Cỡ này thêm React/Vite chỉ
tốn bước build. Mở file là chạy.

**Nồi cơm và mỡ hành nằm cùng một khu.** Vì đó là việc của cùng một người (bạn
múc cơm), và vì gộp lại thì cả khu vừa một màn hình điện thoại — không phải
cuộn trong lúc khách đang chờ. Cả màn bán vừa đúng 900px ở khổ 430×900.

**Khách "hay đổi ý" chỉ đổi sang thứ CÒN HÀNG.** Nếu để nó đổi sang món đã hết
thì người chơi không tránh được, thành ra phạt vô lý.

**Phiếu chỉ sinh từ hàng còn trong kho.** Cùng lý do. Tình huống hết món được
xử lý bằng cơ chế mời đổi món, chứ không bằng cách ném cho người chơi một đơn
không thể làm.

**Dự kiến số phần bán được lấy theo BA ngày gần nhất, đã chia lại cho thời tiết
của chính ngày đó.** Lấy hôm qua làm mốc thì một ngày mưa sẽ khiến hôm sau nhập
thiếu, hôm sau nữa càng thiếu — vòng xoáy đó làm người chơi lỗ mà không hiểu vì sao.

**Trần "chê mắc" phải luôn cao hơn giá gợi ý.** Nếu không, mở khoá món mắc sẽ tự
nhiên làm 80% khách bỏ đi. `cfgSelfCheck()` canh chỗ này.

**Âm thanh mặc định BẬT, và có bốn lớp.** Bản đầu để mặc định tắt nên phần
lớn người thử tưởng game câm — đó là một phần lý do nó bị chê là không sống
động. Bốn lớp, mỗi lớp một núm riêng: nhạc nền ngũ cung sinh tại chỗ (đổi giọng
và đổi nhịp theo trời), tiếng rì rầm của quán cộng tiếng chảo xèo, tiếng mưa
riêng một lớp bật tắt theo thời tiết, và tiếng động từng thao tác. Tất cả tổng
hợp bằng Web Audio, không một file âm thanh nào — game gốc dùng bốn bản nhạc
mp3 theo mùa cộng một file mưa gần nửa MB, ở đây sinh thẳng nên bản deploy vẫn
nhẹ và mất mạng vẫn có tiếng. Tắt tiếng thì `AudioContext` bị đóng hẳn, im hoàn
toàn chứ không phải vặn nhỏ.

**Toàn bộ chữ trong game dùng giọng Nam.** Đây là quán cơm tấm Sài Gòn, nên:
*mắc* chứ không phải đắt, *dĩa* chứ không phải đĩa, *vá* chứ không phải muôi,
*lời* chứ không phải lãi (nhưng *lãi vay* thì vẫn là lãi), *hư* chứ không phải
hỏng, *bể* chứ không phải vỡ, *giữ xe* chứ không phải trông xe, *chiên* chứ
không phải rán, *nha/nghen* chứ không phải nhé. Khách còn xưng đúng vai theo
tên mình: Cô Trâm thì tự xưng *cô*, Chú Nghĩa thì tự xưng *chú*. Thêm chữ mới
thì đọc lại một lượt theo danh sách này.

**Service worker dùng ĐÚNG MỘT cache, và HTML network-first.** Cache-first sẽ
làm người chơi kẹt bản cũ vĩnh viễn.

**Từ chối cho vay không bị phạt nặng.** Nếu từ chối là mất khách thì đó không
còn là lựa chọn.

**Mở khoá món mới có cảnh báo vốn lưu động.** Tiền mở khoá và tiền nhập hàng
rút từ cùng một két. Mở khoá xong không còn tiền nhập hàng là chết chắc, mà
game thì không hề báo lỗi — nên phải nói thẳng con số ra trước khi người chơi bấm.

**Bản mô phỏng phải chơi như người cẩn thận, không phải như người tiêu hết tiền.**
`dev/sim.js` mở nhiều nhất một món và một trang bị mỗi ngày, luôn chừa gấp đôi
tiền hàng hôm qua. Bản trước tiêu sạch nên báo phá sản, làm tưởng là số của
game sai trong khi thật ra là cách chơi sai.

**Co gọn riêng cho máy màn ngắn** (`@media (max-height: 780px)`): thẻ khách bỏ
phần liệt kê món, nồi cơm và dĩa nhỏ lại. Mục tiêu duy nhất là nút "Đưa khách"
luôn nằm trong tầm nhìn.

---

## 9. Bug đã gặp — coi như bài học

| Bug | Vì sao khó thấy |
| --- | --- |
| `#splash` và `#modal` đặt `display:flex` bằng selector `#id`, mạnh hơn `[hidden]` của trình duyệt → màn chào không bao giờ ẩn | Game vẫn chạy phía dưới, chỉ là bị một lớp phủ che |
| SVG hình khách dùng class `cust`, trùng với class thẻ khách → hình người bị `flex: 0 0 168px` kéo phình ra | Chỉ hỏng kích thước, không lỗi console |
| `.dishes.big` trùng với class nút `.big` → khay canh và khay gói mang đi bị tô nền đỏ, chữ trắng trên nền trắng biến mất | Nút vẫn bấm được, vẫn đúng logic |
| `.up` (thẻ nâng cấp) trùng với `.up` (nhãn "giá lên") ở bảng chợ | Chỉ lộ ra khi giá chợ biến động ≥8%, ngày đầu không thấy |
| `.coach b { display:flex }` làm mọi chữ in đậm trong câu hướng dẫn xuống dòng | Chữ vẫn đọc được, chỉ là vỡ dòng |
| Lãi tụt dần rồi âm từ cấp 4: chi phí cố định tăng theo trang bị nhưng số phần bán được bị chặn bởi số bàn và giãn cách khách | Không có lỗi nào, chỉ thấy tiền vơi dần. Chính `dev/sim.js` bắt ra |
| Service worker trả file js cũ trong lúc sửa code | Sửa xong tải lại vẫn thấy bản cũ, dễ đi tìm lỗi ở chỗ không có lỗi. Đã thêm `?nosw` |
| `suggest()` — giá bán do **chính game** gợi ý theo chợ — có thể vượt trần chê mắc khi một món sốt giá riêng lẻ (chợ chung vẫn bình thường nên trần không nới theo). Bấm nút "Theo chợ" là tự tay làm 80% khách bỏ đi | Không có lỗi, không có cảnh báo, chỉ thấy khách vắng hẳn sau khi bấm một nút mà game khuyên bấm. Đã kẹp `suggest()` dưới `capOf()` và thêm phép thử trong `cfgSelfCheck()` |
| Vòng xoáy phá sản: mở khoá món mới ngốn hết vốn nhập hàng, mà mở thêm món còn làm khách tản ra nhiều món hơn nên cùng số hàng lại hết lẻ tẻ. Ít hàng → ít khách → ít tiền → càng ít hàng, bốn ngày là dẹp quán | Mỗi bước đều hợp lý, không có lỗi nào. Chỉ `dev/sim.js` chạy nhiều lần mới lộ ra: `sold` tụt về 0 mà `lost` cũng 0 — dấu hiệu quán không có gì để bán, chứ không phải khách bỏ đi. Đã thêm cảnh báo khi mở khoá ăn vào vốn lưu động |
| Nút "Đưa khách" trôi khỏi màn hình ở máy 375×667 | Ở khổ 430×900 vừa khít nên không thấy gì; máy nhỏ hơn thì phải cuộn mới bấm được thứ bấm nhiều nhất |

---

## 10. Nhớ làm khi sửa code

1. Sửa số → chạy `dev/sim.js`, xác nhận `impossible = 0` và không ngày nào lỗ
2. Sửa giao diện → chạy `dev/selftest.js`, xác nhận `fail = 0`
3. Mở console xem có cảnh báo `[cấu hình]` không
4. Thêm/xoá món → kiểm `ITEM_ART` (art.js), `FAM_NEAR` và `STOCK_KEYS` (data.js);
   `cfgSelfCheck()` sẽ báo nếu thiếu
5. **Đặt tên class mới thì tra trước xem đã có chưa** — bốn trong bảy bug ở mục 9
   là trùng tên class
6. Sửa file tĩnh → tăng `VERSION` trong `sw.js` rồi deploy lại
7. Xem lại ở khổ **430×900** (điện thoại), không phải desktop

---

## 11. Nguồn cảm hứng

Cơ chế học từ một game quán trà nhỏ: kho theo mẻ có hạn dùng, đồng hồ kiên nhẫn,
chấm sao kiểu trừ dần, người chơi tự đặt giá. Toàn bộ code, hình vẽ và lời thoại
ở đây viết mới.
