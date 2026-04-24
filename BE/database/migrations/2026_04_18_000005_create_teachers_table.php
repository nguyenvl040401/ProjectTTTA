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
    Schema::create('teachers', function (Blueprint $table) {
        $table->id();

        // Liên kết với bảng users (tài khoản đăng nhập)
        // nullable() vì có thể tạo giáo viên trước, tạo tài khoản sau
        $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

        $table->string('full_name');               // Họ tên giáo viên
        $table->string('phone')->nullable();        // Số điện thoại
        $table->boolean('is_active')->default(true); // Đang dạy hay đã nghỉ
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
        Schema::dropIfExists('teachers');
    }
};
