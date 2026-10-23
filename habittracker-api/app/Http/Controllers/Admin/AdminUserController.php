<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = User::withCount('habits');
        if ($s = $request->query('search')) {
            $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"));
        }
        foreach (['role', 'status'] as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }

        return response()->json($q->latest()->paginate((int) $request->query('per_page', 10)));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['sometimes', Rule::in(['admin', 'user'])],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        if ($user->id === $request->user()->id && (
            (isset($data['role']) && $data['role'] !== 'admin') ||
            (isset($data['status']) && $data['status'] !== 'active')
        )) {
            return response()->json(['message' => 'You cannot demote or deactivate your own account.'], 422);
        }

        $user->update($data);
        if (($data['status'] ?? null) === 'inactive') {
            $user->tokens()->delete();
        }

        return response()->json($user);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }
        User::findOrFail($id)->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
