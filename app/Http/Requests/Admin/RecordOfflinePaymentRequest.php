<?php

namespace App\Http\Requests\Admin;

use App\Auth\ContextManager;
use App\Models\CollectionAssignment;
use App\Services\EstateContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
        $estateId = resolve(EstateContextService::class)->getEstateId();

        return [
            'assignment_id' => [
                'required',
                'integer',
                Rule::exists('collection_assignments', 'id')->where('estate_id', $estateId),
            ],
            'amount' => ['required', 'numeric', 'min:1'],
            'method' => ['required', 'string', 'in:cash,bank_transfer,offline,manual'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $assignment = CollectionAssignment::withoutGlobalScopes()
                    ->find($this->integer('assignment_id'));

                if (! $assignment) {
                    return;
                }

                $context = app(ContextManager::class)->current();
                if ($context && ! $context->canAccess($assignment)) {
                    $validator->errors()->add('assignment_id', 'The selected assignment is outside your authorized scope.');

                    return;
                }

                $remaining = max(0, (int) $assignment->amount_due - (int) $assignment->amount_paid);
                if ($remaining <= 0) {
                    $validator->errors()->add('assignment_id', 'The selected assignment is already fully paid.');

                    return;
                }

                if ((float) $this->input('amount') > $remaining) {
                    $validator->errors()->add('amount', "Amount cannot exceed the remaining balance of {$remaining}.");
                }
            },
        ];
    }
}
