// ============================================================
// FILE: src/pages/students/StudentDetailPage.jsx
// MỤC ĐÍCH: Trang xem chi tiết 1 học viên.
//   Hiển thị: hồ sơ cá nhân, công nợ nổi bật, lớp đang học,
//             lịch sử thanh toán.
//   Gọi song song 2 API để tải nhanh hơn:
//     - GET /api/students/:id      → hồ sơ + danh sách lớp
//     - GET /api/students/:id/debt → công nợ + lịch sử thanh toán
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import Badge from "../../components/ui/Badge";
import api from "../../api/axios";

// Format số tiền sang VNĐ đầy đủ — dùng ở trang này
// Ví dụ: 2800000 → "2.800.000đ"
function formatVND(amount) {
  return Number(amount || 0).toLocaleString("vi-VN") + "đ";
}

// Format ngày từ ISO string sang dd/mm/yyyy
// Trả về '—' nếu không có giá trị
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("vi-VN") : "—";
}

// ── COMPONENT: 1 DÒNG THÔNG TIN ─────────────────────────────
// Hiển thị cặp label — value theo chiều ngang (desktop) hoặc dọc (mobile)
// PHẢI khai báo ngoài component cha để tránh re-create mỗi render
function InfoRow({ label, value }) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center py-2.5
                    border-b border-gray-100 last:border-0"
    >
      {/* Label — cố định 160px trên desktop */}
      <span
        className="text-xs text-gray-400 uppercase tracking-wide
                       sm:w-40 shrink-0 mb-0.5 sm:mb-0"
      >
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams(); // Lấy :id từ URL
  const navigate = useNavigate();

  const [student, setStudent] = useState(null); // Hồ sơ học viên
  const [debt, setDebt] = useState(null); // Công nợ + lịch sử thanh toán
  const [loading, setLoading] = useState(true);
  // State xếp lớp
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [availClasses, setAvailClasses] = useState([]);
  const [enrollClassId, setEnrollClassId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  // State điểm danh gần đây
  const [attendance, setAttendance] = useState([]);

  // Gọi 2 API song song bằng Promise.all để tải nhanh hơn gọi tuần tự
  useEffect(() => {
    Promise.all([
      api.get(`/students/${id}`),
      api.get(`/students/${id}/debt`),
      api.get("/classes", { params: { per_page: 100 } }), // Load lớp cho dropdown xếp lớp
      api.get("/attendance", { params: { student_id: id, per_page: 20 } }), // Điểm danh gần đây
    ])
      .then(([sRes, dRes, cRes, aRes]) => {
        setStudent(sRes.data.student || sRes.data);
        setDebt(dRes.data);
        setAvailClasses(cRes.data.data || cRes.data || []);
        setAttendance(aRes.data.data || aRes.data || []);
      })
      .catch(() => navigate("/students"))
      .finally(() => setLoading(false));
  }, [id, navigate]);
  // Xếp lớp cho học viên này
  const handleEnroll = async () => {
    if (!enrollClassId) return;
    setEnrolling(true);
    setEnrollError("");
    try {
      await api.post("/enrollments", {
        student_id: id,
        class_id: enrollClassId,
        enrolled_date: new Date().toISOString().slice(0, 10),
        status: "studying",
      });

      // BE đã trả enrollment full object nên không cần reload cả trang
      // Gọi lại 2 API để cập nhật danh sách lớp + công nợ mới nhất
      const [sRes, dRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get(`/students/${id}/debt`),
      ]);
      setStudent(sRes.data.student || sRes.data);
      setDebt(dRes.data);

      // Reset form về trạng thái ban đầu
      setShowEnrollForm(false);
      setEnrollClassId("");
    } catch (err) {
      // Hiện lỗi từ BE — VD: "lớp đầy", "học viên inactive", "đã trong lớp"
      setEnrollError(
        err.response?.data?.message || "Không thể xếp lớp, thử lại!",
      );
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Chi tiết học viên">
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Đang tải...
        </div>
      </Layout>
    );
  }

  if (!student) return null;

  return (
    <Layout title="Chi tiết học viên">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* ── HEADER: TÊN + NÚT HÀNH ĐỘNG ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Nút back về danh sách */}
            <button
              onClick={() => navigate("/students")}
              className="text-gray-400 hover:text-gray-600 transition text-lg"
              aria-label="Quay lại"
            >
              ←
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {student.full_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-gray-400">
                  {student.student_code}
                </span>
                <Badge status={student.status} />
              </div>
            </div>
          </div>
          {/* Nút chỉnh sửa → chuyển sang form sửa */}
          <button
            onClick={() => navigate(`/students/${id}/edit`)}
            className="shrink-0 border border-gray-300 text-gray-600 hover:bg-gray-50
                       text-sm px-4 py-2 rounded-lg transition"
          >
            ✏️ Chỉnh sửa
          </button>
        </div>

        {/* ── CÔNG NỢ NỔI BẬT ─────────────────────────────
            Nền đỏ nếu còn nợ, nền xanh nếu đã đóng đủ
            Có nút "Thu tiền" để chuyển nhanh sang trang thanh toán */}
        {debt && (
          <div
            className={`rounded-xl p-4 flex items-center justify-between
            ${
              debt.total_debt > 0
                ? "bg-red-50 border border-red-200"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-0.5">
                Công nợ hiện tại
              </div>
              <div
                className={`text-2xl font-bold
                ${debt.total_debt > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {formatVND(debt.total_debt)}
              </div>
            </div>
            {/* Chỉ hiện nút Thu tiền khi còn nợ */}
            {debt.total_debt > 0 && (
              <button
                onClick={() => navigate(`/payments?student_id=${id}`)}
                className="bg-red-600 hover:bg-red-700 text-white text-sm
                           font-medium px-4 py-2 rounded-lg transition"
              >
                💰 Thu tiền
              </button>
            )}
          </div>
        )}

        {/* ── HỒ SƠ CÁ NHÂN ── */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            👤 Hồ sơ học viên
          </h3>
          <InfoRow label="Họ và tên" value={student.full_name} />
          <InfoRow label="Ngày sinh" value={formatDate(student.dob)} />
          <InfoRow label="Trình độ đầu vào" value={student.entry_level} />
          <InfoRow
            label="Ngày đăng ký"
            value={formatDate(student.enrollment_date)}
          />
          <InfoRow
            label="Ngày bắt đầu học"
            value={formatDate(student.start_date)}
          />
          <InfoRow label="Tên phụ huynh" value={student.parent_name} />
          <InfoRow label="SĐT phụ huynh" value={student.parent_phone} />
          <InfoRow label="Email" value={student.email} />
          {student.notes && <InfoRow label="Ghi chú" value={student.notes} />}
        </div>

        {/* ── LỚP ĐANG HỌC ─────────────────────────────────
            Lấy từ student.enrollments — mảng các lớp học viên đã/đang tham gia */}
        {student.enrollments?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📚 Lớp đang học
            </h3>
            <div className="space-y-2">
              {student.enrollments.map((en) => (
                <div
                  key={en.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {en.class?.name || "—"}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Từ {formatDate(en.enrolled_date)}
                      {/* Hiện % giảm giá nếu có */}
                      {en.discount > 0 && ` · Giảm ${en.discount}%`}
                    </div>
                  </div>
                  <Badge status={en.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LỊCH SỬ THANH TOÁN ───────────────────────────
            Lấy từ debt.payments — mảng các lần đóng tiền */}
        {debt?.payments?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              💰 Lịch sử thanh toán
            </h3>
            <div className="divide-y divide-gray-100">
              {debt.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center py-2.5"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {formatVND(p.amount)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(p.payment_date)}
                      {/* Hiện hình thức thanh toán */}
                      {" · "}
                      {p.payment_method === "cash"
                        ? "Tiền mặt"
                        : "Chuyển khoản"}
                      {/* Hiện kỳ học nếu có */}
                      {p.period && ` · ${p.period}`}
                    </div>
                  </div>
                  {/* Ghi chú thanh toán — cắt bớt nếu quá dài */}
                  {p.notes && (
                    <span className="text-xs text-gray-400 max-w-32 text-right truncate ml-2">
                      {p.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* ── XẾP LỚP (thêm lớp cho HV đã có) ───────────── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            ➕ Xếp thêm lớp
          </h3>
          <button
            onClick={() => setShowEnrollForm((v) => !v)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showEnrollForm ? "✕ Đóng" : "＋ Xếp lớp"}
          </button>
        </div>

        {showEnrollForm && (
          <div className="space-y-3">
            <select
              value={enrollClassId}
              onChange={(e) => setEnrollClassId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn lớp --</option>
              {availClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.level} ({c.current_students ?? 0}/
                  {c.max_students} HV)
                </option>
              ))}
            </select>

            {enrollError && (
              <p className="text-xs text-red-500">{enrollError}</p>
            )}

            <button
              onClick={handleEnroll}
              disabled={!enrollClassId || enrolling}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                   text-white text-sm font-medium rounded-lg py-2 transition"
            >
              {enrolling ? "Đang xếp lớp..." : "✅ Xác nhận xếp lớp"}
            </button>
          </div>
        )}
      </div>

      {/* ── LỊCH SỬ ĐIỂM DANH ──────────────────────────── */}
      {attendance.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            📋 Điểm danh gần đây
          </h3>
          <div className="divide-y divide-gray-100">
            {attendance.map((a, idx) => (
              <div key={idx} className="flex justify-between items-center py-2">
                <div className="text-sm text-gray-700">
                  {formatDate(a.date)}
                  {a.class?.name && (
                    <span className="text-xs text-gray-400 ml-2">
                      {a.class.name}
                    </span>
                  )}
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
