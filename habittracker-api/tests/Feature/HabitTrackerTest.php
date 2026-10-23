<?php

namespace Tests\Feature;

use App\Models\Habit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HabitTrackerTest extends TestCase
{
    use RefreshDatabase;

    private function habitFor(User $u, array $o = []): Habit
    {
        return Habit::create(array_merge([
            'user_id' => $u->id, 'name' => 'Read', 'frequency' => 'daily',
            'target_per_period' => 1, 'start_date' => Carbon::today()->subDays(10)->toDateString(),
        ], $o));
    }

    public function test_register_login_and_me(): void
    {
        $r = $this->postJson('/api/register', [
            'name' => 'Ana', 'email' => 'ana@test.com', 'password' => 'password1', 'password_confirmation' => 'password1',
        ])->assertCreated();

        $this->withToken($r->json('token'))->getJson('/api/me')->assertOk()->assertJsonPath('email', 'ana@test.com');
        $this->postJson('/api/login', ['email' => 'ana@test.com', 'password' => 'wrong'])->assertStatus(422);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'a@test.com']);
        $this->postJson('/api/register', [
            'name' => 'A', 'email' => 'a@test.com', 'password' => 'password1', 'password_confirmation' => 'password1',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_streak_counts_consecutive_days(): void
    {
        $u = User::factory()->create();
        Sanctum::actingAs($u);
        $h = $this->habitFor($u);

        foreach ([0, 1, 2] as $ago) {
            $this->postJson("/api/habits/{$h->id}/logs", [
                'log_date' => Carbon::today()->subDays($ago)->toDateString(), 'status' => 'completed',
            ])->assertSuccessful();
        }

        $this->getJson("/api/habits/{$h->id}")->assertOk()
            ->assertJsonPath('current_streak', 3)->assertJsonPath('longest_streak', 3);
    }

    public function test_one_log_per_date_is_updated_not_duplicated(): void
    {
        $u = User::factory()->create();
        Sanctum::actingAs($u);
        $h = $this->habitFor($u);
        $date = Carbon::today()->toDateString();

        $this->postJson("/api/habits/{$h->id}/logs", ['log_date' => $date, 'status' => 'completed'])->assertCreated();
        $this->postJson("/api/habits/{$h->id}/logs", ['log_date' => $date, 'status' => 'skipped'])->assertOk();
        $this->assertDatabaseCount('habit_logs', 1);
    }

    public function test_users_cannot_access_other_users_habits(): void
    {
        $owner = User::factory()->create();
        $h = $this->habitFor($owner);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/habits/{$h->id}")->assertNotFound();
        $this->deleteJson("/api/habits/{$h->id}")->assertNotFound();
    }

    public function test_admin_routes_are_protected(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'user']));
        $this->getJson('/api/admin/users')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/admin/users')->assertOk();
    }

    public function test_habit_validation(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/habits', ['name' => '', 'frequency' => 'hourly'])
            ->assertStatus(422)->assertJsonValidationErrors(['name', 'frequency', 'start_date']);
    }

    public function test_milestone_notification_created_at_seven_days(): void
    {
        $u = User::factory()->create();
        Sanctum::actingAs($u);
        $h = $this->habitFor($u);

        foreach (range(6, 0) as $ago) {
            $this->postJson("/api/habits/{$h->id}/logs", [
                'log_date' => Carbon::today()->subDays($ago)->toDateString(), 'status' => 'completed',
            ]);
        }

        $this->assertDatabaseHas('notifications', ['user_id' => $u->id, 'title' => '7-day streak!']);
    }
}
