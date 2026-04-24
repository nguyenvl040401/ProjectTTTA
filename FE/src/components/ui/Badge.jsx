// ============================================================
// FILE: src/components/ui/Badge.jsx
// MỤC ĐÍCH: Tag hiển thị trạng thái — dùng lại ở nhiều trang.
//   Tự chọn màu sắc và nhãn dựa vào prop `status`.
// PROPS:
//   - status : string — mã trạng thái (xem danh sách variants bên dưới)
//   - custom : string — nhãn tuỳ chỉnh, ghi đè nhãn mặc định nếu truyền vào
// CÁCH DÙNG:
//   <Badge status="active" />           → hiển thị "Đang học" màu xanh lá
//   <Badge status="active" custom="KET" /> → hiển thị "KET" màu xanh lá
// ============================================================

// Màu nền + màu chữ tương ứng với từng trạng thái
const variants = {
  active: "bg-green-100 text-green-700",
  studying: "bg-green-100 text-green-700",
  present: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  left: "bg-gray-100 text-gray-500",
  absent: "bg-red-100 text-red-600",
  paused: "bg-yellow-100 text-yellow-700",
  makeup: "bg-blue-100 text-blue-600",
  upcoming: "bg-blue-100 text-blue-600",
  full: "bg-red-100 text-red-600",
};

// Nhãn tiếng Việt mặc định cho từng trạng thái
const labels = {
  active: "Đang học",
  studying: "Đang học",
  inactive: "Đã nghỉ",
  left: "Đã nghỉ",
  paused: "Tạm dừng",
  present: "Có mặt",
  absent: "Vắng",
  makeup: "Học bù",
  upcoming: "Sắp khai giảng",
  full: "Đã đầy",
};

export default function Badge({ status, custom }) {
  // Lấy class màu — fallback về xám nếu status không có trong danh sách
  const cls = variants[status] || "bg-gray-100 text-gray-500";
  // Ưu tiên custom label, nếu không có thì dùng label mặc định, fallback là chính status
  const text = custom || labels[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {text}
    </span>
  );
}
