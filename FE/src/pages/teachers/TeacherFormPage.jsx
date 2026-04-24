// ============================================================
// FILE: src/pages/teachers/TeacherFormPage.jsx
// MỤC ĐÍCH: Form thêm mới / chỉnh sửa giáo viên.
//   - /teachers/new      → Thêm mới
//   - /teachers/:id/edit → Chỉnh sửa
// API:
//   - POST /api/teachers
//   - GET  /api/teachers/:id
//   - PUT  /api/teachers/:id
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api/axios";

const defaultForm = {
  full_name: "",
  phone: "",
  notes: "",
  is_active: true,
};

export default function TeacherFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Load dữ liệu giáo viên khi sửa
  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/teachers/${id}`)
      .then((res) => {
        const t = res.data.teacher || res.data;
        setForm({
          full_name: t.full_name || "",
          phone: t.phone || "",
          notes: t.notes || "",
          is_active: t.is_active ?? true,
        });
      })
      .catch(() => navigate("/teachers"))
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

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
        await api.put(`/teachers/${id}`, form);
      } else {
        await api.post("/teachers", form);
      }
      navigate("/teachers");
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

  if (fetching) {
    return (
      <Layout title={isEdit ? "Sửa giáo viên" : "Thêm giáo viên"}>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Đang tải...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEdit ? "Sửa giáo viên" : "Thêm giáo viên"}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/teachers")}
            className="text-gray-400 hover:text-gray-600 transition text-lg"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Chỉnh sửa giáo viên" : "Thêm giáo viên mới"}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 space-y-4"
        >
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {errors.general}
            </div>
          )}

          {/* Họ tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="VD: Nguyễn Thị Lan"
              required
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none
                          focus:ring-2 focus:ring-blue-500 transition
                          ${errors.full_name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
            />
            {errors.full_name && (
              <p className="text-xs text-red-500 mt-1">{errors.full_name[0]}</p>
            )}
          </div>

          {/* SĐT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="VD: 0901 234 567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              placeholder="Chuyên môn, kinh nghiệm..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Trạng thái — chỉ hiện khi sửa */}
          {isEdit && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Đang hoạt động
              </label>
            </div>
          )}

          {/* Nút */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/teachers")}
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
                  : "＋ Thêm giáo viên"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
