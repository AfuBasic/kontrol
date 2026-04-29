<?php

namespace App\Models;

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
 * @property numeric $commission_rate Commission percentage (0-100)
 * @property string $status
 * @property string|null $api_key
 * @property string|null $notes
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Estate> $estates
 * @property-read int|null $estates_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereApiKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereCommissionRate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereContactPerson($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Referrer whereWebsite($value)
 * @mixin \Eloquent
 */
class Referrer extends Model
{
    use HasFactory;

    protected $table = 'referrers';

    protected $fillable = [
        'name',
        'email',
        'description',
        'website',
        'contact_person',
        'phone',
        'commission_rate',
        'status',
        'api_key',
        'notes',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * @return HasMany<Estate, $this>
     */
    public function estates(): HasMany
    {
        return $this->hasMany(Estate::class);
    }

    public function scopeActive(mixed $query): mixed
    {
        return $query->where('status', 'active');
    }

    public function generateApiKey(): string
    {
        $this->api_key = 'ref_'.bin2hex(random_bytes(32));
        $this->save();

        return $this->api_key;
    }
}
