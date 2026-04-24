<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Classes;
use App\Models\Student;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    // ==================== DANH SÁCH ENROLLMENT ====================
    // GET /api/enrollments
    // Query params:
    //   ?student_id=1      → lấy tất cả enrollment của 1 học viên
    //   ?class_id=1        → lấy tất cả enrollment của 1 lớp (FE Class Detail dùng cái này)
    //   ?status=studying   → lọc theo trạng thái
    //   ?per_page=15       → số bản ghi mỗi trang (mặc định 15)
    public function index(Request $request)
    {
        // Load sẵn relations để FE có đủ data mà không cần gọi thêm API
        // 'student'         → FE cần enrollment.student.full_name
        // 'classes.teacher' → FE cần enrollment.class.name (xem note đổi tên bên dưới)
        $query = Enrollment::with(['student', 'classes.teacher']);

        // Lọc theo học viên — dùng ở trang Student Detail
        if ($request->student_id) {
            $query->where('student_id', $request->student_id);
        }

        // Lọc theo lớp — dùng ở trang Class Detail để lấy ds học viên trong lớp
        if ($request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        // Lọc theo trạng thái
        // studying: đang học | left: đã nghỉ | paused: tạm dừng | completed: hoàn thành
        if ($request->status) {
            $query->where('status', $request->status);
        }

        $enrollments = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($enrollments);
    }

    // ==================== XẾP LỚP CHO HỌC VIÊN ====================
    // POST /api/enrollments
    // Body JSON: { student_id, class_id, enrolled_date, discount, notes }
    public function store(Request $request)
    {
        // exists:students,id → đảm bảo student_id phải có thật trong DB
        // exists:classes,id  → đảm bảo class_id phải có thật trong DB
        $request->validate([
            'student_id'    => 'required|exists:students,id',
            'class_id'      => 'required|exists:classes,id',
            'enrolled_date' => 'required|date',
            'custom_fee'    => 'nullable|numeric|min:0',
            'discount'      => 'nullable|numeric|min:0|max:100',
            'notes'         => 'nullable|string',
            'status'        => 'nullable|in:studying,left,paused,completed',
        ]);

        // ── BUSINESS RULE 1: Không enroll học viên inactive ──────────────
        // FE yêu cầu BE enforce rule này — không chỉ validate ở FE
        // findOrFail tự trả 404 nếu student không tồn tại
        $student = Student::findOrFail($request->student_id);

        if ($student->status !== 'active') {
            return response()->json([
                'message' => 'Học viên đang không hoạt động, không thể xếp lớp!'
            ], 422);
        }

        // ── BUSINESS RULE 2: Không enroll trùng ──────────────────────────
        // Trùng = cùng student_id + class_id + status đang là 'studying'
        // Cho phép enroll lại nếu trước đó đã left/paused/completed
        $exists = Enrollment::where('student_id', $request->student_id)
            ->where('class_id', $request->class_id)
            ->where('status', 'studying')
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Học viên đã có trong lớp này!'
            ], 422);
        }

        // ── BUSINESS RULE 3: Không enroll nếu lớp đầy ───────────────────
        // current_students: số học viên đang studying (getter trong Model)
        // max_students: sĩ số tối đa của lớp (lưu trong DB)
        // FE cũng check cái này ở UI, nhưng BE phải check lại để đảm bảo
        $class = Classes::findOrFail($request->class_id);

        if ($class->max_students && $class->current_students >= $class->max_students) {
            return response()->json([
                'message' => 'Lớp đã đủ sĩ số, không thể thêm học viên!'
            ], 422);
        }

        $enrollment = Enrollment::create([
            ...$request->all(),
            'status'   => 'studying', // luôn bắt đầu bằng studying dù FE có gửi status khác
            'discount' => $request->discount ?? 0,
        ]);

        // Load đầy đủ relations trước khi trả về
        // FE dùng enrollment full object để cập nhật UI mà không cần reload trang
        // enrollment.student.full_name → hiển thị tên học viên
        // enrollment.class.name       → hiển thị tên lớp
        // Note: relationship trong Model tên là 'classes' nhưng FE đọc key 'class'
        //       nên dùng loadMissing + đổi tên key thủ công ở dưới
        $enrollment->load(['student', 'classes']);

        // Đổi key 'classes' → 'class' để khớp với FE đang dùng enrollment.class.name
        // Không sửa tên relationship trong Model để tránh ảnh hưởng chỗ khác
        $data              = $enrollment->toArray();
        $data['class']     = $data['classes'] ?? null;
        unset($data['classes']);

        return response()->json([
            'message'    => 'Xếp lớp thành công!',
            'enrollment' => $data,
        ], 201);
    }

    // ==================== CHI TIẾT ENROLLMENT ====================
    // GET /api/enrollments/{id}
    public function show(Enrollment $enrollment)
    {
        // Load thêm payments để xem lịch sử đóng tiền của enrollment này
        $enrollment->load(['student', 'classes.teacher', 'payments']);

        // actual_fee: học phí thực tế sau khi trừ discount
        // Được tính động trong Model, không lưu DB
        return response()->json([
            'enrollment' => $enrollment,
            'actual_fee' => $enrollment->actual_fee,
        ]);
    }

    // ==================== CẬP NHẬT ENROLLMENT ====================
    // PUT /api/enrollments/{id}
    // Dùng khi: đổi trạng thái (left/paused/completed), cập nhật học phí, ghi chú
    public function update(Request $request, Enrollment $enrollment)
    {
        // 'sometimes': chỉ validate field nếu được gửi lên
        // FE có thể gửi 1 field duy nhất, VD: chỉ đổi status
        $request->validate([
            'status'     => 'sometimes|in:studying,left,paused,completed',
            'left_date'  => 'nullable|date',
            'custom_fee' => 'nullable|numeric|min:0',
            'discount'   => 'nullable|numeric|min:0|max:100',
            'notes'      => 'nullable|string',
        ]);

        // Tự động set left_date = hôm nay nếu:
        // - Đổi sang trạng thái left hoặc paused
        // - FE không gửi left_date lên
        // - Enrollment chưa có left_date trước đó
        if (
            in_array($request->status, ['left', 'paused'])
            && !$request->left_date
            && !$enrollment->left_date
        ) {
            // IDE có thể báo warning kiểu dữ liệu string vs date — không phải lỗi thật
            // Laravel tự convert string → Carbon thông qua $casts trong Model
            // toDateString() → "2026-04-24" đúng format MySQL date
            $enrollment->left_date = now()->toDateString();
        }

        $enrollment->update($request->all());

        return response()->json([
            'message'    => 'Cập nhật thành công!',
            'enrollment' => $enrollment->load(['student', 'classes']),
        ]);
    }

    // ==================== XÓA ENROLLMENT ====================
    // DELETE /api/enrollments/{id}
    // Bị chặn nếu đã có lịch sử thanh toán liên quan
    public function destroy(Enrollment $enrollment)
    {
        // Không cho xóa nếu đã có payments — tránh mất lịch sử tài chính
        // payments() là relationship trong Enrollment Model
        if ($enrollment->payments()->count() > 0) {
            return response()->json([
                'message' => 'Không thể xóa vì đã có lịch sử thanh toán!'
            ], 422);
        }

        // Enrollment dùng SoftDeletes → chỉ set deleted_at, không mất data
        $enrollment->delete();

        return response()->json([
            'message' => 'Đã xóa enrollment!'
        ]);
    }
}