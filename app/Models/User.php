<?php

namespace App\Models;

use App\Mail\Auth\PasswordResetMail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use NotificationChannels\WebPush\HasPushSubscriptions;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasPushSubscriptions, HasRoles, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'user_type',
        'password',
        'suspended_at',
        'google_id',
        'telegram_chat_id',
        'fcm_token',
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
            'suspended_at' => 'datetime',
            'password' => 'hashed',
            'user_type' => 'string',
        ];
    }

    /**
     * @return HasMany<TrustedDevice, $this>
     */
    public function trustedDevices(): HasMany
    {
        return $this->hasMany(TrustedDevice::class);
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
     * Household members where this user is the primary resident (head).
     *
     * @return HasMany<HouseholdMember, $this>
     */
    public function householdMembers(): HasMany
    {
        return $this->hasMany(HouseholdMember::class, 'primary_resident_id');
    }

    /**
     * The household record if this user is a household member.
     *
     * @return HasOne<HouseholdMember, $this>
     */
    public function householdOf(): HasOne
    {
        return $this->hasOne(HouseholdMember::class, 'household_member_id');
    }

    /**
     * Check if this user is a household member (not a primary resident).
     */
    public function isHouseholdMember(): bool
    {
        return $this->hasRole('household_member');
    }

    /**
     * Check if this user is a primary resident (not a household member).
     */
    public function isPrimaryResident(): bool
    {
        return $this->hasRole('resident') && ! $this->hasRole('household_member');
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
    public function scopeWithRole(Builder $query, string $roleName, ?int $estateId): Builder
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

    /**
     * Scope: Users who are suspended.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeSuspended(Builder $query): Builder
    {
        return $query->whereNotNull('suspended_at');
    }

    /**
     * Scope: Users who are active (not suspended).
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('suspended_at');
    }

    /**
     * Scope: Users with affiliate type.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeAffiliates(Builder $query): Builder
    {
        return $query->where('user_type', 'affiliate');
    }

    /**
     * Scope: Users with regular user type.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeRegularUsers(Builder $query): Builder
    {
        return $query->where('user_type', 'user');
    }

    /**
     * Get the current active estate for the user.
     */
    public function getCurrentEstate(): Estate
    {
        return $this->estates()
            ->wherePivot('status', 'accepted')
            ->firstOrFail();
    }

    /**
     * Get the ID of the current active estate.
     */
    public function getCurrentEstateId(): int
    {
        return $this->getCurrentEstate()->id;
    }

    /**
     * Check if user has Telegram linked.
     */
    public function hasTelegramLinked(): bool
    {
        return $this->telegram_chat_id !== null;
    }

    /**
     * Scope: Users with Telegram linked.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeWithTelegram(Builder $query): Builder
    {
        return $query->whereNotNull('telegram_chat_id');
    }

    /**
     * Find user by Telegram chat ID.
     */
    public static function findByTelegramChatId(string $chatId): ?self
    {
        return self::where('telegram_chat_id', $chatId)->first();
    }

    /**
     * Route notifications for the Telegram channel.
     */
    public function routeNotificationForTelegram(): ?string
    {
        return $this->telegram_chat_id;
    }

    /**
     * Send the password reset notification using a custom mailable.
     */
    public function sendPasswordResetNotification($token): void
    {
        $appDomain = config('domains.app');
        $scheme = app()->environment('local') ? 'http' : 'https';

        URL::forceRootUrl("{$scheme}://{$appDomain}");

        $resetUrl = url(route('password.reset', [
            'token' => $token,
            'email' => $this->email,
        ], false));

        URL::forceRootUrl(null);

        Mail::to($this->email)->send(new PasswordResetMail($this, $resetUrl));
    }

    /**
     * Route notifications for the FCM channel.
     */
    public function routeNotificationForFcm(): ?string
    {
        return $this->fcm_token;
    }
}
