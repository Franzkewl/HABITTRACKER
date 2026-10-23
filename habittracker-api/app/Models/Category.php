<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'description', 'color'];

    public function habits(): HasMany
    {
        return $this->hasMany(Habit::class);
    }
}
