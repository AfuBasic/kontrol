<?php

namespace App\Http\Requests\Zeus;

use App\Services\Zeus\FailedJobService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FailedJobIndexRequest extends FormRequest
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
            'search' => ['nullable', 'string', 'max:100'],
            'queue' => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9_.:-]+$/'],
            'range' => ['nullable', 'string', Rule::in(array_keys(FailedJobService::RANGES))],
            'per_page' => ['nullable', 'integer', Rule::in(FailedJobService::PER_PAGE)],
        ];
    }

    /**
     * @return array{search: string|null, queue: string|null, range: string, per_page: int}
     */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'search' => filled($data['search'] ?? null) ? trim($data['search']) : null,
            'queue' => $data['queue'] ?? null,
            'range' => $data['range'] ?? '7d',
            'per_page' => (int) ($data['per_page'] ?? FailedJobService::PER_PAGE[0]),
        ];
    }
}
