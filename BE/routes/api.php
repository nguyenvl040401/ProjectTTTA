<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\AttendanceController;

// ==================== PUBLIC ROUTES ====================
// Các route không cần đăng nhập

// Test API hoạt động không - xóa sau khi deploy production
Route::get('/test', function () {
    return response()->json(['message' => 'API hoạt động!']);
});

// Đăng nhập - không cần token
Route::post('/login', [AuthController::class, 'login']);

// ==================== PROTECTED ROUTES ====================
// Tất cả route bên trong đều cần token hợp lệ
// Nếu không có token hoặc token sai → trả về 401 Unauthorized
Route::middleware('auth:sanctum')->group(function () {

    // ---------- AUTH ----------
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ---------- DASHBOARD ----------
    // Lấy tất cả KPI, tự tính không nhập tay
    Route::get('/dashboard', [DashboardController::class, 'index']);
    // ---------- GIÁO VIÊN ----------
    // GET    /api/teachers          → danh sách + tìm kiếm
    // POST   /api/teachers          → thêm mới
    // GET    /api/teachers/{id}     → chi tiết
    // PUT    /api/teachers/{id}     → cập nhật
    // DELETE /api/teachers/{id}     → xóa mềm (chặn nếu đang có lớp)
    Route::apiResource('teachers', TeacherController::class); 
    // ---------- HỌC VIÊN ----------
    // GET    /api/students          → danh sách
    // POST   /api/students          → thêm mới
    // GET    /api/students/{id}     → chi tiết
    // PUT    /api/students/{id}     → cập nhật
    // DELETE /api/students/{id}     → xóa mềm
    Route::apiResource('students', StudentController::class);

    // Công nợ của 1 học viên cụ thể
    Route::get('students/{student}/debt', [StudentController::class, 'debt']);

    // ---------- LỚP HỌC ----------
    // GET    /api/classes           → danh sách
    // POST   /api/classes           → tạo lớp mới
    // GET    /api/classes/{id}      → chi tiết + ds học viên
    // PUT    /api/classes/{id}      → cập nhật
    // DELETE /api/classes/{id}      → xóa mềm
    Route::apiResource('classes', ClassController::class);

    // ---------- ENROLLMENT (XẾP LỚP) ----------
    // GET    /api/enrollments       → danh sách
    // POST   /api/enrollments       → xếp lớp cho học viên
    // GET    /api/enrollments/{id}  → chi tiết
    // PUT    /api/enrollments/{id}  → cập nhật (đổi trạng thái, học phí)
    // DELETE /api/enrollments/{id}  → xóa
    Route::apiResource('enrollments', EnrollmentController::class);

    // ---------- THANH TOÁN ----------
    // GET    /api/payments          → danh sách + filter
    // POST   /api/payments          → nhập thanh toán mới
    // GET    /api/payments/{id}     → chi tiết
    // PUT    /api/payments/{id}     → cập nhật notes/period
    // DELETE /api/payments/{id}     → xóa
    Route::apiResource('payments', PaymentController::class);
    Route::middleware('auth:sanctum')->post('/payments', [PaymentController::class, 'store']);

    // ---------- ĐIỂM DANH ----------
    // GET    /api/attendance                          → danh sách + filter
    // POST   /api/attendance                          → điểm danh 1 học viên
    // PUT    /api/attendance/{id}                     → sửa điểm danh
    // DELETE /api/attendance/{id}                     → xóa điểm danh
    Route::apiResource('attendance', AttendanceController::class);

    // Lấy ds học viên + trạng thái điểm danh theo lớp và ngày
    // Dùng cho màn hình điểm danh: chọn lớp + ngày → hiện danh sách
    Route::get('attendance/class/{classId}/date/{date}',
        [AttendanceController::class, 'byClassDate']);

    // Điểm danh hàng loạt cả lớp 1 lần
    // Dùng thay cho việc POST từng người một
    Route::post('attendance/bulk',
        [AttendanceController::class, 'bulk']);
});