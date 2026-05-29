# Tài Liệu Yêu Cầu: Hệ Thống Báo Hết/Hỏng Đồ Công Ty

**Phiên bản:** 1.1 | **Ngày:** 2026-05-29 | **Trạng thái:** Đã xác nhận đầy đủ

---

## 1. Tổng Quan

Hệ thống nội bộ giúp nhân viên báo đồ dùng văn phòng bị hỏng hoặc hết, quản lý tiếp nhận và xử lý, admin theo dõi tổng thể.

**Nền tảng:** Web app (trình duyệt)  
**Quy mô:** < 50 người dùng, single-tenant  
**Stack kỹ thuật:** React + Node.js + PostgreSQL  

---

## 2. Phân Quyền

| Vai trò | Mô tả |
|---------|-------|
| **Admin** | Quản trị hệ thống: tạo tài khoản, phân quyền, quản lý danh mục đồ dùng, xem báo cáo |
| **User thường** | Nhân viên: báo đồ hỏng/hết, chỉ xem yêu cầu do mình tạo |
| **User quản lý** | Quản lý: tiếp nhận và xử lý tất cả yêu cầu |

**Khởi tạo Admin:** Admin đầu tiên được tạo qua seed script khi setup hệ thống (không cần vào DB thủ công). Sau đó Admin tự đổi mật khẩu qua UI.

---

## 3. Luồng Hoạt Động

### 3.1 Nhân Viên Báo Đồ Hỏng/Hết

1. Đăng nhập vào hệ thống
2. Chọn **"Tạo yêu cầu mới"**
3. **Tìm và chọn sản phẩm** từ danh mục có sẵn  
   — Nếu sản phẩm **không có trong danh mục**: nhập mô tả bằng chữ + đính kèm hình ảnh. Yêu cầu được tạo ngay, **không cần Admin duyệt**.
4. Chọn loại: **Hỏng** hoặc **Hết**
5. Chọn **deadline mong muốn** (ngày cần giải quyết)
6. Nhấn **Gửi** → ticket tạo, tất cả quản lý nhận thông báo trong app

> Nhân viên **chỉ thấy yêu cầu do mình tạo**, không thấy yêu cầu của người khác.

---

### 3.2 Quản Lý Xử Lý Yêu Cầu

1. Nhận thông báo (biểu tượng chuông trong app)
2. Xem **toàn bộ danh sách yêu cầu** của công ty
3. Nhấn **"Xác nhận"** → báo đã nhận và sẽ xử lý *(bất kỳ quản lý nào cũng có thể xác nhận)*
4. Tiến hành mua/bổ sung đồ dùng thực tế
5. Nhấn **"Hoàn thành"** khi đã bổ sung xong

**Nếu cần thêm thời gian:**
- Nhấn **"Kéo dài hạn"** → **bắt buộc** nhập lý do → hệ thống lưu lại lịch sử

**Khi yêu cầu quá hạn (deadline đã qua mà chưa Hoàn thành):**
- Ticket **hiển thị màu đỏ** trong danh sách
- Hệ thống **gửi thông báo nhắc** tất cả quản lý trong app

---

### 3.3 Admin Quản Trị

- **Quản lý tài khoản:** Tạo thành viên mới, gán vai trò
- **Quản lý danh mục:** Thêm/sửa/xóa sản phẩm và danh mục đồ dùng
- **Xem lịch sử báo cáo tự do:** Admin có thể xem lại các yêu cầu free-text để quyết định có thêm sản phẩm đó vào danh mục không
- **Xem báo cáo:** Tổng số yêu cầu theo ngày, đã xác nhận, đã hoàn thành

---

## 4. Trạng Thái Yêu Cầu

```
Chờ xử lý  →  Đã xác nhận  →  Hoàn thành
(PENDING)      (CONFIRMED)      (DONE)
                    ↕
              Kéo dài deadline
              (bắt buộc nhập lý do, lưu lịch sử)
```

---

## 5. Quy Tắc Nghiệp Vụ

### 5.1 Mỗi người báo = 1 ticket riêng
Nếu 5 người cùng báo máy in hỏng → tạo **5 ticket độc lập**.  
Thống kê "sản phẩm bị báo nhiều lần" vẫn hiển thị qua báo cáo của Admin.

### 5.2 Sản phẩm chưa có trong danh mục
- Nhân viên nhập mô tả + hình ảnh → ticket tạo **ngay lập tức, không cần duyệt**
- Admin xem lịch sử, **tự quyết định** có thêm sản phẩm đó vào catalog hay không

### 5.3 Kéo dài deadline
- Chỉ quản lý mới được kéo dài
- **Bắt buộc** nhập lý do
- Hệ thống lưu: lần thay đổi thứ mấy, deadline cũ, deadline mới, lý do, ai thay đổi, thời gian

### 5.4 Quá hạn (Overdue)
- Ticket **PENDING** hoặc **CONFIRMED** có deadline < hôm nay → **highlight đỏ** trong UI
- Đồng thời **gửi notification** nhắc nhở tất cả quản lý trong app

### 5.5 Thông báo (in-app)
- Biểu tượng chuông trên header, hiển thị số chưa đọc
- Khi có yêu cầu mới → notify tất cả quản lý
- Khi ticket quá hạn → notify tất cả quản lý

### 5.6 Visibility
| Vai trò | Thấy yêu cầu nào |
|---------|-----------------|
| User thường | Chỉ yêu cầu do mình tạo |
| User quản lý | Tất cả yêu cầu của công ty |
| Admin | Tất cả yêu cầu + báo cáo |

---

## 6. Thống Kê Hệ Thống Tự Động Ghi

| Thông tin | Mô tả |
|-----------|-------|
| Số lần thay đổi deadline | Hiển thị trên từng yêu cầu |
| Lịch sử thay đổi deadline | Deadline cũ/mới, lý do, người thay đổi, thời gian |
| Số lần 1 sản phẩm được báo | Thống kê trong báo cáo Admin |

---

## 7. Báo Cáo (Admin)

Filter linh hoạt: chọn **ngày đơn** hoặc **khoảng ngày (từ...đến)**. Không cần xuất file.

| Chỉ số | Mô tả |
|--------|-------|
| Tổng yêu cầu | Tất cả yêu cầu tạo trong khoảng thời gian chọn |
| Đã xác nhận | Yêu cầu được quản lý xác nhận trong khoảng đó |
| Đã hoàn thành | Yêu cầu Done trong khoảng đó |
