<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEstateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'access_codes_enabled' => ['required', 'boolean'],
            'access_code_min_lifespan_minutes' => ['required', 'integer', 'min:1', 'max:10080'],
            'access_code_max_lifespan_minutes' => [
                'required',
                'integer',
                'min:1',
                'max:10080',
                'gte:access_code_min_lifespan_minutes',
            ],
            'access_code_single_use' => ['required', 'boolean'],
            'access_code_grace_period_minutes' => ['required', 'integer', 'min:0', 'max:60'],
            'access_code_daily_limit_per_resident' => ['nullable', 'integer', 'min:1', 'max:100'],
            'access_code_require_confirmation' => ['required', 'boolean'],
            'contacts' => ['nullable', 'array', 'max:20'],
            'contacts.*.name' => ['required', 'string', 'max:100'],
            'contacts.*.value' => ['required', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'access_code_max_lifespan_minutes.gte' => 'Maximum lifespan must be greater than or equal to minimum lifespan.',
        ];
    }
}
