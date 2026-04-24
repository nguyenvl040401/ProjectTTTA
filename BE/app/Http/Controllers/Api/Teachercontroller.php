<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    // ==================== DANH SÁCH GIÁO VIÊN ====================
    // GET /api/teachers
    // Query params:
    //   ?search=tên        → tìm theo tên hoặc SĐT
    //   ?per_page=15       → số giáo viên mỗi trang (mặc định 15)
    //   ?page=2            → trang số mấy
    public function index(Request $request)
    {
        // withCount: đếm số lớp active của từng giáo viên
        // Kết quả sẽ tự thêm field "classes_count" vào mỗi object Teacher
        // FE dùng field này để hiển thị "đang phụ trách X lớp"
        $query = Teacher::withCount([
            'classes as classes_count' => function ($q) {
                // Chỉ đếm lớp chưa bị xóa VÀ đang active
                // Không đếm lớp đã kết thúc hoặc bị xóa mềm
                $q->whereNull('deleted_at')->where('status', 'active');
            }
        ]);

        // Tìm kiếm theo tên hoặc số điện thoại
        // VD: ?search=Lan → tìm "Nguyễn Thị Lan" hoặc SĐT chứa "Lan"
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Phân trang - mặc định 15 giáo viên/trang nếu FE không truyền per_page
        $perPage  = $request->get('per_page', 15);
        $teachers = $query->paginate($perPage);

        // paginate() tự trả về object có: data[], current_page, last_page, total...
        // FE dùng các field này để render thanh phân trang
        return response()->json($teachers);
    }

    // ==================== CHI TIẾT 1 GIÁO VIÊN ====================
    // GET /api/teachers/{id}
    // Trả về thông tin đầy đủ của 1 giáo viên kèm số lớp đang dạy
    public function show($id)
    {
        // findOrFail: tự trả 404 nếu không tìm thấy, không cần if/else thủ công
        $teacher = Teacher::withCount([
            'classes as classes_count' => function ($q) {
                $q->whereNull('deleted_at')->where('status', 'active');
            }
        ])->findOrFail($id);

        // Wrap trong key 'teacher' để FE destructure nhất quán
        // VD: const { teacher } = await api.get('/teachers/1')
        return response()->json(['teacher' => $teacher]);
    }

    // ==================== THÊM GIÁO VIÊN MỚI ====================
    // POST /api/teachers
    // Body JSON: { full_name, phone, notes, is_active }
    public function store(Request $request)
    {
        // validate: kiểm tra dữ liệu đầu vào trước khi lưu
        // Nếu sai → Laravel tự trả 422 Unprocessable Entity kèm danh sách lỗi
        // FE dùng lỗi đó để hiển thị dưới từng input field
        $validated = $request->validate([
            'full_name' => 'required|string|max:255', // bắt buộc
            'phone'     => 'nullable|string|max:20',  // không bắt buộc
            'notes'     => 'nullable|string',          // không bắt buộc
            'is_active' => 'boolean',                  // true/false, mặc định true trong DB
        ]);

        // Chỉ lưu các field đã được validate, không lưu thẳng $request->all()
        // để tránh mass assignment vulnerability (bảo mật)
        $teacher = Teacher::create($validated);

        // 201 Created: đúng HTTP status cho việc tạo mới thành công
        return response()->json(['teacher' => $teacher], 201);
    }

    // ==================== CẬP NHẬT GIÁO VIÊN ====================
    // PUT /api/teachers/{id}
    // Body JSON: các field muốn cập nhật (không cần gửi hết)
    public function update(Request $request, $id)
    {
        $teacher = Teacher::findOrFail($id);

        // 'sometimes': chỉ validate field đó nếu FE có gửi lên
        // Khác với 'required': không gửi cũng không báo lỗi
        // → FE có thể gửi 1 field hoặc nhiều field tùy ý
        $validated = $request->validate([
            'full_name' => 'sometimes|required|string|max:255',
            'phone'     => 'nullable|string|max:20',
            'notes'     => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $teacher->update($validated);

        return response()->json(['teacher' => $teacher]);
    }

    // ==================== XÓA GIÁO VIÊN ====================
    // DELETE /api/teachers/{id}
    // Xóa mềm (soft delete) - chỉ set deleted_at, không mất data thật
    // Có thể khôi phục lại nếu xóa nhầm
    public function destroy($id)
    {
        $teacher = Teacher::findOrFail($id);

        // Kiểm tra giáo viên có đang phụ trách lớp nào không
        // Nếu có → từ chối xóa và báo lý do rõ ràng cho FE show alert
        $activeCount = $teacher->classes()
            ->whereNull('deleted_at')    // lớp chưa bị xóa
            ->where('status', 'active')  // lớp đang active
            ->count();

        if ($activeCount > 0) {
            // 422 Unprocessable Entity: request hợp lệ nhưng không thể xử lý
            // vì vi phạm business rule (đang có lớp)
            // FE đang show message này trực tiếp trong alert → cần rõ ràng
            return response()->json([
                'message' => "Không thể xóa giáo viên đang phụ trách {$activeCount} lớp học. Vui lòng chuyển lớp sang giáo viên khác trước."
            ], 422);
        }

        // delete() với SoftDeletes sẽ set deleted_at = now()
        // Không xóa row khỏi DB, các query bình thường sẽ tự bỏ qua record này
        $teacher->delete();

        return response()->json(['message' => 'Xóa giáo viên thành công.']);
    }
}