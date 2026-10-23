<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HabitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'frequency' => ['required', Rule::in(['daily', 'weekly'])],
            'target_per_period' => ['required', 'integer', 'min:1', 'max:7'],
            'start_date' => ['required', 'date'],
            'status' => ['sometimes', Rule::in(['active', 'paused', 'archived'])],
        ];
    }
}
