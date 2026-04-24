<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends Model
{
    // HasFactory  : hỗ trợ tạo dữ liệu giả khi test
    // SoftDeletes : xóa mềm - không xóa thật khỏi database
    //               chỉ set deleted_at = thời gian xóa
    //               giúp khôi phục lại nếu xóa nhầm
    use HasFactory, SoftDeletes;

    // Các trường được phép nhập liệu từ ngoài vào
    protected $fillable = [
        'user_id',   // liên kết tài khoản đăng nhập (nullable)
        'full_name', // họ tên giáo viên
        'phone',     // số điện thoại
        'is_active', // đang dạy (true) hay đã nghỉ (false)
        'notes',     // ghi chú thêm
    ];

    // ==================== RELATIONSHIPS ====================

    // 1 Teacher thuộc về 1 User (tài khoản đăng nhập)
    // VD: $teacher->user → lấy thông tin tài khoản của giáo viên này
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // 1 Teacher có thể dạy nhiều Classes
    // VD: $teacher->classes → danh sách lớp giáo viên này đang dạy
    public function classes()
    {
        return $this->hasMany(Classes::class);
    }
}