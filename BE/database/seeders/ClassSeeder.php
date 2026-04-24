<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Classes;

class ClassSeeder extends Seeder
{
    public function run(): void
    {
        $classes = [
            [
                'class_code'     => 'ST-2026-A',
                'name'           => 'Starters 1 Sáng',
                'level'          => 'Starters',
                'teacher_id'     => 3, // Lê Thị Hoa
                'schedule'       => 'T2-T4-T6 | 8:00 - 9:30',
                'room'           => 'P.101',
                'max_students'   => 12,
                'fee_per_course' => 2400000,
                'total_sessions' => 60,
                'start_date'     => '2026-01-10',
                'end_date'       => '2026-06-30',
                'status'         => 'active',
                'notes'          => null,
            ],
            [
                'class_code'     => 'MV-2026-A',
                'name'           => 'Movers 2 Chiều',
                'level'          => 'Movers',
                'teacher_id'     => 1, // Nguyễn Thị Lan
                'schedule'       => 'T3-T5 | 17:30 - 19:00',
                'room'           => 'P.102',
                'max_students'   => 12,
                'fee_per_course' => 2800000,
                'total_sessions' => 60,
                'start_date'     => '2026-01-15',
                'end_date'       => '2026-07-15',
                'status'         => 'active',
                'notes'          => null,
            ],
            [
                'class_code'     => 'FL-2026-A',
                'name'           => 'Flyers Cuối Tuần',
                'level'          => 'Flyers',
                'teacher_id'     => 1, // Nguyễn Thị Lan
                'schedule'       => 'T7-CN | 9:00 - 11:00',
                'room'           => 'P.103',
                'max_students'   => 10,
                'fee_per_course' => 3200000,
                'total_sessions' => 48,
                'start_date'     => '2026-02-01',
                'end_date'       => '2026-08-01',
                'status'         => 'active',
                'notes'          => null,
            ],
            [
                'class_code'     => 'IE-2026-A',
                'name'           => 'IELTS Foundation',
                'level'          => 'IELTS 4.0',
                'teacher_id'     => 2, // Trần Văn Minh
                'schedule'       => 'T2-T4-T6 | 18:00 - 20:00',
                'room'           => 'P.201',
                'max_students'   => 10,
                'fee_per_course' => 4500000,
                'total_sessions' => 72,
                'start_date'     => '2026-02-05',
                'end_date'       => '2026-09-30',
                'status'         => 'active',
                'notes'          => 'Mục tiêu 5.0.',
            ],
            [
                'class_code'     => 'IE-2026-B',
                'name'           => 'IELTS Intermediate',
                'level'          => 'IELTS 5.0',
                'teacher_id'     => 2, // Trần Văn Minh
                'schedule'       => 'T3-T5-T7 | 18:00 - 20:00',
                'room'           => 'P.202',
                'max_students'   => 8,
                'fee_per_course' => 5500000,
                'total_sessions' => 72,
                'start_date'     => '2026-03-01',
                'end_date'       => '2026-10-31',
                'status'         => 'active',
                'notes'          => 'Mục tiêu 6.0-6.5.',
            ],
            [
                'class_code'     => 'GT-2026-A',
                'name'           => 'Giao Tiếp Cơ Bản',
                'level'          => 'Giao tiếp',
                'teacher_id'     => 4, // Phạm Quốc Bảo
                'schedule'       => 'T2-T4 | 19:00 - 20:30',
                'room'           => 'P.103',
                'max_students'   => 15,
                'fee_per_course' => 2000000,
                'total_sessions' => 40,
                'start_date'     => '2026-03-15',
                'end_date'       => '2026-07-31',
                'status'         => 'active',
                'notes'          => null,
            ],
            [
                'class_code'     => 'ST-2026-B',
                'name'           => 'Starters 2 Chiều',
                'level'          => 'Starters',
                'teacher_id'     => 3, // Lê Thị Hoa
                'schedule'       => 'T3-T5 | 15:00 - 16:30',
                'room'           => 'P.101',
                'max_students'   => 12,
                'fee_per_course' => 2400000,
                'total_sessions' => 60,
                'start_date'     => '2026-04-01',
                'end_date'       => '2026-09-30',
                'status'         => 'upcoming',
                'notes'          => 'Lớp sắp khai giảng.',
            ],
        ];

        foreach ($classes as $class) {
            Classes::create($class);
        }
    }
}