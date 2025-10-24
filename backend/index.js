// backend/index.js
// Import các thư viện cần thiết
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import module database của chúng ta
const authRoutes = require('./routes/auth'); 
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news'); // Giữ nguyên file này
// Tạo một ứng dụng Express
const app = express();
console.log('--- KẾT NỐI DATABASE ĐANG SỬ DỤNG ---');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('Database:', process.env.DB_DATABASE);
console.log('User:', process.env.DB_USER);
console.log('------------------------------------');

// Sử dụng middleware
app.use(cors());

// --- SỬA Ở ĐÂY ---
// Tăng giới hạn kích thước payload để nhận nội dung Base64 từ ReactQuill
// Cần đặt TRƯỚC khi định nghĩa routes (app.use('/api/...'))
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// --- KẾT THÚC SỬA ---

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes); // Vẫn giữ route này

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