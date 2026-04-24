<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Classes;
use App\Models\Payment;
use App\Models\Attendance;
use App\Models\Enrollment;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    // ==================== DASHBOARD TỔNG HỢP ====================
    // GET /api/dashboard
    // Tất cả số liệu tự tính, không nhập tay
    // React gọi 1 lần duy nhất, lấy hết tất cả KPI
    public function index()
    {
        $now = Carbon::now();

        return response()->json([
            // ========== HỌC VIÊN ==========
            'students' => [
                // Tổng số học viên (không tính đã xóa)
                'total'        => Student::count(),

                // Học viên đang học
                'active'       => Student::where('status', 'active')->count(),

                // Học viên đã nghỉ
                'inactive'     => Student::where('status', 'inactive')->count(),

                // Học viên đang bảo lưu
                'paused'       => Student::where('status', 'paused')->count(),

                // Học viên mới đăng ký trong tháng này
                'new_this_month' => Student::whereMonth('enrollment_date', $now->month)
                    ->whereYear('enrollment_date', $now->year)
                    ->count(),
            ],

            // ========== TÀI CHÍNH ==========
            'finance' => [
                // Tổng tiền đã thu từ trước đến nay
                'total_revenue' => Payment::sum('amount'),

                // Doanh thu tháng này
                'revenue_this_month' => Payment::whereMonth('payment_date', $now->month)
                    ->whereYear('payment_date', $now->year)
                    ->sum('amount'),

                // Doanh thu tháng trước (để so sánh tăng/giảm)
                'revenue_last_month' => Payment::whereMonth('payment_date', $now->subMonth()->month)
                    ->whereYear('payment_date', $now->subMonth()->year)
                    ->sum('amount'),

                // Tổng công nợ toàn trung tâm
                'total_debt' => $this->calcTotalDebt(),
            ],

            // ========== CHUYÊN CẦN ==========
            'attendance' => [
                // Tỷ lệ đi học tuần này (%)
                'rate_this_week' => $this->calcAttendanceRate(
                    $now->startOfWeek(),
                    $now->endOfWeek()
                ),

                // Tỷ lệ đi học tháng này (%)
                'rate_this_month' => $this->calcAttendanceRate(
                    $now->startOfMonth(),
                    $now->endOfMonth()
                ),
            ],

            // ========== LỚP HỌC ==========
            'classes' => [
                // Tổng số lớp đang hoạt động
                'total_active' => Classes::where('status', 'active')->count(),

                // Số lớp đã đầy (fill_rate = 100%)
                'full_classes' => $this->countFullClasses(),

                // Danh sách lớp kèm % lấp đầy
                'fill_rates'   => $this->getClassFillRates(),
            ],

            // ========== CẢNH BÁO CHỦ ĐỘNG ==========
            // Những việc cần xử lý ngay hôm nay
            'alerts' => [
                // Học viên nợ tiền quá 7 ngày
                'debt_overdue'   => $this->getOverdueDebt(7),

                // Học viên vắng liên tiếp >= 3 buổi
                'absent_streak'  => $this->getAbsentStreak(3),
            ],
        ]);
    }

    // ==================== PRIVATE METHODS ====================
    // Các hàm tính toán nội bộ, không gọi từ ngoài

    // Tính tổng công nợ toàn trung tâm
    // = tổng học phí tất cả enrollment đang học - tổng đã đóng
    private function calcTotalDebt()
    {
        $totalFee = Enrollment::where('status', 'studying')
            ->with('classes')
            ->get()
            ->sum(function ($enrollment) {
                if ($enrollment->custom_fee) {
                    return $enrollment->custom_fee;
                }
                return $enrollment->classes->fee_per_course
                    * (1 - $enrollment->discount / 100);
            });

        $totalPaid = Payment::sum('amount');

        return $totalFee - $totalPaid;
    }

    // Tính tỷ lệ đi học trong khoảng thời gian
    // = số buổi có mặt / tổng số buổi * 100
    private function calcAttendanceRate($from, $to)
    {
        $total = Attendance::whereBetween('date', [$from, $to])->count();

        if ($total === 0) return 0;

        $present = Attendance::whereBetween('date', [$from, $to])
            ->where('status', 'present')
            ->count();

        return round($present / $total * 100, 1);
    }

    // Đếm số lớp đã đầy
    private function countFullClasses()
    {
        return Classes::where('status', 'active')
            ->get()
            ->filter(fn($class) => $class->fill_rate >= 100)
            ->count();
    }

    // Lấy danh sách lớp kèm % lấp đầy
    private function getClassFillRates()
    {
        return Classes::where('status', 'active')
            ->with('teacher')
            ->get()
            ->map(fn($class) => [
                'id'               => $class->id,
                'name'             => $class->name,
                'teacher'          => $class->teacher?->full_name,
                'current_students' => $class->current_students,
                'max_students'     => $class->max_students,
                'fill_rate'        => $class->fill_rate,
            ]);
    }

    // Lấy danh sách học viên nợ quá số ngày cho phép
    private function getOverdueDebt($days)
    {
        return Student::where('status', 'active')
            ->get()
            ->filter(fn($student) => $student->debt > 0)
            ->map(fn($student) => [
                'id'           => $student->id,
                'student_code' => $student->student_code,
                'full_name'    => $student->full_name,
                'parent_phone' => $student->parent_phone,
                'debt'         => $student->debt,
            ])
            ->values();
    }

    // Lấy danh sách học viên vắng liên tiếp >= $streak buổi
    private function getAbsentStreak($streak)
    {
        return Student::where('status', 'active')
            ->get()
            ->filter(function ($student) use ($streak) {
                // Lấy $streak buổi điểm danh gần nhất
                $recent = Attendance::where('student_id', $student->id)
                    ->orderBy('date', 'desc')
                    ->take($streak)
                    ->pluck('status');

                // Kiểm tra tất cả đều là absent
                return $recent->count() === $streak
                    && $recent->every(fn($s) => $s === 'absent');
            })
            ->map(fn($student) => [
                'id'           => $student->id,
                'student_code' => $student->student_code,
                'full_name'    => $student->full_name,
                'parent_phone' => $student->parent_phone,
            ])
            ->values();
    }
}