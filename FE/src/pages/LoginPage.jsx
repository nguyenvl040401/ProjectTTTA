// ============================================================
// FILE: src/pages/LoginPage.jsx
// MỤC ĐÍCH: Màn hình đăng nhập.
//   1. Người dùng nhập email + mật khẩu
//   2. Gọi POST /api/login
//   3. Nếu thành công → lưu token + user vào localStorage → chuyển về Dashboard
//   4. Nếu thất bại → hiển thị thông báo lỗi từ backend
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function LoginPage() {
  const navigate = useNavigate(); // Hook để chuyển trang sau khi đăng nhập

  // ── STATE ────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Thông báo lỗi hiển thị dưới form
  const [loading, setLoading] = useState(false); // Disable nút khi đang gọi API

  // ── XỬ LÝ SUBMIT FORM ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn trình duyệt reload trang khi submit form
    setError(""); // Xóa lỗi cũ trước khi gọi API mới
    setLoading(true);

    try {
      // Gọi API đăng nhập với email và password
      // Backend trả về: { message, token, user: { id, name, email, role } }
      const res = await api.post("/login", { email, password });

      // Lưu token vào localStorage để axios interceptor tự gắn vào mọi request sau
      localStorage.setItem("token", res.data.token);

      // Lưu thông tin user để hiển thị tên, avatar, phân quyền trên giao diện
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Đăng nhập thành công → chuyển về Dashboard
      navigate("/dashboard");
    } catch (err) {
      // Lấy thông báo lỗi từ backend để hiển thị đúng ngữ cảnh:
      // - 401: "Email hoặc mật khẩu không đúng!"
      // - 403: "Tài khoản đã bị khóa, liên hệ admin!"
      // - 422: Lỗi validation (thiếu field)
      const msg = err.response?.data?.message || "Đăng nhập thất bại, thử lại!";
      setError(msg);
    } finally {
      // Dù thành công hay thất bại đều bật lại nút
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* ── TIÊU ĐỀ ── */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-2xl font-bold text-gray-800">
            Trung tâm Anh ngữ
          </h1>
          <p className="text-gray-500 text-sm mt-1">Hệ thống quản lý nội bộ</p>
        </div>

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@englishcenter.com"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent transition"
            />
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent transition"
            />
          </div>

          {/* Thông báo lỗi từ backend — chỉ hiện khi có lỗi */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Nút đăng nhập — disabled khi đang gọi API để tránh gửi nhiều lần */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                       text-white font-semibold rounded-lg py-2.5 text-sm
                       transition cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
