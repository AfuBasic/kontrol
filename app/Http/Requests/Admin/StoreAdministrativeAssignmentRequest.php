<?php

namespace App\Http\Requests\Admin;

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Services\EstateContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdministrativeAssignmentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $context = app(ContextManager::class)->current();

        if ($context?->isZoneScoped() && $this->input('scope_type') === AssignmentScope::Zone->value && ! $this->filled('zone_id')) {
            $this->merge(['zone_id' => $context->zoneId]);
        }
    }

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
            'user_id' => [
                'required',
                'integer',
                Rule::exists('estate_users_membership', 'user_id')
                    ->where('estate_id', $estateId)
                    ->where('status', 'accepted'),
            ],
            'role_ids' => [
                'required',
                'array',
            ],
            'role_ids.*' => [
                'integer',
                Rule::exists('roles', 'id')->where('estate_id', $estateId),
            ],
            'scope_type' => [
                'required',
                Rule::enum(AssignmentScope::class),
                function ($attribute, $value, $fail) {
                    $context = app(ContextManager::class)->current();
                    if ($context?->isZoneScoped() && $value !== AssignmentScope::Zone->value) {
                        $fail('Zone-scoped administrators can only create zone-scoped assignments.');
                    }
                },
            ],
            'zone_id' => [
                'nullable',
                'integer',
                Rule::requiredIf(fn () => $this->input('scope_type') === AssignmentScope::Zone->value),
                Rule::prohibitedIf(fn () => $this->input('scope_type') === AssignmentScope::Estate->value),
                Rule::exists('zones', 'id')->where('estate_id', $estateId),
                function ($attribute, $value, $fail) {
                    $context = app(ContextManager::class)->current();
                    if ($context?->isZoneScoped() && (int) $value !== $context->zoneId) {
                        $fail('Zone-scoped administrators can only assign authority within their active zone.');
                    }
                },
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
            'user_id.exists' => 'The selected user is not an accepted member of this estate.',
            'role_id.exists' => 'The selected role is not available in this estate.',
            'zone_id.required' => 'A zone is required for zone-scoped assignments.',
            'zone_id.prohibited' => 'A zone cannot be set for estate-scoped assignments.',
            'zone_id.exists' => 'The selected zone does not belong to this estate.',
            'scope_type.in' => 'The selected scope is invalid.',
        ];
    }
}
