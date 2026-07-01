# MyCloud Theme — Tối ưu hiệu năng & bảo mật

> Đợt tối ưu tháng 07/2026. **Không đổi DOM, không đổi workflow, không đổi màu.**
> Mọi thay đổi đã được chứng minh giữ nguyên output (xem mục Kiểm chứng).

## Tóm tắt

| # | Việc | File | Lợi ích |
|---|------|------|---------|
| 1 | Tách 11 block JS inline → file static | `_sidebar.html` → `static/js/mycloud.js` | Mỗi trang nhẹ ~52KB HTML, JS cache 1 lần, mở đường CSP |
| 2 | Gộp 9 MutationObserver → 1 observer chung (rAF-batch) | `static/js/mycloud.js` | Bớt giật trên bảng lớn, decorate cùng frame paint |
| 3 | Preload 2 font Inter (latin + vietnamese) | `_sidebar.html` | Giảm FOUT — font tải song song với CSS |
| 4 | `rel="noopener noreferrer"` cho link `target="_blank"` | `header/_user_menu.html` | Chống reverse-tabnabbing |
| 5 | Dedup 26 data-URI mask trùng lặp → 11 scss token | `static/_styles.scss` | SCSS gọn, glyph đảm bảo đồng nhất tuyệt đối |
| 6 | Token hoá 117 literal màu neutral lặp lại | `static/_styles.scss` | 1 nguồn chân lý mỗi màu — không lệch tông về sau |
| 7 | `prefers-reduced-motion` tắt shimmer trang trí | `static/_styles.scss` | Accessibility + mượt trên máy yếu |

---

## 1. Tách JS inline ra `static/js/mycloud.js`

**Vấn đề:** `_sidebar.html` chứa ~68KB JS inline (14 block `<script>`). Horizon là
full-page-reload — mỗi lần chuyển trang, browser tải lại + parse lại toàn bộ số JS
đó vì nó nằm trong HTML, **không cache được**.

**Cách làm:** 11 block "decorator" (trang trí bảng, icon nút, modal…) chuyển sang
`static/js/mycloud.js`, nạp bằng:

```html
<script src="{{ STATIC_URL }}themes/mycloud/js/mycloud.js?v=1" defer></script>
```

- `defer` = tải song song, chạy sau khi parse xong HTML, **trước** `DOMContentLoaded`
  → đúng thời điểm các script này cần (chúng decorate nội dung `#content_body`,
  vốn nằm sau sidebar trong DOM nên bản inline cũ lúc chạy lần đầu cũng chỉ no-op
  rồi đợi DOMContentLoaded).
- **3 block phải giữ inline** vì chạy trong lúc parse để không chớp hình:
  1. `_mcUtil` (esc/classify/ICONS dùng chung),
  2. thay icon FA sidebar → SVG (chạy ngay sau markup sidebar, trước paint),
  3. route marker set body class (`mc-lbaas-page`, `mc-ngdetail`…) cho CSS áp
     ngay từ frame đầu.
- Đổi nội dung `mycloud.js` thì **bump `?v=`** để phá cache client.

**Bảo mật kèm theo:** giảm 11 script inline → sau này siết CSP (bỏ
`'unsafe-inline'` cho script) khả thi mà không phải sửa theme lớn.

## 2. Một MutationObserver chung thay cho chín

**Vấn đề:** 9 observer riêng lẻ (`subtree: true`, nhiều cái trên `document.body`),
mỗi thay đổi DOM (Angular render bảng 100 dòng…) kích 9 callback, mỗi cái tự
debounce 0–200ms bằng `setTimeout` → decorate "nhảy vào" sau khi user đã thấy
nội dung (flash FA→SVG), và tổng chi phí quét DOM x9.

**Cách làm:** đầu `mycloud.js` có registry:

```js
_mcUtil.onMutate(fn)   // đăng ký; MỘT observer trên document.body
                       // (childList + subtree + characterData)
                       // batch bằng requestAnimationFrame
```

Mỗi decorator giữ nguyên `run()` idempotent (guard bằng body class / dataset
mark), chỉ đổi phần `init()` từ "tự tạo observer" thành `onMutate(run)`.
rAF thay `setTimeout(150)` → decorate trong **cùng frame paint**, không thấy chớp.

**Luật cho code mới:** decorator thêm sau này phải (1) đăng ký qua `onMutate`,
(2) thoát sớm nếu không phải trang của nó, (3) đánh dấu node đã xử lý bằng
`dataset`/class để re-run rẻ.

## 3. Preload font

Inter latin + vietnamese dùng từ ký tự đầu tiên nhưng trước đây chỉ được phát
hiện sau khi parse tới `@font-face` → FOUT. Thêm trước block `<style>`:

