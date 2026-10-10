<?php

namespace App\Actions\Zeus\Expenses;

use App\Models\ExpenseCategory;

class ArchiveExpenseCategoryAction
{
    /**
     * Archive a category. Expenses already filed under it keep it, and keep showing its name.
     */
    public function execute(ExpenseCategory $category): void
    {
        $category->delete();

        activity('zeus')
            ->performedOn($category)
            ->withProperties(['actor' => 'zeus', 'name' => $category->name])
            ->log('Expense category archived');
    }
}
