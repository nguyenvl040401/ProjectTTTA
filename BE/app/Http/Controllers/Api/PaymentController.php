<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    // ==================== DANH SÁCH THANH TOÁN ====================
    // GET /api/payments
    // Query params:
    //   ?student_id=1      → lịch sử đóng tiền của 1 học viên
    //   ?enrollment_id=1   → lịch sử đóng tiền của 1 enrollment
    //   ?month=4&year=2026 → lọc theo tháng/năm
    public function index(Request $request)
    {
        $query = Payment::with(['student', 'enrollment.classes', 'createdBy']);

        // Lọc theo học viên
        if ($request->student_id) {
            $query->where('student_id', $request->student_id);
        }

        // Lọc theo enrollment
        if ($request->enrollment_id) {
            $query->where('enrollment_id', $request->enrollment_id);
        }

        // Lọc theo tháng/năm
        if ($request->month && $request->year) {
            $query->whereMonth('payment_date', $request->month)
                  ->whereYear('payment_date', $request->year);
        }

        $payments = $query->orderBy('payment_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($payments);
    }

    // ==================== NHẬP THANH TOÁN MỚI ====================
    // POST /api/payments
    // Body: { student_id, enrollment_id, amount, payment_date, payment_method, period, notes }
    // Đây là nghiệp vụ quan trọng nhất - nhập tay mỗi lần phụ huynh đóng tiền
    public function store(Request $request)
    {
        $request->validate([
            'student_id'     => 'required|exists:students,id',
            'enrollment_id'  => 'nullable|exists:enrollments,id',
            'amount'         => 'required|numeric|min:1000',
            'payment_date'   => 'required|date',
            'payment_method' => 'required|in:cash,transfer',
            'period'         => 'nullable|string|max:100',
            'notes'          => 'nullable|string',
        ]);

        // Ghi nhận người tạo là admin đang đăng nhập
        $payment = Payment::create([
            ...$request->all(),
            // 'created_by' => auth()->id(),
            'created_by' => Auth::id(), // thay cho auth()->id()
        ]);

        // Load relationships để trả về đầy đủ thông tin
        $payment->load(['student', 'enrollment.classes', 'createdBy']);

        // Tính lại công nợ sau khi đóng tiền
        $student = Student::find($request->student_id);

        return response()->json([
            'message'     => 'Ghi nhận thanh toán thành công!',
            'payment'     => $payment,
            // Trả về công nợ mới nhất sau khi đóng
            // React dùng để cập nhật UI ngay lập tức không cần reload
            'debt_after'  => $student->debt,
        ], 201);
    }

    // ==================== CHI TIẾT THANH TOÁN ====================
    // GET /api/payments/{id}
    public function show(Payment $payment)
    {
        $payment->load(['student', 'enrollment.classes', 'createdBy']);

        return response()->json($payment);
    }

    // ==================== CẬP NHẬT THANH TOÁN ====================
    // PUT /api/payments/{id}
    // Chỉ cho sửa notes và period, không cho sửa số tiền
    // Muốn sửa số tiền phải xóa rồi tạo lại để giữ lịch sử chính xác
    public function update(Request $request, Payment $payment)
    {
        $request->validate([
            'period' => 'nullable|string|max:100',
            'notes'  => 'nullable|string',
        ]);

        $payment->update($request->only(['period', 'notes']));

        return response()->json([
            'message' => 'Cập nhật thành công!',
            'payment' => $payment,
        ]);
    }

    // ==================== XÓA THANH TOÁN ====================
    // DELETE /api/payments/{id}
    // Cẩn thận khi xóa - ảnh hưởng đến công nợ học viên
    public function destroy(Payment $payment)
    {
        $studentId = $payment->student_id;

        $payment->delete();

        // Tính lại công nợ sau khi xóa
        $student = Student::find($studentId);

        return response()->json([
            'message'    => 'Đã xóa thanh toán!',
            // Trả về công nợ mới nhất sau khi xóa
            'debt_after' => $student->debt,
        ]);
    }
}