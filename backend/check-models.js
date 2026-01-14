// backend/check-models.js
require('dotenv').config();

async function checkAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ LỖI: Chưa có GEMINI_API_KEY trong file .env");
    return;
  }

  console.log(`🔑 Đang kiểm tra Key: ${apiKey.substring(0, 8)}...`);
  
  // Gọi trực tiếp REST API để lấy danh sách model
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ GOOGLE BÁO LỖI:", data.error.message);
      console.log("👉 Gợi ý: Kiểm tra lại xem API Key có bị copy thừa dấu cách không, hoặc đã Enable Billing chưa (nếu hết free).");
      return;
    }

    console.log("\n✅ KẾT NỐI THÀNH CÔNG! Dưới đây là các Model bạn được phép dùng:");
    console.log("===============================================================");
    
    let found = false;
    if (data.models) {
      data.models.forEach(model => {
        // Chỉ liệt kê các model có khả năng chat/tạo nội dung (generateContent)
        if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
           // Google trả về dạng "models/gemini-pro", ta chỉ cần lấy phần sau dấu /
           const modelId = model.name.replace("models/", "");
           console.log(`🔹 Tên chuẩn: "${modelId}"`); 
           console.log(`   (Mô tả: ${model.displayName})`);
           found = true;
        }
      });
    }

    if (!found) {
      console.log("⚠️ Không tìm thấy model nào hỗ trợ chat. API Key này có thể bị hạn chế.");
    } else {
      console.log("\n👉 HÃY COPY MỘT TRONG CÁC 'TÊN CHUẨN' Ở TRÊN VÀO FILE index.js");
    }
    console.log("===============================================================");

  } catch (error) {
    console.error("❌ Lỗi kết nối mạng:", error.message);
  }
}

checkAvailableModels();