<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $enrollments = DB::table('enrollments')->get();

        if ($enrollments->isEmpty()) {
            $this->command->warn('AttendanceSeeder: Cần có enrollments trước.');
            return;
        }

        $statuses = ['present', 'present', 'present', 'absent', 'late', 'excused']; // weight present
        $used     = []; // tránh trùng unique(student_id, class_id, date)

        foreach ($enrollments as $enrollment) {
            // Sinh 10–20 buổi điểm danh cho mỗi enrollment
            $sessionCount = rand(10, 20);

            for ($i = 0; $i < $sessionCount; $i++) {
                $date = Carbon::now()->subDays(rand(0, 90))->toDateString();
                $key  = "{$enrollment->student_id}_{$enrollment->class_id}_{$date}";

                if (isset($used[$key])) continue;
                $used[$key] = true;

                $status = $statuses[array_rand($statuses)];

                DB::table('attendance')->insert([
                    'student_id'    => $enrollment->student_id,
                    'class_id'      => $enrollment->class_id,
                    'enrollment_id' => $enrollment->id,
                    'date'          => $date,
                    'status'        => $status,
                    'notes'         => $status === 'absent' ? 'Vắng không phép' :
                                      ($status === 'late'   ? 'Đến trễ 15 phút' :
                                      ($status === 'excused'? 'Báo trước qua Zalo' : null)),
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }
        }
    }
}