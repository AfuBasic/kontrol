<?php

namespace App\Http\Requests\Zeus;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEstateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Zeus auth middleware handles authorization
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:estates,email', 'unique:users,email'],
            'address' => ['nullable', 'string', 'max:500'],
            'plan_id' => ['required', 'exists:plans,id'],
            'charge_type' => ['sometimes', 'in:residents,estate'],
            'free_trial_enabled' => ['sometimes', 'boolean'],
            'free_trial_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'has_partner' => ['sometimes', 'boolean'],
            'partner_id' => [
                Rule::requiredIf(fn () => $this->boolean('has_partner')),
                'nullable',
                'exists:partners,id',
            ],
            'partner_source' => ['nullable', 'string', 'max:255'],
            'partner_notes' => ['nullable', 'string', 'max:2000'],
            'commission_starts_at' => ['nullable', 'date'],
            'commission_ends_at' => ['nullable', 'date', 'after_or_equal:commission_starts_at'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'This email is already associated with an estate or user.',
        ];
    }
}
