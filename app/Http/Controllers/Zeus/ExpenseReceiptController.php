<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\Expenses\RemoveExpenseReceiptAction;
use App\Http\Controllers\Controller;
use App\Models\ExpenseReceipt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExpenseReceiptController extends Controller
{
    /**
     * Stream a receipt from the private disk. Only reachable through the Zeus session; the file has no public URL.
     * With ?download=1 the browser saves it instead of showing it.
     */
    public function show(Request $request, ExpenseReceipt $receipt): StreamedResponse
    {
        $disk = Storage::disk(ExpenseReceipt::DISK);

        abort_unless($disk->exists($receipt->path), 404);

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return $disk->response($receipt->path, $receipt->original_name, [
            'Content-Type' => $receipt->mime,
            'Content-Disposition' => $disposition.'; filename="'.addcslashes($receipt->original_name, '"\\').'"',
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
