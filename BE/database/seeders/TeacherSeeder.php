<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Teacher;


class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        $teachers = [
            ['full_name' => 'Nguyễn Thị Lan',    'phone' => '0901234567', 'is_active' => true,  'notes' => 'Chuyên Movers, Flyers. 5 năm kinh nghiệm.'],
            ['full_name' => 'Trần Văn Minh',      'phone' => '0912345678', 'is_active' => true,  'notes' => 'Chuyên IELTS, TOEIC. Cử nhân Anh văn ĐH Ngoại ngữ.'],
            ['full_name' => 'Lê Thị Hoa',         'phone' => '0923456789', 'is_active' => true,  'notes' => 'Chuyên Starters, Movers cho trẻ em 6-10 tuổi.'],
            ['full_name' => 'Phạm Quốc Bảo',      'phone' => '0934567890', 'is_active' => true,  'notes' => 'Chuyên giao tiếp, luyện thi IELTS Speaking.'],
            ['full_name' => 'Võ Thị Thanh Thảo',  'phone' => '0945678901', 'is_active' => false, 'notes' => 'Đã nghỉ từ tháng 3/2026.'],
        ];

        foreach ($teachers as $teacher) {
            Teacher::create($teacher);
        }
    }
}