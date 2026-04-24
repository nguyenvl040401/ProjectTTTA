<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // ==================== ĐĂNG NHẬP ====================
    // POST /api/login
    // Body: { email, password }
    // Trả về: token + thông tin user
    public function login(Request $request)
    {
        // Validate dữ liệu đầu vào
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // Kiểm tra email tồn tại không
        $user = User::where('email', $request->email)->first();

        // Kiểm tra password đúng không
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email hoặc mật khẩu không đúng!'
            ], 401);
        }

        // Kiểm tra tài khoản có bị khóa không
        if (!$user->is_active) {
            return response()->json([
                'message' => 'Tài khoản đã bị khóa, liên hệ admin!'
            ], 403);
        }

        // Xóa token cũ nếu có (chỉ cho đăng nhập 1 thiết bị)
        $user->tokens()->delete();

        // Tạo token mới
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Đăng nhập thành công!',
            'token'   => $token,
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role, // admin hoặc teacher
            ]
        ]);
    }

    // ==================== ĐĂNG XUẤT ====================
    // POST /api/logout
    // Header: Authorization: Bearer {token}
    public function logout(Request $request)
    {
        // Xóa token hiện tại
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Đăng xuất thành công!'
        ]);
    }

    // ==================== LẤY THÔNG TIN USER ĐANG ĐĂNG NHẬP ====================
    // GET /api/me
    // Header: Authorization: Bearer {token}
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }
}