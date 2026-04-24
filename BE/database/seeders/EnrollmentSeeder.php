<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EnrollmentSeeder extends Seeder
{
    public function run(): void
    {
        $students = DB::table('students')->pluck('id')->toArray();
        $classes  = DB::table('classes')->pluck('id')->toArray();

        if (empty($students) || empty($classes)) {
            $this->command->warn('EnrollmentSeeder: Cần có students và classes trước.');
            return;
        }

        $statuses = ['studying', 'left', 'paused', 'completed'];
        $used     = []; // tránh trùng unique(student_id, class_id, enrolled_date)

        foreach ($students as $studentId) {
            // Mỗi học viên vào 1–2 lớp
            $classIds = collect($classes)->random(min(2, count($classes)))->toArray();

            foreach ($classIds as $classId) {
                $enrolledDate = Carbon::now()->subDays(rand(30, 180))->toDateString();
                $key = "{$studentId}_{$classId}_{$enrolledDate}";

                if (isset($used[$key])) continue;
                $used[$key] = true;

                $status   = $statuses[array_rand($statuses)];
                $leftDate = in_array($status, ['left', 'completed'])
                    ? Carbon::parse($enrolledDate)->addDays(rand(10, 90))->toDateString()
                    : null;

                DB::table('enrollments')->insert([
                    'student_id'   => $studentId,
                    'class_id'     => $classId,
                    'enrolled_date' => $enrolledDate,
                    'left_date'    => $leftDate,
                    'status'       => $status,
                    'custom_fee'   => rand(0, 1) ? rand(1_500_000, 3_500_000) : null,
                    'discount'     => collect([0, 0, 0, 5, 10, 15])->random(),
                    'notes'        => null,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }
        }
    }
}