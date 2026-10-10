<?php

namespace App\Actions\Zeus\Expenses;

use App\Models\Expense;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class CreateExpenseAction
{
    public function __construct(private StoreExpenseReceiptsAction $receipts) {}

    /**
     * @param  array{incurred_on: string, amount: int, expense_category_id: int, payee: string, note?: string|null, original_amount_note?: string|null}  $data
     * @param  array<int, UploadedFile>  $files
     */
    public function execute(array $data, array $files = []): Expense
    {
        return DB::transaction(function () use ($data, $files) {
            $expense = Expense::create($data);
            $stored = $this->receipts->execute($expense, $files);

            activity('zeus')
                ->performedOn($expense)
                ->withProperties(['actor' => 'zeus', 'attributes' => $expense->only(array_keys($data)), 'receipts_added' => count($stored)])
                ->log('Expense recorded');

            return $expense->load(['category', 'receipts']);
        });
    }
}
