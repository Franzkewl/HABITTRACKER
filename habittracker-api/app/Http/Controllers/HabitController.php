<?php

namespace App\Http\Controllers;

use App\Http\Requests\HabitRequest;
use App\Models\Habit;
use App\Services\StreakService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HabitController extends Controller
{
    public function __construct(private StreakService $streaks)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->habits()->with('category');

        if ($s = $request->query('search')) {
            $query->where('name', 'like', "%{$s}%");
        }
        foreach (['category_id', 'frequency', 'status'] as $f) {
            if ($request->filled($f)) {
                $query->where($f, $request->query($f));
            }
        }

        $page = $query->latest()->paginate((int) $request->query('per_page', 9));
        $page->getCollection()->transform(fn (Habit $h) => $this->present($h));

        return response()->json($page);
    }

    public function store(HabitRequest $request): JsonResponse
    {
        $habit = $request->user()->habits()->create($request->validated());

        return response()->json($this->present($habit->load('category')), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $habit = $request->user()->habits()->with('category')->findOrFail($id);

        return response()->json($this->present($habit));
    }

    public function update(HabitRequest $request, int $id): JsonResponse
    {
        $habit = $request->user()->habits()->findOrFail($id);
        $habit->update($request->validated());

        return response()->json($this->present($habit->load('category')));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->habits()->findOrFail($id)->delete(); // logs, goals, reminders cascade

        return response()->json(['message' => 'Habit deleted.']);
    }

    private function present(Habit $habit): array
    {
        $s = $this->streaks->streaks($habit);
        $today = $habit->logs()->where('log_date', now()->toDateString())->first();

        return array_merge($habit->toArray(), [
            'current_streak' => $s['current'],
            'longest_streak' => $s['longest'],
            'completion_rate' => $this->streaks->completionRate($habit),
            'today_status' => $today?->status,
        ]);
    }
}
