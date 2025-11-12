// NỘI DUNG TỆP ĐÃ CẬP NHẬT
const db = require('../db'); // Đảm bảo bạn đang export 'pool' từ db.js
// --- (THÊM MỚI 1) Import mailer ---
const { sendNewBillEmail } = require('./mailer');

/**
 * Hàm tạo hóa đơn tự động cho tất cả các phòng có người ở (resident)
 */
async function generateBillsForMonth(month, year) {
    console.log('Running job: generateBillsForMonth...');
    const pool = db.getPool ? db.getPool() : db; // Tương thích nếu db.js export getPool() hoặc pool
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const issueDate = new Date(Date.UTC(year, month - 1, 1)); 
        const dueDate = new Date(Date.UTC(year, month - 1, 10));
        
        // Tính toán tháng TRƯỚC
        const prevMonth = (month === 1) ? 12 : month - 1;
        const prevYear = (month === 1) ? year - 1 : year;
        
        // Lấy ngày trong tháng TRƯỚC
        const daysInPrevMonth = new Date(year, month - 1, 0).getUTCDate();
        const prevMonthStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
        const currentMonthStartDate = `${year}-${String(month).padStart(2, '0')}-01`;

        // --- (CẬP NHẬT 2) Lấy thông tin phòng VÀ thông tin user (email, name) ---
        const resRooms = await client.query(
            `SELECT 
                r.id AS room_id, 
                r.resident_id AS user_id, 
                u.email, 
                u.full_name 
             FROM rooms r
             JOIN users u ON r.resident_id = u.id
             WHERE r.resident_id IS NOT NULL`
        );
        
        if (resRooms.rows.length === 0) {
            console.log('No occupied rooms found. No bills generated.');
            await client.query('COMMIT');
            return { success: true, count: 0 }; // Trả về thành công
        }

        // 2. Lấy bảng giá phí từ CSDL (SỬA: Dùng đúng tên cột)
        const resFees = await client.query('SELECT fee_code, price FROM fees');
        const fees = {};
        resFees.rows.forEach(fee => {
            fees[fee.fee_code] = parseFloat(fee.price);
        });

        let generatedCount = 0;

        // 3. Tạo hóa đơn cho từng phòng
        for (const room of resRooms.rows) {
            // SỬA: Lấy thêm email và full_name
            const { room_id, user_id, email, full_name } = room;

            // Kiểm tra xem hóa đơn tháng này đã được tạo chưa
            const resCheck = await client.query(
                `SELECT 1 FROM bills 
                 WHERE room_id = $1 AND EXTRACT(MONTH FROM issue_date) = $2 AND EXTRACT(YEAR FROM issue_date) = $3`,
                [room_id, month, year]
            );

            if (resCheck.rows.length > 0) {
                console.log(`Bill for room ${room_id} already exists for ${month}/${year}. Skipping.`);
                continue;
            }

            let totalAmount = 0;
            const billItems = [];

            // 3a. Thêm các phí cố định (SỬA: Thêm kiểm tra 'if')
            if (fees['MANAGEMENT_FEE']) {
                billItems.push({
                    name: `Phí quản lý căn hộ (Tháng ${month}/${year})`,
                    price: fees['MANAGEMENT_FEE'],
                });
                totalAmount += fees['MANAGEMENT_FEE'];
            }
            if (fees['ADMIN_FEE']) {
                billItems.push({
                    name: `Phí ban quản trị (Tháng ${month}/${year})`,
                    price: fees['ADMIN_FEE'],
                });
                totalAmount += fees['ADMIN_FEE'];
            }

            // 3b. Phí xe HÀNG THÁNG (cho xe đã active)
            const vehicleRes = await client.query(
                "SELECT vehicle_type, COUNT(*) as count FROM vehicle_cards WHERE resident_id = $1 AND status = 'active' GROUP BY vehicle_type", 
                [user_id]
            );
            for (const vehicle of vehicleRes.rows) {
                let fee = 0; let desc = ''; const count = parseInt(vehicle.count, 10);
                
                // SỬA: Thêm kiểm tra 'if (fees[...])'
                if (vehicle.vehicle_type === 'car' && fees['CAR_FEE']) { 
                    fee = fees['CAR_FEE'] * count; 
                    desc = `Phí gửi xe Ô tô (x${count})`; 
                } else if (vehicle.vehicle_type === 'motorbike' && fees['MOTORBIKE_FEE']) {
                    fee = fees['MOTORBIKE_FEE'] * count; 
                    desc = `Phí gửi xe Máy (x${count})`; 
                } else if (vehicle.vehicle_type === 'bicycle' && fees['BICYCLE_FEE']) {
                    fee = fees['BICYCLE_FEE'] * count; 
                    desc = `Phí gửi xe Đạp (x${count})`; 
                }
                
                if (fee > 0) { 
                    totalAmount += fee; 
                    billItems.push({ name: desc, price: fee }); 
                }
            }

            // 3c. Phí MỘT LẦN (đăng ký/cấp lại) đã duyệt tháng TRƯỚC (Logic từ file SQL của bạn)
            const oneTimeFeeRes = await client.query(
                `SELECT id, request_type, vehicle_type, one_time_fee_amount 
                 FROM vehicle_card_requests 
                 WHERE resident_id = $1 AND status = 'approved' AND billed_in_bill_id IS NULL
                 AND reviewed_at >= $2 AND reviewed_at < $3`,
                [user_id, prevMonthStartDate, currentMonthStartDate]
            );
            const requestIdsToUpdate = [];
            for (const fee of oneTimeFeeRes.rows) {
                const amount = parseFloat(fee.one_time_fee_amount);
                if (amount > 0) {
                    totalAmount += amount;
                    const desc = fee.request_type === 'register' ? 'Phí đăng ký thẻ' : 'Phí cấp lại thẻ';
                    billItems.push({ name: `${desc} (${fee.vehicle_type})`, price: amount });
                    requestIdsToUpdate.push(fee.id);
                }
            }
            
            // 3d. Phí xe TÍNH TỶ LỆ cho thẻ mới đăng ký tháng TRƯỚC (Logic từ file SQL của bạn)
            const proratedCardsRes = await client.query(
                `SELECT vehicle_type, issued_at 
                 FROM vehicle_cards 
                 WHERE resident_id = $1 
                 AND created_from_request_id IS NOT NULL 
                 AND issued_at >= $2 AND issued_at < $3`, 
                [user_id, prevMonthStartDate, currentMonthStartDate]
            );

            for (const card of proratedCardsRes.rows) {
                const issuedDate = new Date(card.issued_at).getUTCDate(); 
                const daysToCharge = (daysInPrevMonth - issuedDate) + 1; 

                if (daysToCharge <= 0 || daysToCharge > daysInPrevMonth) continue; 

                let monthlyRate = 0; let vehicleName = '';
                // SỬA: Thêm kiểm tra 'if (fees[...])'
                if (card.vehicle_type === 'car' && fees['CAR_FEE']) { 
                    monthlyRate = fees['CAR_FEE']; vehicleName = 'Ô tô'; 
                } else if (card.vehicle_type === 'motorbike' && fees['MOTORBIKE_FEE']) {
                    monthlyRate = fees['MOTORBIKE_FEE']; vehicleName = 'Xe máy'; 
                } else if (card.vehicle_type === 'bicycle' && fees['BICYCLE_FEE']) {
                    monthlyRate = fees['BICYCLE_FEE']; vehicleName = 'Xe đạp'; 
                }

                if (monthlyRate > 0) {
                    const proratedFee = Math.round((monthlyRate / daysInPrevMonth) * daysToCharge);
                    totalAmount += proratedFee;
                    billItems.push({ 
                        name: `Phí gửi xe ${vehicleName} (Tỷ lệ T${prevMonth}: ${daysToCharge}/${daysInPrevMonth} ngày)`, 
                        price: proratedFee 
                    });
                }
            }

            // 4. Tạo hóa đơn tổng (Bills)
            const resBill = await client.query(
                `INSERT INTO bills (user_id, room_id, issue_date, due_date, total_amount, status)
                 VALUES ($1, $2, $3, $4, $5, 'unpaid') RETURNING bill_id`,
                [user_id, room_id, issueDate, dueDate, totalAmount]
            );
            const billId = resBill.rows[0].bill_id;

            // 5. Tạo các chi tiết hóa đơn (Bill_Items)
            for (const item of billItems) {
                await client.query(
                    `INSERT INTO bill_items (bill_id, item_name, unit_price, total_item_amount, quantity)
                     VALUES ($1, $2, $3, $4, 1)`,
                    [billId, item.name, item.price, item.price]
                );
            }
            
            // 6. Đánh dấu các phí một lần là "đã lập hóa đơn"
            if (requestIdsToUpdate.length > 0) {
                await client.query('UPDATE vehicle_card_requests SET billed_in_bill_id = $1 WHERE id = ANY($2::int[])', [billId, requestIdsToUpdate]);
            }

            // --- (THÊM MỚI 3) Gửi Email thông báo hóa đơn ---
            if (email && full_name) {
                const billDetails = {
                    billId: billId,
                    monthYear: `${month}/${year}`,
                    totalAmount: totalAmount,
                    dueDate: dueDate.toLocaleDateString('vi-VN') // Format: "10/11/2025"
                };
                try {
                    await sendNewBillEmail(email, full_name, billDetails);
                    console.log(`Sent new bill email to ${email} for bill ${billId}`);
                } catch (emailError) {
                    console.error(`Failed to send bill email to ${email} (Bill ${billId}):`, emailError.message);
                    // Không dừng vòng lặp, chỉ log lỗi
                }
            }
            // --- (KẾT THÚC THÊM MỚI 3) ---
            
            generatedCount++;
            console.log(`Generated bill ${billId} for room ${room_id}`);
        }

        await client.query('COMMIT');
        console.log('Monthly bills generation complete.');
        return { success: true, count: generatedCount }; // Trả về kết quả
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error generating monthly bills:', err);
        return { success: false, error: err.message }; // Trả về lỗi
    } finally {
        client.release();
    }
}

module.exports = {
    generateBillsForMonth,
};