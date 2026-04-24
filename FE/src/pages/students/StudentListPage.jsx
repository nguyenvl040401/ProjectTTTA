// ============================================================
// FILE: src/pages/students/StudentListPage.jsx
// MỤC ĐÍCH: Trang danh sách học viên.
//   - Hiển thị bảng học viên với phân trang (15 HV/trang)
//   - Tìm kiếm theo tên / SĐT / mã học viên
//   - Lọc theo trạng thái (Đang học / Đã nghỉ / Tạm dừng)
//   - Responsive: bảng trên desktop, card list trên mobile
//   - Bấm "Xem chi tiết" → chuyển sang StudentDetailPage
// API: GET /api/students?search=&status=&page=&per_page=15
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../api/axios";

export default function StudentListPage() {
  const navigate = useNavigate();

  // ── STATE DỮ LIỆU ───────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // ── STATE BỘ LỌC ────────────────────────────────────────
  const [search, setSearch] = useState(""); // Từ khoá tìm kiếm
  const [status, setStatus] = useState(""); // Trạng thái lọc
  const [page, setPage] = useState(1); // Trang hiện tại

  // ── GỌI API ─────────────────────────────────────────────
  // Chạy lại mỗi khi search, status hoặc page thay đổi
  // cancelled flag tránh race condition khi người dùng gõ nhanh:
  //   → request cũ chưa về mà request mới đã gửi → bỏ kết quả cũ
  useEffect(() => {
    let cancelled = false;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await api.get("/students", {
          params: { search, status, page, per_page: 15 },
        });
        if (!cancelled) {
          // res.data là Laravel Paginator: { data: [...], current_page, last_page, total }
          setStudents(res.data.data);
          setMeta({
            current_page: res.data.current_page,
            last_page: res.data.last_page,
            total: res.data.total,
          });
        }
      } catch {
        if (!cancelled) setStudents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStudents();

    // Cleanup: đánh dấu cancelled khi effect chạy lại (search/status/page mới)
    return () => {
      cancelled = true;
    };
  }, [search, status, page]);

  // Reset về trang 1 khi thay đổi bộ lọc
  // (nếu đang ở trang 3 rồi tìm kiếm thì phải về trang 1)
  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };
  const handleStatus = (val) => {
    setStatus(val);
    setPage(1);
  };

  return (
    <Layout title="Học viên">
      <div className="space-y-4">
        {/* ── TOOLBAR ─────────────────────────────────────
            Hàng trên: ô tìm kiếm + dropdown lọc + nút thêm mới
            Responsive: xếp dọc trên mobile, ngang từ sm trở lên */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Ô tìm kiếm — gõ là tìm ngay (không cần nhấn Enter) */}
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, mã học viên..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full sm:w-72 border border-gray-300 rounded-lg px-4 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Dropdown lọc trạng thái */}
            <select
              value={status}
              onChange={(e) => handleStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang học</option>
              <option value="inactive">Đã nghỉ</option>
              <option value="paused">Tạm dừng</option>
            </select>
          </div>

          {/* Nút thêm học viên mới — chuyển sang trang form */}
          <button
            onClick={() => navigate("/students/new")}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                       px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            ＋ Thêm học viên
          </button>
        </div>

        {/* Hiển thị tổng số kết quả tìm được */}
        {!loading && (
          <p className="text-sm text-gray-500">
            Tìm thấy{" "}
            <span className="font-semibold text-gray-700">{meta.total}</span>{" "}
            học viên
          </p>
        )}

        {/* ── BẢNG DANH SÁCH ──────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Trạng thái đang tải */}
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Đang tải...
            </div>
          ) : /* Không có dữ liệu */
          students.length === 0 ? (
            <EmptyState
              icon="🎓"
              title="Chưa có học viên nào"
              desc="Bấm 'Thêm học viên' để bắt đầu nhập hồ sơ"
              action={
                <button
                  onClick={() => navigate("/students/new")}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg
                             hover:bg-blue-700 transition"
                >
                  ＋ Thêm học viên
                </button>
              }
            />
          ) : (
            <>
              {/* Bảng dữ liệu — hiện trên desktop (sm trở lên) */}
              <div className="overflow-x-auto hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 text-left font-medium">Mã HV</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Họ tên
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Phụ huynh
                      </th>
                      <th className="px-4 py-3 text-left font-medium">SĐT</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Ngày đăng ký
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {s.student_code}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {s.full_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {s.parent_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {s.parent_phone}
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={s.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {s.enrollment_date
                            ? new Date(s.enrollment_date).toLocaleDateString(
                                "vi-VN",
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/students/${s.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Xem chi tiết →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card list — hiện trên mobile (dưới sm) — gọn hơn bảng */}
              <div className="sm:hidden divide-y divide-gray-100">
                {students.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/students/${s.id}`)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer active:bg-gray-100"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-800">
                        {s.full_name}
                      </span>
                      <Badge status={s.status} />
                    </div>
                    <div className="text-xs text-gray-500">
                      {s.student_code} · {s.parent_phone}
                    </div>
                    {s.parent_name && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        PH: {s.parent_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phân trang — component tự ẩn nếu chỉ có 1 trang */}
        <Pagination
          currentPage={meta.current_page}
          lastPage={meta.last_page}
          onPageChange={setPage}
        />
      </div>
    </Layout>
  );
}
