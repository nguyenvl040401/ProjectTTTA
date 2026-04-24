// ============================================================
// FILE: src/pages/attendance/AttendancePage.jsx
// MỤC ĐÍCH: Trang điểm danh theo lớp và ngày.
//   Luồng thao tác:
//     1. Chọn lớp học + ngày học
//     2. Hệ thống load danh sách học viên của lớp đó
//     3. Nhân viên tick trạng thái từng học viên:
//        Có mặt / Vắng / Học bù
//     4. Bấm "Lưu" → gọi API bulk để lưu cả lớp 1 lần
//   Hỗ trợ nút "Tất cả có mặt / Tất cả vắng" để điểm danh nhanh.
// API:
//   - GET  /api/classes                           (load dropdown lớp)
//   - GET  /api/attendance/class/:id/date/:date   (load điểm danh hôm đó)
//   - POST /api/attendance/bulk                   (lưu cả lớp)
// ============================================================

import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

// Các trạng thái điểm danh có thể chọn
// color: class Tailwind khi trạng thái đó đang được chọn (active)
const STATUS_OPTIONS = [
  {
    value: "present",
    label: "Có mặt",
    color: "bg-green-100 text-green-700 border-green-300",
  },
  {
    value: "absent",
    label: "Vắng",
    color: "bg-red-100 text-red-600 border-red-300",
  },
  {
    value: "late",
    label: "Đi trễ",
    color: "bg-yellow-100 text-yellow-600 border-yellow-300",
  },
  {
    value: "excused",
    label: "Có phép",
    color: "bg-blue-100 text-blue-600 border-blue-300",
  },
];

export default function AttendancePage() {
  // ── STATE CHỌN LỚP + NGÀY ───────────────────────────────
  const [classes, setClasses] = useState([]); // Danh sách lớp cho dropdown
  const [selectedClass, setSelectedClass] = useState(""); // ID lớp đang chọn
  const [date, setDate] = useState(
    // Ngày điểm danh, mặc định hôm nay
    new Date().toISOString().slice(0, 10),
  );

  // ── STATE ĐIỂM DANH ─────────────────────────────────────
  // Mảng các object: { student_id, student_name, student_code, status }
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false); // Hiện thông báo đã lưu

  // Load danh sách lớp đang hoạt động cho dropdown khi component mount
  useEffect(() => {
    api
      .get("/classes", { params: { status: "active", per_page: 100 } })
      .then((res) => setClasses(res.data.data || res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Chỉ gọi API khi đã chọn lớp và ngày
    if (!selectedClass || !date) return;

    // Flag để tránh setState khi component đã unmount
    let cancelled = false;

    // Hàm async để load dữ liệu điểm danh
    const fetchAttendance = async () => {
      // Bật loading khi bắt đầu gọi API
      setLoading(true);

      // Reset trạng thái "đã lưu"
      setSaved(false);

      try {
        console.log("[Attendance] Fetching data...", { selectedClass, date });

        const res = await api.get(
          `/attendance/class/${selectedClass}/date/${date}`,
        );

        // Nếu component đã unmount thì không làm gì nữa
        if (cancelled) return;

        const list = res.data.students || res.data || [];

        console.log("[Attendance] API response:", list);

        // Chuẩn hoá dữ liệu từ backend về format frontend cần
        const normalizedData = list.map((s) => ({
          student_id: s.student_id || s.id,
          student_name: s.student_name || s.full_name,
          student_code: s.student_code,
          // Nếu backend chưa có điểm danh thì mặc định là "present"
          status: s.status || "present",
        }));

        setAttendance(normalizedData);
      } catch (err) {
        console.error("[Attendance] Fetch failed:", err);

        // Nếu lỗi thì reset danh sách về rỗng
        if (!cancelled) {
          setAttendance([]);
        }
      } finally {
        // Tắt loading khi hoàn tất (thành công hoặc lỗi)
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAttendance();

    // Cleanup khi component unmount hoặc dependencies thay đổi
    return () => {
      cancelled = true;
      console.log("[Attendance] Cleanup - cancel previous request");
    };
  }, [selectedClass, date]);

  // Thay đổi trạng thái điểm danh của 1 học viên cụ thể
  const setStatus = (studentId, status) => {
    setAttendance((prev) =>
      prev.map((a) => (a.student_id === studentId ? { ...a, status } : a)),
    );
  };

  // Điểm danh nhanh toàn bộ lớp — đặt cùng 1 trạng thái cho tất cả
  const markAll = (status) => {
    setAttendance((prev) => prev.map((a) => ({ ...a, status })));
  };

  // Lưu điểm danh cả lớp bằng 1 request duy nhất (bulk)
  const handleSave = async () => {
    if (!attendance.length) return;
    setSaving(true);
    try {
      await api.post("/attendance/bulk", {
        class_id: selectedClass,
        date,
        // Chỉ gửi student_id và status, không gửi thông tin thừa
        attendances: attendance.map((a) => ({
          student_id: a.student_id,
          status: a.status,
        })),
      });
      setSaved(true);
    } catch {
      alert("Lưu thất bại, thử lại!");
    } finally {
      setSaving(false);
    }
  };

  // Tính nhanh số liệu thống kê để hiển thị trên header
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;

  return (
    <Layout title="Điểm danh">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* ── CHỌN LỚP + NGÀY ── */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Chọn lớp & ngày học
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Dropdown chọn lớp */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {/* Chọn ngày điểm danh */}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ── DANH SÁCH ĐIỂM DANH ──────────────────────────
            Chỉ hiện sau khi đã chọn lớp */}
        {selectedClass && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header: thống kê nhanh + nút điểm danh hàng loạt */}
            <div
              className="px-5 py-4 border-b border-gray-100
                            flex items-center justify-between"
            >
              <div className="text-sm text-gray-600">
                {loading ? (
                  "Đang tải..."
                ) : (
                  <>
                    <span className="text-green-600 font-semibold">
                      {presentCount} có mặt
                    </span>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="text-red-500 font-semibold">
                      {absentCount} vắng
                    </span>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="text-gray-500">
                      {attendance.length} tổng
                    </span>
                  </>
                )}
              </div>
              {/* Nút điểm danh nhanh — chỉ hiện khi có dữ liệu */}
              {!loading && attendance.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => markAll("present")}
                    className="text-xs text-green-600 hover:text-green-800 font-medium"
                  >
                    ✅ Tất cả có mặt
                  </button>
                  <button
                    onClick={() => markAll("absent")}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    ❌ Tất cả vắng
                  </button>
                </div>
              )}
            </div>

            {/* Danh sách học viên */}
            {loading ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                Đang tải danh sách...
              </div>
            ) : attendance.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                Không có học viên nào trong lớp này
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {attendance.map((a) => (
                  <div
                    key={a.student_id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    {/* Tên + mã học viên */}
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {a.student_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {a.student_code}
                      </div>
                    </div>
                    {/* Nhóm 3 nút chọn trạng thái
                        Nút đang active: nền màu theo trạng thái
                        Nút không active: nền trắng, viền xám nhạt */}
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(a.student_id, opt.value)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition
                            ${
                              a.status === opt.value
                                ? opt.color // Đang active
                                : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50" // Không active
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Nút lưu + thông báo đã lưu */}
            {!loading && attendance.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100">
                {saved && (
                  <p className="text-sm text-green-600 mb-3 font-medium">
                    ✅ Đã lưu điểm danh thành công!
                  </p>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                             text-white font-semibold rounded-lg py-2.5 text-sm transition"
                >
                  {saving ? "Đang lưu..." : "💾 Lưu điểm danh"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
