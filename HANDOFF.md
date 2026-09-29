# Bàn giao — Tiệm Cơm Tấm

Đọc file này là nối lại được mạch làm việc. Cơ chế game thì nằm trong
`README.md` cùng thư mục — file này chỉ nói **trạng thái, cách vận hành, và
việc còn lại**, không nhắc lại nội dung game.

**Cập nhật:** 2026-09-29 · Game `v1.3` · Service worker `v1.3.0`
**Trạng thái:** chạy được, đã deploy public, push là tự deploy.

| | |
| --- | --- |
| Chơi thử | <https://com-tam.vercel.app> |
| Mã nguồn | <https://github.com/an9111998/com-tam-game> (nhánh `main`) |
| Thư mục | `D:\games\com-tam` |

---

## 1. Có gì ở đâu

```
D:\games\com-tam\
├── HANDOFF.md            ← file này: trạng thái, vận hành, việc còn lại
├── README.md             ← CƠ CHẾ GAME: thực đơn, 7 cơ chế, quyết định thiết kế, bug
├── index.html            71 dòng   khung trang, nạp 3 file js, khai báo PWA
├── css/style.css         916 dòng  toàn bộ giao diện, cảnh quán, hoạt ảnh
├── js/art.js             628 dòng  22 hình món, dĩa cơm động, khách, icon, cảnh quán
├── js/data.js            469 dòng  thực đơn, thời tiết, chợ, nâng cấp, lời khách, cấu hình
├── js/game.js           2443 dòng  trạng thái, vòng lặp, tương tác, kinh tế, âm thanh
├── sw.js                 102 dòng  service worker (offline + cài lên máy)
├── manifest.webmanifest + icons/   PWA metadata + 4 icon PNG
├── vercel.json                     header cache
└── dev/                            công cụ kiểm tra — KHÔNG đi vào bản deploy
```

Bản deploy **276 KB**, thuần tĩnh, không build step, không backend, không một
file ảnh hay âm thanh nào — mọi thứ vẽ bằng SVG và sinh bằng Web Audio.

---

## 2. Chạy và kiểm tra

```bash
cd D:\games\com-tam
node dev/serve.js 8190      # rồi mở http://localhost:8190
```

Dùng `dev/serve.js` chứ không dùng `python -m http.server`: nó trả
`Cache-Control: no-store`, nên sửa file là thấy ngay. Mở kèm **`?nosw`** để bỏ
service worker — nó dùng stale-while-revalidate nên lúc đang sửa sẽ trả file cũ.

### Năm công cụ trong `dev/`

| Chạy | Để làm gì |
| --- | --- |
| `node dev/serve.js 8190` | Server tĩnh `no-store` |
| `node dev/make-icons.js` | Vẽ lại 4 icon PNG (tự đóng gói PNG, không cần thư viện) |
| `fetch('dev/sim.js').then(r=>r.text()).then(eval)` | Mô phỏng 26 ngày — **chạy sau mỗi lần sửa số** |
| `fetch('dev/selftest.js').then(r=>r.text()).then(eval)` | 29 phép thử luồng — **chạy sau mỗi lần sửa giao diện** |
| `fetch('dev/scene.js').then(r=>r.text()).then(eval)` | Dựng nhanh ván ngày 14 cấp 3 để soi giao diện |
| `dev/artsheet.html` | Xem cả 22 hình món ở ba cỡ; 46px là cỡ thật trong khay |
| `dev/artcompare.html` | So hình cũ với hình mới |

### Ba chỉ số phải luôn đạt

- `sim` → **`impossible = 0`**. Khác 0 là game đang sinh phiếu mà người chơi
  *không thể* làm đúng. Đây là loại lỗi nặng nhất vì game vẫn chạy bình thường.
- `sim` → **không ngày nào phá sản** khi chơi cẩn thận.
- `selftest` → **`fail = 0`** và `cfgSelfCheck()` trả mảng rỗng.

Số liệu tham chiếu lần chạy cuối (2026-09-29): `impossible 0`, cfg `OK`,
selftest `29/29`, sim 26 ngày × 3 lần không phá sản, lời ngày 1 khoảng
**200–310k** lên tới **~1,5 triệu/ngày** ở ngày 26.

