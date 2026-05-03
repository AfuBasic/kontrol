<?php

namespace App\Models;
use App\Traits\GeneratesUlid;

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

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $user_type
 * @property string|null $google_id
 * @property string|null $telegram_chat_id
 * @property string|null $fcm_token
 * @property \Carbon\CarbonImmutable|null $email_verified_at
 * @property string|null $password
 * @property string|null $remember_token
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property \Carbon\CarbonImmutable|null $suspended_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\EmergencyContact> $emergencyContacts
 * @property-read int|null $emergency_contacts_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Estate> $estates
 * @property-read int|null $estates_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\HouseholdMember> $householdMembers
 * @property-read int|null $household_members_count
 * @property-read \App\Models\HouseholdMember|null $householdOf
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Spatie\Permission\Models\Permission> $permissions
 * @property-read int|null $permissions_count
 * @property-read \App\Models\UserProfile|null $profile
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \NotificationChannels\WebPush\PushSubscription> $pushSubscriptions
 * @property-read int|null $push_subscriptions_count
 * @property-read \App\Models\ResidentSubscription|null $residentSubscription
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Spatie\Permission\Models\Role> $roles
 * @property-read int|null $roles_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\SosEvent> $sosEvents
 * @property-read int|null $sos_events_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\TrustedDevice> $trustedDevices
 * @property-read int|null $trusted_devices_count
 *
 * @method static Builder<static>|User acceptedInvitation()
 * @method static Builder<static>|User active()
 * @method static Builder<static>|User affiliates()
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static Builder<static>|User forEstate(int $estateId)
 * @method static Builder<static>|User newModelQuery()
 * @method static Builder<static>|User newQuery()
 * @method static Builder<static>|User pendingInvitation()
 * @method static Builder<static>|User permission($permissions, $without = false)
 * @method static Builder<static>|User query()
 * @method static Builder<static>|User regularUsers()
 * @method static Builder<static>|User role($roles, $guard = null, $without = false)
 * @method static Builder<static>|User suspended()
 * @method static Builder<static>|User whereCreatedAt($value)
 * @method static Builder<static>|User whereEmail($value)
 * @method static Builder<static>|User whereEmailVerifiedAt($value)
 * @method static Builder<static>|User whereFcmToken($value)
 * @method static Builder<static>|User whereGoogleId($value)
 * @method static Builder<static>|User whereId($value)
 * @method static Builder<static>|User whereName($value)
 * @method static Builder<static>|User wherePassword($value)
 * @method static Builder<static>|User whereRememberToken($value)
 * @method static Builder<static>|User whereSuspendedAt($value)
 * @method static Builder<static>|User whereTelegramChatId($value)
 * @method static Builder<static>|User whereUpdatedAt($value)
 * @method static Builder<static>|User whereUserType($value)
 * @method static Builder<static>|User withRole(string $roleName, ?int $estateId)
 * @method static Builder<static>|User withTelegram()
 * @method static Builder<static>|User withoutPermission($permissions)
 * @method static Builder<static>|User withoutRole($roles, $guard = null)
 *
 * @mixin \Eloquent
 */
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasPushSubscriptions, HasRoles, Notifiable, GeneratesUlid;

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('ulid', $value)
            ->orWhere('id', $value)
            ->firstOrFail();
    }

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
        'email_verified_at',
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
     * @return HasOne<ResidentSubscription, $this>
     */
    public function residentSubscription(): HasOne
    {
        return $this->hasOne(ResidentSubscription::class);
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
     * Get all user IDs associated with this user's household (Primary + Members).
     *
     * @return array<int>
     */
    public function getHouseholdUserIds(): array
    {
        if ($this->isHouseholdMember()) {
            $household = $this->householdOf;
            if (! $household) {
                return [$this->id];
            }

            $primaryId = $household->primary_resident_id;
            $memberIds = HouseholdMember::where('primary_resident_id', $primaryId)
                ->pluck('household_member_id')
                ->toArray();

            return array_unique(array_merge([$primaryId], $memberIds));
        }

        $memberIds = $this->householdMembers()
            ->pluck('household_member_id')
            ->toArray();

        return array_unique(array_merge([$this->id], $memberIds));
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
        return $query->whereExists(function ($query) use ($roleName, $estateId) {
            $query->select(\Illuminate\Support\Facades\DB::raw(1))
                ->from('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->whereColumn('model_has_roles.model_id', 'users.id')
                ->where('model_has_roles.model_type', User::class)
                ->where('roles.name', $roleName)
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

    /**
     * Check if the user has a payment method (authorization code) on file.
     */
    public function hasPaymentMethod(): bool
    {
        return $this->residentSubscription()->whereNotNull('paystack_authorization_code')->exists();
    }

    /**
     * @return HasMany<EmergencyContact, $this>
     */
    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmergencyContact::class);
    }

    /**
     * @return HasMany<SosEvent, $this>
     */
    public function sosEvents(): HasMany
    {
        return $this->hasMany(SosEvent::class);
    }

    /**
     * @return HasMany<CollectionAssignment, $this>
     */
    public function collectionAssignments(): HasMany
    {
        return $this->hasMany(CollectionAssignment::class);
    }
}
