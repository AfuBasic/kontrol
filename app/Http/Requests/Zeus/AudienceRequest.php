<?php

namespace App\Http\Requests\Zeus;

use App\Services\Zeus\AudienceService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AudienceRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Zeus access is enforced by the route group's middleware.
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'range' => ['nullable', 'string', Rule::in(array_keys(AudienceService::RANGES))],
            'tab' => ['nullable', 'string', Rule::in(['overview', 'estates', 'online'])],
            'search' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'string', Rule::in(AudienceService::ESTATE_SORTS)],
            'per_page' => ['nullable', 'integer', Rule::in(AudienceService::PER_PAGE)],
        ];
    }

    /**
     * @return array{range: string, tab: string, search: string|null, sort: string, per_page: int}
     */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'range' => $data['range'] ?? '30d',
            'tab' => $data['tab'] ?? 'overview',
            'search' => filled($data['search'] ?? null) ? trim($data['search']) : null,
            'sort' => $data['sort'] ?? 'active',
            'per_page' => (int) ($data['per_page'] ?? AudienceService::PER_PAGE[0]),
        ];
    }
}
