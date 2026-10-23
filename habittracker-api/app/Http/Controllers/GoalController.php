<?php

namespace App\Http\Controllers;

use App\Http\Requests\GoalRequest;
use App\Models\Goal;
use App\Services\StreakService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoalController extends Controller
{
    public function __construct(private StreakService $streaks)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $page = $request->user()->goals()->with('habit:id,name')->latest()
            ->paginate((int) $request->query('per_page', 10));
        $page->getCollection()->transform(fn (Goal $g) => $this->present($g));

        return response()->json($page);
    }

    public function store(GoalRequest $request): JsonResponse
    {
        $request->user()->habits()->findOrFail($request->habit_id); // must own the habit
        $goal = $request->user()->goals()->create($request->validated());

        return response()->json($this->present($goal->load('habit:id,name')), 201);
    }

    public function update(GoalRequest $request, int $id): JsonResponse
    {
        $goal = $request->user()->goals()->findOrFail($id);
        $request->user()->habits()->findOrFail($request->habit_id);
        $goal->update($request->validated());

        return response()->json($this->present($goal->load('habit:id,name')));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->goals()->findOrFail($id)->delete();

        return response()->json(['message' => 'Goal deleted.']);
    }

    private function present(Goal $goal): array
    {
        $goal->loadMissing('habit');

        return array_merge($goal->toArray(), [
            'progress' => min($goal->target_value, $this->streaks->goalProgress($goal)),
        ]);
    }
}
