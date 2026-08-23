<?php

namespace App\Http\Requests\Admin;

use App\Auth\ContextManager;
use App\Services\EstateContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInviteLinkRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $context = app(ContextManager::class)->current();

        if ($context?->isZoneScoped() && ! $this->filled('zone_id')) {
            $this->merge(['zone_id' => $context->zoneId]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $estate = app(EstateContextService::class)->getEstate();

        return [
            'max_usages' => ['nullable', 'integer', 'min:0'],
            'requires_approval' => ['boolean'],
            'expires_at' => ['nullable', 'date', 'after:today'],
            'zone_id' => [
                'nullable',
                'integer',
                Rule::exists('zones', 'id')->where('estate_id', $estate->id),
                function ($attribute, $value, $fail) {
                    $context = app(ContextManager::class)->current();
                    if ($context && $context->isZoneScoped() && (int) $value !== $context->zoneId) {
                        $fail('Invite links can only target your active zone.');
                    }
                },
            ],
        ];
    }
}
