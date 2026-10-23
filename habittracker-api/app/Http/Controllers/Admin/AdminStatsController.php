<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Habit;
use App\Models\HabitLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AdminStatsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $from = Carbon::today()->subDays(13);
        $counts = HabitLog::where('status', 'completed')->where('log_date', '>=', $from->toDateString())
            ->get()->groupBy(fn ($l) => $l->log_date->toDateString())->map->count();

        $series = [];
        for ($d = $from->copy(); $d->lte(Carbon::today()); $d->addDay()) {
            $series[] = ['date' => $d->toDateString(), 'completed' => (int) ($counts[$d->toDateString()] ?? 0)];
        }

        return response()->json([
            'total_users' => User::where('role', 'user')->count(),
            'active_users' => User::where('role', 'user')->where('status', 'active')->count(),
            'total_habits' => Habit::count(),
            'completions_today' => HabitLog::where('status', 'completed')->where('log_date', Carbon::today()->toDateString())->count(),
            'daily' => $series,
        ]);
    }
}
