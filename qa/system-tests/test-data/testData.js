// testData.js - Dữ liệu chi tiết cho Data-Driven Testing (DDT) - Rút gọn xuống 150 cases

// Hàm helper để render dữ liệu nhất quán
const createCase = (id, desc, testData, expectedDesc, expectedStatus) => ({
    id,
    description: desc,
    testData,
    expectedDesc,
    expected: expectedStatus
});

// 1. AUTH LOGIN CASES (30 cases)
const authLoginCases = [];
authLoginCases.push(createCase('LOGIN_01', 'Đăng nhập với tài khoản hợp lệ', 'Email: test_admin@test.com, Pass: Password123!', 'Chuyển hướng đến trang chủ', 'success'));
for (let i = 2; i <= 30; i++) {
    const isMissingEmail = i % 4 === 0;
    const isWrongPass = i % 3 === 0;
    const email = isMissingEmail ? '' : (i % 5 === 0 ? `invalid_email_${i}` : `user${i}@test.com`);
    const pass = isWrongPass ? `wrong${i}` : (isMissingEmail ? 'pass123' : '');
    const expected = isMissingEmail ? 'Hệ thống báo lỗi thiếu email' : (isWrongPass ? 'Hệ thống báo sai mật khẩu' : 'Hệ thống báo lỗi định dạng email');
    
    authLoginCases.push(createCase(
        `LOGIN_${i < 10 ? '0' + i : i}`,
        `Đăng nhập thất bại (${isMissingEmail ? 'Thiếu email' : (isWrongPass ? 'Sai mật khẩu' : 'Sai định dạng')})`,
        `Email: '${email}', Pass: '${pass}'`,
        expected,
        'fail'
    ));
}

// 2. AUTH REGISTER CASES (25 cases)
const authRegisterCases = [];
authRegisterCases.push(createCase('REG_01', 'Đăng ký tài khoản hợp lệ mới', 'Email: new_user@test.com, Tên: John, Pass: Pass123!, SDT: 0912345678', 'Hiển thị thông báo đăng ký thành công', 'success'));
for (let i = 2; i <= 25; i++) {
    const isMissing = i % 3 === 0;
    const isDuplicate = i % 4 === 0;
    const email = isDuplicate ? 'test_admin@test.com' : `new${i}@test.com`;
    const name = isMissing ? '' : `User ${i}`;
    const expected = isMissing ? 'Hệ thống chặn submit do thiếu tên' : (isDuplicate ? 'Hệ thống báo lỗi email đã tồn tại' : 'Đăng ký thất bại do validation');
    
    authRegisterCases.push(createCase(
        `REG_${i < 10 ? '0' + i : i}`,
        `Đăng ký tài khoản thất bại (${isMissing ? 'Thiếu tên' : (isDuplicate ? 'Trùng email' : 'Test data')})`,
        `Email: '${email}', Tên: '${name}'`,
        expected,
        'fail'
    ));
}

// 3. PROFILE CASES (20 cases)
const profileCases = [];
profileCases.push(createCase('PROFILE_01', 'Cập nhật số điện thoại hợp lệ (10 số)', 'Phone: 0912345678', 'Hiển thị thông báo cập nhật thành công', 'success'));
for (let i = 2; i <= 20; i++) {
    const isValid = i % 2 === 0;
    const phone = isValid ? `091234567${i%10}` : `abc12345${i}`;
    profileCases.push(createCase(
        `PROFILE_${i < 10 ? '0' + i : i}`,
        `Cập nhật số điện thoại ${isValid ? 'hợp lệ' : 'không hợp lệ (chứa chữ)'}`,
        `Phone: '${phone}'`,
        isValid ? 'Cập nhật thành công' : 'Hệ thống báo lỗi định dạng số điện thoại',
        isValid ? 'success' : 'fail'
    ));
}

// 4. VEHICLE CASES (25 cases)
const vehicleCases = [];
vehicleCases.push(createCase('VEHICLE_01', 'Đăng ký xe hợp lệ', 'Loại: Ô tô, Biển: 29A-12345', 'Gửi yêu cầu đăng ký xe thành công', 'success'));
for (let i = 2; i <= 25; i++) {
    const isEmptyPlate = i % 3 === 0;
    const type = i % 2 === 0 ? 'motorcycle' : 'car';
    const plate = isEmptyPlate ? '' : `30A-${i}000`;
    vehicleCases.push(createCase(
        `VEHICLE_${i < 10 ? '0' + i : i}`,
        `Đăng ký xe ${isEmptyPlate ? 'thiếu biển số' : 'hợp lệ'}`,
        `Loại: '${type}', Biển: '${plate}'`,
        isEmptyPlate ? 'Hệ thống báo lỗi không được để trống' : 'Gửi yêu cầu thành công',
        isEmptyPlate ? 'fail' : 'success'
    ));
}

// 5. FEEDBACK CASES (20 cases)
const feedbackCases = [];
feedbackCases.push(createCase('FEEDBACK_01', 'Gửi góp ý hợp lệ', 'Tiêu đề: Valid, Nội dung: Valid', 'Hiển thị thông báo gửi thành công', 'success'));
for (let i = 2; i <= 20; i++) {
    const isEmptyTitle = i % 4 === 0;
    feedbackCases.push(createCase(
        `FEEDBACK_${i < 10 ? '0' + i : i}`,
        `Gửi góp ý ${isEmptyTitle ? 'thiếu tiêu đề' : 'hợp lệ'}`,
        `Tiêu đề: '${isEmptyTitle ? '' : 'Title ' + i}'`,
        isEmptyTitle ? 'Hệ thống yêu cầu nhập tiêu đề' : 'Gửi thành công',
        isEmptyTitle ? 'fail' : 'success'
    ));
}

// 6. BILLING CASES (15 cases)
const billingCases = [];
for (let i = 1; i <= 15; i++) {
    billingCases.push(createCase(
        `BILLING_${i < 10 ? '0' + i : i}`,
        i % 2 === 0 ? 'Xem danh sách hóa đơn' : 'Lọc hóa đơn chưa thanh toán',
        `Bộ lọc: ${i % 2 === 0 ? 'Tất cả' : 'Chưa thanh toán'}`,
        'Hiển thị danh sách hóa đơn chính xác',
        'success'
    ));
}

// 7. AMENITY CASES (15 cases)
const amenityCases = [];
for (let i = 1; i <= 15; i++) {
    amenityCases.push(createCase(
        `AMENITY_${i < 10 ? '0' + i : i}`,
        'Đặt lịch hẹn tiện ích',
        `Ngày: 2026-12-${(i % 28) + 1}`,
        'Hệ thống ghi nhận lịch hẹn thành công',
        'success'
    ));
}

module.exports = {
    authLoginCases,
    authRegisterCases,
    profileCases,
    vehicleCases,
    feedbackCases,
    billingCases,
    amenityCases
};
