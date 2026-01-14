// backend/test-gemini.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  console.log("--- BẮT ĐẦU KIỂM TRA KẾT NỐI GEMINI ---");
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ LỖI: Không tìm thấy GEMINI_API_KEY. Hãy kiểm tra file .env");
    return;
  }
  console.log(`✅ Đã tìm thấy API Key: ${apiKey.substring(0, 5)}...`);

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // Lấy danh sách các model khả dụng
    console.log("⏳ Đang kết nối tới Google để lấy danh sách model...");
    const modelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Khởi tạo tạm
    
    // Lưu ý: SDK hiện tại không có hàm listModels trực tiếp public dễ dùng ở level này,
    // nên ta sẽ test thử generate luôn để xem nó báo lỗi gì hoặc thành công.
    
    console.log("⏳ Đang thử gửi tin nhắn 'Hello' tới model 'gemini-1.5-flash'...");
    const result = await modelInstance.generateContent("Hello, are you working?");
    const response = await result.response;
    const text = response.text();
    
    console.log("🎉 THÀNH CÔNG! Gemini đã trả lời:");
    console.log("-----------------------------------");
    console.log(text);
    console.log("-----------------------------------");
    console.log("✅ Kết luận: Key và Model 'gemini-1.5-flash' hoạt động tốt.");

  } catch (error) {
    console.error("❌ KẾT NỐI THẤT BẠI. Chi tiết lỗi:");
    console.error(error.message);
    
    if (error.message.includes("404")) {
      console.log("\n💡 GỢI Ý SỬA LỖI:");
      console.log("Lỗi 404 thường do tên model chưa đúng với tài khoản Free Tier.");
      console.log("Hãy thử đổi tên model trong file index.js thành: 'gemini-pro' hoặc 'gemini-1.0-pro'");
    }
  }
}

testGemini();