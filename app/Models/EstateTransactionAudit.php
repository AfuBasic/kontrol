<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $estate_transaction_id
 * @property int|null $user_id
 * @property string $action
 * @property string|null $reason
 * @property array<array-key, mixed>|null $previous_values
 * @property array<array-key, mixed>|null $current_values
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
class EstateTransactionAudit extends Model
{
    protected $fillable = [
        'estate_transaction_id',
        'user_id',
        'action',
        'reason',
        'previous_values',
        'current_values',
    ];

    protected function casts(): array
    {
        return [
            'previous_values' => 'array',
            'current_values' => 'array',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(EstateTransaction::class, 'estate_transaction_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
