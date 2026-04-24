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
    Schema::create('enrollments', function (Blueprint $table) {
        $table->id();

        // Liên kết học viên - xóa enrollment nếu xóa học viên
        $table->foreignId('student_id')->constrained('students')->onDelete('cascade');

        // Liên kết lớp học - xóa enrollment nếu xóa lớp
        $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');

        $table->date('enrolled_date');            // Ngày vào lớp
        $table->date('left_date')->nullable();    // Ngày rời lớp (nếu có)

        // Trạng thái enrollment
        // studying   = đang học
        // left       = đã nghỉ
        // paused     = bảo lưu
        // completed  = hoàn thành khóa
        $table->enum('status', ['studying', 'left', 'paused', 'completed'])->default('studying');

        // Học phí riêng cho học viên này (nếu có giảm giá đặc biệt)
        // null = lấy học phí mặc định từ bảng classes
        $table->decimal('custom_fee', 12, 0)->nullable();

        // % giảm giá - VD: 10 = giảm 10%
        $table->decimal('discount', 5, 2)->default(0);

        $table->text('notes')->nullable();        // Ghi chú - VD: con giáo viên cũ

        $table->timestamps();   // created_at, updated_at

        // Chống nhập trùng: 1 học viên chỉ vào 1 lớp 1 lần/ngày
        $table->unique(['student_id', 'class_id', 'enrolled_date']);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
