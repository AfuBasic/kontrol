<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $description
 * @property string|null $website
 * @property string|null $contact_person
 * @property string|null $phone
 * @property string $commission_type percentage|fixed
 * @property numeric $commission_rate Commission percentage (0-100) or fixed amount in kobo
 * @property string $status
 * @property string|null $api_key
 * @property string|null $notes
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Collection<int, Estate> $estates
 * @property-read int|null $estates_count
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Partner active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Partner newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Partner newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Partner query()
 *
 * @mixin \Eloquent
 */
class Partner extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'website',
        'contact_person',
        'commission_type',
        'commission_rate',
        'commission_length',
        'status',
        'api_key',
        'notes',
        'bank_name',
        'bank_code',
        'account_number',
        'account_name',
        'account_verified_at',
    ];

    protected $appends = [
        'email',
        'phone',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'account_verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function hasVerifiedBankAccount(): bool
    {
        return filled($this->account_number)
            && filled($this->account_name)
            && filled($this->bank_code)
            && $this->account_verified_at !== null;
    }

    public function maskedAccountNumber(): ?string
    {
        if (! filled($this->account_number) || strlen($this->account_number) < 4) {
            return $this->account_number;
        }

        return str_repeat('*', max(strlen($this->account_number) - 4, 0)).substr($this->account_number, -4);
    }

    /**
     * @return HasMany<PartnerEarning, $this>
     */
    public function earnings(): HasMany
    {
        return $this->hasMany(PartnerEarning::class);
    }

    /**
     * @return HasMany<Estate, $this>
     */
    public function estates(): HasMany
    {
        return $this->hasMany(Estate::class);
    }

    /**
     * @return HasMany<EstateApplication, $this>
     */
    public function partnerRequests(): HasMany
    {
        return $this->hasMany(EstateApplication::class);
    }

    /**
     * @return HasMany<EstateApplication, $this>
     */
    public function estateApplications(): HasMany
    {
        return $this->hasMany(EstateApplication::class);
    }

    /**
     * @return HasMany<User, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return HasMany<CommissionableRevenue, $this>
     */
    public function commissionableRevenues(): HasMany
    {
        return $this->hasMany(CommissionableRevenue::class);
    }

    public function scopeActive(mixed $query): mixed
    {
        return $query->where('status', 'active');
    }

    public function getEmailAttribute(): ?string
    {
        return $this->members()->first()?->email;
    }

    public function getPhoneAttribute(): ?string
    {
        return $this->members()->first()?->profile?->phone;
    }

    public function generateApiKey(): string
    {
        $this->api_key = 'ptr_'.bin2hex(random_bytes(32));
        $this->save();

        return $this->api_key;
    }
}
