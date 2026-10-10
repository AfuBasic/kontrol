<?php

namespace App\Actions\Zeus\Expenses;

use App\Models\Expense;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class UpdateExpenseAction
{
    public function __construct(private StoreExpenseReceiptsAction $receipts) {}

    /**
     * @param  array{incurred_on: string, amount: int, expense_category_id: int, payee: string, note?: string|null, original_amount_note?: string|null}  $data
     * @param  array<int, UploadedFile>  $files
     */
    public function execute(Expense $expense, array $data, array $files = []): Expense
    {
        return DB::transaction(function () use ($expense, $data, $files) {
            $before = $expense->only(array_keys($data));
            $expense->update($data);
            $stored = $this->receipts->execute($expense, $files);

            activity('zeus')
                ->performedOn($expense)
                ->withProperties([
                    'actor' => 'zeus',
                    'old' => $before,
                    'attributes' => $expense->only(array_keys($data)),
                    'receipts_added' => count($stored),
                ])
                ->log('Expense updated');

            return $expense->load(['category', 'receipts']);
        });
    }
}
