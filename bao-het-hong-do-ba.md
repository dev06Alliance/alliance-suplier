# Business Analysis: Hệ Thống Báo Hết/Hỏng Đồ Công Ty

**Phiên bản:** 1.1 | **Ngày:** 2026-05-29 | **Trạng thái:** Đã xác nhận

---

## 1. Mục Tiêu Dự Án

Xây dựng hệ thống nội bộ giúp nhân viên báo đồ dùng văn phòng bị **hỏng** hoặc **hết**, quản lý tiếp nhận xử lý, admin theo dõi tổng thể qua báo cáo.

**Phạm vi:** Single-tenant, < 50 người dùng, web app (trình duyệt).

---

## 2. Actors

| Actor | Mô tả |
|-------|-------|
| **Admin** | Quản trị viên hệ thống. Quản lý danh mục đồ dùng, xem báo cáo. |
| **Manager** (Quản lý) | Tiếp nhận, xác nhận và xử lý yêu cầu của nhân viên. |
| **User** (Nhân viên) | Tạo yêu cầu báo đồ hỏng/hết. Xem yêu cầu do mình tạo. |

---

## 3. Use Cases

### UC-01: Đăng nhập

- **Actor:** Tất cả
- **Flow:** Nhập email + mật khẩu → vào hệ thống
- **Ghi chú:** Không có trang đăng ký. Tài khoản được tạo sẵn qua seed data.

---

### UC-02: Tạo yêu cầu báo đồ hỏng/hết

- **Actor:** User
- **Điều kiện:** Đã đăng nhập
- **Flow chính:**
  1. Chọn **"Tạo yêu cầu mới"**
  2. Tìm và chọn sản phẩm từ danh mục
  3. Chọn loại: **Hỏng** hoặc **Hết**
  4. Nhập ngày deadline mong muốn
  5. Gửi yêu cầu
- **Flow ngoại lệ — sản phẩm chưa có trong danh mục:**
  - Nhập mô tả bằng chữ + đính kèm hình ảnh
  - Yêu cầu được tạo ngay, không cần Admin duyệt
- **Kết quả:** Yêu cầu tạo thành công, tất cả Manager nhận thông báo trong app.

---

### UC-03: Xem danh sách yêu cầu của mình

- **Actor:** User
- **Flow:** Vào trang danh sách → thấy các yêu cầu do mình tạo, lọc theo trạng thái
- **Hiển thị đặc biệt:** Yêu cầu quá hạn (deadline đã qua, chưa Hoàn thành) → highlight màu đỏ
- **Thông tin hiển thị:** Trạng thái, deadline hiện tại *(không thấy lịch sử thay đổi deadline)*

---

### UC-04: Xem và xử lý tất cả yêu cầu

- **Actor:** Manager
- **Mặc định:** Hiển thị ticket đang chờ xử lý (PENDING). Có thể filter sang trạng thái khác.
- **Flow:**
  1. Xem danh sách ticket (mặc định: PENDING, overdue highlight đỏ)
  2. Chọn ticket → xem chi tiết (bao gồm lịch sử thay đổi deadline)
  3. Thực hiện action:
     - **Xác nhận** → trạng thái → "Đã xác nhận", User nhận thông báo
     - **Hoàn thành** → chỉ Manager đã Xác nhận ticket này mới làm được → trạng thái → "Hoàn thành", User nhận thông báo
     - **Kéo dài deadline** → nhập lý do bắt buộc → hệ thống ghi lại lịch sử

---

### UC-05: Xem báo cáo

- **Actor:** Admin
- **Flow:**
  1. Chọn ngày đơn hoặc khoảng ngày (từ...đến)
  2. Xem 3 chỉ số: **Tổng yêu cầu / Đã xác nhận / Đã hoàn thành**
- **Ghi chú:** Không drill-down, không export file.

---

### UC-06: Quản lý danh mục đồ dùng

- **Actor:** Admin
- **Flow:** Thêm / sửa / xóa sản phẩm và danh mục

---

### UC-07: Nhận và đọc thông báo

- **Actor:** Manager, User
- **Trigger:**

