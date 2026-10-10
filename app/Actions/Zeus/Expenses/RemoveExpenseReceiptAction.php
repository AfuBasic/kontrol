<?php

namespace App\Actions\Zeus\Expenses;

use App\Models\ExpenseReceipt;

class RemoveExpenseReceiptAction
{
    /**
     * Detach a receipt from its expense (soft delete). The file stays on disk, so nothing is lost for good.
     */
    public function execute(ExpenseReceipt $receipt): void
    {
        $receipt->delete();

        activity('zeus')
            ->performedOn($receipt->expense)
            ->withProperties(['actor' => 'zeus', 'receipt' => $receipt->original_name])
            ->log('Expense receipt removed');
    }
}