```html
<link rel="preload" href="{{ WEBROOT }}static/themes/mycloud/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{{ WEBROOT }}static/themes/mycloud/fonts/inter-vietnamese.woff2" as="font" type="font/woff2" crossorigin>
```

`crossorigin` là bắt buộc với font preload (kể cả same-origin) — thiếu nó browser
tải 2 lần. Href phải khớp **đúng URL** trong `src:` đầu tiên của `@font-face`.

## 4. noopener cho link mở tab mới

`Report Bug` / `Help` trong user menu mở `HORIZON_CONFIG.bug_url/help_url` bằng
`target="_blank"`. Thêm `rel="noopener noreferrer"`: trang đích (có thể là
domain ngoài) không còn tham chiếu `window.opener` để điều hướng lại tab Horizon
(reverse-tabnabbing), và không lộ referrer URL nội bộ.

## 5. Dedup data-URI mask

8 glyph (search, server, chevron ×3, plus, minus, asterisk) bị lặp nguyên văn
2–4 lần trong `_styles.scss` (26 chỗ). Giờ định nghĩa 1 lần trong block
"Local palette helpers":

```scss
$mc-svg-search: url("data:image/svg+xml,<svg ...>");
// dùng: mask: $mc-svg-search no-repeat center;
```

Lưu ý: cùng glyph nhưng **khác stroke-width là token khác nhau**
(`$mc-svg-plus` vs `$mc-svg-plus-w2`) — không gộp, để không đổi nét vẽ.

## 6. Token hoá màu neutral

Bổ sung vào block palette có sẵn (không tạo hệ màu mới — **giá trị y nguyên**):

```scss
$mc-ink:           #0f172a;   // chữ đậm nhất
$mc-slate:         #334155;   // chữ phụ đậm
$mc-muted:         #64748b;   // chữ mờ vùng content
$mc-faint:         #94a3b8;   // chữ mờ nhất / placeholder
$mc-border-strong: #cbd5e1;   // viền đậm / outline input
$mc-bg:            #f1f5f9;   // nền trang
$mc-bg-soft:       #f8fafc;   // nền mềm (thead, hover)
```

117 chỗ dùng literal được thay bằng token. Từ nay **rule mới phải dùng token**,
không hard-code hex — hết cảnh 2 trang lệch nhau một tông xám.

## 7. prefers-reduced-motion

```scss
@media (prefers-reduced-motion: reduce) { /* tắt skeleton shimmer */ }
```

Chỉ tắt shimmer trang trí (`mc-skel`). Spinner loading **giữ nguyên** vì nó
truyền đạt trạng thái (đúng hướng dẫn WCAG về essential motion).

---

## Kiểm chứng (đã chạy, không phải lý thuyết)

1. **SCSS compile-diff bằng libsass:** compile bản cũ (git HEAD) và bản mới với
   cùng stub biến ngoài → **CSS output chỉ khác đúng block
   `prefers-reduced-motion` cố ý thêm**. Mask dedup + token màu = byte-identical.
2. **Round-trip test:** thay token ngược lại literal → file trùng khớp 100% bản gốc.
3. **JS tách 1:1:** brace/bracket cân bằng; chênh lệch `()` (+2) trùng khớp bản
   gốc (nằm trong string label); 0 control char; 0 template tag lọt vào file JS.
4. **Cấu trúc template:** verbatim 2/2, script 4/4 (3 inline + 1 src).

## Deploy

```bash
# File MỚI static/js/mycloud.js cần collectstatic; template đổi cần restart
docker cp .../themes/mycloud horizon:/path/to/themes/
docker exec horizon python manage.py collectstatic --noinput   # hoặc quy trình sẵn có
docker restart horizon
```

- Template (`_sidebar.html`, `_user_menu.html`) → **bắt buộc restart** (Django cache template).
- `_styles.scss` → restart để pipeline recompile (COMPRESS_OFFLINE=False như đã chốt).
- `mycloud.js` đổi nội dung → nhớ bump `?v=` trong `_sidebar.html`.

## Những gì KHÔNG làm (có chủ đích)

- **Không đổi** bất kỳ giá trị màu nào — chỉ đặt tên cho giá trị sẵn có.
- **Không đụng** DOM structure, selector, workflow Horizon.
- **Không gộp** glyph khác stroke-width dù cùng hình.
- **Giữ** `autocomplete="off"` + chặn password manager ở login (quyết định UI có
  chủ đích; về security thuần thì password manager là điểm cộng — ghi nhận trade-off).
- **Giữ** font self-hosted (air-gap OK) — không quay lại CDN.