---

## 3. Deploy

Project Vercel `com-tam` (team `thesis-demo`, id `team_cIdJ7GlGHG8A9rgCcnWtxnhH`)
**đã nối với repo**, nhánh production là `main`. Nên:

```bash
git push origin main        # xong. Vercel tự build và tự đổi com-tam.vercel.app
```

Chỉ `com-tam.vercel.app` là công khai. Hai alias còn lại
(`com-tam-thesis-demo`, `com-tam-git-main-thesis-demo`) bị Vercel chặn bằng SSO.

### Sửa file tĩnh thì phải tăng số phiên bản ở BA chỗ

Quên là người đã từng vào game sẽ tiếp tục chạy bản cũ:

1. `index.html` — đuôi `?v=` của `style.css`, `art.js`, `data.js`, `game.js`
2. `sw.js` — `VERSION` **và** bốn đường dẫn trong `SHELL_FILES`
3. `js/data.js` — `GAME_VERSION` (hiện ở màn chào, để người chơi tự kiểm)

Đuôi `?v=` mới là thứ vô hiệu hoá cache **ngay**. Header `no-cache` chỉ có tác
dụng từ lần tải sau, nên bản đã nằm trong máy người chơi vẫn được dùng tiếp —
đã kiểm bằng máy thật: trang chạy `GAME_VERSION 1.1` trong khi server đã có
1.2, kể cả sau khi đóng trang mở lại.

---

## 4. Nhật ký phản hồi

Người thử nhận xét sau bản `v1.0`. Đây là phần quan trọng nhất của file này —
nó giải thích vì sao code có hình dạng hiện tại.

| Nhận xét | Đã xử lý |
| --- | --- |
| "Nhìn miếng sườn cũng không biết đó là sườn, tưởng đùi gà" | **Xong.** Vẽ lại cả 22 món. Sườn thành miếng dẹt rộng có vệt cháy và **bỏ hẳn cục xương** — chính cục xương làm nó bị đọc thành đùi gà. Đùi gà giữ xương nên giờ xương là dấu hiệu riêng |
| "Món thì như chép ai" | **Xong.** Nguyên nhân: bản đầu vẽ món nào cũng bằng một công thức — khối bo tròn kèm vài nét kẻ. Giờ mỗi món một dáng riêng trước đã, rồi mới tới màu |
| "Nhìn như presentation, giống 1 cỗ máy, không phải game thư giãn" | **Xong.** Thủ phạm là một lớp nền trắng gần đục phủ lên toàn bộ khu quầy: phía sau vẽ gì cũng vô nghĩa. Bỏ lớp đó, dựng lại thành quầy gỗ + tường gạch + bảng hiệu men đỏ + khay inox + biển gỗ + vỉa hè + thớt gỗ |
| "Không có sinh động" | **Xong.** Quạt trần quay, bóng đèn đung đưa, khói bốc lên từ nồi cơm và nồi canh. Cộng bốn lớp âm thanh, **mặc định bật** — trước đây mặc định tắt nên phần lớn người thử tưởng game câm |
| Phiếu khách là dãy chip có dấu tick | **Xong.** Khách nói thành câu và xưng đúng vai theo tên: Cô Trâm tự xưng *cô*. Chip vẫn còn nhưng lui về vai trò soát lại |
| Dùng từ Bắc trong quán cơm tấm Sài Gòn | **Xong.** Đổi 76 chỗ: mắc, dĩa, vá, lời, hư, bể, giữ xe, chiên, nha/nghen |
| "Hiệu ứng 3D" | **Không làm, và có lý do.** Mở game gốc ra soi: nó **không phải 3D**. Nó là 2D phẳng nhưng mọi thứ là **tranh vẽ tay** — `bg.jpg` 306KB là một bức tranh nguyên cảnh, icon tab là PNG kiểu đất nặn 20–30KB mỗi cái. Khoảng cách không nằm ở 3D mà nằm ở chất liệu ảnh |
| "Không có khách đi tới, đây là màn hình hiện khách tới" | **Chưa làm.** Xem mục 5. Đáng nói: **game gốc cũng không có** — khách của nó là chân dung đứng yên kèm bóng thoại. Làm xong sẽ hơn bản gốc |

