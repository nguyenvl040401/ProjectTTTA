// ============================================================
// FILE: src/pages/classes/ClassListPage.jsx
// MỤC ĐÍCH: Trang danh sách lớp học.
//   Hiển thị dạng card grid — mỗi card là 1 lớp.
//   Tìm kiếm theo tên lớp / giáo viên, lọc theo cấp độ.
//   Progress bar hiển thị % lấp đầy sĩ số từng lớp.
// API: GET /api/classes?search=&level=&per_page=50
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../api/axios";

export default function ClassListPage() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState(""); // Lọc theo cấp độ

  // Gọi API mỗi khi search hoặc level thay đổi
  // cancelled flag tránh race condition khi gõ/chọn nhanh
  useEffect(() => {
    // Flag để huỷ request cũ khi user gõ search nhanh / đổi filter liên tục
    let cancelled = false;

    // Hàm async để fetch danh sách lớp
    const fetchClasses = async () => {
      setLoading(true); // bật loading khi bắt đầu gọi API

      try {
        console.log("[Classes] Fetching...", { search, level });

        const res = await api.get("/classes", {
          params: { search, level, per_page: 50 },
        });

        // Nếu component đã unmount hoặc request cũ bị huỷ → không update state
        if (cancelled) return;

        const classList = res.data.data || res.data || [];

        console.log("[Classes] API response:", classList);

        setClasses(classList);
      } catch (err) {
        console.error("[Classes] Fetch failed:", err);

        // Nếu lỗi → reset danh sách về rỗng để tránh hiển thị data cũ
        if (!cancelled) {
          setClasses([]);
        }
      } finally {
        // Tắt loading khi hoàn tất (success hoặc error)
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchClasses();

    // Cleanup: huỷ request trước đó khi search/level thay đổi
    return () => {
      cancelled = true;
      console.log("[Classes] Cleanup - cancel previous request");
    };
  }, [search, level]);

  return (
    <Layout title="Lớp học">
      <div className="space-y-4">
        {/* ── TOOLBAR ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Tìm kiếm */}
            <input
              type="text"
              placeholder="Tìm tên lớp, giáo viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 border border-gray-300 rounded-lg px-4 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Lọc cấp độ */}
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả cấp độ</option>
              {["Starter", "Movers", "Flyers", "KET", "PET"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          {/* Nút thêm lớp mới */}
          <button
            onClick={() => navigate("/classes/new")}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium px-4 py-2 rounded-lg transition"
          >
            ＋ Thêm lớp
          </button>
        </div>

        {/* ── DANH SÁCH LỚP DẠNG CARD GRID ── */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Đang tải...
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon="📚"
            title="Chưa có lớp học nào"
            desc="Bấm 'Thêm lớp' để tạo lớp đầu tiên"
            action={
              <button
                onClick={() => navigate("/classes/new")}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg
                           hover:bg-blue-700 transition"
              >
                ＋ Thêm lớp
              </button>
            }
          />
        ) : (
          // Grid responsive: 1 cột → 2 cột (md) → 3 cột (xl)
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                onClick={() => navigate(`/classes/${cls.id}/edit`)}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer
                           hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* Header card: tên lớp + badge cấp độ */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">
                      {cls.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 font-mono">
                      {cls.class_code}
                    </div>
                  </div>
                  {/* Dùng custom để hiện tên cấp độ thay vì nhãn trạng thái */}
                  <Badge status={cls.status} custom={cls.level} />
                </div>

                {/* Thông tin lớp */}
                <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                  {cls.teacher && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">👩‍🏫</span>
                      <span>{cls.teacher.full_name}</span>
                    </div>
                  )}
                  {cls.schedule && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">🗓</span>
                      <span>{cls.schedule}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">💰</span>
                    <span>
                      {Number(cls.fee_per_course).toLocaleString("vi-VN")}đ/khóa
                    </span>
                  </div>
                </div>

                {/* Progress bar sĩ số
                    Xanh < 80% | Vàng 80-99% | Đỏ 100% */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Sĩ số</span>
                    <span>
                      {cls.current_students ?? 0}/{cls.max_students} học viên
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        (cls.fill_rate ?? 0) >= 100
                          ? "bg-red-500"
                          : (cls.fill_rate ?? 0) >= 80
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                      // Giới hạn tối đa 100% để bar không tràn ra ngoài
                      style={{ width: `${Math.min(cls.fill_rate ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
