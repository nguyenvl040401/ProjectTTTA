// ============================================================
// FILE: src/pages/classes/ClassFormPage.jsx
// MỤC ĐÍCH: Form thêm mới hoặc chỉnh sửa lớp học.
//   Tự nhận mode dựa theo URL:
//   - /classes/new      → Thêm mới (isEdit = false)
//   - /classes/:id/edit → Chỉnh sửa (isEdit = true)
//   Load danh sách giáo viên để hiển thị dropdown chọn giáo viên.
// API:
//   - GET  /api/teachers          (load dropdown giáo viên)
//   - GET  /api/classes/:id       (load dữ liệu khi sửa)
//   - POST /api/classes            (thêm mới)
//   - PUT  /api/classes/:id        (lưu khi sửa)
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api/axios";

// Giá trị mặc định của form
const defaultForm = {
  name: "",
  level: "",
  teacher_id: "",
  schedule: "",
  max_students: 12, // Sĩ số tối đa mặc định theo thiết kế
  total_sessions: 60, // Tổng số buổi mặc định theo thiết kế
  fee_per_course: "",
  start_date: "",
  end_date: "",
  status: "upcoming", // Lớp mới tạo mặc định là "Sắp khai giảng"
  notes: "",
};

// ── COMPONENT FIELD ─────────────────────────────────────────
// Tương tự StudentFormPage — khai báo ngoài để tránh re-create mỗi render
// PROPS: label, field, required, errors, children (optional — custom input)
function F({ label, field, required, errors, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {/* Hiển thị lỗi validation từ backend */}
      {errors[field] && (
        <p className="text-xs text-red-500 mt-1">{errors[field][0]}</p>
      )}
    </div>
  );
}

export default function ClassFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [teachers, setTeachers] = useState([]); // Danh sách giáo viên cho dropdown
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Load danh sách giáo viên khi component mount
  // Dùng cho dropdown chọn giáo viên phụ trách lớp
  useEffect(() => {
    api
      .get("/teachers")
      .then((res) => setTeachers(res.data.data || res.data || []))
      .catch(() => {}); // Không có GV thì để dropdown trống, không báo lỗi
  }, []);

  // Load dữ liệu lớp hiện tại khi ở chế độ sửa
  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/classes/${id}`)
      .then((res) => {
        const c = res.data.class || res.data;
        setForm({
          name: c.name || "",
          level: c.level || "",
          teacher_id: c.teacher_id || "",
          schedule: c.schedule || "",
          max_students: c.max_students || 12,
          total_sessions: c.total_sessions || 60,
          fee_per_course: c.fee_per_course || "",
          start_date: c.start_date || "",
          end_date: c.end_date || "",
          status: c.status || "upcoming",
          notes: c.notes || "",
        });
      })
      .catch(() => navigate("/classes"))
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  // Cập nhật 1 field và xóa lỗi của field đó
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      if (isEdit) {
        await api.put(`/classes/${id}`, form);
      } else {
        await api.post("/classes", form);
      }
      navigate("/classes");
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({ general: err.response?.data?.message || "Có lỗi xảy ra!" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Class dùng chung cho các input trong form này
  const inputCls = (field) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none
     focus:ring-2 focus:ring-blue-500 transition
     ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}`;

  if (fetching) {
    return (
      <Layout title={isEdit ? "Sửa lớp học" : "Thêm lớp học"}>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Đang tải...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEdit ? "Sửa lớp học" : "Thêm lớp học"}>
      <div className="max-w-2xl mx-auto">
        {/* Nút back + tiêu đề */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/classes")}
            className="text-gray-400 hover:text-gray-600 transition text-lg"
            aria-label="Quay lại"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Chỉnh sửa lớp học" : "Thêm lớp học mới"}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 space-y-5"
        >
          {/* Lỗi chung */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {errors.general}
            </div>
          )}

          {/* ── NHÓM 1: THÔNG TIN LỚP HỌC ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Thông tin lớp học
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tên lớp — full width */}
              <div className="sm:col-span-2">
                <F label="Tên lớp" field="name" required errors={errors}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="VD: Movers 2 Chiều"
                    className={inputCls("name")}
                  />
                </F>
              </div>

              {/* Cấp độ */}
              <F label="Cấp độ" field="level" required errors={errors}>
                <select
                  value={form.level}
                  onChange={(e) => handleChange("level", e.target.value)}
                  className={inputCls("level")}
                >
                  <option value="">-- Chọn cấp độ --</option>
                  {[
                    "Starters",
                    "Movers",
                    "Flyers",
                    "IELTS 4.0",
                    "IELTS 5.0",
                    "Giao tiếp",
                    "KET",
                    "PET",
                  ].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </F>

              {/* Giáo viên phụ trách */}
              <F label="Giáo viên" field="teacher_id" errors={errors}>
                <select
                  value={form.teacher_id}
                  onChange={(e) => handleChange("teacher_id", e.target.value)}
                  className={inputCls("teacher_id")}
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </F>

              {/* Lịch học — nhập tự do dạng text */}
              <div className="sm:col-span-2">
                <F label="Lịch học" field="schedule" errors={errors}>
                  <input
                    type="text"
                    value={form.schedule}
                    onChange={(e) => handleChange("schedule", e.target.value)}
                    placeholder="VD: T3-T5, 17:30 - 19:00"
                    className={inputCls("schedule")}
                  />
                </F>
              </div>
            </div>
          </div>

          {/* ── NHÓM 2: CẤU HÌNH LỚP ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Cấu hình lớp
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sĩ số tối đa */}
              <F label="Sĩ số tối đa" field="max_students" errors={errors}>
                <input
                  type="number"
                  value={form.max_students}
                  onChange={(e) => handleChange("max_students", e.target.value)}
                  className={inputCls("max_students")}
                />
              </F>

              {/* Tổng số buổi học */}
              <F label="Tổng số buổi" field="total_sessions" errors={errors}>
                <input
                  type="number"
                  value={form.total_sessions}
                  onChange={(e) =>
                    handleChange("total_sessions", e.target.value)
                  }
                  className={inputCls("total_sessions")}
                />
              </F>

              {/* Học phí — nhập số, không có ký tự tiền tệ */}
              <F
                label="Học phí / khóa (VNĐ)"
                field="fee_per_course"
                required
                errors={errors}
              >
                <input
                  type="number"
                  value={form.fee_per_course}
                  placeholder="VD: 2800000"
                  onChange={(e) =>
                    handleChange("fee_per_course", e.target.value)
                  }
                  className={inputCls("fee_per_course")}
                />
              </F>

              {/* Trạng thái lớp */}
              <F label="Trạng thái" field="status" errors={errors}>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className={inputCls("status")}
                >
                  <option value="upcoming">Sắp khai giảng</option>
                  <option value="active">Đang học</option>
                  <option value="finished">Đã kết thúc</option>
                </select>
              </F>

              {/* Ngày khai giảng và kết thúc */}
              <F label="Ngày khai giảng" field="start_date" errors={errors}>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  className={inputCls("start_date")}
                />
              </F>

              <F label="Ngày kết thúc" field="end_date" errors={errors}>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleChange("end_date", e.target.value)}
                  className={inputCls("end_date")}
                />
              </F>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Nút Hủy + Lưu */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/classes")}
              className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50
                         rounded-lg py-2.5 text-sm font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                         text-white rounded-lg py-2.5 text-sm font-semibold transition"
            >
              {loading
                ? "Đang lưu..."
                : isEdit
                  ? "💾 Lưu thay đổi"
                  : "＋ Thêm lớp"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