---

## 5. Việc còn lại

### Đã hứa, chưa làm

- [ ] **Khách đi vào, xếp hàng, ngồi bàn ăn rồi đi ra.** Người đặt yêu cầu đã
      chọn mức đầy đủ nhất: đi từ mép màn hình vào, dừng trước quầy, nói, cầm
      dĩa ra bàn ngồi ăn, ăn xong dọn bàn mới có chỗ cho khách sau, và có hàng
      người đứng chờ phía trước. Đây là **thay đổi logic**, không chỉ CSS: phải
      thêm các pha di chuyển vào `R.slots` và giữ nguyên mô hình kiên nhẫn để
      `dev/sim.js` còn đúng.
- [ ] **Tủ kính che khay món + mái hiên sọc** trước quán.

### Câu hỏi còn treo: lấy tranh ở đâu

Muốn đẹp bằng game gốc thì phải có **ảnh**. Ba đường:

1. Người đặt yêu cầu đưa ảnh (chụp hoặc ảnh AI, nền trong suốt) → gắn vào là xong.
2. Tiếp tục vẽ SVG kỹ hơn. Chất liệu (thép, gỗ, gạch) ra được, nhưng nét vẽ thì
   vẫn là vector.
3. Tự sinh ảnh PNG bằng code (như cách làm icon). **Đã thử và đo: không hơn SVG
   vẽ kỹ bao nhiêu mà tốn công hơn.** Không nên.

Từng đề nghị chọn và họ chọn hướng 3; sau khi soi game gốc thì thấy hướng đó sai,
đã nói lại nhưng chưa có câu trả lời mới.

---

## 6. Tài khoản và hạ tầng

| | |
| --- | --- |
| GitHub | `an9111998` — repo tạo bằng MCP `github-an9111998` (đọc `GITHUB_PAT_PERSONAL`) |
| Định danh commit | `an9111998 <nguyenan9111998@gmail.com>` — do `~/.gitconfig` định tuyến theo remote URL |
| Vercel | `nguyenan9111998@gmail.com`, team `thesis-demo`, gói hobby |

Hai cái bẫy đã gặp ở đây, đã ghi vào `~/AppData/Roaming/devin/AGENTS.md`:

- **`git config user.email` chỉ nói về commit KẾ TIẾP.** Hai commit đầu của repo
  này mang email công việc `an.nguyen@lmsoft.vn` vì chúng được tạo trước khi có
  remote. Đã viết lại trước lần push đầu. Lần sau nhớ xem cả
  `git log --format='%an <%ae>'`.
- **Nối Vercel với GitHub là bước chỉ làm được trong browser.** Khi chưa nối,
  cả `create_git_project` lẫn `POST /v9/projects/{id}/link` đều trả
  `bad_request — You need to add a Login Connection to your GitHub account first`.
  Đã nối rồi, và đã kiểm đầu-cuối bằng một commit thật.

---

## 7. Nhớ làm khi sửa code

1. Sửa số → chạy `dev/sim.js`, xác nhận `impossible = 0` và không ngày nào lỗ
2. Sửa giao diện → chạy `dev/selftest.js`, xác nhận `fail = 0`
3. Mở console xem có cảnh báo `[cấu hình]` không
4. Thêm/xoá món → kiểm `ITEM_ART` (art.js), `FAM_NEAR` và `STOCK_KEYS` (data.js);
   `cfgSelfCheck()` sẽ báo nếu thiếu
5. **Đặt tên class mới thì tra trước xem đã có chưa** — bốn trong mười hai bug ở
   `README.md` mục 9 là trùng tên class
6. Thêm chữ mới → đọc lại theo danh sách từ giọng Nam ở `README.md` mục 8
7. Sửa file tĩnh → tăng số phiên bản ở **ba chỗ** (mục 3 phía trên)
8. Xem lại ở khổ **430×900** và **375×667** (máy màn ngắn), không phải desktop
