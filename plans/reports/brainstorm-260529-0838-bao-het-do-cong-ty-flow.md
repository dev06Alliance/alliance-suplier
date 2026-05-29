# Brainstorm Report: Báo Hết/Hỏng Đồ Công Ty

**Date:** 2026-05-29 | **Status:** Flow Confirmed

---

## Problem Statement

Xây dựng hệ thống nội bộ cho phép nhân viên báo đồ dùng hỏng/hết, quản lý xác nhận và xử lý, admin quản trị danh mục và xem báo cáo.

**Constraints:**
- Web app (browser), React + Node.js + PostgreSQL
- Single-tenant, < 50 users
- In-app notification only (badge/bell)

---

## Confirmed Flow

### Roles
| Role | Quyền |
|------|-------|
| Admin | Quản lý user, phân quyền, catalog sản phẩm/danh mục, xem report |
| User thường | Báo hỏng/hết, thêm sản phẩm chưa có (free-text + hình) |
| User quản lý | Xác nhận ticket, Done ticket, kéo dài deadline (có lý do) |

### Core Flow

```
[User thường]
  1. Chọn sản phẩm từ catalog
     OR nhập free-text + upload hình (sản phẩm chưa có)
  2. Chọn loại: Hỏng | Hết
  3. Nhập deadline mong muốn
  4. Submit → ticket tạo, status: PENDING

[System]
  → Tạo notification cho tất cả User quản lý (in-app badge)
  → Track: số người report cùng sản phẩm, số lần deadline thay đổi

[User quản lý] (bất kỳ ai cũng được)
  → "Xác nhận" → status: CONFIRMED (đã nhận, sẽ xử lý)
  → Xử lý thực tế (mua/bổ sung)
  → "Done" → status: DONE
  → HOẶC: Kéo dài deadline → nhập lý do → system log lại

[Admin]
  → Dashboard report: tổng tickets/ngày, confirmed/ngày, done/ngày
  → Manage catalog: thêm/sửa/xóa sản phẩm, danh mục
  → Manage users: tạo, phân role
```

### Ticket Status Flow
```
PENDING → CONFIRMED → DONE
              ↓ (kéo deadline, log lý do)
         CONFIRMED (deadline mới)
```

---

## Key Design Decisions

### 1. Sản phẩm chưa có trong catalog
**Chưa confirm từ khách hàng** — 2 options khuyến nghị:
- **Option A (Đơn giản):** Free-text ticket tồn tại độc lập, Admin thấy và tự tay thêm vào catalog nếu cần. Tách biệt hoàn toàn.
- **Option B:** Free-text ticket → Admin có nút "Add to catalog" trực tiếp từ ticket. UX tốt hơn.

→ **Recommend Option A** trước, nếu Admin thấy bất tiện thì nâng lên Option B.

### 2. Nhiều người báo cùng 1 sản phẩm
**Chưa confirm từ khách hàng** — 2 options:
- **Option A (Recommend):** Gom 1 ticket/sản phẩm, đếm số người report. Quản lý thấy ít noise hơn. System track `reporter_count`.
- **Option B:** Mỗi người 1 ticket. Đơn giản implement nhưng quản lý bị nhiễu.

→ **Recommend Option A** — align với yêu cầu "ghi lại số lượng người report cho 1 sản phẩm".

### 3. Phân quyền Xác nhận
Bất kỳ User quản lý nào cũng Xác nhận được → first-come-first-served, không cần assign.

### 4. Deadline tracking
- User set deadline ban đầu (tự chọn, không default)
- Quản lý kéo dài: bắt buộc nhập lý do
- System log: `deadline_change_count` + history với timestamp + lý do

---

## Data Model (Sơ bộ)

```
products          — catalog sản phẩm (id, name, category_id, image_url)
categories        — danh mục (id, name)
tickets           — yêu cầu (id, product_id nullable, free_text, image_url,
                    type[broken|empty], status, deadline, reporter_count,
                    created_by, confirmed_by, created_at)
ticket_reporters  — ai đã report ticket này (ticket_id, user_id, reported_at)
deadline_history  — log thay đổi deadline (ticket_id, old_deadline, new_deadline,
                    reason, changed_by, changed_at)
users             — (id, name, email, role[admin|manager|user])
notifications     — in-app (user_id, ticket_id, read, created_at)
```

---

## Unresolved Questions
1. **Sản phẩm chưa có trong catalog:** Free-text độc lập hay có flow Admin duyệt thêm vào catalog? → Cần confirm với khách hàng.
2. **Nhiều người báo cùng sản phẩm:** Gom 1 ticket hay tách riêng? → Cần confirm với khách hàng.
3. **Overdue alert:** Khi ticket quá deadline chưa Done, có highlight trong UI không? → Pending.
4. **Report chi tiết:** Admin xem report theo khoảng thời gian tùy chọn hay chỉ "hôm nay"? Có export không?
