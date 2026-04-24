// ============================================================
// FILE: src/pages/students/StudentFormPage.jsx
// MỤC ĐÍCH: Form thêm mới hoặc chỉnh sửa hồ sơ học viên.
//   Tự nhận mode dựa theo URL:
//   - /students/new      → Thêm mới (isEdit = false)
//   - /students/:id/edit → Chỉnh sửa (isEdit = true), load dữ liệu cũ
//   Validation lỗi từ backend (422) được hiển thị dưới từng field.
//   Khi thêm mới: nếu chọn lớp → tự tạo enrollment luôn sau khi lưu HV
// API:
//   - POST /api/students        (thêm mới)
//   - GET  /api/students/:id    (load dữ liệu khi sửa)
//   - PUT  /api/students/:id    (lưu khi sửa)
//   - GET  /api/classes         (load danh sách lớp cho dropdown)
//   - POST /api/enrollments     (xếp lớp ngay khi thêm mới HV)
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api/axios";

// ── COMPONENT FIELD ─────────────────────────────────────────
// Render 1 ô nhập liệu gồm: label + input/custom + hiển thị lỗi
// PHẢI khai báo ngoài StudentFormPage để tránh bị re-create mỗi lần render
// (React sẽ reset state của component nếu nó được tạo lại trong render)
// PROPS:
//   - label    : string   — tên hiển thị của field
//   - field    : string   — key tương ứng trong object form
//   - type     : string   — loại input (text/date/email/tel/number)
//   - required : boolean  — hiện dấu * đỏ nếu bắt buộc
//   - form     : object   — toàn bộ dữ liệu form hiện tại
//   - errors   : object   — lỗi validation từ backend { field: ['msg'] }
//   - onChange : function — callback cập nhật form khi người dùng nhập
//   - children : ReactNode — nếu truyền vào thì render children thay vì input mặc định
function Field({
  label,
  field,
  type = "text",
  required,
  form,
  errors,
  onChange,
  children,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Nếu có children (select, textarea...) thì render children, ngược lại render input */}
      {children || (
        <input
          type={type}
          value={form[field]}
          onChange={(e) => onChange(field, e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                      ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        />
      )}

      {/* Hiển thị lỗi validation từ backend — errors[field] là mảng string */}
      {errors[field] && (
        <p className="text-xs text-red-500 mt-1">{errors[field][0]}</p>
      )}
    </div>
  );
}

// Giá trị mặc định của form — dùng khi thêm mới hoặc reset
const defaultForm = {
  full_name: "",
  dob: "",
  parent_name: "",
  parent_phone: "",
  email: "",
  enrollment_date: new Date().toISOString().slice(0, 10), // Mặc định = hôm nay
  start_date: "",
  entry_level: "",
  status: "active",
  notes: "",
  class_id: "", // ID lớp muốn xếp — nếu có sẽ tạo enrollment luôn khi lưu
};

export default function StudentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Lấy :id từ URL (undefined nếu là /new)
  const isEdit = Boolean(id); // true nếu có id → chế độ sửa

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({}); // Lỗi validation: { field: ['msg'] }
  const [loading, setLoading] = useState(false); // Đang submit form
  const [fetching, setFetching] = useState(isEdit); // Đang load dữ liệu cũ (chỉ khi sửa)

  // Danh sách lớp có thể xếp cho học viên mới
  // Chỉ dùng khi thêm mới — chế độ sửa không cần
  const [availableClasses, setAvailableClasses] = useState([]);

  // Thông tin chi tiết của lớp đang được chọn trong dropdown
  // Dùng để hiển thị xác nhận (GV, lịch học, học phí) ngay dưới dropdown
  const selectedClassInfo =
    availableClasses.find((c) => String(c.id) === String(form.class_id)) ||
    null;

  // Load danh sách lớp 1 lần khi mở form thêm mới
  // Chỉ load khi !isEdit vì chế độ sửa không có dropdown chọn lớp
  useEffect(() => {
    if (isEdit) return;
    api
      .get("/classes", { params: { per_page: 100 } })
      .then((res) => setAvailableClasses(res.data.data || res.data || []))
      .catch(() => {}); // Không load được lớp → dropdown rỗng, không báo lỗi
  }, [isEdit]);

  // ── LOAD DỮ LIỆU CŨ KHI SỬA ────────────────────────────
  // Chỉ chạy khi isEdit = true
  // Điền sẵn dữ liệu học viên hiện tại vào form để người dùng chỉnh sửa
  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/students/${id}`)
      .then((res) => {
        const s = res.data.student || res.data;
        setForm({
          full_name: s.full_name || "",
          dob: s.dob || "",
          parent_name: s.parent_name || "",
          parent_phone: s.parent_phone || "",
          email: s.email || "",
          enrollment_date: s.enrollment_date || "",
          start_date: s.start_date || "",
          entry_level: s.entry_level || "",
          status: s.status || "active",
          notes: s.notes || "",
          class_id: "", // Không điền class_id khi sửa — quản lý riêng
        });
      })
      .catch(() => navigate("/students")) // Không tìm thấy HV → về danh sách
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  // Cập nhật 1 field trong form và xóa lỗi của field đó
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Xóa lỗi khi người dùng bắt đầu sửa field → UX tốt hơn
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // ── XỬ LÝ SUBMIT ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isEdit) {
        // Chế độ sửa — chỉ cập nhật hồ sơ, không động đến enrollment
        await api.put(`/students/${id}`, form);
      } else {
        // Chế độ thêm mới — tạo học viên trước
        const res = await api.post("/students", form);
        const newStudentId = res.data.student?.id || res.data.id;

        // Nếu nhân viên đã chọn lớp → tạo enrollment luôn sau khi tạo HV
        // Giúp tiết kiệm thao tác, không cần vào trang riêng để xếp lớp
        if (form.class_id && newStudentId) {
          await api.post("/enrollments", {
            student_id: newStudentId,
            class_id: form.class_id,
            enrolled_date:
              form.enrollment_date || new Date().toISOString().slice(0, 10),
            status: "studying",
          });
        }
      }

      navigate("/students"); // Thành công → về danh sách
    } catch (err) {
      console.log("ERRORS:", err.response?.data?.errors); // thêm dòng này
      console.log("FULL DATA:", err.response?.data);
      if (err.response?.status === 422) {
        // Lỗi validation từ Laravel — hiển thị lỗi dưới từng field
        setErrors(err.response.data.errors || {});
      } else {
        // Lỗi khác (500, mất mạng...) — hiển thị thông báo chung
        setErrors({
          general: err.response?.data?.message || "Có lỗi xảy ra, thử lại!",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị loading khi đang tải dữ liệu cũ (chế độ sửa)
  if (fetching) {
    return (
      <Layout title={isEdit ? "Sửa học viên" : "Thêm học viên"}>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Đang tải...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEdit ? "Sửa học viên" : "Thêm học viên"}>
      <div className="max-w-2xl mx-auto">
        {/* Nút back + tiêu đề */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/students")}
            className="text-gray-400 hover:text-gray-600 transition text-lg"
            aria-label="Quay lại"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Chỉnh sửa hồ sơ học viên" : "Thêm học viên mới"}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 space-y-5"
        >
          {/* Lỗi chung (không thuộc field cụ thể nào) */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {errors.general}
            </div>
          )}

          {/* ── NHÓM 1: THÔNG TIN HỌC VIÊN ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Thông tin học viên
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Họ tên chiếm full width */}
              <div className="sm:col-span-2">
                <Field
                  label="Họ và tên"
                  field="full_name"
                  required
                  form={form}
                  errors={errors}
                  onChange={handleChange}
                />
              </div>
              <Field
                label="Ngày sinh"
                field="dob"
                type="date"
                form={form}
                errors={errors}
                onChange={handleChange}
              />
              {/* Trình độ dùng select thay vì input tự do */}
              <Field
                label="Trình độ đầu vào"
                field="entry_level"
                form={form}
                errors={errors}
                onChange={handleChange}
              >
                <select
                  value={form.entry_level}
                  onChange={(e) => handleChange("entry_level", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn trình độ --</option>
                  {[
                    "Mới bắt đầu",
                    "Starter",
                    "Movers",
                    "Flyers",
                    "KET",
                    "PET",
                  ].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* ── NHÓM 2: THÔNG TIN PHỤ HUYNH ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Thông tin phụ huynh
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Tên phụ huynh"
                field="parent_name"
                form={form}
                errors={errors}
                onChange={handleChange}
              />
              <Field
                label="SĐT phụ huynh"
                field="parent_phone"
                type="tel"
                required
                form={form}
                errors={errors}
                onChange={handleChange}
              />
              <div className="sm:col-span-2">
                <Field
                  label="Email liên hệ"
                  field="email"
                  type="email"
                  form={form}
                  errors={errors}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* ── NHÓM 3: THÔNG TIN ĐĂNG KÝ ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Thông tin đăng ký
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Ngày đăng ký"
                field="enrollment_date"
                type="date"
                required
                form={form}
                errors={errors}
                onChange={handleChange}
              />
              <Field
                label="Ngày bắt đầu học"
                field="start_date"
                type="date"
                form={form}
                errors={errors}
                onChange={handleChange}
              />

              {/* Chọn lớp học — chỉ hiện khi THÊM MỚI
                  Khi thêm mới: chọn lớp → tự tạo enrollment luôn
                  Khi sửa: quản lý lớp riêng ở trang chi tiết học viên */}
              {!isEdit && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xếp lớp{" "}
                    <span className="text-gray-400 font-normal">
                      (tuỳ chọn — có thể xếp sau)
                    </span>
                  </label>
                  <select
                    value={form.class_id}
                    onChange={(e) => handleChange("class_id", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chưa xếp lớp --</option>
                    {/* Hiện tên lớp + cấp độ + sĩ số + học phí để nhân viên dễ chọn */}
                    {availableClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} — {cls.level} ({cls.current_students ?? 0}/
                        {cls.max_students} HV) ·{" "}
                        {Number(cls.fee_per_course).toLocaleString("vi-VN")}đ
                      </option>
                    ))}
                  </select>

                  {/* Hiện thông tin lớp đã chọn để nhân viên xác nhận trước khi lưu */}
                  {selectedClassInfo && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                      <div className="font-semibold">
                        {selectedClassInfo.name}
                      </div>
                      <div className="mt-0.5 text-blue-500">
                        GV: {selectedClassInfo.teacher?.full_name || "Chưa có"}{" "}
                        · Lịch: {selectedClassInfo.schedule || "Chưa có"} · Học
                        phí:{" "}
                        {Number(
                          selectedClassInfo.fee_per_course,
                        ).toLocaleString("vi-VN")}
                        đ
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Trạng thái chỉ hiện khi sửa — thêm mới mặc định là 'active' */}
              {isEdit && (
                <Field
                  label="Trạng thái"
                  field="status"
                  form={form}
                  errors={errors}
                  onChange={handleChange}
                >
                  <select
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Đang học</option>
                    <option value="inactive">Đã nghỉ</option>
                    <option value="paused">Tạm dừng</option>
                  </select>
                </Field>
              )}
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
              placeholder="Ghi chú thêm về học viên..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Nút Hủy + Lưu */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/students")}
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
                  : "＋ Thêm học viên"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
