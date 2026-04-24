// ============================================================
// FILE: src/components/ui/Pagination.jsx
// MỤC ĐÍCH: Component phân trang — dùng với Laravel Paginator.
//   Hiển thị nút Trước/Tiếp và các số trang.
//   Tự động rút gọn dãy trang dài bằng dấu "..."
// PROPS:
//   - currentPage  : number   — trang hiện tại
//   - lastPage     : number   — tổng số trang
//   - onPageChange : function — callback khi chọn trang (nhận số trang mới)
// CÁCH DÙNG:
//   <Pagination currentPage={1} lastPage={7} onPageChange={setPage} />
// ============================================================

export default function Pagination({ currentPage, lastPage, onPageChange }) {
  // Không hiển thị phân trang nếu chỉ có 1 trang
  if (lastPage <= 1) return null;

  // Tạo mảng số trang cần hiển thị
  // Luôn hiện trang 1, trang cuối, và các trang xung quanh trang hiện tại (±1)
  // Các khoảng trống thay bằng '...'
  // Ví dụ: currentPage=5, lastPage=10 → [1, '...', 4, 5, 6, '...', 10]
  const pages = [];
  for (let i = 1; i <= lastPage; i++) {
    if (
      i === 1 || // Luôn hiện trang đầu
      i === lastPage || // Luôn hiện trang cuối
      (i >= currentPage - 1 && i <= currentPage + 1) // Trang xung quanh trang hiện tại
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      // Chỉ thêm '...' nếu phần tử trước chưa phải '...' (tránh '...' liên tiếp)
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      {/* Nút "← Trước" — disabled khi đang ở trang đầu */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600
                   hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        ← Trước
      </button>

      {/* Các số trang */}
      {pages.map((page, idx) =>
        page === "..." ? (
          // Dấu "..." không click được
          <span key={`dots-${idx}`} className="px-2 text-gray-400">
            ...
          </span>
        ) : (
          // Số trang — trang hiện tại có nền xanh, trang khác có viền xám
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 text-sm rounded-lg border transition
                ${
                  page === currentPage
                    ? "bg-blue-600 text-white border-blue-600 font-semibold" // Trang đang xem
                    : "border-gray-200 text-gray-600 hover:bg-gray-50" // Trang khác
                }`}
          >
            {page}
          </button>
        ),
      )}

      {/* Nút "Tiếp →" — disabled khi đang ở trang cuối */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600
                   hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Tiếp →
      </button>
    </div>
  );
}
