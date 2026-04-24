<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classes;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClassController extends Controller
{
    // ==================== DANH SÁCH LỚP HỌC ====================
    // GET /api/classes
    // Query params:
    //   ?search=tên        → tìm theo tên lớp hoặc mã lớp
    //   ?status=active     → lọc theo trạng thái (upcoming/active/finished)
    //   ?level=Movers      → lọc theo cấp độ
    //   ?per_page=15       → số lớp mỗi trang (mặc định 15)
    public function index(Request $request)
    {
        // with('teacher'): load sẵn thông tin giáo viên cho từng lớp
        // Tránh N+1 query (nếu không dùng with(), mỗi lớp sẽ query DB 1 lần để lấy teacher)
        // VD: 20 lớp → 1 query lớp + 1 query teacher, thay vì 1 + 20 queries
        $query = Classes::with('teacher');

        // Tìm kiếm theo tên lớp hoặc mã lớp
        // VD: ?search=Movers → tìm lớp tên "Movers 2" hoặc mã "MV-2026-A"
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('class_code', 'like', "%{$request->search}%");
            });
        }

        // Lọc theo trạng thái lớp
        // upcoming: chưa khai giảng | active: đang học | finished: đã kết thúc
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Lọc theo cấp độ học
        // VD: ?level=Movers → chỉ lấy lớp Movers
        if ($request->level) {
            $query->where('level', $request->level);
        }

        $classes = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        // Append computed attributes vào từng object trong paginated collection
        // fill_rate: % lấp đầy lớp (VD: 75%)
        // current_students: số học viên đang học thực tế
        // Hai field này được tính động từ Model, không lưu trong DB
        // IDE có thể báo warning "assign to same variable" nhưng không phải lỗi —
        // Laravel đọc từ getFillRateAttribute() và getCurrentStudentsAttribute() trong Model
        $classes->getCollection()->transform(function ($class) {
            $class->fill_rate        = $class->fill_rate;
            $class->current_students = $class->current_students;
            return $class;
        });

        return response()->json($classes);
    }

    // ==================== THÊM LỚP MỚI ====================
    // POST /api/classes
    // Body JSON: name, level, fee_per_course, teacher_id, schedule...
    public function store(Request $request)
    {
        // exists:teachers,id → kiểm tra teacher_id phải có trong bảng teachers
        // after:start_date   → end_date phải sau start_date
        $request->validate([
            'name'           => 'required|string|max:255',
            'level'          => 'required|string|max:100',
            'fee_per_course' => 'required|numeric|min:0',
            'teacher_id'     => 'nullable|exists:teachers,id',
            'schedule'       => 'nullable|string|max:255',
            'room'           => 'nullable|string|max:100',
            'max_students'   => 'nullable|integer|min:1',
            'total_sessions' => 'nullable|integer|min:1',
            'start_date'     => 'nullable|date',
            'end_date'       => 'nullable|date|after:start_date',
            'status'         => 'nullable|in:upcoming,active,finished',
            'notes'          => 'nullable|string',
        ]);

        $class = Classes::create([
            ...$request->all(),
            // Tự động sinh mã lớp dựa theo level + năm + chữ cái thứ tự
            // VD: level "Movers" → mã "MV-2026-A"
            'class_code' => $this->generateClassCode($request->level),
            // Mặc định upcoming nếu FE không gửi status
            'status'     => $request->status ?? 'upcoming',
        ]);

        return response()->json([
            'message' => 'Tạo lớp thành công!',
            // load('teacher'): đính kèm object teacher đầy đủ vào response
            // FE cần teacher.full_name ngay sau khi tạo, không cần gọi thêm API
            'class'   => $class->load('teacher'),
        ], 201);
    }

    // ==================== CHI TIẾT LỚP ====================
    // GET /api/classes/{id}
    // FE dùng để hiển thị trang Class Detail
    // Response phải có: teacher object, level, max_students, fill_rate, current_students
    public function show(Classes $class)
    {
        // load(): eager load relationships — tương tự with() nhưng dùng sau khi đã có model
        // 'teacher'                   → object giáo viên đầy đủ (FE cần teacher.id + teacher.full_name)
        // 'activeEnrollments.student' → danh sách enrollment đang studying, kèm info học viên
        $class->load([
            'teacher',
            'activeEnrollments.student',
        ]);

        // Gán computed attributes vào object trước khi trả về
        // fill_rate: % lấp đầy, VD 15/20 chỗ → 75
        // current_students: số học viên thực tế đang studying
        // FE dùng current_students >= max_students để check "lớp đầy"
        $class->fill_rate        = $class->fill_rate;
        $class->current_students = $class->current_students;

        // Toàn bộ data nằm trong key 'class' để FE destructure nhất quán:
        // const { class: classData } = await api.get('/classes/1')
        return response()->json([
            'class' => $class,
        ]);
    }

    // ==================== CẬP NHẬT LỚP ====================
    // PUT /api/classes/{id}
    // FE có thể gửi 1 hoặc nhiều field tùy ý nhờ 'sometimes'
    public function update(Request $request, Classes $class)
    {
        // 'sometimes': chỉ validate nếu field được gửi lên
        // → FE không cần gửi đủ tất cả field, chỉ gửi field muốn thay đổi
        $request->validate([
            'name'           => 'sometimes|string|max:255',
            'level'          => 'sometimes|string|max:100',
            'fee_per_course' => 'sometimes|numeric|min:0',
            'teacher_id'     => 'nullable|exists:teachers,id',
            'schedule'       => 'nullable|string|max:255',
            'room'           => 'nullable|string|max:100',
            'max_students'   => 'nullable|integer|min:1',
            'total_sessions' => 'nullable|integer|min:1',
            'start_date'     => 'nullable|date',
            'end_date'       => 'nullable|date',
            'status'         => 'nullable|in:upcoming,active,finished',
            'notes'          => 'nullable|string',
        ]);

        $class->update($request->all());

        return response()->json([
            'message' => 'Cập nhật lớp thành công!',
            // Trả về kèm teacher object để FE cập nhật UI không cần gọi thêm API
            'class'   => $class->load('teacher'),
        ]);
    }

    // ==================== XÓA LỚP ====================
    // DELETE /api/classes/{id}
    // Xóa mềm — chỉ set deleted_at, không mất data thật
    // Bị chặn nếu lớp còn học viên đang học
    public function destroy(Classes $class)
    {
        // Kiểm tra business rule: không xóa lớp đang có học viên studying
        // activeEnrollments() là relationship trong Model, chỉ lấy status = 'studying'
        if ($class->activeEnrollments()->count() > 0) {
            // 422: request hợp lệ nhưng vi phạm nghiệp vụ
            return response()->json([
                'message' => 'Không thể xóa lớp đang có học viên!'
            ], 422);
        }

        // SoftDelete: set deleted_at = now(), record vẫn còn trong DB
        // Các query bình thường tự bỏ qua record đã soft delete
        $class->delete();

        return response()->json([
            'message' => 'Đã xóa lớp!'
        ]);
    }

    // ==================== PRIVATE METHODS ====================

    // Tự động tạo mã lớp theo format: {2 chữ đầu của level}-{năm}-{chữ cái thứ tự}
    // VD: level="Movers" → prefix="MO", đã có 0 lớp → mã = "MO-2026-A"
    //     level="Movers" → prefix="MO", đã có 1 lớp → mã = "MO-2026-B"
    //     level="Flyers" → prefix="FL", đã có 2 lớp → mã = "FL-2026-C"
    private function generateClassCode($level)
    {
        // Lấy 2 chữ cái đầu của level, viết hoa
        // VD: "Movers" → "MO", "Starters" → "ST"
        $prefix = strtoupper(Str::substr($level, 0, 2)) . '-' . now()->year . '-';

        // Đếm số lớp đã có cùng prefix (kể cả đã xóa mềm) để không bị trùng mã
        $count = Classes::where('class_code', 'like', "{$prefix}%")->count();

        // Chuyển số thứ tự thành chữ cái: 0→A, 1→B, 2→C...
        // chr(65) = 'A', chr(66) = 'B'...
        $letter = chr(65 + $count);

        return $prefix . $letter;
    }
}