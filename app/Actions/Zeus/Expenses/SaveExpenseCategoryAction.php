<?php

namespace App\Actions\Zeus\Expenses;

use App\Models\ExpenseCategory;

class SaveExpenseCategoryAction
{
    public function execute(string $name, ?ExpenseCategory $category = null): ExpenseCategory
    {
        $name = trim($name);

        if ($category) {
            $old = $category->name;
            $category->update(['name' => $name]);

            activity('zeus')
                ->performedOn($category)
                ->withProperties(['actor' => 'zeus', 'old' => $old, 'new' => $name])
                ->log('Expense category renamed');

            return $category;
        }

        $category = ExpenseCategory::create(['name' => $name, 'sort_order' => (int) ExpenseCategory::max('sort_order') + 1]);

        activity('zeus')
            ->performedOn($category)
            ->withProperties(['actor' => 'zeus', 'name' => $name])
            ->log('Expense category added');

        return $category;
    }
}
