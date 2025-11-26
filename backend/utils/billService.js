const db = require('../db');
const { sendNewBillEmail } = require('./mailer');

/**
 * Hàm tạo hóa đơn tự động cho tất cả các phòng có người ở (resident)
 * Chạy vào ngày 1 hàng tháng
 */
async function generateBillsForMonth(month, year) {
    console.log('Running job: generateBillsForMonth...');
    const pool = db.getPool ? db.getPool() : db;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const issueDate = new Date(Date.UTC(year, month - 1, 1)); 
        const dueDate = new Date(Date.UTC(year, month - 1, 10));
        
        const prevMonth = (month === 1) ? 12 : month - 1;
        const prevYear = (month === 1) ? year - 1 : year;
        
        const daysInPrevMonth = new Date(year, month - 1, 0).getUTCDate();
        const prevMonthStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
        const currentMonthStartDate = `${year}-${String(month).padStart(2, '0')}-01`;

        // Lấy thông tin phòng và user
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
            return { success: true, count: 0 }; 
        }

        // Lấy bảng giá phí
        const resFees = await client.query('SELECT fee_code, price FROM fees');
        const fees = {};
        resFees.rows.forEach(fee => {
            fees[fee.fee_code] = parseFloat(fee.price);
        });

        let generatedCount = 0;

        for (const room of resRooms.rows) {
            const { room_id, user_id, email, full_name } = room;

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

            // --- 3a. Phí cố định ---
            if (fees['MANAGEMENT_FEE']) {
                billItems.push({
                    name: `Apartment Management Fee (${month}/${year})`,
                    price: fees['MANAGEMENT_FEE'],
                });
                totalAmount += fees['MANAGEMENT_FEE'];
            }
            if (fees['ADMIN_FEE']) {
                billItems.push({
                    name: `Admin Fee (${month}/${year})`,
                    price: fees['ADMIN_FEE'],
                });
                totalAmount += fees['ADMIN_FEE'];
            }

            // --- 3b. Phí gửi xe hàng tháng ---
            const vehicleRes = await client.query(
                "SELECT vehicle_type, COUNT(*) as count FROM vehicle_cards WHERE resident_id = $1 AND status = 'active' GROUP BY vehicle_type", 
                [user_id]
            );
            for (const vehicle of vehicleRes.rows) {
                let fee = 0; let desc = ''; const count = parseInt(vehicle.count, 10);
                
                if (vehicle.vehicle_type === 'car' && fees['CAR_FEE']) { 
                    fee = fees['CAR_FEE'] * count; 
                    desc = `Car Parking Fee (x${count})`; 
                } else if (vehicle.vehicle_type === 'motorbike' && fees['MOTORBIKE_FEE']) {
                    fee = fees['MOTORBIKE_FEE'] * count; 
                    desc = `Motorbike Parking Fee (x${count})`; 
                } else if (vehicle.vehicle_type === 'bicycle' && fees['BICYCLE_FEE']) {
                    fee = fees['BICYCLE_FEE'] * count; 
                    desc = `Bicycle Parking Fee (x${count})`; 
                }
                
                if (fee > 0) { 
                    totalAmount += fee; 
                    billItems.push({ name: desc, price: fee }); 
                }
            }

            // --- 3c. Phí một lần (Đăng ký/Cấp lại) ---
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
                    const typeName = fee.vehicle_type.charAt(0).toUpperCase() + fee.vehicle_type.slice(1);
                    const desc = fee.request_type === 'register' ? `Card Registration Fee (${typeName})` : `Card Reissue Fee (${typeName})`;
                    billItems.push({ name: desc, price: amount });
                    requestIdsToUpdate.push(fee.id);
                }
            }
            
            // --- 3d. Phí tính theo tỷ lệ (Prorated) ---
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
                
                if (card.vehicle_type === 'car' && fees['CAR_FEE']) { 
                    monthlyRate = fees['CAR_FEE']; vehicleName = 'Car'; 
                } else if (card.vehicle_type === 'motorbike' && fees['MOTORBIKE_FEE']) {
                    monthlyRate = fees['MOTORBIKE_FEE']; vehicleName = 'Motorbike'; 
                } else if (card.vehicle_type === 'bicycle' && fees['BICYCLE_FEE']) {
                    monthlyRate = fees['BICYCLE_FEE']; vehicleName = 'Bicycle'; 
                }

                if (monthlyRate > 0) {
                    const proratedFee = Math.round((monthlyRate / daysInPrevMonth) * daysToCharge);
                    totalAmount += proratedFee;
                    billItems.push({ 
                        name: `${vehicleName} Parking (Prorated ${prevMonth}/${prevYear}: ${daysToCharge}/${daysInPrevMonth} days)`, 
                        price: proratedFee 
                    });
                }
            }

            // --- 3e. Phí đặt phòng (Amenities) ---
            const bookingRes = await client.query(
                `SELECT b.id, r.name as room_name, b.booking_date, b.start_time, b.end_time, b.total_price
                 FROM room_bookings b
                 JOIN community_rooms r ON b.room_id = r.id
                 WHERE b.resident_id = $1 
                 AND b.status = 'confirmed' 
                 AND b.booking_date >= $2 AND b.booking_date < $3`,
                [user_id, prevMonthStartDate, currentMonthStartDate]
            );

            for (const booking of bookingRes.rows) {
                const amount = parseFloat(booking.total_price);
                if (amount > 0) {
                    totalAmount += amount;
                    const dateStr = new Date(booking.booking_date).toLocaleDateString('en-GB');
                    const timeStr = `${booking.start_time.slice(0,5)} - ${booking.end_time.slice(0,5)}`;
                    billItems.push({
                        name: `Booking: ${booking.room_name} (${dateStr} ${timeStr})`,
                        price: amount
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
            
            // 6. Cập nhật trạng thái request thẻ
            if (requestIdsToUpdate.length > 0) {
                await client.query('UPDATE vehicle_card_requests SET billed_in_bill_id = $1 WHERE id = ANY($2::int[])', [billId, requestIdsToUpdate]);
            }

            // --- [MỚI] GỬI THÔNG BÁO CHO RESIDENT ---
            const notiMessage = `New Bill Alert: Your service bill for ${month}/${year} (Invoice #${billId}) has been issued. Total: ${totalAmount.toLocaleString('vi-VN')} VND.`;
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [user_id, notiMessage, '/bill']
            );
            // -----------------------------------------

            // Gửi Email thông báo
            if (email && full_name) {
                const billDetails = {
                    billId: billId,
                    monthYear: `${month}/${year}`,
                    totalAmount: totalAmount,
                    dueDate: dueDate.toLocaleDateString('vi-VN')
                };
                try {
                    await sendNewBillEmail(email, full_name, billDetails);
                    console.log(`Sent new bill email to ${email} for bill ${billId}`);
                } catch (emailError) {
                    console.error(`Failed to send bill email to ${email} (Bill ${billId}):`, emailError.message);
                }
            }
            
            generatedCount++;
            console.log(`Generated bill ${billId} for room ${room_id}`);
        }

        await client.query('COMMIT');
        console.log('Monthly bills generation complete.');
        return { success: true, count: generatedCount }; 
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error generating monthly bills:', err);
        return { success: false, error: err.message };
    } finally {
        client.release();
    }
}

