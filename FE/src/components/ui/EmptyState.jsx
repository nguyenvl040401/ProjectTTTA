// ============================================================
// FILE: src/components/ui/EmptyState.jsx
// MỤC ĐÍCH: Hiển thị khi danh sách trống — dùng lại ở mọi trang.
//   Thay vì để trang trắng hoặc bảng rỗng, hiện icon + thông báo thân thiện.
// PROPS:
//   - icon   : string      — emoji icon (mặc định '📭')
//   - title  : string      — tiêu đề thông báo
//   - desc   : string      — mô tả thêm (tuỳ chọn)
//   - action : ReactNode   — nút hành động, ví dụ nút "Thêm mới" (tuỳ chọn)
// CÁCH DÙNG:
//   <EmptyState
//     icon="🎓"
//     title="Chưa có học viên nào"
//     desc="Bấm nút bên dưới để thêm học viên đầu tiên"
//     action={<button>Thêm học viên</button>}
//   />
// ============================================================

export default function EmptyState({ icon = "📭", title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {/* Mô tả — chỉ hiện nếu có truyền vào */}
      {desc && <p className="text-sm text-gray-400 mb-4">{desc}</p>}
      {/* Nút hành động — chỉ hiện nếu có truyền vào */}
      {action}
    </div>
  );
}
