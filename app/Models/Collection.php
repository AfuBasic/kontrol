<?php

namespace App\Models;

use App\Traits\GeneratesUlid;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $estate_id
 * @property string $name
 * @property string|null $description
 * @property int $amount
 * @property string $billing_type
 * @property string|null $recurring_interval
 * @property CarbonImmutable $start_date
 * @property int $due_day
 * @property int $grace_days
 * @property int|null $late_fee
 * @property string $applies_to
 * @property string $status
 * @property int $created_by
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, CollectionAssignment> $assignments
 * @property-read int|null $assignments_count
 * @property-read User $creator
 * @property-read Estate $estate
 * @property-read \Illuminate\Database\Eloquent\Collection<int, CollectionTarget> $targets
 * @property-read int|null $targets_count
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereAppliesTo($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereBillingType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereCreatedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereDueDay($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereGraceDays($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereLateFee($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereRecurringInterval($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereStartDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Collection whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Collection where($column, $operator = null, $value = null, $boolean = 'and')
 *
 * @mixin \Eloquent
 */
class Collection extends Model
{
    use GeneratesUlid, HasFactory;

    protected $fillable = [
        'estate_id',
        'name',
        'description',
        'amount',
        'billing_type',
        'recurring_interval',
        'start_date',
        'due_at',
        'due_day',
        'grace_days',
        'late_fee',
        'applies_to',
        'status',
        'created_by',
        'include_creator',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_at' => 'date',
            'amount' => 'integer',
            'late_fee' => 'integer',
            'due_day' => 'integer',
            'grace_days' => 'integer',
            'include_creator' => 'boolean',
        ];
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function targets(): HasMany
    {
        return $this->hasMany(CollectionTarget::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(CollectionAssignment::class);
    }

    public function isRecurring(): bool
    {
        return $this->billing_type === 'recurring';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
