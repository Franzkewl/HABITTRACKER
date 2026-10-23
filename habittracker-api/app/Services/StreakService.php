<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\Goal;
use App\Models\Habit;
use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * Streak, completion-rate and goal logic.
 *
 * Daily habits:  a streak is the number of consecutive days with a "completed" log.
 *                A streak stays alive if today has not been logged yet but yesterday was.
 * Weekly habits: a streak is the number of consecutive weeks (Mon-Sun) in which the
 *                habit was completed at least target_per_period times.
 */
class StreakService
{
    public const MILESTONES = [7, 30, 100];

    /** @return array{current:int,longest:int} */
    public function streaks(Habit $habit): array
    {
        $dates = $habit->logs()->where('status', 'completed')
            ->orderBy('log_date')->pluck('log_date')
            ->map(fn ($d) => Carbon::parse($d)->startOfDay());

        return $habit->frequency === 'weekly'
            ? $this->weeklyStreaks($dates, max(1, (int) $habit->target_per_period))
            : $this->dailyStreaks($dates);
    }

    private function dailyStreaks($dates): array
    {
        $set = $dates->map->toDateString()->flip();
        if ($set->isEmpty()) {
            return ['current' => 0, 'longest' => 0];
        }

        // longest
        $longest = 0;
        $run = 0;
        $prev = null;
        foreach ($dates as $d) {
            $run = ($prev && $prev->copy()->addDay()->isSameDay($d)) ? $run + 1 : 1;
            $longest = max($longest, $run);
            $prev = $d;
        }

        // current
        $cursor = Carbon::today();
        if (! $set->has($cursor->toDateString())) {
            $cursor->subDay();
        }
        $current = 0;
        while ($set->has($cursor->toDateString())) {
            $current++;
            $cursor->subDay();
        }

        return ['current' => $current, 'longest' => $longest];
    }

    private function weeklyStreaks($dates, int $target): array
    {
        $perWeek = $dates->groupBy(fn (CarbonInterface $d) => $d->copy()->startOfWeek()->toDateString())
            ->map->count();
        $qualified = $perWeek->filter(fn ($c) => $c >= $target)->keys()
            ->map(fn ($w) => Carbon::parse($w))->sort()->values();

        if ($qualified->isEmpty()) {
            return ['current' => 0, 'longest' => 0];
        }

        $longest = 0;
        $run = 0;
        $prev = null;
        foreach ($qualified as $w) {
            $run = ($prev && $prev->copy()->addWeek()->isSameDay($w)) ? $run + 1 : 1;
            $longest = max($longest, $run);
            $prev = $w;
        }

        $set = $qualified->map->toDateString()->flip();
        $cursor = Carbon::today()->startOfWeek();
        if (! $set->has($cursor->toDateString())) {
            $cursor->subWeek(); // current week may still be in progress
        }
        $current = 0;
        while ($set->has($cursor->toDateString())) {
            $current++;
            $cursor->subWeek();
        }

        return ['current' => $current, 'longest' => $longest];
    }

    /** Completion rate (0-100) over the last $days days, counting only days since the habit started. */
    public function completionRate(Habit $habit, int $days = 30): int
    {
        $from = Carbon::today()->subDays($days - 1);
        if ($habit->start_date && $habit->start_date->gt($from)) {
            $from = $habit->start_date->copy();
        }
        $to = Carbon::today();
        if ($from->gt($to)) {
            return 0;
        }

        $completed = $habit->logs()->where('status', 'completed')
            ->whereBetween('log_date', [$from->toDateString(), $to->toDateString()])->count();

        $span = (int) abs($from->diffInDays($to)) + 1;
        $expected = $habit->frequency === 'weekly'
            ? max(1, (int) ceil($span / 7) * $habit->target_per_period)
            : $span;

        return (int) min(100, round($completed / $expected * 100));
    }

    public function goalProgress(Goal $goal): int
    {
        return $goal->habit->logs()->where('status', 'completed')
            ->where('log_date', '>=', $goal->created_at->toDateString())
            ->where('log_date', '<=', $goal->target_date->toDateString())
            ->count();
    }

    /** Creates streak-milestone and goal notifications after a completion is logged. */
    public function afterCompletion(Habit $habit): void
    {
        $current = $this->streaks($habit)['current'];
        if (in_array($current, self::MILESTONES, true) && $habit->frequency === 'daily') {
            AppNotification::create([
                'user_id' => $habit->user_id,
                'title' => "{$current}-day streak!",
                'message' => "You've completed \"{$habit->name}\" {$current} days in a row. Keep it up!",
            ]);
        }

        foreach ($habit->goals()->where('status', 'active')->get() as $goal) {
            if ($this->goalProgress($goal) >= $goal->target_value) {
                $goal->update(['status' => 'completed']);
                AppNotification::create([
                    'user_id' => $goal->user_id,
                    'title' => 'Goal reached',
                    'message' => "You reached your goal \"{$goal->title}\".",
                ]);
            }
        }
    }
}