| Sự kiện | Người nhận |
|---------|-----------|
| Yêu cầu mới được tạo | Tất cả Manager |
| Yêu cầu được Xác nhận | User đã tạo yêu cầu đó |
| Yêu cầu được Hoàn thành | User đã tạo yêu cầu đó |

- **Hình thức:** Thông báo trong app (biểu tượng chuông, đếm số chưa đọc)

---

## 4. Trạng Thái Yêu Cầu

```
[Chờ xử lý]  →  [Đã xác nhận]  →  [Hoàn thành]
  PENDING          CONFIRMED           DONE
  (any Manager)    (locked to          (same Manager
                    confirming          who confirmed)
                    Manager)
                      ↕
               Kéo dài deadline
               (bắt buộc nhập lý do)
```

---

## 5. Quyền Truy Cập Theo Chức Năng

| Chức năng | User | Manager | Admin |
|-----------|:----:|:-------:|:-----:|
| Tạo yêu cầu | ✓ | ✓ | ✓ |
| Xem yêu cầu của mình | ✓ | ✓ | ✓ |
| Xem tất cả yêu cầu | ✗ | ✓ | ✓ |
| Xem lịch sử deadline | ✗ | ✓ | ✓ |
| Xác nhận yêu cầu | ✗ | ✓ (bất kỳ) | ✗ |
| Đánh dấu Hoàn thành | ✗ | ✓ (chỉ người đã Confirm) | ✗ |
| Kéo dài deadline | ✗ | ✓ | ✗ |
| Quản lý danh mục sản phẩm | ✗ | ✗ | ✓ |
| Xem báo cáo | ✗ | ✗ | ✓ |

---

## 6. Quy Tắc Nghiệp Vụ

| # | Quy tắc |
|---|---------|
| BR-01 | Mỗi người báo = 1 yêu cầu riêng. Không gom chung dù cùng sản phẩm. |
| BR-02 | Sản phẩm chưa có trong danh mục → user nhập free-text + hình. Tạo ngay, không cần duyệt. |
| BR-03 | Kéo dài deadline phải nhập lý do. Hệ thống lưu lịch sử: lần mấy, lý do, ai thay đổi, thời điểm. |
| BR-04 | Bất kỳ Manager nào cũng có thể Xác nhận ticket. |
| BR-05 | **Chỉ Manager đã Xác nhận mới được đánh Hoàn thành** ticket đó. Manager khác không thể Done. |
| BR-06 | Manager có thể Done ngay sau khi Confirm, không cần chờ. |
| BR-07 | Yêu cầu quá hạn (deadline qua, chưa Hoàn thành) → highlight đỏ trong danh sách. Không gửi thông báo tự động. |
| BR-08 | Thông báo chỉ trong app. Không email, không Zalo/Telegram. |
| BR-09 | Tài khoản tạo qua seed data. Không có UI quản lý user, không có trang đăng ký. |

---

## 7. Thông Tin Hệ Thống Tự Ghi Lại

| Thông tin | Hiển thị cho |
|-----------|-------------|
| Số lần thay đổi deadline | Manager, Admin |
| Lịch sử thay đổi deadline (deadline cũ/mới, lý do, ai đổi, khi nào) | Manager, Admin |

---

## 8. Màn Hình Chính

| Màn hình | Actor | Mô tả |
|----------|-------|-------|
| Đăng nhập | Tất cả | Form email + mật khẩu |
| Danh sách yêu cầu | User | Ticket của mình, filter status, overdue đỏ |
| Danh sách yêu cầu | Manager | Tất cả ticket, mặc định PENDING, filter status, overdue đỏ |
| Tạo yêu cầu mới | User | Chọn sản phẩm → chọn Hỏng/Hết → nhập deadline |
| Chi tiết yêu cầu | User | Trạng thái, deadline hiện tại |
| Chi tiết yêu cầu | Manager | Trạng thái, lịch sử deadline + actions (Confirm/Done/Kéo deadline) |
| Báo cáo | Admin | 3 chỉ số thống kê, filter ngày đơn hoặc khoảng ngày |
| Quản lý sản phẩm & danh mục | Admin | Thêm / sửa / xóa |
