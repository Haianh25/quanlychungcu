const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const loginData = [
  { testcase: 'TC01_ValidLogin', email: 'test_admin@test.com', password: 'Password123!', role: 'admin', expected: 'success' },
  { testcase: 'TC02_InvalidPassword', email: 'test_admin@test.com', password: 'WrongPassword123!', role: 'admin', expected: 'fail' },
  { testcase: 'TC03_UserNotFound', email: 'nonexistent@test.com', password: 'Password123!', role: 'user', expected: 'fail' }
];

const registerData = [
  { testcase: 'TC04_ValidRegister', fullname: 'New User', email: 'new_user@test.com', password: 'Password123!', phone: '0987654321', expected: 'success' },
  { testcase: 'TC05_DuplicateEmail', fullname: 'Duplicate User', email: 'test_admin@test.com', password: 'Password123!', phone: '0987654322', expected: 'fail' }
];

const loginWorksheet = XLSX.utils.json_to_sheet(loginData);
const registerWorksheet = XLSX.utils.json_to_sheet(registerData);

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, loginWorksheet, 'Logins');
XLSX.utils.book_append_sheet(workbook, registerWorksheet, 'Registers');

const dir = path.join(__dirname, 'test-data');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

XLSX.writeFile(workbook, path.join(dir, 'users.xlsx'));
console.log('test-data/users.xlsx created with strong passwords');
