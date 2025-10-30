// backend/index.js
// Import các thư viện cần thiết
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import module database của chúng ta
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news'); // Giữ nguyên file này
const vehicleAdminRoutes = require('./routes/vehicleAdmin');
const serviceRoutes = require('./routes/services');
const fs = require('fs');
const path = require('path');
const profileRoutes = require('./routes/profile');
const billAdminRoutes = require('./routes/billAdmin');

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

// --- SỬA LỖI 404 Ở ĐÂY ---
// highlight-start
// 1. Tạo MỘT Router chính cho admin
const adminMasterRouter = express.Router();

// 2. Bảo router chính SỬ DỤNG cả 3 file route con
adminMasterRouter.use(adminRoutes); // Chứa các route: /dashboard, /user-management...
adminMasterRouter.use(vehicleAdminRoutes); // Chứa các route: /vehicle-requests, /vehicle-cards...
adminMasterRouter.use(billAdminRoutes); // Chứa các route: /bills, /bills/generate...

// 3. Đăng ký các route KHÔNG phải admin
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/profile', profileRoutes);

// 4. Chỉ gọi app.use('/api/admin', ...) MỘT LẦN duy nhất
app.use('/api/admin', adminMasterRouter); 
// highlight-end

// (Xóa các dòng app.use('/api/admin', ...) cũ ở đây nếu có)

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