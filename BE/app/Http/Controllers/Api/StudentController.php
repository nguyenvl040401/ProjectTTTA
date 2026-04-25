<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    // ==================== DANH SÁCH HỌC VIÊN ====================
    // GET /api/students
    // Query params:
    //   ?search=tên        → tìm theo tên, mã, SĐT phụ huynh
    //   ?status=active     → lọc theo trạng thái
    //   ?per_page=15       → số học viên mỗi trang (mặc định 15)
    public function index(Request $request)
    {
        $query = Student::query();

        // Tìm kiếm theo tên, mã học viên, SĐT phụ huynh
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('full_name', 'like', "%{$request->search}%")
                  ->orWhere('student_code', 'like', "%{$request->search}%")
                  ->orWhere('parent_phone', 'like', "%{$request->search}%");
            });
        }

        // Lọc theo trạng thái: active / inactive / paused
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Sắp xếp mới nhất lên đầu, phân trang
        $students = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($students);
    }

    // ==================== THÊM HỌC VIÊN MỚI ====================
    // POST /api/students
    // Body: thông tin học viên
    public function store(Request $request)
    {
        // Validate dữ liệu đầu vào
        $request->validate([
            'full_name'       => 'required|string|max:255',
            'parent_phone'    => 'required|string|max:20',
            'enrollment_date' => 'required|date',
            'dob'             => 'nullable|date',
            'parent_name'     => 'nullable|string|max:255',
            'email'           => 'nullable|email|max:255',
            'start_date'      => 'nullable|date',
            'entry_level'     => 'nullable|string|max:100',
            'status'          => 'nullable|in:active,inactive,paused',
            'notes'           => 'nullable|string',
        ]);

        // Tự động tạo mã học viên: HV-2026-001
        $student = Student::create([
            ...$request->all(),
            'student_code' => $this->generateStudentCode(),
            'status'       => $request->status ?? 'active',
        ]);

        return response()->json([
            'message' => 'Thêm học viên thành công!',
            'student' => $student,
        ], 201);
    }

    // ==================== CHI TIẾT HỌC VIÊN ====================
    // GET /api/students/{id}
    // Trả về thông tin đầy đủ kèm lịch sử
    public function show(Student $student)
    {
        $student->load([
            'enrollments.classes.teacher', // lớp đang/đã học kèm giáo viên
            'payments',                    // lịch sử đóng tiền
        ]);

        // Đổi key 'classes' → 'class' trong từng enrollment
        // FE đang đọc en.class?.name nhưng Eloquent trả về key 'classes'
        // theo tên relationship — đổi ở đây để không sửa Model
        $student->enrollments->transform(function ($enrollment) {
            $data          = $enrollment->toArray();
            $data['class'] = $data['classes'] ?? null;
            unset($data['classes']);
            return $data;
        });

        return response()->json([
            'student' => $student,
            'debt'    => $student->debt,
        ]);
    }

    // ==================== CẬP NHẬT HỌC VIÊN ====================
    // PUT /api/students/{id}
    public function update(Request $request, Student $student)
    {
        $request->validate([
            'full_name'       => 'sometimes|string|max:255',
            'parent_phone'    => 'sometimes|string|max:20',
            'enrollment_date' => 'sometimes|date',
            'dob'             => 'nullable|date',
            'parent_name'     => 'nullable|string|max:255',
            'email'           => 'nullable|email|max:255',
            'start_date'      => 'nullable|date',
            'entry_level'     => 'nullable|string|max:100',
            'status'          => 'nullable|in:active,inactive,paused',
            'left_date'       => 'nullable|date',
            'left_reason'     => 'nullable|string|max:255',
            'notes'           => 'nullable|string',
        ]);

        $student->update($request->all());

        return response()->json([
            'message' => 'Cập nhật học viên thành công!',
            'student' => $student,
        ]);
    }

    // ==================== XÓA HỌC VIÊN ====================
    // DELETE /api/students/{id}
    // Xóa mềm - không xóa thật khỏi database
    public function destroy(Student $student)
    {
        $student->delete();

        return response()->json([
            'message' => 'Đã xóa học viên!'
        ]);
    }

    // ==================== CÔNG NỢ HỌC VIÊN ====================
    // GET /api/students/{id}/debt
    // Trả về chi tiết công nợ của học viên
    public function debt(Student $student)
    {
        $student->load('enrollments.classes', 'payments');

        return response()->json([
            'student_code' => $student->student_code,
            'full_name'    => $student->full_name,
            'total_debt'         => $student->debt,
            'payments'     => $student->payments,
        ]);
    }

    // ==================== PRIVATE METHODS ====================

    // Tự động tạo mã học viên theo format: HV-{năm}-{số thứ tự 3 chữ số}
    // VD: HV-2026-001, HV-2026-002...
    private function generateStudentCode()
    {
        $year    = now()->year;
        $prefix  = "HV-{$year}-";

        // Lấy số thứ tự lớn nhất hiện tại
        $last = Student::where('student_code', 'like', "{$prefix}%")
            ->orderBy('student_code', 'desc')
            ->first();

        $number = $last
            ? (int) Str::afterLast($last->student_code, '-') + 1
            : 1;

        return $prefix . str_pad($number, 3, '0', STR_PAD_LEFT);
    }
}