<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $expense_id
 * @property string $path Where the file is on its disk (the public id for Cloudinary)
 * @property string $disk The disk it was saved on
 * @property string|null $resource_type Cloudinary only: image or raw
 * @property string $original_name
 * @property string $mime
 * @property int $size Bytes
 */
class ExpenseReceipt extends Model
{
    use SoftDeletes;

    protected $fillable = ['expense_id', 'path', 'disk', 'resource_type', 'original_name', 'mime', 'size'];

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
