// ============================================================
// FILE: src/components/Layout.jsx
// MỤC ĐÍCH: Khung layout chung cho tất cả trang sau khi đăng nhập.
//   Cấu trúc: [Sidebar bên trái] + [Header trên + Nội dung bên phải]
//   Mọi trang cần đăng nhập đều bọc trong <Layout> để tự có sidebar & header.
// PROPS:
//   - children : ReactNode — nội dung trang con (Dashboard, Học viên, v.v.)
//   - title    : string    — tiêu đề hiển thị trên Header (mặc định rỗng)
// CÁCH DÙNG:
//   <Layout title="Dashboard">
//     <div>Nội dung trang</div>
//   </Layout>
// ============================================================

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children, title = "" }) {
  // Trạng thái mở/đóng sidebar
  // false = đóng (mặc định trên mobile)
  // true  = mở (khi bấm hamburger trên mobile)
  // Trên desktop sidebar luôn hiện bất kể state này
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // Bố cục flex ngang: Sidebar trái | Nội dung phải
    // h-screen + overflow-hidden để toàn trang không bị scroll ngoài,
    // chỉ phần <main> bên trong mới scroll
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — nhận trạng thái và callback đóng */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Phần bên phải: Header + Nội dung trang
          min-w-0 để tránh overflow khi nội dung quá dài */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header — truyền callback mở sidebar và tiêu đề trang */}
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />

        {/* Nội dung trang — scroll độc lập, không ảnh hưởng sidebar/header */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
