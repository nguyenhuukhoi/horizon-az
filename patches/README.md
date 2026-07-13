# Áp các thay đổi của repo này lên bản Horizon khác

Repo `horizon-az` là **snapshot squash** của Horizon `stable/2026.1` — nó KHÔNG chung
lịch sử git với upstream, nên không thể `git rebase`/`cherry-pick` thẳng lên bản khác.
Cách làm đúng là **bộ patch trong thư mục này**: diff nội dung giữa upstream `2026.1`
và repo, tách theo từng mối quan tâm.

Ví dụ: clone Horizon `stable/2025.1` về → apply 5 patch → có đầy đủ theme + tính năng
+ bug fix của mình.

---

## 1. Bộ patch

| Patch | Nội dung | Phạm vi |
|---|---|---|
| `01-theme-mycloud.patch` | Toàn bộ theme MyCloud: scss, template override, 5 font woff2, logo (binary) | **File mới 100%** — `themes/mycloud/` |
| `02-core-theme-integration.patch` | Đăng ký theme (`defaults.py`), `templatetags/mycloud_filters.py`, test static assets, `enabled/_1020_*` (PANEL_GROUP), `_icons.scss` (khôi phục `fa-spin`), class `mc-*` cho modal App Credentials | Core — nhỏ, chủ yếu thêm |
| `03-feature-az-usage.patch` | Tính năng usage theo Availability Zone ở Project Overview: `usage/az.py`, template, view, tests, `_quota.scss`, cờ `OVERVIEW_SHOW_AZ_USAGE` | Core — chủ yếu thêm |
| `04-fix-neutron-trunk-ports.patch` | Fix port list khi bật trunk extension (backport upstream review `984118`) — 1 dòng | Core |
| `05-fix-volume-uuid-search.patch` | Bug #2159580 — tìm volume không có tên bằng UUID | Core |

**Thứ tự apply: 01 → 05.** Patch độc lập nhau, nhưng cứ theo thứ tự cho gọn.

### Đã kiểm chứng thật (không phải lý thuyết)

| Phiên bản Horizon | Kết quả |
|---|---|
| `stable/2026.1` | Nguồn sinh patch |
| `stable/2025.2` | ✅ cả 5 patch apply sạch |
| `stable/2025.1` | ✅ cả 5 patch apply sạch — đã apply thật, 22 file theme + core, mọi `.py` compile OK |

`apply.sh` cũng đã được test đủ 5 đường: dry-run sạch · apply thật + verify · chạy lại
(skip hết, idempotent) · revert (cây về 0 thay đổi, theme biến mất hoàn toàn) · xung đột
giả lập (báo FAIL đúng patch, exit code 1).

---

## 2. Cách apply — dùng `apply.sh` (khuyến nghị)

```bash
git clone https://opendev.org/openstack/horizon.git
cd horizon && git checkout stable/2025.1     # bản bạn cần

# 1) Thử trước, KHÔNG đụng gì vào cây
/đường/dẫn/horizon-az/patches/apply.sh --check .

# 2) Apply thật (tự verify sau khi xong)
/đường/dẫn/horizon-az/patches/apply.sh .

# 3) Gỡ ra nếu cần
/đường/dẫn/horizon-az/patches/apply.sh --revert .
```

Script tự lo:

- **`core.longpaths`** — Horizon có path vượt 260 ký tự của Windows, thiếu nó thì
  `git apply` lỗi `Filename too long`. Script luôn bật sẵn.
- **Chặn nhầm thư mục** — kiểm tra đúng là cây Horizon + repo git rồi mới chạy.
- **Idempotent** — patch nào đã apply rồi thì `SKIP`, chạy lại nhiều lần vô hại.
  (Phát hiện bằng cách reverse-apply thử: nếu gỡ ngược được nghĩa là nội dung đã nằm trong cây.)
- **Fallback 3-way** — plain apply trượt thì tự thử `--3way`, và cảnh báo bạn đi tìm
  marker `<<<<`.
- **Verify sau apply** — đếm 22 file theme, kiểm tra `mycloud` đã vào `AVAILABLE_THEMES`,
  `py_compile` các file Python bị chạm, và **quét marker xung đột còn sót**.
- **Exit code** — `0` khi sạch, `1` khi có patch trượt (dùng được trong CI).

### Nếu không muốn dùng script

```bash
git -c core.longpaths=true apply /path/to/patches/0*.patch
```

### Khi một patch xung đột

```bash
git apply --3way patches/03-feature-az-usage.patch    # để lại marker <<<< >>>>
git apply --reject patches/03-feature-az-usage.patch  # sinh file .rej để soi
find . -name "*.rej"
```

> **Patch 04 (neutron)**: nếu bản đích **đã có sẵn** fix này (upstream backport về sau)
> thì script sẽ báo `SKIP already applied` (nếu trùng khít) hoặc `FAIL` (nếu upstream
> sửa theo cách khác). Cả hai đều là tín hiệu ĐÚNG — **bỏ qua patch 04**, không phải
> sửa gì.

---

## 3. Sau khi apply — việc phải làm để theme lên

Apply patch xong theme **chưa tự hiện**. Cần:

### 3.1 Chọn theme
`defaults.py` chỉ **đăng ký** `mycloud` vào `AVAILABLE_THEMES`, mặc định vẫn là `default`.
Muốn bật mặc định, thêm vào `local_settings.py`:

```python
DEFAULT_THEME = 'mycloud'
```
(hoặc để user tự đổi trong theme picker ở user menu.)

