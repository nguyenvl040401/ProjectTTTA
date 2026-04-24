// ============================================================
// FILE: src/pages/classes/ClassDetailPage.jsx
// MỤC ĐÍCH: Trang chi tiết lớp học.
//   Hiển thị: thông tin lớp, danh sách HV đang học,
//             thêm HV vào lớp, xóa HV khỏi lớp.
// API:
//   - GET    /api/classes/:id
//   - GET    /api/enrollments?class_id=:id
//   - POST   /api/enrollments     (thêm HV vào lớp)
//   - PUT    /api/enrollments/:id (cập nhật trạng thái)
//   - DELETE /api/enrollments/:id (xóa HV khỏi lớp)
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import Badge from "../../components/ui/Badge";
import api from "../../api/axios";

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("vi-VN") : "—";
}

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cls, setCls] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // State thêm HV vào lớp
  const [showAddForm, setShowAddForm] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null); // ID HV đang được thêm vào

  // State xóa enrollment
  const [deletingEnrollId, setDeletingEnrollId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load thông tin lớp + danh sách enrollment
  useEffect(() => {
    Promise.all([
      api.get(`/classes/${id}`),
      api.get("/enrollments", { params: { class_id: id, per_page: 100 } }),
    ])
      .then(([cRes, eRes]) => {
        setCls(cRes.data.class || cRes.data);
        setEnrollments(eRes.data.data || eRes.data || []);
      })
      .catch(() => navigate("/classes"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Tìm kiếm học viên để thêm vào lớp — debounce 350ms
  const shouldSearch = studentQuery.length >= 2;

  useEffect(() => {
    if (!shouldSearch) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      // 👉 setState bên trong async → OK
      setSearching(true);

      api
        .get("/students", {
          params: { search: studentQuery, status: "active", per_page: 8 },
        })
        .then((res) => {
          if (!cancelled) setStudentResults(res.data.data || []);
        })
        .catch(() => {
          if (!cancelled) setStudentResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [studentQuery, shouldSearch]);
  // Thêm học viên vào lớp
  const handleAddStudent = async (student) => {
    setAddingId(student.id);
    try {
      const res = await api.post("/enrollments", {
        student_id: student.id,
        class_id: id,
        enrolled_date: new Date().toISOString().slice(0, 10),
        status: "studying",
      });
      // Thêm enrollment mới vào danh sách local
      setEnrollments((prev) => [...prev, res.data.enrollment || res.data]);
      setStudentQuery("");
      setStudentResults([]);
      setShowAddForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Không thể thêm học viên này!");
    } finally {
      setAddingId(null);
    }
  };

  // Xóa học viên khỏi lớp (xóa enrollment)
  const handleDeleteEnroll = async (enrollId) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/enrollments/${enrollId}`);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollId));
      setDeletingEnrollId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa!");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Chi tiết lớp học">
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Đang tải...
        </div>
      </Layout>
    );
  }

  if (!cls) return null;

  return (
    <Layout title="Chi tiết lớp học">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/classes")}
              className="text-gray-400 hover:text-gray-600 transition text-lg"
            >
              ←
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{cls.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-gray-400">
                  {cls.class_code}
                </span>
                <Badge status={cls.status} custom={cls.level} />
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/classes/${id}/edit`)}
            className="shrink-0 border border-gray-300 text-gray-600 hover:bg-gray-50
                       text-sm px-4 py-2 rounded-lg transition"
          >
            ✏️ Chỉnh sửa
          </button>
        </div>

        {/* Thông tin lớp */}
        <div className="bg-white rounded-xl shadow-sm p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Giáo viên
            </div>
            <div className="text-sm font-medium text-gray-800">
              {cls.teacher?.full_name || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Lịch học
            </div>
            <div className="text-sm font-medium text-gray-800">
              {cls.schedule || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Học phí
            </div>
            <div className="text-sm font-medium text-gray-800">
              {Number(cls.fee_per_course).toLocaleString("vi-VN")}đ/khóa
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Sĩ số
            </div>
            <div className="text-sm font-medium text-gray-800">
              {enrollments.length}/{cls.max_students} học viên
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Khai giảng
            </div>
            <div className="text-sm font-medium text-gray-800">
              {formatDate(cls.start_date)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Kết thúc
            </div>
            <div className="text-sm font-medium text-gray-800">
              {formatDate(cls.end_date)}
            </div>
          </div>
        </div>

        {/* Danh sách học viên trong lớp */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              🎓 Danh sách học viên ({enrollments.length})
            </h3>
            {/* Nút thêm HV — chỉ hiện khi lớp chưa đầy */}
            {enrollments.length < cls.max_students && (
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium
                           flex items-center gap-1"
              >
                {showAddForm ? "✕ Đóng" : "＋ Thêm học viên"}
              </button>
            )}
            {enrollments.length >= cls.max_students && (
              <span className="text-xs text-red-500 font-medium">
                Lớp đã đầy
              </span>
            )}
          </div>

          {/* Form tìm & thêm học viên */}
          {showAddForm && (
            <div className="px-5 py-4 bg-blue-50 border-b border-blue-100">
              <div className="relative">
                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Nhập tên hoặc SĐT học viên cần thêm..."
                  className="w-full border border-blue-300 rounded-lg px-4 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {/* Dropdown kết quả tìm kiếm */}
                {(studentResults.length > 0 || searching) && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 bg-white border
                                  border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                  >
                    {searching && (
                      <div className="px-4 py-3 text-sm text-gray-400">
                        Đang tìm...
                      </div>
                    )}
                    {studentResults.map((s) => {
                      // Kiểm tra HV đã có trong lớp chưa — nếu rồi thì disable
                      const alreadyIn = enrollments.some(
                        (e) => e.student_id === s.id && e.status === "studying",
                      );
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={alreadyIn || addingId === s.id}
                          onClick={() => !alreadyIn && handleAddStudent(s)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100
                                      last:border-0 transition
                                      ${
                                        alreadyIn
                                          ? "bg-gray-50 cursor-not-allowed"
                                          : "hover:bg-blue-50 cursor-pointer"
                                      }`}
                        >
                          <div className="text-sm font-medium text-gray-800">
                            {s.full_name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {s.student_code} · {s.parent_phone}
                            {alreadyIn && (
                              <span className="ml-2 text-orange-500">
                                · Đã trong lớp
                              </span>
                            )}
                            {addingId === s.id && (
                              <span className="ml-2 text-blue-500">
                                · Đang thêm...
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bảng danh sách HV */}
          {enrollments.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Chưa có học viên nào trong lớp
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {enrollments.map((en) => (
                <div
                  key={en.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div
                    onClick={() => navigate(`/students/${en.student_id}`)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full bg-blue-100 text-blue-700
                                    flex items-center justify-center text-xs font-bold shrink-0"
                    >
                      {(en.student?.full_name || en.student_name || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div
                        className="text-sm font-medium text-gray-800
                                      group-hover:text-blue-600 transition"
                      >
                        {en.student?.full_name || en.student_name || "—"}
                      </div>
                      <div className="text-xs text-gray-400">
                        Từ {formatDate(en.enrolled_date)}
                        {en.discount > 0 && ` · Giảm ${en.discount}%`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge status={en.status} />
                    {/* Confirm xóa inline */}
                    {deletingEnrollId === en.id ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-red-600 font-medium">
                          Xóa khỏi lớp?
                        </span>
                        <button
                          onClick={() => handleDeleteEnroll(en.id)}
                          disabled={deleteLoading}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          {deleteLoading ? "..." : "Xóa"}
                        </button>
                        <button
                          onClick={() => setDeletingEnrollId(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingEnrollId(en.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
