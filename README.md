# 🏢 Hệ Thống Quản Lý Chung Cư (Apartment Management System)

> Đồ án Tốt nghiệp Kỹ sư Công nghệ Phần mềm - PTIT 2025

Hệ thống quản lý chung cư toàn diện giúp kết nối Ban quản lý và Cư dân, tích hợp thanh toán online, chat thời gian thực và trợ lý ảo AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Completed-success.svg)

## 🌟 Tính Năng Nổi Bật

### 👨‍💼 Dành cho Ban Quản Lý (Admin)
- **Dashboard:** Thống kê doanh thu, tình trạng căn hộ bằng biểu đồ trực quan.
- **Quản lý Cư dân & Căn hộ:** Thêm, sửa, xóa, cấp tài khoản, import Excel.
- **Quản lý Dịch vụ:** Duyệt thẻ xe, quản lý phí dịch vụ, hóa đơn điện nước.
- **Chat Real-time:** Hỗ trợ cư dân trực tuyến (tích hợp thông báo chưa đọc).
- **Thông báo:** Gửi thông báo tức thì đến toàn bộ cư dân.

### 👨‍👩‍👧‍👦 Dành cho Cư dân (Resident)
- **Trang cá nhân:** Xem thông tin căn hộ, xe cộ.
- **Thanh toán:** Xem hóa đơn và thanh toán online (PayPal/VNPAY).
- **Tiện ích:** Đăng ký thẻ xe, đặt phòng sinh hoạt chung.
- **AI Chatbot:** Trợ lý ảo Google Gemini trả lời thắc mắc 24/7.
- **Phản ánh:** Gửi yêu cầu sửa chữa, khiếu nại tới BQL.

## 🛠 Công Nghệ Sử Dụng

| Phân hệ | Công nghệ |
| --- | --- |
| **Frontend** | ReactJS, Bootstrap 5, Socket.io-client |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | PostgreSQL |
| **AI Integration** | Google Gemini Pro API |
| **Payment** | PayPal SDK |

## 🚀 Hướng Dẫn Cài Đặt (Setup Guide)

Làm theo các bước sau để chạy dự án trên máy local:

### 1. Yêu cầu hệ thống
- Node.js (v18 trở lên)
- PostgreSQL
- Git

### 2. Clone dự án
```bash
git clone [https://github.com/username-cua-ban/haianh25-quanlychungcu.git](https://github.com/username-cua-ban/haianh25-quanlychungcu.git)
cd haianh25-quanlychungcu
