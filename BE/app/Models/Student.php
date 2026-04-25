<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    // HasFactory  : hỗ trợ tạo dữ liệu giả khi test
    // SoftDeletes : xóa mềm - không xóa thật khỏi database
    //               chỉ set deleted_at = thời gian xóa
    //               giúp khôi phục lại nếu xóa nhầm
    use HasFactory, SoftDeletes;

    // Các trường được phép nhập liệu từ ngoài vào
    protected $fillable = [
        'student_code',  // mã học viên - VD: HV-2026-001
        'full_name',     // họ tên học viên
        'dob',           // ngày sinh
        'parent_name',   // tên phụ huynh
        'parent_phone',  // SĐT phụ huynh (bắt buộc)
        'email',         // email (nếu có)
        'enrollment_date', // ngày đăng ký
        'start_date',    // ngày bắt đầu học thực tế
        'entry_level',   // trình độ đầu vào
        'status',        // active / inactive / paused
        'left_date',     // ngày nghỉ học
        'left_reason',   // lý do nghỉ
        'notes',         // ghi chú thêm
    ];

    // Tự động convert kiểu dữ liệu khi lấy ra
    protected $casts = [
        'dob'             => 'date', // string → Carbon date
        'enrollment_date' => 'date',
        'start_date'      => 'date',
        'left_date'       => 'date',
    ];

    // ==================== RELATIONSHIPS ====================

    // 1 Student có nhiều Enrollments (đăng ký nhiều lớp)
    // VD: $student->enrollments → danh sách lớp học viên đã/đang học
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    // Chỉ lấy enrollment đang học (status = studying)
    // VD: $student->activeEnrollments → lớp đang học hiện tại
    public function activeEnrollments()
    {
        return $this->hasMany(Enrollment::class)->where('status', 'studying');
    }

    // 1 Student có nhiều Payments (lịch sử đóng tiền)
    // VD: $student->payments → toàn bộ lịch sử đóng tiền
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // 1 Student có nhiều Attendance (lịch sử điểm danh)
    // VD: $student->attendance → toàn bộ lịch sử điểm danh
    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    // ==================== COMPUTED ATTRIBUTES ====================

    // Tự tính công nợ của học viên
    // Công thức: tổng học phí thực tế - tổng đã đóng
    // VD: $student->debt → số tiền còn nợ (âm = đóng dư)
public function getDebtAttribute()
{
    // Lấy tất cả enrollment có phát sinh học phí
    // paused (bảo lưu) không tính vì học viên chưa học
    $totalFee = $this->enrollments()
        ->whereIn('status', ['studying', 'left', 'completed'])
        ->with(['classes' => function ($q) {
            $q->withTrashed(); // lấy cả lớp đã xóa mềm để tính đúng học phí
                               // nếu không có withTrashed(), lớp đã xóa trả null
                               // → bỏ sót học phí → debt tính sai
        }])
        ->get()
        ->sum(function ($enrollment) {
            // Ưu tiên 1: dùng custom_fee nếu có (học phí thỏa thuận riêng)
            if ($enrollment->custom_fee) {
                return $enrollment->custom_fee;
            }
            // Ưu tiên 2: phòng trường hợp lớp bị xóa mà không có custom_fee
            // → không tính được học phí → bỏ qua, trả 0
            if (!$enrollment->classes) return 0;
            // Ưu tiên 3: học phí lớp × (1 - discount%)
            // VD: 3.000.000 × (1 - 10/100) = 2.700.000
            return $enrollment->classes->fee_per_course
                * (1 - $enrollment->discount / 100);
        });

    // Tổng tiền học viên đã thực tế đóng
    $totalPaid = $this->payments()->sum('amount');

    // Công nợ = tổng học phí phải đóng - tổng đã đóng
    // Kết quả dương  → còn nợ
    // Kết quả âm     → đóng dư (có thể trừ vào kỳ sau)
    // Kết quả bằng 0 → đã đóng đủ
    return $totalFee - $totalPaid;
}
}