<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $phone
 * @property string|null $relationship
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmergencyContact newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmergencyContact newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmergencyContact query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmergencyContact whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmergencyContact whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmergencyContact whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmergencyContact wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmergencyContact whereRelationship($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmergencyContact whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmergencyContact whereUserId($value)
 * @mixin \Eloquent
 */
class EmergencyContact extends Model
{
    protected $guarded = [];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
