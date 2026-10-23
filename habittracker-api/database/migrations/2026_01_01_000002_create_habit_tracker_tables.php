<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->string('color', 20)->default('#6366f1');
            $table->timestamps();
        });

        Schema::create('habits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('frequency')->default('daily');      // daily | weekly
            $table->unsignedSmallInteger('target_per_period')->default(1);
            $table->date('start_date');
            $table->string('status')->default('active');        // active | paused | archived
            $table->timestamps();
        });

        Schema::create('habit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habit_id')->constrained()->cascadeOnDelete();
            $table->date('log_date');
            $table->string('status')->default('completed');     // completed | skipped | missed
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['habit_id', 'log_date']);
        });

        Schema::create('goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('habit_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('target_value');            // completions needed
            $table->date('target_date');
            $table->string('status')->default('active');        // active | completed | expired
            $table->timestamps();
        });

        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habit_id')->constrained()->cascadeOnDelete();
            $table->time('remind_time');
            $table->json('days_of_week');                       // [0..6], 0 = Sunday
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['notifications', 'reminders', 'goals', 'habit_logs', 'habits', 'categories'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
