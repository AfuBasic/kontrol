<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int $estate_id
 * @property int|null $collection_assignment_id
 * @property int $amount
 * @property string $provider
 * @property string $reference
 * @property string $status
 * @property \Carbon\CarbonImmutable|null $paid_at
 * @property array<array-key, mixed>|null $raw_payload
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \App\Models\CollectionAssignment|null $assignment
 * @property-read \App\Models\Estate $estate
 * @property-read \App\Models\User $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereCollectionAssignmentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment wherePaidAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereProvider($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereRawPayload($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereReference($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Payment where($column, $operator = null, $value = null, $boolean = 'and')
 *
 * @mixin \Eloquent
 */
class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'estate_id',
        'collection_assignment_id',
        'amount',
        'provider',
        'reference',
        'status',
        'paid_at',
        'raw_payload',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'raw_payload' => 'array',
            'amount' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(CollectionAssignment::class, 'collection_assignment_id');
    }
}
