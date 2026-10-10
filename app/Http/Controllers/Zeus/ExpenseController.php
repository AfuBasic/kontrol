<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\Expenses\ArchiveExpenseAction;
use App\Actions\Zeus\Expenses\CreateExpenseAction;
use App\Actions\Zeus\Expenses\RestoreExpenseAction;
use App\Actions\Zeus\Expenses\UpdateExpenseAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\ExpenseIndexRequest;
use App\Http\Requests\Zeus\StoreExpenseRequest;
use App\Http\Requests\Zeus\UpdateExpenseRequest;
use App\Models\Expense;
use App\Services\Zeus\ExpenseService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExpenseController extends Controller
{
    public function __construct(private ExpenseService $expenses) {}

    public function index(ExpenseIndexRequest $request): InertiaResponse
    {
        $filters = $request->filters();

        return Inertia::render('Zeus/Expenses/Index', [
            'filters' => $filters,
            'expenses' => Inertia::scroll(fn () => $this->expenses->paginate($filters)->through(fn (Expense $expense) => $this->present($expense))),
            'summary' => $this->expenses->summary($filters),
            'categories' => $this->expenses->categories(),
            'limits' => [
                'max_receipts' => StoreExpenseRequest::MAX_RECEIPTS,
                'max_receipt_mb' => StoreExpenseRequest::MAX_RECEIPT_KB / 1024,
            ],
        ]);
    }

    public function store(StoreExpenseRequest $request, CreateExpenseAction $action): RedirectResponse
    {
        $action->execute($request->payload(), $request->receiptFiles());

        return back()->with('success', 'Expense recorded.');
    }

    public function update(UpdateExpenseRequest $request, Expense $expense, UpdateExpenseAction $action): RedirectResponse
    {
        $action->execute($expense, $request->payload(), $request->receiptFiles());

        return back()->with('success', 'Expense updated.');
    }

    public function destroy(Expense $expense, ArchiveExpenseAction $action): RedirectResponse
    {
        $action->execute($expense);

        return back()->with('success', 'Expense archived.');
    }

    public function restore(Expense $expense, RestoreExpenseAction $action): RedirectResponse
    {
        $action->execute($expense);

        return back()->with('success', 'Expense restored.');
    }

    /**
     * CSV of whatever the filters currently show, newest first, in naira.
     */
    public function export(ExpenseIndexRequest $request): StreamedResponse
    {
        $filters = $request->filters();
        $name = 'expenses-'.($filters['month'] === 'all' ? 'all-time' : $filters['month']).'.csv';

        return response()->streamDownload(function () use ($filters) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Date', 'Payee', 'Category', 'Amount (NGN)', 'Original amount', 'Note', 'Receipts']);

            $this->expenses->query($filters)->with(['category', 'receipts'])->chunkById(200, function ($chunk) use ($out) {
                foreach ($chunk as $expense) {
                    fputcsv($out, array_map($this->safeCell(...), [
                        $expense->incurred_on->toDateString(),
                        $expense->payee,
                        $expense->category?->name,
                        number_format($expense->amount / 100, 2, '.', ''),
                        $expense->original_amount_note,
                        $expense->note,
                        $expense->receipts->pluck('original_name')->implode('; '),
                    ]));
                }
            });

            fclose($out);
        }, $name, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Stop spreadsheet apps from running a cell that starts like a formula.
     */
    private function safeCell(mixed $value): mixed
    {
        return is_string($value) && $value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true) ? "'".$value : $value;
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Expense $expense): array
    {
        return [
            'id' => $expense->id,
            'incurred_on' => $expense->incurred_on->toDateString(),
            'amount' => $expense->amount,
            'payee' => $expense->payee,
            'note' => $expense->note,
            'original_amount_note' => $expense->original_amount_note,
            'archived' => $expense->trashed(),
            'category' => ['id' => $expense->category?->id, 'name' => $expense->category?->name, 'archived' => (bool) $expense->category?->trashed()],
            'receipts' => $expense->receipts->map(fn ($receipt) => [
                'id' => $receipt->id,
                'name' => $receipt->original_name,
                'mime' => $receipt->mime,
                'size' => $receipt->size,
                'is_pdf' => $receipt->isPdf(),
                'url' => route('zeus.expenses.receipts.show', $receipt),
                'download_url' => route('zeus.expenses.receipts.show', ['receipt' => $receipt, 'download' => 1]),
            ])->values()->all(),
        ];
    }
}
