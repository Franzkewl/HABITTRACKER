<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /** Readable by every authenticated user. Writes live in Admin\AdminCategoryController. */
    public function index(): JsonResponse
    {
        return response()->json(Category::orderBy('name')->get());
    }
}
