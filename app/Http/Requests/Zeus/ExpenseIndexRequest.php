<?php

namespace App\Http\Requests\Zeus;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ExpenseIndexRequest extends FormRequest
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
            // "Y-m", or "all" for every month.
            'month' => ['nullable', 'string', 'regex:/^(\d{4}-(0[1-9]|1[0-2])|all)$/'],
            'category_id' => ['nullable', 'integer'],
            'search' => ['nullable', 'string', 'max:100'],
            'archived' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Filters for the service. With no month chosen it defaults to the current month.
     *
     * @return array{month: string, category_id: int|null, search: string|null, archived: bool}
     */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'month' => $data['month'] ?? now()->format('Y-m'),
            'category_id' => isset($data['category_id']) ? (int) $data['category_id'] : null,
            'search' => filled($data['search'] ?? null) ? trim($data['search']) : null,
            'archived' => (bool) ($data['archived'] ?? false),
        ];
    }
}
