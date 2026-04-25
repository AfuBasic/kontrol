<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Support\Facades\DB;

class Estate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'address',
        'status',
    ];

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'estate_users_membership')
            ->withPivot('status')
            ->withTimestamps();
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function hasAcceptedAdmin(): bool
    {
        return DB::table('estate_users_membership')
            ->join('model_has_roles', function ($join) {
                $join->on('estate_users_membership.user_id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('estate_users_membership.estate_id', $this->id)
            ->where('estate_users_membership.status', 'accepted')
            ->where('model_has_roles.estate_id', $this->id)
            ->where('roles.name', 'admin')
            ->exists();
    }

    /**
     * @return HasOne<EstateSettings, $this>
     */
    public function settings(): HasOne
    {
        return $this->hasOne(EstateSettings::class)->withDefault();
    }

    /**
     * @return HasOneThrough<Plan, EstateSubscription>
     */
    public function subscription(): HasOneThrough
    {
        return $this->hasOneThrough(
            Plan::class,
            EstateSubscription::class,
            'estate_id',
            'id',
            'id',
            'plan_id'
        );
    }

    /**
     * @return HasOne<EstateSubscription, $this>
     */
    public function subscriptionRecord(): HasOne
    {
        return $this->hasOne(EstateSubscription::class);
    }

    /**
     * @return HasOne<EstateInviteLink, $this>
     */
    public function inviteLink(): HasOne
    {
        return $this->hasOne(EstateInviteLink::class);
    }

    /**
     * @return HasMany<ResidentSubscription, $this>
     */
    public function residentSubscriptions(): HasMany
    {
        return $this->hasMany(ResidentSubscription::class);
    }

    /**
     * @return BelongsTo<Referrer, $this>
     */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class)->withDefault();
    }
}
