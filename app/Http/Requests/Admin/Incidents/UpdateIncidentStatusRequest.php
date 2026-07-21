<?php

namespace App\Http\Requests\Admin\Incidents;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIncidentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(['pending', 'acknowledged', 'resolving', 'solved', 'closed'])],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'priority' => ['nullable', Rule::in(['critical', 'high', 'medium', 'low'])],
            'category' => ['nullable', 'string'],
            'is_private' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Status is required.',
            'status.in' => 'Invalid status option.',
            'assigned_to.exists' => 'The selected assignee does not exist.',
        ];
    }
}
