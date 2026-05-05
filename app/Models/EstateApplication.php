<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $estate_name
 * @property string $email
 * @property string|null $address
 * @property string $phone
 * @property string|null $notes
 * @property string $status
 * @property \Carbon\CarbonImmutable|null $reviewed_at
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property int|null $plan_id
 * @property-read \App\Models\Plan|null $plan
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication whereAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication whereEstateName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication wherePlanId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication whereReviewedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateApplication whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class EstateApplication extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'estate_name',
        'email',
        'address',
        'phone',
        'notes',
        'plan_id',
        'status',
        'reviewed_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Check if the application is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Mark as contacted.
     */
    public function markAsContacted(): void
    {
        $this->update([
            'status' => 'contacted',
            'reviewed_at' => now(),
        ]);
    }

    /**
     * Mark as approved.
     */
    public function markAsApproved(): void
    {
        $this->update([
            'status' => 'approved',
            'reviewed_at' => now(),
        ]);
    }

    /**
     * Mark as rejected.
     */
    public function markAsRejected(): void
    {
        $this->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
        ]);
    }
}
