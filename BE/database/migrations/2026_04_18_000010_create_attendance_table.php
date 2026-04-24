<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();

            // Xóa attendance nếu xóa học viên
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');

            // Biết điểm danh buổi nào của lớp nào
            // Quan trọng: học viên học 2 lớp → attendance riêng từng lớp
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');

            // Biết điểm danh theo enrollment nào (dùng để tính buổi còn lại)
            $table->foreignId('enrollment_id')->nullable()->constrained('enrollments')->nullOnDelete();

            $table->date('date'); // Ngày học

            // present = có mặt
            // absent  = vắng không phép
            // late    = đi trễ
            // excused = vắng có phép (báo trước)
            $table->enum('status', ['present', 'absent', 'late', 'excused'])->default('present');

            $table->text('notes')->nullable(); // VD: "nghỉ vì bệnh", "đến trễ 15p"

            $table->timestamps();

            // Mỗi học viên chỉ có 1 bản ghi điểm danh / lớp / ngày
            // Dùng updateOrCreate trong controller để tránh trùng
            $table->unique(['student_id', 'class_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};