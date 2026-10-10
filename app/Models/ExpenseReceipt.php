<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $expense_id
 * @property string $path Path on the private disk
 * @property string $original_name
 * @property string $mime
 * @property int $size Bytes
 */
class ExpenseReceipt extends Model
{
    use SoftDeletes;

    public const DISK = 'local';

    protected $fillable = ['expense_id', 'path', 'original_name', 'mime', 'size'];

    /**
     * @return BelongsTo<Expense, $this>
     */
    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class)->withTrashed();
    }

    public function isPdf(): bool
    {
        return $this->mime === 'application/pdf';
    }
}
