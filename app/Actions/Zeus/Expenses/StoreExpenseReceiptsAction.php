<?php

namespace App\Actions\Zeus\Expenses;

use App\Models\Expense;
use App\Services\Zeus\Receipts\ReceiptStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class StoreExpenseReceiptsAction
{
    public function __construct(private ReceiptStorage $storage) {}

    /**
     * Save uploaded receipts on the default disk (private on Cloudinary) under random names. Names, types and sizes come from the file
     * contents, never from what the browser claims.
     *
     * @param  array<int, UploadedFile>  $files
     * @return array<int, ExpenseReceipt>
     */
    public function execute(Expense $expense, array $files): array
    {
        $stored = [];

        foreach ($files as $file) {
            $location = $this->storage->store($file);

            $stored[] = $expense->receipts()->create([
                ...$location,
                'original_name' => Str::limit(basename($file->getClientOriginalName()), 180, ''),
                'mime' => $file->getMimeType() ?: 'application/octet-stream',
                'size' => $file->getSize() ?: 0,
            ]);
        }

        return $stored;
    }
}
