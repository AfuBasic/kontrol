<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * @return BelongsToMany<Estate, $this>
     */
    public function estates(): BelongsToMany
    {
        return $this->belongsToMany(Estate::class, 'estate_users_membership')
            ->withPivot('status')
            ->withTimestamps();
    }

    /**
     * @return HasOne<UserProfile, $this>
     */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /**
     * Scope: Users belonging to a specific estate.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeForEstate(Builder $query, int $estateId): Builder
    {
        return $query->whereHas('estates', fn ($q) => $q->where('estates.id', $estateId));
    }

    /**
     * Scope: Users with a specific role scoped to an estate.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeWithRole(Builder $query, string $roleName, int $estateId): Builder
    {
        return $query->whereHas('roles', function ($q) use ($roleName, $estateId) {
            $q->where('name', $roleName)
                ->where('model_has_roles.estate_id', $estateId);
        });
    }

    /**
     * Scope: Users with pending invitation status.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopePendingInvitation(Builder $query): Builder
    {
        return $query->whereNull('password');
    }

    /**
     * Scope: Users who have accepted their invitation.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeAcceptedInvitation(Builder $query): Builder
    {
        return $query->whereNotNull('password');
    }
}
