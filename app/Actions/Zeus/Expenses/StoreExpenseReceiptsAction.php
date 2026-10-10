<?php

namespace App\Actions\Zeus\Expenses;

use App\Models\Expense;
use App\Models\ExpenseReceipt;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StoreExpenseReceiptsAction
{
    /**
     * Save uploaded receipts on the private disk under random names. Names, types and sizes come from the file
     * contents, never from what the browser claims.
     *
     * @param  array<int, UploadedFile>  $files
     * @return array<int, ExpenseReceipt>
     */
    public function execute(Expense $expense, array $files): array
    {
        $stored = [];

        foreach ($files as $file) {
            $extension = $file->guessExtension() ?: 'bin';
            $directory = 'expenses/receipts/'.now()->format('Y/m');
            $path = Storage::disk(ExpenseReceipt::DISK)->putFileAs($directory, $file, Str::uuid()->toString().'.'.$extension);

            $stored[] = $expense->receipts()->create([
                'path' => $path,
                'original_name' => Str::limit(basename($file->getClientOriginalName()), 180, ''),
                'mime' => $file->getMimeType() ?: 'application/octet-stream',
                'size' => $file->getSize() ?: 0,
            ]);
        }

        return $stored;
    }
}
