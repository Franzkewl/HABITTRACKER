<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'habit_id' => ['required', 'integer', 'exists:habits,id'],
            'title' => ['required', 'string', 'max:255'],
            'target_value' => ['required', 'integer', 'min:1', 'max:10000'],
            'target_date' => ['required', 'date', 'after:today'],
        ];
    }
}
