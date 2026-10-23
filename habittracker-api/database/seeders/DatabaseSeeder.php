<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Habit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create(['name' => 'Admin', 'email' => 'admin@habittracker.test', 'password' => 'password', 'role' => 'admin']);
        $demo = User::create(['name' => 'Demo User', 'email' => 'user@habittracker.test', 'password' => 'password', 'role' => 'user']);

        $cats = collect([
            ['Health', '#10b981'], ['Fitness', '#f97316'], ['Study', '#3b82f6'],
            ['Mindfulness', '#a855f7'], ['Productivity', '#eab308'],
        ])->mapWithKeys(fn ($c) => [$c[0] => Category::create(['name' => $c[0], 'color' => $c[1]])]);

        $samples = [
            ['Drink 8 glasses of water', 'Health', 'daily', 1, 0.9],
            ['Read 20 pages', 'Study', 'daily', 1, 0.75],
            ['Morning stretch', 'Fitness', 'daily', 1, 0.6],
            ['Meditate 10 minutes', 'Mindfulness', 'daily', 1, 0.5],
            ['Gym session', 'Fitness', 'weekly', 3, 0.7],
        ];

        foreach ($samples as [$name, $cat, $freq, $target, $odds]) {
            $habit = Habit::create([
                'user_id' => $demo->id, 'category_id' => $cats[$cat]->id, 'name' => $name,
                'frequency' => $freq, 'target_per_period' => $target,
                'start_date' => Carbon::today()->subDays(40)->toDateString(),
            ]);

            for ($i = 40; $i >= 1; $i--) {
                $day = Carbon::today()->subDays($i);
                $hit = $freq === 'weekly' ? in_array($day->dayOfWeek, [1, 3, 5]) && mt_rand(0, 99) < $odds * 100 + 15
                                          : mt_rand(0, 99) < $odds * 100;
                if ($hit) {
                    $habit->logs()->create(['log_date' => $day->toDateString(), 'status' => 'completed']);
                }
            }
        }
    }
}
