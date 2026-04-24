<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $enrollments = DB::table('enrollments')->get();
        $adminIds    = DB::table('users')->pluck('id')->toArray();

        if ($enrollments->isEmpty()) {
            $this->command->warn('PaymentSeeder: Cần có enrollments trước.');
            return;
        }

        $methods = ['cash', 'transfer'];
        $periods = ['Tháng 1/2026', 'Tháng 2/2026', 'Tháng 3/2026', 'Tháng 4/2026'];

        foreach ($enrollments as $enrollment) {
            // Mỗi enrollment có 1–3 lần đóng tiền
            $payCount = rand(1, 3);

            for ($i = 0; $i < $payCount; $i++) {
                $paymentDate = Carbon::now()->subDays(rand(0, 120))->toDateString();
                $dueDate     = Carbon::parse($paymentDate)->addDays(rand(-10, 10))->toDateString();

                DB::table('payments')->insert([
                    'student_id'     => $enrollment->student_id,
                    'enrollment_id'  => $enrollment->id,
                    'amount'         => collect([1_500_000, 2_000_000, 2_800_000, 3_500_000])->random(),
                    'payment_date'   => $paymentDate,
                    'due_date'       => $dueDate,
                    'payment_method' => $methods[array_rand($methods)],
                    'period'         => $periods[array_rand($periods)],
                    'notes'          => null,
                    'created_by'     => !empty($adminIds) ? $adminIds[array_rand($adminIds)] : null,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }
        }
    }
}