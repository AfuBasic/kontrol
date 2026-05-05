<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $estate_id
 * @property int $primary_resident_id
 * @property int $household_member_id
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \App\Models\Estate $estate
 * @property-read \App\Models\User $member
 * @property-read \App\Models\User $primaryResident
 *
 * @method static \Database\Factories\HouseholdMemberFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|HouseholdMember newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|HouseholdMember newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|HouseholdMember query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|HouseholdMember whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|HouseholdMember whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|HouseholdMember whereHouseholdMemberId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|HouseholdMember whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|HouseholdMember wherePrimaryResidentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|HouseholdMember whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class HouseholdMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'estate_id',
        'primary_resident_id',
        'household_member_id',
    ];

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    /**
     * The primary resident (head of household).
     *
     * @return BelongsTo<User, $this>
     */
    public function primaryResident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'primary_resident_id');
    }

    /**
     * The household member user.
     *
     * @return BelongsTo<User, $this>
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'household_member_id');
    }
}
