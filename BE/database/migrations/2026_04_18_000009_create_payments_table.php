<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            // Xóa payment nếu xóa học viên
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');

            // Biết đóng tiền cho enrollment (lớp) nào
            // nullable: có thể thu tiền trước khi xếp lớp
            $table->foreignId('enrollment_id')->nullable()->constrained('enrollments')->nullOnDelete();

            $table->decimal('amount', 12, 0);        // Số tiền đã đóng — VD: 2800000
            $table->date('payment_date');             // Ngày thực tế đóng tiền

            // Hạn đóng tiền — dùng để tính "nợ quá hạn X ngày" cho dashboard
            // VD: due_date = 01/05, hôm nay 10/05 → quá hạn 9 ngày → hiện cảnh báo
            $table->date('due_date')->nullable();

            // cash = tiền mặt | transfer = chuyển khoản
            $table->enum('payment_method', ['cash', 'transfer'])->default('cash');

            // Kỳ đóng tiền — VD: "Tháng 4/2026" hoặc "Khóa 1"
            // Giúp đối soát khi học viên đóng từng tháng thay vì cả khóa
            $table->string('period')->nullable();

            $table->text('notes')->nullable();

            // Admin nào ghi nhận khoản thu này
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};