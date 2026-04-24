// ============================================================
// FILE: src/components/Header.jsx
// MỤC ĐÍCH: Thanh tiêu đề phía trên của mỗi trang.
//   - Hiển thị nút hamburger ☰ (chỉ mobile) để mở Sidebar
//   - Hiển thị tiêu đề trang hiện tại
//   - Hiển thị avatar + tên người dùng đang đăng nhập
// PROPS:
//   - onMenuClick : function — gọi khi bấm nút hamburger
//   - title       : string  — tiêu đề trang hiện tại
// ============================================================

export default function Header({ onMenuClick, title }) {
  // Lấy thông tin user từ localStorage để hiển thị tên và avatar
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <header
      className="bg-white border-b border-gray-200 px-4 py-3
                       flex items-center justify-between sticky top-0 z-10"
    >
      <div className="flex items-center gap-3">
        {/* Nút hamburger ☰ — chỉ hiển thị trên mobile/tablet (dưới lg)
            Khi bấm sẽ gọi onMenuClick → Layout.jsx bật isOpen=true → Sidebar mở */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-800 text-xl p-1
                     rounded-md hover:bg-gray-100 transition"
          aria-label="Mở menu"
        >
          ☰
        </button>

        {/* Tiêu đề trang — được truyền từ mỗi trang qua component Layout */}
        <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Avatar và tên user góc phải
          Avatar: hình tròn màu xanh, hiển thị chữ cái đầu của tên
          Tên: ẩn trên màn hình rất nhỏ (dưới sm), hiện từ sm trở lên */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm
                        flex items-center justify-center font-semibold select-none"
        >
          {/* Lấy chữ cái đầu tiên của tên, fallback là 'A' nếu chưa có */}
          {user.name?.charAt(0).toUpperCase() || "A"}
        </div>
        <span className="hidden sm:block text-sm text-gray-700 font-medium">
          {user.name}
        </span>
      </div>
    </header>
  );
}
