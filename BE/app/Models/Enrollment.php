<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Enrollment extends Model
{
    // HasFactory : hỗ trợ tạo dữ liệu giả khi test
    // Không dùng SoftDeletes vì enrollment cần lưu lịch sử chính xác
    // Nếu xóa thì xóa thật, không cần khôi phục
    use HasFactory;

    // Các trường được phép nhập liệu từ ngoài vào
    protected $fillable = [
        'student_id',   // liên kết học viên
        'class_id',     // liên kết lớp học
        'enrolled_date', // ngày vào lớp
        'left_date',    // ngày rời lớp (nếu có)
        'status',       // studying / left / paused / completed
        'custom_fee',   // học phí riêng (override nếu giảm giá đặc biệt)
        'discount',     // % giảm giá - VD: 10 = giảm 10%
        'notes',        // ghi chú - VD: con giáo viên cũ
    ];

    // Tự động convert kiểu dữ liệu khi lấy ra
    protected $casts = [
        'enrolled_date' => 'date', // string → Carbon date
        'left_date'     => 'date',
        'custom_fee'    => 'decimal:0',
        'discount'      => 'decimal:2',
    ];

    // ==================== RELATIONSHIPS ====================

    // 1 Enrollment thuộc về 1 Student
    // VD: $enrollment->student → thông tin học viên
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // 1 Enrollment thuộc về 1 Class
    // VD: $enrollment->classes → thông tin lớp học
    public function classes()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    // 1 Enrollment có nhiều Payments
    // VD: $enrollment->payments → lịch sử đóng tiền cho enrollment này
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // 1 Enrollment có nhiều Attendance
    // VD: $enrollment->attendance → lịch sử điểm danh
    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    // ==================== COMPUTED ATTRIBUTES ====================

    // Tự tính học phí thực tế của enrollment này
    // Ưu tiên: custom_fee → fee_per_course của lớp trừ discount
    // VD: $enrollment->actual_fee → 2520000
    public function getActualFeeAttribute()
    {
        if ($this->custom_fee) {
            return $this->custom_fee;
        }
        return $this->classes->fee_per_course
            * (1 - $this->discount / 100);
    }
}