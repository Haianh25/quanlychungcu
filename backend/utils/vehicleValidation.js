// File: backend/utils/vehicleValidation.js

/**
 * Hàm kiểm tra hạn ngạch xe (Phiên bản Robust - Chống lỗi)
 */
function validateVehicleQuota(currentActiveCount, currentPendingCount, maxAllowed, vehicleType) {
    // 1. Ép kiểu dữ liệu (Data Sanitization) - Quan trọng!
    // Nếu là null/undefined/string rác -> Về 0
    const active = parseInt(currentActiveCount) || 0;
    const pending = parseInt(currentPendingCount) || 0;
    
    // Nếu maxAllowed không hợp lệ -> Mặc định là 0 (Chặn luôn cho an toàn)
    const max = (maxAllowed === null || maxAllowed === undefined) ? 0 : parseInt(maxAllowed);

    // 2. Tính tổng
    const totalVehicles = active + pending;

    // [DEBUG] Log ra nếu cần thiết khi dev
    // console.log(`Validating: Active=${active}, Pending=${pending}, Max=${max}, Total=${totalVehicles}`);

    // 3. Logic kiểm tra
    // Nếu Max là 0 thì chặn luôn (trừ khi total cũng <= 0 nhưng logic đăng ký thì total sẽ tăng)
    if (totalVehicles >= max) {
        return {
            isValid: false,
            message: `Limit reached for Room Type: Max ${max} ${vehicleType}(s) allowed.`
        };
    }

    return { isValid: true, message: null };
}

module.exports = { validateVehicleQuota };