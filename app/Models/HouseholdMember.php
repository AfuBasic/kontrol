<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
