<?php

use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminStatsController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\HabitController;
use App\Http\Controllers\HabitLogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReminderController;
use App\Http\Middleware\ActiveAccount;
use App\Http\Middleware\AdminOnly;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', ActiveAccount::class])->group(function () {
    // Account
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);

    // Reference data
    Route::get('/categories', [CategoryController::class, 'index']);

    // Habits + logs
    Route::apiResource('habits', HabitController::class);
    Route::get('/habits/{habit}/logs', [HabitLogController::class, 'index']);
    Route::post('/habits/{habit}/logs', [HabitLogController::class, 'store']);
    Route::delete('/habits/{habit}/logs/{log}', [HabitLogController::class, 'destroy']);

    // Goals, reminders
    Route::apiResource('goals', GoalController::class)->except('show');
    Route::apiResource('reminders', ReminderController::class)->except('show');

    // Dashboard, stats, notifications
    Route::get('/dashboard', [DashboardController::class, 'dashboard']);
    Route::get('/stats', [DashboardController::class, 'stats']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // Admin only
    Route::prefix('admin')->middleware(AdminOnly::class)->group(function () {
        Route::get('/stats', AdminStatsController::class);
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::put('/users/{id}', [AdminUserController::class, 'update']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
        Route::apiResource('categories', AdminCategoryController::class)->except('show');
    });
});