/**
 * [MỚI - UPDATED] Hàm tạo hóa đơn chuyển đến (Move-in Bill)
 * Đã thêm logic kiểm tra: Nếu tháng này đã có bill rồi thì KHÔNG tạo thêm bill mới.
 */
async function generateMoveInBill(userId, roomId, client) {
    console.log(`[MoveInBill] Checking bills for user ${userId} room ${roomId}...`);
    
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // [CHECK KIM CƯƠNG] Kiểm tra xem tháng này user đã có hóa đơn nào chưa (bất kể trạng thái)
    const existingBillCheck = await client.query(
        `SELECT 1 FROM bills 
         WHERE user_id = $1 AND EXTRACT(MONTH FROM issue_date) = $2 AND EXTRACT(YEAR FROM issue_date) = $3`,
        [userId, currentMonth, currentYear]
    );

    if (existingBillCheck.rows.length > 0) {
        console.log(`[MoveInBill] Existing bill found for ${currentMonth}/${currentYear}. SKIPPING new bill generation.`);
        return; // Dừng hàm, không tạo hóa đơn mới
    }

    console.log(`[MoveInBill] No bill found. Generating prorated move-in bill...`);
    
    // Lấy ngày cuối cùng của tháng hiện tại
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Số ngày phải trả tiền (từ hôm nay đến hết tháng)
    const daysToCharge = (lastDayOfMonth - currentDay) + 1;

    // Nếu còn ít hơn 3 ngày thì thôi, để tháng sau tính luôn (tùy chính sách)
    if (daysToCharge <= 0) return; 

    // Lấy bảng giá
    const resFees = await client.query("SELECT fee_code, price FROM fees WHERE fee_code IN ('MANAGEMENT_FEE', 'ADMIN_FEE')");
    const fees = {};
    resFees.rows.forEach(fee => fees[fee.fee_code] = parseFloat(fee.price));

    let totalAmount = 0;
    const billItems = [];

    // Tính phí quản lý theo tỷ lệ
    if (fees['MANAGEMENT_FEE']) {
        const dailyRate = fees['MANAGEMENT_FEE'] / lastDayOfMonth;
        const proratedAmount = Math.round(dailyRate * daysToCharge);
        totalAmount += proratedAmount;
        billItems.push({
            name: `Management Fee (Move-in Prorated: ${daysToCharge}/${lastDayOfMonth} days)`,
            price: proratedAmount
        });
    }

    // Tính phí Admin theo tỷ lệ
    if (fees['ADMIN_FEE']) {
        const dailyRate = fees['ADMIN_FEE'] / lastDayOfMonth;
        const proratedAmount = Math.round(dailyRate * daysToCharge);
        totalAmount += proratedAmount;
        billItems.push({
            name: `Admin Fee (Move-in Prorated: ${daysToCharge}/${lastDayOfMonth} days)`,
            price: proratedAmount
        });
    }

    if (totalAmount > 0) {
        // Hạn thanh toán: 5 ngày sau khi chuyển đến
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 5); 

        const resBill = await client.query(
            `INSERT INTO bills (user_id, room_id, issue_date, due_date, total_amount, status)
             VALUES ($1, $2, NOW(), $3, $4, 'unpaid') RETURNING bill_id`,
            [userId, roomId, dueDate, totalAmount]
        );
        const billId = resBill.rows[0].bill_id;

        for (const item of billItems) {
            await client.query(
                `INSERT INTO bill_items (bill_id, item_name, unit_price, total_item_amount, quantity)
                 VALUES ($1, $2, $3, $4, 1)`,
                [billId, item.name, item.price, item.price]
            );
        }

        // --- [MỚI] GỬI THÔNG BÁO CHO RESIDENT ---
        const notiMessage = `New Bill Alert: Move-in bill generated (Invoice #${billId}). Total: ${totalAmount.toLocaleString('vi-VN')} VND.`;
        await client.query(
            "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
            [userId, notiMessage, '/bill']
        );
        // -----------------------------------------

        console.log(`[MoveInBill] Generated bill #${billId} amount ${totalAmount}`);
    }
}

module.exports = {
    generateBillsForMonth,
    generateMoveInBill 
};