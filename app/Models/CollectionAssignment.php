<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $collection_id
 * @property int $estate_id
 * @property int $user_id
 * @property string|null $period
 * @property int $amount_due
 * @property int $amount_paid
 * @property string $status
 * @property \Carbon\CarbonImmutable $due_date
 * @property \Carbon\CarbonImmutable|null $grace_until
 * @property \Carbon\CarbonImmutable|null $paid_at
 * @property string|null $external_reference
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \App\Models\Collection $collection
 * @property-read \App\Models\Estate $estate
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Payment> $payments
 * @property-read int|null $payments_count
 * @property-read \App\Models\User $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereAmountDue($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereAmountPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereCollectionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereDueDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereExternalReference($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereGraceUntil($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment wherePaidAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment wherePeriod($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionAssignment whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CollectionAssignment where($column, $operator = null, $value = null, $boolean = 'and')
 *
 * @mixin \Eloquent
 */
class CollectionAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'collection_id',
        'estate_id',
        'user_id',
        'period',
        'amount_due',
        'amount_paid',
        'status',
        'due_date',
        'grace_until',
        'paid_at',
        'external_reference',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'grace_until' => 'date',
            'paid_at' => 'datetime',
            'amount_due' => 'integer',
            'amount_paid' => 'integer',
        ];
    }

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isOverdue(): bool
    {
        return $this->status === 'overdue';
    }
}
