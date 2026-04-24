<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    // ==================== DANH SÁCH ĐIỂM DANH ====================
    // GET /api/attendance
    // Query params:
    //   ?student_id=1      → điểm danh của 1 học viên (Student Detail dùng cái này)
    //   ?class_id=1        → điểm danh của 1 lớp
    //   ?date=2026-04-18   → điểm danh ngày cụ thể
    //   ?month=4&year=2026 → điểm danh theo tháng
    //   ?per_page=30       → số bản ghi mỗi trang (mặc định 30, nhiều hơn module khác vì điểm danh nhiều)
    public function index(Request $request)
    {
        // Load sẵn relations để FE có đủ data
        // 'student' → FE cần attendance.student.full_name
        // 'classes' → FE cần attendance.class.name (xem note đổi key bên dưới)
        $query = Attendance::with(['student', 'classes']);

        // Lọc theo học viên — dùng ở trang Student Detail
        // VD: ?student_id=5 → lấy toàn bộ lịch sử điểm danh của học viên id=5
        if ($request->student_id) {
            $query->where('student_id', $request->student_id);
        }

        // Lọc theo lớp — dùng ở trang Class Detail
        if ($request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        // Lọc theo ngày cụ thể
        // VD: ?date=2026-04-24 → chỉ lấy điểm danh ngày 24/04
        if ($request->date) {
            $query->where('date', $request->date);
        }

        // Lọc theo tháng/năm — dùng để xem tổng hợp tháng
        // VD: ?month=4&year=2026 → điểm danh tháng 4/2026
        if ($request->month && $request->year) {
            $query->whereMonth('date', $request->month)
                  ->whereYear('date', $request->year);
        }

        $attendances = $query->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 30);

        // Đổi key 'classes' → 'class' trong từng item để khớp với FE
        // FE đang đọc: attendance.class.name
        // Nhưng Eloquent trả về: attendance.classes (theo tên relationship trong Model)
        // Dùng transform() để đổi tên key mà không sửa Model hay tạo Resource riêng
        $attendances->getCollection()->transform(function ($attendance) {
            $data          = $attendance->toArray();
            $data['class'] = $data['classes'] ?? null;
            unset($data['classes']);
            return $data;
        });

        return response()->json($attendances);
    }

    // ==================== ĐIỂM DANH 1 HỌC VIÊN ====================
    // POST /api/attendance
    // Body JSON: { student_id, class_id, enrollment_id, date, status, notes }
    // Status enum: present | absent | late | excused
    public function store(Request $request)
    {
        // Status enum phải khớp với FE đang dùng:
        // present  → có mặt
        // absent   → vắng không phép
        // late     → đi trễ
        // excused  → vắng có phép (xin nghỉ)
        $request->validate([
            'student_id'    => 'required|exists:students,id',
            'class_id'      => 'required|exists:classes,id',
            'enrollment_id' => 'nullable|exists:enrollments,id',
            'date'          => 'required|date',
            'status'        => 'required|in:present,absent,late,excused',
            'notes'         => 'nullable|string',
        ]);

        // updateOrCreate: tìm theo (student_id + class_id + date)
        // Nếu đã có bản ghi rồi → update status/notes mới
        // Nếu chưa có → tạo mới
        // → Tránh trùng lặp, FE có thể gọi lại để sửa điểm danh mà không cần PUT
        $attendance = Attendance::updateOrCreate(
            [
                // Điều kiện tìm kiếm: 1 học viên chỉ có 1 bản ghi điểm danh / lớp / ngày
                'student_id' => $request->student_id,
                'class_id'   => $request->class_id,
                'date'       => $request->date,
            ],
            [
                // Dữ liệu sẽ được insert hoặc update
                'enrollment_id' => $request->enrollment_id,
                'status'        => $request->status,
                'notes'         => $request->notes,
            ]
        );

        // Load thêm relation 'classes' rồi đổi key → 'class' trước khi trả về
        // để FE nhận được attendance.class.name nhất quán với index()
        $attendance->load(['student', 'classes']);
        $data          = $attendance->toArray();
        $data['class'] = $data['classes'] ?? null;
        unset($data['classes']);

        return response()->json([
            'message'    => 'Điểm danh thành công!',
            'attendance' => $data,
        ], 201);
    }

    // ==================== ĐIỂM DANH THEO LỚP VÀ NGÀY ====================
    // GET /api/attendance/class/{classId}/date/{date}
    // Dùng cho màn hình điểm danh: chọn lớp + ngày → hiện ds học viên + trạng thái
    // Trả về cả học viên chưa điểm danh (status = null) để FE render đủ danh sách
    public function byClassDate($classId, $date)
    {
        // Load lớp kèm danh sách học viên đang studying
        // activeEnrollments: relationship trong Classes Model, chỉ lấy status = 'studying'
        $class = Classes::with([
            'activeEnrollments.student'
        ])->findOrFail($classId);

        // Lấy tất cả bản ghi điểm danh của lớp này trong ngày
        // keyBy('student_id'): đổi từ array thông thường sang array indexed theo student_id
        // → Tra cứu O(1) thay vì O(n), nhanh hơn khi lớp đông
        // VD: $attendanceRecords[5] → bản ghi điểm danh của student_id = 5
        $attendanceRecords = Attendance::where('class_id', $classId)
            ->where('date', $date)
            ->get()
            ->keyBy('student_id');

        // Ghép danh sách học viên với trạng thái điểm danh tương ứng
        $result = $class->activeEnrollments->map(function ($enrollment) use ($attendanceRecords, $date, $classId) {
            $student    = $enrollment->student;
            // Lấy bản ghi điểm danh của học viên này (null nếu chưa điểm danh)
            $attendance = $attendanceRecords->get($student->id);

            return [
                'student_id'    => $student->id,
                'student_code'  => $student->student_code,
                'full_name'     => $student->full_name,
                'enrollment_id' => $enrollment->id,
                // ?-> là null-safe operator: nếu $attendance là null thì trả null, không báo lỗi
                // FE dùng null để biết học viên chưa được điểm danh → hiển thị chưa tick
                'attendance_id' => $attendance?->id,
                'status'        => $attendance?->status ?? null,
                'notes'         => $attendance?->notes ?? null,
            ];
        });

        return response()->json([
            'class_id'   => $classId,
            'class_name' => $class->name,
            'date'       => $date,
            'students'   => $result,
        ]);
    }

    // ==================== ĐIỂM DANH HÀNG LOẠT ====================
    // POST /api/attendance/bulk
    // Body JSON: {
    //   class_id: 1,
    //   date: "2026-04-24",
    //   attendances: [
    //     { student_id: 1, enrollment_id: 1, status: "present", notes: "" },
    //     { student_id: 2, enrollment_id: 2, status: "absent",  notes: "bệnh" }
    //   ]
    // }
    // Dùng thay cho việc gọi POST /api/attendance từng người một
    public function bulk(Request $request)
    {
        // Validate nested array với cú pháp dấu chấm của Laravel
        // 'attendances.*.student_id' → field student_id bên trong từng phần tử của mảng attendances
        $request->validate([
            'class_id'                    => 'required|exists:classes,id',
            'date'                        => 'required|date',
            'attendances'                 => 'required|array',
            'attendances.*.student_id'    => 'required|exists:students,id',
            'attendances.*.enrollment_id' => 'nullable|exists:enrollments,id',
            // Status enum khớp với FE: present | absent | late | excused
            'attendances.*.status'        => 'required|in:present,absent,late,excused',
            'attendances.*.notes'         => 'nullable|string',
        ]);

        $results = [];

        foreach ($request->attendances as $item) {
            // updateOrCreate cho từng học viên — logic giống store() đơn lẻ
            // Đảm bảo không tạo trùng nếu FE gọi bulk nhiều lần cùng ngày
            $attendance = Attendance::updateOrCreate(
                [
                    'student_id' => $item['student_id'],
                    'class_id'   => $request->class_id,
                    'date'       => $request->date,
                ],
                [
                    'enrollment_id' => $item['enrollment_id'] ?? null,
                    'status'        => $item['status'],
                    'notes'         => $item['notes'] ?? null,
                ]
            );
            $results[] = $attendance;
        }

        return response()->json([
            'message'     => 'Điểm danh cả lớp thành công!',
            'count'       => count($results), // FE có thể dùng để confirm "đã điểm danh X người"
            'attendances' => $results,
        ], 201);
    }

    // ==================== CẬP NHẬT ĐIỂM DANH ====================
    // PUT /api/attendance/{id}
    // Dùng khi cần sửa trạng thái đã nhập (VD: absent → excused sau khi phụ huynh báo)
    public function update(Request $request, Attendance $attendance)
    {
        // only(['status', 'notes']): chỉ cho phép update 2 field này
        // Không dùng $request->all() để tránh FE vô tình override student_id/date
        $request->validate([
            'status' => 'sometimes|in:present,absent,late,excused',
            'notes'  => 'nullable|string',
        ]);

        $attendance->update($request->only(['status', 'notes']));

        return response()->json([
            'message'    => 'Cập nhật điểm danh thành công!',
            'attendance' => $attendance,
        ]);
    }

    // ==================== XÓA ĐIỂM DANH ====================
    // DELETE /api/attendance/{id}
    // Dùng khi nhập nhầm cần xóa hoàn toàn bản ghi
    public function destroy(Attendance $attendance)
    {
        // Attendance thường không có SoftDeletes vì không cần khôi phục
        // Xóa thật luôn cho gọn
        $attendance->delete();

        return response()->json([
            'message' => 'Đã xóa điểm danh!'
        ]);
    }
}