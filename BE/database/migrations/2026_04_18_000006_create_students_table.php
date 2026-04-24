<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('students', function (Blueprint $table) {
        $table->id();

        // Mã học viên tự sinh, unique - VD: HV-2026-001
        $table->string('student_code')->unique();

        $table->string('full_name');                 // Họ tên học viên
        $table->date('dob')->nullable();             // Ngày sinh
        $table->string('parent_name')->nullable();   // Tên phụ huynh
        $table->string('parent_phone');              // SĐT phụ huynh (bắt buộc)
        $table->string('email')->nullable();         // Email (nếu có)

        $table->date('enrollment_date');             // Ngày đăng ký
        $table->date('start_date')->nullable();      // Ngày bắt đầu học thực tế

        $table->string('entry_level')->nullable();   // Trình độ đầu vào

        // Trạng thái học viên
        // active   = đang học
        // inactive = đã nghỉ
        // paused   = bảo lưu tạm thời
        $table->enum('status', ['active', 'inactive', 'paused'])->default('active');

        $table->date('left_date')->nullable();       // Ngày nghỉ học (nếu có)
        $table->string('left_reason')->nullable();   // Lý do nghỉ

        $table->text('notes')->nullable();           // Ghi chú thêm

        $table->timestamps();   // created_at, updated_at
        $table->softDeletes();  // deleted_at - xóa mềm, không mất data
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
