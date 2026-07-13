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

---

## 2. Cách apply

```bash
# 1) Lấy Horizon bản đích
git clone https://opendev.org/openstack/horizon.git
cd horizon
git checkout stable/2025.1          # hoặc bản bạn cần

# 2) Apply theo thứ tự
git apply /đường/dẫn/horizon-az/patches/0*.patch

# 3) Xác nhận
git status --short | head
python -m py_compile openstack_dashboard/usage/az.py
```

### Trên Windows — BẮT BUỘC

Horizon có file vượt giới hạn 260 ký tự của Windows. Không bật cái này thì
`git add`/`git apply` sẽ lỗi `Filename too long`:

```bash
git config core.longpaths true      # trong repo đích
# hoặc: git -c core.longpaths=true apply patches/0*.patch
```

### Nếu một patch bị xung đột (bản Horizon quá khác)

```bash
# Cách 1: 3-way merge — để lại marker <<<< >>>> cho bạn tự gỡ
git apply --3way patches/03-feature-az-usage.patch

# Cách 2: tạo file .rej để xem chỗ nào trượt
git apply --reject patches/03-feature-az-usage.patch
find . -name "*.rej"
```

> **Patch 04 (neutron)**: nếu bản đích **đã có sẵn** fix này (upstream backport về sau)
> thì patch sẽ **báo lỗi apply** — đó là tín hiệu ĐÚNG, nghĩa là **bỏ qua nó**, không
> phải sửa gì.

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
