<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HabitLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'log_date' => ['required', 'date', 'before_or_equal:today'],
            'status' => ['required', Rule::in(['completed', 'skipped', 'missed'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