### 3.2 Bẫy offline-compress — theme custom không hiện
Đây là lỗi kinh điển: build image xong theme không lên. Fix:

```python
# local_settings.py
COMPRESS_OFFLINE = False
```
và `chown` thư mục static trong `extend_start.sh` (Kolla).

### 3.3 Build lại static
```bash
python manage.py collectstatic --noinput
python manage.py compress --force        # nếu dùng compress
docker restart horizon                   # Django cache template → BẮT BUỘC restart
```

> Chỉ `collectstatic` là **không đủ** khi đổi template — Django cache template trong RAM.

---

## 4. ⚠️ Bẫy pyScss — đọc trước khi sửa `_styles.scss`

Production Horizon compile SCSS bằng **pyScss**, KHÔNG phải libsass.

- pyScss **không parse được data-URI nằm trong giá trị biến scss**
  (`$mc-svg-x: url("data:image/svg+xml,...")`).
- Block biến nằm đầu file → parser chết → **mọi rule phía sau bị drop** → theme mất
  một mảng style (pill mất màu, card mất bo góc) mà không báo lỗi rõ ràng.
- **Luật:** data-URI để **literal ngay tại chỗ dùng**. Biến scss chỉ dùng cho giá trị
  đơn giản (hex màu, px, shadow).
- libsass compile sạch **KHÔNG** đảm bảo pyScss sạch. Đừng tin mỗi libsass.

---

## 5. Sinh lại patch sau khi có thay đổi mới

Khi commit thêm vào `horizon-az`, chạy lại để cập nhật bộ patch:

```bash
cd horizon-az

# Neo vào upstream 2026.1 (KHÔNG dùng FETCH_HEAD — nó bị ghi đè bởi thao tác git khác!)
UP=c5b41bc01bfc7c336d1a7cbeecdb1ded45538400
git fetch https://opendev.org/openstack/horizon.git stable/2026.1

git diff --binary $UP HEAD -- openstack_dashboard/themes/mycloud \
  > patches/01-theme-mycloud.patch

git diff $UP HEAD -- \
  openstack_dashboard/defaults.py \
  openstack_dashboard/templatetags/mycloud_filters.py \
  openstack_dashboard/test/unit/test_static_assets.py \
  openstack_dashboard/enabled/_1020_project_overview_panel.py \
  openstack_dashboard/static/dashboard/scss/components/_icons.scss \
  openstack_dashboard/dashboards/identity/application_credentials/templates/application_credentials/_create.html \
  > patches/02-core-theme-integration.patch

git diff $UP HEAD -- \
  openstack_dashboard/usage/az.py \
  horizon/templates/horizon/common/_az_limit_summary.html \
  openstack_dashboard/dashboards/project/overview/ \
  openstack_dashboard/static/dashboard/scss/components/_quota.scss \
  > patches/03-feature-az-usage.patch

git diff $UP HEAD -- openstack_dashboard/api/neutron.py \
  > patches/04-fix-neutron-trunk-ports.patch

git diff $UP HEAD -- openstack_dashboard/dashboards/project/volumes/ \
  > patches/05-fix-volume-uuid-search.patch
```

**Lưu ý quan trọng:**
- `--binary` là **bắt buộc** cho patch 01 (có font woff2 + PNG logo). Thiếu nó → font/logo hỏng.
- **Đừng dùng `FETCH_HEAD`** trong lệnh diff. Bất kỳ thao tác `git fetch`/`git push`
  nào sau đó đều ghi đè nó → bạn sẽ vô tình diff repo với chính nó và ra kết quả rỗng
  (đã dính bẫy này một lần). Luôn neo bằng SHA cụ thể.
- **Không đưa** `doc/source/locale/*.po` vào patch — đó là upstream trôi đi, không phải
  thay đổi của mình.

### Cách tự kiểm chứng patch trên bản mới

```bash
# Bung cây upstream ra thư mục tạm rồi thử apply (path NGẮN để tránh lỗi Windows)
git fetch https://opendev.org/openstack/horizon.git stable/2025.1
SHA=$(git rev-parse FETCH_HEAD)          # dùng ngay, đừng để lệnh git khác chen vào
mkdir -p /tmp/hz && git archive $SHA | tar -x -C /tmp/hz
cd /tmp/hz && git init -q . && git -c core.longpaths=true add -A
git -c core.longpaths=true -c user.email=t@t -c user.name=t commit -qm base

for f in /đường/dẫn/patches/0*.patch; do
  git -c core.longpaths=true apply --check "$f" && echo "OK  $f" || echo "FAIL $f"
done
```

---

## 6. Cần biết về phạm vi

**94% thay đổi (8.578 dòng) nằm gọn trong `themes/mycloud/`** — file mới hoàn toàn, gỡ
ra là về Horizon gốc, không bao giờ conflict.

Phần core chỉ ~460 dòng, nhưng có **3 chỗ ảnh hưởng CẢ theme `default`**, cần biết khi
apply cho môi trường không dùng MyCloud:

1. `enabled/_1020_project_overview_panel.py` — đổi `PANEL_GROUP` `compute` → `default`,
   làm Overview rời khỏi nhóm Compute ở **mọi** theme.
2. `static/dashboard/scss/components/_icons.scss` — thêm `@keyframes fa-spin` global
   (thực chất là **vá regression** của Horizon sau khi lên FontAwesome 6 — nên gửi
   ngược lên upstream).
3. `identity/.../application_credentials/_create.html` — mang class `mc-*` (tên riêng
   của theme) vào template core.

Nếu muốn "theme-only tuyệt đối", bỏ 3 chỗ này ra khỏi patch 02.
