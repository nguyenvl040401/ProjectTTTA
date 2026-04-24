// ============================================================
// FILE: src/pages/DashboardPage.jsx
// MỤC ĐÍCH: Trang tổng quan — hiển thị các chỉ số KPI quan trọng.
//   Gọi GET /api/dashboard khi trang load.
//   Hiển thị: 6 thẻ KPI, biểu đồ lấp đầy từng lớp, cảnh báo nợ & vắng.
// ============================================================

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

// ── COMPONENT: 1 THẺ KPI ────────────────────────────────────
// Hiển thị 1 chỉ số dạng card: icon + label + số liệu chính + mô tả phụ
// PROPS:
//   - icon  : string — emoji icon
//   - label : string — tên chỉ số
//   - value : string/number — giá trị chính (số lớn)
//   - sub   : string — mô tả phụ nhỏ bên dưới
//   - color : string — class Tailwind cho nền icon (vd: 'bg-blue-50')
function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-start gap-4">
      {/* Icon với nền màu nhẹ */}
      <div className={`text-3xl p-2 rounded-lg ${color}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </div>
        <div className="text-2xl font-bold text-gray-800 mt-0.5">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// Format số tiền: >= 1 triệu → hiển thị "X.X tr", nhỏ hơn → hiển thị đầy đủ + "đ"
// Ví dụ: 2800000 → "2.8 tr" | 500000 → "500.000đ"
function formatVND(amount) {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + " tr";
  return Number(amount || 0).toLocaleString("vi-VN") + "đ";
}

export default function DashboardPage() {
  const [data, setData] = useState(null); // Dữ liệu từ API /dashboard
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Gọi API khi component mount (trang vừa mở)
  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch(() => setError("Không tải được dữ liệu, thử lại!"))
      .finally(() => setLoading(false));
  }, []); // [] = chỉ chạy 1 lần khi component mount

  return (
    <Layout title="Dashboard">
      {/* Trạng thái đang tải */}
      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-400">
          Đang tải dữ liệu...
        </div>
      )}

      {/* Trạng thái lỗi */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Nội dung chính — chỉ hiện khi có data */}
      {data && (
        <div className="space-y-6">
          {/* ── 6 THẺ KPI ───────────────────────────────────
              Responsive: 1 cột → 2 cột (sm) → 3 cột (xl)
              Mỗi thẻ map với 1 nhóm data từ /api/dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <KpiCard
              icon="🎓"
              label="Tổng học viên"
              color="bg-blue-50"
              value={data.students.total}
              sub={`Đang học: ${data.students.active} · Nghỉ: ${data.students.inactive}`}
            />
            <KpiCard
              icon="🆕"
              label="Mới tháng này"
              color="bg-green-50"
              value={data.students.new_this_month}
              sub="học viên đăng ký mới"
            />
            <KpiCard
              icon="💰"
              label="Doanh thu tháng"
              color="bg-yellow-50"
              value={formatVND(data.finance.revenue_this_month)}
              sub={`Tháng trước: ${formatVND(data.finance.revenue_last_month)}`}
            />
            <KpiCard
              icon="⚠️"
              label="Tổng công nợ"
              color="bg-red-50"
              value={formatVND(data.finance.total_debt)}
              sub="cần thu"
            />
            <KpiCard
              icon="📋"
              label="Tỷ lệ đi học"
              color="bg-purple-50"
              value={`${data.attendance.rate_this_week}%`}
              sub={`Tháng này: ${data.attendance.rate_this_month}%`}
            />
            <KpiCard
              icon="📚"
              label="Lớp đang hoạt động"
              color="bg-indigo-50"
              value={data.classes.total_active}
              sub={`Lớp đầy: ${data.classes.full_classes}`}
            />
          </div>

          {/* ── TỶ LỆ LẤP ĐẦY TỪNG LỚP ─────────────────────
              Progress bar màu thay đổi theo % lấp đầy:
              - Xanh dương : < 80% (còn chỗ)
              - Vàng       : 80–99% (sắp đầy)
              - Đỏ         : 100% (đã đầy) */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              📊 Lấp đầy từng lớp
            </h2>
            <div className="space-y-3">
              {data.classes.fill_rates.map((cls) => (
                <div key={cls.id}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span className="font-medium truncate">{cls.name}</span>
                    <span className="shrink-0 ml-2 text-gray-400 text-xs">
                      {cls.current_students}/{cls.max_students} HV
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        cls.fill_rate >= 100
                          ? "bg-red-500"
                          : cls.fill_rate >= 80
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(cls.fill_rate, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── BẢNG CẢNH BÁO ───────────────────────────────
              2 cột: Nợ quá hạn (trái) + Vắng nhiều buổi (phải)
              Responsive: 1 cột trên mobile, 2 cột từ md trở lên */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cảnh báo nợ quá hạn */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-red-600 mb-3">
                ⚠️ Nợ quá hạn ({data.alerts.debt_overdue.length})
              </h2>
              {data.alerts.debt_overdue.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Không có học viên nào nợ quá hạn 🎉
                </p>
              ) : (
                data.alerts.debt_overdue.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {s.full_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {s.parent_phone}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-red-500 shrink-0 ml-2">
                      {formatVND(s.debt)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cảnh báo vắng nhiều buổi liên tiếp */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-orange-500 mb-3">
                📵 Vắng nhiều buổi ({data.alerts.absent_streak.length})
              </h2>
              {data.alerts.absent_streak.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Tất cả học viên đi học đều đặn 👍
                </p>
              ) : (
                data.alerts.absent_streak.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {s.full_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {s.student_code}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 ml-2">
                      {s.parent_phone}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
