<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Attendance extends Model
{
    // HasFactory : hỗ trợ tạo dữ liệu giả khi test
    // Không dùng SoftDeletes vì dữ liệu điểm danh
    // cần chính xác tuyệt đối, không nên xóa mềm
    use HasFactory;

    // Tên bảng trong database
    // Khai báo rõ cho chắc chắn
    protected $table = 'attendance';

    // Các trường được phép nhập liệu từ ngoài vào
    protected $fillable = [
        'student_id',    // liên kết học viên
        'class_id',      // liên kết lớp học (quan trọng nếu học 2 lớp)
        'enrollment_id', // liên kết enrollment
        'date',          // ngày học
        'status',        // present (có mặt) / absent (vắng) / makeup (học bù)
        'notes',         // ghi chú - VD: vắng có phép, học bù từ T5
    ];

    // Tự động convert kiểu dữ liệu khi lấy ra
    protected $casts = [
        'date' => 'date', // string → Carbon date
    ];

    // ==================== RELATIONSHIPS ====================

    // 1 Attendance thuộc về 1 Student
    // VD: $attendance->student → thông tin học viên
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // 1 Attendance thuộc về 1 Class
    // VD: $attendance->classes → thông tin lớp học
    public function classes()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    // 1 Attendance thuộc về 1 Enrollment
    // VD: $attendance->enrollment → thông tin enrollment
    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}