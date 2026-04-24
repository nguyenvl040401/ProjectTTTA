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
    Schema::create('classes', function (Blueprint $table) {
        $table->id();

        // Mã lớp unique - VD: MV2-2026-A
        $table->string('class_code')->unique();

        $table->string('name');    // Tên lớp - VD: Movers 2 Chiều
        $table->string('level');   // Cấp độ - VD: Starter, Movers, Flyers

        // Giáo viên phụ trách
        // nullable() vì có thể tạo lớp trước, phân công GV sau
        // nullOnDelete() nếu xóa GV thì set null, không xóa lớp
        $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();

        $table->string('schedule');               // Lịch học - VD: T2-T4 17:30
        $table->string('room')->nullable();        // Phòng học
        $table->integer('max_students')->default(12); // Sĩ số tối đa
        $table->decimal('fee_per_course', 12, 0); // Học phí/khóa - VD: 2800000

        $table->integer('total_sessions')->default(60); // Tổng số buổi học/khóa

        $table->date('start_date')->nullable();   // Ngày khai giảng
        $table->date('end_date')->nullable();      // Ngày kết thúc dự kiến

        // Trạng thái lớp
        // upcoming = sắp khai giảng
        // active   = đang học
        // finished = đã kết thúc
        $table->enum('status', ['upcoming', 'active', 'finished'])->default('upcoming');

        $table->text('notes')->nullable();         // Ghi chú thêm

        $table->timestamps();   // created_at, updated_at
        $table->softDeletes();  // deleted_at - xóa mềm, không mất data
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
