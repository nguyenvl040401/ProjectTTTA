<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\EnrollmentSeeder;
use Database\Seeders\PaymentSeeder;
use Database\Seeders\AttendanceSeeder;
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,      // 1. Tài khoản admin trước
            TeacherSeeder::class,    // 2. Giáo viên
            StudentSeeder::class,    // 3. Học viên
            ClassSeeder::class,      // 4. Lớp học (cần teacher_id)
            EnrollmentSeeder::class, // 5. Xếp lớp (cần student_id + class_id)
            PaymentSeeder::class,    // 6. Thanh toán (cần enrollment_id)
            AttendanceSeeder::class, // 7. Điểm danh (cần student_id + class_id)
        ]);
    }
}