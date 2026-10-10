<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\Expenses\RemoveExpenseReceiptAction;
use App\Http\Controllers\Controller;
use App\Models\ExpenseReceipt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExpenseReceiptController extends Controller
{
    /**
     * Stream a receipt from the private disk. Only reachable through the Zeus session; the file has no public URL.
     */
    public function show(ExpenseReceipt $receipt): StreamedResponse
    {
        $disk = Storage::disk(ExpenseReceipt::DISK);

        abort_unless($disk->exists($receipt->path), 404);

        return $disk->response($receipt->path, $receipt->original_name, [
            'Content-Type' => $receipt->mime,
            'Content-Disposition' => 'inline; filename="'.addcslashes($receipt->original_name, '"\\').'"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    public function destroy(ExpenseReceipt $receipt, RemoveExpenseReceiptAction $action): RedirectResponse
    {
        $action->execute($receipt);

        return back()->with('success', 'Receipt removed.');
    }
}
