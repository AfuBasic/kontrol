<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\Expenses\RemoveExpenseReceiptAction;
use App\Http\Controllers\Controller;
use App\Models\ExpenseReceipt;
use App\Services\Zeus\Receipts\ReceiptStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExpenseReceiptController extends Controller
{
    public function __construct(private ReceiptStorage $storage) {}

    /**
     * Show or download a receipt. Only reachable through the Zeus session; the file has no public URL.
     * With ?download=1 the browser saves it instead of showing it.
     */
    public function show(Request $request, ExpenseReceipt $receipt): Response
    {
        return $this->storage->respond($receipt, $request->boolean('download'));
    }

    public function destroy(ExpenseReceipt $receipt, RemoveExpenseReceiptAction $action): RedirectResponse
    {
        $action->execute($receipt);

        return back()->with('success', 'Receipt removed.');
    }
}
