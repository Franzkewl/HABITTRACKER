<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReminderRequest;
use App\Models\Reminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ids = $request->user()->habits()->pluck('id');

        return response()->json(
            Reminder::whereIn('habit_id', $ids)->with('habit:id,name')->orderBy('remind_time')->get()
        );
    }

    public function store(ReminderRequest $request): JsonResponse
    {
        $request->user()->habits()->findOrFail($request->habit_id);
        $reminder = Reminder::create($request->validated());

        return response()->json($reminder->load('habit:id,name'), 201);
    }

    public function update(ReminderRequest $request, int $id): JsonResponse
    {
        $reminder = $this->owned($request, $id);
        $request->user()->habits()->findOrFail($request->habit_id);
        $reminder->update($request->validated());

        return response()->json($reminder->load('habit:id,name'));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->owned($request, $id)->delete();

        return response()->json(['message' => 'Reminder deleted.']);
    }

    private function owned(Request $request, int $id): Reminder
    {
        $ids = $request->user()->habits()->pluck('id');

        return Reminder::whereIn('habit_id', $ids)->findOrFail($id);
    }
}
