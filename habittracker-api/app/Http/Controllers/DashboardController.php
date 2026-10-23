<?php

namespace App\Http\Controllers;

use App\Models\Habit;
use App\Models\Reminder;
use App\Services\StreakService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private StreakService $streaks)
    {
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today();
        $habits = $user->habits()->with('category')->where('status', 'active')->get();

        $todayList = $habits->map(function (Habit $h) use ($today) {
            $s = $this->streaks->streaks($h);
            $log = $h->logs()->where('log_date', $today->toDateString())->first();

            return [
                'id' => $h->id,
                'name' => $h->name,
                'category' => $h->category,
                'frequency' => $h->frequency,
                'today_status' => $log?->status,
                'current_streak' => $s['current'],
                'longest_streak' => $s['longest'],
            ];
        })->values();

        $done = $todayList->where('today_status', 'completed')->count();

        // In-app reminders: active, scheduled for today, time already passed, habit not yet completed today.
        $dueReminders = Reminder::whereIn('habit_id', $habits->pluck('id'))
            ->where('is_active', true)->with('habit:id,name')->get()
            ->filter(fn ($r) => in_array($today->dayOfWeek, $r->days_of_week ?? [])
                && $r->remind_time <= now()->format('H:i:s')
                && $todayList->firstWhere('id', $r->habit_id)['today_status'] !== 'completed')
            ->values();

        return response()->json([
            'today' => $todayList,
            'summary' => [
                'active_habits' => $habits->count(),
                'completed_today' => $done,
                'best_current_streak' => (int) $todayList->max('current_streak'),
                'weekly_completion_rate' => $this->weeklyRate($habits),
            ],
            'due_reminders' => $dueReminders,
            'unread_notifications' => $user->appNotifications()->where('is_read', false)->count(),
        ]);
    }

    /** Per-habit completion rates plus a daily completions series for charts. */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $days = min(90, max(7, (int) $request->query('days', 30)));
        $from = Carbon::today()->subDays($days - 1);

        $habits = $user->habits()->where('status', '!=', 'archived')->get();

        $byHabit = $habits->map(fn (Habit $h) => [
            'id' => $h->id,
            'name' => $h->name,
            'completion_rate' => $this->streaks->completionRate($h, $days),
            'current_streak' => $this->streaks->streaks($h)['current'],
            'longest_streak' => $this->streaks->streaks($h)['longest'],
        ])->values();

        $counts = \App\Models\HabitLog::whereIn('habit_id', $habits->pluck('id'))
            ->where('status', 'completed')
            ->whereBetween('log_date', [$from->toDateString(), Carbon::today()->toDateString()])
            ->get()->groupBy(fn ($l) => $l->log_date->toDateString())->map->count();

        $series = [];
        for ($d = $from->copy(); $d->lte(Carbon::today()); $d->addDay()) {
            $series[] = ['date' => $d->toDateString(), 'completed' => (int) ($counts[$d->toDateString()] ?? 0)];
        }

        return response()->json(['days' => $days, 'habits' => $byHabit, 'daily' => $series]);
    }

    private function weeklyRate($habits): int
    {
        if ($habits->isEmpty()) {
            return 0;
        }

        return (int) round($habits->avg(fn (Habit $h) => $this->streaks->completionRate($h, 7)));
    }
}
