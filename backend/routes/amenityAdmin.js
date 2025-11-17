const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// 1. Lấy danh sách phòng
router.get('/rooms', protect, isAdmin, async (req, res) => {
    try {
        // Join với fees để lấy giá hiển thị (nếu có), nhưng giá thực tế quản lý bên Fee
        const query = `
            SELECT r.*, f.price as current_price
            FROM community_rooms r
            LEFT JOIN fees f ON r.fee_code = f.fee_code
            ORDER BY r.id ASC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi tải danh sách phòng.' });
    }
});

// 2. Cập nhật phòng (ĐÃ SỬA: Cho phép sửa TÊN, Mô tả, Ảnh, Trạng thái)
router.put('/rooms/:id', protect, isAdmin, async (req, res) => {
    // Thêm 'name' vào đây
    const { name, description, image_url, status } = req.body;
    const { id } = req.params;
    
    try {
        await db.query(
            `UPDATE community_rooms 
             SET name=$1, description=$2, image_url=$3, status=$4
             WHERE id=$5`,
            [name, description, image_url, status, id]
        );
        res.json({ message: 'Cập nhật thông tin phòng thành công.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi cập nhật phòng.' });
    }
});

// 3. Lấy danh sách booking
router.get('/bookings', protect, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT b.*, r.name as room_name, u.full_name as resident_name, u.email
            FROM room_bookings b
            JOIN community_rooms r ON b.room_id = r.id
            JOIN users u ON b.resident_id = u.id
            ORDER BY b.booking_date DESC, b.start_time DESC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi tải danh sách đặt phòng.' });
    }
});

// 4. Hủy lịch
router.post('/bookings/:id/cancel', protect, isAdmin, async (req, res) => {
    try {
        await db.query("UPDATE room_bookings SET status = 'cancelled' WHERE id = $1", [req.params.id]);
        res.json({ message: 'Đã hủy lịch đặt.' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi hủy lịch.' });
    }
});

// ==================================================================
// 🚨 API ĐẶC BIỆT ĐỂ SỬA LỖI DATABASE (CHẠY 1 LẦN LÀ ĐƯỢC)
// Đường dẫn: http://localhost:5000/api/admin/amenities/init-database
// ==================================================================
router.get('/init-database', async (req, res) => {
    try {
        console.log("--- BẮT ĐẦU TẠO LẠI BẢNG ---");
        
        // 1. Xóa bảng cũ để tránh lỗi
        await db.query('DROP TABLE IF EXISTS room_bookings CASCADE');
        await db.query('DROP TABLE IF EXISTS community_rooms CASCADE');

        // 2. Tạo bảng ROOMS chuẩn (có fee_code)
        await db.query(`
            CREATE TABLE community_rooms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                fee_code VARCHAR(50) NOT NULL, 
                description TEXT,
                image_url TEXT,
                capacity INT DEFAULT 20,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Tạo bảng BOOKINGS chuẩn
        await db.query(`
            CREATE TABLE room_bookings (
                id SERIAL PRIMARY KEY,
                resident_id INT NOT NULL,
                room_id INT REFERENCES community_rooms(id),
                booking_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'confirmed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Thêm dữ liệu mẫu cho bảng FEES (nếu chưa có)
        // Lưu ý: Cần đảm bảo bảng fees đã tồn tại. 
        // Dùng câu lệnh này để tránh lỗi trùng lặp
        await db.query(`
            INSERT INTO fees (fee_name, fee_code, price, description) 
            SELECT 'Phí thuê Phòng SHC A', 'ROOM_A_FEE', 200000, 'Giá thuê 1 giờ'
            WHERE NOT EXISTS (SELECT 1 FROM fees WHERE fee_code = 'ROOM_A_FEE');

            INSERT INTO fees (fee_name, fee_code, price, description) 
            SELECT 'Phí thuê Phòng SHC B', 'ROOM_B_FEE', 150000, 'Giá thuê 1 giờ'
            WHERE NOT EXISTS (SELECT 1 FROM fees WHERE fee_code = 'ROOM_B_FEE');

            INSERT INTO fees (fee_name, fee_code, price, description) 
            SELECT 'Phí thuê Khu BBQ', 'ROOM_C_FEE', 300000, 'Giá thuê 1 giờ'
            WHERE NOT EXISTS (SELECT 1 FROM fees WHERE fee_code = 'ROOM_C_FEE');
        `);

        // 5. Thêm dữ liệu mẫu cho ROOMS (Hard code 3 phòng)
        await db.query(`
            INSERT INTO community_rooms (name, fee_code, description, image_url, capacity) VALUES
            ('Phòng Sinh Hoạt A', 'ROOM_A_FEE', 'Rộng rãi, view hồ bơi, tầng 2', 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop', 30),
            ('Phòng Sinh Hoạt B', 'ROOM_B_FEE', 'Yên tĩnh, có máy chiếu, tầng 3', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1000&auto=format&fit=crop', 15),
            ('Khu BBQ Sân Thượng', 'ROOM_C_FEE', 'Thoáng mát, tiệc nướng ngoài trời', 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=1000&auto=format&fit=crop', 20);
        `);

        console.log("--- TẠO BẢNG THÀNH CÔNG ---");
        res.send("<h1>Đã khởi tạo Database thành công! <br> Bây giờ bạn hãy quay lại trang Admin và F5 nhé.</h1>");

    } catch (err) {
        console.error("Lỗi khởi tạo DB:", err);
        res.status(500).send("<h1>Lỗi khi tạo bảng: " + err.message + "</h1>");
    }
});

module.exports = router;