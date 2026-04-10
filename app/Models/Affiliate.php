<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Affiliate extends Model
{
    use HasFactory;

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
        $this->api_key = 'affl_'.bin2hex(random_bytes(32));
        $this->save();

        return $this->api_key;
    }
}
