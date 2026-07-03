<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class RecordOfflinePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('transactions.record_offline_payment') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'assignment_id' => ['required', 'integer', 'exists:collection_assignments,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'string', 'in:cash,bank_transfer,offline,manual'],
        ];
    }
}
