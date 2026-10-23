<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'unread' => $request->user()->appNotifications()->where('is_read', false)->count(),
            'notifications' => $request->user()->appNotifications()->latest()->paginate(15),
        ]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $n = $request->user()->appNotifications()->findOrFail($id);
        $n->update(['is_read' => true]);

        return response()->json($n);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->appNotifications()->where('is_read', false)->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
