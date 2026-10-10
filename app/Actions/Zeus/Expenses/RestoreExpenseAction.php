<?php

namespace App\Actions\Zeus\Expenses;

use App\Models\Expense;

class RestoreExpenseAction
{
    public function execute(Expense $expense): void
    {
        $expense->restore();

        activity('zeus')
            ->performedOn($expense)
            ->withProperties(['actor' => 'zeus', 'amount' => $expense->amount, 'payee' => $expense->payee])
            ->log('Expense restored');
    }
}
