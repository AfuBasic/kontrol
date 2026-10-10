<?php

namespace App\Actions\Zeus\Expenses;

use App\Models\Expense;

class ArchiveExpenseAction
{
    /**
     * Archive (soft delete). The row and its receipts stay in the database and on disk.
     */
    public function execute(Expense $expense): void
    {
        $expense->delete();

        activity('zeus')
            ->performedOn($expense)
            ->withProperties(['actor' => 'zeus', 'amount' => $expense->amount, 'payee' => $expense->payee])
            ->log('Expense archived');
    }
}
