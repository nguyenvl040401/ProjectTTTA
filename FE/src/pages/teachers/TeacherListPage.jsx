// ============================================================
// FILE: src/pages/teachers/TeacherListPage.jsx
// MỤC ĐÍCH: Trang danh sách giáo viên.
//   Hiển thị danh sách, tìm kiếm, thêm/sửa/xóa giáo viên.
//   Giáo viên được dùng làm dropdown khi tạo/sửa lớp học.
// API: GET /api/teachers
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../api/axios";

export default function TeacherListPage() {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // ID giáo viên đang được xác nhận xóa — hiện confirm inline
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 👉 defer sang microtask (không còn sync)
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });

    api
      .get("/teachers", { params: { search, per_page: 100 } })
      .then((res) => {
        if (!cancelled) setTeachers(res.data.data || res.data || []);
      })
      .catch(() => {
        if (!cancelled) setTeachers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search]);

  // Xóa giáo viên — chỉ cho phép nếu GV không đang phụ trách lớp nào
  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/teachers/${id}`);
      // Xóa khỏi danh sách local — không cần gọi lại API
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      setDeletingId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa giáo viên này!");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout title="Giáo viên">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 border border-gray-300 rounded-lg px-4 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => navigate("/teachers/new")}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium px-4 py-2 rounded-lg transition"
          >
            ＋ Thêm giáo viên
          </button>
        </div>

        {/* Danh sách */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Đang tải...
            </div>
          ) : teachers.length === 0 ? (
            <EmptyState
              icon="👩‍🏫"
              title="Chưa có giáo viên nào"
              desc="Bấm 'Thêm giáo viên' để thêm giáo viên đầu tiên"
              action={
                <button
                  onClick={() => navigate("/teachers/new")}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg
                             hover:bg-blue-700 transition"
                >
                  ＋ Thêm giáo viên
                </button>
              }
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {teachers.map((t) => (
                <div key={t.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar chữ cái đầu */}
                      <div
                        className="w-10 h-10 rounded-full bg-purple-100 text-purple-700
                                      flex items-center justify-center font-bold text-sm shrink-0"
                      >
                        {t.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {t.full_name}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 space-x-2">
                          {t.phone && <span>📞 {t.phone}</span>}
                          {/* Số lớp đang dạy nếu backend trả về */}
                          {t.classes_count > 0 && (
                            <span>· {t.classes_count} lớp đang dạy</span>
                          )}
                        </div>
                        {t.notes && (
                          <div className="text-xs text-gray-400 mt-0.5 italic">
                            {t.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Confirm xóa inline — không dùng alert */}
                      {deletingId === t.id ? (
                        <div
                          className="flex items-center gap-2 bg-red-50 border border-red-200
                                        rounded-lg px-3 py-1.5 text-xs"
                        >
                          <span className="text-red-600 font-medium">
                            Xác nhận xóa?
                          </span>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deleteLoading}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            {deleteLoading ? "..." : "Xóa"}
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => navigate(`/teachers/${t.id}/edit`)}
                            className="text-sm text-blue-600 hover:text-blue-800
                                       font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => setDeletingId(t.id)}
                            className="text-sm text-red-500 hover:text-red-700
                                       font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            Xóa
                          </button>
                        </>
                      )}
                    </div>
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
