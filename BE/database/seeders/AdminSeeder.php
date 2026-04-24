<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // updateOrCreate: chạy nhiều lần không bị lỗi trùng email
        // Điều kiện tìm theo email, nếu có rồi thì update, chưa có thì tạo mới
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name'      => 'Admin',
                'password'  => Hash::make('123'),
                'role'      => 'admin',
                'phone'     => '0901000001',
                'is_active' => true,
            ]
        );
    }
}