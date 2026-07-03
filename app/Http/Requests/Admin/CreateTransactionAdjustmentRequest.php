<?php

namespace App\Http\Requests\Admin;

use App\Enums\TransactionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTransactionAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('transactions.adjust') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(TransactionType::class)],
            'amount' => ['required', 'integer', 'min:1'],
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }
}
