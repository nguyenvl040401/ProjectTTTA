// ============================================================
// FILE: src/api/axios.js
// MỤC ĐÍCH: Cấu hình axios dùng chung cho toàn bộ project.
//           Mọi request gọi API đều đi qua file này.
//           Không hardcode URL hay token ở từng component riêng lẻ.
// ============================================================

import axios from "axios";

// Tạo instance axios với cấu hình mặc định
// baseURL lấy từ file .env (VITE_API_URL=http://127.0.0.1:8000/api)
// Nếu cần đổi URL backend chỉ cần sửa file .env, không cần tìm từng file
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json", // Gửi dữ liệu dạng JSON
    Accept: "application/json", // Yêu cầu backend trả về JSON
  },
});

// ── INTERCEPTOR REQUEST ──────────────────────────────────────
// Chạy trước MỌI request được gửi đi
// Tự động đọc token từ localStorage và gắn vào header Authorization
// Nhờ đó không cần truyền token thủ công ở từng chỗ gọi API
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Token được lưu khi đăng nhập
  if (token) {
    // Format: "Bearer 1|abc123..." theo chuẩn Laravel Sanctum
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── INTERCEPTOR RESPONSE ─────────────────────────────────────
// Chạy sau KHI nhận được response từ backend
// Nếu backend trả về lỗi 401 (Unauthenticated):
//   → Token hết hạn hoặc bị xóa phía backend
//   → Xóa dữ liệu đăng nhập cũ trong localStorage
//   → Chuyển về trang đăng nhập để người dùng login lại
api.interceptors.response.use(
  (response) => response, // Request thành công → trả về bình thường
  (error) => {
    if (error.response?.status === 401) {
      // Xóa token và thông tin user đã lưu
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Chuyển hướng về trang login
      // Dùng window.location thay vì navigate() vì đây là ngoài React component
      window.location.href = "/login";
    }
    // Ném lỗi ra để component bắt và xử lý tiếp (hiển thị thông báo, v.v.)
    return Promise.reject(error);
  },
);

export default api;
