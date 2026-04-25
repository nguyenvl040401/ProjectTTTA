// ============================================================
// FILE: src/pages/payments/PaymentPage.jsx
// MỤC ĐÍCH: Trang nhập thanh toán học phí.
//   Luồng thao tác:
//     1. Tìm học viên (gõ tên/SĐT → dropdown gợi ý)
//     2. Hệ thống hiển thị công nợ hiện tại
//     3. Nhập số tiền + ngày + hình thức → lưu
//     4. Công nợ tự cập nhật lại sau khi lưu
//   Hỗ trợ mở nhanh từ trang chi tiết HV qua ?student_id=xxx
// API:
//   - GET  /api/students?search=   (tìm kiếm học viên)
//   - GET  /api/students/:id/debt  (xem công nợ)
//   - POST /api/payments            (lưu thanh toán)
// ============================================================

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api/axios";

// Format tiền VNĐ đầy đủ — dùng để hiển thị số tiền nhập vào theo thời gian thực
function formatVND(amount) {
  return Number(amount || 0).toLocaleString("vi-VN") + "đ";
}

export default function PaymentPage() {
  const location = useLocation();

  // Lấy student_id từ query string nếu điều hướng từ trang chi tiết HV
  // VD: /payments?student_id=22 → preselectedId = "22"
  const preselectedId = new URLSearchParams(location.search).get("student_id");

  // ── STATE TÌM KIẾM HỌC VIÊN ─────────────────────────────
  const [query, setQuery] = useState(""); // Từ khoá tìm kiếm
  const [results, setResults] = useState([]); // Danh sách gợi ý
  const [searching, setSearching] = useState(false);

  // ── STATE HỌC VIÊN ĐÃ CHỌN ──────────────────────────────
  const [selected, setSelected] = useState(null); // Học viên đang thu tiền
  const [debt, setDebt] = useState(null); // Thông tin công nợ của HV đó

  // ── STATE FORM THANH TOÁN ────────────────────────────────
  const [form, setForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().slice(0, 10), // Mặc định hôm nay
    payment_method: "cash", // Mặc định tiền mặt
    period: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false); // Hiện thông báo thành công
  const [error, setError] = useState("");

  // Tìm kiếm học viên theo từ khoá — debounce 350ms để tránh gọi API liên tục
  // Chỉ tìm khi nhập từ 2 ký tự trở lên
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      const fetchStudents = async () => {
        // Nếu query quá ngắn → clear kết quả
        // (đặt trong async để tránh warning setState đồng bộ trong effect)
        if (query.length < 2) {
          setResults([]);
          return;
        }

        setSearching(true);

        try {
          const res = await api.get("/students", {
            params: { search: query, status: "active", per_page: 8 },
          });

          if (!cancelled) {
            setResults(res.data.data || []);
          }
        } catch (err) {
          console.log(err);
          if (!cancelled) setResults([]);
        } finally {
          if (!cancelled) setSearching(false);
        }
      };

      fetchStudents();
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Khi chọn 1 học viên từ dropdown gợi ý:
  //   - Lưu thông tin học viên
  //   - Gọi API lấy công nợ
  //   - Điền sẵn số tiền = tổng nợ (nếu có)
  const selectStudent = async (student) => {
    setSelected(student);
    setResults([]);
    setQuery("");
    setSuccess(false);
    setError("");
    try {
      const res = await api.get(`/students/${student.id}/debt`);
      setDebt(res.data);
      // Điền sẵn số tiền bằng công nợ để nhân viên không cần tự nhập
      if (res.data.total_debt > 0) {
        setForm((prev) => ({ ...prev, amount: res.data.total_debt }));
      }
    } catch {
      setDebt(null);
    }
  };

  useEffect(() => {
    if (!preselectedId) return;
    api
      .get(`/students/${preselectedId}`)
      .then((res) => {
        // Gọi selectStudent thay vì selectStudent_id (đã có sẵn bên dưới)
        // selectStudent load thêm debt và điền sẵn số tiền
        const student = res.data.student || res.data;
        selectStudent(student);
      })
      .catch(() => {});
  }, [preselectedId]); // eslint warning: selectStudent chưa có trong deps — OK vì hàm stable

  // Lưu thanh toán → reload công nợ → reset form (giữ nguyên HV để thu nhanh)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/payments", {
        student_id: selected.id,
        ...form, // amount, payment_date, payment_method, period, notes
      });
      setSuccess(true);
      // Reload công nợ ngay sau khi lưu để thấy số nợ đã giảm
      const res = await api.get(`/students/${selected.id}/debt`);
      setDebt(res.data);
      // Reset các field nhập liệu, giữ nguyên học viên để có thể thu tiếp nếu cần
      setForm((prev) => ({ ...prev, amount: "", notes: "", period: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Lưu thất bại, thử lại!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Thanh toán">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* ── BƯỚC 1: TÌM HỌC VIÊN ── */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            1️⃣ Tìm học viên
          </h3>

          {selected ? (
            // Đã chọn học viên — hiện thông tin dạng pill + nút đổi
            <div
              className="flex items-center justify-between p-3 bg-blue-50
                            border border-blue-200 rounded-lg"
            >
              <div>
                <div className="font-semibold text-gray-800">
                  {selected.full_name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {selected.student_code} · {selected.parent_phone}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  setDebt(null);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Đổi học viên
              </button>
            </div>
          ) : (
            // Chưa chọn — hiện ô tìm kiếm + dropdown gợi ý
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập tên, SĐT hoặc mã học viên..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Dropdown gợi ý tìm kiếm */}
              {(results.length > 0 || searching) && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 bg-white border
                                border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                >
                  {searching && (
                    <div className="px-4 py-3 text-sm text-gray-400">
                      Đang tìm...
                    </div>
                  )}
                  {results.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectStudent(s)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b
                                 border-gray-100 last:border-0 transition"
                    >
                      <div className="text-sm font-medium text-gray-800">
                        {s.full_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {s.student_code} · {s.parent_phone}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── CÔNG NỢ HIỆN TẠI ─────────────────────────────
            Hiện sau khi chọn học viên
            Đỏ = còn nợ | Xanh = đã đóng đủ */}
        {debt && (
          <div
            className={`rounded-xl p-4 border ${
              debt.total_debt > 0
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Công nợ hiện tại
            </div>
            <div
              className={`text-2xl font-bold ${
                debt.total_debt > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatVND(debt.total_debt)}
            </div>
            {debt.total_debt <= 0 && (
              <div className="text-xs text-green-600 mt-1">
                ✅ Học viên đã đóng đủ tiền
              </div>
            )}
          </div>
        )}

        {/* ── BƯỚC 2: FORM NHẬP TIỀN ───────────────────────
            Chỉ hiện sau khi đã chọn học viên */}
        {selected && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold text-gray-700">
              2️⃣ Nhập khoản thu
            </h3>

            {/* Thông báo thành công */}
            {success && (
              <div
                className="bg-green-50 border border-green-200 text-green-700
                              text-sm rounded-lg px-4 py-3"
              >
                ✅ Ghi nhận thanh toán thành công!
              </div>
            )}
            {/* Thông báo lỗi */}
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700
                              text-sm rounded-lg px-4 py-3"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Số tiền — full width, hiện preview VNĐ theo thời gian thực */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  placeholder="VD: 2800000"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Hiện số tiền đã format để nhân viên dễ kiểm tra */}
                {form.amount > 0 && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    = {formatVND(form.amount)}
                  </p>
                )}
              </div>

              {/* Ngày đóng tiền */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày đóng
                </label>
                <input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, payment_date: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Hình thức thanh toán */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình thức
                </label>
                <select
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, payment_method: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">💵 Tiền mặt</option>
                  <option value="transfer">🏦 Chuyển khoản</option>
                </select>
              </div>

              {/* Kỳ học — tuỳ chọn, giúp đối soát sau này */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kỳ học{" "}
                  <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                </label>
                <input
                  type="text"
                  value={form.period}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, period: e.target.value }))
                  }
                  placeholder="VD: Tháng 4/2026, Khóa hè 2026..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ghi chú */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Ghi chú thêm nếu cần..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Nút lưu thanh toán */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                         text-white font-semibold rounded-lg py-3 text-sm transition"
            >
              {saving ? "Đang lưu..." : "💰 Ghi nhận thanh toán"}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
