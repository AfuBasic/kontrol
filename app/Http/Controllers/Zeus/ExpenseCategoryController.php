<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\Expenses\ArchiveExpenseCategoryAction;
use App\Actions\Zeus\Expenses\SaveExpenseCategoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\ExpenseCategoryRequest;
use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;

class ExpenseCategoryController extends Controller
{
    public function store(ExpenseCategoryRequest $request, SaveExpenseCategoryAction $action): RedirectResponse
    {
        $action->execute($request->validated('name'));

        return back()->with('success', 'Category added.');
    }

    public function update(ExpenseCategoryRequest $request, ExpenseCategory $category, SaveExpenseCategoryAction $action): RedirectResponse
    {
        $action->execute($request->validated('name'), $category);

        return back()->with('success', 'Category renamed.');
    }

    public function destroy(ExpenseCategory $category, ArchiveExpenseCategoryAction $action): RedirectResponse
    {
        $action->execute($category);

        return back()->with('success', 'Category archived. Existing expenses keep it.');
    }
}
