<?php

namespace App\Http\Requests\Admin;

use App\Enums\AssignmentScope;
use App\Services\EstateContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdministrativeAssignmentRequest extends FormRequest
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
        $estateId = resolve(EstateContextService::class)->getEstateId();

        return [
            'role_ids' => [
                'required',
                'array',
            ],
            'role_ids.*' => [
                'integer',
                Rule::exists('roles', 'id')->where('estate_id', $estateId),
            ],
            'scope_type' => ['required', Rule::enum(AssignmentScope::class)],
            'zone_id' => [
                'nullable',
                'integer',
                Rule::requiredIf(fn () => $this->input('scope_type') === AssignmentScope::Zone->value),
                Rule::prohibitedIf(fn () => $this->input('scope_type') === AssignmentScope::Estate->value),
                Rule::exists('zones', 'id')->where('estate_id', $estateId),
            ],
            'is_primary' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role_id.exists' => 'The selected role is not available in this estate.',
            'zone_id.required' => 'A zone is required for zone-scoped assignments.',
            'zone_id.prohibited' => 'A zone cannot be set for estate-scoped assignments.',
            'zone_id.exists' => 'The selected zone does not belong to this estate.',
        ];
    }
}
