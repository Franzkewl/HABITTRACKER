<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HabitLog extends Model
{
    protected $fillable = ['habit_id', 'log_date', 'status', 'notes'];

    protected $casts = ['log_date' => 'date:Y-m-d'];

    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }
}
