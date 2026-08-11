<?php

namespace App\Models;

use App\Traits\ZoneScoped;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int $estate_id
 * @property CarbonImmutable $triggered_at
 * @property string $status
 * @property CarbonImmutable|null $acknowledged_at
 * @property int|null $acknowledged_by
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User|null $acknowledgedBy
 * @property-read Estate $estate
 * @property-read User $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent whereAcknowledgedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent whereAcknowledgedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent whereTriggeredAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SosEvent whereUserId($value)
 *
 * @mixin \Eloquent
 */
class SosEvent extends Model
{
    use ZoneScoped;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'triggered_at' => 'datetime',
            'acknowledged_at' => 'datetime',
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

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }
}
