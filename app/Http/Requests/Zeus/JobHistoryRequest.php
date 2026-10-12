<?php

namespace App\Http\Requests\Zeus;

use App\Services\Zeus\JobHistoryService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class JobHistoryRequest extends FormRequest
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
            'status' => ['nullable', 'string', Rule::in(JobHistoryService::STATUSES)],
            'search' => ['nullable', 'string', 'max:100'],
            'queue' => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9_.:-]+$/'],
            'range' => ['nullable', 'string', Rule::in(array_keys(JobHistoryService::RANGES))],
            'per_page' => ['nullable', 'integer', Rule::in(JobHistoryService::PER_PAGE)],
        ];
    }

    /**
     * @return array{status: string|null, search: string|null, queue: string|null, range: string, per_page: int}
     */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'status' => $data['status'] ?? null,
            'search' => filled($data['search'] ?? null) ? trim($data['search']) : null,
            'queue' => $data['queue'] ?? null,
            'range' => $data['range'] ?? '24h',
            'per_page' => (int) ($data['per_page'] ?? JobHistoryService::PER_PAGE[0]),
        ];
    }
}
