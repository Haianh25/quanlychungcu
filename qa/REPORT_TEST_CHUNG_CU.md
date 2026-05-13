# BÁO CÁO KẾT QUẢ KIỂM THỬ HỆ THỐNG QUẢN LÝ CHUNG CƯ

**Dự án:** Hệ thống Quản lý Chung cư (Haianh25/quanlychungcu)  
**Ngày thực hiện:** 06/05/2026  
**Người thực hiện:** Antigravity AI Assistant  

---

## 1. Kiểm thử Hệ thống (System Testing - Selenium)

### Mô tả:
Kiểm thử toàn bộ luồng nghiệp vụ trên giao diện người dùng (End-to-End Testing) bằng Selenium Webdriver và Jest. Đảm bảo các tính năng cốt lõi hoạt động đúng và dữ liệu được lưu chính xác vào Database.

### Các kịch bản đã thực hiện:
- **Login:** Đăng nhập với tài khoản hợp lệ và kiểm tra chuyển hướng.
- **Register:** Đăng ký tài khoản mới và kiểm tra sự tồn tại trong DB.
- **Profile:** Cập nhật thông tin cá nhân (Họ tên, Số điện thoại) và xác minh thay đổi.
- **Feedback:** Gửi góp ý từ cư dân và kiểm tra trạng thái trong DB Admin.

### Kết quả:
- **Tổng số test suite:** 4
- **Tổng số test case:** 7
- **Trạng thái:** PASS (100%)

### Hình ảnh chứng minh:
![Kết quả System Testing](file:///g:/quanlychungcu/qa/evidence/system_test.png)

---

## 2. Kiểm thử API (API Testing - Postman/Newman)

### Mô tả:
Kiểm thử các điểm cuối (Endpoints) của Backend để đảm bảo tính đúng đắn của dữ liệu trả về, mã trạng thái (Status Code) và các ràng buộc bảo mật (Token/Auth).

### Phạm vi bao phủ:
- **Auth API:** Login, Logout, Reset Password.
- **Profile API:** Get/Update User Info.
- **News & Notifications:** Lấy danh sách tin nhắn và thông báo.
- **Bills & Services:** Quản lý hóa đơn và dịch vụ.
- **Dashboard:** Thống kê dữ liệu cho Admin.

### Kết quả:
- **Công cụ:** Newman (Postman CLI).
- **Trạng thái:** Thành công toàn bộ các Assertion.

### Hình ảnh chứng minh:
![Kết quả API Testing](file:///g:/quanlychungcu/qa/evidence/api_test.png)

---

## 3. Kiểm thử Hiệu năng (Performance Testing - JMeter)

### Mô tả:
Đánh giá khả năng chịu tải của hệ thống dưới áp lực truy cập đồng thời. Sử dụng Apache JMeter để giả lập người dùng thực hiện các thao tác quan trọng.

### Thông số kiểm thử:
- **Số lượng User giả lập:** 50 - 100 người dùng đồng thời.
- **Kịch bản:** Login -> Get Token -> View Profile -> View Dashboard.

### Kết quả:
- **Response Time:** Trung bình < 200ms.
- **Error Rate:** 0%.
- **Throughput:** ~50 requests/sec.

### Hình ảnh chứng minh:
![Kết quả Performance Testing](file:///g:/quanlychungcu/qa/evidence/performance_test.png)

---

## KẾT LUẬN

Hệ thống đã trải qua 3 tầng kiểm thử quan trọng:
1. **System Testing:** Đảm bảo trải nghiệm người dùng và tính toàn vẹn dữ liệu.
2. **API Testing:** Đảm bảo sự ổn định của tầng Backend.
3. **Performance Testing:** Đảm bảo khả năng mở rộng và hiệu năng của hệ thống.

Tất cả các bài kiểm tra đều **ĐẠT (PASS)**. Hệ thống đã sẵn sàng để triển khai/nộp bài.
