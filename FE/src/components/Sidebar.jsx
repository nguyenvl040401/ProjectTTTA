// ============================================================
// FILE: src/components/Sidebar.jsx
// MỤC ĐÍCH: Thanh điều hướng bên trái.
//   - Desktop (lg+): Luôn hiển thị, cố định bên trái
//   - Mobile/Tablet: Ẩn mặc định, mở bằng nút hamburger ở Header
//     Khi mở sẽ có lớp overlay mờ che phần nội dung phía sau
// PROPS:
//   - isOpen   : boolean — trạng thái mở/đóng (dùng cho mobile)
//   - onClose  : function — gọi khi người dùng đóng sidebar
// ============================================================

import { NavLink, useNavigate } from "react-router-dom";
import api from "../api/axios";

// Danh sách menu điều hướng
// Để thêm trang mới: chỉ cần thêm object { path, icon, label } vào mảng này
const menuItems = [
  { path: "/dashboard", icon: "📊", label: "Dashboard" },
  { path: "/students", icon: "🎓", label: "Học viên" },
  { path: "/classes", icon: "📚", label: "Lớp học" },
  { path: "/teachers", icon: "👩‍🏫", label: "Giáo viên" },
  { path: "/payments", icon: "💰", label: "Thanh toán" },
  { path: "/attendance", icon: "📋", label: "Điểm danh" },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  // Lấy thông tin user từ localStorage để hiển thị ở cuối sidebar
  // Được lưu khi đăng nhập thành công trong LoginPage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ── XỬ LÝ ĐĂNG XUẤT ─────────────────────────────────────
  const handleLogout = async () => {
    try {
      // Gọi API để backend thu hồi token (xóa khỏi DB)
      await api.post("/logout");
    } catch {
      // Dù API lỗi (mất mạng, token đã hết hạn...) vẫn logout phía client
      // Không để người dùng bị kẹt ở màn hình không đăng xuất được
    } finally {
      // Xóa token và thông tin user khỏi localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Chuyển về trang đăng nhập
      navigate("/login");
    }
  };

  return (
    <>
      {/* ── OVERLAY ─────────────────────────────────────────
          Lớp nền mờ phía sau sidebar khi mở trên mobile.
          Chỉ hiển thị trên màn hình nhỏ (dưới lg = 1024px).
          Bấm vào overlay sẽ đóng sidebar. */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ── SIDEBAR PANEL ───────────────────────────────────
          - Mobile: dùng translate-x để ẩn/hiện (animation mượt)
            + isOpen=true  → translate-x-0    (hiện ra)
            + isOpen=false → -translate-x-full (ẩn sang trái)
          - Desktop (lg+): luôn hiện, dùng static position */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-30
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* ── LOGO / TÊN TRUNG TÂM ── */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-700">
          <div>
            <div className="text-lg font-bold leading-tight">🎓 Anh ngữ</div>
            <div className="text-xs text-gray-400 mt-0.5">Hệ thống quản lý</div>
          </div>
          {/* Nút ✕ đóng sidebar — chỉ hiện trên mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white text-xl leading-none"
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>

        {/* ── MENU ĐIỀU HƯỚNG ─────────────────────────────
            NavLink tự nhận biết trang đang active và thêm class tương ứng
            isActive=true → nền xanh (trang đang xem)
            isActive=false → màu xám, hover xanh nhạt */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose} // Chọn menu trên mobile → tự đóng sidebar
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition
                 ${
                   isActive
                     ? "bg-blue-600 text-white" // Trang đang active
                     : "text-gray-300 hover:bg-gray-800 hover:text-white" // Trang khác
                 }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* ── THÔNG TIN USER + NÚT ĐĂNG XUẤT ── */}
        <div className="px-4 py-4 border-t border-gray-700">
          {/* Email và tên user — lấy từ localStorage */}
          <div className="text-xs text-gray-400 mb-0.5 truncate">
            {user.email}
          </div>
          <div className="text-sm font-semibold text-white mb-3 truncate">
            {user.name}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-gray-300 hover:text-white hover:bg-gray-800
                       rounded-lg px-3 py-2 text-left transition"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
