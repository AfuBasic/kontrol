<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A business expense. Amounts are kobo. Expenses are archived (soft deleted), never hard-deleted.
 *
 * @property int $id
 * @property CarbonImmutable $incurred_on
 * @property int $amount Kobo
 * @property int $expense_category_id
 * @property string $payee
 * @property string|null $note
 * @property string|null $original_amount_note
 */
class Expense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'incurred_on',
        'amount',
        'expense_category_id',
        'payee',
        'note',
        'original_amount_note',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'incurred_on' => 'immutable_date',
            'amount' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<ExpenseCategory, $this>
     */
    public function category(): BelongsTo
    {
        // An archived category must still name the expenses that were filed under it.
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id')->withTrashed();
    }

    /**
     * @return HasMany<ExpenseReceipt, $this>
     */
    public function receipts(): HasMany
    {
        return $this->hasMany(ExpenseReceipt::class);
    }
}
