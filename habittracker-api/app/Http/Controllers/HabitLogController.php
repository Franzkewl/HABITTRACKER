<?php

namespace App\Http\Controllers;

use App\Http\Requests\HabitLogRequest;
use App\Services\StreakService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HabitLogController extends Controller
{
    public function __construct(private StreakService $streaks)
    {
    }

    public function index(Request $request, int $habit): JsonResponse
    {
        $habit = $request->user()->habits()->findOrFail($habit);

        return response()->json(
            $habit->logs()->orderByDesc('log_date')->paginate((int) $request->query('per_page', 15))
        );
    }

    /** Creates or updates the log for a given date (one log per habit per date). */
    public function store(HabitLogRequest $request, int $habit): JsonResponse
    {
        $habit = $request->user()->habits()->findOrFail($habit);
        $data = $request->validated();

        $log = $habit->logs()->updateOrCreate(
            ['log_date' => $data['log_date']],
            ['status' => $data['status'], 'notes' => $data['notes'] ?? null]
        );

        if ($log->status === 'completed') {
            $this->streaks->afterCompletion($habit);
        }

        return response()->json($log, $log->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, int $habit, int $log): JsonResponse
    {
        $habit = $request->user()->habits()->findOrFail($habit);
        $habit->logs()->findOrFail($log)->delete();

        return response()->json(['message' => 'Log removed.']);
    }
}
