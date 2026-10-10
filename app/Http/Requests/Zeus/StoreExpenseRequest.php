<?php

namespace App\Http\Requests\Zeus;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    public const MAX_RECEIPTS = 5;

    public const MAX_RECEIPT_KB = 10240;

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
            'incurred_on' => ['required', 'date', 'before_or_equal:today', 'after:2000-01-01'],
            // Naira, as typed. Converted to kobo in payload().
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999.99', 'decimal:0,2'],
            'expense_category_id' => ['required', 'integer', Rule::exists('expense_categories', 'id')->whereNull('deleted_at')],
            'payee' => ['required', 'string', 'max:150'],
            'note' => ['nullable', 'string', 'max:2000'],
            'original_amount_note' => ['nullable', 'string', 'max:60'],
            'receipts' => ['nullable', 'array', 'max:'.self::MAX_RECEIPTS],
            // "mimes" checks the real file content, not just the extension.
            'receipts.*' => ['file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:'.self::MAX_RECEIPT_KB],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'amount.gt' => 'The amount must be more than zero.',
            'amount.decimal' => 'Use at most two decimal places.',
            'incurred_on.before_or_equal' => 'An expense cannot be dated in the future.',
            'expense_category_id.exists' => 'Choose one of the available categories.',
            'receipts.max' => 'Attach at most '.self::MAX_RECEIPTS.' receipts at a time.',
            'receipts.*.mimes' => 'Receipts must be JPG, PNG, WEBP or PDF files.',
            'receipts.*.max' => 'Each receipt must be 10 MB or smaller.',
        ];
    }

    /**
     * The expense fields ready to save (amount in kobo).
     *
     * @return array{incurred_on: string, amount: int, expense_category_id: int, payee: string, note: string|null, original_amount_note: string|null}
     */
    public function payload(): array
    {
        $data = $this->validated();

        return [
            'incurred_on' => $data['incurred_on'],
            'amount' => (int) round(((float) $data['amount']) * 100),
            'expense_category_id' => (int) $data['expense_category_id'],
            'payee' => trim($data['payee']),
            'note' => filled($data['note'] ?? null) ? trim($data['note']) : null,
            'original_amount_note' => filled($data['original_amount_note'] ?? null) ? trim($data['original_amount_note']) : null,
        ];
    }

    /**
     * @return array<int, UploadedFile>
     */
    public function receiptFiles(): array
    {
        return array_values($this->file('receipts', []) ?? []);
    }
}
