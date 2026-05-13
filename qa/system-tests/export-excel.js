// Script được tiêm (inject) vào system-test-report.html bởi jest-html-reporter
window.addEventListener('DOMContentLoaded', () => {
    // Tải thư viện SheetJS từ CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
    document.head.appendChild(script);

    // 1. Tạo nút Export Excel
    const exportBtn = document.createElement('button');
    exportBtn.innerText = 'Tải xuống Excel (.xlsx)';
    exportBtn.style.padding = '10px 15px';
    exportBtn.style.backgroundColor = '#217346'; // Màu xanh Excel
    exportBtn.style.color = '#fff';
    exportBtn.style.border = 'none';
    exportBtn.style.borderRadius = '5px';
    exportBtn.style.cursor = 'pointer';
    exportBtn.style.fontWeight = 'bold';
    exportBtn.style.marginLeft = '15px';
    
    // Gắn vào thanh Header
    const header = document.querySelector('header');
    if (header) {
        header.appendChild(exportBtn);
    }

    // 2. Xử lý sự kiện khi bấm nút
    exportBtn.addEventListener('click', () => {
        if (typeof XLSX === 'undefined') {
            alert('Thư viện Excel đang tải, vui lòng thử lại sau 1-2 giây!');
            return;
        }

        const tests = document.querySelectorAll('.test-result');
        if (!tests || tests.length === 0) {
            alert('Không tìm thấy dữ liệu test nào!');
            return;
        }

        // Nhóm các test theo Suite (Feature)
        const groupedData = {};
        
        tests.forEach((test, index) => {
            let suiteName = test.querySelector('.test-suitename')?.innerText || 'General';
            // Rút gọn tên sheet (Excel giới hạn 31 ký tự)
            let sheetName = suiteName.replace(' System Tests', '').substring(0, 31);
            
            if (!groupedData[sheetName]) {
                groupedData[sheetName] = [];
            }

            const rawTitle = test.querySelector('.test-title')?.innerText || '';
            const testStatus = test.querySelector('.test-status')?.innerText || '';
            
            // Format chuỗi là: $id | $description | $testData | $expectedDesc
            let id = `TC_${index + 1}`;
            let description = rawTitle;
            let testDataStr = '';
            let expected = testStatus.toLowerCase() === 'passed' ? 'Thành công' : 'Theo kịch bản lỗi';
            
            if (rawTitle.includes(' | ')) {
                const parts = rawTitle.split(' | ');
                if (parts.length >= 4) {
                    id = parts[0].trim();
                    description = parts[1].trim();
                    testDataStr = parts[2].trim();
                    expected = parts.slice(3).join(' | ').trim(); // In case expected contains |
                } else {
                    id = parts[0].trim();
                    description = parts.slice(1).join(' | ').trim();
                }
            }

            // Xử lý Note (chỉ lấy nếu fail)
            let note = '';
            if (testStatus.toLowerCase() === 'failed') {
                const failureMsgEl = test.querySelector('.failureMsg');
                if (failureMsgEl) {
                    // Lấy dòng báo lỗi đầu tiên để tránh chuỗi quá dài
                    const fullMsg = failureMsgEl.innerText || '';
                    note = fullMsg.split('\n')[0].substring(0, 200); // Lấy tối đa 200 ký tự đầu tiên của dòng 1
                } else {
                    note = 'Failed but no error message recorded';
                }
            }

            groupedData[sheetName].push({
                id: id,
                feature: sheetName,
                description: description,
                testData: testDataStr,
                expected: expected,
                tester: 'Auto (Jest)',
                date: new Date().toLocaleDateString('vi-VN'),
                result: testStatus.toUpperCase(),
                note: note
            });
        });

        // Tạo Workbook mới
        const wb = XLSX.utils.book_new();

        // Lặp qua từng nhóm để tạo Sheet
        for (const [sheetName, items] of Object.entries(groupedData)) {
            // Tính toán summary
            const passCount = items.filter(i => i.result === 'PASSED').length;
            const failCount = items.filter(i => i.result === 'FAILED').length;
            const totalCount = items.length;

            // Xây dựng mảng dữ liệu 2D cho SheetJS
            const wsData = [];
            
            // Thêm bảng Summary (Cách 1 dòng trống trên cùng nếu muốn)
            wsData.push(['Pass', 'Fail', 'Untested', 'N/A', 'Number of test cases']);
            wsData.push([passCount, failCount, 0, 0, totalCount]);
            wsData.push([]); // Dòng trống ngăn cách
            wsData.push([]); // Dòng trống

            // Thêm Header cho bảng Details
            wsData.push(['ID', 'Feature', 'Test Case Description', 'Test Data', 'Expected Result', 'Tester', 'Date', 'Result', 'Note']);

            // Thêm từng dòng chi tiết
            items.forEach(item => {
                wsData.push([
                    item.id,
                    item.feature,
                    item.description,
                    item.testData,
                    item.expected,
                    item.tester,
                    item.date,
                    item.result,
                    item.note
                ]);
            });

            // Chuyển đổi mảng 2D thành Worksheet
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Tùy chỉnh độ rộng cột cho đẹp
            ws['!cols'] = [
                { wch: 15 }, // ID
                { wch: 15 }, // Feature
                { wch: 40 }, // Description
                { wch: 35 }, // Test Data
                { wch: 35 }, // Expected
                { wch: 15 }, // Tester
                { wch: 12 }, // Date
                { wch: 10 }, // Result
                { wch: 40 }  // Note
            ];

            // Gắn worksheet vào workbook
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }

        // Tải xuống file Excel
        XLSX.writeFile(wb, 'System_Test_Report_MultiSheet.xlsx');
    });
});
