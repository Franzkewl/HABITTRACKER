<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class AdminCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Category::withCount('habits')->orderBy('name')->get());
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        return response()->json(Category::create($request->validated()), 201);
    }

    public function update(CategoryRequest $request, int $category): JsonResponse
    {
        $c = Category::findOrFail($category);
        $c->update($request->validated());

        return response()->json($c);
    }

    public function destroy(int $category): JsonResponse
    {
        Category::findOrFail($category)->delete(); // habits keep existing, category_id becomes null

        return response()->json(['message' => 'Category deleted.']);
    }
}
