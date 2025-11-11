// Import các thư viện cần thiết
const express = require('express');
const cors = require('cors');
const db = require('./db'); 
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news');
const vehicleAdminRoutes = require('./routes/vehicleAdmin');
const serviceRoutes = require('./routes/services');
const fs = require('fs');
const path = require('path');
const profileRoutes = require('./routes/profile');
const billUserRoutes = require('./routes/billUser');
const notificationRoutes = require('./routes/notifications');

// --- CÁC ROUTE ĐÃ THÊM/SỬA ---
const billAdminRoutes = require('./routes/billAdmin'); 
const feeAdminRoutes = require('./routes/feeAdmin'); // Đã thêm
const paymentRoutes = require('./routes/payment'); // Đã thêm

// 2. Import file cron.js để khởi chạy
require('./cron'); // Đã thêm (chứa logic tạo hóa đơn & phí phạt)

// Tạo một ứng dụng Express
const app = express();
console.log('--- KẾT NỐI DATABASE ĐANG SỬ DỤNG ---');
// ... (console.log DB)

// Sử dụng middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Phục vụ file tĩnh ---
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));
console.log(`Serving static files from ${uploadsDir} at /uploads`);

// --- ĐỊNH TUYẾN (SỬA LẠI) ---

// 1. Tạo MỘT Router chính cho admin
const adminMasterRouter = express.Router();

// 2. Gắn các route con vào router chính
adminMasterRouter.use(adminRoutes); // Gắn các route trong admin.js
adminMasterRouter.use(vehicleAdminRoutes); // Gắn các route trong vehicleAdmin.js
adminMasterRouter.use('/bills', billAdminRoutes); // Gắn route bill
adminMasterRouter.use('/fees', feeAdminRoutes); // Gắn route fee

// 3. Đăng ký các route KHÔNG phải admin
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/bills', billUserRoutes); // Route cho user
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment', paymentRoutes); // Gắn route payment mới

// 4. Đăng ký router chính của admin vào '/api/admin'
app.use('/api/admin', adminMasterRouter); 

// --- KẾT THÚC SỬA ---

// Định nghĩa một route (đường dẫn) cơ bản để kiểm tra
app.get('/', (req, res) => {
    res.send('Chào mừng đến với API quản lý chung cư!');
});

// Route để kiểm tra kết nối database
app.get('/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.status(200).json({
            message: 'Kết nối database thành công!',
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error('Lỗi kết nối database:', error);
        res.status(500).json({
            message: 'Lỗi khi kết nối với database!',
            error: error.message,
        });
    }
});

// Lắng nghe server ở một cổng (port) nào đó
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
});