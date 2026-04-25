// ============================================================
// FILE: src/App.jsx
// MỤC ĐÍCH: Định nghĩa toàn bộ routing của ứng dụng.
//   Mỗi khi thêm trang mới → import component và thêm <Route> vào đây.
//
// CẤU TRÚC ROUTE:
//   /login              → Trang đăng nhập (public, không cần token)
//   /dashboard          → Tổng quan KPI
//   /students           → Danh sách học viên
//   /students/new       → Thêm học viên mới
//   /students/:id       → Chi tiết học viên
//   /students/:id/edit  → Sửa học viên
//   /classes            → Danh sách lớp học
//   /classes/new        → Thêm lớp mới
//   /classes/:id/edit   → Sửa lớp học
//   /payments           → Nhập thanh toán
//   /attendance         → Điểm danh
//   /                   → Redirect về /dashboard
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudentListPage from "./pages/students/StudentListPage";
import StudentFormPage from "./pages/students/StudentFormPage";
import StudentDetailPage from "./pages/students/StudentDetailPage";
import ClassListPage from "./pages/classes/ClassListPage";
import ClassFormPage from "./pages/classes/ClassFormPage";
import ClassDetailPage from "./pages/classes/ClassDetailPage"; // thêm
import TeacherListPage from "./pages/teachers/TeacherListPage"; // thêm
import TeacherFormPage from "./pages/teachers/TeacherFormPage"; // thêm
import PaymentPage from "./pages/Payments/PaymentPage";
import AttendancePage from "./pages/attendance/AttendancePage";

// ── PRIVATE ROUTE ────────────────────────────────────────────
// Component bảo vệ — bọc quanh mọi trang cần đăng nhập.
// Kiểm tra token trong localStorage:
//   - Có token → render trang bình thường
//   - Không có token → redirect về /login
// Lưu ý: đây chỉ là bảo vệ phía client. Backend vẫn kiểm tra
//         token thật sự ở mọi API request qua axios interceptor.
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// Shorthand để viết PrivateRoute gọn hơn
// Thay vì: <PrivateRoute><DashboardPage /></PrivateRoute>
// Viết:    <P el={<DashboardPage />} />
const P = ({ el }) => <PrivateRoute>{el}</PrivateRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── PUBLIC ── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── DASHBOARD ── */}
        <Route path="/dashboard" element={<P el={<DashboardPage />} />} />

        {/* ── HỌC VIÊN ──
            Thứ tự route quan trọng: /students/new phải đứng TRƯỚC /students/:id
            Vì nếu :id đứng trước, "new" sẽ bị hiểu nhầm là một cái id */}
        <Route path="/students" element={<P el={<StudentListPage />} />} />
        <Route path="/students/new" element={<P el={<StudentFormPage />} />} />
        <Route
          path="/students/:id"
          element={<P el={<StudentDetailPage />} />}
        />
        <Route
          path="/students/:id/edit"
          element={<P el={<StudentFormPage />} />}
        />

        {/* ── LỚP HỌC ── */}
        <Route path="/classes" element={<P el={<ClassListPage />} />} />
        <Route path="/classes/new" element={<P el={<ClassFormPage />} />} />
        <Route path="/classes/:id" element={<P el={<ClassDetailPage />} />} />
        <Route
          path="/classes/:id/edit"
          element={<P el={<ClassFormPage />} />}
        />
        {/* Giáo viên — mới hoàn toàn */}
        <Route path="/teachers" element={<P el={<TeacherListPage />} />} />
        <Route path="/teachers/new" element={<P el={<TeacherFormPage />} />} />
        <Route
          path="/teachers/:id/edit"
          element={<P el={<TeacherFormPage />} />}
        />
        {/* ── THANH TOÁN ── */}
        <Route path="/payments" element={<P el={<PaymentPage />} />} />

        {/* ── ĐIỂM DANH ── */}
        <Route path="/attendance" element={<P el={<AttendancePage />} />} />

        {/* Mặc định: vào trang chủ → redirect về dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
