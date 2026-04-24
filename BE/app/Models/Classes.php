<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Classes extends Model
{
    // HasFactory  : hỗ trợ tạo dữ liệu giả khi test
    // SoftDeletes : xóa mềm - không xóa thật khỏi database
    //               chỉ set deleted_at = thời gian xóa
    //               giúp khôi phục lại nếu xóa nhầm
    use HasFactory, SoftDeletes;

    // Tên bảng trong database là 'classes'
    // Khai báo rõ vì Laravel mặc định sẽ tìm bảng 'classes' (số nhiều của class)
    // nhưng 'class' là từ khóa reserved trong PHP nên đặt tên Model là Classes
    protected $table = 'classes';

    // Các trường được phép nhập liệu từ ngoài vào
    protected $fillable = [
        'class_code',      // mã lớp - VD: MV2-2026-A
        'name',            // tên lớp - VD: Movers 2 Chiều
        'level',           // cấp độ - VD: Starter, Movers, Flyers
        'teacher_id',      // giáo viên phụ trách
        'schedule',        // lịch học - VD: T2-T4 17:30
        'room',            // phòng học
        'max_students',    // sĩ số tối đa
        'fee_per_course',  // học phí/khóa
        'total_sessions',  // tổng số buổi học/khóa
        'start_date',      // ngày khai giảng
        'end_date',        // ngày kết thúc dự kiến
        'status',          // upcoming / active / finished
        'notes',           // ghi chú thêm
    ];

    // Tự động convert kiểu dữ liệu khi lấy ra
    protected $casts = [
        'start_date' => 'date', // string → Carbon date
        'end_date'   => 'date',
    ];

    // ==================== RELATIONSHIPS ====================

    // 1 Class thuộc về 1 Teacher
    // VD: $class->teacher → thông tin giáo viên dạy lớp này
    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    // 1 Class có nhiều Enrollments
    // VD: $class->enrollments → danh sách tất cả học viên đã/đang học
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'class_id');
    }

    // Chỉ lấy enrollment đang học (status = studying)
    // VD: $class->activeEnrollments → học viên đang học hiện tại
    public function activeEnrollments()
    {
        return $this->hasMany(Enrollment::class, 'class_id')
            ->where('status', 'studying');
    }

    // 1 Class có nhiều Attendance
    // VD: $class->attendance → toàn bộ lịch sử điểm danh của lớp
    public function attendance()
    {
        return $this->hasMany(Attendance::class, 'class_id');
    }

    // ==================== COMPUTED ATTRIBUTES ====================

    // Tự tính % lấp đầy lớp
    // Guard null: nếu max_students chưa được set thì trả 0 thay vì crash
    // VD: 15 HV / 20 chỗ → 75%
    public function getFillRateAttribute()
    {
        if (!$this->max_students) return 0;
        $active = $this->activeEnrollments()->count();
        return round($active / $this->max_students * 100);
    }

    // Tự tính số học viên đang học
    // VD: $class->current_students → 9
    public function getCurrentStudentsAttribute()
    {
        return $this->activeEnrollments()->count();
    }
}