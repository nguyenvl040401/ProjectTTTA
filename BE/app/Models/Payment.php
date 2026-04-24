<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    // HasFactory : hỗ trợ tạo dữ liệu giả khi test
    // Không dùng SoftDeletes vì lịch sử thanh toán
    // phải giữ nguyên, không được xóa dù vô tình
    use HasFactory;

    // Các trường được phép nhập liệu từ ngoài vào
    protected $fillable = [
        'student_id',      // liên kết học viên
        'enrollment_id',   // liên kết enrollment (lớp đang đóng tiền)
        'amount',          // số tiền đã đóng - VD: 2800000
        'payment_date',    // ngày đóng tiền
        'payment_method',  // cash (tiền mặt) / transfer (chuyển khoản)
        'period',          // kỳ học - VD: "Tháng 4/2026" hoặc "Khóa 1"
        'notes',           // ghi chú - VD: đóng thiếu 200k
        'created_by',      // id admin người ghi nhận thanh toán
    ];

    // Tự động convert kiểu dữ liệu khi lấy ra
    protected $casts = [
        'payment_date' => 'date',     // string → Carbon date
        'amount'       => 'decimal:0', // số tiền không có số thập phân
    ];

    // ==================== RELATIONSHIPS ====================

    // 1 Payment thuộc về 1 Student
    // VD: $payment->student → thông tin học viên đóng tiền
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // 1 Payment thuộc về 1 Enrollment
    // VD: $payment->enrollment → biết đóng tiền cho lớp nào
    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    // 1 Payment được ghi nhận bởi 1 User (admin)
    // VD: $payment->createdBy → thông tin admin ghi nhận
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}