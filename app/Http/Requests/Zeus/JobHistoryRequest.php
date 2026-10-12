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
        ];
    }

    /**
     * @return array{status: string|null, search: string|null}
     */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'status' => $data['status'] ?? null,
            'search' => filled($data['search'] ?? null) ? trim($data['search']) : null,
        ];
    }
}
