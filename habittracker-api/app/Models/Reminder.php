<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reminder extends Model
{
    protected $fillable = ['habit_id', 'remind_time', 'days_of_week', 'is_active'];

    protected $casts = ['days_of_week' => 'array', 'is_active' => 'boolean'];

    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }
}
